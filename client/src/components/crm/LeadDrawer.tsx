import React, { useState, useEffect } from 'react';
import { X, Mail, Calendar, Clock, User, MessageSquare, PhoneCall, MapPin, Building2, ArrowRight, Plus, Check } from 'lucide-react';
import { Lead, LeadNote, FollowUp, TimelineEvent, LeadAssignee } from '@/types/crm';
import { crmApi } from '@/api/crmApi';
import { Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Textarea, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui';
import { cn } from '@/utils';

interface LeadDrawerProps {
    lead: Lead | null;
    isOpen: boolean;
    onClose: () => void;
    onLeadUpdated?: () => void;
}

type TabType = 'notes' | 'followups' | 'timeline';

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' +
        date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const isOverdue = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date < today;
};

export const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, isOpen, onClose, onLeadUpdated }) => {
    const [activeTab, setActiveTab] = useState<TabType>('notes');
    const [notes, setNotes] = useState<LeadNote[]>([]);
    const [followUps, setFollowUps] = useState<FollowUp[]>([]);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
    const [assignees, setAssignees] = useState<LeadAssignee[]>([]);
    const [loading, setLoading] = useState(false);

    // Form states
    const [newNote, setNewNote] = useState('');
    const [showFollowUpForm, setShowFollowUpForm] = useState(false);
    const [followUpForm, setFollowUpForm] = useState({
        type: 'CALL' as FollowUp['type'],
        scheduledDate: '',
        scheduledTime: '',
        note: ''
    });
    const [showAssigneeModal, setShowAssigneeModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (lead && isOpen) {
            loadData();
            loadAssignees();
        }
    }, [lead, isOpen, activeTab]);

    const loadData = async () => {
        if (!lead) return;
        setLoading(true);
        try {
            if (activeTab === 'notes') {
                const { notes } = await crmApi.getLeadNotes(lead.id);
                setNotes(notes);
            } else if (activeTab === 'followups') {
                const { followUps } = await crmApi.getFollowUps(lead.id);
                setFollowUps(followUps);
            } else if (activeTab === 'timeline') {
                const { events } = await crmApi.getTimeline(lead.id);
                setTimeline(events);
            }
        } catch (err) {
            console.error('Failed to load data:', err);
            // Use mock data for demo
            if (activeTab === 'notes') {
                setNotes([
                    { id: '1', leadId: lead.id, content: 'Initial contact made. Customer interested in Maldives package.', createdAt: new Date().toISOString(), createdBy: 'admin', createdByName: 'Admin' }
                ]);
            } else if (activeTab === 'followups') {
                setFollowUps([
                    { id: '1', leadId: lead.id, type: 'CALL', status: 'SCHEDULED', scheduledDate: '2025-12-31', note: 'Discuss package options', createdAt: new Date().toISOString(), createdBy: 'admin' }
                ]);
            } else if (activeTab === 'timeline') {
                setTimeline([
                    { id: '1', type: 'CREATED', description: 'Lead created', createdAt: lead.createdAt, createdByName: 'System' },
                    { id: '2', type: 'STATUS_CHANGED', description: 'Status changed', metadata: { fromLabel: 'New', toLabel: 'Contacted' }, createdAt: new Date().toISOString(), createdByName: 'Admin' }
                ]);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadAssignees = async () => {
        try {
            const { users } = await crmApi.getAssignees();
            setAssignees(users);
        } catch (err) {
            // Mock data
            setAssignees([
                { id: '1', name: 'FASIL' },
                { id: '2', name: 'Haleema' },
                { id: '3', name: 'ayoob' }
            ]);
        }
    };

    const handleAddNote = async () => {
        if (!lead || !newNote.trim()) return;
        setSubmitting(true);
        try {
            await crmApi.addLeadNote(lead.id, newNote);
            setNewNote('');
            loadData();
            onLeadUpdated?.();
        } catch (err) {
            // Mock add for demo
            setNotes(prev => [{
                id: Date.now().toString(),
                leadId: lead.id,
                content: newNote,
                createdAt: new Date().toISOString(),
                createdBy: 'admin',
                createdByName: 'Admin'
            }, ...prev]);
            setNewNote('');
        } finally {
            setSubmitting(false);
        }
    };

    const handleScheduleFollowUp = async () => {
        if (!lead || !followUpForm.scheduledDate) return;
        setSubmitting(true);
        try {
            await crmApi.scheduleFollowUp(lead.id, {
                type: followUpForm.type,
                scheduledDate: followUpForm.scheduledDate,
                scheduledTime: followUpForm.scheduledTime,
                note: followUpForm.note,
                status: 'SCHEDULED'
            });
            setFollowUpForm({ type: 'CALL', scheduledDate: '', scheduledTime: '', note: '' });
            setShowFollowUpForm(false);
            loadData();
            onLeadUpdated?.();
        } catch (err) {
            // Mock add for demo
            setFollowUps(prev => [{
                id: Date.now().toString(),
                leadId: lead.id,
                type: followUpForm.type,
                status: 'SCHEDULED',
                scheduledDate: followUpForm.scheduledDate,
                scheduledTime: followUpForm.scheduledTime,
                note: followUpForm.note,
                createdAt: new Date().toISOString(),
                createdBy: 'admin'
            }, ...prev]);
            setFollowUpForm({ type: 'CALL', scheduledDate: '', scheduledTime: '', note: '' });
            setShowFollowUpForm(false);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateFollowUpStatus = async (followUpId: string, status: FollowUp['status']) => {
        if (!lead) return;
        try {
            await crmApi.updateFollowUp(lead.id, followUpId, { status });
            loadData();
            onLeadUpdated?.();
        } catch (err) {
            // Mock update
            setFollowUps(prev => prev.map(f => f.id === followUpId ? { ...f, status } : f));
        }
    };

    const handleCancelFollowUp = async (followUpId: string) => {
        if (!lead) return;
        try {
            await crmApi.cancelFollowUp(lead.id, followUpId);
            loadData();
            onLeadUpdated?.();
        } catch (err) {
            // Mock cancel
            setFollowUps(prev => prev.filter(f => f.id !== followUpId));
        }
    };

    const handleAssign = async (assigneeId: string) => {
        if (!lead) return;
        try {
            await crmApi.assignLead(lead.id, assigneeId);
            setShowAssigneeModal(false);
            onLeadUpdated?.();
        } catch (err) {
            console.error('Failed to assign:', err);
        }
        setShowAssigneeModal(false);
    };

    const getFollowUpIcon = (type: FollowUp['type']) => {
        switch (type) {
            case 'CALL': return <PhoneCall className="w-4 h-4" />;
            case 'EMAIL': return <Mail className="w-4 h-4" />;
            case 'VISIT': return <MapPin className="w-4 h-4" />;
            case 'MEETING': return <Building2 className="w-4 h-4" />;
            case 'WHATSAPP': return <MessageSquare className="w-4 h-4" />;
            default: return <Calendar className="w-4 h-4" />;
        }
    };

    const getTimelineIcon = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'NOTE_ADDED': return <MessageSquare className="w-4 h-4" />;
            case 'FOLLOWUP_SCHEDULED': return <Clock className="w-4 h-4" />;
            case 'FOLLOWUP_COMPLETED': return <Check className="w-4 h-4" />;
            case 'STATUS_CHANGED': return <ArrowRight className="w-4 h-4" />;
            case 'ASSIGNED': return <User className="w-4 h-4" />;
            case 'STAGE_CHANGED': return <ArrowRight className="w-4 h-4" />;
            default: return <Plus className="w-4 h-4" />;
        }
    };

    const getTimelineColor = (type: TimelineEvent['type']) => {
        switch (type) {
            case 'NOTE_ADDED': return 'bg-blue-500';
            case 'FOLLOWUP_SCHEDULED': return 'bg-amber-500';
            case 'FOLLOWUP_COMPLETED': return 'bg-green-500';
            case 'STATUS_CHANGED': return 'bg-purple-500';
            case 'ASSIGNED': return 'bg-teal-500';
            case 'STAGE_CHANGED': return 'bg-indigo-500';
            default: return 'bg-gray-500';
        }
    };

    if (!lead) return null;

    const assigneeName = assignees.find(a => a.id === lead.assignedToId)?.name || 'Unassigned';

    return (
        <>
            {/* Backdrop */}
            <div
                className={cn(
                    'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={cn(
                    'fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col',
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                )}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Lead Info Section */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Type</p>
                            <p className="font-semibold text-emerald-600">{lead.tags?.includes('institutional') ? 'Institutional' : 'Individual'}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Source</p>
                            <p className="font-medium">{lead.source || 'Other'}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Phone</p>
                            <p className="font-medium">{lead.phone || '-'}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Email</p>
                            <p className="font-medium truncate">{lead.email || '-'}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Created</p>
                            <p className="font-medium">{formatDate(lead.createdAt)}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Last Contact</p>
                            <p className="font-medium">{lead.updatedAt ? formatDate(lead.updatedAt) : '-'}</p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Next Contact</p>
                            <p className={cn(
                                "font-medium",
                                followUps[0] && isOverdue(followUps[0].scheduledDate) && "text-red-500"
                            )}>
                                {followUps[0] ? formatDate(followUps[0].scheduledDate) : '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide mb-1">Assigned To</p>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-emerald-600">{assigneeName}</span>
                                <button
                                    onClick={() => setShowAssigneeModal(true)}
                                    className="px-2 py-0.5 text-xs border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                >
                                    CHANGE
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Section */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="mx-5 mt-4 bg-transparent border-b border-slate-200 dark:border-slate-700 rounded-none p-0 gap-0">
                        <TabsTrigger 
                            value="notes" 
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 data-[state=active]:bg-transparent bg-transparent px-4 py-2"
                        >
                            NOTES
                        </TabsTrigger>
                        <TabsTrigger 
                            value="followups"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 data-[state=active]:bg-transparent bg-transparent px-4 py-2"
                        >
                            FOLLOW-UPS
                        </TabsTrigger>
                        <TabsTrigger 
                            value="timeline"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-600 data-[state=active]:bg-transparent bg-transparent px-4 py-2"
                        >
                            TIMELINE
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto">
                        {/* Notes Tab */}
                        <TabsContent value="notes" className="p-5 m-0 space-y-4">
                            {/* Add Note */}
                            <button
                                onClick={() => setNewNote(newNote || ' ')}
                                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                ADD NOTE
                            </button>

                            {newNote !== '' && (
                                <div className="space-y-2">
                                    <Textarea
                                        value={newNote.trim()}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Enter note..."
                                        rows={3}
                                        className="w-full"
                                    />
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="ghost" size="sm" onClick={() => setNewNote('')}>
                                            Cancel
                                        </Button>
                                        <Button size="sm" onClick={handleAddNote} disabled={submitting || !newNote.trim()}>
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Notes List */}
                            {loading ? (
                                <div className="text-center py-8 text-slate-500">Loading...</div>
                            ) : notes.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">No notes yet</div>
                            ) : (
                                <div className="space-y-4">
                                    {notes.map((note) => (
                                        <div key={note.id} className="flex gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                {(note.createdByName || 'U')[0].toUpperCase()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <span className="font-medium text-slate-700 dark:text-slate-300">{note.createdByName || 'User'}</span>
                                                    <span>•</span>
                                                    <span>{formatDateTime(note.createdAt)}</span>
                                                </div>
                                                <p className="text-sm mt-1">{note.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* Follow-ups Tab */}
                        <TabsContent value="followups" className="p-5 m-0 space-y-4">
                            {/* Schedule Form */}
                            {showFollowUpForm ? (
                                <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4 bg-slate-50 dark:bg-slate-800/50">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Date</label>
                                            <Input
                                                type="date"
                                                value={followUpForm.scheduledDate}
                                                onChange={(e) => setFollowUpForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 block mb-1">Time (optional)</label>
                                            <Input
                                                type="time"
                                                value={followUpForm.scheduledTime}
                                                onChange={(e) => setFollowUpForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Type</label>
                                        <Select 
                                            value={followUpForm.type}
                                            onValueChange={(v) => setFollowUpForm(prev => ({ ...prev, type: v as FollowUp['type'] }))}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CALL">Call</SelectItem>
                                                <SelectItem value="EMAIL">Email</SelectItem>
                                                <SelectItem value="VISIT">Visit</SelectItem>
                                                <SelectItem value="MEETING">Meeting</SelectItem>
                                                <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 block mb-1">Note (optional)</label>
                                        <Textarea
                                            value={followUpForm.note}
                                            onChange={(e) => setFollowUpForm(prev => ({ ...prev, note: e.target.value }))}
                                            placeholder="Add a note..."
                                            rows={2}
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button variant="ghost" onClick={() => setShowFollowUpForm(false)}>
                                            CANCEL
                                        </Button>
                                        <Button onClick={handleScheduleFollowUp} disabled={submitting || !followUpForm.scheduledDate}>
                                            SCHEDULE
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowFollowUpForm(true)}
                                    className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-slate-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Schedule Follow-up
                                </button>
                            )}

                            {/* Follow-ups List */}
                            {loading ? (
                                <div className="text-center py-8 text-slate-500">Loading...</div>
                            ) : (
                                <>
                                    {/* Upcoming */}
                                    <div>
                                        <h4 className="text-sm font-medium text-slate-500 mb-3">
                                            Upcoming ({followUps.filter(f => f.status === 'SCHEDULED').length})
                                        </h4>
                                        <div className="space-y-3">
                                            {followUps.filter(f => f.status === 'SCHEDULED').map((followUp) => {
                                                const overdue = isOverdue(followUp.scheduledDate);
                                                return (
                                                    <div key={followUp.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn(
                                                                    "w-10 h-10 rounded-full flex items-center justify-center",
                                                                    overdue ? "bg-red-100 text-red-600" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                                                )}>
                                                                    {getFollowUpIcon(followUp.type)}
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium">{followUp.type}</span>
                                                                        {overdue && (
                                                                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-slate-500">
                                                                        {formatDate(followUp.scheduledDate)}
                                                                        {followUp.scheduledTime && ` at ${followUp.scheduledTime}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge variant="secondary" className="text-xs">Scheduled</Badge>
                                                        </div>
                                                        {followUp.note && (
                                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 pl-13">{followUp.note}</p>
                                                        )}
                                                        <div className="flex gap-3 mt-3 justify-end text-sm">
                                                            <button
                                                                onClick={() => handleUpdateFollowUpStatus(followUp.id, 'COMPLETED')}
                                                                className="text-emerald-600 hover:text-emerald-700 font-medium"
                                                            >
                                                                UPDATE STATUS
                                                            </button>
                                                            <button
                                                                onClick={() => handleCancelFollowUp(followUp.id)}
                                                                className="text-slate-500 hover:text-red-600"
                                                            >
                                                                CANCEL
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {followUps.filter(f => f.status === 'SCHEDULED').length === 0 && (
                                                <p className="text-center text-slate-500 text-sm py-4">No upcoming follow-ups</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Completed */}
                                    {followUps.filter(f => f.status === 'COMPLETED').length > 0 && (
                                        <div>
                                            <h4 className="text-sm font-medium text-slate-500 mb-3">
                                                Completed ({followUps.filter(f => f.status === 'COMPLETED').length})
                                            </h4>
                                            <div className="space-y-3">
                                                {followUps.filter(f => f.status === 'COMPLETED').map((followUp) => (
                                                    <div key={followUp.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-800/50 opacity-75">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                                                <Check className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">{followUp.type}</span>
                                                                <p className="text-sm text-slate-500">{formatDate(followUp.scheduledDate)}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </TabsContent>

                        {/* Timeline Tab */}
                        <TabsContent value="timeline" className="p-5 m-0">
                            {loading ? (
                                <div className="text-center py-8 text-slate-500">Loading...</div>
                            ) : timeline.length === 0 ? (
                                <div className="text-center py-8 text-slate-500">No activity yet</div>
                            ) : (
                                <div className="space-y-0">
                                    {timeline.map((event, index) => (
                                        <div key={event.id} className="flex gap-3 relative">
                                            {/* Timeline line */}
                                            {index < timeline.length - 1 && (
                                                <div className="absolute left-4 top-10 w-0.5 h-full bg-slate-200 dark:bg-slate-700 -z-10" />
                                            )}
                                            
                                            {/* Icon */}
                                            <div className={cn(
                                                "w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0",
                                                getTimelineColor(event.type)
                                            )}>
                                                {getTimelineIcon(event.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 pb-6">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-medium text-sm">{event.description}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">by {event.createdByName || 'System'}</p>
                                                    </div>
                                                    <span className="text-xs text-slate-400">{formatDateTime(event.createdAt)}</span>
                                                </div>
                                                
                                                {/* Metadata badges for status/assignment changes */}
                                                {event.metadata && (event.metadata.fromLabel || event.metadata.toLabel) && (
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {event.metadata.fromLabel && (
                                                            <span className="px-2 py-1 text-xs bg-slate-200 dark:bg-slate-700 rounded line-through">
                                                                {event.metadata.fromLabel}
                                                            </span>
                                                        )}
                                                        <ArrowRight className="w-3 h-3 text-slate-400" />
                                                        {event.metadata.toLabel && (
                                                            <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400 rounded">
                                                                {event.metadata.toLabel}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* Assignee Modal */}
            {showAssigneeModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-sm">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-semibold">Change Assignee</h3>
                        </div>
                        <div className="p-2 max-h-64 overflow-y-auto">
                            {assignees.map((assignee) => (
                                <button
                                    key={assignee.id}
                                    onClick={() => handleAssign(assignee.id)}
                                    className={cn(
                                        "w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors flex items-center gap-3",
                                        lead.assignedToId === assignee.id && "bg-emerald-50 dark:bg-emerald-900/20"
                                    )}
                                >
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-medium">
                                        {assignee.name[0].toUpperCase()}
                                    </div>
                                    <span>{assignee.name}</span>
                                    {lead.assignedToId === assignee.id && (
                                        <Check className="w-4 h-4 text-emerald-600 ml-auto" />
                                    )}
                                </button>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                            <Button variant="ghost" className="w-full" onClick={() => setShowAssigneeModal(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LeadDrawer;
