# Publish Kaffe for testing

## Status (2026-09-15)

- 11 model tests pass.
- Chromium and mobile-sized WebKit pass logging, editing, undo, search, history, sleep settings, blends, reload persistence, automated accessibility checks, and overflow checks at seven widths (320–1440px).
- Chromium passes offline reload and offline logging; legacy migration passes.
- **Safari offline reload is not verified:** Playwright WebKit returned an internal navigation error. That portion is explicitly excluded for WebKit, not treated as a pass. Test on a real iPhone before accepting the PWA.
- Azure deployment and Linux CI have not been executed locally. No push or deployment was performed.

## Local preview

Use Node.js 22+ and run from the repository root:

```sh
npm ci
npx playwright install chromium webkit
npm test
npm run test:browser
npm start
```

Open http://127.0.0.1:4173. Screenshots are in ignored `test-results/`.

`npm run package:site` creates `dist/` with only ten allowlisted public files. It copies assets, without compiling or bundling. Never deploy the repository root: local configuration and tooling do not belong on the web.

## Publish an isolated Azure preview (not production)

1. Confirm the existing Azure Static Web App is linked to this GitHub repository and permits PR preview environments. No new Azure resource is required.
2. In GitHub → Settings → Secrets and variables → Actions, verify `AZURE_STATIC_WEB_APPS_API_TOKEN` is the deployment token for that app. Do not put it in source code. GitHub supplies `GITHUB_TOKEN` automatically.
3. Review the changes, then create a branch and commit from the repository root:

   ```sh
   git switch -c testing/kaffe-v2
   git add .github/workflows/azure-static-web-apps.yml .gitignore index.html icon.svg manifest.json sw.js app.js pour.js data.js model.js styles.css package.json package-lock.json scripts tests staticwebapp.config.json TESTING.md
   git diff --cached --stat
   git diff --cached --check
   git commit -m "Prepare Kaffe v2 testing preview" -m "Generated with [Continue](https://continue.dev)" -m "Co-Authored-By: Continue <noreply@continue.dev>"
   git push -u origin testing/kaffe-v2
   ```

4. Open a pull request from this branch into `main` in the **same repository**. Leave it unmerged during testing. The workflow runs tests, packages the site, then creates an isolated Azure PR preview. Fork PRs run tests only.
5. Wait for all workflow jobs to succeed. Use the preview URL from the Azure deploy output/PR comment or Azure → Environments. Share that URL with testers; it is not an authentication boundary and may be publicly accessible.
6. Closing the PR removes its preview. **Merging into `main` deploys production.** Do not merge until testing is accepted. Consider requiring the `test` status check in branch protection.

The workflow retains site and screenshot artifacts for seven days. Existing GitHub Actions/Azure usage limits still apply.

## Tester checklist

- [ ] On desktop Chrome and a real iPhone/Safari, log a drink at 1.5×, log water, edit its time/date, delete and undo.
- [ ] Check yesterday in History and switch Week/Month.
- [ ] Change bedtime and half-life; reload and verify settings persist.
- [ ] Make and log a Latte in Blend Lab; try recipes and the six-layer limit.
- [ ] Switch light/dark themes; check readability, keyboard navigation and dialogs.
- [ ] Export a journal backup and check that its JSON contains the expected entries.
- [ ] On iPhone, add to Home Screen and inspect icon/standalone layout. The current SVG-only icon may need a PNG fallback for some devices.
- [ ] Open the preview online first, allow offline setup, then enable airplane mode and reload/reopen. Log water offline, return online and verify it persists. Safari offline is a required manual check.
- [ ] After a preview update, close/reopen or reload again and confirm the new UI appears without losing journal entries.

Data is stored only in that browser on that exact origin. Preview, production, localhost and other devices have separate journals. Clearing site data deletes the local journal. Export is available, but there is no import/restore UI or cloud sync yet; use disposable testing data. Caffeine forecasts are estimates, not medical guidance.

## Credentials and updates

The ignored `.continue/agents/new-config.yaml` now references `${{ secrets.OPENROUTER_API_KEY }}` instead of embedding a key. Revoke the previously exposed key in OpenRouter and configure a replacement through Continue's secret mechanism before starting a new session. Do not paste the replacement into chat or commit it. This credential is for the development assistant, not the Kaffe app; rotation has not been performed automatically.

The service-worker cache is `kaffe-journal-v15`. Increment it in `sw.js` whenever public app files change, then rerun tests and packaging. Azure headers request HTTP revalidation; service-worker caching still provides offline use.
