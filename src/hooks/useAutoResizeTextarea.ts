import { useEffect, useRef } from "react";

/**
 * Custom hook for auto-resizing a textarea element.
 * Keeps an empty line at the bottom and enforces min/max height constraints.
 *
 * @param value - The current value of the textarea
 * @param minLines - Minimum number of lines (default: 3)
 * @param maxLines - Maximum number of lines (default: 10)
 * @returns Ref to attach to the textarea element
 */
export function useAutoResizeTextarea(
  value: string,
  minLines = 3,
  maxLines = 10
): React.RefObject<HTMLTextAreaElement> {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";

    const computedStyle = getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
    const paddingTop = parseFloat(computedStyle.paddingTop) || 8;
    const paddingBottom = parseFloat(computedStyle.paddingBottom) || 8;

    const minHeight = lineHeight * minLines + paddingTop + paddingBottom;
    const maxHeight = lineHeight * maxLines + paddingTop + paddingBottom;

    const calculatedHeight = textarea.scrollHeight + lineHeight;
    const newHeight = Math.min(maxHeight, Math.max(minHeight, calculatedHeight));
    textarea.style.height = `${newHeight}px`;
  }, [value, minLines, maxLines]);

  return textareaRef;
}
