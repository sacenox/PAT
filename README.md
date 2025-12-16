# Personal Assistant Thing

A minimal web-based personal assistant that connects to local Ollama models for chat conversations. Built with Next.js, TypeScript, and TailwindCSS.

## Features

- Chat interface with conversation threads
- Local LLM integration via Ollama
- Persistent conversation history (SQLite)
- Markdown rendering with syntax highlighting
- Dark/light mode support
- Keyboard shortcuts for message history

## Prerequisites

- Node.js 20+ and npm
- [Ollama](https://ollama.ai/) installed and running locally
- At least one Ollama model pulled (default: `gpt-oss`)

## Installation

```bash
npm install
```

## Setup

Run database migrations:

```bash
npm run db:migrate
```

## Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio

## Usage

1. Create a new thread or select an existing one from the sidebar
2. Type your message and press Enter (or click Send)
3. Use Arrow Up/Down keys to navigate through message history
4. Toggle theme using the theme selector in the sidebar

## Project Structure

- `app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - Utility functions (Ollama client, database)
- `src/types.ts` - TypeScript type definitions
- `data/` - SQLite database (created automatically)

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: SQLite with Drizzle ORM
- **LLM**: Ollama

