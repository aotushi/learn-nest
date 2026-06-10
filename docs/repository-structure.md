# Repository Structure

This repository uses a "lesson project directories + lesson notes + git history" structure.

## Principle

Each lesson project directory is an independent runnable project.

Do not create lesson folders inside a project's `src/` for historical code snapshots, such as:

```text
L7/my-app/src/lesson-04/
L7/my-app/src/lesson-05/
L7/my-app/src/lesson-06/
```

That shape makes Nest modules, imports, tests, linting, and builds harder to keep clean.

## Recommended Layout

```text
learn-nest/
  L4-L6/
    package.json
    src/
    test/

  L7/
    index.js
    my-app/
      package.json
      src/
      test/

  docs/
    course-map.md
    learning-log.md
    repository-structure.md
    lessons/
      04-nest-cli.md
      05-http-data-transfer.md

  .vscode/
    launch.json
```

## What Goes Where

### Lesson Project Directories

Use directories such as `L4-L6/` and `L7/my-app/` for runnable course code.

When several consecutive lessons build on the same app, keep them in the same project directory. When a lesson starts a distinct experiment or project, create a new directory for it.

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

### Standalone Experiments

Use small files beside the lesson project when the lesson has isolated code worth preserving outside a Nest app.

Examples:

- `L7/index.js` for a minimal Node inspector demo
- CLI dry-run output summary
- a minimal decorator demo
- a small standalone TypeScript experiment

Avoid duplicating a whole project unless the lesson intentionally starts a separate project.

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

- `L4-L6/` stores the combined Nest app for lessons 4 through 6.
- `L7/my-app/` stores the Nest debugging practice app for lesson 7.
- `L7/index.js` stores the standalone Node inspector demo for lesson 7.
- `docs/` stores learning notes and course summaries.
- git commits/tags preserve previous lesson code states.

This keeps each lesson project runnable without forcing unrelated experiments into one `src/` tree.
