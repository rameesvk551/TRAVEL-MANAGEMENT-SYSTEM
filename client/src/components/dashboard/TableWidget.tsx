
interface TableWidgetProps {
    data: any[];
    columns?: { key: string; label: string }[];
}

export function TableWidget({ data, columns }: TableWidgetProps) {
    const tableColumns = columns || [
        { key: 'name', label: 'Item' },
        { key: 'value', label: 'Value' },
    ];

    return (
        <div className="h-full w-full overflow-auto">
            <table className="w-full border-collapse text-left">
                <thead>
                    <tr className="border-b border-dashboard-slate-100 bg-dashboard-slate-50/50">
                        {tableColumns.map((col) => (
                            <th key={col.key} className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-dashboard-slate-400">
                                {col.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-dashboard-slate-50">
                    {data.map((row, i) => (
                        <tr key={i} className="hover:bg-dashboard-slate-50/30 transition-colors">
                            {tableColumns.map((col) => (
                                <td key={col.key} className="px-4 py-2 text-xs text-dashboard-slate-700">
                                    {row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
