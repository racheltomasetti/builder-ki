"use client";

import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import SettingsModal from "./SettingsModal";

type TopNavigationProps = {
  user: User | null;
};

export default function TopNavigation({ user }: TopNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const { theme, toggleTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  // Keyboard navigation: Arrow keys to navigate between pages
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only navigate if not typing in an input/textarea/contenteditable
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't navigate if a modal is open (check for modal backdrop or z-50 elements)
      const modalOpen = document.querySelector('[class*="z-50"]');
      if (modalOpen) {
        return;
      }

      // Right arrow: thoughts → library → docs
      if (event.key === "ArrowRight" && pathname === "/dashboard") {
        router.push("/dashboard/media");
      } else if (
        event.key === "ArrowRight" &&
        pathname === "/dashboard/media"
      ) {
        router.push("/dashboard/documents");
      }

      // Left arrow: docs → library → thoughts
      if (event.key === "ArrowLeft" && pathname === "/dashboard/documents") {
        router.push("/dashboard/media");
      } else if (event.key === "ArrowLeft" && pathname === "/dashboard/media") {
        router.push("/dashboard");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router]);

  return (
    <>
      <nav className="bg-flexoki-ui shadow-sm border-b border-flexoki-ui-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-flexoki-tx italic">K·I</h1>
              <span className="ml-4 text-base text-flexoki-tx-2 italic font-bold">
                into the mind
              </span>
            </div>
            {/* Navigation Links */}
            <div className="flex items-center gap-6">
              <a
                href="/dashboard"
                className={`text-xl transition-colors ${
                  isActive("/dashboard")
                    ? "text-flexoki-accent font-bold"
                    : "text-flexoki-tx font-medium hover:text-2xl hover:font-bold"
                }`}
              >
                THOUGHTS
              </a>
              <a
                href="/dashboard/media"
                className={`text-xl medium transition-colors ${
                  isActive("/dashboard/media")
                    ? "text-flexoki-accent font-bold"
                    : "text-flexoki-tx font-medium hover:text-2xl hover:font-bold"
                }`}
              >
                MEDIA
              </a>
              <a
                href="/dashboard/documents"
                className={`text-xl medium transition-colors ${
                  isActive("/dashboard/documents")
                    ? "text-flexoki-accent font-bold"
                    : "text-flexoki-tx font-medium hover:text-2xl hover:font-bold"
                }`}
              >
                DOCUMENTS
              </a>
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg text-flexoki-tx-2 hover:bg-flexoki-ui-2 transition-colors"
              title="Settings"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      </nav>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
      />
    </>
  );
}
