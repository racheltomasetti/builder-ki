"use client";

import { NodeViewWrapper } from "@tiptap/react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Insight = {
  id: string;
  type: "insight" | "decision" | "question" | "concept";
  content: string;
  created_at: string;
};

type Capture = {
  id: string;
  transcription: string | null;
  created_at: string;
  file_url: string;
  insights?: Insight[];
};

export default function VoiceCaptureComponent({
  node,
}: {
  node: { attrs: { captureId: string } };
}) {
  const [capture, setCapture] = useState<Capture | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchCapture = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("captures")
          .select(
            `
            id,
            transcription,
            created_at,
            file_url,
            insights (
              id,
              type,
              content,
              created_at
            )
          `
          )
          .eq("id", node.attrs.captureId)
          .single();

        if (error) {
          console.error("Error fetching capture:", error);
          return;
        }

        setCapture(data);
      } catch (err) {
        console.error("Error fetching capture:", err);
      } finally {
        setLoading(false);
      }
    };

    if (node.attrs.captureId) {
      fetchCapture();
    }
  }, [node.attrs.captureId]);

  if (loading) {
    return (
      <NodeViewWrapper className="my-4">
        <div className="bg-flexoki-ui-2 border border-flexoki-ui-3 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-flexoki-accent"></div>
            <span className="text-sm text-flexoki-tx-2">
              Loading voice note...
            </span>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  if (!capture) {
    return (
      <NodeViewWrapper className="my-4">
        <div className="bg-flexoki-ui-2 border border-red-500 rounded-lg p-4">
          <p className="text-sm text-red-500">Voice note not found</p>
        </div>
      </NodeViewWrapper>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <NodeViewWrapper className="my-4">
      <div className="bg-flexoki-ui-2 border border-flexoki-ui-3 rounded-lg overflow-hidden">
        {/* Header with Audio Player */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-flexoki-accent"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              <span className="text-xs text-flexoki-tx-2">
                {formatDate(capture.created_at)}
              </span>
            </div>
            {/* Toggle button for transcription */}
            {capture.transcription && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-flexoki-tx-2 hover:text-flexoki-tx hover:bg-flexoki-ui-3 transition-colors"
              >
                <span>{isExpanded ? "Hide" : "View"}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-3 w-3 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}
          </div>
          <audio controls className="w-full h-8">
            <source src={capture.file_url} type="audio/m4a" />
            <source src={capture.file_url} type="audio/mp3" />
            <source src={capture.file_url} type="audio/wav" />
            Your browser does not support the audio element.
          </audio>
        </div>

        {/* Expandable Transcription and Insights */}
        {isExpanded && capture.transcription && (
          <div className="border-t border-flexoki-ui-3 p-4 bg-flexoki-ui animate-fade-in">
            {/* Transcription */}
            <div className="mb-3">
              <h4 className="text-xs font-semibold text-flexoki-tx mb-2">
                Transcription
              </h4>
              <p className="text-flexoki-tx text-xs leading-relaxed">
                {capture.transcription}
              </p>
            </div>

            {/* Insights */}
            {capture.insights && capture.insights.length > 0 && (
              <div className="pt-3 border-t border-flexoki-ui-3">
                <h4 className="text-xs font-semibold text-flexoki-tx mb-2">
                  Insights ({capture.insights.length})
                </h4>
                <div className="space-y-2">
                  {capture.insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="flex items-start gap-2 text-xs"
                    >
                      <span className="text-sm leading-none">
                        {insight.type === "insight" && "💡"}
                        {insight.type === "decision" && "✅"}
                        {insight.type === "question" && "❓"}
                        {insight.type === "concept" && "🏷️"}
                      </span>
                      <span className="text-flexoki-tx flex-1">
                        {insight.content}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
