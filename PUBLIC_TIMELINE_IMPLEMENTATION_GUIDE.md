# Public Timeline Implementation Guide
## Integrating Builder-Ki Public Data with racheltomasetti.com

This guide outlines how to build a public-facing timeline view on racheltomasetti.com that displays public captures, media, and journals from the Builder-Ki Supabase database.

---

## Part 1: Supabase Connection Setup

### 1.1 Environment Configuration

In your `racheltomasetti.com` project, create/update `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=<same-url-as-builder-ki>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<same-anon-key-as-builder-ki>
```

**Important**: Use the SAME Supabase project credentials from builder-ki. This allows the public site to read from the same database.

### 1.2 Install Dependencies

```bash
npm install @supabase/ssr @supabase/supabase-js
```

### 1.3 Create Supabase Client Helper

Create `lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 1.4 Database Security (Row Level Security)

Ensure your Supabase tables have proper RLS policies for public read access:

**For `captures` table:**
```sql
-- Allow public reads for public captures
CREATE POLICY "Public captures are viewable by everyone"
ON captures FOR SELECT
USING (is_public = true);
```

**For `media_items` table:**
```sql
-- Allow public reads for public media
CREATE POLICY "Public media items are viewable by everyone"
ON media_items FOR SELECT
USING (is_public = true);
```

**For `documents` table:**
```sql
-- Allow public reads for public documents
CREATE POLICY "Public documents are viewable by everyone"
ON documents FOR SELECT
USING (is_public = true);
```

---

## Part 2: Data Types & Schemas

### 2.1 TypeScript Types

Create `types/timeline.ts`:

```typescript
export type Capture = {
  id: string;
  type: string;
  note_type: string;
  transcription: string | null;
  file_url: string | null;
  created_at: string;
  log_date: string;
  cycle_day: number | null;
  is_public: boolean;
};

export type MediaItem = {
  id: string;
  file_url: string;
  file_type: "image" | "video";
  caption: string | null;
  tags: string[] | null;
  original_date: string;
  log_date: string | null;
  created_at: string;
  is_public: boolean;
};

export type Document = {
  id: string;
  title: string;
  content: any;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  capture_id: string | null;
};

export type TimelineItem = {
  id: string;
  type: "capture" | "media" | "document";
  timestamp: string; // For sorting
  data: Capture | MediaItem | Document;
};
```

---

## Part 3: Timeline Features & UI Concepts

### 3.1 Feature Overview

The public timeline will showcase:
1. **Horizontal Timeline View** - Chronological journey from first to latest capture
2. **Data Point Modal** - Click-through experience (similar to CycleDataPointModal)
3. **Public Journals View** - Featured writing/documents
4. **Storytelling Elements** - How Ki outlines the entire journey

### 3.2 Timeline View Concepts

#### Option A: Linear Horizontal Timeline (Recommended)

A scrollable horizontal timeline spanning from earliest to latest public data:

**Features:**
- Timeline spans from first public capture/media to most recent
- Data points plotted chronologically as dots
- Different colors for different types (captures, media, documents)
- Hover to preview, click to open detailed modal
- Time markers (dates) along the timeline
- Auto-scroll to "now" on page load

**Visual Layout:**
```
[Earliest Date]────●────────●──●───────────────●──●─●──────●───────[Latest/Now]
                   │        │  │               │  │ │      │
                 capture  media doc          capture...
```

#### Option B: Radial/Circular Timeline

Inspired by the cycle view, but representing the entire journey as a spiral:

**Features:**
- Spiral grows outward from center (earliest = center, latest = outer edge)
- Each rotation could represent a month or year
- Similar click-through experience

#### Option C: Stacked Timeline Lanes

Multiple horizontal lanes for different content types:

**Features:**
- Lane 1: Voice Captures
- Lane 2: Media Items
- Lane 3: Documents/Journals
- Vertical time markers sync across all lanes
- Zoom in/out functionality

**Recommendation**: Start with **Option A (Linear Horizontal Timeline)** as it's most intuitive for storytelling and easier to implement. Can enhance later with Option C for filtering.

### 3.3 Modal/Detail View

Reuse the modal pattern from `CycleDataPointModal.tsx`:

**Features:**
- Left/Right navigation between items (chronologically)
- Display full content based on type:
  - **Captures**: Audio player + transcription
  - **Media**: Image/video display + caption + tags
  - **Documents**: Title + rendered content preview
- Metadata display (timestamp, tags, etc.)
- "X of Y" position indicator
- Keyboard navigation (ESC, ←, →)

---

## Part 4: Implementation Plan

### Phase 1: Data Fetching Layer

**File**: `lib/api/publicTimeline.ts`

```typescript
import { createClient } from '@/lib/supabase/client';
import { Capture, MediaItem, Document, TimelineItem } from '@/types/timeline';

export async function fetchPublicTimelineData(): Promise<TimelineItem[]> {
  const supabase = createClient();

  // Fetch public captures
  const { data: captures } = await supabase
    .from('captures')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: true });

  // Fetch public media
  const { data: media } = await supabase
    .from('media_items')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: true });

  // Fetch public documents
  const { data: documents } = await supabase
    .from('documents')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: true });

  // Combine and sort by timestamp
  const timelineItems: TimelineItem[] = [
    ...(captures || []).map(c => ({
      id: c.id,
      type: 'capture' as const,
      timestamp: c.created_at,
      data: c,
    })),
    ...(media || []).map(m => ({
      id: m.id,
      type: 'media' as const,
      timestamp: m.original_date || m.created_at,
      data: m,
    })),
    ...(documents || []).map(d => ({
      id: d.id,
      type: 'document' as const,
      timestamp: d.created_at,
      data: d,
    })),
  ];

  // Sort chronologically
  return timelineItems.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}
```

### Phase 2: Timeline Component

**File**: `components/PublicTimeline.tsx`

```typescript
"use client";

import { useEffect, useState, useRef } from 'react';
import { TimelineItem } from '@/types/timeline';
import { fetchPublicTimelineData } from '@/lib/api/publicTimeline';
import TimelineModal from './TimelineModal';

export default function PublicTimeline() {
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadData() {
      const data = await fetchPublicTimelineData();
      setItems(data);
      setLoading(false);
    }
    loadData();
  }, []);

  // Calculate timeline positioning
  const getItemPosition = (index: number, total: number): string => {
    // Distribute items evenly across timeline
    const percentage = (index / (total - 1)) * 100;
    return `${percentage}%`;
  };

  const getItemColor = (type: string): string => {
    switch (type) {
      case 'capture':
        return '#af3029'; // red accent
      case 'media':
        return '#3aa99f'; // teal accent
      case 'document':
        return '#D4A574'; // gold
      default:
        return '#ADA9A0';
    }
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (!selectedItem) return;
    const currentIndex = items.findIndex(item => item.id === selectedItem.id);

    if (direction === 'prev' && currentIndex > 0) {
      setSelectedItem(items[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < items.length - 1) {
      setSelectedItem(items[currentIndex + 1]);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading timeline...</div>;
  }

  return (
    <div className="w-full overflow-x-auto py-16 px-8">
      {/* Timeline Container */}
      <div className="relative min-w-[2000px]" ref={timelineRef}>
        {/* Timeline Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 -translate-y-1/2" />

        {/* Time Markers */}
        <div className="relative h-32 mb-8">
          {items.map((item, index) => {
            const isFirstOfMonth = index === 0 ||
              new Date(item.timestamp).getMonth() !== new Date(items[index - 1].timestamp).getMonth();

            if (!isFirstOfMonth && index % 10 !== 0) return null;

            return (
              <div
                key={`marker-${item.id}`}
                className="absolute top-0"
                style={{ left: getItemPosition(index, items.length) }}
              >
                <div className="flex flex-col items-center">
                  <div className="text-sm text-gray-600 mb-2">
                    {new Date(item.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="w-px h-4 bg-gray-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Data Points */}
        <div className="relative h-48">
          {items.map((item, index) => (
            <button
              key={item.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all hover:scale-125 cursor-pointer"
              style={{
                left: getItemPosition(index, items.length),
              }}
              onClick={() => setSelectedItem(item)}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                style={{ backgroundColor: getItemColor(item.type) }}
              />
            </button>
          ))}
        </div>

        {/* Labels */}
        <div className="relative h-16 mt-4">
          <div className="absolute left-0 text-sm text-gray-600">
            {items[0] && new Date(items[0].timestamp).toLocaleDateString()}
          </div>
          <div className="absolute right-0 text-sm text-gray-600">
            Now
          </div>
        </div>
      </div>

      {/* Modal */}
      <TimelineModal
        item={selectedItem}
        allItems={items}
        onClose={() => setSelectedItem(null)}
        onNavigate={handleNavigation}
      />
    </div>
  );
}
```

### Phase 3: Modal Component

**File**: `components/TimelineModal.tsx`

```typescript
"use client";

import { TimelineItem, Capture, MediaItem, Document } from '@/types/timeline';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';

type TimelineModalProps = {
  item: TimelineItem | null;
  allItems: TimelineItem[];
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
};

export default function TimelineModal({
  item,
  allItems,
  onClose,
  onNavigate,
}: TimelineModalProps) {
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!item) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigate('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigate('next');
      }
    };

    if (item) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [item, onClose, onNavigate]);

  if (!item) return null;

  const currentIndex = allItems.findIndex(i => i.id === item.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allItems.length - 1;
  const positionText = `${currentIndex + 1} of ${allItems.length}`;

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderContent = () => {
    switch (item.type) {
      case 'capture': {
        const capture = item.data as Capture;
        return (
          <div className="space-y-4">
            {capture.file_url && (
              <div className="bg-gray-100 rounded-lg p-4">
                <audio controls className="w-full">
                  <source src={capture.file_url} type="audio/m4a" />
                </audio>
              </div>
            )}
            {capture.transcription && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase">
                  Transcription
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {capture.transcription}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'media': {
        const media = item.data as MediaItem;
        return (
          <div className="space-y-4">
            <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {media.file_type === 'image' ? (
                <img
                  src={media.file_url}
                  alt={media.caption || 'Media'}
                  className="max-h-[60vh] object-contain"
                />
              ) : (
                <video
                  src={media.file_url}
                  controls
                  className="max-h-[60vh] object-contain"
                />
              )}
            </div>
            {media.caption && (
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-2 uppercase">
                  Caption
                </h3>
                <p className="text-gray-800">{media.caption}</p>
              </div>
            )}
            {media.tags && media.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {media.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-teal-100 text-teal-700 text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'document': {
        const doc = item.data as Document;
        return (
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">{doc.title}</h2>
            {/* Render TipTap content - you'll need a read-only TipTap renderer */}
            <div className="prose max-w-none">
              {/* TODO: Implement TipTap content renderer */}
              <p className="text-gray-600 italic">
                Document content preview (implement TipTap renderer)
              </p>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm uppercase tracking-wide text-gray-500">
                {item.type}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {formatTimestamp(item.timestamp)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('prev')}
              disabled={!hasPrev}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-gray-600 px-2">
              {positionText}
            </span>
            <button
              onClick={() => onNavigate('next')}
              disabled={!hasNext}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Phase 4: Page Integration

**File**: `app/timeline/page.tsx`

```typescript
import PublicTimeline from '@/components/PublicTimeline';

export default function TimelinePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            The Journey
          </h1>
          <p className="text-xl text-gray-600">
            Every capture, every moment, telling the story of Ki
          </p>
        </header>

        <PublicTimeline />
      </div>
    </main>
  );
}
```

---

## Part 5: Advanced Features & Enhancements

### 5.1 Filtering & Search

Add filters to show/hide different content types:

```typescript
const [visibleTypes, setVisibleTypes] = useState<Set<string>>(
  new Set(['capture', 'media', 'document'])
);

// Filter button component
<div className="flex gap-2 mb-4">
  <button onClick={() => toggleType('capture')}>
    Captures {visibleTypes.has('capture') ? '✓' : ''}
  </button>
  <button onClick={() => toggleType('media')}>
    Media {visibleTypes.has('media') ? '✓' : ''}
  </button>
  <button onClick={() => toggleType('document')}>
    Journals {visibleTypes.has('document') ? '✓' : ''}
  </button>
</div>
```

### 5.2 Featured Journals Section

Create a separate view for public documents:

```typescript
// components/FeaturedJournals.tsx
export default function FeaturedJournals() {
  const [journals, setJournals] = useState<Document[]>([]);

  // Fetch only public documents
  // Display as cards with preview
  // Click to expand full view
}
```

### 5.3 Storytelling Elements

Add narrative sections between timeline segments:

```typescript
const milestones = [
  {
    date: '2024-01-01',
    title: 'The Beginning',
    description: 'Where it all started...',
  },
  // ... more milestones
];

// Render milestones as markers on timeline
```

### 5.4 Analytics & Insights

Display public stats:
- Total captures made
- Journey duration
- Most active periods
- Tag cloud from media items

---

## Part 6: Styling & Design Considerations

### 6.1 Color Palette

Maintain consistency with builder-ki:

```css
:root {
  --accent: #af3029;      /* red - captures */
  --accent-2: #3aa99f;    /* teal - media */
  --gold: #D4A574;        /* gold - documents */
  --purple: #A274D4;      /* purple - reflections */
}
```

### 6.2 Responsive Design

- Desktop: Full horizontal timeline
- Tablet: Scrollable horizontal timeline
- Mobile: Convert to vertical timeline stack

### 6.3 Performance Optimization

- Implement virtual scrolling for large timelines
- Lazy load media content
- Cache timeline data
- Optimize images from Supabase storage

---

## Part 7: Deployment Checklist

- [ ] Environment variables configured
- [ ] Supabase RLS policies enabled for public access
- [ ] Types defined and shared
- [ ] Timeline component implemented
- [ ] Modal component with navigation
- [ ] Responsive design tested
- [ ] SEO metadata added
- [ ] Analytics tracking (optional)
- [ ] Performance testing
- [ ] Deploy to production

---

## Part 8: Future Enhancements

1. **Interactive Map**: Show location data if available
2. **Audio Waveforms**: Visualize voice captures
3. **Tag-based Navigation**: Jump to specific topics
4. **Cycle Overlay**: Show menstrual cycle context on timeline
5. **Collaborative Features**: Comments on public items (optional)
6. **Export Timeline**: Download journey as PDF/images
7. **Embed Widgets**: Share timeline snippets on other platforms

---

## Questions for Refinement

Before building, let's discuss:

1. **Timeline Style**: Linear horizontal, radial, or lanes? (Recommendation: Linear horizontal)
2. **Journals Display**: Integrated in timeline or separate featured section?
3. **Access Control**: Should this be completely public or require a password/link?
4. **Content Curation**: Auto-publish when marked public, or manual selection?
5. **Storytelling Approach**: Chronological only, or add narrative sections/chapters?
6. **Media Handling**: Full resolution or optimized previews?

---

## Next Steps

1. Review this implementation guide
2. Discuss feature priorities and design preferences
3. Set up Supabase connection on racheltomasetti.com
4. Start with Phase 1 (data fetching)
5. Build Timeline component
6. Test with real data
7. Iterate on design and UX

This guide provides a complete roadmap from database connection to deployed timeline. The modular approach allows you to build incrementally and enhance over time.
