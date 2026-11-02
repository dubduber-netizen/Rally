#!/bin/bash
set -euo pipefail
for name in APPLE_TEAM_ID APPLE_CERTIFICATE_P12_BASE64 APPLE_CERTIFICATE_PASSWORD APPLE_PROFILE_BASE64; do
  if [ -z "${!name:-}" ]; then echo "Missing signing setting: $name. Complete Apple Developer enrollment and GitHub signing setup first."; exit 1; fi
done
RALLY_KEYCHAIN="$RUNNER_TEMP/rally-signing.keychain-db"
RALLY_KEYCHAIN_PASSWORD=$(openssl rand -hex 24)
export RALLY_KEYCHAIN
cleanup() { security delete-keychain "$RALLY_KEYCHAIN" >/dev/null 2>&1 || true; rm -f "$RUNNER_TEMP/rally.p12" "$RUNNER_TEMP/rally.mobileprovision" "$RUNNER_TEMP/profile.plist"; }
trap cleanup EXIT
python3 - <<'PY'
import os,base64
from pathlib import Path
p=Path(os.environ['RUNNER_TEMP'])
for key,file in [('APPLE_CERTIFICATE_P12_BASE64','rally.p12'),('APPLE_PROFILE_BASE64','rally.mobileprovision')]:
 (p/file).write_bytes(base64.b64decode(os.environ[key]))
PY
security create-keychain -p "$RALLY_KEYCHAIN_PASSWORD" "$RALLY_KEYCHAIN"
security set-keychain-settings -lut 21600 "$RALLY_KEYCHAIN"
security unlock-keychain -p "$RALLY_KEYCHAIN_PASSWORD" "$RALLY_KEYCHAIN"
security import "$RUNNER_TEMP/rally.p12" -P "$APPLE_CERTIFICATE_PASSWORD" -A -t cert -f pkcs12 -k "$RALLY_KEYCHAIN"
security set-key-partition-list -S apple-tool:,apple: -k "$RALLY_KEYCHAIN_PASSWORD" "$RALLY_KEYCHAIN" >/dev/null
security list-keychains -d user -s "$RALLY_KEYCHAIN"
security cms -D -i "$RUNNER_TEMP/rally.mobileprovision" > "$RUNNER_TEMP/profile.plist"
python3 - <<'PY'
import os,plistlib,shutil
from pathlib import Path
p=Path(os.environ['RUNNER_TEMP']);profile=plistlib.loads((p/'profile.plist').read_bytes());bundle=os.environ.get('RALLY_BUNDLE_ID') or 'net.dubduber.rallytennis';team=os.environ['APPLE_TEAM_ID']
assert profile['TeamIdentifier'][0]==team,'Provisioning profile belongs to a different team'
assert profile['Entitlements']['application-identifier']==team+'.'+bundle,'Provisioning profile must match Rally bundle ID'
assert not profile.get('ProvisionedDevices') and not profile.get('ProvisionsAllDevices'),'Use an App Store distribution profile'
for parent in [Path.home()/'Library/MobileDevice/Provisioning Profiles',Path.home()/'Library/Developer/Xcode/UserData/Provisioning Profiles']:
 parent.mkdir(parents=True,exist_ok=True);shutil.copy(p/'rally.mobileprovision',parent/(profile['UUID']+'.mobileprovision'))
(p/'ExportOptions.plist').write_bytes(plistlib.dumps({'method':'app-store-connect','teamID':team,'signingStyle':'manual','signingCertificate':'Apple Distribution','provisioningProfiles':{bundle:profile['Name']},'uploadSymbols':True,'manageAppVersionAndBuildNumber':False}))
with open(os.environ['GITHUB_ENV'],'a') as f:f.write('RALLY_PROFILE_NAME='+profile['Name']+'\n')
(p/'profile-name').write_text(profile['Name'])
PY
RALLY_PROFILE_NAME=$(cat "$RUNNER_TEMP/profile-name")
node scripts/prepare-ios.mjs
swift ios/make-icon.swift ios/Rally/Assets.xcassets/AppIcon.appiconset/AppIcon.png
xcodebuild -project ios/Rally.xcodeproj -scheme Rally -configuration Release -destination 'generic/platform=iOS' -archivePath ios/build/Rally.xcarchive DEVELOPMENT_TEAM="$APPLE_TEAM_ID" PRODUCT_BUNDLE_IDENTIFIER="${RALLY_BUNDLE_ID:-net.dubduber.rallytennis}" CURRENT_PROJECT_VERSION="$GITHUB_RUN_NUMBER" CODE_SIGN_IDENTITY='Apple Distribution' PROVISIONING_PROFILE_SPECIFIER="$RALLY_PROFILE_NAME" OTHER_CODE_SIGN_FLAGS="--keychain $RALLY_KEYCHAIN" archive
xcodebuild -exportArchive -archivePath ios/build/Rally.xcarchive -exportOptionsPlist "$RUNNER_TEMP/ExportOptions.plist" -exportPath ios/build/export
