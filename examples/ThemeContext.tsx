"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Initialize theme from localStorage or default to dark
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    if (savedTheme && (savedTheme === "dark" || savedTheme === "light")) {
      setTheme(savedTheme);
    }
    setMounted(true);
  }, []);

  // Apply theme to document and save to localStorage
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(theme);
      localStorage.setItem("theme", theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Keyboard listener for "D" key (theme toggle)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only toggle if not typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (
        event.key === "d" ||
        event.key === "D" ||
        event.key === "l" ||
        event.key === "L"
      ) {
        toggleTheme();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Keyboard listener for arrow key navigation (main pages + project pages)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only navigate if not typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Define page order for cycling
      const mainPages = ["/", "/story", "/ki"];
      const projectPages = ["/ki/builder-ki", "/ki/cycle-ki", "/ki/mind-ki"];

      const isMainPage = mainPages.includes(pathname);
      const isProjectPage = projectPages.includes(pathname);

      if (event.key === "ArrowRight") {
        if (isProjectPage) {
          // Cycle forward through project pages
          const currentIndex = projectPages.indexOf(pathname);
          const nextIndex = (currentIndex + 1) % projectPages.length;
          router.push(projectPages[nextIndex]);
        } else if (isMainPage) {
          // Navigate to next main page (forward)
          const currentIndex = mainPages.indexOf(pathname);
          const nextIndex = (currentIndex + 1) % mainPages.length;
          router.push(mainPages[nextIndex]);
        }
      } else if (event.key === "ArrowLeft") {
        if (isProjectPage) {
          // Cycle backward through project pages
          const currentIndex = projectPages.indexOf(pathname);
          const prevIndex =
            (currentIndex - 1 + projectPages.length) % projectPages.length;
          router.push(projectPages[prevIndex]);
        } else if (isMainPage) {
          // Navigate to previous main page (backward)
          const currentIndex = mainPages.indexOf(pathname);
          const prevIndex =
            (currentIndex - 1 + mainPages.length) % mainPages.length;
          router.push(mainPages[prevIndex]);
        }
      } else if (event.key === "ArrowUp" && isProjectPage) {
        // Navigate back to NOW page from any project page
        router.push("/ki");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pathname, router]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Return default value during SSR or if used outside provider
    return { theme: "dark" as Theme, toggleTheme: () => {} };
  }
  return context;
}
