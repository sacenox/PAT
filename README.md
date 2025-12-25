# Personal Assistant Thing

A web-based personal assistant that connects to local Ollama models for chat conversations. Built with Next.js, TypeScript, and TailwindCSS.

## Features

- 💬 **Chat Interface**: Thread-based conversations with message history
- 🤖 **Ollama Integration**: Connect to local LLM models via Ollama
- 🧠 **Thinking Mode**: View model reasoning process with thinking output
- 🛠️ **Tool Calling**: Built-in tools for web search (SearXNG) and page fetching
- 🎨 **Modern UI**: Clean, responsive interface with dark/light theme support
- 💾 **Persistent Storage**: PostgreSQL database for threads and messages
- ⚡ **Caching**: Valkey (Redis-compatible) caching for improved performance
- 📝 **Markdown Support**: Rich markdown rendering with syntax highlighting

## Prerequisites

- Node.js >= 25.0.0
- Docker (for running PostgreSQL, Valkey, and SearXNG)
- Ollama installed and running locally

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd personal-assistant-thing
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/personal_assistant

# Valkey (Redis-compatible cache)
VALKEY_URL=valkey://:your_valkey_password@localhost:6379

# Docker setup (for start-docker.sh script)
VALKEY_PASSWORD=your_valkey_password
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_USER=postgres
POSTGRES_DB=personal_assistant
POSTGRES_PORT=5432

# Optional: SearXNG URL (for web search tool, defaults to http://localhost:8888)
SEARXNG_URL=http://localhost:8888
```

### 4. Start Docker Services

The project includes scripts to start PostgreSQL, Valkey, and SearXNG containers:

```bash
npm run start:docker
```

This will start:

- PostgreSQL database on port 5432
- Valkey (Redis-compatible) cache on port 6379
- SearXNG search engine on port 8888

To stop the containers:

```bash
npm run stop:docker
```

### 5. Run Database Migrations

```bash
npm run db:migrate
```

### 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run typecheck` - Run TypeScript type checking
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run test:run` - Run tests once
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio
- `npm run db:wipe-dev` - Wipe development database
- `npm run start:docker` - Start Docker containers
- `npm run stop:docker` - Stop Docker containers

## Project Structure

```
personal-assistant-thing/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── models/        # Model management endpoints
│   │   └── threads/       # Thread and message endpoints
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── src/
│   ├── components/        # React components
│   │   ├── App.tsx        # Main app component
│   │   ├── MessageList.tsx
│   │   ├── MessageEditor.tsx
│   │   ├── Sidebar.tsx
│   │   └── ...
│   ├── hooks/             # React hooks
│   │   ├── api/           # API hooks
│   │   └── ...
│   └── lib/               # Library code
│       ├── chat.ts        # Chat generation logic
│       ├── db/            # Database schema and connection
│       ├── tools/         # Tool implementations
│       ├── cache/         # Caching utilities
│       └── ...
├── drizzle/               # Database migrations
├── scripts/               # Utility scripts
└── searxng/              # SearXNG configuration
```

## Tools

The assistant supports the following tools:

- **Web Search**: Search the web using SearXNG (privacy-focused metasearch engine)
- **Fetch Page**: Fetch and extract content from web pages, including title, content, and links

Both tools use caching to improve performance and reduce API calls.

## Database Schema

The application uses PostgreSQL with the following main tables:

- **threads**: Conversation threads with model and configuration
- **messages**: Messages within threads (user, assistant, tool)

See `src/lib/db/schema.ts` for the complete schema.

## Development

### Code Style

- Use TypeScript for all code
- Follow ESLint and Prettier configurations
- Use absolute imports with `@/` alias
- Write modular, testable code

### Testing

Run tests with:

```bash
npm run test
```

### Database Management

Generate migrations after schema changes:

```bash
npm run db:generate
```

Apply migrations:

```bash
npm run db:migrate
```

View database in Drizzle Studio:

```bash
npm run db:studio
```

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This license allows free use, modification, and distribution, but requires that:

- All derivative works must also be licensed under AGPL-3.0
- Source code must be made available to anyone who uses the software (including over a network)
- The code cannot be sold as proprietary software

See the [LICENSE](LICENSE) file for the full license text.
