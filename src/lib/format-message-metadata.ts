/**
 * Formats generation time in milliseconds to a human-readable string.
 * @param ms - Generation time in milliseconds, or null
 * @returns Formatted string (e.g., "123ms" or "1.5s") or empty string if null
 */
export function formatGenerationTime(ms: number | null): string {
  if (!ms) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Formats tool call counts from JSON string to a human-readable string.
 * @param toolCallsJson - JSON string containing tool call counts, or null
 * @returns Formatted string (e.g., "toolName x 2, otherTool x 1") or null
 */
export function formatToolCalls(toolCallsJson: string | null): string | null {
  if (!toolCallsJson) return null;
  try {
    const toolCounts: Record<string, number> = JSON.parse(toolCallsJson);
    if (typeof toolCounts !== "object" || toolCounts === null) return null;

    const formatted = Object.entries(toolCounts)
      .map(([name, count]) => `${name} x ${count}`)
      .join(", ");

    return formatted || null;
  } catch {
    return null;
  }
}

/**
 * Formats max prompt length to a string representation.
 * @param maxPromptLength - Maximum prompt length, or null
 * @returns Formatted string (e.g., "1024" or "none")
 */
export function formatPromptSize(maxPromptLength: number | null): string {
  if (maxPromptLength === null) return "none";
  return `${maxPromptLength}`;
}
