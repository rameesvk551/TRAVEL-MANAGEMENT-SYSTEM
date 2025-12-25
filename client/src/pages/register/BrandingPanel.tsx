/**
 * Right side branding panel for registration page
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const BENEFITS = [
  'Complete booking management system',
  'Resource & inventory tracking',
  'HRMS & payroll management',
  'Multi-branch support',
  'CRM & customer management',
  'Real-time analytics & reports',
];

export const BrandingPanel: React.FC = () => {
  return (
    <div className="hidden lg:flex flex-1 bg-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-800" />
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 400">
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col justify-center p-12 text-white">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-4xl font-bold mb-4">
            Streamline Your Travel Business
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Manage bookings, resources, inventory, and your entire team 
            with our comprehensive ERP solution.
          </p>
          
          {/* Benefits */}
          <div className="space-y-4">
            {BENEFITS.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
