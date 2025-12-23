// components/hrms/performance/FeedbackPanel.tsx
// Peer feedback panel

import { useState } from 'react';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  Award,
  Heart,
} from 'lucide-react';
import { usePerformanceFeedback, useCreateFeedback } from '../../../hooks/hrms/usePerformance';
import type { PerformanceFeedback } from '../../../api/hrms/performanceApi';

interface FeedbackPanelProps {
  employeeId: string;
}

export function FeedbackPanel({ employeeId }: FeedbackPanelProps) {
  const { data: feedbackList, isLoading } = usePerformanceFeedback({ toEmployeeId: employeeId });
  const createFeedback = useCreateFeedback();

  const [newFeedback, setNewFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<string>('PRAISE');

  const feedbackTypes = [
    { value: 'PRAISE', label: 'Praise', icon: ThumbsUp, color: 'text-green-600' },
    { value: 'RECOGNITION', label: 'Recognition', icon: Award, color: 'text-yellow-600' },
    { value: 'APPRECIATION', label: 'Appreciation', icon: Heart, color: 'text-pink-600' },
    { value: 'CONSTRUCTIVE', label: 'Constructive', icon: MessageSquare, color: 'text-blue-600' },
  ];

  const handleSubmit = async () => {
    if (!newFeedback.trim()) return;
    try {
      await createFeedback.mutateAsync({
        toEmployeeId: employeeId,
        feedbackType: feedbackType as any,
        message: newFeedback,
        isAnonymous: false,
      });
      setNewFeedback('');
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  const getTypeConfig = (type: string) => {
    return feedbackTypes.find(t => t.value === type) || feedbackTypes[0];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Feedback</h2>
        <p className="text-sm text-gray-500 mt-1">Give and receive feedback</p>
      </div>

      {/* New Feedback Form */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex gap-2 mb-3">
          {feedbackTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.value}
                onClick={() => setFeedbackType(type.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                  feedbackType === type.value
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {type.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <textarea
            value={newFeedback}
            onChange={(e) => setNewFeedback(e.target.value)}
            placeholder="Write your feedback..."
            rows={3}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex justify-end mt-2">
          <button
            onClick={handleSubmit}
            disabled={!newFeedback.trim() || createFeedback.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Send Feedback
          </button>
        </div>
      </div>

      {/* Feedback List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : feedbackList?.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No feedback yet</h3>
          <p className="text-gray-500">Be the first to provide feedback</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbackList?.map((feedback: PerformanceFeedback) => {
            const typeConfig = getTypeConfig(feedback.feedbackType);
            const Icon = typeConfig.icon;
            return (
              <div key={feedback.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 ${typeConfig.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {feedback.isAnonymous ? 'Anonymous' : feedback.fromEmployee?.name || 'Someone'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-1">{feedback.message}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
