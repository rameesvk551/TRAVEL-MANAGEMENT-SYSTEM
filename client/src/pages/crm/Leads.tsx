import React from 'react';
import { Link } from 'react-router-dom';
import { useLeads } from '@/hooks';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';

export const Leads: React.FC = () => {
    const { data, isLoading, error } = useLeads();

    if (isLoading) return <div className="p-8">Loading leads...</div>;
    if (error) return <div className="p-8 text-destructive">Error loading leads</div>;

    const leads = data?.leads || [];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
                <Link to="/crm/leads/new">
                    <Button>+ New Lead</Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Leads ({data?.total || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead>
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Source</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Score</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leads.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="h-24 text-center">No leads found.</td>
                                    </tr>
                                ) : (
                                    leads.map((lead) => (
                                        <tr key={lead.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle">
                                                <Link to={`/crm/leads/${lead.id}`} className="font-medium hover:underline text-primary">
                                                    {lead.name}
                                                </Link>
                                                <div className="text-xs text-muted-foreground">{lead.email}</div>
                                            </td>
                                            <td className="p-4 align-middle">{lead.source}</td>
                                            <td className="p-4 align-middle">
                                                <span className="capitalize px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle font-mono">{lead.score}</td>
                                            <td className="p-4 align-middle">
                                                <Link to={`/crm/leads/${lead.id}`}>
                                                    <Button variant="ghost" size="sm">View Details</Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
