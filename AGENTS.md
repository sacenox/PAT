# AGENTS.md

This is a personal assistant project, that renders a simple assistant chat layout as a web page, and provides access to an agentic model running locally via ollama.  The project uses Next.js for it's typescript framework TailwindCSS for it's styling, and Ollama's typescript/javascript library itself for querying the model.  This project is also responsible for augmenting the model's prompt with search results from DuckDuckGo.

## Dependencies

- **DuckDuckGo Instant Answer API** | Unlimited (no key) | Very lightweight; returns JSON with snippets for most queries. | <https://api.duckduckgo.com/api>
- **Ollama** | locally or via an API, running your model of choice (gpt-oss is a good starter) | <https://ollama.com>
- **Next.js** | typescript framework for the web UI/server | <https://nextjs.org/docs>
- **TailwindCSS** | UI styling | <https://tailwindcss.com/>
