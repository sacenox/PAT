# Agent Instructions

## Important Instructions

- **Never make assumptions** - Ask for clarification instead.
- **Never ignore errors, warnings, or issues** - Address them immediately.
- **Never install, uninstall, or delete anything** without explicit authorization.
- **Never commit or add to git secrets and passwords.**
- **Never add code that is not used** - only add the minimum necessary to satisfy the task.
- **Always do exactly what was asked** - Don't add anything that wasn't explicitly mentioned.
- **Always lint and typecheck** changes using `npm run lint` and `npm run typecheck`.
- **Always write modular, testable code** - Prefer small, focused functions and components, focused on reusability.

## Coding Guidelines

### TypeScript
- Use strict typing - avoid `any`, prefer type inference where appropriate.
- Export types/interfaces alongside implementations.
- Use the types provided by dependencies when possible, avoid creating types for 3rd party code.
- Use Drizzle ORM type inference: `typeof table.$inferSelect` and `typeof table.$inferInsert`.

### Code Organization
- Use path aliases: `@/` for root imports (e.g., `@/src/components/...`).
- Follow modular structure: `src/components/`, `src/hooks/`, `src/lib/`, `app/api/`.
- Keep files focused - one main export per file when possible.

### Documentation
- Add JSDoc comments for exported functions with `@param` and `@returns`.
- Keep commenting to a minimum. We should only add comments when the code is not self-explanatory

### Naming Conventions
- `camelCase` for functions, variables, and hooks (e.g., `useLocalStorage`, `handleSubmit`).
- `PascalCase` for components, types, and interfaces (e.g., `MessageInput`, `MessageInputRef`).
- `kebab-case` for file names (except React components which use PascalCase).

### React Patterns
- Use functional components with hooks.
- Use `forwardRef` when ref forwarding is needed.
- Properly type component props and refs.
- Handle loading and error states explicitly.

### Error Handling
- Use try-catch blocks for async operations.
- Return proper HTTP status codes in API routes (400, 404, 500).
- Log errors using the `debug` utility from `@/src/lib/debug`.

### Database
- Use Drizzle ORM query builder patterns.
- Use `eq()`, `asc()`, `desc()` from `drizzle-orm` for queries.

### Testing
- Write tests using Vitest for complex logic.
- Keep tests in `src/tests/` mirroring the source structure.

