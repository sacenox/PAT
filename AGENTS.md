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
   - Avoid using CSS whenever possible
   - Use TailwindCSS utility classes exclusively
   - Inline Tailwind classes in JSX
   - Use responsive design utilities when appropriate
   - **Markdown Styling**: Use Tailwind Typography plugin with `prose` classes for markdown content
     - Use `prose prose-neutral dark:prose-invert max-w-none` for assistant messages
     - The typography plugin is configured in `tailwind.config.js`
     - Custom syntax highlighting styles are in `app/highlight-theme.css` using `.prose` selectors

7. **Code Formatting**:
   - Use Prettier for code formatting: `npm run format` to format all files
   - Prettier configuration is in `.prettierrc`
   - Prettier automatically sorts Tailwind CSS classes via `prettier-plugin-tailwindcss`

8. **Error Handling**:
   - Use `console.error` for errors
   - Use `lib/debug` for debug information
   - Return user-friendly error messages in API responses
   - Handle API errors gracefully with try/catch blocks

9. **Imports**:
   - Use absolute imports with `@/` prefix for local files (e.g., `import PaperPlaneIcon from "@/src/components/icons/PaperPlaneIcon"`)
   - Group imports: external packages first, then local imports
   - Use named imports from libraries (e.g., `import { NextResponse } from "next/server"`)
   - Use default imports for component files (e.g., `import PaperPlaneIcon from "@/src/components/icons/PaperPlaneIcon"`)
   - Path alias `@/` is configured in `tsconfig.json` to point to the project root

## Key Implementation Details

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

- **Valkey-based Caching** (`src/lib/cache/`): Persistent caching utility with TTL support using Valkey (Redis-compatible)
  - Functions: `getCache<T>(key: string)`, `setCache<T>(key: string, value: T, ttlMs?: number)`
  - Cache API located in: `src/lib/cache/index.ts`
  - Valkey connection logic in: `src/lib/cache/valkey.ts`
  - Uses Valkey (Redis-compatible in-memory data store) for persistence
  - Automatically connects to Valkey on first cache operation
  - Uses Valkey's native TTL support (converts milliseconds to seconds)
  - Requires `VALKEY_URL` environment variable (format: `redis://:password@host:port`)
  - Used by tool implementations to cache API responses (6-hour TTL)
  - Graceful error handling - cache operations continue even if persistence fails

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

## Development Workflow

1. Make code changes
2. Ask the user to test in browser
3. Update existing tests and add more if prompted to.
4. Format code: `npm run format`
5. Run linter: `npm run lint`
6. Run tests: `npm run test:run` (verify all tests pass)

## Important Constraints

- **DO NOT** add new npm packages without explicit approval
- **DO NOT** change TypeScript strict mode settings
- **DO NOT** modify Next.js or React versions
- **DO NOT** Commit secrets or API keys, edit `node_modules/` or `vendor/`
- **DO NOT** Erase any data without explicit approval
- **DO** maintain existing code style and patterns
- **DO** use existing utility functions from `src/lib/`
- **DO** follow the App Router conventions for Next.js 16
- **DO** ALWAYS keep this file up to date as changes are made in the code

# Known issues:

The google based websearch can randomly fail with Request Entity not found. Generating a new custom search engine ID fixes the issue. Google has ignored all efforts to report this issue to them.
