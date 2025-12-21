"use client";

import App from "@/src/components/App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Home() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <App />
    </QueryClientProvider>
  );
}
