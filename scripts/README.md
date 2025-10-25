# Neo4j Population Script

This script reads captures and insights from Supabase and populates the Neo4j knowledge graph.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r scripts/requirements.txt
```

### 2. Make Sure Docker is Running

```bash
docker-compose up -d
```

This starts Neo4j on `localhost:7687`

### 3. Run the Script

**Test connections:**
```bash
python scripts/populate_neo4j.py --test
```

**Backfill all existing captures (one-time):**
```bash
python scripts/populate_neo4j.py --backfill
```

**Watch for new captures (daemon mode):**
```bash
python scripts/populate_neo4j.py --watch
```

**Process a specific capture:**
```bash
python scripts/populate_neo4j.py --capture-id <capture-uuid>
```

**Clear Neo4j database (careful!):**
```bash
python scripts/populate_neo4j.py --clear
```

## What It Does

### 1. Reads from Supabase

- Fetches completed captures (status='complete')
- Fetches insights linked to each capture
- Only processes captures that have transcriptions

### 2. Creates Neo4j Nodes

- **Capture** nodes (id, user_id, created_at, transcription, type, processing_status)
- **Insight** nodes (content, type, created_at)
- **Decision** nodes (content, created_at)
- **Question** nodes (content, created_at)
- **Concept** nodes (name, created_at)

### 3. Creates Relationships

- `(Capture)-[:EXTRACTED_FROM]->(Insight/Decision/Question)`
- `(Capture)-[:MENTIONS]->(Concept)`
- `(Concept)-[:RELATED_TO]-(Concept)` (when concepts appear in same capture)

## Workflow

### Initial Setup (Run Once)

```bash
# 1. Start Docker
docker-compose up -d

# 2. Install Python dependencies
pip install -r scripts/requirements.txt

# 3. Test connections
python scripts/populate_neo4j.py --test

# 4. Backfill existing data
python scripts/populate_neo4j.py --backfill
```

### Ongoing Usage (Two Options)

**Option A: Run in watch mode (daemon)**
```bash
# Continuously poll for new captures and process them
python scripts/populate_neo4j.py --watch
```

**Option B: Run after each capture manually**
```bash
# After you capture a voice note and it processes, run:
python scripts/populate_neo4j.py --backfill
```

**Option C: Add to n8n workflow (future)**
Once n8n's Neo4j node issues are resolved, this logic can be ported to n8n.

## Verifying It Worked

### Check Neo4j Browser

1. Open http://localhost:7474
2. Login: `neo4j` / `builderki123`
3. Run queries:

```cypher
// See all captures
MATCH (c:Capture) RETURN c LIMIT 10

// See all insights with their captures
MATCH (c:Capture)-[:EXTRACTED_FROM]->(i:Insight)
RETURN c, i LIMIT 10

// See all concepts
MATCH (concept:Concept) RETURN concept

// See concept relationships
MATCH (c1:Concept)-[r:RELATED_TO]-(c2:Concept)
RETURN c1, r, c2 LIMIT 20
```

## Troubleshooting

### Neo4j Connection Failed

**Error:** `Failed to establish connection`

**Solutions:**
1. Make sure Docker is running: `docker ps`
2. Check if Neo4j container is up: `docker-compose ps`
3. Restart Neo4j: `docker-compose restart neo4j`
4. Check Neo4j logs: `docker-compose logs neo4j`

### Supabase Connection Failed

**Error:** `Invalid API key` or connection timeout

**Solutions:**
1. Check your `.env` file has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Make sure you're using the **anon/public** key, not the service role key
3. Test in browser: Visit your Supabase URL in a browser to verify it's accessible

### No Captures Found

**Message:** `No completed captures found to process`

**Possible reasons:**
1. No captures exist in Supabase yet
2. Captures exist but processing_status is not 'complete'
3. Run n8n workflow first to process captures

**To check:**
```sql
-- Run in Supabase SQL Editor
SELECT id, processing_status, created_at
FROM captures
ORDER BY created_at DESC
LIMIT 10;
```

### Script Crashes During Backfill

**Error:** Script stops midway through processing

**Solutions:**
1. Check which capture failed (look at the error message for capture ID)
2. Process that capture individually: `python scripts/populate_neo4j.py --capture-id <id>`
3. Skip it and continue: Comment out the failing capture in Supabase or mark it as 'failed'

## Environment Variables

The script reads from your root `.env` or `.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Neo4j (optional - defaults shown)
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=builderki123
```

## Performance Notes

- **Backfill speed**: ~2 captures/second (with 0.5s delay between each)
- **Watch mode polling**: Every 10 seconds by default
- **Batch size**: Processes last 50 captures in watch mode

## Next Steps

Once this is working, you can:

1. **Test agent queries**: Update the agent to query Neo4j for "What have I been thinking about X?"
2. **Add emotion detection**: Update Claude synthesis prompt to extract emotions
3. **Port to n8n**: Once n8n's Neo4j node works, move this logic into the workflow
4. **Add more relationships**: Connect insights that relate to each other, track concept evolution

---

**Need help?** Check the main [PHASE1-ROADMAP.md](../docs/PHASE1-ROADMAP.md) for the bigger picture.
