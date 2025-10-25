"""
Populate Neo4j Knowledge Graph from Supabase Data

This script reads captures and insights from Supabase and creates
a knowledge graph in Neo4j with proper nodes and relationships.

Usage:
    python scripts/populate_neo4j.py [--backfill] [--watch]

Options:
    --backfill: Process all existing captures (one-time sync)
    --watch: Continuously poll for new captures (daemon mode)
"""

import os
import sys
import time
from datetime import datetime
from typing import List, Dict, Any
import argparse

# Install required packages if needed:
# pip install neo4j supabase python-dotenv

from neo4j import GraphDatabase
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "builderki123")

# Initialize clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
neo4j_driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


def escape_string(s: str) -> str:
    """Escape special characters for Cypher queries"""
    if not s:
        return ""
    return s.replace("\\", "\\\\").replace('"', '\\"').replace("'", "\\'")


def create_capture_node(tx, capture: Dict[str, Any]):
    """Create a Capture node in Neo4j"""
    query = """
    MERGE (c:Capture {id: $capture_id})
    SET c.user_id = $user_id,
        c.created_at = $created_at,
        c.transcription = $transcription,
        c.type = $type,
        c.processing_status = $processing_status
    RETURN c
    """

    tx.run(query,
        capture_id=capture['id'],
        user_id=capture['user_id'],
        created_at=capture['created_at'],
        transcription=capture.get('transcription'),
        type=capture.get('type', 'voice'),
        processing_status=capture.get('processing_status', 'unknown')
    )


def create_insight_nodes(tx, capture_id: str, insights: List[Dict[str, Any]]):
    """Create Insight/Decision/Question/Concept nodes and link to Capture"""

    for insight in insights:
        insight_type = insight['type']  # insight, decision, question, concept
        content = insight['content']

        if insight_type == 'concept':
            # Concepts use 'name' property and MENTIONS relationship
            query = """
            MATCH (c:Capture {id: $capture_id})
            MERGE (n:Concept {name: $content})
            SET n.created_at = coalesce(n.created_at, $created_at)
            MERGE (c)-[:MENTIONS]->(n)
            RETURN n
            """
        else:
            # Map insight types to node labels
            node_label_map = {
                'insight': 'Insight',
                'decision': 'Decision',
                'question': 'Question'
            }
            node_label = node_label_map.get(insight_type, 'Insight')

            # Create node with EXTRACTED_FROM relationship
            query = f"""
            MATCH (c:Capture {{id: $capture_id}})
            CREATE (n:{node_label} {{
                id: randomUUID(),
                content: $content,
                type: $insight_type,
                created_at: $created_at
            }})
            MERGE (c)-[:EXTRACTED_FROM]->(n)
            RETURN n
            """

        tx.run(query,
            capture_id=capture_id,
            content=content,
            insight_type=insight_type,
            created_at=insight.get('created_at', datetime.now().isoformat())
        )


def link_related_concepts(tx):
    """Create RELATED_TO relationships between Concepts mentioned in same Capture"""
    query = """
    MATCH (c:Capture)-[:MENTIONS]->(concept1:Concept)
    MATCH (c)-[:MENTIONS]->(concept2:Concept)
    WHERE concept1 <> concept2
    MERGE (concept1)-[r:RELATED_TO]-(concept2)
    ON CREATE SET r.co_occurrences = 1
    ON MATCH SET r.co_occurrences = r.co_occurrences + 1
    """
    tx.run(query)


def process_capture(capture_id: str) -> bool:
    """
    Process a single capture: create nodes and relationships in Neo4j
    Returns True if successful, False otherwise
    """
    try:
        # Fetch capture from Supabase
        capture_response = supabase.table('captures').select('*').eq('id', capture_id).execute()

        if not capture_response.data:
            print(f"❌ Capture {capture_id} not found in Supabase")
            return False

        capture = capture_response.data[0]

        # Only process completed captures with transcriptions
        if capture.get('processing_status') != 'complete':
            print(f"⏭️  Skipping {capture_id}: status is '{capture.get('processing_status')}'")
            return False

        if not capture.get('transcription'):
            print(f"⏭️  Skipping {capture_id}: no transcription")
            return False

        # Fetch insights for this capture
        insights_response = supabase.table('insights').select('*').eq('capture_id', capture_id).execute()
        insights = insights_response.data or []

        print(f"📊 Processing capture {capture_id[:8]}... ({len(insights)} insights)")

        # Create Neo4j nodes and relationships
        with neo4j_driver.session() as session:
            # Create Capture node
            session.execute_write(create_capture_node, capture)

            # Create Insight/Decision/Question/Concept nodes
            if insights:
                session.execute_write(create_insight_nodes, capture_id, insights)

            # Link related concepts
            session.execute_write(link_related_concepts)

        print(f"✅ Successfully processed capture {capture_id[:8]}")
        return True

    except Exception as e:
        print(f"❌ Error processing capture {capture_id}: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


def backfill_all_captures():
    """Process all captures in Supabase (one-time sync)"""
    print("\n🔄 Starting backfill of all captures...\n")

    try:
        # Fetch all captures with status='complete'
        response = supabase.table('captures')\
            .select('id, created_at, processing_status')\
            .eq('processing_status', 'complete')\
            .order('created_at')\
            .execute()

        captures = response.data or []
        total = len(captures)

        if total == 0:
            print("ℹ️  No completed captures found to process")
            return

        print(f"📦 Found {total} completed captures to process\n")

        successful = 0
        failed = 0

        for i, capture in enumerate(captures, 1):
            capture_id = capture['id']
            created_at = capture['created_at']

            print(f"[{i}/{total}] Processing capture from {created_at[:10]}...")

            if process_capture(capture_id):
                successful += 1
            else:
                failed += 1

            # Small delay to avoid overwhelming the APIs
            time.sleep(0.5)

        print(f"\n✅ Backfill complete!")
        print(f"   Successful: {successful}")
        print(f"   Failed: {failed}")
        print(f"   Total: {total}\n")

    except Exception as e:
        print(f"\n❌ Backfill failed: {str(e)}")
        import traceback
        traceback.print_exc()


def watch_for_new_captures(poll_interval: int = 10):
    """Continuously poll for new captures and process them (daemon mode)"""
    print(f"\n👀 Watching for new captures (polling every {poll_interval}s)...")
    print("   Press Ctrl+C to stop\n")

    processed_ids = set()

    try:
        while True:
            try:
                # Fetch recent complete captures
                response = supabase.table('captures')\
                    .select('id, created_at')\
                    .eq('processing_status', 'complete')\
                    .order('created_at', desc=True)\
                    .limit(50)\
                    .execute()

                captures = response.data or []

                for capture in captures:
                    capture_id = capture['id']

                    # Skip if already processed
                    if capture_id in processed_ids:
                        continue

                    print(f"🆕 New capture detected: {capture_id[:8]}...")

                    if process_capture(capture_id):
                        processed_ids.add(capture_id)

                # Clean up old IDs from set (keep last 1000)
                if len(processed_ids) > 1000:
                    processed_ids = set(list(processed_ids)[-1000:])

            except Exception as e:
                print(f"⚠️  Error during watch cycle: {str(e)}")

            # Wait before next poll
            time.sleep(poll_interval)

    except KeyboardInterrupt:
        print("\n\n👋 Stopped watching. Goodbye!")


def test_connections():
    """Test connections to Supabase and Neo4j"""
    print("🔌 Testing connections...\n")

    # Test Supabase
    try:
        response = supabase.table('captures').select('id').limit(1).execute()
        print("✅ Supabase connection: OK")
    except Exception as e:
        print(f"❌ Supabase connection: FAILED - {str(e)}")
        return False

    # Test Neo4j
    try:
        with neo4j_driver.session() as session:
            result = session.run("RETURN 1 as test")
            result.single()
        print("✅ Neo4j connection: OK")
    except Exception as e:
        print(f"❌ Neo4j connection: FAILED - {str(e)}")
        print(f"   Make sure Neo4j is running on {NEO4J_URI}")
        return False

    print()
    return True


def clear_neo4j_database():
    """Clear all nodes and relationships from Neo4j (use with caution!)"""
    print("\n⚠️  WARNING: This will delete ALL data in Neo4j!")
    confirm = input("Type 'DELETE ALL' to confirm: ")

    if confirm == "DELETE ALL":
        try:
            with neo4j_driver.session() as session:
                session.run("MATCH (n) DETACH DELETE n")
            print("✅ Neo4j database cleared\n")
        except Exception as e:
            print(f"❌ Failed to clear database: {str(e)}\n")
    else:
        print("❌ Cancelled\n")


def main():
    parser = argparse.ArgumentParser(description='Populate Neo4j from Supabase')
    parser.add_argument('--backfill', action='store_true',
                        help='Process all existing captures (one-time sync)')
    parser.add_argument('--watch', action='store_true',
                        help='Continuously watch for new captures')
    parser.add_argument('--clear', action='store_true',
                        help='Clear all Neo4j data (use with caution!)')
    parser.add_argument('--test', action='store_true',
                        help='Test connections to Supabase and Neo4j')
    parser.add_argument('--capture-id', type=str,
                        help='Process a specific capture by ID')

    args = parser.parse_args()

    # Test connections first
    if not test_connections():
        print("❌ Connection test failed. Fix connections before proceeding.")
        sys.exit(1)

    # Handle commands
    if args.clear:
        clear_neo4j_database()

    elif args.test:
        print("✅ All connections working!")

    elif args.capture_id:
        print(f"\n🎯 Processing single capture: {args.capture_id}\n")
        process_capture(args.capture_id)

    elif args.backfill:
        backfill_all_captures()

    elif args.watch:
        watch_for_new_captures()

    else:
        # No arguments - show help and offer interactive menu
        parser.print_help()
        print("\n" + "="*60)
        print("Interactive Mode:")
        print("="*60)
        print("1. Test connections")
        print("2. Backfill all captures")
        print("3. Watch for new captures")
        print("4. Clear Neo4j database")
        print("5. Exit")

        choice = input("\nChoose an option (1-5): ").strip()

        if choice == '1':
            print("✅ Connections already tested above!")
        elif choice == '2':
            backfill_all_captures()
        elif choice == '3':
            watch_for_new_captures()
        elif choice == '4':
            clear_neo4j_database()
        elif choice == '5':
            print("👋 Goodbye!")
        else:
            print("❌ Invalid choice")

    # Close Neo4j driver
    neo4j_driver.close()


if __name__ == "__main__":
    main()
