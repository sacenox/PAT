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
- **@tailwindcss/typography**: ^0.5.x - Tailwind CSS plugin for beautiful typographic defaults
- **typescript**: ^5.4.2 - TypeScript compiler
- **ollama**: ^0.6.3 - Official Ollama npm package for model interaction
- **autoprefixer**: ^10.4.17 - CSS post-processor
- **postcss**: ^8.4.30 - CSS transformation tool
- **drizzle-orm**: ^0.45.1 - TypeScript ORM for SQL databases
- **better-sqlite3**: ^12.5.0 - Fast SQLite3 database driver
- **react-markdown**: ^10.1.0 - React component for rendering markdown
- **remark-gfm**: ^4.0.1 - GitHub Flavored Markdown plugin for remark
- **rehype-highlight**: ^7.0.2 - Syntax highlighting plugin for rehype
- **highlight.js**: ^11.11.1 - Syntax highlighting library

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
   - Custom React hooks in `src/hooks/`
   - Shared TypeScript types in `src/types.ts`
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
   - Follow existing patterns: `className="flex flex-col bg-neutral-200 dark:bg-neutral-900 p-4"`
   - Use responsive design utilities when appropriate
   - Set default text colors on topmost container to cascade: `text-neutral-800 dark:text-neutral-200`
   - Use neutral color palette (not slate or gray)
   - **Markdown Styling**: Use Tailwind Typography plugin with `prose` classes for markdown content
     - Use `prose prose-neutral dark:prose-invert max-w-none` for assistant messages
     - The typography plugin is configured in `tailwind.config.js`
     - Custom syntax highlighting styles are in `app/highlight-theme.css` using `.prose` selectors

7. **Code Formatting**:
   - Use Prettier for code formatting: `npm run format` to format all files
   - Prettier configuration is in `.prettierrc` (2 spaces, semicolons, double quotes, 100 char width)
   - Prettier automatically sorts Tailwind CSS classes via `prettier-plugin-tailwindcss`
   - Use consistent indentation (2 spaces)
   - Add trailing commas in multi-line objects/arrays
   - Use semicolons

8. **Error Handling**:
   - Use `console.error` for errors
   - Use `lib/debug` for debug information
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
│   │   ├── chat/
│   │   │   └── route.ts          # Chat API endpoint
│   │   └── threads/
│   │       ├── route.ts          # Threads API endpoint (GET, POST)
│   │       └── [id]/
│   │           └── messages/
│   │               └── route.ts  # Thread messages API endpoint
│   ├── globals.css               # Global styles
│   ├── highlight-theme.css       # Syntax highlighting theme
│   ├── layout.tsx                # Root layout component
│   └── page.tsx                  # Main page component
├── src/
│   ├── components/
│   │   ├── icons/
│   │   │   └── PaperPlaneIcon.tsx # Reusable icon components
│   │   ├── MessageInput.tsx      # Message input form component
│   │   ├── NoThreadSelected.tsx # Welcome screen when no thread selected
│   │   └── Sidebar.tsx           # Sidebar component with thread selection
│   ├── hooks/
│   │   └── useTheme.ts           # Custom hook for theme management
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts          # Database connection and setup
│   │   │   └── schema.ts         # Drizzle ORM schema definitions
│   │   ├── debug.ts              # Debug logging utility (development only)
│   │   └── ollama.ts             # Ollama API wrapper with tool calling support
│   └── types.ts                  # Shared TypeScript type definitions
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
- Use neutral color palette for backgrounds and text (not gray or slate)
- Default text colors: `text-neutral-800 dark:text-neutral-200` (set on topmost container to cascade)
- Container backgrounds: `bg-neutral-100` for light mode, `bg-neutral-950` for dark mode
- Child component backgrounds: `bg-neutral-200` for light mode, `bg-neutral-900` for dark mode
- User message backgrounds: `bg-neutral-300` for light mode, `bg-neutral-800` for dark mode
- Assistant message backgrounds: `bg-neutral-200` for light mode, `bg-neutral-900` for dark mode
- Don't use round corners
- The UI should always fit to the available space
- Primary colors: green-500 for dark mode, green-900 for light mode
- margins and paddings shouldn't stack, use gaps when possible

### Ollama Integration

- Default model: `gpt-oss`
- Function: `fetchOllamaResponse(messages: OllamaMessageInput[], model?: string)`
- Returns: Promise<OllamaResponse> with `{ content: string, generationTimeMs: number }`
- Uses `ollama.chat()` API with full conversation history
- **Tool Calling Support**: Supports tool calling with automatic iteration to exhaust tool calls
  - Tools are executed and results are sent back to the model until a final response is generated
  - Maximum 10 iterations to prevent infinite loops
  - Currently supports: `query_duckduckgo` tool for DuckDuckGo Instant Answer API queries, and `query_weather` tool for Open-Meteo weather API queries
- Located in: `src/lib/ollama.ts`

### Tool Integration

- **DuckDuckGo Tool** (`query_duckduckgo`): Queries DuckDuckGo's Instant Answer API for quick information
  - Function: `queryDuckDuckGo(query: string): Promise<string>`
  - Returns formatted information including heading, abstract, answer, definition, and related topics
  - Handles cases where no instant answer is available (limited API coverage)
  - Located in: `src/lib/ollama.ts`

- **Weather Tool** (`query_weather`): Queries Open-Meteo's weather API for current conditions and forecasts
  - Function: `queryWeather(location: string): Promise<string>`
  - Automatically geocodes location names to coordinates using Open-Meteo's geocoding API
  - Returns current weather conditions (temperature, humidity, wind speed, conditions) and 3-day forecast
  - Supports any location worldwide (city names, cities with countries, etc.)
  - Uses WMO weather codes converted to human-readable descriptions
  - Located in: `src/lib/ollama.ts`

### Debug Utility

- **Debug Logging** (`src/lib/debug.ts`): Development-only debug logging utility
  - Function: `debug(...args: any[]): void`
  - Only logs when `NODE_ENV === "development"`

### Database Integration (Drizzle ORM)

- **Database**: SQLite using better-sqlite3
- **Location**: `data/database.db` (created automatically)
- **Schema**: Defined in `src/lib/db/schema.ts`
- **Connection**: Exported from `src/lib/db/index.ts` as `db`
- **Tables**:
  - `threads`: Stores conversation threads with id, title, createdAt, updatedAt
  - `messages`: Stores messages with id, threadId, role, content, createdAt, generationTimeMs
- **Relations**: Messages belong to threads (one-to-many)
- **Types**: Type definitions for `Thread` and `Message` are in `src/types.ts` (shared across the application)
- **Configuration**: `drizzle.config.ts` defines schema path and database location
- **Migrations**: Generated in `drizzle/` directory using `npm run db:generate`
- **Foreign Keys**: Enabled automatically in database connection
- **Usage**: Import `db` from `src/lib/db/index.ts` to query the database

### Component Structure

- **Home** (`app/page.tsx`): Main page component that orchestrates the chat interface. Loads threads on mount but does not automatically select the latest thread - user must manually select a thread or create a new one. Messages are rendered with ReactMarkdown using Tailwind Typography prose classes for assistant messages.
- **Sidebar** (`src/components/Sidebar.tsx`): Sidebar with thread selection, new thread button, and theme selector
- **MessageInput** (`src/components/MessageInput.tsx`): Input form for sending messages with keyboard history navigation (ArrowUp/ArrowDown to cycle through previous user messages)
- **NoThreadSelected** (`src/components/NoThreadSelected.tsx`): Welcome screen displayed when no thread is selected, shows PAT introduction, current time (updates every second), and thread count. Uses ReactMarkdown with Tailwind Typography prose classes.
- **useTheme** (`src/hooks/useTheme.ts`): Custom hook managing theme state (device/dark/light) with localStorage persistence and automatic device preference detection

### Type Definitions

- **Types** (`src/types.ts`): Shared TypeScript types
  - `Thread`: Thread type with id, title, createdAt, updatedAt
  - `Message`: Message type with id, threadId, role, content, createdAt, generationTimeMs

### Chat API Flow

1. Client sends POST request to `/api/chat` with `{ message: string, threadId: number }`
2. API route fetches previous messages from the thread
3. API route stores the user message
4. API route calls Ollama with the full conversation history
5. API route stores the assistant response with generation time
6. API route returns `{ answer: string }`

### Threads API

- **GET** `/api/threads`: Returns list of all threads sorted by most recent
- **POST** `/api/threads`: Creates a new thread with optional title, returns the created thread
- **GET** `/api/threads/[id]/messages`: Returns all messages for a specific thread

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
- **DO** ALWAY Skeep this file up to date as changes are made in the code 
