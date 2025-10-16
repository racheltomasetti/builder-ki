"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import VoiceCard from "@/components/VoiceCard";
import { useTheme } from "@/lib/theme";

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

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }
      setUser(user);
      await fetchCaptures();
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  const fetchCaptures = async () => {
    const { data, error } = await supabase
      .from("captures")
      .select(
        `
        *,
        insights (*)
      `
      )
      .eq("type", "voice")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching captures:", error);
      return;
    }

    setCaptures(data || []);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-flexoki-bg">
        <p className="text-flexoki-tx-2">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-flexoki-bg">
      <nav className="bg-flexoki-ui shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-flexoki-tx">KI</h1>
              <span className="ml-4 text-sm text-flexoki-tx-2 italic">
                unlocking the mind
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-flexoki-tx-2">{user?.email}</span>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-flexoki-tx-2 hover:bg-flexoki-ui-2 transition-colors"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                  </svg>
                )}
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm font-medium text-flexoki-tx hover:text-flexoki-tx transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-flexoki-tx">
            Knowledge Garden
          </h2>
          <p className="text-flexoki-tx-2 mt-1 italic">
            where the mind goes to wander
          </p>
        </div>

        {captures.length === 0 ? (
          <div className="bg-flexoki-ui rounded-lg shadow-md p-6">
            <div className="text-center py-12">
              <p className="text-flexoki-tx-2 mb-4">
                No captures yet. Start capturing your thoughts using the mobile
                app.
              </p>
              <div className="bg-flexoki-ui-2 border border-flexoki-ui-3 rounded-lg p-4 mt-6 text-left">
                <h3 className="text-sm font-semibold text-flexoki-tx mb-2">
                  Next Steps:
                </h3>
                <ul className="text-sm text-flexoki-tx-2 space-y-1 list-disc list-inside">
                  <li>Open the KI mobile app and sign in</li>
                  <li>Tap the blue circle to record a voice note</li>
                  <li>Your captures will appear here once processed</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {captures.map((capture) => (
              <VoiceCard key={capture.id} capture={capture} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
