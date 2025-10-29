"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Search, Calendar, Image as ImageIcon } from "lucide-react";
import MediaGrid from "@/components/MediaGrid";
import MediaModal from "@/components/MediaModal";

type MediaItem = {
  id: string;
  file_url: string;
  file_type: "image" | "video";
  original_date: string | null;
  log_date: string | null;
  caption: string | null;
  tags: string[] | null;
  metadata: any;
  created_at: string;
};

export default function MediaLibraryPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchMediaItems();
  }, []);

  const fetchMediaItems = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated");
        return;
      }

      console.log("Fetching media items for user:", user.id);

      const { data, error } = await supabase
        .from("media_items")
        .select("*")
        .eq("user_id", user.id)
        .order("original_date", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        setError(error.message);
        return;
      }

      console.log("Fetched media items:", data);
      setMediaItems(data || []);
    } catch (err: any) {
      console.error("Error fetching media items:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayDate = (item: MediaItem) => {
    return item.original_date || item.log_date || item.created_at.split("T")[0];
  };

  // Filter media based on search and date
  const filteredMedia = mediaItems.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      (item.caption || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tags || []).some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesDate =
      !filterDate ||
      item.original_date === filterDate ||
      item.log_date === filterDate;
    return matchesSearch && matchesDate;
  });

  const handleDeleteMedia = async (itemId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this image? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleting(itemId);

      // Find the item to get the file URL
      const item = mediaItems.find((m) => m.id === itemId);
      if (!item) {
        throw new Error("Item not found");
      }

      // Extract file path from URL for storage deletion
      const url = new URL(item.file_url);
      const filePath = url.pathname.split("/").slice(3).join("/"); // Remove /storage/v1/object/public/bucket-name/

      console.log("Deleting file from storage:", filePath);

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("media-items")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage deletion error:", storageError);
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from("media_items")
        .delete()
        .eq("id", itemId);

      if (dbError) {
        throw dbError;
      }

      // Update local state
      setMediaItems((prev) => prev.filter((m) => m.id !== itemId));

      console.log("Media item deleted successfully");
    } catch (error) {
      console.error("Error deleting media item:", error);
      alert("Failed to delete image. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-flexoki-accent mx-auto mb-4"></div>
          <p className="text-flexoki-tx-2">Loading media library...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <p className="text-red-500 mb-4">Error: {error}</p>
          <button
            onClick={fetchMediaItems}
            className="px-4 py-2 bg-flexoki-accent text-flexoki-bg rounded-lg hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <ImageIcon className="w-8 h-8 text-flexoki-accent" />
          <h1 className="text-3xl font-bold text-flexoki-tx">Media Library</h1>
        </div>
        <p className="text-flexoki-tx-2">
          {mediaItems.length} {mediaItems.length === 1 ? "item" : "items"}{" "}
          uploaded
        </p>
      </div>

      {/* Basic Filters */}
      <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-flexoki-tx-3" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search captions and tags..."
            className="block w-full pl-10 pr-4 py-3 bg-flexoki-ui border border-flexoki-ui-3 rounded-lg text-flexoki-tx placeholder-flexoki-tx-3 focus:outline-none focus:ring-2 focus:ring-flexoki-accent focus:border-transparent transition-all"
          />
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Calendar className="h-5 w-5 text-flexoki-tx-3" />
          </div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 bg-flexoki-ui border border-flexoki-ui-3 rounded-lg text-flexoki-tx focus:outline-none focus:ring-2 focus:ring-flexoki-accent focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Debug Info */}
      <div className="mb-6 p-4 bg-flexoki-ui-2 rounded-lg">
        <h3 className="text-sm font-semibold text-flexoki-tx mb-2">
          Debug Info:
        </h3>
        <p className="text-xs text-flexoki-tx-2">
          Media items count: {mediaItems.length}
        </p>
        {mediaItems.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-flexoki-tx-2">Sample item:</p>
            <pre className="text-xs text-flexoki-tx-3 bg-flexoki-ui-3 p-2 rounded mt-1 overflow-auto">
              {JSON.stringify(mediaItems[0], null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Simple Grid */}
      {mediaItems.length === 0 ? (
        <div className="bg-flexoki-ui rounded-lg shadow-md p-8">
          <div className="text-center">
            <ImageIcon className="w-16 h-16 text-flexoki-tx-3 mx-auto mb-4" />
            <p className="text-flexoki-tx-2 mb-2">No media uploaded yet</p>
            <p className="text-sm text-flexoki-tx-3">
              Use the mobile app to upload photos and videos to your media
              library.
            </p>
          </div>
        </div>
      ) : (
        <MediaGrid
          mediaItems={filteredMedia}
          onDelete={handleDeleteMedia}
          onMediaClick={setSelectedMedia}
        />
      )}

      {/* Media Modal */}
      {selectedMedia && (
        <MediaModal
          key={selectedMedia.id}
          mediaItem={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          allMedia={filteredMedia}
          onNavigate={setSelectedMedia}
        />
      )}
    </main>
  );
}
