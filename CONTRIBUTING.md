# Contributing to CarburApp

Thank you for taking the time to contribute! Here's everything you need to get started.

## Development setup

1. Fork and clone the repo
2. Follow the [Getting started](README.md#getting-started) steps in the README
3. Create a feature branch: `git checkout -b feat/your-feature`

## Making changes

- Keep commits focused and atomic
- Write clear commit messages in the present tense (e.g. `add deadline reminders`)
- If you're fixing a bug, reference the issue number in the commit message

## Code style

- TypeScript strict mode is enabled — no `any` types
- Use CSS Modules for component styles; avoid inline styles for layout
- New UI components go in `components/`; new full-screen views go in `components/screens/`
- Shared types belong in `lib/types.ts`; utility functions in `lib/utils.ts`

## Database changes

- Modify `prisma/schema.prisma` and run `npx prisma migrate dev --name your_migration_name`
- Commit both the schema file and the generated migration

## Opening a pull request

1. Push your branch and open a PR against `main`
2. Describe what you changed and why
3. Link any related issues

## Reporting issues

Use [GitHub Issues](../../issues) to report bugs or request features. Please include:
- Steps to reproduce (for bugs)
- Expected vs. actual behaviour
- Browser/OS and Node version if relevant
