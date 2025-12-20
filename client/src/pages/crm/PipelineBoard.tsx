import React, { useEffect } from 'react';
import { useCrmStore } from '../../store/crmStore';
import { Link } from 'react-router-dom';

export const PipelineBoard: React.FC = () => {
    const {
        pipelines,
        currentPipelineId,
        boardLeads,
        fetchPipelines,
        fetchBoard,
        moveCard,
        loading
    } = useCrmStore();

    useEffect(() => {
        if (!currentPipelineId && pipelines.length === 0) {
            fetchPipelines();
        }
    }, [pipelines]);

    useEffect(() => {
        if (currentPipelineId) {
            fetchBoard(currentPipelineId);
        }
    }, [currentPipelineId]);

    const activePipeline = pipelines.find(p => p.id === currentPipelineId);

    // Group leads by stage
    const columns = (activePipeline?.stages || []).map(stage => ({
        stage,
        leads: boardLeads.filter(l => l.stageId === stage.id)
    }));

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        e.dataTransfer.setData('leadId', leadId);
    };

    const handleDrop = (e: React.DragEvent, stageId: string) => {
        const leadId = e.dataTransfer.getData('leadId');
        if (leadId) {
            moveCard(leadId, stageId);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    if (loading && !activePipeline) return <div className="p-8">Loading CRM...</div>;

    return (
        <div className="h-full flex flex-col">
            <header className="px-6 py-4 border-b flex justify-between items-center bg-white dark:bg-slate-900">
                <h1 className="text-2xl font-bold">Pipeline: {activePipeline?.name}</h1>
                <div className="flex gap-2">
                    {/* Pipeline Switcher could go here */}
                    <Link to="/crm/leads/new" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                        + New Lead
                    </Link>
                </div>
            </header>

            <div className="flex-1 overflow-x-auto p-6 whitespace-nowrap gap-4 flex bg-slate-50 dark:bg-slate-950">
                {columns.map(({ stage, leads }) => (
                    <div
                        key={stage.id}
                        className="w-80 flex-shrink-0 flex flex-col bg-slate-100 dark:bg-slate-900 rounded-lg border shadow-sm"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, stage.id)}
                    >
                        {/* Column Header */}
                        <div className="p-3 font-semibold border-b flex justify-between items-center" style={{ borderTop: `4px solid ${stage.color || '#ccc'}` }}>
                            <span>{stage.name}</span>
                            <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-full">{leads.length}</span>
                        </div>

                        {/* Cards Area */}
                        <div className="flex-1 p-2 overflow-y-auto space-y-3">
                            {leads.map(lead => (
                                <Link
                                    to={`/crm/leads/${lead.id}`}
                                    key={lead.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, lead.id)}
                                    className="block bg-white dark:bg-slate-800 p-3 rounded shadow-sm border border-slate-200 dark:border-slate-700 cursor-move hover:shadow-md transition-shadow whitespace-normal"
                                >
                                    <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">{lead.name}</div>
                                    <div className="text-sm text-slate-500 mb-2 truncate">{lead.email || 'No email'}</div>
                                    <div className="flex justify-between items-center text-xs text-slate-400">
                                        <span>{lead.score} pts</span>
                                        <span className={`px-1 rounded ${lead.priority === 'URGENT' ? 'bg-red-100 text-red-800' : 'bg-slate-100'}`}>
                                            {lead.priority}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
