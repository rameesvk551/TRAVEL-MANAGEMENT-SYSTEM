/**
 * Step 3: Company Info
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Hash,
  FileText,
  Globe,
  Phone,
  MapPin,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import type { Step3Props } from './types';

export const StepCompanyInfo: React.FC<Step3Props> = ({
  formData,
  onChange,
  onBack,
  onSubmit,
  isLoading,
}) => {
  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
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
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Your Company Name"
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
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="your-company-name"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          This will be used for your company's unique identifier (e.g., your-company.travelerp.com)
        </p>
      </div>

      <div>
        <label htmlFor="companyDescription" className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <div className="relative">
          <FileText className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
          <textarea
            id="companyDescription"
            name="companyDescription"
            rows={3}
            value={formData.companyDescription}
            onChange={onChange}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            placeholder="Tell us about your company..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="companyWebsite" className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="companyWebsite"
              name="companyWebsite"
              type="url"
              value={formData.companyWebsite}
              onChange={onChange}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="https://..."
            />
          </div>
        </div>
        <div>
          <label htmlFor="companyPhone" className="block text-sm font-medium text-gray-700 mb-2">
            Business phone
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="companyPhone"
              name="companyPhone"
              type="tel"
              value={formData.companyPhone}
              onChange={onChange}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
              placeholder="+1 (555) 000-0000"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business address
        </label>
        <div className="relative mb-3">
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            name="street"
            type="text"
            value={formData.street}
            onChange={onChange}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Street address"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input
            name="city"
            type="text"
            value={formData.city}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="City"
          />
          <input
            name="state"
            type="text"
            value={formData.state}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="State/Province"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            name="country"
            value={formData.country}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
          >
            <option value="">Country</option>
            <option value="US">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
            <option value="IN">India</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="ES">Spain</option>
            <option value="IT">Italy</option>
            <option value="JP">Japan</option>
            <option value="TH">Thailand</option>
            <option value="MX">Mexico</option>
            <option value="AE">United Arab Emirates</option>
            <option value="SA">Saudi Arabia</option>
            <option value="SG">Singapore</option>
          </select>
          <input
            name="postalCode"
            type="text"
            value={formData.postalCode}
            onChange={onChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="Postal code"
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
          onClick={onSubmit}
          disabled={isLoading}
          className="flex-1 py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Register Company
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};
