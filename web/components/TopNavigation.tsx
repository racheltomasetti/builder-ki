"use client";

import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme";
import type { User } from "@supabase/supabase-js";

type TopNavigationProps = {
  user: User | null;
};

export default function TopNavigation({ user }: TopNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth");
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <nav className="bg-flexoki-ui shadow-sm border-b border-flexoki-ui-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-flexoki-tx italic">KI</h1>
              <span className="ml-4 text-sm text-flexoki-tx-2 italic">
                unlocking the mind
              </span>
            </div>
            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              <a
                href="/dashboard"
                className={`text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "text-flexoki-accent"
                    : "text-flexoki-tx hover:text-flexoki-accent"
                }`}
              >
                thoughts
              </a>
              <a
                href="/dashboard/documents"
                className={`text-sm font-medium transition-colors ${
                  isActive("/dashboard/documents")
                    ? "text-flexoki-accent"
                    : "text-flexoki-tx hover:text-flexoki-accent"
                }`}
              >
                docs
              </a>
            </div>
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
  );
}
