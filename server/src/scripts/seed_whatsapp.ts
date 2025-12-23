// scripts/seed_whatsapp.ts
// Seed WhatsApp Integration data

import { query, closePool } from '../infrastructure/database/index.js';

async function seedWhatsApp() {
  try {
    console.log('🌱 Starting WhatsApp seed...');

    // Get tenant
    const tenantRes = await query(`SELECT id FROM tenants WHERE slug = 'demo-travel' LIMIT 1`);
    if (tenantRes.rows.length === 0) {
      throw new Error('Tenant not found. Run main seed first.');
    }
    const tenantId = tenantRes.rows[0].id;

    // Get users for created_by references
    const usersRes = await query(`SELECT id FROM users WHERE tenant_id = $1 LIMIT 1`, [tenantId]);
    const userId = usersRes.rows[0]?.id || null;

    // Get contacts
    const contactsRes = await query(
      `SELECT id, first_name, last_name, phone FROM contacts WHERE tenant_id = $1 LIMIT 30`,
      [tenantId]
    );
    const contacts = contactsRes.rows;

    console.log(`Found ${contacts.length} contacts for WhatsApp data...`);

    // Cleanup WhatsApp data
    console.log('Cleaning WhatsApp data...');
    await query('DELETE FROM unified_timeline WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM whatsapp_messages WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM whatsapp_conversation_entities WHERE conversation_id IN (SELECT id FROM whatsapp_conversations WHERE tenant_id = $1)', [tenantId]);
    await query('DELETE FROM whatsapp_conversations WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM whatsapp_templates WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM whatsapp_opt_ins WHERE tenant_id = $1', [tenantId]);

    // 1. Create Message Templates
    console.log('Creating Message Templates...');
    const templates = [
      {
        name: 'booking_confirmation',
        category: 'UTILITY',
        useCase: 'BOOKING_CONFIRMATION',
        language: 'en',
        body: 'Hi {{1}}! Your booking for {{2}} is confirmed. Trip starts on {{3}}. Reference: {{4}}',
        status: 'APPROVED'
      },
      {
        name: 'payment_reminder',
        category: 'UTILITY',
        useCase: 'PAYMENT_REMINDER',
        language: 'en',
        body: 'Dear {{1}}, your payment of ₹{{2}} for {{3}} is pending. Please complete by {{4}}.',
        status: 'APPROVED'
      },
      {
        name: 'welcome_message',
        category: 'MARKETING',
        useCase: 'WELCOME',
        language: 'en',
        body: 'Welcome to Demo Travel! 🌍 Explore amazing destinations with us. Check our latest packages: {{1}}',
        status: 'APPROVED'
      },
      {
        name: 'trip_reminder',
        category: 'UTILITY',
        useCase: 'TRIP_REMINDER',
        language: 'en',
        body: 'Hi {{1}}! Your trip to {{2}} starts in {{3}} days. Meeting point: {{4}} at {{5}}.',
        status: 'APPROVED'
      },
      {
        name: 'feedback_request',
        category: 'UTILITY',
        useCase: 'FEEDBACK',
        language: 'en',
        body: 'Thank you for traveling with us, {{1}}! How was your {{2}} experience? Rate us: {{3}}',
        status: 'APPROVED'
      },
      {
        name: 'special_offer',
        category: 'MARKETING',
        useCase: 'PROMOTION',
        language: 'en',
        body: '🎉 Special Offer! {{1}} Get {{2}}% off on {{3}}. Book now: {{4}}. Valid till {{5}}.',
        status: 'APPROVED'
      }
    ];

    const templateIds: Record<string, string> = {};
    for (const t of templates) {
      const res = await query(
        `INSERT INTO whatsapp_templates (
          tenant_id, template_name, category, use_case, language, body_content, status, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [
          tenantId, t.name, t.category, t.useCase, t.language, t.body, t.status, userId
        ]
      );
      templateIds[t.name] = res.rows[0].id;
    }

    // 2. Create Opt-Ins
    console.log('Creating Opt-Ins...');
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const optedIn = i < 25; // Most contacts opted in
      
      await query(
        `INSERT INTO whatsapp_opt_ins (
          tenant_id, phone_number, contact_id, status, source, consent_text,
          allow_utility_messages, allow_marketing_messages
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          tenantId, contact.phone || `+919${String(i).padStart(9, '0')}`,
          contact.id, optedIn ? 'OPTED_IN' : 'PENDING',
          'WEBSITE', 'I consent to receive WhatsApp messages from Demo Travel',
          true, optedIn && i < 20
        ]
      );
    }

    // 3. Create Conversations
    console.log('Creating Conversations...');
    const conversationIds: string[] = [];
    
    for (let i = 0; i < Math.min(contacts.length, 20); i++) {
      const contact = contacts[i];
      const status = i < 10 ? 'ACTIVE' : (i < 15 ? 'PENDING' : 'IDLE');
      const phone = contact.phone || `+919${String(i).padStart(9, '0')}`;
      
      const sessionExpiry = new Date();
      sessionExpiry.setHours(sessionExpiry.getHours() + 24);
      
      const res = await query(
        `INSERT INTO whatsapp_conversations (
          tenant_id, whatsapp_thread_id, primary_actor_type, primary_actor_contact_id,
          primary_actor_phone, primary_actor_name, state, session_expires_at, message_count
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
        [
          tenantId, `thread_${phone.replace('+', '')}`,
          'CONTACT', contact.id, phone,
          `${contact.first_name} ${contact.last_name}`,
          status, sessionExpiry, Math.floor(Math.random() * 20) + 1
        ]
      );
      conversationIds.push(res.rows[0].id);
    }

    // 4. Create Messages
    console.log('Creating Messages...');
    const messageTypes = ['text', 'text', 'text', 'image', 'document'];
    const directions = ['INBOUND', 'OUTBOUND'];
    
    let messageCount = 0;
    for (let i = 0; i < conversationIds.length; i++) {
      const conversationId = conversationIds[i];
      const contact = contacts[i];
      const phone = contact.phone || `+919${String(i).padStart(9, '0')}`;
      const numMessages = 5 + Math.floor(Math.random() * 15);
      
      for (let j = 0; j < numMessages; j++) {
        const direction = directions[j % 2];
        const messageType = messageTypes[j % messageTypes.length];
        const timestamp = new Date();
        timestamp.setMinutes(timestamp.getMinutes() - (numMessages - j) * 30);
        
        const senderPhone = direction === 'INBOUND' ? phone : '+919999999999';
        const recipientPhone = direction === 'INBOUND' ? '+919999999999' : phone;
        
        const textContent = messageType === 'text' ? JSON.stringify({
          body: direction === 'INBOUND' 
            ? ['Hi, I want to book a trek', 'What are the available dates?', 'How much does it cost?', 'I want to confirm my booking', 'Thank you!'][j % 5]
            : ['Hello! Welcome to Demo Travel', 'We have departures every weekend', 'The cost is ₹15,000 per person', 'Your booking is confirmed!', 'Have a great trip!'][j % 5]
        }) : null;
        
        await query(
          `INSERT INTO whatsapp_messages (
            tenant_id, conversation_id, provider_message_id, provider_timestamp,
            direction, sender_phone, recipient_phone, message_type, text_content,
            status, idempotency_key
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            tenantId, conversationId, `wamid.${Date.now()}${messageCount}`,
            timestamp, direction, senderPhone, recipientPhone, messageType,
            textContent, direction === 'OUTBOUND' ? 'DELIVERED' : 'RECEIVED',
            `idem_${tenantId}_${conversationId}_${j}`
          ]
        );
        messageCount++;
      }
    }

    // 5. Create Unified Timeline entries
    console.log('Creating Timeline entries...');
    const entryTypes = ['WHATSAPP_MESSAGE', 'STATUS_CHANGE', 'NOTE', 'CALL'];
    
    for (let i = 0; i < 50; i++) {
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - Math.floor(Math.random() * 72));
      
      await query(
        `INSERT INTO unified_timeline (
          tenant_id, source, entry_type, visibility, actor_id, actor_type, actor_name,
          title, description, occurred_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          tenantId, 'WHATSAPP', entryTypes[i % entryTypes.length], 'INTERNAL',
          userId || 'system', 'USER', 'System',
          `Activity ${i + 1}`, `Timeline entry description ${i + 1}`,
          timestamp
        ]
      );
    }

    console.log('✅ WhatsApp seed completed successfully!');
    console.log(`Created: ${Object.keys(templateIds).length} templates, ${contacts.length} opt-ins, ${conversationIds.length} conversations, ${messageCount} messages, 50 timeline entries`);

  } catch (error) {
    console.error('❌ WhatsApp seed failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

seedWhatsApp();
