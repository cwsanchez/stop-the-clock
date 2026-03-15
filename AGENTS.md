## Cursor Cloud specific instructions

This is a **Create React App** project ("Stop the Clock!" game) — a single-service, client-only React 18 SPA with no backend.

### Running the app

- **Dev server:** `npm start` (port 3000). See `README.md` for full script list.
- **Build:** `npm run build`
- **Tests:** `CI=true npm test` (use `CI=true` to avoid Jest interactive watch mode)

### Caveats

- **No standalone ESLint config:** CRA embeds ESLint in `react-scripts`. Lint errors surface during `npm start` / `npm run build`. There is no separate `npm run lint` script.
- **Pre-existing test failure:** `src/components/App/App.test.js` is the default CRA boilerplate test that looks for "learn react" text, which does not exist in the actual `App` component. This test was never updated for the game and will fail. This is a known issue in the repo, not an environment problem.
- **Babel warning:** You may see a warning about `@babel/plugin-proposal-private-property-in-object` — this is a known CRA deprecation issue and does not affect functionality.
