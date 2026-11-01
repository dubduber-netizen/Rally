# Rally Tennis

A browser tennis game with computer practice, direct WebRTC friend matches, four-letter room codes, touch controls, and Elo ranked matchmaking.

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
- `db/schema.ts`: ranked database schema.
- `drizzle/`: generated migrations and schema history. Preserve previously deployed migrations.
- `scripts/preview.mjs`: local development server.
- `tests/ranked.mjs`: matchmaking, rating, room ownership, cancellation, and forfeit checks.
- `.openai/hosting.json`: identity and bindings for the existing hosted game. Preserve its project ID.

After changing the database schema, run `npm run db:generate` and include the generated migration files in the pull request.

## Work together

Use separate branches and pull requests. Follow [CONTRIBUTING.md](CONTRIBUTING.md) for the shared workflow. Repository access and the live game's audience are separate settings.

## Publish

The current game is hosted through ChatGPT Sites. GitHub pushes and merges do not automatically deploy this Site. After a pull request is merged, ask Codex to apply the merged source to this existing Site and publish it. Keep its existing Site identity and production database bindings. Never commit passwords, access tokens, or database exports.
