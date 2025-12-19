/**
 * Generates the system prompt for a thread.
 *
 * @param options - Options for generating the system prompt
 * @param options.location - Optional location string
 * @param options.currentTime - Optional current time string (ISO format)
 * @param options.timezone - Optional timezone string
 * @param options.userPrompt - Optional user-provided additional instructions
 * @returns The generated system prompt string
 */
export function generateSystemPrompt(options: {
  time?: string;
  timezone?: string;
  userPrompt?: string | null;
}): string {
  const { time, timezone, userPrompt } = options;

  // Build system prompt with location and time if available
  let systemPrompt = `You are PAT, a helpful personal assistant. You must follow these guidelines:
- Only repeat tool calls in case of errors
- Use simple and concise language
- Reply with markdown whenever possible
- When asked for code or text return it in a markdown code block`;

  // Filter out empty strings - only use non-empty values
  const validTime = time?.trim() || undefined;
  const validTimezone = timezone?.trim() || undefined;

  if (validTime || validTimezone) {
    systemPrompt += "\n\n";
    if (validTime && validTimezone) {
      // Format time in the user's timezone
      try {
        const timeDate = new Date(validTime);
        const formattedTime = new Intl.DateTimeFormat("en-US", {
          timeZone: validTimezone,
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          timeZoneName: "short",
        }).format(timeDate);
        systemPrompt += `Current time: ${formattedTime}\n`;
      } catch {
        // Fallback to ISO string if timezone formatting fails
        systemPrompt += `Current time: ${validTime}\n`;
      }
    } else if (validTime) {
      systemPrompt += `Current time: ${validTime}\n`;
    }
    if (validTimezone) {
      // Extract city name, take everything after the / and replace underscores.
      const timezoneCity = validTimezone.split("/").slice(1).join("/").replace(/_/g, " ").trim();
      systemPrompt += `Location: ${timezoneCity}`;
    }
  }

  // Add user prompt if provided
  if (userPrompt && userPrompt.trim()) {
    systemPrompt += "\n\n";
    systemPrompt += `Additional instructions:\n${userPrompt.trim()}`;
  }

  return systemPrompt;
}
