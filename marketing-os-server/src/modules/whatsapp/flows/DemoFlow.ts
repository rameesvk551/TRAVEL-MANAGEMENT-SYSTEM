// infrastructure/whatsapp/flows/DemoFlow.ts
// Demo conversation flow for Travel Management System

import { getConfig } from '../../../config/index.js';

interface FlowStep {
  message: string;
  buttons?: Array<{ id: string; title: string }>;
  list?: {
    buttonText: string;
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  };
}

interface FlowState {
  step: string;
  data: Record<string, any>;
}

// Store conversation states (in production, use Redis/DB)
const conversationStates = new Map<string, FlowState>();

/**
 * Demo Travel Booking Flow
 */
export function createDemoFlow() {
  const config = getConfig();
  const token = config.whatsapp.meta?.accessToken || '';
  const phoneNumberId = config.whatsapp.meta?.phoneNumberId || '';
  const baseUrl = `https://graph.facebook.com/${config.whatsapp.meta?.apiVersion}/${phoneNumberId}`;

  // ============================================
  // API HELPERS
  // ============================================

  async function callApi(payload: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json() as any;
      
      if (!response.ok) {
        console.error('[DemoFlow] API Error:', data);
      } else {
        console.log('[DemoFlow] Message sent:', data.messages?.[0]?.id);
      }
      
      return data;
    } catch (error) {
      console.error('[DemoFlow] Error:', error);
      throw error;
    }
  }

  async function sendText(to: string, text: string): Promise<void> {
    await callApi({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    });
  }

  async function sendInteractiveButtons(to: string, content: {
    header?: string;
    body: string;
    footer?: string;
    buttons: Array<{ id: string; title: string }>;
  }): Promise<void> {
    await callApi({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        header: content.header ? { type: 'text', text: content.header } : undefined,
        body: { text: content.body },
        footer: content.footer ? { text: content.footer } : undefined,
        action: {
          buttons: content.buttons.map(b => ({
            type: 'reply',
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    });
  }

  async function sendInteractiveList(to: string, content: {
    header?: string;
    body: string;
    footer?: string;
    buttonText: string;
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  }): Promise<void> {
    await callApi({
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: content.header ? { type: 'text', text: content.header } : undefined,
        body: { text: content.body },
        footer: content.footer ? { text: content.footer } : undefined,
        action: {
          button: content.buttonText,
          sections: content.sections,
        },
      },
    });
  }

  // ============================================
  // DATA HELPERS
  // ============================================

  function getDestinationName(id: string): string {
    const destinations: Record<string, string> = {
      dest_manali: 'Manali',
      dest_leh: 'Leh Ladakh',
      dest_shimla: 'Shimla',
      dest_goa: 'Goa',
      dest_andaman: 'Andaman',
      dest_kerala: 'Kerala',
      dest_rajasthan: 'Rajasthan',
      dest_varanasi: 'Varanasi',
    };
    return destinations[id] || id;
  }

  function getUpcomingDates(): Array<{ display: string; slots: string }> {
    const dates = [];
    const today = new Date();
    for (let i = 7; i < 35; i += 7) {
      const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      dates.push({
        display: date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        slots: `${Math.floor(Math.random() * 10) + 2} seats left`,
      });
    }
    return dates;
  }

  function getDateFromInput(id: string): string {
    const match = id.match(/date_(\d+)/);
    if (match) {
      const idx = parseInt(match[1]);
      const date = new Date(Date.now() + (7 + idx * 7) * 24 * 60 * 60 * 1000);
      return date.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
    return id;
  }

  function getTravelerCount(id: string): string {
    const counts: Record<string, string> = {
      travelers_1: '1 Adult',
      travelers_2: '2 Adults',
      travelers_4: '4+ Adults',
    };
    return counts[id] || id;
  }

  function calculatePrice(data: Record<string, any>): number {
    const basePrices: Record<string, number> = {
      'Manali': 8999,
      'Leh Ladakh': 15999,
      'Shimla': 6999,
      'Goa': 7499,
      'Andaman': 22999,
      'Kerala': 12999,
      'Rajasthan': 11999,
      'Varanasi': 5999,
    };
    const base = basePrices[data.destination] || 10000;
    const travelers = data.travelers?.includes('4+') ? 4 : parseInt(data.travelers) || 1;
    return base * travelers;
  }

  function getPackageDetails(id: string): {
    name: string;
    description: string;
    destination: string;
    duration: string;
    price: string;
    includes: string[];
    validity: string;
  } {
    const packages: Record<string, any> = {
      pkg_honeymoon: {
        name: 'Honeymoon Special',
        description: 'Romantic getaway to the pristine beaches of Maldives.',
        destination: 'Maldives',
        duration: '5 Nights / 6 Days',
        price: '₹29,999 per person',
        includes: ['5⭐ Beach Resort', 'Breakfast & Dinner', 'Couple Spa', 'Sunset Cruise', 'Airport Transfers'],
        validity: 'Valid till March 2026',
      },
      pkg_adventure: {
        name: 'Adventure Pack',
        description: 'Thrilling adventure sports in the rafting capital!',
        destination: 'Rishikesh',
        duration: '4 Nights / 5 Days',
        price: '₹19,999 per person',
        includes: ['River Rafting', 'Bungee Jumping', 'Camping', 'All Meals', 'Expert Guides'],
        validity: 'Valid till Feb 2026',
      },
      pkg_family: {
        name: 'Family Holiday',
        description: 'Fun-filled family vacation to Singapore!',
        destination: 'Singapore',
        duration: '4 Nights / 5 Days',
        price: '₹24,999 per person',
        includes: ['Universal Studios', 'Sentosa Island', '4⭐ Hotel', 'Daily Breakfast', 'Visa Assistance'],
        validity: 'Valid till April 2026',
      },
      pkg_weekend: {
        name: 'Weekend Getaway',
        description: 'Quick escape to the hills near Mumbai.',
        destination: 'Lonavala',
        duration: '2 Nights / 3 Days',
        price: '₹4,999 per person',
        includes: ['Resort Stay', 'Breakfast', 'Sightseeing', 'Transport'],
        validity: 'Weekends only',
      },
      pkg_pilgrim: {
        name: 'Pilgrimage Tour',
        description: 'Sacred journey to Char Dham shrines.',
        destination: 'Uttarakhand',
        duration: '5 Nights / 6 Days',
        price: '₹7,999 per person',
        includes: ['Dharamshala Stay', 'VIP Darshan', 'All Meals', 'Transport', 'Guide'],
        validity: 'Valid till May 2026',
      },
    };
    return packages[id] || packages.pkg_weekend;
  }

  // ============================================
  // FLOW STEPS
  // ============================================

  /**
   * Send welcome message with options
   */
  async function sendWelcome(to: string): Promise<void> {
    await sendInteractiveButtons(to, {
      header: '🌍 Welcome to Wayon Travel!',
      body: 'Hello! I\'m your travel assistant. How can I help you today?\n\nChoose an option below:',
      footer: 'Powered by Wayon TMS',
      buttons: [
        { id: 'book_trip', title: '✈️ Book a Trip' },
        { id: 'view_packages', title: '📦 View Packages' },
        { id: 'check_status', title: '📋 Booking Status' },
      ],
    });
  }

  /**
   * Send destination options
   */
  async function sendDestinations(to: string): Promise<void> {
    await sendInteractiveList(to, {
      header: '🗺️ Choose Destination',
      body: 'Select your dream destination from our popular locations:',
      footer: 'All prices are per person',
      buttonText: 'View Destinations',
      sections: [
        {
          title: '🏔️ Mountain Destinations',
          rows: [
            { id: 'dest_manali', title: 'Manali', description: '₹8,999 | 4N/5D | Adventure' },
            { id: 'dest_leh', title: 'Leh Ladakh', description: '₹15,999 | 6N/7D | Scenic' },
            { id: 'dest_shimla', title: 'Shimla', description: '₹6,999 | 3N/4D | Heritage' },
          ],
        },
        {
          title: '🏖️ Beach Destinations',
          rows: [
            { id: 'dest_goa', title: 'Goa', description: '₹7,499 | 3N/4D | Beach Party' },
            { id: 'dest_andaman', title: 'Andaman', description: '₹22,999 | 5N/6D | Island' },
            { id: 'dest_kerala', title: 'Kerala', description: '₹12,999 | 4N/5D | Backwaters' },
          ],
        },
        {
          title: '🏛️ Heritage Destinations',
          rows: [
            { id: 'dest_rajasthan', title: 'Rajasthan', description: '₹11,999 | 5N/6D | Royal' },
            { id: 'dest_varanasi', title: 'Varanasi', description: '₹5,999 | 2N/3D | Spiritual' },
          ],
        },
      ],
    });
  }

  /**
   * Send date options
   */
  async function sendDateOptions(to: string, destination: string): Promise<void> {
    const dates = getUpcomingDates();
    await sendInteractiveList(to, {
      header: `📅 Select Date for ${destination}`,
      body: 'Choose your preferred departure date:',
      footer: 'Subject to availability',
      buttonText: 'View Dates',
      sections: [
        {
          title: 'Available Departures',
          rows: dates.map((date, i) => ({
            id: `date_${i}`,
            title: date.display,
            description: date.slots,
          })),
        },
      ],
    });
  }

  /**
   * Send traveler count options
   */
  async function sendTravelerCount(to: string): Promise<void> {
    await sendInteractiveButtons(to, {
      header: '👥 Number of Travelers',
      body: 'How many people will be traveling?',
      buttons: [
        { id: 'travelers_1', title: '1 Person' },
        { id: 'travelers_2', title: '2 People' },
        { id: 'travelers_4', title: '4+ People' },
      ],
    });
  }

  /**
   * Send booking summary
   */
  async function sendBookingSummary(to: string, data: Record<string, any>): Promise<void> {
    const price = calculatePrice(data);
    await sendInteractiveButtons(to, {
      header: '📋 Booking Summary',
      body: `Please review your booking:\n\n` +
        `🗺️ Destination: ${data.destination}\n` +
        `📅 Date: ${data.date}\n` +
        `👥 Travelers: ${data.travelers}\n` +
        `💰 Total: ₹${price.toLocaleString()}\n\n` +
        `Would you like to confirm?`,
      footer: 'Confirmation required',
      buttons: [
        { id: 'confirm_booking', title: '✅ Confirm' },
        { id: 'modify_booking', title: '✏️ Modify' },
        { id: 'cancel_booking', title: '❌ Cancel' },
      ],
    });
  }

  /**
   * Send booking confirmed
   */
  async function sendBookingConfirmed(to: string, data: Record<string, any>): Promise<void> {
    const bookingId = `WYN${Date.now().toString().slice(-8)}`;
    const price = calculatePrice(data);
    
    await sendText(to, 
      `🎉 *Booking Confirmed!*\n\n` +
      `Your booking has been confirmed.\n\n` +
      `📌 *Booking ID:* ${bookingId}\n` +
      `🗺️ *Destination:* ${data.destination}\n` +
      `📅 *Date:* ${data.date}\n` +
      `👥 *Travelers:* ${data.travelers}\n` +
      `💰 *Amount:* ₹${price.toLocaleString()}\n\n` +
      `📧 Confirmation email sent!\n` +
      `📱 Download invoice from our app.\n\n` +
      `Thank you for choosing Wayon Travel! 🙏\n\n` +
      `_Type "hi" to start a new conversation._`
    );
  }

  /**
   * Send booking cancelled
   */
  async function sendBookingCancelled(to: string): Promise<void> {
    await sendText(to,
      `❌ *Booking Cancelled*\n\n` +
      `No worries! Your booking has been cancelled.\n\n` +
      `Feel free to start again whenever you're ready.\n` +
      `_Type "hi" to explore our destinations._`
    );
  }

  /**
   * Send packages list
   */
  async function sendPackages(to: string): Promise<void> {
    await sendInteractiveList(to, {
      header: '📦 Special Packages',
      body: 'Check out our curated travel packages:',
      footer: 'Limited time offers!',
      buttonText: 'View Packages',
      sections: [
        {
          title: '🔥 Trending Packages',
          rows: [
            { id: 'pkg_honeymoon', title: 'Honeymoon Special', description: '₹29,999 | Maldives 5N/6D' },
            { id: 'pkg_adventure', title: 'Adventure Pack', description: '₹19,999 | Rishikesh 4N/5D' },
            { id: 'pkg_family', title: 'Family Holiday', description: '₹24,999 | Singapore 4N/5D' },
          ],
        },
        {
          title: '💰 Budget Packages',
          rows: [
            { id: 'pkg_weekend', title: 'Weekend Getaway', description: '₹4,999 | Lonavala 2N/3D' },
            { id: 'pkg_pilgrim', title: 'Pilgrimage Tour', description: '₹7,999 | Char Dham 5N/6D' },
          ],
        },
      ],
    });
  }

  /**
   * Send package details
   */
  async function sendPackageDetails(to: string, packageId: string): Promise<void> {
    const pkg = getPackageDetails(packageId);
    await sendInteractiveButtons(to, {
      header: `📦 ${pkg.name}`,
      body: `${pkg.description}\n\n` +
        `📍 ${pkg.destination}\n` +
        `⏱️ ${pkg.duration}\n` +
        `💰 ${pkg.price}\n\n` +
        `✨ *Includes:*\n${pkg.includes.map(i => `• ${i}`).join('\n')}`,
      footer: pkg.validity,
      buttons: [
        { id: 'book_package', title: '🎫 Book Now' },
        { id: 'view_packages', title: '↩️ Other Packages' },
        { id: 'talk_agent', title: '💬 Talk to Agent' },
      ],
    });
  }

  /**
   * Send booking status
   */
  async function sendBookingStatus(to: string): Promise<void> {
    // Dummy booking status
    await sendText(to,
      `📋 *Your Recent Bookings*\n\n` +
      `1️⃣ *WYN12345678*\n` +
      `   📍 Goa | 📅 Jan 15, 2026\n` +
      `   ✅ Confirmed\n\n` +
      `2️⃣ *WYN87654321*\n` +
      `   📍 Manali | 📅 Feb 10, 2026\n` +
      `   ⏳ Payment Pending\n\n` +
      `_Reply with booking ID for details._\n` +
      `_Type "hi" for main menu._`
    );
  }

  /**
   * Send agent connect message
   */
  async function sendAgentConnect(to: string): Promise<void> {
    await sendText(to,
      `👤 *Connecting to Agent*\n\n` +
      `Our travel expert will connect with you shortly.\n\n` +
      `⏰ Average wait time: 2-3 minutes\n` +
      `📞 Or call us: +91 98765 43210\n\n` +
      `_Type "hi" to go back to self-service._`
    );
  }

  // ============================================
  // MAIN PROCESSOR
  // ============================================

  /**
   * Process incoming message and respond
   */
  async function processMessage(from: string, messageText: string, buttonId?: string, listId?: string): Promise<void> {
    const state = conversationStates.get(from) || { step: 'start', data: {} };
    const input = buttonId || listId || messageText.toLowerCase().trim();

    console.log(`[DemoFlow] Processing: ${from} | Step: ${state.step} | Input: ${input}`);

    switch (state.step) {
      case 'start':
        await sendWelcome(from);
        state.step = 'awaiting_choice';
        break;

      case 'awaiting_choice':
        if (input.includes('book') || input === 'book_trip') {
          await sendDestinations(from);
          state.step = 'awaiting_destination';
        } else if (input.includes('package') || input === 'view_packages') {
          await sendPackages(from);
          state.step = 'awaiting_package';
        } else if (input.includes('status') || input === 'check_status') {
          await sendBookingStatus(from);
          state.step = 'start';
        } else if (input.includes('help') || input === 'talk_agent') {
          await sendAgentConnect(from);
          state.step = 'start';
        } else {
          await sendWelcome(from);
          state.step = 'awaiting_choice';
        }
        break;

      case 'awaiting_destination':
        state.data.destination = getDestinationName(input);
        await sendDateOptions(from, state.data.destination);
        state.step = 'awaiting_date';
        break;

      case 'awaiting_date':
        state.data.date = getDateFromInput(input);
        await sendTravelerCount(from);
        state.step = 'awaiting_travelers';
        break;

      case 'awaiting_travelers':
        state.data.travelers = getTravelerCount(input);
        await sendBookingSummary(from, state.data);
        state.step = 'awaiting_confirmation';
        break;

      case 'awaiting_confirmation':
        if (input === 'confirm_booking' || input.includes('yes') || input.includes('confirm')) {
          await sendBookingConfirmed(from, state.data);
          state.step = 'start';
          state.data = {};
        } else if (input === 'modify_booking' || input.includes('change') || input.includes('modify')) {
          await sendDestinations(from);
          state.step = 'awaiting_destination';
          state.data = {};
        } else {
          await sendBookingCancelled(from);
          state.step = 'start';
          state.data = {};
        }
        break;

      case 'awaiting_package':
        state.data.package = input;
        await sendPackageDetails(from, input);
        state.step = 'awaiting_package_action';
        break;

      case 'awaiting_package_action':
        if (input === 'book_package' || input.includes('book')) {
          await sendTravelerCount(from);
          state.step = 'awaiting_travelers';
        } else {
          await sendWelcome(from);
          state.step = 'awaiting_choice';
        }
        break;

      default:
        await sendWelcome(from);
        state.step = 'awaiting_choice';
    }

    conversationStates.set(from, state);
  }

  /**
   * Reset conversation state
   */
  function resetState(phone: string): void {
    conversationStates.delete(phone);
  }

  /**
   * Get current state (for debugging)
   */
  function getState(phone: string): FlowState | undefined {
    return conversationStates.get(phone);
  }

  return { processMessage, resetState, getState };
}

// Export singleton instance
export const demoFlow = createDemoFlow();
