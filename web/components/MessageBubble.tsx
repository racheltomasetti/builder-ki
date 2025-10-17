"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type MessageBubbleProps = {
  message: Message;
};

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const isUser = message.role === "user";
  const timestamp = new Date(message.created_at);
  const relativeTime = getRelativeTime(timestamp);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      } mb-4 animate-fade-in`}
    >
      <div
        className={`max-w-[85%] rounded-lg px-4 py-3 ${
          isUser
            ? "bg-flexoki-accent text-white"
            : "bg-flexoki-ui-2 text-flexoki-tx"
        }`}
      >
        {/* Message Content */}
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        ) : (
          <div className="prose prose-sm prose-flexoki max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom rendering for code blocks with copy button
                code: ({ node, className, children, ...props }: any) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");
                  const inline = !match;

                  if (!inline && match) {
                    return (
                      <div className="relative group">
                        <button
                          onClick={() => handleCopyCode(codeString)}
                          className="absolute top-2 right-2 px-2 py-1 bg-flexoki-ui text-flexoki-tx text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {copied ? "Copied!" : "Copy"}
                        </button>
                        <pre className={className}>
                          <code {...props}>{children}</code>
                        </pre>
                      </div>
                    );
                  }

                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                // Style links
                a: ({ node, children, ...props }) => (
                  <a
                    {...props}
                    className="text-flexoki-accent hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                // Style paragraphs
                p: ({ node, children, ...props }) => (
                  <p {...props} className="mb-3 last:mb-0 leading-relaxed">
                    {children}
                  </p>
                ),
                // Style lists
                ul: ({ node, children, ...props }) => (
                  <ul {...props} className="list-disc pl-4 mb-3 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ node, children, ...props }) => (
                  <ol {...props} className="list-decimal pl-4 mb-3 space-y-1">
                    {children}
                  </ol>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-xs mt-2 ${
            isUser ? "text-white/70" : "text-flexoki-tx-3"
          }`}
        >
          {relativeTime}
        </div>
      </div>
    </div>
  );
}

/**
 * Convert timestamp to relative time (e.g., "2 minutes ago")
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
