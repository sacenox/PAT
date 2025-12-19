# AGENTS.md

This is a personal assistant project, that renders a simple assistant chat layout as a web page, and provides access to an agentic model running locally via ollama. The project uses Next.js for it's typescript framework TailwindCSS for it's styling, and Ollama's typescript/javascript library itself for querying the model.

You are assisting a developer to implement new features, fix bugs, and maintain the project.

## Project Commands

All commands should be run from the project root directory.
Commands are listed in [package.json](./package.json) in the scripts section. Use npm to run commands: `npm run <command>`.

## Dependencies

Use only these existing dependencies.
Do NOT add new dependencies without explicit approval.
Dependencies are listed in the file [package.json](./package.json).

## Code Style Guidelines

Always make sure the code is linted, formatted and the tests are passing.
Always update existing tests.
Add tests when prompted only.

### Code Style Rules

1. **File Organization**:
   - Use Next.js App Router structure (`app/` directory)
   - API routes in `app/api/[route]/route.ts`
   - Library utilities in `src/lib/`
   - Reusable components in `src/components/`
   - Icon components in `src/components/icons/`
   - Custom React hooks in `src/hooks/`
   - Test files use `.test.ts` or `.test.tsx` extension (e.g., `ratelimit.test.ts`)
   - TypeScript types are imported directly from `src/lib/db/schema` (Drizzle ORM inferred types)
   - Use TypeScript for all code files (`.ts`, `.tsx`)

2. **Component Style**:
   - Use functional components with React hooks
   - Use `"use client"` directive for client components
   - Export default for page components
   - Use named exports for utility functions

3. **Naming Conventions**:
   - Functions: `camelCase` (e.g., `sendMessage`) or `PascalCase` for main API functions (e.g., `OllamaChat`)
   - Components: `PascalCase` (e.g., `Home`, `RootLayout`)
   - Interfaces: `PascalCase` (e.g., `OllamaMessage`, `OllamaChatResponse`)
   - Constants: `UPPER_SNAKE_CASE` or `camelCase` depending on scope

4. **TypeScript Types**:
   - Use interfaces for object shapes
   - Use type annotations for function parameters and return types
   - Prefer explicit types over `any`
   - Use JSDoc comments for function documentation

5. **Async/Await**:
   - Always use `async/await` instead of promises with `.then()`
   - Use `try/catch` for error handling in async functions
   - API routes should return `NextResponse` objects

6. **Styling**:
   - Avoid using CSS
   - Use TailwindCSS utility classes exclusively
   - Inline Tailwind classes in JSX

7. **Code Formatting**:
   - Use Prettier for code formatting: `npm run format` to format all files
   - Prettier configuration is in `.prettierrc`

8. **Error Handling**:
   - Use `lib/debug` for debug information
   - Return user-friendly error messages in API responses
   - Handle API errors gracefully with try/catch blocks
   - The UI should always reflect errors to the user

9. **Imports**:
   - Use absolute imports with `@/` prefix for local files (e.g., `import PaperPlaneIcon from "@/src/components/icons/PaperPlaneIcon"`)
   - Group imports: external packages first, then local imports
   - Use named imports from libraries (e.g., `import { NextResponse } from "next/server"`)
   - Use default imports for component files (e.g., `import PaperPlaneIcon from "@/src/components/icons/PaperPlaneIcon"`)
   - Path alias `@/` is configured in `tsconfig.json` to point to the project root

### Testing

- **Configuration**: `vitest.config.ts` - Configures Vitest with TypeScript support and path aliases
- **Test Files**: Test files use `.test.ts` or `.test.tsx` extension and are located alongside the code they test
- **Test Commands**:
  - `npm test` - Run tests in watch mode
  - `npm run test:run` - Run tests once and exit
- **Mocking**: Tests use Vitest's mocking capabilities to isolate units (e.g., cache module is mocked in rate limiter tests)

### Database Integration (Drizzle ORM)

- **Database**: PostgreSQL using postgres driver
- **Connection**: Requires `DATABASE_URL` environment variable (format: `postgresql://user:password@host:port/database`)
- **Docker Setup**: PostgreSQL runs in Docker container via `npm run start:docker` script
  - Container name: `postgres`
  - Default port: `5432` (configurable via `POSTGRES_PORT` env var)
  - Default database: `personal_assistant` (configurable via `POSTGRES_DB` env var)
  - Default user: `postgres` (configurable via `POSTGRES_USER` env var)
  - Requires `POSTGRES_PASSWORD` environment variable
  - Data persisted in Docker volume `postgres_data`
- **Schema**: Defined in `src/lib/db/schema.ts`
- **Types**: Type definitions for `Thread` and `Message` are exported from `src/lib/db/schema` using Drizzle's `$inferSelect` (import directly from schema, e.g., `import type { Thread, Message } from "@/src/lib/db/schema"`)
- **Configuration**: `drizzle.config.ts` defines schema path and database connection
- **Migrations**: Generated in `drizzle/` directory using `npm run db:generate`
- **Usage**: Import `db` from `src/lib/db/index.ts` to query the database

## Development Workflow

1. Make code changes
2. Ask the user to test in browser
3. Update existing tests and add more if prompted to.
4. Format code: `npm run format`
5. Check for errors in compilation: `npm run typecheck`
6. Run linter: `npm run lint` **NEVER USE IGNORE COMMENTS**
7. Run tests: `npm run test:run` (verify all tests pass)

## Important Constraints

- **DO NOT** add new npm packages without explicit approval
- **DO NOT** Commit secrets or API keys, edit `node_modules/` or `vendor/`
- **DO NOT** Erase any data without explicit approval
- **DO** maintain existing code style and patterns

# Known issues:

The google based websearch can randomly fail with Request Entity not found. Generating a new custom search engine ID fixes the issue. Google has ignored all efforts to report this issue to them.
