"use client";

import { X, Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Capture = {
  id: string;
  type: string;
  note_type: string;
  transcription: string | null;
  file_url: string | null;
  created_at: string;
  log_date: string;
  cycle_day: number | null;
};

type MediaItem = {
  id: string;
  file_url: string;
  file_type: "image" | "video";
  caption: string | null;
  original_date: string;
  log_date: string | null;
  created_at: string;
};

type DataPoint = {
  id: string;
  type: "intention" | "reflection" | "general" | "media";
  cycleDay: number;
  timeOfDay: number;
  color: string;
  data: Capture | MediaItem;
};

type CycleDataPointModalProps = {
  dataPoint: DataPoint | null;
  cyclePhase: string | null;
  allDataPoints: DataPoint[];
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
};

export default function CycleDataPointModal({
  dataPoint,
  cyclePhase,
  allDataPoints,
  onClose,
  onNavigate,
}: CycleDataPointModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Stop audio when data point changes or modal closes
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
    };
  }, [dataPoint]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onNavigate("prev");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        onNavigate("next");
      }
    };

    if (dataPoint) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dataPoint, onClose, onNavigate]);

  if (!dataPoint) return null;

  const isCapture = dataPoint.type !== "media";
  const capture = isCapture ? (dataPoint.data as Capture) : null;
  const media = !isCapture ? (dataPoint.data as MediaItem) : null;

  // Find current index and calculate navigation availability
  const currentIndex = allDataPoints.findIndex((dp) => dp.id === dataPoint.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allDataPoints.length - 1;
  const positionText = `${currentIndex + 1} of ${allDataPoints.length}`;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatPhase = (phase: string | null) => {
    if (!phase) return "";
    return phase.charAt(0).toUpperCase() + phase.slice(1);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "intention":
        return "Intention";
      case "reflection":
        return "Reflection";
      case "general":
        return "Voice Capture";
      case "media":
        return "Media";
      default:
        return "Capture";
    }
  };

  const getCyclePhaseColor = (phase: string | null) => {
    switch (phase) {
      case "menstrual":
        return "text-blue-500";
      case "follicular":
        return "text-green-500";
      case "ovulation":
        return "text-yellow-500";
      case "luteal":
        return "text-orange-500";
      default:
        return "text-flexoki-tx-2";
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-flexoki-ui rounded-xl shadow-2xl border border-flexoki-ui-3 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-flexoki-ui-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: dataPoint.color }}
              />
              <h2 className="text-xl font-semibold text-flexoki-tx">
                {getTypeLabel(dataPoint.type)}
              </h2>
            </div>
            <div className="flex flex-col gap-2 text-sm text-flexoki-tx-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>
                  Day {dataPoint.cycleDay}
                  {cyclePhase && (
                    <span className={`ml-1 ${getCyclePhaseColor(cyclePhase)}`}>
                      • {formatPhase(cyclePhase)}
                    </span>
                  )}
                </span>
              </div>

              {/* For media items, show both original date and log date */}
              {media && (
                <div className="flex flex-col gap-1">
                  {media.original_date && (
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        <strong>Original:</strong> {formatTimestamp(media.original_date)}
                      </span>
                    </div>
                  )}
                  {media.log_date && (
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        <strong>Logged:</strong> {formatTimestamp(media.log_date)}
                      </span>
                    </div>
                  )}
                  {!media.original_date && !media.log_date && (
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        <strong>Created:</strong> {formatTimestamp(media.created_at)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* For captures, show created_at */}
              {capture && (
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {formatTimestamp(capture.created_at)}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-flexoki-ui-2 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-flexoki-tx-3" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Voice Capture */}
          {isCapture && capture && (
            <div className="space-y-4">
              {/* Audio Player */}
              {capture.file_url && (
                <div className="bg-flexoki-ui-2 rounded-lg p-4">
                  <audio
                    ref={audioRef}
                    src={capture.file_url}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full"
                    controls
                  />
                </div>
              )}

              {/* Transcription */}
              {capture.transcription && (
                <div>
                  <h3 className="text-sm font-semibold text-flexoki-tx-2 mb-2 uppercase tracking-wide">
                    Transcription
                  </h3>
                  <div className="bg-flexoki-ui-2 rounded-lg p-4">
                    <p className="text-flexoki-tx leading-relaxed whitespace-pre-wrap">
                      {capture.transcription}
                    </p>
                  </div>
                </div>
              )}

              {!capture.transcription && !capture.file_url && (
                <p className="text-flexoki-tx-3 italic">
                  No transcription or audio available
                </p>
              )}
            </div>
          )}

          {/* Media Item */}
          {!isCapture && media && (
            <div className="space-y-4">
              {/* Media Display */}
              <div className="bg-flexoki-ui-2 rounded-lg overflow-hidden">
                {media.file_type === "image" ? (
                  <img
                    src={media.file_url}
                    alt={media.caption || "Media"}
                    className="w-full h-auto"
                  />
                ) : (
                  <video
                    src={media.file_url}
                    controls
                    className="w-full h-auto"
                  />
                )}
              </div>

              {/* Caption */}
              {media.caption && (
                <div>
                  <h3 className="text-sm font-semibold text-flexoki-tx-2 mb-2 uppercase tracking-wide">
                    Caption
                  </h3>
                  <div className="bg-flexoki-ui-2 rounded-lg p-4">
                    <p className="text-flexoki-tx leading-relaxed">
                      {media.caption}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-flexoki-ui-3">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("prev")}
              disabled={!hasPrev}
              className="p-2 rounded-lg bg-flexoki-ui-2 hover:bg-flexoki-ui-3 text-flexoki-tx transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous (←)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-flexoki-tx-3 px-2">
              {positionText}
            </span>
            <button
              onClick={() => onNavigate("next")}
              disabled={!hasNext}
              className="p-2 rounded-lg bg-flexoki-ui-2 hover:bg-flexoki-ui-3 text-flexoki-tx transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next (→)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-flexoki-ui-2 hover:bg-flexoki-ui-3 text-flexoki-tx transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
