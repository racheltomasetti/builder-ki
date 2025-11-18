"use client";

import { X, Calendar, Clock, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Capture = {
  id: string;
  type: string;
  note_type: string;
  transcription: string | null;
  file_url: string | null;
  created_at: string;
  log_date: string;
  cycle_day: number | null;
  is_public: boolean;
};

type MediaItem = {
  id: string;
  file_url: string;
  file_type: "image" | "video";
  caption: string | null;
  tags: string[] | null;
  original_date: string;
  log_date: string | null;
  created_at: string;
  is_public: boolean;
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
  const [isPublic, setIsPublic] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [caption, setCaption] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const supabase = createClient();

  // Initialize state when dataPoint changes
  useEffect(() => {
    if (dataPoint) {
      const data = dataPoint.data as Capture | MediaItem;
      setIsPublic(data.is_public || false);

      // Initialize caption and tags for media items
      if (dataPoint.type === "media") {
        const media = data as MediaItem;
        setCaption(media.caption || "");
        setTags(media.tags || []);
      }
    }
  }, [dataPoint]);

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

  const formatDate = (dateString: string) => {
    // For DATE fields (without time), parse as local date to avoid timezone issues
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
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

  const togglePublicStatus = async () => {
    if (!dataPoint) return;

    setIsUpdating(true);
    try {
      const isCapture = dataPoint.type !== "media";
      const table = isCapture ? "captures" : "media_items";
      const newStatus = !isPublic;

      const { error } = await supabase
        .from(table)
        .update({ is_public: newStatus })
        .eq("id", dataPoint.id);

      if (error) {
        console.error("Error updating public status:", error);
        alert("Failed to update visibility status");
        return;
      }

      // Update local state
      setIsPublic(newStatus);

      // Update the dataPoint.data to reflect the change
      const data = dataPoint.data as Capture | MediaItem;
      data.is_public = newStatus;
    } catch (error) {
      console.error("Error toggling public status:", error);
      alert("Failed to update visibility status");
    } finally {
      setIsUpdating(false);
    }
  };

  const updateCaption = async () => {
    if (!dataPoint || dataPoint.type !== "media") return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("media_items")
        .update({ caption: caption.trim() || null })
        .eq("id", dataPoint.id);

      if (error) {
        console.error("Error updating caption:", error);
        alert("Failed to update caption");
        return;
      }

      // Update the dataPoint.data to reflect the change
      const media = dataPoint.data as MediaItem;
      media.caption = caption.trim() || null;
      setIsEditingCaption(false);
    } catch (error) {
      console.error("Error updating caption:", error);
      alert("Failed to update caption");
    } finally {
      setIsUpdating(false);
    }
  };

  const addTag = async () => {
    if (!dataPoint || dataPoint.type !== "media" || !tagInput.trim()) return;

    const newTag = tagInput.trim().toLowerCase();
    if (tags.includes(newTag)) {
      setTagInput("");
      return;
    }

    const updatedTags = [...tags, newTag];
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("media_items")
        .update({ tags: updatedTags })
        .eq("id", dataPoint.id);

      if (error) {
        console.error("Error adding tag:", error);
        alert("Failed to add tag");
        return;
      }

      setTags(updatedTags);
      setTagInput("");

      // Update the dataPoint.data to reflect the change
      const media = dataPoint.data as MediaItem;
      media.tags = updatedTags;
    } catch (error) {
      console.error("Error adding tag:", error);
      alert("Failed to add tag");
    } finally {
      setIsUpdating(false);
    }
  };

  const removeTag = async (tagToRemove: string) => {
    if (!dataPoint || dataPoint.type !== "media") return;

    const updatedTags = tags.filter((tag) => tag !== tagToRemove);
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from("media_items")
        .update({ tags: updatedTags.length > 0 ? updatedTags : null })
        .eq("id", dataPoint.id);

      if (error) {
        console.error("Error removing tag:", error);
        alert("Failed to remove tag");
        return;
      }

      setTags(updatedTags);

      // Update the dataPoint.data to reflect the change
      const media = dataPoint.data as MediaItem;
      media.tags = updatedTags.length > 0 ? updatedTags : null;
    } catch (error) {
      console.error("Error removing tag:", error);
      alert("Failed to remove tag");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-flexoki-ui rounded-xl shadow-2xl border border-flexoki-ui-3 max-w-2xl w-full max-h-[90vh] ${
          !isCapture ? "flex flex-col overflow-hidden" : "overflow-y-auto"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-flexoki-ui-3 flex-shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: dataPoint.color }}
              />
              <h2 className="text-xl font-semibold text-flexoki-tx">
                {getTypeLabel(dataPoint.type)}
              </h2>

              {/* Public/Private Toggle */}
              <button
                onClick={togglePublicStatus}
                disabled={isUpdating}
                className={`ml-2 px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                  isPublic
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isPublic ? "Visible on public timeline" : "Private (not visible on public timeline)"}
              >
                {isPublic ? (
                  <>
                    <Eye className="w-3 h-3" />
                    Public
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3" />
                    Private
                  </>
                )}
              </button>
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
                        <strong>Original:</strong>{" "}
                        {formatDate(media.original_date)}
                      </span>
                    </div>
                  )}
                  {media.log_date && (
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        <strong>Logged:</strong>{" "}
                        {formatDate(media.log_date)}
                      </span>
                    </div>
                  )}
                  {!media.original_date && !media.log_date && (
                    <div className="flex items-center gap-1 text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>
                        <strong>Created:</strong>{" "}
                        {formatTimestamp(media.created_at)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* For captures, show created_at */}
              {capture && (
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTimestamp(capture.created_at)}</span>
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
        <div
          className={`p-6 ${
            !isCapture ? "flex-1 overflow-y-auto min-h-0" : ""
          }`}
        >
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
            <div className="space-y-4 h-full flex flex-col">
              {/* Media Display */}
              <div className="bg-flexoki-ui-2 rounded-lg overflow-hidden flex items-center justify-center flex-1 min-h-0">
                {media.file_type === "image" ? (
                  <img
                    src={media.file_url}
                    alt={media.caption || "Media"}
                    className="object-contain"
                    style={{ maxHeight: "50vh", maxWidth: "100%" }}
                  />
                ) : (
                  <video
                    src={media.file_url}
                    controls
                    className="object-contain"
                    style={{ maxHeight: "50vh", maxWidth: "100%" }}
                  />
                )}
              </div>

              {/* Caption */}
              <div>
                <h3 className="text-sm font-semibold text-flexoki-tx-2 mb-2 uppercase tracking-wide">
                  Caption
                </h3>
                {isEditingCaption ? (
                  <div className="space-y-2">
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-full bg-flexoki-ui-2 rounded-lg p-4 text-flexoki-tx leading-relaxed focus:outline-none focus:ring-2 focus:ring-flexoki-accent resize-none"
                      rows={3}
                      placeholder="Add a caption..."
                      disabled={isUpdating}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={updateCaption}
                        disabled={isUpdating}
                        className="px-4 py-2 text-sm rounded bg-flexoki-accent text-white hover:bg-flexoki-accent-2 transition-colors disabled:opacity-50"
                      >
                        {isUpdating ? "Saving..." : "Save"}
                      </button>
                      <button
                        onClick={() => {
                          setCaption(media.caption || "");
                          setIsEditingCaption(false);
                        }}
                        disabled={isUpdating}
                        className="px-4 py-2 text-sm rounded bg-flexoki-ui-2 text-flexoki-tx hover:bg-flexoki-ui-3 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => setIsEditingCaption(true)}
                    className="bg-flexoki-ui-2 rounded-lg p-4 cursor-pointer hover:bg-flexoki-ui-3 transition-colors group"
                  >
                    {caption ? (
                      <p className="text-flexoki-tx leading-relaxed">{caption}</p>
                    ) : (
                      <p className="text-flexoki-tx-3 text-sm italic">
                        Click to add a caption...
                      </p>
                    )}
                    <div className="mt-2 text-xs text-flexoki-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to edit
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <h3 className="text-sm font-semibold text-flexoki-tx-2 mb-2 uppercase tracking-wide">
                  Tags
                </h3>
                <div className="space-y-2">
                  {/* Tag List */}
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <div
                          key={tag}
                          className="flex items-center gap-1 px-2 py-1 bg-flexoki-accent text-white text-xs rounded-full"
                        >
                          <span>{tag}</span>
                          <button
                            onClick={() => removeTag(tag)}
                            disabled={isUpdating}
                            className="hover:text-flexoki-ui transition-colors disabled:opacity-50"
                            title="Remove tag"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Add Tag Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                      placeholder="Add a tag..."
                      disabled={isUpdating}
                      className="flex-1 bg-flexoki-ui-2 rounded px-3 py-1 text-sm text-flexoki-tx focus:outline-none focus:ring-2 focus:ring-flexoki-accent disabled:opacity-50"
                    />
                    <button
                      onClick={addTag}
                      disabled={isUpdating || !tagInput.trim()}
                      className="px-3 py-1 text-sm rounded bg-flexoki-accent text-white hover:bg-flexoki-accent-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-flexoki-ui-3 flex-shrink-0">
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
