# AGENTS.md

This is a personal assistant project, that renders a simple assistant chat layout as a web page, and provides access to an agentic model running locally via ollama. The project uses Next.js for it's typescript framework TailwindCSS for it's styling, and Ollama's typescript/javascript library itself for querying the model.

## Project Commands

All commands should be run from the project root directory:

- **Development Server**: `npm run dev` - Starts the Next.js development server
- **Build**: `npm run build` - Builds the production-ready Next.js application
- **Start Production**: `npm run start` - Starts the production server (requires build first)
- **Lint**: `npm run lint` - Runs ESLint to check code quality
- **Format**: `npm run format` - Formats all files with Prettier
- **Format Check**: `npm run format:check` - Checks code formatting without making changes
- **DB Generate**: `npm run db:generate` - Generates database migrations using Drizzle Kit
- **DB Migrate**: `npm run db:migrate` - Runs database migrations
- **DB Studio**: `npm run db:studio` - Opens Drizzle Studio for database management

## Dependencies

### Production Dependencies

Agents MUST use only these existing dependencies. Do NOT add new dependencies without explicit approval:

- **next**: ^16.0.10 - Next.js framework
- **react**: 18.2.0 - React library
- **react-dom**: 18.2.0 - React DOM rendering
- **tailwindcss**: ^3.4.0 - Utility-first CSS framework
- **typescript**: ^5.4.2 - TypeScript compiler
- **ollama**: ^0.6.3 - Official Ollama npm package for model interaction
- **autoprefixer**: ^10.4.17 - CSS post-processor
- **postcss**: ^8.4.30 - CSS transformation tool
- **drizzle-orm**: ^0.45.1 - TypeScript ORM for SQL databases
- **better-sqlite3**: ^12.5.0 - Fast SQLite3 database driver

### Dev Dependencies

- **@types/node**: ^20.11.18 - TypeScript types for Node.js
- **@types/react**: ^18.2.55 - TypeScript types for React
- **@types/react-dom**: ^18.2.19 - TypeScript types for React DOM
- **eslint**: ^8.56.0 - JavaScript/TypeScript linter
- **eslint-config-next**: ^13.5.6 - Next.js ESLint configuration
- **prettier**: ^3.2.5 - Code formatter
- **prettier-plugin-tailwindcss**: ^0.5.11 - Prettier plugin for sorting Tailwind CSS classes
- **drizzle-kit**: ^0.31.8 - Drizzle ORM migration and introspection tool
- **@types/better-sqlite3**: ^7.6.13 - TypeScript types for better-sqlite3

## Code Style Guidelines

### TypeScript Configuration

- **Strict Mode**: Disabled (`strict: false` in tsconfig.json)
- **Target**: ES2017
- **Module**: ESNext
- **JSX**: React JSX transform (`react-jsx`)

### Code Style Rules

1. **File Organization**:
   - Use Next.js App Router structure (`app/` directory)
   - API routes in `app/api/[route]/route.ts`
   - Library utilities in `src/lib/`
   - Reusable components in `src/components/`
   - Icon components in `src/components/icons/`
   - Use TypeScript for all code files (`.ts`, `.tsx`)

2. **Component Style**:
   - Use functional components with React hooks
   - Use `"use client"` directive for client components
   - Export default for page components
   - Use named exports for utility functions

3. **Naming Conventions**:
   - Functions: `camelCase` (e.g., `fetchOllamaResponse`, `sendMessage`)
   - Components: `PascalCase` (e.g., `Home`, `RootLayout`)
   - Interfaces: `PascalCase` (e.g., `OllamaMessage`, `OllamaResponse`)
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
   - Use TailwindCSS utility classes exclusively
   - Inline Tailwind classes in JSX
   - Follow existing patterns: `className="flex flex-col bg-slate-200 dark:bg-slate-900 p-4"`
   - Use responsive design utilities when appropriate
   - Set default text colors on topmost container to cascade: `text-slate-800 dark:text-slate-200`

7. **Code Formatting**:
   - Use Prettier for code formatting: `npm run format` to format all files
   - Prettier configuration is in `.prettierrc` (2 spaces, semicolons, double quotes, 100 char width)
   - Prettier automatically sorts Tailwind CSS classes via `prettier-plugin-tailwindcss`
   - Use consistent indentation (2 spaces)
   - Add trailing commas in multi-line objects/arrays
   - Use semicolons

8. **Error Handling**:
   - Use `console.error` for errors
   - Use `console.debug` for debug information
   - Return user-friendly error messages in API responses
   - Handle API errors gracefully with try/catch blocks

9. **File Headers**:
   - Optional: Add file path comments at the top of library files (e.g., `/* personal-assistant-thing/src/lib/ollama.ts */`)

10. **Imports**:
    - Use absolute imports with `@/` prefix for local files (e.g., `import PaperPlaneIcon from "@/src/components/icons/PaperPlaneIcon"`)
    - Group imports: external packages first, then local imports
    - Use named imports from libraries (e.g., `import { NextResponse } from "next/server"`)
    - Use default imports for component files (e.g., `import PaperPlaneIcon from "@/src/components/icons/PaperPlaneIcon"`)
    - Path alias `@/` is configured in `tsconfig.json` to point to the project root

## Project Structure

```
/home/xonecas/src/personal-assistant-thing/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # Chat API endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Main page component
├── src/
│   ├── components/
│   │   └── icons/
│   │       └── PaperPlaneIcon.tsx # Reusable icon components
│   └── lib/
│       ├── db/
│       │   ├── index.ts          # Database connection and setup
│       │   └── schema.ts         # Drizzle ORM schema definitions
│       └── ollama.ts             # Ollama API wrapper
├── drizzle/                      # Generated migration files
│   ├── meta/                     # Migration metadata
│   └── *.sql                     # SQL migration files
├── data/                         # Database files (created at runtime)
│   └── database.db               # SQLite database file
├── drizzle.config.ts             # Drizzle Kit configuration
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## Key Implementation Details

### UI Style

- Always ensure support for both light and dark modes
- Use stone color palette for backgrounds and text (not gray or slate)
- Default text colors: `text-stone-800 dark:text-stone-200` (set on topmost container to cascade)
- Container backgrounds: `bg-stone-100` for light mode, `bg-stone-950` for dark mode
- Child component backgrounds: `bg-stone-200` for light mode, `bg-stone-900` for dark mode
- User message backgrounds: `bg-stone-300` for light mode, `bg-stone-800` for dark mode
- Assistant message backgrounds: `bg-stone-200` for light mode, `bg-stone-900` for dark mode
- Don't use round corners
- The UI should always fit to the available space
- Primary colors: green-500 for dark mode, green-900 for light mode
- margins and paddings shouldn't stack, use gaps when possible

### Ollama Integration

- Default model: `gpt-oss`
- Function: `fetchOllamaResponse(messages: OllamaMessage[], model?: string)`
- Returns: Promise<OllamaResponse> with `{ content: string, generationTimeMs: number }`
- Uses `ollama.chat()` API with full conversation history
- Located in: `src/lib/ollama.ts`

### Database Integration (Drizzle ORM)

- **Database**: SQLite using better-sqlite3
- **Location**: `data/database.db` (created automatically)
- **Schema**: Defined in `src/lib/db/schema.ts`
- **Connection**: Exported from `src/lib/db/index.ts` as `db`
- **Tables**:
  - `threads`: Stores conversation threads with id, title, createdAt, updatedAt
  - `messages`: Stores messages with id, threadId, role, content, createdAt
- **Relations**: Messages belong to threads (one-to-many)
- **Types**: Exported types `Thread`, `NewThread`, `Message`, `NewMessage`
- **Configuration**: `drizzle.config.ts` defines schema path and database location
- **Migrations**: Generated in `drizzle/` directory using `npm run db:generate`
- **Foreign Keys**: Enabled automatically in database connection
- **Usage**: Import `db` from `src/lib/db/index.ts` to query the database

### Chat API Flow

1. Client sends POST request to `/api/chat` with `{ message: string, threadId: number }`
2. API route fetches previous messages from the thread
3. API route stores the user message
4. API route calls Ollama with the full conversation history
5. API route stores the assistant response with generation time
6. API route returns `{ answer: string }`

## Development Workflow

1. Start development server: `npm run dev`
2. Make code changes
3. Test in browser (typically `http://localhost:3000`)
4. Format code: `npm run format`
5. Run linter: `npm run lint`
6. Build for production: `npm run build`

## Important Constraints

- **DO NOT** add new npm packages without explicit approval
- **DO NOT** change TypeScript strict mode settings
- **DO NOT** modify Next.js or React versions
- **DO NOT** Commit secrets or API keys, edit `node_modules/` or `vendor/`
- **DO** maintain existing code style and patterns
- **DO** use existing utility functions from `src/lib/`
- **DO** follow the App Router conventions for Next.js 16
- **DO** keep this file up to date as changes are made in the code
