# Repository Structure

This repository uses a "current app + lesson notes + git history" structure.

## Principle

`src/` always represents the latest runnable Nest application.

Do not create lesson folders inside `src/` for historical code snapshots, such as:

```text
src/lesson-04/
src/lesson-05/
src/lesson-06/
```

That shape makes Nest modules, imports, tests, linting, and builds harder to keep clean.

## Recommended Layout

```text
learn-nest/
  src/
    app.module.ts
    main.ts
    cats/
      cats.controller.ts
      cats.service.ts
      cats.module.ts

  docs/
    course-map.md
    learning-log.md
    repository-structure.md
    lessons/
      04-nest-cli.md
      05-http-data-transfer.md

  examples/
    lessons/
      04-nest-cli/
        README.md

  test/
  package.json
```

## What Goes Where

### `src/`

Use this for the latest project code only.

As the course moves forward, update this app in place. The app should remain buildable and runnable after each lesson.

### `docs/lessons/`

Use one markdown file per lesson.

Each lesson note should include:

- Goal
- Commands used
- Files changed
- Concepts learned
- Problems encountered
- Verification result
- Next step

Do not copy course text. Write your own summary.

### `examples/lessons/`

Use this only when a lesson has small isolated code worth preserving outside the main app.

Examples:

- CLI dry-run output summary
- a minimal decorator demo
- a small standalone TypeScript experiment

Avoid duplicating the whole project here.

### Git Commits and Tags

Use git history as the real lesson snapshot system.

Recommended commit style:

```bash
git add .
git commit -m "lesson 04: practice nest cli"
git tag lesson-04-nest-cli
```

To revisit old code:

```bash
git show lesson-04-nest-cli
git checkout lesson-04-nest-cli
```

Create a tag after each meaningful lesson or milestone, not after every tiny edit.

## Decision

For this repository:

- `src/` stores the newest course project code.
- `docs/` stores learning notes and course summaries.
- `examples/` stores optional isolated experiments.
- git commits/tags preserve previous lesson code states.

This keeps the project useful as a real Nest app while still preserving the learning path.
