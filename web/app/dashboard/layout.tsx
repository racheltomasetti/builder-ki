"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import TopNavigation from "@/components/TopNavigation";
import { FilterPreferencesProvider } from "@/lib/filterPreferences";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // Check if we're in the document editor (hide nav)
  const isDocumentEditor = pathname?.startsWith("/dashboard/documents/") && pathname !== "/dashboard/documents";

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

  if (loading) {
    return (
      <FilterPreferencesProvider>
        <div className="min-h-screen bg-flexoki-bg">
          {!isDocumentEditor && <TopNavigation user={null} />}
          <div className={`flex items-center justify-center ${isDocumentEditor ? 'h-screen' : 'h-[calc(100vh-4rem)]'}`}>
            <p className="text-flexoki-tx-2">Loading...</p>
          </div>
        </div>
      </FilterPreferencesProvider>
    );
  }

  return (
    <FilterPreferencesProvider>
      <div className="min-h-screen bg-flexoki-bg">
        {!isDocumentEditor && <TopNavigation user={user} />}
        {children}
      </div>
    </FilterPreferencesProvider>
  );
}
