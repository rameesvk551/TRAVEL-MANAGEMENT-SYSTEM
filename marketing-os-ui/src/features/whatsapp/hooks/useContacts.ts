// hooks/useContacts.ts
// State and (future) queries for the Contacts tab.

import { useState } from 'react';

// Mock data — replace with contactService calls when real API is wired.
const mockContacts = Array.from({ length: 20 }).map((_, i) => ({
    id: `contact_${i}`,
    name: `User ${i + 1}`,
    phone: `9198765${10000 + i}`,
    status: i % 5 === 0 ? 'OPTED_OUT' : 'OPTED_IN',
    source: i % 3 === 0 ? 'WEBSITE' : 'WHATSAPP_INBOUND',
    optInDate: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
    lastActive: new Date(Date.now() - Math.random() * 100000000).toISOString(),
    tags: i % 2 === 0 ? ['Lead'] : ['Customer', 'VIP'],
}));

export function useContacts() {
    const [searchText, setSearchText] = useState('');
    const [selectedContact, setSelectedContact] = useState<any>(null);

    const filteredContacts = mockContacts.filter((c) => {
        if (!searchText) return true;
        const q = searchText.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.phone.includes(q);
    });

    return {
        searchText,
        setSearchText,
        selectedContact,
        setSelectedContact,
        contacts: filteredContacts,
    };
}
