/**
 * Progress indicator for multi-step registration
 */

import React from 'react';
import { Check } from 'lucide-react';
import { TOTAL_STEPS } from './types';

interface ProgressIndicatorProps {
  currentStep: number;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => (
          <React.Fragment key={i}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                i + 1 < currentStep
                  ? 'bg-primary text-white'
                  : i + 1 === currentStep
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {i + 1 < currentStep ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            {i < TOTAL_STEPS - 1 && (
              <div
                className={`flex-1 h-1 rounded ${
                  i + 1 < currentStep ? 'bg-primary' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Admin Info</span>
        <span>Security</span>
        <span>Company</span>
      </div>
    </div>
  );
};
