# Agent Instructions

- **Never make assumptions** - Ask for clarification instead.
- **Never ignore errors, warnings, or issues** - Address them immediately.
- **Never install, uninstall, or delete anything** without explicit authorization.
- **Never commit or add to git secrets and passwords.**
- **Never add code that is not used** - only add the minimum necessary to satisfy the task.
- **Always do exactly what was asked** - Don't add anything that wasn't explicitly mentioned.
- **Always lint and typecheck** changes using `npm run lint` and `npm run typecheck`.
- **Always write modular, testable code** - Prefer small, focused functions and components, focused on reusability.
- **Always** use absolute paths in import using path aliases: `@/` for imports (e.g., `@/src/components/...`).
- **Always review your changes before committing**:
  - identify code repetition and consolidate
  - identify overly complex code and simplify
  - ensure code modularity and separation of concerns
  - ensure code respects project guidelines
  - ensure the code uses best practices for React and Next.js
- **Always** use mcp servers for latest documentation:
  - use specific mcp servers if available, otherwise use the content7 server.
