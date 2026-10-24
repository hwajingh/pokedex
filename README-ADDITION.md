## Run it

```bash
npm install
npm start    # local dev server
npm test     # tests, non-interactive: CI=true npm test -- --watchAll=false
npm run build
```

Note: after the package.json dependency cleanup in this change set, run
`npm install` once to regenerate `package-lock.json` and commit it, so that
`npm ci` in CI matches the updated package.json.
