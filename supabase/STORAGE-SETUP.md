# Storage Bucket Setup for Ki

## Issue
Mobile app cannot upload files to Supabase Storage due to RLS policies blocking uploads.

## Required Storage Buckets

You need to create three storage buckets with proper policies:

1. **voice-notes**
2. **photos**
3. **videos**

## Steps to Fix

### 1. Go to Storage in Supabase Dashboard

1. Open your Supabase project dashboard
2. Click **Storage** in the left sidebar
3. You should see your buckets (voice-notes, photos, videos)

### 2. Configure Each Bucket

For **EACH** of the three buckets (voice-notes, photos, videos):

#### A. Check if bucket exists, if not create it:
- Click "New bucket"
- Name: `voice-notes` (or `photos` or `videos`)
- **Public bucket**: YES (check this box)
- Click "Create bucket"

#### B. Set up RLS Policies for the bucket:

1. Click on the bucket name
2. Click "Policies" tab at the top
3. Click "New Policy"
4. Click "Create policy from scratch"

**Policy 1: Allow authenticated users to INSERT**
- Policy name: `Users can upload own files`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- USING expression (leave blank for INSERT)
- WITH CHECK expression:
```sql
(bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1])
```
(Replace `voice-notes` with `photos` or `videos` for those buckets)

**Policy 2: Allow authenticated users to SELECT**
- Click "New Policy" again
- Policy name: `Users can view own files`
- Allowed operation: `SELECT`
- Target roles: `authenticated`
- USING expression:
```sql
(bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1])
```
(Replace `voice-notes` with `photos` or `videos` for those buckets)

**Policy 3: Allow authenticated users to UPDATE**
- Click "New Policy" again
- Policy name: `Users can update own files`
- Allowed operation: `UPDATE`
- Target roles: `authenticated`
- USING expression:
```sql
(bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1])
```
WITH CHECK expression:
```sql
(bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1])
```
(Replace `voice-notes` with `photos` or `videos` for those buckets)

**Policy 4: Allow authenticated users to DELETE**
- Click "New Policy" again
- Policy name: `Users can delete own files`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- USING expression:
```sql
(bucket_id = 'voice-notes' AND auth.uid()::text = (storage.foldername(name))[1])
```
(Replace `voice-notes` with `photos` or `videos` for those buckets)

### 3. Verify Bucket Configuration

For each bucket, verify:
- ✅ Bucket is **public**
- ✅ Has 4 policies (INSERT, SELECT, UPDATE, DELETE)
- ✅ All policies target `authenticated` role
- ✅ File path structure matches: `{user_id}/{timestamp}.{ext}`

## Quick Alternative: Disable RLS for Development (NOT RECOMMENDED FOR PRODUCTION)

If you just want to test quickly, you can temporarily disable RLS on the storage buckets:

1. Go to Storage → Select bucket → Policies
2. At the top, toggle off "Enable RLS"
3. This allows all operations (only do this for local development!)

## Why This Works

The app uploads files with this path structure:
```
{user_id}/{timestamp}.{extension}
```

Example: `5dbf2739-947c-424f-a649-fd4c3fd72692/1760540658976.m4a`

The RLS policies check that:
1. The first folder name in the path matches the authenticated user's ID
2. This ensures users can only upload/access their own files

The expression `(storage.foldername(name))[1]` extracts the first folder from the path.
