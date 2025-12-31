// scripts/test_whatsapp.ts
// Test WhatsApp API with dummy data

import { query, closePool } from '../infrastructure/database/index.js';
import { MockProvider } from '../infrastructure/whatsapp/providers/MockProvider.js';
import { generateId } from '../shared/utils/index.js';

/**
 * Test WhatsApp API functionality with dummy data
 */
async function testWhatsApp() {
  console.log('🧪 Starting WhatsApp API Tests...\n');

  // Get tenant
  const tenantRes = await query(`SELECT id FROM tenants WHERE slug = 'demo-travel' LIMIT 1`);
  if (tenantRes.rows.length === 0) {
    throw new Error('Tenant not found. Run main seed first: npx ts-node src/scripts/seed.ts');
  }
  const tenantId = tenantRes.rows[0].id;
  console.log(`✅ Found tenant: ${tenantId}\n`);

  // Initialize MockProvider for testing
  const mockProvider = new MockProvider();
  
  // =============================================
  // TEST 1: Health Check
  // =============================================
  console.log('📋 TEST 1: Provider Health Check');
  const isHealthy = await mockProvider.healthCheck();
  console.log(`   Health: ${isHealthy ? '✅ Healthy' : '❌ Unhealthy'}\n`);

  // =============================================
  // TEST 2: Send Text Message
  // =============================================
  console.log('📋 TEST 2: Send Text Message');
  const textResult = await mockProvider.sendMessage({
    recipientPhone: '+919876543210',
    messageType: 'TEXT',
    textContent: {
      body: 'Hello! Welcome to Demo Travel. Your booking inquiry has been received.',
    },
  });
  console.log(`   Result: ${textResult.success ? '✅ Sent' : '❌ Failed'}`);
  console.log(`   Message ID: ${textResult.providerMessageId}\n`);

  // =============================================
  // TEST 3: Send Template Message
  // =============================================
  console.log('📋 TEST 3: Send Template Message');
  const templateResult = await mockProvider.sendTemplate(
    '+919876543210',
    'booking_confirmation',
    'en',
    [
      { type: 'body', parameters: [
        { type: 'text', text: 'Rahul' },
        { type: 'text', text: 'Ladakh Adventure Trek' },
        { type: 'text', text: 'January 15, 2025' },
        { type: 'text', text: 'BK-2025-001' },
      ]},
    ]
  );
  console.log(`   Result: ${templateResult.success ? '✅ Sent' : '❌ Failed'}`);
  console.log(`   Template Message ID: ${templateResult.providerMessageId}\n`);

  // =============================================
  // TEST 4: Simulate Incoming Message (Webhook)
  // =============================================
  console.log('📋 TEST 4: Simulate Incoming Message');
  const incomingPayload = mockProvider.simulateIncomingMessage(
    '+919876543210',
    'Hi, I want to book a trek to Ladakh'
  );
  const parsedMessage = mockProvider.parseWebhookMessage(incomingPayload);
  if (parsedMessage) {
    console.log(`   From: ${parsedMessage.senderPhone}`);
    console.log(`   Type: ${parsedMessage.messageType}`);
    console.log(`   Text: ${parsedMessage.textContent?.body}`);
    console.log(`   ✅ Parsed successfully\n`);
  } else {
    console.log(`   ❌ Failed to parse\n`);
  }

  // =============================================
  // TEST 5: Upload Media
  // =============================================
  console.log('📋 TEST 5: Upload Media');
  const mediaBuffer = Buffer.from('fake-image-content');
  const uploadResult = await mockProvider.uploadMedia(
    mediaBuffer,
    'image/jpeg',
    'itinerary.jpg'
  );
  console.log(`   Media ID: ${uploadResult.mediaId}`);
  console.log(`   URL: ${uploadResult.url}`);
  console.log(`   ✅ Uploaded successfully\n`);

  // =============================================
  // TEST 6: Check Database Operations
  // =============================================
  console.log('📋 TEST 6: Database Operations Check');
  
  // Check templates
  const templatesRes = await query(
    `SELECT COUNT(*) as count FROM whatsapp_templates WHERE tenant_id = $1`,
    [tenantId]
  );
  console.log(`   Templates in DB: ${templatesRes.rows[0].count}`);

  // Check conversations
  const convsRes = await query(
    `SELECT COUNT(*) as count, 
            COUNT(*) FILTER (WHERE state = 'ACTIVE') as active
     FROM whatsapp_conversations WHERE tenant_id = $1`,
    [tenantId]
  );
  console.log(`   Total Conversations: ${convsRes.rows[0].count}`);
  console.log(`   Active Conversations: ${convsRes.rows[0].active}`);

  // Check messages
  const msgsRes = await query(
    `SELECT COUNT(*) as count,
            COUNT(*) FILTER (WHERE direction = 'INBOUND') as inbound,
            COUNT(*) FILTER (WHERE direction = 'OUTBOUND') as outbound
     FROM whatsapp_messages WHERE tenant_id = $1`,
    [tenantId]
  );
  console.log(`   Total Messages: ${msgsRes.rows[0].count}`);
  console.log(`   Inbound: ${msgsRes.rows[0].inbound}, Outbound: ${msgsRes.rows[0].outbound}`);

  // Check opt-ins
  const optInsRes = await query(
    `SELECT COUNT(*) as count,
            COUNT(*) FILTER (WHERE status = 'OPTED_IN') as opted_in
     FROM whatsapp_opt_ins WHERE tenant_id = $1`,
    [tenantId]
  );
  console.log(`   Total Opt-Ins: ${optInsRes.rows[0].count}`);
  console.log(`   Opted-In: ${optInsRes.rows[0].opted_in}\n`);

  // =============================================
  // TEST 7: Create Test Conversation & Message
  // =============================================
  console.log('📋 TEST 7: Create Test Conversation & Message');
  
  const testPhone = `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  const testConvId = generateId();
  const testMsgId = generateId();
  
  // Session expiry - 24 hours from now
  const sessionExpiry = new Date();
  sessionExpiry.setHours(sessionExpiry.getHours() + 24);
  
  // Create conversation
  await query(
    `INSERT INTO whatsapp_conversations (
      id, tenant_id, whatsapp_thread_id, primary_actor_type, 
      primary_actor_phone, primary_actor_name, state, message_count, session_expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT DO NOTHING`,
    [
      testConvId, tenantId, `thread_test_${Date.now()}`,
      'CONTACT', testPhone, 'Test Customer', 'ACTIVE', 1, sessionExpiry
    ]
  );
  console.log(`   Created conversation: ${testConvId.substring(0, 8)}...`);

  // Create message
  await query(
    `INSERT INTO whatsapp_messages (
      id, tenant_id, conversation_id, provider_message_id, provider_timestamp,
      direction, sender_phone, recipient_phone, message_type, text_content,
      status, idempotency_key
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT DO NOTHING`,
    [
      testMsgId, tenantId, testConvId, `wamid.test_${Date.now()}`,
      new Date(), 'INBOUND', testPhone, '+919999999999', 'text',
      JSON.stringify({ body: 'This is a test message from API test script' }),
      'RECEIVED', `idem_test_${Date.now()}`
    ]
  );
  console.log(`   Created message: ${testMsgId.substring(0, 8)}...`);
  console.log(`   ✅ Database write successful\n`);

  // =============================================
  // TEST 8: Query Timeline Data
  // =============================================
  console.log('📋 TEST 8: Timeline Data');
  const timelineRes = await query(
    `SELECT entry_type, COUNT(*) as count 
     FROM unified_timeline 
     WHERE tenant_id = $1 
     GROUP BY entry_type`,
    [tenantId]
  );
  if (timelineRes.rows.length > 0) {
    console.log('   Timeline entries by type:');
    timelineRes.rows.forEach(row => {
      console.log(`     ${row.entry_type}: ${row.count}`);
    });
  } else {
    console.log('   No timeline entries found');
  }

  // =============================================
  // SUMMARY
  // =============================================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 WhatsApp API Tests Completed!');
  console.log('='.repeat(50));
  console.log('\n📌 Next Steps to test via HTTP:');
  console.log('   1. Start the server: npm run dev');
  console.log('   2. Use these endpoints:\n');
  console.log('   GET  /api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test');
  console.log('   POST /api/whatsapp/webhook (simulate incoming message)');
  console.log('   GET  /api/whatsapp/conversations');
  console.log('   GET  /api/whatsapp/templates');
  console.log('   POST /api/whatsapp/messages/send');
  console.log('\n📄 Sample cURL commands saved to: test_whatsapp_curl.md');
}

// Run tests
testWhatsApp()
  .then(() => {
    console.log('\n✅ All tests completed successfully');
    closePool();
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    closePool();
    process.exit(1);
  });
