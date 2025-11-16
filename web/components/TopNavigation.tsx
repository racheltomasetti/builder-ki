"use client";

import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import SettingsModal from "./SettingsModal";
import {
  Settings2,
  SettingsIcon,
  SlidersHorizontalIcon,
  UserPenIcon,
} from "lucide-react";

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

      // Right arrow:   MIND  → KI → BODY
      if (event.key === "ArrowRight" && pathname === "/dashboard") {
        router.push("/dashboard/body");
      } else if (event.key === "ArrowRight" && pathname === "/dashboard/mind") {
        router.push("/dashboard");
      }

      // Left arrow: BODY → KI → MIND
      if (event.key === "ArrowLeft" && pathname === "/dashboard/body") {
        router.push("/dashboard");
      } else if (event.key === "ArrowLeft" && pathname === "/dashboard") {
        router.push("/dashboard/mind");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router]);

  return (
    <>
      <nav className="sticky top-0 z-40 bg-flexoki-ui shadow-sm border-b border-flexoki-ui-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex justify-center h-16 items-center">
            {/* KI - Left Side */}
            <div className="absolute left-0">
              <h1 className="text-4xl italic font-bold text-flexoki-tx">ki</h1>
            </div>
            {/* Navigation Links - Centered */}
            <div className="flex items-center gap-6">
              <a
                href="/dashboard/mind"
                className={`text-4xl italic medium transition-colors ${
                  isActive("/dashboard/mind")
                    ? "text-flexoki-accent-2 font-bold"
                    : "text-flexoki-tx-2 font-medium hover:font-bold hover:text-flexoki-accent-2"
                }`}
              >
                MIND
              </a>
              <a
                href="/dashboard"
                className={`text-4xl italic medium transition-colors ${
                  isActive("/dashboard")
                    ? "text-flexoki-accent font-bold"
                    : "text-flexoki-tx-2 font-medium hover:font-bold hover:text-flexoki-accent"
                }`}
              >
                <img
                  src="/icon.png"
                  alt="ki"
                  className="w-10 h-10 animate-bob"
                />
              </a>
              <a
                href="/dashboard/body"
                className={`text-4xl italic medium transition-colors ${
                  isActive("/dashboard/body")
                    ? "text-flexoki-accent-2 font-bold"
                    : "text-flexoki-tx-2 font-medium hover:font-bold hover:text-flexoki-accent-2"
                }`}
              >
                BODY
              </a>
            </div>
            {/* Settings Button - Absolute positioned to the right */}
            <div className="absolute right-0 flex items-center">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg hover:bg-flexoki-ui-2 transition-colors"
                title="Settings"
              >
                <p className="text-md italic">edit profile</p>
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
