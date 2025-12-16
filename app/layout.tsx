import "./globals.css";

export const metadata = {
  title: "Personal Assistant",
  description: "A simple personal assistant app built with Next.js, Tailwind, and Ollama.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
