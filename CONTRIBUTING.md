# Contributing to Rally Tennis

1. Clone the shared repository and run `npm ci` with Node.js 24 or later.
2. Update your local `main` branch, then create a branch for your change:

   ```sh
   git switch main
   git pull
   git switch -c improve-touch-controls
   ```

3. Make your change and run `npm test` and `npm run build`.
4. Try the game locally with `npm run dev`. Check portrait touch controls for interface changes. For networking changes, test two separate devices and check both host and guest behavior.
5. Commit, push your branch, and open a pull request into `main`.
6. Ask the other person to review it before merging. Keep each pull request focused so changes are easy to combine.
7. After merging, deploy the accepted source to the existing ChatGPT Site. A GitHub merge alone does not update the live game.

Avoid editing `dist/` or committing `node_modules/`; these are generated. Keep `package-lock.json` committed. Do not rewrite existing database migrations or replace the existing Site project ID. Browser storage contains the player's ranked identity; clearing it creates a new player.
