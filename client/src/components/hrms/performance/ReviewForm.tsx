// components/hrms/performance/ReviewForm.tsx
// Performance review form

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Star,
  User,
} from 'lucide-react';
import {
  usePerformanceReview,
  useUpdateReview,
  useSubmitReview,
} from '../../../hooks/hrms/usePerformance';

export function ReviewForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: review, isLoading } = usePerformanceReview(id || '');
  const updateReview = useUpdateReview();
  const submitReview = useSubmitReview();

  const [overallRating, setOverallRating] = useState(3);
  const [comments, setComments] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');

  const handleSubmit = async () => {
    if (!id) return;
    try {
      // First update the review with ratings and comments
      await updateReview.mutateAsync({
        id,
        data: {
          overallRating,
          strengths,
          areasForImprovement: improvements,
          managerComments: comments,
        },
      });
      // Then submit it
      await submitReview.mutateAsync(id);
      navigate('/hrms/performance/reviews');
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Performance Review</h1>
            <p className="text-sm text-gray-500 mt-1">
              {review?.cycleId || 'Review Period'}
            </p>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={updateReview.isPending || submitReview.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          Submit Review
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="font-medium text-gray-900 mb-4">Employee Information</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{review?.employee?.name || 'Employee'}</p>
              <p className="text-sm text-gray-500">Employee</p>
            </div>
          </div>
        </div>

        {/* Review Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overall Rating */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="font-medium text-gray-900 mb-4">Overall Rating</h2>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setOverallRating(rating)}
                  className={`p-2 rounded-lg transition-colors ${
                    rating <= overallRating
                      ? 'text-yellow-500'
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              ))}
              <span className="ml-4 text-lg font-medium text-gray-900">
                {overallRating} / 5
              </span>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="font-medium text-gray-900 mb-4">Review Comments</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Overall Comments
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Provide overall feedback..."
                  rows={4}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Key Strengths
                </label>
                <textarea
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="What are the employee's key strengths?"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Areas for Improvement
                </label>
                <textarea
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="What areas need improvement?"
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
