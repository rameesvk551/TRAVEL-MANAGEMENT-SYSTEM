// components/hrms/payrollExport/ExportWizard.tsx
// Step-by-step payroll export wizard

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  FileSpreadsheet,
  Check,
  Download,
} from 'lucide-react';
import {
  usePayrollExportTemplates,
  useCreatePayrollExport,
} from '../../../hooks/hrms/usePayrollExport';
import type { PayrollExportTemplate } from '../../../api/hrms/payrollExportApi';

export function ExportWizard() {
  const navigate = useNavigate();
  const { data: templates } = usePayrollExportTemplates();
  const createExport = useCreatePayrollExport();

  const [step, setStep] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear());
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1);
  const [notes, setNotes] = useState('');

  const steps = [
    { number: 1, title: 'Select Template' },
    { number: 2, title: 'Choose Period' },
    { number: 3, title: 'Review & Export' },
  ];

  const handleExport = async () => {
    try {
      await createExport.mutateAsync({
        templateId: selectedTemplateId,
        exportType: 'CUSTOM',
        periodYear,
        periodMonth,
        metadata: notes ? { notes } : undefined,
      });
      navigate('/hrms/payroll-export/history');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const selectedTemplate = templates?.find((t: PayrollExportTemplate) => t.id === selectedTemplateId);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Export Payroll</h1>
          <p className="text-sm text-gray-500 mt-1">Generate payroll export files</p>
        </div>
      </div>

      {/* Steps Progress */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div className={`flex items-center gap-2 ${
                step >= s.number ? 'text-blue-600' : 'text-gray-400'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step > s.number
                    ? 'bg-blue-600 text-white'
                    : step === s.number
                    ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > s.number ? <Check className="w-4 h-4" /> : s.number}
                </div>
                <span className="font-medium">{s.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-24 h-0.5 mx-4 ${
                  step > s.number ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        {/* Step 1: Select Template */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-medium text-gray-900">Select Export Template</h2>
            {templates?.length === 0 ? (
              <p className="text-gray-500">No templates available. Create a template first.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates?.map((template: PayrollExportTemplate) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplateId === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-6 h-6 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{template.name}</p>
                        <p className="text-sm text-gray-500">
                          {template.exportFormat} • {template.fieldMappings?.length || 0} fields
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Choose Period */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-medium text-gray-900">Select Pay Period</h2>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <select
                  value={periodYear}
                  onChange={(e) => setPeriodYear(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {[2024, 2025, 2026].map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes for this export..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Step 3: Review & Export */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-medium text-gray-900">Review Export Details</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Template:</span>
                <span className="font-medium">{selectedTemplate?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Format:</span>
                <span className="font-medium">{selectedTemplate?.exportFormat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Period:</span>
                <span className="font-medium">
                  {new Date(periodYear, periodMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
              </div>
              {notes && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Notes:</span>
                  <span className="font-medium">{notes}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>
        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={(step === 1 && !selectedTemplateId)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleExport}
            disabled={createExport.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {createExport.isPending ? 'Exporting...' : 'Generate Export'}
          </button>
        )}
      </div>
    </div>
  );
}
