// components/hrms/payrollExport/ExportHistory.tsx
// Payroll export history and status tracking

import { useState } from 'react';
import {
  History,
  Download,
  FileSpreadsheet,
  Check,
  X,
  Clock,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { usePayrollExports, useDownloadPayrollExport } from '../../../hooks/hrms/usePayrollExport';
import type { PayrollExport } from '../../../api/hrms/payrollExportApi';

export function ExportHistory() {
  const [filters, setFilters] = useState({
    periodYear: new Date().getFullYear(),
    periodMonth: undefined as number | undefined,
  });

  const { data: exports, isLoading, refetch } = usePayrollExports({
    periodYear: filters.periodYear,
    periodMonth: filters.periodMonth,
  });

  const downloadMutation = useDownloadPayrollExport();

  const handleDownload = async (exportId: string, fileName: string) => {
    try {
      const blob = await downloadMutation.mutateAsync(exportId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; color: string }> = {
      PENDING: { icon: <Clock className="h-3 w-3" />, color: 'bg-yellow-100 text-yellow-800' },
      PROCESSING: { icon: <Loader2 className="h-3 w-3 animate-spin" />, color: 'bg-blue-100 text-blue-800' },
      COMPLETED: { icon: <Check className="h-3 w-3" />, color: 'bg-green-100 text-green-800' },
      FAILED: { icon: <X className="h-3 w-3" />, color: 'bg-red-100 text-red-800' },
    };
    const config = configs[status] || configs.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${config.color}`}>
        {config.icon}
        {status}
      </span>
    );
  };

  const months = [
    'All Months', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <History className="h-6 w-6" />
            Export History
          </h1>
          <p className="text-sm text-gray-500 mt-1">View and download previous payroll exports</p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">Year</label>
            <select
              value={filters.periodYear}
              onChange={(e) => setFilters({ ...filters, periodYear: Number(e.target.value) })}
              className="px-3 py-2 border rounded-lg"
            >
              {[2024, 2025, 2026].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Month</label>
            <select
              value={filters.periodMonth || 0}
              onChange={(e) => setFilters({
                ...filters,
                periodMonth: Number(e.target.value) || undefined,
              })}
              className="px-3 py-2 border rounded-lg"
            >
              {months.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exports List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : exports?.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No exports found</h3>
          <p className="text-gray-500">No payroll exports match your filters</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Template</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Period</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Exported</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {exports?.map((exp: PayrollExport) => (
                <tr key={exp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{exp.template?.name || exp.fileName || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(exp.periodYear, exp.periodMonth - 1).toLocaleString('default', {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(exp.status)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(exp.exportedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {exp.status === 'COMPLETED' && exp.fileUrl && (
                      <button
                        onClick={() => handleDownload(exp.id, exp.fileName || `export-${exp.id}.csv`)}
                        disabled={downloadMutation.isPending}
                        className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
