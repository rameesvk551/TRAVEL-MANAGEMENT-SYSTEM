// scripts/test_whatsapp_meta.ts
// Test WhatsApp Meta Cloud API with real credentials

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
};

const BASE_URL = `https://graph.facebook.com/${config.apiVersion}`;

/**
 * Test WhatsApp Meta Cloud API
 */
async function testMetaWhatsApp() {
  console.log('🧪 WhatsApp Meta Cloud API Tests\n');
  console.log('='.repeat(50));

  // Validate config
  if (!config.accessToken) {
    console.error('❌ WHATSAPP_ACCESS_TOKEN not set in .env');
    process.exit(1);
  }

  if (!config.phoneNumberId || config.phoneNumberId === 'YOUR_PHONE_NUMBER_ID_HERE') {
    console.error('❌ WHATSAPP_PHONE_NUMBER_ID not set in .env');
    console.log('\n📌 To get your Phone Number ID:');
    console.log('   1. Go to https://developers.facebook.com');
    console.log('   2. Select your Wayon app');
    console.log('   3. Go to WhatsApp > API Setup');
    console.log('   4. Copy the "Phone number ID"');
    process.exit(1);
  }

  console.log(`\n📱 Phone Number ID: ${config.phoneNumberId}`);
  console.log(`🏢 Business Account ID: ${config.businessAccountId}`);
  console.log(`🔗 API Version: ${config.apiVersion}\n`);

  // =============================================
  // TEST 1: Verify Access Token / Get Phone Number Info
  // =============================================
  console.log('📋 TEST 1: Verify Access Token & Get Phone Number Info');
  try {
    const response = await fetch(
      `${BASE_URL}/${config.phoneNumberId}?fields=id,display_phone_number,verified_name,quality_rating`,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      console.log(`   ❌ Error: ${data.error?.message || 'Unknown error'}`);
      console.log(`   Code: ${data.error?.code}`);
      return;
    }

    console.log(`   ✅ Token is valid!`);
    console.log(`   Phone: ${data.display_phone_number || 'N/A'}`);
    console.log(`   Verified Name: ${data.verified_name || 'N/A'}`);
    console.log(`   Quality Rating: ${data.quality_rating || 'N/A'}\n`);
  } catch (error) {
    console.log(`   ❌ Network Error: ${(error as Error).message}\n`);
    return;
  }

  // =============================================
  // TEST 2: Get Business Profile
  // =============================================
  console.log('📋 TEST 2: Get Business Profile');
  try {
    const response = await fetch(
      `${BASE_URL}/${config.phoneNumberId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      console.log(`   ⚠️ Could not get profile: ${data.error?.message || 'Unknown error'}\n`);
    } else {
      const profile = data.data?.[0] || {};
      console.log(`   About: ${profile.about || 'Not set'}`);
      console.log(`   Description: ${profile.description || 'Not set'}`);
      console.log(`   Email: ${profile.email || 'Not set'}`);
      console.log(`   ✅ Business profile retrieved\n`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}\n`);
  }

  // =============================================
  // TEST 3: Get Message Templates
  // =============================================
  console.log('📋 TEST 3: Get Message Templates');
  try {
    const response = await fetch(
      `${BASE_URL}/${config.businessAccountId}/message_templates?limit=10`,
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      console.log(`   ⚠️ Could not get templates: ${data.error?.message || 'Unknown error'}`);
      console.log(`   Note: Make sure WHATSAPP_BUSINESS_ACCOUNT_ID is correct\n`);
    } else {
      const templates = data.data || [];
      console.log(`   Found ${templates.length} templates:`);
      templates.slice(0, 5).forEach((t: any) => {
        console.log(`     - ${t.name} (${t.status}) [${t.category}]`);
      });
      if (templates.length > 5) {
        console.log(`     ... and ${templates.length - 5} more`);
      }
      console.log(`   ✅ Templates retrieved\n`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}\n`);
  }

  // =============================================
  // TEST 4: Send Test Message (to your own number)
  // =============================================
  console.log('📋 TEST 4: Send Test Message');
  console.log('   ⚠️ To send a real message, you need:');
  console.log('   1. A verified phone number to send TO');
  console.log('   2. That number must have messaged your business first (24h window)');
  console.log('   3. OR use an approved template message\n');

  // Uncomment and modify this section to send a real test message
  /*
  const testRecipient = '+91XXXXXXXXXX'; // Replace with your test number
  
  try {
    const response = await fetch(
      `${BASE_URL}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: testRecipient,
          type: 'text',
          text: {
            body: 'Hello from Travel Management System! 🌍'
          }
        }),
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      console.log(`   ❌ Failed: ${data.error?.message}`);
      console.log(`   Error Code: ${data.error?.code}`);
    } else {
      console.log(`   ✅ Message sent!`);
      console.log(`   Message ID: ${data.messages?.[0]?.id}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`);
  }
  */

  // =============================================
  // TEST 5: Send Template Message (hello_world)
  // =============================================
  console.log('📋 TEST 5: Send Template Message (hello_world)');
  console.log('   Meta provides a "hello_world" template for testing');
  console.log('   Uncomment the code in this script to send it\n');

  // Uncomment to send template
  /*
  const testRecipient = '+91XXXXXXXXXX'; // Replace with your test number
  
  try {
    const response = await fetch(
      `${BASE_URL}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: testRecipient,
          type: 'template',
          template: {
            name: 'hello_world',
            language: { code: 'en_US' }
          }
        }),
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      console.log(`   ❌ Failed: ${data.error?.message}`);
    } else {
      console.log(`   ✅ Template message sent!`);
      console.log(`   Message ID: ${data.messages?.[0]?.id}`);
    }
  } catch (error) {
    console.log(`   ❌ Error: ${(error as Error).message}`);
  }
  */

  // =============================================
  // SUMMARY
  // =============================================
  console.log('='.repeat(50));
  console.log('🎉 Meta API Connection Test Complete!\n');

  console.log('📌 Next Steps:');
  console.log('   1. Add your Phone Number ID to .env');
  console.log('   2. Add your Business Account ID to .env');
  console.log('   3. Create message templates in Meta Business Suite');
  console.log('   4. Set up webhook for receiving messages');
  console.log('   5. Start the server: npm run dev\n');

  console.log('📄 Webhook Setup:');
  console.log(`   Callback URL: https://your-domain.com/api/whatsapp/webhook`);
  console.log(`   Verify Token: ${process.env.WHATSAPP_VERIFY_TOKEN || 'wayon-tms-verify-token-2025'}`);
  console.log('   Subscribe to: messages, message_deliveries, message_reads\n');
}

// Interactive message sender
async function sendTestMessage(recipientPhone: string, message: string) {
  console.log(`\n📤 Sending message to ${recipientPhone}...`);
  
  try {
    const response = await fetch(
      `${BASE_URL}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone.replace(/[^0-9]/g, ''), // Remove non-digits
          type: 'text',
          text: { body: message }
        }),
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      console.log(`❌ Failed: ${data.error?.message}`);
      console.log(`   Error Code: ${data.error?.code}`);
      console.log(`   Error Details:`, JSON.stringify(data.error, null, 2));
      return false;
    }

    console.log(`✅ Message sent successfully!`);
    console.log(`   Message ID: ${data.messages?.[0]?.id}`);
    console.log(`   Recipient: ${data.contacts?.[0]?.wa_id}`);
    return true;
  } catch (error) {
    console.log(`❌ Network Error: ${(error as Error).message}`);
    return false;
  }
}

// Send template message
async function sendTemplateMessage(recipientPhone: string, templateName: string = 'hello_world') {
  console.log(`\n📤 Sending template "${templateName}" to ${recipientPhone}...`);
  
  try {
    const response = await fetch(
      `${BASE_URL}/${config.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: recipientPhone.replace(/[^0-9]/g, ''),
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en_US' }
          }
        }),
      }
    );

    const data = await response.json() as any;

    if (!response.ok) {
      console.log(`❌ Failed: ${data.error?.message}`);
      console.log(`   Error Code: ${data.error?.code}`);
      return false;
    }

    console.log(`✅ Template message sent!`);
    console.log(`   Message ID: ${data.messages?.[0]?.id}`);
    return true;
  } catch (error) {
    console.log(`❌ Error: ${(error as Error).message}`);
    return false;
  }
}

// Check command line arguments for direct message sending
const args = process.argv.slice(2);

if (args[0] === 'send' && args[1]) {
  // Usage: npx tsx src/scripts/test_whatsapp_meta.ts send +919876543210 "Hello!"
  const phone = args[1];
  const message = args.slice(2).join(' ') || 'Hello from Travel Management System! 🌍';
  sendTestMessage(phone, message).then(() => process.exit(0));
} else if (args[0] === 'template' && args[1]) {
  // Usage: npx tsx src/scripts/test_whatsapp_meta.ts template +919876543210 hello_world
  const phone = args[1];
  const template = args[2] || 'hello_world';
  sendTemplateMessage(phone, template).then(() => process.exit(0));
} else {
  // Run main test
  testMetaWhatsApp().then(() => process.exit(0));
}
