import React from 'react';
import { DollarSign } from 'lucide-react';
import type { Deal, DealStage } from '../data/deals';

function fmt(n: number) {
    return '₹' + n.toLocaleString('en-IN');
}

const stageColors: Record<DealStage, string> = {
    Discovery: 'border-blue-300 bg-blue-50',
    Proposal: 'border-amber-300 bg-amber-50',
    Negotiation: 'border-purple-300 bg-purple-50',
    'Closed Won': 'border-green-300 bg-green-50',
    'Closed Lost': 'border-red-300 bg-red-50',
};

interface Props {
    stages: DealStage[];
    byStage: Record<DealStage, Deal[]>;
    totals: Record<DealStage, number>;
    weighted: number;
    onMoveDeal: (dealId: string, stage: DealStage) => void;
}

export const DealsPipeline: React.FC<Props> = ({ stages, byStage, totals, weighted, onMoveDeal }) => {
    const [dragging, setDragging] = React.useState<string | null>(null);

    return (
        <div className="space-y-3">
            {/* Weighted total */}
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <DollarSign size={16} className="text-green-500" />
                Weighted pipeline: <span className="text-green-700 font-bold">{fmt(weighted)}</span>
            </div>

            <div className="grid grid-cols-5 gap-3">
                {stages.map((stage) => (
                    <div
                        key={stage}
                        className={`rounded-lg border-2 p-3 min-h-[220px] ${stageColors[stage]}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                            if (dragging) onMoveDeal(dragging, stage);
                            setDragging(null);
                        }}
                    >
                        {/* Column header */}
                        <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600">{stage}</h4>
                            <span className="text-xs text-gray-500">{fmt(totals[stage])}</span>
                        </div>

                        {/* Deal cards */}
                        <div className="space-y-2">
                            {byStage[stage].map((deal) => (
                                <div
                                    key={deal.id}
                                    draggable
                                    onDragStart={() => setDragging(deal.id)}
                                    onDragEnd={() => setDragging(null)}
                                    className="cursor-grab rounded border border-white bg-white p-2 shadow-sm active:cursor-grabbing"
                                >
                                    <p className="text-sm font-medium text-gray-800 truncate">{deal.title}</p>
                                    <p className="text-xs text-gray-500">{fmt(deal.value)}</p>
                                    <div className="mt-1 flex items-center justify-between text-[11px] text-gray-400">
                                        <span>{deal.probability}%</span>
                                        <span>{deal.assignedTo.split(' ')[0]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
