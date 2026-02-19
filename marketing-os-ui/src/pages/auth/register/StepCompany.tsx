/**
 * Step 3: Company Details
 */

import React from 'react';
import { Building2, Hash, MapPin, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import type { Step3Props } from './types';

export const StepCompany: React.FC<Step3Props> = ({
    formData,
    onChange,
    onBack,
    isLoading,
}) => {
    return (
        <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                    Company name *
                </label>
                <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        id="companyName"
                        name="companyName"
                        type="text"
                        required
                        value={formData.companyName}
                        onChange={onChange}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                        placeholder="Your Company"
                    />
                </div>
            </div>

            <div>
                <label htmlFor="companySlug" className="block text-sm font-medium text-gray-700 mb-2">
                    Company URL slug *
                </label>
                <div className="relative">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        id="companySlug"
                        name="companySlug"
                        type="text"
                        required
                        value={formData.companySlug}
                        onChange={onChange}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                        placeholder="your-company"
                    />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    This becomes your tenant URL (e.g. your-company.travelerp.com)
                </p>
            </div>

            <div>
                <label htmlFor="companyCity" className="block text-sm font-medium text-gray-700 mb-2">
                    Primary city *
                </label>
                <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        id="companyCity"
                        name="companyCity"
                        type="text"
                        required
                        value={formData.companyCity}
                        onChange={onChange}
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
                        placeholder="City where you operate"
                    />
                </div>
            </div>

            <div className="flex gap-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Creating company...
                        </>
                    ) : (
                        <>
                            Register Company
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};
