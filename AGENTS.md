# AGENTS.md

This is a personal assistant project, that renders a simple assistant chat layout as a web page, and provides access to an agentic model running locally via ollama.  The project uses Next.js for it's typescript framework TailwindCSS for it's styling, and Ollama's typescript/javascript library itself for querying the model.  This project is also responsible for augmenting the model's prompt with search results from DuckDuckGo.

## Project Commands

All commands should be run from the project root directory:

- **Development Server**: `npm run dev` - Starts the Next.js development server
- **Build**: `npm run build` - Builds the production-ready Next.js application
- **Start Production**: `npm run start` - Starts the production server (requires build first)
- **Lint**: `npm run lint` - Runs ESLint to check code quality

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

### Dev Dependencies

- **@types/node**: ^20.11.18 - TypeScript types for Node.js
- **@types/react**: ^18.2.55 - TypeScript types for React
- **@types/react-dom**: ^18.2.19 - TypeScript types for React DOM
- **eslint**: ^8.56.0 - JavaScript/TypeScript linter
- **eslint-config-next**: ^13.5.6 - Next.js ESLint configuration

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
   - Interfaces: `PascalCase` (e.g., `DuckDuckGoResult`)
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
   - Use consistent indentation (2 spaces)
   - Use single quotes for strings in some contexts, double quotes in others (maintain existing file style)
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
    - Use relative imports for local files (e.g., `import PaperPlaneIcon from "../src/components/icons/PaperPlaneIcon"`)
    - Group imports: external packages first, then local imports
    - Use named imports from libraries (e.g., `import { NextResponse } from "next/server"`)
    - Use default imports for component files (e.g., `import PaperPlaneIcon from "../src/components/icons/PaperPlaneIcon"`)

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
│       ├── duckduckgo.ts         # DuckDuckGo API wrapper
│       └── ollama.ts              # Ollama API wrapper
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## Key Implementation Details

### UI Style

- Always ensure support for both light and dark modes
- Use slate color palette for backgrounds and text (not gray or stone)
- Default text colors: `text-slate-800 dark:text-slate-200` (set on topmost container to cascade)
- Background colors: `bg-slate-200/300` for light mode, `bg-slate-900/950` for dark mode
- Don't use round corners
- The UI should always fit to the available space
- Primary colors: emerald-500 for dark mode, emerald-900 for light mode
- Alternate colors: indigo at an appropriate shade for current mode

### Ollama Integration

- Default model: `gpt-oss`
- Function: `fetchOllamaResponse(prompt: string, model?: string)`
- Returns: Promise<string> with the model's response
- Located in: `src/lib/ollama.ts`

### DuckDuckGo Integration

- Endpoint: `https://api.duckduckgo.com/`
- Function: `fetchDuckDuckGo(query: string)`
- Returns: Promise<DuckDuckGoResult[]>
- Interface: `{ title: string; snippet: string; url: string }`
- Located in: `src/lib/duckduckgo.ts`

### Chat API Flow

1. Client sends POST request to `/api/chat` with `{ message: string }`
2. API route fetches DuckDuckGo results for the message
3. API route builds prompt with message + search results
4. API route calls Ollama with the augmented prompt
5. API route returns `{ answer: string }`

## Development Workflow

1. Start development server: `npm run dev`
2. Make code changes
3. Test in browser (typically `http://localhost:3000`)
4. Run linter: `npm run lint`
5. Build for production: `npm run build`

## Important Constraints

- **DO NOT** add new npm packages without explicit approval
- **DO NOT** change TypeScript strict mode settings
- **DO NOT** modify Next.js or React versions
- **DO NOT** Commit secrets or API keys, edit `node_modules/` or `vendor/`
- **DO** maintain existing code style and patterns
- **DO** use existing utility functions from `src/lib/`
- **DO** follow the App Router conventions for Next.js 16