"use client";

import { X } from "lucide-react";
import CycleInfo from "@/components/CycleInfo";
import ActivityBlock from "@/components/ActivityBlock";

type Capture = {
  id: string;
  type: string;
  file_url: string | null;
  transcription: string | null;
  note_type: string;
  created_at: string;
  timer_session_ids?: string[] | null;
};

type MediaItem = {
  id: string;
  file_url: string;
  file_type: string;
  original_date: string;
  caption: string | null;
  created_at: string;
  timer_session_ids?: string[] | null;
};

type TimerSession = {
  id: string;
  name: string;
  start_time: string;
  end_time: string | null;
  status: string;
  created_at: string;
  log_date: string;
};

type TimelineItem =
  | {
      type: "activity";
      session: TimerSession;
      linkedCaptures: Capture[];
      timestamp: string;
    }
  | { type: "capture"; capture: Capture; timestamp: string }
  | { type: "media"; media: MediaItem; timestamp: string };

type DayData = {
  date: string;
  intention?: Capture;
  timeline: TimelineItem[];
  reflection?: Capture;
  cycleDay: number | null;
  cyclePhase: string | null;
};

interface DailyViewModalProps {
  dayData: DayData | null;
  onClose: () => void;
}

export default function DailyViewModal({
  dayData,
  onClose,
}: DailyViewModalProps) {
  if (!dayData) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      {/* Modal Container */}
      <div className="bg-flexoki-bg rounded-xl shadow-2xl border border-flexoki-ui-3 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-flexoki-ui-3 bg-flexoki-ui-2">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-flexoki-tx">
              {formatDate(dayData.date)}
            </h2>
            <CycleInfo
              cycleDay={dayData.cycleDay}
              cyclePhase={dayData.cyclePhase}
            />
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-flexoki-ui transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-flexoki-tx" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Intention - Always at top */}
          {dayData.intention && (
            <section className="bg-flexoki-ui-2 rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl italic text-flexoki-accent font-bold">
                  Daily Intention
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-flexoki-tx-3">
                  {formatTime(dayData.intention.created_at)}
                </p>
                {dayData.intention.file_url && (
                  <audio controls className="w-full h-10">
                    <source src={dayData.intention.file_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                )}
                {dayData.intention.transcription && (
                  <p className="text-flexoki-tx leading-relaxed mt-3">
                    {dayData.intention.transcription}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Timeline Section - Activities, Captures, Media */}
          {dayData.timeline.length > 0 && (
            <section className="bg-flexoki-ui-2 rounded-lg shadow-md p-6">
              <div className="space-y-6">
                {dayData.timeline.map((item) => {
                  if (item.type === "activity") {
                    return (
                      <ActivityBlock
                        key={item.session.id}
                        session={item.session}
                        linkedCaptures={item.linkedCaptures}
                      />
                    );
                  } else if (item.type === "capture") {
                    const capture = item.capture;
                    return (
                      <div
                        key={capture.id}
                        className="border-l-2 border-flexoki-accent pl-4 py-2"
                      >
                        <p className="text-sm text-flexoki-tx-3 mb-2">
                          ~ {formatTime(capture.created_at)} ~
                        </p>
                        {capture.file_url && (
                          <audio controls className="w-full mb-2 h-10">
                            <source src={capture.file_url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        )}
                        {capture.transcription && (
                          <p className="text-flexoki-tx leading-relaxed">
                            {capture.transcription}
                          </p>
                        )}
                      </div>
                    );
                  } else if (item.type === "media") {
                    const media = item.media;
                    return (
                      <div key={media.id} className="mb-4">
                        <p className="text-sm text-flexoki-tx-3 mb-2">
                          ~ {formatTime(media.created_at)} ~
                        </p>
                        {media.file_type === "video" ? (
                          <video
                            controls
                            className="w-full max-w-md rounded-lg shadow-md"
                          >
                            <source src={media.file_url} type="video/mp4" />
                            Your browser does not support the video element.
                          </video>
                        ) : (
                          <img
                            src={media.file_url}
                            alt={media.caption || "Photo"}
                            className="w-full max-w-md rounded-lg shadow-md"
                          />
                        )}
                        {media.caption && (
                          <p className="text-sm text-flexoki-tx-2 mt-2 italic">
                            {media.caption}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </section>
          )}

          {/* Reflection - Always at bottom */}
          {dayData.reflection && (
            <section className="bg-flexoki-ui-2 rounded-lg shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-xl italic text-flexoki-accent font-bold">
                  Daily Reflection
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-flexoki-tx-3">
                  {formatTime(dayData.reflection.created_at)}
                </p>
                {dayData.reflection.file_url && (
                  <audio controls className="w-full h-10">
                    <source
                      src={dayData.reflection.file_url}
                      type="audio/mpeg"
                    />
                    Your browser does not support the audio element.
                  </audio>
                )}
                {dayData.reflection.transcription && (
                  <p className="text-flexoki-tx leading-relaxed mt-3">
                    {dayData.reflection.transcription}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* Empty State */}
          {!dayData.intention &&
            dayData.timeline.length === 0 &&
            !dayData.reflection && (
              <div className="text-center py-12">
                <p className="text-flexoki-tx-2">
                  No entries for this day yet.
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
