# Rally for iPhone

Rally bundles the existing canvas game into an iOS 17+ app. Practice runs without internet. Friend and ranked matches use the existing Rally backend through an allowlisted native HTTPS bridge. Game changes ship as a new app build; this app does not download executable game updates from the website. Native sharing, clipboard, safe-area layout, swing haptics, and app background handling are included.

## What works without an Apple membership or personal Mac

The **Build Rally for iPhone** GitHub Actions workflow exports the current game, generates its icon, runs bridge tests, and compiles an unsigned iPhone Simulator app on GitHub's macOS runner. It runs on matching pushes and pull requests; it also has a manual Run workflow button. Download its `Rally-iPhone-Simulator` artifact after a successful run. This artifact is for Simulator and cannot be installed on an iPhone or sent through TestFlight.

## Your next step

Enroll using the Apple Developer app on your iPhone: https://developer.apple.com/programs/enroll/ . Apple handles verification, terms, and the membership purchase. Do not send your Apple password, certificate password, private keys, or verification codes in chat.

After enrollment we must configure signing, create an App Store Connect app record, and test on physical iPhones. No personal Mac is required for the build pipeline; creating signing assets can use an OpenSSL certificate request and Apple's developer portal. We can guide that step after enrollment. No certificates or API keys are included in this repository.

## Signing configuration after enrollment

The provisional bundle ID is `net.dubduber.rallytennis`; register it with Apple or choose another unique ID. Set these in repository Settings → Secrets and variables → Actions:

| Kind | Name | Value |
| --- | --- | --- |
| Variable | `APPLE_TEAM_ID` | Your Apple Developer team ID |
| Variable | `RALLY_BUNDLE_ID` | Registered bundle ID; defaults to `net.dubduber.rallytennis` |
| Secret | `APPLE_CERTIFICATE_P12_BASE64` | Base64 of an Apple Distribution certificate plus its private key in a .p12 |
| Secret | `APPLE_CERTIFICATE_PASSWORD` | Password protecting the .p12 |
| Secret | `APPLE_PROFILE_BASE64` | Base64 of the matching App Store distribution provisioning profile |
| Variable | `APPSTORE_ISSUER_ID` | Team App Store Connect API key issuer ID |
| Variable | `APPSTORE_API_KEY_ID` | App Store Connect API key ID |
| Secret | `APPSTORE_API_PRIVATE_KEY` | Complete .p8 private key text |

Create an App Store Connect app record with the same bundle ID before uploading. Use a team API key with the minimum role needed for uploads. Run **Prepare or upload Rally TestFlight build** on main. Leave Upload unchecked to create a signed IPA for inspection; check it to upload to App Store Connect. This workflow does not submit to App Review or publish on the App Store, and does not assign tester groups. TestFlight processing, export compliance, beta metadata and any required beta review remain in App Store Connect.

## Build locally on a Mac, if available

From the repository root:

```sh
node scripts/prepare-ios.mjs
swift ios/make-icon.swift ios/Rally/Assets.xcassets/AppIcon.appiconset/AppIcon.png
xcodebuild -project ios/Rally.xcodeproj -scheme Rally -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' -derivedDataPath ios/build CODE_SIGNING_ALLOWED=NO build
```

Generated `game.html`, icon PNG, builds, certificates, profiles and private keys are ignored by Git. The tracked source of the game remains `worker/index.js`.

## Required before public release

- Real iPhone tests: offline launch/practice, charged shots, grass/hard/clay, both orientations, shared invite links opened in the browser, room-code join inside the app, background/foreground, ranked results, and WebRTC plus server fallback on separate networks. Browser invite links currently open the website; in-app joins use room codes. No universal links or iMessage extension are included.
- Confirm token/rank persistence on device. Ranks are installation-specific, with no cross-device account recovery. Consider an account recovery design before marketing persistent rankings.
- Multiplayer currently uses an HTTPS polling fallback, which can have more latency than a direct WebRTC connection. Test transnational play before describing latency in marketing.
- Owner-approved privacy policy and support pages, an actual support contact, screenshots from a signed device/Simulator build, final icon/name, age rating and App Store metadata.
- Audit collection and retention against both app privacy answers and `PrivacyInfo.xcprivacy`. Current implementation stores anonymous identifiers, chosen display names, ratings, match results and temporary relay/signaling data. Hosting providers may also retain request logs, including IP addresses. Do not claim “no data collected” without verifying those services.
- Complete Apple's encryption/export-compliance questions based on the shipped WebRTC and HTTPS implementation. No answer is preselected in the app metadata.
- Approval under App Review is not guaranteed. This is a playable bundled game, not a browser pointed at the hosted website, but the release still needs polish and on-device validation.

Apple references: https://developer.apple.com/testflight/ and https://developer.apple.com/app-store/review/guidelines/ .
