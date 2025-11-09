"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, RotateCcw } from "lucide-react";

type PromptScope = "global" | "document";

interface AgentPromptEditorProps {
  documentId: string;
  onClose: () => void;
}

export default function AgentPromptEditor({
  documentId,
  onClose,
}: AgentPromptEditorProps) {
  const [scope, setScope] = useState<PromptScope | null>(null);
  const [prompt, setPrompt] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [systemDefaultPrompt, setSystemDefaultPrompt] = useState("");
  const [userDefaultPrompt, setUserDefaultPrompt] = useState<string | null>(
    null
  );
  const [isDocumentCustom, setIsDocumentCustom] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current prompts
  useEffect(() => {
    loadPrompts();
  }, [documentId]);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/agent-prompt/document?documentId=${documentId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load prompt");
      }

      const data = await response.json();
      setSystemDefaultPrompt(data.systemDefaultPrompt);
      setUserDefaultPrompt(data.userDefaultPrompt);
      setIsDocumentCustom(data.isDocumentCustom);
      setOriginalPrompt(data.activePrompt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load prompt");
    } finally {
      setLoading(false);
    }
  };

  const handleScopeSelect = (selectedScope: PromptScope) => {
    setScope(selectedScope);

    // Set initial prompt based on scope
    if (selectedScope === "global") {
      setPrompt(userDefaultPrompt || systemDefaultPrompt);
    } else {
      // For document scope, start with current document custom or user default or system default
      if (isDocumentCustom) {
        setPrompt(originalPrompt);
      } else {
        setPrompt(userDefaultPrompt || systemDefaultPrompt);
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      if (scope === "global") {
        // Save to user's global default
        const response = await fetch("/api/agent-prompt", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          throw new Error("Failed to save global prompt");
        }
      } else if (scope === "document") {
        // Save to document-specific
        const response = await fetch("/api/agent-prompt/document", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentId, prompt }),
        });

        if (!response.ok) {
          throw new Error("Failed to save document prompt");
        }
      }

      // Success - close editor
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save prompt");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !confirm("Are you sure you want to reset to the system default prompt?")
    ) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (scope === "global") {
        // Reset global default
        const response = await fetch("/api/agent-prompt", {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to reset global prompt");
        }
      } else if (scope === "document") {
        // Reset document-specific
        const response = await fetch(
          `/api/agent-prompt/document?documentId=${documentId}`,
          { method: "DELETE" }
        );

        if (!response.ok) {
          throw new Error("Failed to reset document prompt");
        }
      }

      // Success - close editor
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset prompt");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setScope(null);
    setPrompt("");
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-flexoki-ui">
        <div className="text-sm text-flexoki-tx-3">Loading...</div>
      </div>
    );
  }

  // Scope selection view
  if (scope === null) {
    return (
      <div className="flex h-full flex-col bg-flexoki-ui">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-flexoki-ui-3 p-4">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-flexoki-tx-3 transition-colors hover:bg-flexoki-ui-2 hover:text-flexoki-tx"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-3xl font-semibold text-flexoki-accent italic">
              CUSTOMIZE your ki
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-2xl space-y-6">
            <div>
              <h3 className="mb-2 text-lg font-medium text-flexoki-tx italic">
                current prompt:
              </h3>
              <div className="rounded-lg border border-flexoki-ui-3 bg-flexoki-ui-2 p-4">
                <p className="text-lg text-flexoki-tx-2">
                  {isDocumentCustom ? (
                    <>
                      this document is using a{" "}
                      <span className="font-bold text-flexoki-accent-2">
                        custom prompt
                      </span>
                    </>
                  ) : userDefaultPrompt ? (
                    <>
                      this document is using your{" "}
                      <span className="font-bold text-flexoki-accent-2">
                        global default prompt
                      </span>
                    </>
                  ) : (
                    <>
                      this document is using the{" "}
                      <span className="font-bold text-flexoki-accent-2">
                        system default prompt
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-flexoki-tx italic">
                choose what to edit:
              </h3>

              <button
                onClick={() => handleScopeSelect("global")}
                className="w-full rounded-lg border border-flexoki-ui-3 bg-flexoki-ui p-4 text-left transition-colors hover:border-flexoki-accent-2 hover:bg-flexoki-ui-2 hover:text-2xl hover:italic hover:font-bold"
              >
                <div className="mb-2 font-bold text-xl text-flexoki-accent">
                  EDIT GLOBAL DEFAULT
                </div>
                <div className="text-lg text-flexoki-tx-2">
                  change your default agent prompt for all documents. this
                  becomes your personal default.
                </div>
              </button>

              <button
                onClick={() => handleScopeSelect("document")}
                className="w-full rounded-lg border border-flexoki-ui-3 bg-flexoki-ui p-4 text-left transition-colors hover:border-flexoki-accent-2 hover:bg-flexoki-ui-2 hover:text-2xl hover:italic hover:font-bold"
              >
                <div className="mb-2 font-bold text-xl text-flexoki-accent">
                  CUSTOMIZE FOR THIS DOCUMENT
                </div>
                <div className="text-lg text-flexoki-tx-2">
                  create a custom agent prompt specifically for this document.
                  Overrides your global default.
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Editor view
  return (
    <div className="flex h-full flex-col bg-flexoki-ui">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-flexoki-ui-3 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            className="rounded-lg p-1.5 text-flexoki-tx-3 transition-colors hover:bg-flexoki-ui-2 hover:text-flexoki-tx"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-3xl font-semibold text-flexoki-accent italic">
            {scope === "global" ? "EDIT GLOBAL DEFAULT" : "CUSTOMIZE DOCUMENT"}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-lg font-medium text-flexoki-tx">
                AGENT PROMPT
              </label>
              <span className="text-lg text-flexoki-tx-3">
                {prompt.length} characters
              </span>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="enter your custom agent prompt..."
              className="min-h-[400px] font-mono text-lg"
            />
          </div>

          <div className="rounded-lg border border-flexoki-ui-3 bg-flexoki-ui-2 p-4">
            <p className="text-lg text-flexoki-tx-2">
              <strong className="text-flexoki-tx">note:</strong> the agent will
              always have access to your document content, voice notes, and
              thought captures. this prompt defines how the agent interacts with
              you and approaches your requests.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500 bg-red-500/10 p-4">
              <p className="text-lg text-red-500">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-flexoki-ui-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-flexoki-ui-3 bg-flexoki-ui text-flexoki-tx text-lg transition-colors hover:bg-flexoki-ui-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            reset to system default
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 rounded-lg border border-flexoki-ui-3 bg-flexoki-ui text-flexoki-tx text-lg transition-colors hover:bg-flexoki-ui-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !prompt.trim()}
              className="px-4 py-2 rounded-lg bg-flexoki-accent text-white text-lg transition-colors hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "saving..." : "save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
