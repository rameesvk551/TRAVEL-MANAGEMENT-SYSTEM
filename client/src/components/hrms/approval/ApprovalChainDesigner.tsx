// components/hrms/approval/ApprovalChainDesigner.tsx
// Visual approval chain designer

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Save,
  GripVertical,
  Trash2,
  User,
  Users,
  Building,
} from 'lucide-react';
import {
  useApprovalChain,
  useCreateApprovalChain,
  useUpdateApprovalChain,
} from '../../../hooks/hrms/useApproval';
import type { ApprovalEntityType } from '../../../api/hrms/approvalApi';

interface StepFormData {
  name: string;
  approverType: string;
  approverId?: string;
  requiresComment: boolean;
  canSkip: boolean;
}

export function ApprovalChainDesigner() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: existingChain } = useApprovalChain(id || '');
  const createChain = useCreateApprovalChain();
  const updateChain = useUpdateApprovalChain();

  const [chainName, setChainName] = useState(existingChain?.name || '');
  const [description, setDescription] = useState(existingChain?.description || '');
  const [entityType, setEntityType] = useState<ApprovalEntityType>(existingChain?.entityType || 'LEAVE');
  const [steps, setSteps] = useState<StepFormData[]>([]);

  const approverTypes = [
    { value: 'DIRECT_MANAGER', label: 'Direct Manager', icon: User },
    { value: 'DEPARTMENT_HEAD', label: 'Department Head', icon: Building },
    { value: 'HR_MANAGER', label: 'HR Manager', icon: Users },
    { value: 'SPECIFIC_USER', label: 'Specific User', icon: User },
  ];

  const entityTypes = [
    'LEAVE', 'EXPENSE', 'OVERTIME', 'TRAVEL', 'DOCUMENT', 
    'SALARY_CHANGE', 'PROMOTION', 'TERMINATION'
  ];

  const addStep = () => {
    setSteps([...steps, {
      name: `Step ${steps.length + 1}`,
      approverType: 'DIRECT_MANAGER',
      requiresComment: false,
      canSkip: false,
    }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, updates: Partial<StepFormData>) => {
    setSteps(steps.map((step, i) => i === index ? { ...step, ...updates } : step));
  };

  const handleSave = async () => {
    try {
      const data = {
        name: chainName,
        description,
        entityType: entityType as any,
        steps: steps.map((step, index) => ({
          stepOrder: index + 1,
          name: step.name,
          approverType: step.approverType as any,
          approverId: step.approverId,
          requiresComment: step.requiresComment,
          canSkip: step.canSkip,
        })),
      };

      if (isEditing && id) {
        await updateChain.mutateAsync({ id, data: { name: chainName, description } });
      } else {
        await createChain.mutateAsync(data);
      }
      navigate('/hrms/approvals/chains');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isEditing ? 'Edit Approval Chain' : 'Create Approval Chain'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Define the approval workflow steps</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={!chainName || steps.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Save Chain
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chain Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="font-medium text-gray-900 mb-4">Chain Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chain Name</label>
              <input
                type="text"
                value={chainName}
                onChange={(e) => setChainName(e.target.value)}
                placeholder="e.g., Leave Approval Chain"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this approval chain..."
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Type</label>
              <select
                value={entityType}
                onChange={(e) => setEntityType(e.target.value as ApprovalEntityType)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {entityTypes.map((type) => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Steps Designer */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-medium text-gray-900">Approval Steps</h2>
            <button
              onClick={addStep}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>

          {steps.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
              <p className="text-gray-500 mb-4">No steps defined yet</p>
              <button
                onClick={addStep}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add First Step
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                    <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={step.name}
                      onChange={(e) => updateStep(index, { name: e.target.value })}
                      className="flex-1 px-3 py-1.5 border rounded-lg"
                    />
                    <button
                      onClick={() => removeStep(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 ml-14">
                    <div>
                      <label className="block text-sm text-gray-500 mb-1">Approver Type</label>
                      <select
                        value={step.approverType}
                        onChange={(e) => updateStep(index, { approverType: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        {approverTypes.map((type) => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={step.requiresComment}
                          onChange={(e) => updateStep(index, { requiresComment: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Require Comment</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={step.canSkip}
                          onChange={(e) => updateStep(index, { canSkip: e.target.checked })}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">Can Skip</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
