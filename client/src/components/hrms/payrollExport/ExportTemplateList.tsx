// components/hrms/payrollExport/ExportTemplateList.tsx
// List of payroll export templates

import { Link } from 'react-router-dom';
import {
  Plus,
  FileSpreadsheet,
  ChevronRight,
  Trash2,
  Copy,
} from 'lucide-react';
import {
  usePayrollExportTemplates,
  useDeletePayrollExportTemplate,
  useDuplicatePayrollExportTemplate,
} from '../../../hooks/hrms/usePayrollExport';
import type { PayrollExportTemplate } from '../../../api/hrms/payrollExportApi';

export function ExportTemplateList() {
  const { data: templates, isLoading } = usePayrollExportTemplates();
  const deleteMutation = useDeletePayrollExportTemplate();
  const duplicateMutation = useDuplicatePayrollExportTemplate();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const handleDuplicate = async (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await duplicateMutation.mutateAsync({ id, newName: `${name} (Copy)` });
    } catch (error) {
      console.error('Duplicate failed:', error);
    }
  };

  const getFormatBadge = (format: string) => {
    const colors: Record<string, string> = {
      CSV: 'bg-green-100 text-green-700',
      EXCEL: 'bg-blue-100 text-blue-700',
      JSON: 'bg-purple-100 text-purple-700',
      PDF: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[format] || 'bg-gray-100 text-gray-700'}`}>
        {format}
      </span>
    );
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Export Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage payroll export templates</p>
        </div>
        <Link
          to="/hrms/payroll-export/templates/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Template
        </Link>
      </div>

      {/* Templates List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : templates?.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates</h3>
          <p className="text-gray-500 mb-4">Create your first export template</p>
          <Link
            to="/hrms/payroll-export/templates/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border divide-y">
          {templates?.map((template: PayrollExportTemplate) => (
            <Link
              key={template.id}
              to={`/hrms/payroll-export/templates/${template.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{template.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getFormatBadge(template.exportFormat)}
                    <span className="text-sm text-gray-500">
                      {template.fieldMappings?.length || 0} fields
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDuplicate(template.id, template.name, e)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDelete(template.id, e)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
