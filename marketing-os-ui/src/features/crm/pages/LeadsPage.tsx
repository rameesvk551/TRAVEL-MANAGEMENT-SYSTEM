import { useMemo, useState } from 'react';
import {
    DragKanbanBoard,
    LeadDrawer,
    LeadsTable,
    SearchBar,
    StatsBar,
    SourceChart,
    StatusChart,
    AddLeadModal,
    BulkActionBar,
    DealsPipeline,
    TaskManager,
    ConversionFunnel,
    AgentPerformance,
    DealValueChart,
    TasksOverviewChart,
    TopTagsChart,
} from '../components';
import { DEFAULT_LEAD_NOTES } from '../data/leads';
import type { LeadRecord, LeadStatus } from '../data/leads';
import {
    useLeadFilters,
    useLeadNotes,
    useLeadStats,
    useLeadStore,
    useLeadActivities,
    useBulkSelection,
    useDeals,
    useTasks,
} from '../hooks';

type CrmTab = 'leads' | 'deals' | 'tasks' | 'analytics';
type LeadsViewMode = 'list' | 'kanban';

const tabClass = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition ${active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

const viewButtonClass = (active: boolean) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`;

export function LeadsPage() {
    /* ── top-level tabs ── */
    const [activeTab, setActiveTab] = useState<CrmTab>('leads');
    const [viewMode, setViewMode] = useState<LeadsViewMode>('list');
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
    const [addModalOpen, setAddModalOpen] = useState(false);

    /* ── lead store (stateful CRUD) ── */
    const { leads, addLead, updateLeadStatus, deleteLead, bulkUpdateStatus, bulkDelete, bulkAssign } = useLeadStore();

    /* ── filters on stateful leads ── */
    const { searchTerm, setSearchTerm, statusFilter, setStatusFilter, filteredLeads } = useLeadFilters(leads);

    /* ── notes ── */
    const leadIds = useMemo(() => leads.map((l) => l.id), [leads]);
    const { addLeadNote, getLeadNotes } = useLeadNotes(leadIds, DEFAULT_LEAD_NOTES);

    /* ── stats ── */
    const stats = useLeadStats(leads);

    /* ── activities for selected lead ── */
    const leadActivities = useLeadActivities(selectedLead?.id ?? null);

    /* ── bulk selection ── */
    const { selected, toggle, selectAll, clearAll, isSelected, count: bulkCount } = useBulkSelection();

    /* ── deals ── */
    const { deals: allDeals, byStage, totals, weighted, moveDeal, stages } = useDeals();

    /* ── tasks ── */
    const {
        tasks: allTasks,
        byStatus: tasksByStatus,
        changeStatus: changeTaskStatus,
        deleteTask,
        filterStatus: taskFilterStatus,
        setFilterStatus: setTaskFilterStatus,
        filterPriority: taskFilterPriority,
        setFilterPriority: setTaskFilterPriority,
    } = useTasks();

    /* ── handlers ── */
    const openLeadDrawer = (lead: LeadRecord) => {
        setSelectedLead(lead);
        setDrawerOpen(true);
    };

    const handleAddNote = (note: string) => {
        if (!selectedLead) return;
        addLeadNote(selectedLead.id, note);
    };

    const handleBulkStatusChange = (status: LeadStatus) => {
        bulkUpdateStatus(Array.from(selected), status);
        clearAll();
    };

    const handleBulkAssign = (agent: string) => {
        bulkAssign(Array.from(selected), agent);
        clearAll();
    };

    const handleBulkDelete = () => {
        bulkDelete(Array.from(selected));
        clearAll();
    };

    const selectedLeadNotes = selectedLead ? getLeadNotes(selectedLead.id) : DEFAULT_LEAD_NOTES;

    return (
        <section className="min-h-full rounded-2xl bg-gradient-to-b from-slate-100 via-slate-50 to-white p-4 sm:p-6">
            <div className="space-y-4">
                {/* ── Header with tabs ── */}
                <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">CRM</h1>
                        <p className="text-sm text-slate-500">Leads, deals, and tasks — all in one place.</p>
                    </div>

                    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                        <button type="button" onClick={() => setActiveTab('leads')} className={tabClass(activeTab === 'leads')}>
                            Leads
                        </button>
                        <button type="button" onClick={() => setActiveTab('deals')} className={tabClass(activeTab === 'deals')}>
                            Deals
                        </button>
                        <button type="button" onClick={() => setActiveTab('tasks')} className={tabClass(activeTab === 'tasks')}>
                            Tasks
                        </button>
                        <button type="button" onClick={() => setActiveTab('analytics')} className={tabClass(activeTab === 'analytics')}>
                            Analytics
                        </button>
                    </div>
                </header>

                {/* ═══════ LEADS TAB ═══════ */}
                {activeTab === 'leads' && (
                    <>
                        {/* Toolbar */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
                                <button type="button" onClick={() => setViewMode('list')} className={viewButtonClass(viewMode === 'list')}>
                                    List
                                </button>
                                <button type="button" onClick={() => setViewMode('kanban')} className={viewButtonClass(viewMode === 'kanban')}>
                                    Kanban
                                </button>
                            </div>

                            <button
                                type="button"
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm"
                                onClick={() => setAddModalOpen(true)}
                            >
                                + New Lead
                            </button>
                        </div>

                        {/* Bulk actions bar */}
                        <BulkActionBar
                            count={bulkCount}
                            onClear={clearAll}
                            onBulkStatusChange={handleBulkStatusChange}
                            onBulkAssign={handleBulkAssign}
                            onBulkDelete={handleBulkDelete}
                        />

                        {viewMode === 'list' ? (
                            <>
                                <SearchBar
                                    searchTerm={searchTerm}
                                    onSearchTermChange={setSearchTerm}
                                    statusFilter={statusFilter}
                                    onStatusFilterChange={setStatusFilter}
                                />
                                <LeadsTable
                                    leads={filteredLeads}
                                    onViewLead={openLeadDrawer}
                                    onEditLead={openLeadDrawer}
                                    onWhatsAppLead={openLeadDrawer}
                                    isSelected={isSelected}
                                    onToggleSelect={toggle}
                                    onSelectAll={() => selectAll(filteredLeads.map((l) => l.id))}
                                    onClearAll={clearAll}
                                />
                            </>
                        ) : (
                            <DragKanbanBoard
                                leads={leads}
                                onOpenLead={openLeadDrawer}
                                onStatusChange={updateLeadStatus}
                            />
                        )}

                        {/* Add Lead Modal */}
                        <AddLeadModal open={addModalOpen} onClose={() => setAddModalOpen(false)} onSubmit={addLead} />
                    </>
                )}

                {/* ═══════ ANALYTICS TAB ═══════ */}
                {activeTab === 'analytics' && (
                    <>
                        {/* KPI Stats */}
                        <StatsBar stats={stats} />

                        {/* Lead Analytics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <SourceChart stats={stats} />
                            <StatusChart stats={stats} />
                        </div>

                        {/* Funnel & Agent Performance */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ConversionFunnel stats={stats} />
                            <AgentPerformance leads={leads} />
                        </div>

                        {/* Deal & Task Analytics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DealValueChart deals={allDeals} />
                            <TasksOverviewChart tasks={allTasks} />
                        </div>

                        {/* Tags */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <TopTagsChart leads={leads} />
                        </div>
                    </>
                )}

                {/* ═══════ DEALS TAB ═══════ */}
                {activeTab === 'deals' && (
                    <DealsPipeline
                        stages={stages}
                        byStage={byStage}
                        totals={totals}
                        weighted={weighted}
                        onMoveDeal={moveDeal}
                    />
                )}

                {/* ═══════ TASKS TAB ═══════ */}
                {activeTab === 'tasks' && (
                    <TaskManager
                        byStatus={tasksByStatus}
                        filterStatus={taskFilterStatus}
                        filterPriority={taskFilterPriority}
                        onFilterStatus={setTaskFilterStatus}
                        onFilterPriority={setTaskFilterPriority}
                        onChangeStatus={changeTaskStatus}
                        onDelete={deleteTask}
                    />
                )}
            </div>

            {/* Drawer */}
            <LeadDrawer
                lead={selectedLead}
                open={drawerOpen}
                notes={selectedLeadNotes}
                activities={leadActivities}
                onClose={() => setDrawerOpen(false)}
                onAddNote={handleAddNote}
            />
        </section>
    );
}
