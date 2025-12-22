import React, { useState } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../utils';
import {
  useCreateExpenseClaim,
  useUpdateExpenseClaim,
} from '../../../hooks/hrms/useExpenses';
import type {
  ExpenseClaim,
  ExpenseItem,
  ExpenseCategory,
  PaymentMethod,
  CreateExpenseItemDTO,
  CreateExpenseClaimDTO,
} from '../../../api/hrms/expenseApi';

interface ExpenseClaimFormProps {
  employeeId?: string; // Optional, kept for future use when assigning claims to specific employees
  claim?: ExpenseClaim;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExpenseItemFormData {
  id?: string;
  tempId: string;
  date: string;
  category: ExpenseCategory | '';
  description: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  receiptUrl?: string;
  receiptFileName?: string;
  notes?: string;
}

const expenseCategories: { value: ExpenseCategory; label: string }[] = [
  { value: 'TRANSPORT', label: 'Transportation' },
  { value: 'ACCOMMODATION', label: 'Accommodation' },
  { value: 'MEALS', label: 'Meals' },
  { value: 'COMMUNICATION', label: 'Communication' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'FUEL', label: 'Fuel' },
  { value: 'TOLLS', label: 'Tolls' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'SUPPLIES', label: 'Supplies' },
  { value: 'OTHER', label: 'Other' },
];

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Cash' },
  { value: 'COMPANY_CARD', label: 'Company Card' },
  { value: 'PERSONAL_CARD', label: 'Personal Card' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'OTHER', label: 'Other' },
];

const currencies = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CNY'];

export const ExpenseClaimForm: React.FC<ExpenseClaimFormProps> = ({
  claim,
  onClose,
  onSuccess,
}) => {
  const isEditing = !!claim;

  const [formData, setFormData] = useState({
    title: claim?.title || '',
    description: claim?.description || '',
    tripId: claim?.tripId || '',
    currency: claim?.currency || 'USD',
  });

  const [items, setItems] = useState<ExpenseItemFormData[]>(() => {
    if (claim?.items && claim.items.length > 0) {
      return claim.items.map((item: ExpenseItem) => ({
        id: item.id,
        tempId: item.id,
        date: item.date.split('T')[0],
        category: item.category,
        description: item.description,
        amount: item.amount,
        currency: item.currency,
        paymentMethod: item.paymentMethod,
        receiptUrl: item.receiptUrl,
        receiptFileName: item.receiptFileName,
        notes: item.notes,
      }));
    }
    return [createNewItem()];
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateExpenseClaim();
  const updateMutation = useUpdateExpenseClaim();

  function createNewItem(): ExpenseItemFormData {
    return {
      tempId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString().split('T')[0],
      category: '',
      description: '',
      amount: 0,
      currency: formData.currency,
      paymentMethod: 'CASH',
    };
  }

  const addItem = () => {
    setItems([...items, createNewItem()]);
  };

  const removeItem = (tempId: string) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.tempId !== tempId));
    }
  };

  const updateItem = (tempId: string, field: keyof ExpenseItemFormData, value: unknown) => {
    setItems(
      items.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    items.forEach((item, index) => {
      if (!item.date) {
        newErrors[`item-${index}-date`] = 'Date is required';
      }
      if (!item.category) {
        newErrors[`item-${index}-category`] = 'Category is required';
      }
      if (!item.description.trim()) {
        newErrors[`item-${index}-description`] = 'Description is required';
      }
      if (item.amount <= 0) {
        newErrors[`item-${index}-amount`] = 'Amount must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const expenseItems: CreateExpenseItemDTO[] = items.map((item) => ({
      date: item.date,
      category: item.category as ExpenseCategory,
      description: item.description,
      amount: item.amount,
      currency: item.currency,
      paymentMethod: item.paymentMethod,
      receiptUrl: item.receiptUrl,
      receiptFileName: item.receiptFileName,
      notes: item.notes,
    }));

    try {
      if (isEditing && claim) {
        const updateData: Partial<CreateExpenseClaimDTO> = {
          title: formData.title,
          description: formData.description,
          tripId: formData.tripId || undefined,
          currency: formData.currency,
          items: expenseItems,
        };
        await updateMutation.mutateAsync({ id: claim.id, data: updateData });
      } else {
        const createData: CreateExpenseClaimDTO = {
          title: formData.title,
          description: formData.description,
          tripId: formData.tripId || undefined,
          currency: formData.currency,
          items: expenseItems,
        };
        await createMutation.mutateAsync(createData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save expense claim:', error);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Expense Claim' : 'New Expense Claim'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isEditing ? 'Update expense claim details' : 'Create a new expense claim with items'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Claim Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Claim Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Business Trip to NYC"
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    )}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {currencies.map((currency) => (
                      <option key={currency} value={currency}>
                        {currency}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trip ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.tripId}
                    onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}
                    placeholder="Link to a trip"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description or notes about this expense claim..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Expense Items */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Expense Items
                </h3>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.tempId}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-sm font-medium text-gray-600">
                        Item #{index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(item.tempId)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => updateItem(item.tempId, 'date', e.target.value)}
                            className={cn(
                              'w-full pl-8 pr-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                              errors[`item-${index}-date`] ? 'border-red-300' : 'border-gray-300'
                            )}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Category <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={item.category}
                          onChange={(e) => updateItem(item.tempId, 'category', e.target.value)}
                          className={cn(
                            'w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                            errors[`item-${index}-category`] ? 'border-red-300' : 'border-gray-300'
                          )}
                        >
                          <option value="">Select category</option>
                          {expenseCategories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Amount <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                            {formData.currency}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.amount || ''}
                            onChange={(e) =>
                              updateItem(item.tempId, 'amount', parseFloat(e.target.value) || 0)
                            }
                            className={cn(
                              'w-full pl-12 pr-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                              errors[`item-${index}-amount`] ? 'border-red-300' : 'border-gray-300'
                            )}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Payment Method
                        </label>
                        <select
                          value={item.paymentMethod}
                          onChange={(e) => updateItem(item.tempId, 'paymentMethod', e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {paymentMethods.map((method) => (
                            <option key={method.value} value={method.value}>
                              {method.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateItem(item.tempId, 'description', e.target.value)}
                          placeholder="Brief description"
                          className={cn(
                            'w-full px-2 py-1.5 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                            errors[`item-${index}-description`] ? 'border-red-300' : 'border-gray-300'
                          )}
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Notes (Optional)
                        </label>
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => updateItem(item.tempId, 'notes', e.target.value)}
                          placeholder="Additional notes or context"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="flex justify-end">
                <div className="bg-blue-50 rounded-lg px-4 py-2">
                  <span className="text-sm text-gray-600">Total: </span>
                  <span className="text-lg font-semibold text-blue-700">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: formData.currency,
                    }).format(totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Error Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Please fix the following errors:
                  </p>
                  <ul className="text-sm text-red-600 mt-1 list-disc list-inside">
                    {Object.values(errors).slice(0, 5).map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                    {Object.keys(errors).length > 5 && (
                      <li>...and {Object.keys(errors).length - 5} more</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Claim' : 'Create Claim'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseClaimForm;
