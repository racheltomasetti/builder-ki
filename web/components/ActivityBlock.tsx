"use client";

import { Timer, Play } from "lucide-react";

type Capture = {
  id: string;
  type: string;
  file_url: string | null;
  transcription: string | null;
  created_at: string;
};

type TimerSession = {
  id: string;
  name: string;
  start_time: string;
  end_time: string | null;
  status: string;
};

interface ActivityBlockProps {
  session: TimerSession;
  linkedCaptures: Capture[];
}

export default function ActivityBlock({
  session,
  linkedCaptures,
}: ActivityBlockProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateDuration = (start: string, end: string | null) => {
    if (!end) return "In progress...";

    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const duration = calculateDuration(session.start_time, session.end_time);
  const isActive = session.status === "active";

  return (
    <div className="mb-6">
      {/* Timeline bar */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm font-medium text-flexoki-tx-3">
          {formatTime(session.start_time)}
        </span>
        <div className="flex-1 h-1 bg-flexoki-accent-2 rounded-full relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-flexoki-accent-2 rounded-full"></div>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-flexoki-accent-2 rounded-full"></div>
        </div>
        {session.end_time && (
          <span className="text-sm font-medium text-flexoki-tx-3">
            {formatTime(session.end_time)}
          </span>
        )}
        <span className="text-sm font-semibold text-flexoki-accent-2">
          ({duration})
        </span>
      </div>

      {/* Activity block */}
      <div className="bg-flexoki-ui border-l-4 border-flexoki-accent-2 rounded-lg shadow-md p-4">
        <div className="flex items-center gap-2 mb-3">
          <Timer className="w-5 h-5 text-flexoki-accent-2" />
          <h3 className="text-lg font-semibold text-flexoki-tx">
            {session.name}
          </h3>
          {isActive && (
            <span className="ml-auto text-xs px-2 py-1 bg-flexoki-accent-2 text-flexoki-bg rounded-full font-medium">
              Active
            </span>
          )}
        </div>

        {/* Linked captures */}
        {linkedCaptures.length > 0 && (
          <div className="mt-4 space-y-3 border-t border-flexoki-ui-3 pt-4">
            {linkedCaptures.map((capture) => (
              <div key={capture.id} className="pl-3">
                <p className="text-xs text-flexoki-tx-3 mb-1">
                  {formatTime(capture.created_at)} - Voice note
                </p>
                {capture.file_url && (
                  <audio controls className="w-full mb-2 h-10">
                    <source src={capture.file_url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                )}
                {capture.transcription && (
                  <p className="text-sm text-flexoki-tx leading-relaxed">
                    {capture.transcription.length > 200
                      ? `${capture.transcription.substring(0, 200)}...`
                      : capture.transcription}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
