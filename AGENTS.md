# learn-nest Agent Instructions

This repository is a NestJS learning project for the Juejin course "Nest 通关秘籍".

## Reference Docs

Read this file first, then open the relevant detailed docs as needed:

- Development workflow: `docs/development-workflow.md`
- Lesson template: `docs/lesson-template.md`
- Repository structure: `docs/repository-structure.md`
- Troubleshooting: `docs/troubleshooting.md`
- Course map: `docs/course-map.md`
- Learning log: `docs/learning-log.md`
- Lesson notes: `docs/lessons/`

## Safety and Copyright

- Do not copy paid course text, screenshots, or large code passages into this repository.
- Store only personal notes, summaries, experiments, debugging records, and practice code.
- If temporary raw material is needed, put it under `.raw-data/`; this directory must stay untracked.

## Repository Shape

- Lesson code is organized by lesson-range directories, such as `L4-L6/` and `L7/my-app/`.
- Each lesson project directory is treated as an independent runnable project.
- Lesson notes live under `docs/lessons/`.
- Small standalone experiments may live beside a lesson project, such as `L7/index.js`.
- Git commits and tags are the lesson snapshot mechanism.

## Lesson Workflow

For each lesson:

1. Read or inspect the course section.
2. Create or update `docs/lessons/NN-topic.md`.
3. Implement the lesson exercise in the matching lesson project directory.
4. Keep the app runnable.
5. Run verification before committing:

```bash
cd <lesson-project>
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

6. Commit and tag:

```bash
git add .
git commit -m "lesson NN: short topic"
git tag -a lesson-NN-topic -m "Lesson NN: short topic"
git push origin main
git push origin lesson-NN-topic
```

## Code Conventions

- Prefer Nest CLI generated structure, then modify for the lesson.
- Controller route behavior is determined by decorators, not method names.
- Avoid duplicate route definitions with the same HTTP method and full path.
- Put static routes before broad dynamic routes such as `:id`.
- DTO class fields should use definite assignment (`!`) under this project's TypeScript settings.
- Keep variable names lower camel case; reserve PascalCase for classes and types.
- Uploaded files go to `uploads/`, which is ignored by git.

## Local Development

- Use pnpm.
- Use the project TypeScript version in VS Code, not TypeScript Nightly.
- If port `3000` is occupied, follow `docs/troubleshooting.md` before changing code.
- Stop `nest start --watch` before running `pnpm build` on Windows.
- For nested projects, prefer `pnpm -C <lesson-project> <script>` from the repository root.

## Progress Tracking

- Current lesson progress lives in `docs/course-map.md`.
- Completed lesson history lives in git commits and `lesson-*` tags.
