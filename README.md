# Rally Tennis

A browser tennis game with computer practice, direct WebRTC friend matches with an automatic server fallback, four-letter room codes, touch controls, and Elo ranked matchmaking.

Live game: https://rally-tennis.dubduber.chatgpt.site/

## Run locally

Install Node.js 24 or later, then:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The local preview uses an in-memory SQLite database and a mock R2 store; restarting clears local profiles, rooms, and rankings. Hosted rankings and room signaling use Cloudflare D1 and R2.

## Check changes

```sh
npm test
npm run build
```

Pull requests run these checks automatically.

## Where to edit

- `worker/index.js`: gameplay, the embedded HTML interface, WebRTC networking, ranked APIs, and room APIs. The `HTML` constant at the top contains the page; the remaining code runs on the server.
- `db/schema.ts`: ranked and relay database schema.
- `drizzle/`: generated migrations and schema history. Preserve previously deployed migrations.
- `scripts/preview.mjs`: local development server.
- `tests/ranked.mjs`: matchmaking, rating, room ownership, cancellation, and forfeit checks.
- `.openai/hosting.json`: identity and bindings for the existing hosted game. Preserve its project ID.

After changing the database schema, run `npm run db:generate` and include the generated migration files in the pull request.

## Work together

Use separate branches and pull requests. Follow [CONTRIBUTING.md](CONTRIBUTING.md) for the shared workflow. Repository access and the live game's audience are separate settings.

## Publish

The current game is hosted through ChatGPT Sites. GitHub pushes and merges do not automatically deploy this Site. After a pull request is merged, ask Codex to apply the merged source to this existing Site and publish it. Keep its existing Site identity and production database bindings. Never commit passwords, access tokens, or database exports.

Multiplayer tries WebRTC first and switches both players to authenticated HTTPS exchanges if connecting or recovery takes eight seconds. The fallback prioritizes connectivity and can have more latency than a successful direct connection. Room tokens persist in session storage so a guest can refresh and rejoin the same occupied seat.

## Court surfaces

Choose Clay, Grass, or Hard before starting a match. Clay keeps the original bounce. Grass retains up to 3% more horizontal pace with a 6% lower vertical rebound; hard retains up to 1.5% more pace with a 2% lower rebound. Horizontal retention is capped below 100%. Launch, controls, and movement stay the same. The host’s surface travels in the authoritative match snapshot, so both players see and play the same court; surface selection is locked during multiplayer.

## iPhone app

The bundled iOS app and cloud build/signing setup are in [ios/README.md](ios/README.md). The unsigned Simulator build works without Apple enrollment; TestFlight requires membership and signing configuration.

## Desktop controls

Left-click the court for backhand; right-click for forehand. Hold either mouse button and release for topspin. Move and aim with WASD or arrow keys. Space (or Z) drops, X lobs, Q/E play backhand/forehand, F uses the selected stroke, and B switches stroke. Open **Customize controls** to change mouse actions or shot keys; settings are saved in this browser. Conflicting shot keys swap assignments, while movement keys remain reserved. Touch joystick and shot buttons keep their existing behavior.

## Rackets

Choose a racket before a match. Press Ready after choosing your racket. Practice starts only after you ready up; multiplayer waits for both players. While waiting, Unready lets you change rackets. Once both players are ready, choices stay fixed for that match, including breaks, faults and new sets. A new match opens a fresh ready-up lobby.

- **Drive (amber):** 10% stronger forehand and serve, 12% slower backhand, and an extra 15% pace penalty when returning a serve. Ordinary drops and less spin than Spin.
- **Spin (pale green):** heavy charged topspin from forehand and backhand, a normal serve, and drops that land deeper and bounce higher.
- **Touch (teal):** softer, shorter drops with normal forehand, backhand and serve pace. Less charged spin than Spin.

The three options are unlocked and saved locally. Racket frames and grips match their picker colors. Practice waits for the Ready button so the bot cannot start before you choose a racket.

## Held lobs

Tap Lob (or its assigned key/mouse button) for the original trajectory. Hold and release for a higher, deeper lob, reaching full charge at about 0.8 seconds. A full charge adds up to 2.2 m of depth while capping the charged landing target near the baseline. The lob button fills during charging and shows LOB + when ready. Switching shots, losing focus, or changing points cancels an unfinished hold.

## Mobile joystick

The mobile joystick now scales from 132 to 164 px, with a larger center grip and movement travel that fits inside the pad. Smaller phones use a narrower shot pad to keep the two thumb controls side by side.
