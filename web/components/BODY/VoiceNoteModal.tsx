"use client";

import { X } from "lucide-react";

type VoiceNoteModalProps = {
  capture: {
    id: string;
    type: string;
    note_type: string;
    transcription: string | null;
    file_url: string | null;
    created_at: string;
    timer_session_ids: string[] | null;
  } | null;
  cycleInfo?: {
    cycle_day: number | null;
    cycle_phase: string | null;
  } | null;
  linkedActivityName?: string | null;
  onClose: () => void;
};

export default function VoiceNoteModal({
  capture,
  cycleInfo,
  linkedActivityName,
  onClose,
}: VoiceNoteModalProps) {
  if (!capture) return null;

  const getNoteTypeColor = (noteType: string) => {
    switch (noteType) {
      case "intention":
        return {
          bg: "bg-yellow-100",
          border: "border-yellow-500",
          text: "text-yellow-700",
          label: "Intention",
        };
      case "reflection":
        return {
          bg: "bg-purple-100",
          border: "border-purple-400",
          text: "text-purple-700",
          label: "Reflection",
        };
      default:
        return {
          bg: "bg-red-100",
          border: "border-red-400",
          text: "text-red-700",
          label: "Voice Capture",
        };
    }
  };

  const formatPhase = (phase: string | null) => {
    if (!phase) return "";
    return phase.charAt(0).toUpperCase() + phase.slice(1);
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const noteTypeStyle = getNoteTypeColor(capture.note_type);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div
          className="bg-flexoki-ui rounded-xl shadow-2xl border border-flexoki-ui-3 max-w-2xl w-full max-h-[80vh] overflow-y-auto pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-flexoki-ui-3">
            <div className="flex items-center gap-3">
              <div
                className={`px-3 py-1 rounded-full ${noteTypeStyle.bg} ${noteTypeStyle.border} border`}
              >
                <span className={`text-sm font-semibold ${noteTypeStyle.text}`}>
                  {noteTypeStyle.label}
                </span>
              </div>
              {linkedActivityName && (
                <div className="text-sm text-flexoki-tx-2">
                  during{" "}
                  <span className="font-semibold">{linkedActivityName}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-flexoki-ui-2 transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-flexoki-tx" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Timestamp and Cycle Info */}
            <div className="flex items-center justify-between text-sm">
              <div className="text-flexoki-tx-2">
                {formatDateTime(capture.created_at)}
              </div>
              {cycleInfo?.cycle_day && cycleInfo?.cycle_phase && (
                <div className="text-flexoki-tx-2">
                  Day {cycleInfo.cycle_day} ·{" "}
                  {formatPhase(cycleInfo.cycle_phase)} Phase
                </div>
              )}
            </div>

            {/* Audio Player */}
            {capture.file_url && (
              <div className="bg-flexoki-ui-2 rounded-lg p-4">
                <audio controls className="w-full">
                  <source src={capture.file_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}

            {/* Transcription */}
            {capture.transcription && (
              <div className="bg-flexoki-ui-2 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-flexoki-tx-3 mb-3 uppercase tracking-wide">
                  Transcription
                </h3>
                <p className="text-flexoki-tx leading-relaxed whitespace-pre-wrap">
                  {capture.transcription}
                </p>
              </div>
            )}

            {!capture.transcription && !capture.file_url && (
              <div className="bg-flexoki-ui-2 rounded-lg p-6 text-center">
                <p className="text-flexoki-tx-3 italic">
                  No transcription or audio available
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-flexoki-ui-3 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-flexoki-accent text-flexoki-bg rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
