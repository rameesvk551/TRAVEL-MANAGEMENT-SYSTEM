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

    // Get contacts
    const contactsRes = await query(
      `SELECT id, first_name, last_name, phone FROM contacts WHERE tenant_id = $1 LIMIT 30`,
      [tenantId]
    );
    const contacts = contactsRes.rows;

    console.log(`Found ${contacts.length} contacts for WhatsApp data...`);

    // Cleanup WhatsApp data
    console.log('Cleaning WhatsApp data...');
    await query('DELETE FROM whatsapp.messages WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM whatsapp.conversations WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM whatsapp.templates WHERE tenant_id = $1', [tenantId]);
    await query('DELETE FROM whatsapp.campaigns WHERE tenant_id = $1', [tenantId]);

    // 1. Create Message Templates
    console.log('Creating Message Templates...');
    const templates = [
      {
        name: 'booking_confirmation',
        category: 'TRANSACTIONAL',
        language: 'en',
        content: 'Hi {{1}}! Your booking for {{2}} is confirmed. Trip starts on {{3}}. Reference: {{4}}',
        status: 'APPROVED'
      },
      {
        name: 'payment_reminder',
        category: 'TRANSACTIONAL',
        language: 'en',
        content: 'Dear {{1}}, your payment of ₹{{2}} for {{3}} is pending. Please complete by {{4}}.',
        status: 'APPROVED'
      },
      {
        name: 'welcome_message',
        category: 'MARKETING',
        language: 'en',
        content: 'Welcome to Demo Travel! 🌍 Explore amazing destinations with us. Check our latest packages: {{1}}',
        status: 'APPROVED'
      },
      {
        name: 'trip_reminder',
        category: 'UTILITY',
        language: 'en',
        content: 'Hi {{1}}! Your trip to {{2}} starts in {{3}} days. Meeting point: {{4}} at {{5}}.',
        status: 'APPROVED'
      },
      {
        name: 'feedback_request',
        category: 'UTILITY',
        language: 'en',
        content: 'Thank you for traveling with us, {{1}}! How was your {{2}} experience? Rate us: {{3}}',
        status: 'APPROVED'
      },
      {
        name: 'special_offer',
        category: 'MARKETING',
        language: 'en',
        content: '🎉 Special Offer! {{1}} Get {{2}}% off on {{3}}. Book now: {{4}}. Valid till {{5}}.',
        status: 'APPROVED'
      }
    ];

    const templateIds: Record<string, string> = {};
    for (const t of templates) {
      const res = await query(
        `INSERT INTO whatsapp.templates (
          tenant_id, name, category, language, content, status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          tenantId, t.name, t.category, t.language, t.content, t.status,
          JSON.stringify({ approvedAt: new Date(), variables: t.content.match(/\{\{\d+\}\}/g)?.length || 0 })
        ]
      );
      templateIds[t.name] = res.rows[0].id;
    }

    // 2. Create Conversations
    console.log('Creating Conversations...');
    const conversationIds: string[] = [];
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const status = i < 10 ? 'ACTIVE' : (i < 20 ? 'PENDING' : 'CLOSED');
      const lastMessageAt = new Date();
      lastMessageAt.setHours(lastMessageAt.getHours() - Math.floor(Math.random() * 48));
      
      const res = await query(
        `INSERT INTO whatsapp.conversations (
          tenant_id, phone_number, contact_name, status,
          last_message_at, unread_count, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          tenantId, 
          contact.phone,
          `${contact.first_name} ${contact.last_name}`,
          status,
          lastMessageAt,
          status === 'ACTIVE' ? Math.floor(Math.random() * 5) : 0,
          JSON.stringify({
            source: ['INBOUND', 'OUTBOUND', 'CAMPAIGN'][i % 3],
            tags: ['inquiry', 'booking', 'support'].slice(0, Math.floor(Math.random() * 3) + 1)
          })
        ]
      );
      conversationIds.push(res.rows[0].id);
    }

    // 3. Create Messages (250+ messages)
    console.log('Creating Messages...');
    const messageContents = [
      { direction: 'INBOUND', text: 'Hi, I\'m interested in the Manali trek package' },
      { direction: 'OUTBOUND', text: 'Hello! Thank you for your interest. Our Manali trek is a 10-day adventure.' },
      { direction: 'INBOUND', text: 'What\'s the cost per person?' },
      { direction: 'OUTBOUND', text: 'The package costs ₹50,000 per person including accommodation and meals.' },
      { direction: 'INBOUND', text: 'Are there any upcoming batches?' },
      { direction: 'OUTBOUND', text: 'Yes, we have departures on 15th Jan, 22nd Jan, and 5th Feb.' },
      { direction: 'INBOUND', text: 'Can I book for 2 people?' },
      { direction: 'OUTBOUND', text: 'Absolutely! I\'ll send you the booking form and payment details.' },
      { direction: 'INBOUND', text: 'What documents do I need?' },
      { direction: 'OUTBOUND', text: 'You\'ll need ID proof, medical certificate, and passport size photos.' },
      { direction: 'INBOUND', text: 'Is advance payment required?' },
      { direction: 'OUTBOUND', text: 'Yes, 30% advance to confirm your booking. Remaining 70% before departure.' },
      { direction: 'INBOUND', text: 'What about cancellation policy?' },
      { direction: 'OUTBOUND', text: 'Cancellation: 100% refund if cancelled 30+ days before. Check T&C for details.' },
      { direction: 'INBOUND', text: 'Sounds good! I\'ll confirm by tomorrow.' },
      { direction: 'OUTBOUND', text: 'Great! Let me know if you have any questions. Looking forward to your booking!' }
    ];

    for (let i = 0; i < 250; i++) {
      const convId = conversationIds[i % conversationIds.length];
      const msgTemplate = messageContents[i % messageContents.length];
      
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - (250 - i) * 15); // Spread over time
      
      const status = msgTemplate.direction === 'OUTBOUND' 
        ? ['SENT', 'DELIVERED', 'READ'][Math.floor(Math.random() * 3)]
        : 'RECEIVED';
      
      await query(
        `INSERT INTO whatsapp.messages (
          tenant_id, conversation_id, direction, type, content,
          status, timestamp, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          tenantId, convId, msgTemplate.direction, 'TEXT',
          JSON.stringify({ text: msgTemplate.text }),
          status, timestamp,
          JSON.stringify({
            messageId: `msg_${Date.now()}_${i}`,
            source: 'WHATSAPP_BUSINESS'
          })
        ]
      );
    }

    // 4. Create Campaigns
    console.log('Creating Campaigns...');
    const campaigns = [
      {
        name: 'Summer Specials 2024',
        templateId: templateIds['special_offer'],
        status: 'COMPLETED',
        scheduled: -7,
        sent: 450,
        delivered: 438,
        read: 312,
        replied: 89
      },
      {
        name: 'Payment Reminders - Dec',
        templateId: templateIds['payment_reminder'],
        status: 'COMPLETED',
        scheduled: -3,
        sent: 125,
        delivered: 122,
        read: 115,
        replied: 45
      },
      {
        name: 'New Year Packages',
        templateId: templateIds['welcome_message'],
        status: 'ACTIVE',
        scheduled: -1,
        sent: 580,
        delivered: 562,
        read: 423,
        replied: 134
      },
      {
        name: 'Trip Reminders - Jan',
        templateId: templateIds['trip_reminder'],
        status: 'SCHEDULED',
        scheduled: 2,
        sent: 0,
        delivered: 0,
        read: 0,
        replied: 0
      },
      {
        name: 'Feedback Collection',
        templateId: templateIds['feedback_request'],
        status: 'DRAFT',
        scheduled: 5,
        sent: 0,
        delivered: 0,
        read: 0,
        replied: 0
      }
    ];

    for (const c of campaigns) {
      const scheduledFor = new Date();
      scheduledFor.setDate(scheduledFor.getDate() + c.scheduled);
      
      const stats = {
        sent: c.sent,
        delivered: c.delivered,
        read: c.read,
        replied: c.replied,
        failed: c.sent - c.delivered
      };
      
      await query(
        `INSERT INTO whatsapp.campaigns (
          tenant_id, name, template_id, status, scheduled_for,
          target_count, stats, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          tenantId, c.name, c.templateId, c.status, scheduledFor,
          c.sent > 0 ? c.sent : 200,
          JSON.stringify(stats),
          JSON.stringify({
            segmentation: 'all_customers',
            createdBy: 'admin@demo.com'
          })
        ]
      );
    }

    console.log('✅ WhatsApp seed completed successfully!');
    console.log(`Created: ${Object.keys(templateIds).length} templates, ${conversationIds.length} conversations, 250 messages, ${campaigns.length} campaigns`);

  } catch (error) {
    console.error('❌ WhatsApp seed failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

seedWhatsApp();
