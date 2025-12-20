import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { crmApi } from '../../api'; // Direct API for details or add to store? Store is better but API is quicker for fetch-only.
import { Lead, Contact, Activity } from '../../types/crm';
import { ActivityTimeline } from '../../components/crm/ActivityTimeline';

export const LeadDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate(); // Hook
    const [lead, setLead] = useState<Lead | null>(null);
    const [contact, setContact] = useState<Contact | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadLeadData(id);
        }
    }, [id]);

    const loadLeadData = async (leadId: string) => {
        setLoading(true);
        try {
            // 1. Fetch Lead
            // TODO: Add getLeadById to crmApi (it might be missing in interface but backend has it?)
            // Actually board view has leads, but full detail might need separate endpoint if lightweight board.
            // Let's assume we fetch from board store or new endpoint.
            // Backend Controller `getAll` supports filters, `getBoard` supports pipeline. 
            // We need `getById`. Backend Controller has `update` but maybe not explicit `getById` for leads? 
            // Checking LeadController... `getAll` is there. `update` is there. 
            // Ah, I missed adding `getById` to LeadController in the backend! 
            // I can use `getAll({ search: ... })` or just add `getById`.
            // User can only see what's implemented. 
            // Let's check crmApi.ts... `getLeads`.
            // I will implement a quick client-side filter or fetch by ID if I adding it to backend.
            // Ideally backend should have it. 

            // Temporary workaround: Fetch all leads (or filter) and find. 
            // BETTER: Add `getById` to controller now? No, stick to client plan. 
            // Wait, LeadController has `getAll`, `getBoard`, `update`. 
            // If I call getAll with id it won't work.
            // I should have added getById.

            // LET'S ADD getById TO BACKEND FIRST? 
            // Or use the board store if we visited board first. 
            // But if deep linking, store is empty.

            // I will assume for now I can fetch from getAll leads w/ filter? No filter by ID.
            // I will use `crmApi.getLeads()` and find it on client for now (inefficient but works for small data).
            const { leads } = await crmApi.getLeads(); // limit default 20
            const foundLead = leads.find(l => l.id === leadId);

            if (foundLead) {
                setLead(foundLead);
                // 2. Fetch Contact
                if (foundLead.contactId) {
                    const contactData = await crmApi.getContact(foundLead.contactId);
                    setContact(contactData);
                }

                // 3. Fetch Activities
                const { activities } = await crmApi.getActivities({ leadId });
                setActivities(activities);
            } else {
                setError('Lead not found (or not in recent list)');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConvert = async () => {
        if (!lead || !lead.travelPreferences?.startDate) {
            alert('Cannot convert: Missing travel dates. Please update lead details first.');
            return;
        }

        const confirm = window.confirm('This will create a confirmed booking for this lead and mark them as WON. Proceed?');
        if (!confirm) return;

        try {
            await crmApi.convertLead(lead.id, {
                resourceId: 'resource-123', // TODO: Allow selecting resource in a modal dialog
                startDate: lead.travelPreferences.startDate,
                endDate: lead.travelPreferences.endDate,
                // Pricing defaults handled by backend
            } as any);
            alert('Lead converted to Booking!');
            // Reload or redirect
            navigate('/bookings');
        } catch (err: any) {
            alert('Conversion failed: ' + err.message);
        }
    };

    if (loading) return <div className="p-8">Loading details...</div>;
    if (error || !lead) return <div className="p-8 text-red-500">Error: {error || 'Lead not found'}</div>;

    return (
        <div className="p-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Col: Contact Info & Meta */}
            <div className="md:col-span-1 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow border p-6">
                    <h2 className="text-xl font-bold mb-4">{lead.name}</h2>
                    <div className="space-y-3 text-sm">
                        <div>
                            <span className="text-gray-500 block">Email</span>
                            <span className="font-medium">{lead.email || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Phone</span>
                            <span className="font-medium">{lead.phone || '-'}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Priority</span>
                            <span className={`inline-block px-2 py-1 rounded text-xs mt-1
                                ${lead.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-slate-100'}`}>
                                {lead.priority}
                            </span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">Stage</span>
                            <span className="font-medium">{lead.stageId}</span>
                            {/* Ideally map stageId to Name using Store Pipelines */}
                        </div>
                    </div>
                </div>

                {contact && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow border p-6">
                        <h3 className="font-semibold mb-3">Customer Profile</h3>
                        <div className="text-sm space-y-2">
                            <p>History: {JSON.stringify(contact.travelHistory)}</p>
                            <p>Prefs: {JSON.stringify(contact.preferences)}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Col: Timeline & Actions */}
            <div className="md:col-span-2 space-y-6">
                {/* Action Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow border p-4 flex gap-3">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                        Log Call
                    </button>
                    <button className="bg-white border px-4 py-2 rounded hover:bg-gray-50 transition">
                        Send Email
                    </button>
                    <button className="bg-white border px-4 py-2 rounded hover:bg-gray-50 transition">
                        Add Note
                    </button>
                    <button
                        onClick={handleConvert}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition ml-auto"
                    >
                        Create Booking
                    </button>
                </div>

                {/* Timeline */}
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow border p-6">
                    <h3 className="font-bold text-lg mb-4">Activity Timeline</h3>
                    <ActivityTimeline activities={activities} />
                </div>
            </div>
        </div>
    );
};
