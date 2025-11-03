"use client";

import { useTheme } from "@/lib/theme";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useFilterPreferences, type FilterCategory } from "@/lib/filterPreferences";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
};

const FILTER_CATEGORY_LABELS: Record<FilterCategory, string> = {
  noteType: "Note Type",
  cyclePhase: "Cycle Phase",
  cycleDay: "Cycle Day",
  dateRange: "Date Range",
};

export default function SettingsModal({
  isOpen,
  onClose,
  user,
}: SettingsModalProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const supabase = createClient();
  const { preferences, toggleToolbar, toggleCategory } = useFilterPreferences();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-flexoki-ui border-2 border-flexoki-ui-3 rounded-2xl shadow-2xl w-full max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-flexoki-ui-3">
            <h2 className="text-2xl font-bold text-flexoki-tx">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-flexoki-tx-2 hover:bg-flexoki-ui-2 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-5 mb-5">
              {/* Left Column */}
              <div className="space-y-5">
                {/* Profile Section */}
                <div>
                  <h3 className="text-xs font-semibold text-flexoki-tx-2 uppercase tracking-wider mb-2">
                    Profile
                  </h3>
                  <div className="bg-flexoki-ui-2 rounded-lg p-3 border border-flexoki-ui-3">
                    <div className="flex items-center gap-3">
                      <svg
                        className="w-5 h-5 text-flexoki-tx-2 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                        />
                      </svg>
                      <span className="text-flexoki-tx text-sm truncate">{user?.email || "Loading..."}</span>
                    </div>
                  </div>
                </div>

                {/* Appearance Section */}
                <div>
                  <h3 className="text-xs font-semibold text-flexoki-tx-2 uppercase tracking-wider mb-2">
                    Appearance
                  </h3>
                  <div className="bg-flexoki-ui-2 rounded-lg p-3 border border-flexoki-ui-3">
                    <button
                      onClick={toggleTheme}
                      className="w-full flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {theme === "dark" ? (
                          <svg
                            className="w-5 h-5 text-flexoki-tx-2"
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
                            className="w-5 h-5 text-flexoki-tx-2"
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
                        <span className="text-flexoki-tx text-sm">Theme</span>
                      </div>
                      <span className="text-flexoki-tx-2 capitalize text-sm">{theme}</span>
                    </button>
                  </div>
                </div>

                {/* Account Section */}
                <div>
                  <h3 className="text-xs font-semibold text-flexoki-tx-2 uppercase tracking-wider mb-2">
                    Account
                  </h3>
                  <div className="bg-flexoki-ui-2 rounded-lg border border-flexoki-ui-3">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 p-3 text-flexoki-tx hover:bg-flexoki-ui-3 transition-colors rounded-lg"
                    >
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
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span className="text-sm">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column - Filter Toolbar */}
              <div>
                <h3 className="text-xs font-semibold text-flexoki-tx-2 uppercase tracking-wider mb-2">
                  Filter Toolbar
                </h3>
                <div className="bg-flexoki-ui-2 rounded-lg border border-flexoki-ui-3 divide-y divide-flexoki-ui-3">
                  {/* Toggle Toolbar Visibility */}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 text-flexoki-tx-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                          />
                        </svg>
                        <span className="text-flexoki-tx text-sm">Show Filter Toolbar</span>
                      </div>
                      <button
                        onClick={toggleToolbar}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          preferences.showToolbar ? "bg-flexoki-accent" : "bg-flexoki-ui-3"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.showToolbar ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Filter Categories */}
                  {preferences.showToolbar && (
                    <div className="p-3 space-y-2">
                      <p className="text-xs text-flexoki-tx-2 mb-2">
                        Select which filters to display:
                      </p>
                      {(Object.keys(FILTER_CATEGORY_LABELS) as FilterCategory[]).map(
                        (category) => (
                          <label
                            key={category}
                            className="flex items-center justify-between cursor-pointer group"
                          >
                            <span className="text-flexoki-tx text-sm group-hover:text-flexoki-accent transition-colors">
                              {FILTER_CATEGORY_LABELS[category]}
                            </span>
                            <input
                              type="checkbox"
                              checked={preferences.enabledCategories.includes(category)}
                              onChange={() => toggleCategory(category)}
                              className="w-4 h-4 rounded border-flexoki-ui-3 text-flexoki-accent focus:ring-2 focus:ring-flexoki-accent focus:ring-offset-0"
                            />
                          </label>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
