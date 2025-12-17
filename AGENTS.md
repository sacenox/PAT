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
- **Test**: `npm test` - Runs tests in watch mode using Vitest
- **Test UI**: `npm run test:ui` - Opens Vitest UI for interactive test running
- **Test Run**: `npm run test:run` - Runs tests once and exits
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
- **@googleapis/customsearch**: ^7.0.1 - Google Custom Search API client
- **googleapis**: ^169.0.0 - Google APIs client library
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
- **vitest**: ^4.0.16 - Fast unit test framework for Vite
- **@vitest/ui**: ^4.0.16 - Vitest UI for interactive test running

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
   - Test files use `.test.ts` or `.test.tsx` extension (e.g., `ratelimit.test.ts`)
   - TypeScript types are imported directly from `src/lib/db/schema` (Drizzle ORM inferred types)
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
│   │   │   ├── ChevronDownIcon.tsx # Reusable icon components
│   │   │   ├── PaperPlaneIcon.tsx
│   │   │   └── PlusIcon.tsx
│   │   ├── MessageInput.tsx      # Message input form component
│   │   ├── NoThreadSelected.tsx # Welcome screen when no thread selected
│   │   └── Sidebar.tsx           # Sidebar component with thread selection
│   ├── hooks/
│   │   └── useTheme.ts           # Custom hook for theme management
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts          # Database connection and setup
│   │   │   └── schema.ts         # Drizzle ORM schema definitions
│   │   ├── cache.ts              # File-based caching utility with TTL support
│   │   ├── debug.ts              # Debug logging utility (development only)
│   │   ├── ratelimit.ts          # Reusable rate limiting utility using cache
│   │   ├── ratelimit.test.ts     # Tests for rate limiting utility
│   │   └── ollama/
│   │       ├── index.ts          # Ollama API wrapper with tool calling support
│   │       ├── duckduckgo.ts    # DuckDuckGo Instant Answer tool
│   │       ├── weather.ts        # Open-Meteo weather tool
│   │       └── websearch.ts      # Google Custom Search tool
├── drizzle/                      # Generated migration files
│   ├── meta/                     # Migration metadata
│   └── *.sql                     # SQL migration files
├── data/                         # Database files (created at runtime)
│   ├── database.db               # SQLite database file
│   └── cache.json                # Cache file (created automatically)
├── drizzle.config.ts             # Drizzle Kit configuration
├── vitest.config.ts              # Vitest test framework configuration
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
- Returns: Promise<OllamaResponse> with `{ content: string, generationTimeMs: number, toolCalls?: any[] }`
- Uses `ollama.chat()` API with full conversation history
- **Tool Calling Support**: Supports tool calling with automatic iteration to exhaust tool calls
  - Tools are executed and results are sent back to the model until a final response is generated
  - Maximum 10 iterations to prevent infinite loops
  - Currently supports: `query_duckduckgo` tool for DuckDuckGo Instant Answer API queries, `query_weather` tool for Open-Meteo weather API queries, and `query_web_search` tool for Google Custom Search API queries
- Located in: `src/lib/ollama/index.ts`
- Tool implementations are modularized in separate files: `duckduckgo.ts`, `weather.ts`, `websearch.ts`

### Tool Integration

- **DuckDuckGo Tool** (`query_duckduckgo`): Queries DuckDuckGo's Instant Answer API for quick information
  - Function: `queryDuckDuckGo(query: string): Promise<string>`
  - Returns formatted information including heading, abstract, answer, definition, and related topics
  - Handles cases where no instant answer is available (limited API coverage)
  - Enforces rate limit of 500 requests per 24 hours using the rate limit utility (persisted across restarts via cache)
  - Results are cached for 6 hours using the cache utility
  - Located in: `src/lib/ollama/duckduckgo.ts`

- **Weather Tool** (`query_weather`): Queries Open-Meteo's weather API for current conditions and forecasts
  - Function: `queryWeather(location: string): Promise<string>`
  - Automatically geocodes location names to coordinates using Open-Meteo's geocoding API
  - Returns current weather conditions (temperature, humidity, wind speed, conditions) and 3-day forecast
  - Supports any location worldwide (city names, cities with countries, etc.)
  - Uses WMO weather codes converted to human-readable descriptions
  - Enforces rate limit of 1000 requests per 24 hours using the rate limit utility (persisted across restarts via cache)
  - Results are cached for 6 hours using the cache utility
  - Located in: `src/lib/ollama/weather.ts`

- **Web Search Tool** (`query_web_search`): Performs web searches using Google Custom Search API
  - Function: `queryWebSearch(query: string): Promise<string>`
  - Returns formatted search results with titles, URLs, and snippets
  - Enforces rate limit of 100 requests per 24 hours using the rate limit utility (persisted across restarts via cache)
  - Results are cached for 6 hours using the cache utility
  - Requires `GOOGLE_CUSTOM_SEARCH_API_KEY` and `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` environment variables
  - Located in: `src/lib/ollama/websearch.ts`

### Cache Utility

- **File-based Caching** (`src/lib/cache.ts`): Persistent caching utility with TTL support
  - Functions: `getCache<T>(key: string)`, `setCache<T>(key: string, value: T, ttlMs?: number)`, `deleteCache(key: string)`, `clearCache()`, `hasCache(key: string)`
  - Stores cache data in `data/cache.json` (created automatically)
  - Automatically cleans up expired entries on load
  - Used by tool implementations to cache API responses (6-hour TTL)
  - Thread-safe file operations with error handling

### Rate Limit Utility

- **Rate Limiting** (`src/lib/ratelimit.ts`): Reusable rate limiting utility using the cache system
  - Function: `createRateLimiter(config: RateLimitConfig)` - Creates a rate limiter instance
  - Configuration: `{ maxRequests: number, windowMs: number, identifier: string }`
  - Methods: `check()`, `increment()`, `reset()`, `getState()`
  - Uses the cache utility for persistence across restarts
  - Automatically handles window resets when the time window expires
  - Returns detailed rate limit information including remaining requests and reset time

### Debug Utility

- **Debug Logging** (`src/lib/debug.ts`): Development-only debug logging utility
  - Function: `debug(...args: any[]): void`
  - Only logs when `NODE_ENV === "development"`

### Testing

- **Test Framework**: Vitest (v4.0.16) - Fast unit test framework
- **Configuration**: `vitest.config.ts` - Configures Vitest with TypeScript support and path aliases
- **Test Files**: Test files use `.test.ts` or `.test.tsx` extension and are located alongside the code they test
- **Test Commands**:
  - `npm test` - Run tests in watch mode
  - `npm run test:ui` - Open Vitest UI for interactive testing
  - `npm run test:run` - Run tests once and exit
- **Test Coverage**: Currently includes comprehensive tests for `ratelimit.ts` covering:
  - Initial state creation
  - Rate limit checking and enforcement
  - Request counting and incrementing
  - Window expiration and automatic reset
  - Manual reset functionality
  - Edge cases and integration scenarios
- **Mocking**: Tests use Vitest's mocking capabilities to isolate units (e.g., cache module is mocked in rate limiter tests)

### Database Integration (Drizzle ORM)

- **Database**: SQLite using better-sqlite3
- **Location**: `data/database.db` (created automatically)
- **Schema**: Defined in `src/lib/db/schema.ts`
- **Connection**: Exported from `src/lib/db/index.ts` as `db`
- **Tables**:
  - `threads`: Stores conversation threads with id, title, createdAt, updatedAt
  - `messages`: Stores messages with id, threadId, role, content, createdAt, generationTimeMs, toolCalls (JSON string of tool calls made to generate assistant messages)
- **Relations**: Messages belong to threads (one-to-many)
- **Types**: Type definitions for `Thread` and `Message` are exported from `src/lib/db/schema` using Drizzle's `$inferSelect` (import directly from schema, e.g., `import type { Thread, Message } from "@/src/lib/db/schema"`)
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

- **Types** (`src/lib/db/schema.ts`): TypeScript types inferred from Drizzle ORM schema
  - `Thread`: Thread type with id, title, createdAt, updatedAt (inferred from `threads` table)
  - `Message`: Message type with id, threadId, role, content, createdAt, generationTimeMs, toolCalls (inferred from `messages` table)
  - Types are exported using `$inferSelect` and should be imported directly from the schema module

### Chat API Flow

1. Client sends POST request to `/api/chat` with `{ message: string, threadId: number }`
2. API route fetches previous messages from the thread
3. API route stores the user message
4. API route calls Ollama with the full conversation history
5. API route stores the assistant response with generation time and tool calls (if any)
6. API route returns `{ answer: string }`

### Threads API

- **GET** `/api/threads`: Returns list of all threads sorted by most recent
- **POST** `/api/threads`: Creates a new thread with optional title, returns the created thread
- **GET** `/api/threads/[id]/messages`: Returns all messages for a specific thread

## Development Workflow

1. Start development server: `npm run dev`
2. Make code changes
3. Test in browser (typically `http://localhost:3000`)
4. Write/update tests: `npm test` (watch mode) or `npm run test:ui` (interactive UI)
5. Format code: `npm run format`
6. Run linter: `npm run lint`
7. Run tests: `npm run test:run` (verify all tests pass)
8. Build for production: `npm run build`

## Important Constraints

- **DO NOT** add new npm packages without explicit approval
- **DO NOT** change TypeScript strict mode settings
- **DO NOT** modify Next.js or React versions
- **DO NOT** Commit secrets or API keys, edit `node_modules/` or `vendor/`
- **DO** maintain existing code style and patterns
- **DO** use existing utility functions from `src/lib/`
- **DO** follow the App Router conventions for Next.js 16
- **DO** ALWAYS keep this file up to date as changes are made in the code
