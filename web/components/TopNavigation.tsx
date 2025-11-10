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

      // Right arrow: thoughts → media  → journal
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
                <h1 className="text-3xl font-bold text-flexoki-accent italic">
                  ki
                </h1>
              </div>
              {/* Navigation Links */}
              <div className="flex items-center gap-6">
                <a
                  href="/dashboard"
                  className={`text-xl italic transition-colors ${
                    isActive("/dashboard")
                      ? "text-flexoki-accent-2 font-bold"
                      : "text-flexoki-tx-2 font-medium hover:text-2xl hover:font-bold hover:text-flexoki-accent-2"
                  }`}
                >
                  thoughts
                </a>
                <a
                  href="/dashboard/media"
                  className={`text-xl italic medium transition-colors ${
                    isActive("/dashboard/media")
                      ? "text-flexoki-accent-2 font-bold"
                      : "text-flexoki-tx-2 font-medium hover:text-2xl hover:font-bold hover:text-flexoki-accent-2"
                  }`}
                >
                  media
                </a>
                <a
                  href="/dashboard/documents"
                  className={`text-xl italic medium transition-colors ${
                    isActive("/dashboard/documents")
                      ? "text-flexoki-accent-2 font-bold"
                      : "text-flexoki-tx-2 font-medium hover:text-2xl hover:font-bold hover:text-flexoki-accent-2"
                  }`}
                >
                  journal
                </a>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg hover:bg-flexoki-ui-2 transition-colors"
                title="Settings"
              >
                <img
                  src="/icon.png"
                  alt="Settings"
                  className="w-10 h-10 animate-bob"
                />
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
