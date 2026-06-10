# learn-nest

NestJS course practice repository for the Juejin book "Nest 通关秘籍".

## Structure

```text
learn-nest/
  L4-L6/      Nest project for lessons 4 through 6
  L7/         Lesson 7 debugging practice
    index.js Standalone Node inspector demo
    my-app/  Nest debugging practice app
  docs/       Course notes, workflow docs, and troubleshooting records
```

Each lesson project is runnable on its own. Use `pnpm -C <lesson-project> <script>` from the repository root, or open the specific lesson project directory in a terminal.

## Common Commands

```bash
pnpm -C L4-L6 start:dev
pnpm -C L7/my-app start:debug
pnpm -C L7/my-app test
pnpm -C L7/my-app build
```

## Notes

- Lesson notes live in `docs/lessons/`.
- Runtime output such as `node_modules/`, `dist/`, `uploads/`, logs, and `.raw-data/` is ignored.
- Completed lesson snapshots are preserved with git commits and `lesson-*` tags.
