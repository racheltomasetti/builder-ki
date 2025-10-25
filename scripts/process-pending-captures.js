// Script to manually trigger n8n workflow for pending captures
// Run with: node scripts/process-pending-captures.js

const https = require('https');
const http = require('http');

// Configuration
const SUPABASE_URL = 'https://appahnoqhkthiwidjjcn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwcGFobm9xaGt0aGl3aWRqamNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzNjYwMTYsImV4cCI6MjA3NTk0MjAxNn0.BbqEQJN4n5pzOLtuDWmJPmOCTP-EYMCSHrblVhWGdVU';
const N8N_WEBHOOK_URL = 'https://unquarrelling-chemosynthetically-kelsi.ngrok-free.dev/webhook/8cdb06ba-e882-4874-a409-39212de42eba';

// Fetch pending captures from Supabase
async function fetchPendingCaptures() {
  const url = `${SUPABASE_URL}/rest/v1/captures?processing_status=eq.pending&select=*`;

  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Failed to fetch captures: ${res.statusCode} ${data}`));
        }
      });
    }).on('error', reject);
  });
}

// Trigger n8n webhook for a capture
async function triggerWebhook(capture) {
  const payload = {
    type: 'INSERT',
    table: 'captures',
    record: capture,
    schema: 'public',
    old_record: null
  };

  const url = new URL(N8N_WEBHOOK_URL);
  const postData = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const protocol = url.protocol === 'https:' ? https : http;

    const req = protocol.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, data });
        } else {
          reject(new Error(`Webhook failed: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// Main execution
async function main() {
  try {
    console.log('🔍 Fetching pending captures from Supabase...');
    const captures = await fetchPendingCaptures();

    console.log(`📦 Found ${captures.length} pending capture(s)`);

    if (captures.length === 0) {
      console.log('✅ No pending captures to process');
      return;
    }

    console.log('\n🚀 Triggering n8n workflow for each capture...\n');

    for (let i = 0; i < captures.length; i++) {
      const capture = captures[i];
      console.log(`[${i + 1}/${captures.length}] Processing capture ${capture.id}...`);
      console.log(`   Type: ${capture.type}`);
      console.log(`   Created: ${capture.created_at}`);
      console.log(`   File: ${capture.file_url}`);

      try {
        await triggerWebhook(capture);
        console.log(`   ✅ Webhook triggered successfully`);
      } catch (error) {
        console.error(`   ❌ Failed to trigger webhook: ${error.message}`);
      }

      // Add a small delay between requests to avoid overwhelming n8n
      if (i < captures.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      console.log('');
    }

    console.log('🎉 Done! Check n8n at http://localhost:5678 to see workflow executions');
    console.log('💡 Tip: Refresh your Supabase captures table to see processing_status updates');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
