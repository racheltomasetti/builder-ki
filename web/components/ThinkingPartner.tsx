"use client";

import { useState, useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type ThinkingPartnerProps = {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function ThinkingPartner({
  documentId,
  isOpen,
  onClose,
}: ThinkingPartnerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  // Load conversation history on mount
  useEffect(() => {
    if (isOpen && documentId) {
      loadConversation();
    }
  }, [isOpen, documentId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversation = async () => {
    setIsLoading(true);
    try {
      // Fetch conversation for this document
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .select("id")
        .eq("document_id", documentId)
        .maybeSingle();

      if (convError) throw convError;

      if (conversation) {
        setConversationId(conversation.id);

        // Load messages
        const { data: messagesData, error: msgsError } = await supabase
          .from("messages")
          .select("*")
          .eq("conversation_id", conversation.id)
          .order("created_at", { ascending: true });

        if (msgsError) throw msgsError;

        setMessages(messagesData || []);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");

    // Optimistically add user message to UI
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);
    setIsStreaming(true);

    try {
      // Call API with streaming
      const response = await fetch("/api/thinking-partner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          documentId,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No reader available");
      }

      // Create placeholder for assistant message
      const tempAssistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempAssistantMessage]);

      let assistantContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantContent += chunk;

        // Update the assistant message in real-time
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === tempAssistantMessage.id
              ? { ...msg, content: assistantContent }
              : msg
          )
        );
      }

      // Reload conversation to get actual IDs from database
      await loadConversation();
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic messages on error
      setMessages((prev) => prev.filter((msg) => !msg.id.startsWith("temp-")));
      alert("Failed to send message. Please try again.");
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = async () => {
    if (!conversationId) return;

    const confirmed = confirm(
      "Are you sure you want to clear this conversation? This cannot be undone."
    );

    if (!confirmed) return;

    try {
      // Delete conversation (cascade will delete messages)
      const { error } = await supabase
        .from("conversations")
        .delete()
        .eq("id", conversationId);

      if (error) throw error;

      setMessages([]);
      setConversationId(null);
    } catch (error) {
      console.error("Error clearing conversation:", error);
      alert("Failed to clear conversation. Please try again.");
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => (isOpen ? onClose() : null)}
        className={`fixed right-0 top-1/2 -translate-y-1/2 bg-flexoki-accent text-white p-3 shadow-lg hover:bg-opacity-90 transition-all z-50 ${
          isOpen ? "rounded-l-lg" : "rounded-l-lg"
        }`}
        style={{ right: isOpen ? "384px" : "0" }}
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>

      {/* Slide-out Panel */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-flexoki-ui border-l border-flexoki-ui-3 shadow-2xl transform transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-flexoki-ui-3 p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-flexoki-tx">KI</h2>
            {conversationId && messages.length > 0 && (
              <button
                onClick={handleClearConversation}
                className="text-flexoki-tx-3 hover:text-flexoki-accent text-sm transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <span className="text-flexoki-tx-3">Loading...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="text-flexoki-tx-2">
                  <p className="mb-2">👋 Hi there!</p>
                  <p className="text-sm">
                    I'm here to help you explore and develop your ideas.
                  </p>
                  <p className="text-sm mt-2 text-flexoki-tx-3">
                    Ask me anything about your document...
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isStreaming && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-flexoki-ui-2 rounded-lg px-4 py-3">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-flexoki-tx-3 rounded-full animate-pulse"></span>
                        <span
                          className="w-2 h-2 bg-flexoki-tx-3 rounded-full animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        ></span>
                        <span
                          className="w-2 h-2 bg-flexoki-tx-3 rounded-full animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        ></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-flexoki-ui-3 p-4">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask for help, structure suggestions, or connections..."
              className="w-full px-3 py-2 bg-flexoki-ui-2 border border-flexoki-ui-3 rounded-lg text-flexoki-tx placeholder-flexoki-tx-3 focus:outline-none focus:ring-2 focus:ring-flexoki-accent resize-none"
              rows={3}
              disabled={isStreaming}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-flexoki-tx-3">
                {isStreaming
                  ? "Thinking..."
                  : "Press Enter to send, Shift+Enter for new line"}
              </span>
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isStreaming}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !input.trim() || isStreaming
                    ? "bg-flexoki-ui-3 text-flexoki-tx-3 cursor-not-allowed"
                    : "bg-flexoki-accent text-white hover:bg-opacity-90"
                }`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
