// pages/hrms/PerformancePage.tsx
// Performance Management Page

import React, { useState } from 'react';
import {
  Target,
  Star,
  MessageSquare,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import {
  GoalList,
  ReviewForm,
  FeedbackPanel,
  PerformanceCycleList,
} from '../../components/hrms/performance';
import { useAuthStore } from '../../store';

type Tab = 'goals' | 'reviews' | 'feedback' | 'cycles';

export function PerformancePage() {
  const [activeTab, setActiveTab] = useState<Tab>('goals');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { user } = useAuthStore();

  // Get current employee ID from auth context
  const currentEmployeeId = user?.id || '';

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'goals', label: 'My Goals', icon: <Target className="h-4 w-4" /> },
    { id: 'reviews', label: 'Reviews', icon: <Star className="h-4 w-4" /> },
    { id: 'feedback', label: 'Feedback', icon: <MessageSquare className="h-4 w-4" /> },
    { id: 'cycles', label: 'Review Cycles', icon: <Calendar className="h-4 w-4" /> },
  ];

  if (showReviewForm) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <ReviewForm />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <TrendingUp className="h-7 w-7 text-blue-600" />
          Performance Management
        </h1>
        <p className="mt-1 text-gray-500">
          Track goals, conduct reviews, and provide feedback
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">8</div>
              <div className="text-sm text-gray-500">Active Goals</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">65%</div>
              <div className="text-sm text-gray-500">Avg Progress</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">2</div>
              <div className="text-sm text-gray-500">Pending Reviews</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-gray-500">Feedback Received</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition
                ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border">
        {activeTab === 'goals' && <GoalList employeeId={currentEmployeeId} />}
        
        {activeTab === 'reviews' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Performance Reviews</h2>
              <button
                onClick={() => setShowReviewForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Start Self Review
              </button>
            </div>
            <div className="text-center py-8 text-gray-500">
              No reviews available. Start your self-review or wait for manager review.
            </div>
          </div>
        )}
        
        {activeTab === 'feedback' && <FeedbackPanel employeeId={currentEmployeeId} />}
        
        {activeTab === 'cycles' && <PerformanceCycleList />}
      </div>
    </div>
  );
}
