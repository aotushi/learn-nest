# Development Workflow

## Daily Start

```bash
git status --short --branch
pnpm install
pnpm start:dev
```

If port `3000` is already in use, follow `docs/troubleshooting.md`.

## Lesson Work

Use this loop for each lesson:

1. Read the lesson and identify the core concept.
2. Update or create the lesson note in `docs/lessons/`.
3. Apply the exercise to the current app under `src/`.
4. Test the behavior manually with browser, PowerShell, or a small frontend page.
5. Keep generated local artifacts out of git.

## Verification

Before committing a lesson, stop any running `nest start --watch` process, then run:

```bash
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

On Windows, a running watcher can keep files under `dist/` open and make `pnpm build` fail while cleaning the output directory.

## Commit and Tag

Use one commit per completed lesson or meaningful milestone.

Example:

```bash
git add .
git commit -m "lesson 05: practice http data transfer"
git tag -a lesson-05-http-data-transfer -m "Lesson 05: practice HTTP data transfer"
git push origin main
git push origin lesson-05-http-data-transfer
```

## What Not To Commit

- `node_modules/`
- `dist/`
- `coverage/`
- `.raw-data/`
- `uploads/`
- `.env`
- local server logs
- paid course raw content or screenshots

## VS Code

Use the workspace TypeScript version:

```text
TypeScript: Select TypeScript Version
Use Workspace Version
```

The project also includes `.vscode/settings.json` to point VS Code at `node_modules/typescript/lib`.

The expected setting is:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib"
}
```
