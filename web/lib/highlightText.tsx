import React from "react";

/**
 * Highlights all occurrences of a search query in text (case-insensitive)
 * Returns JSX with highlighted matches
 */
export function highlightText(
  text: string,
  searchQuery: string
): React.ReactNode {
  if (!searchQuery.trim() || !text) {
    return text;
  }

  // Escape special regex characters in the search query
  const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Create case-insensitive regex with global flag
  const regex = new RegExp(`(${escapedQuery})`, "gi");

  // Split text by matches
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        // Check if this part matches the search query (case-insensitive)
        if (part.toLowerCase() === searchQuery.toLowerCase()) {
          return (
            <span
              key={index}
              className="font-bold text-flexoki-accent"
              style={{ fontWeight: 700 }}
            >
              {part}
            </span>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}

/**
 * Counts total occurrences of a search query in text (case-insensitive)
 */
export function countMatches(text: string, searchQuery: string): number {
  if (!searchQuery.trim() || !text) {
    return 0;
  }

  // Escape special regex characters in the search query
  const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Create case-insensitive regex with global flag
  const regex = new RegExp(escapedQuery, "gi");

  // Match all occurrences
  const matches = text.match(regex);

  return matches ? matches.length : 0;
}
