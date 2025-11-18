"use client";

import { useState, useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import AgentPromptEditor from "./AgentPromptEditor";
import { createClient } from "@/lib/supabase/client";
import { Settings2 } from "lucide-react";

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
  panelWidth: number;
  onWidthChange: (width: number) => void;
};

export default function ThinkingPartner({
  documentId,
  isOpen,
  onClose,
  panelWidth,
  onWidthChange,
}: ThinkingPartnerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
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

  // Handle mouse events for resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;
      // thinking partner panel width is between 600 and 900 pixels
      const clampedWidth = Math.max(600, Math.min(900, newWidth));
      onWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Add cursor feedback during resize
  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = "col-resize";
    } else {
      document.body.style.cursor = "default";
    }
  }, [isResizing]);

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
      {/* Slide-out Panel */}
      <div
        ref={panelRef}
        className={`fixed right-0 top-0 h-full bg-flexoki-ui border-l border-flexoki-ui-3 shadow-2xl transform transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: panelWidth }}
      >
        {/* Show either chat view or editor view */}
        {isEditingPrompt ? (
          <AgentPromptEditor
            documentId={documentId}
            onClose={() => setIsEditingPrompt(false)}
          />
        ) : (
          <div className="flex flex-col h-full relative">
            {/* Resize Handle */}
            <div
              onMouseDown={handleMouseDown}
              className={`absolute left-0 top-0 h-full w-1 hover:w-2 cursor-col-resize bg-transparent hover:bg-flexoki-accent transition-all ${
                isResizing ? "w-2 bg-flexoki-accent" : ""
              }`}
              style={{ zIndex: 50 }}
            />
            {/* Header */}
            <div className="border-b border-flexoki-ui-3 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {conversationId && messages.length > 0 && (
                  <button
                    onClick={handleClearConversation}
                    className="text-flexoki-tx-3 hover:text-flexoki-accent text-sm transition-colors"
                  >
                    CLEAR
                  </button>
                )}
              </div>

              {/* Center icon when there are messages */}
              {messages.length > 0 && (
                <div className="absolute left-1/2 transform -translate-x-1/2">
                  <img src="/icon.png" className="w-11 h-11 animate-bob" />
                </div>
              )}

              <button
                onClick={() => setIsEditingPrompt(true)}
                className="p-2 rounded-lg text-flexoki-tx-3 hover:text-flexoki-accent hover:bg-flexoki-ui-2 transition-colors"
                title="CUSTOMIZE your ki"
              >
                <Settings2 className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-flexoki-ui-2">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <span className="text-flexoki-tx-3">loading...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <img src="/icon.png" className="w-24 h-24 animate-bob" />
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
                    ? "thinking..."
                    : "press Enter to send, Shift+Enter for new line"}
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
                  SEND
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
