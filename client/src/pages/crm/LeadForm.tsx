import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useCrmStore } from '../../store/crmStore';

interface LeadFormData {
    name: string;
    email: string;
    phone: string;
    source: string;
    priority: string; // 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    notes: string;
    // Travel Preferences
    destination: string;
    budget: number;
    startDate: string;
    endDate: string;
}

export const LeadForm: React.FC = () => {
    const { register, handleSubmit, formState: { errors } } = useForm<LeadFormData>();
    const navigate = useNavigate();
    const { addLead, loading } = useCrmStore();

    const onSubmit = async (data: LeadFormData) => {
        try {
            await addLead({
                name: data.name,
                email: data.email,
                phone: data.phone,
                source: data.source || 'MANUAL',
                priority: data.priority as any,
                travelPreferences: {
                    destination: data.destination,
                    budget: Number(data.budget),
                    startDate: data.startDate,
                    endDate: data.endDate,
                },
                // status/stage will be defaulted by backend logic
                score: 10 // default initial score
            });
            navigate('/crm');
        } catch (error) {
            console.error('Failed to create lead:', error);
            alert('Failed to create lead');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-lg shadow mt-8">
            <h1 className="text-2xl font-bold mb-6">New Lead</h1>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-500 border-b pb-1">Contact Details</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">Full Name *</label>
                            <input
                                {...register('name', { required: 'Name is required' })}
                                className="w-full p-2 border rounded dark:bg-slate-800"
                            />
                            {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                type="email"
                                {...register('email')}
                                className="w-full p-2 border rounded dark:bg-slate-800"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Phone</label>
                            <input
                                {...register('phone')}
                                className="w-full p-2 border rounded dark:bg-slate-800"
                            />
                        </div>
                    </div>

                    {/* Lead Info */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-gray-500 border-b pb-1">Lead Info</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">Source</label>
                            <select {...register('source')} className="w-full p-2 border rounded dark:bg-slate-800">
                                <option value="MANUAL">Manual Entry</option>
                                <option value="PHONE">Phone Inquiry</option>
                                <option value="EMAIL">Email Inquiry</option>
                                <option value="WALK_IN">Walk-in</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Priority</label>
                            <select {...register('priority')} className="w-full p-2 border rounded dark:bg-slate-800">
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Travel Preferences */}
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-500 border-b pb-1">Travel Preferences</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Destination</label>
                            <input {...register('destination')} className="w-full p-2 border rounded dark:bg-slate-800" placeholder="e.g. Bali" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Budget ($)</label>
                            <input type="number" {...register('budget')} className="w-full p-2 border rounded dark:bg-slate-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <input type="date" {...register('startDate')} className="w-full p-2 border rounded dark:bg-slate-800" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <input type="date" {...register('endDate')} className="w-full p-2 border rounded dark:bg-slate-800" />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/crm')}
                        className="px-4 py-2 border rounded hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Lead'}
                    </button>
                </div>
            </form>
        </div>
    );
};
