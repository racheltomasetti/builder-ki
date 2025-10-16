type Insight = {
  id: string;
  type: "insight" | "decision" | "question" | "concept";
  content: string;
  created_at: string;
};

type Capture = {
  id: string;
  type: string;
  file_url: string;
  transcription: string | null;
  processing_status: string;
  created_at: string;
  processed_at: string | null;
  insights: Insight[];
};

type VoiceCardProps = {
  capture: Capture;
};

export default function VoiceCard({ capture }: VoiceCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {new Date(capture.created_at).toLocaleString()}
        </span>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            capture.processing_status === "complete"
              ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300"
              : capture.processing_status === "synthesizing"
              ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300"
              : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
          }`}
        >
          {capture.processing_status}
        </span>
      </div>

      {/* Audio Player */}
      <div className="mb-4">
        <audio controls className="w-full">
          <source src={capture.file_url} type="audio/m4a" />
          <source src={capture.file_url} type="audio/mp3" />
          <source src={capture.file_url} type="audio/wav" />
          Your browser does not support the audio element.
        </audio>
      </div>

      {/* Transcription */}
      {capture.transcription && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Transcription
          </h3>
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
            {capture.transcription}
          </p>
        </div>
      )}

      {/* Insights */}
      {capture.insights && capture.insights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Extracted Insights ({capture.insights.length})
          </h3>
          <div className="space-y-2">
            {capture.insights.map((insight) => (
              <div key={insight.id} className="flex items-start gap-2 text-sm">
                <span className="text-lg leading-none">
                  {insight.type === "insight" && "💡"}
                  {insight.type === "decision" && "✅"}
                  {insight.type === "question" && "❓"}
                  {insight.type === "concept" && "🏷️"}
                </span>
                <span className="text-gray-700 dark:text-gray-300 flex-1">
                  {insight.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
