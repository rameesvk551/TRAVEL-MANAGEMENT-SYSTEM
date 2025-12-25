/**
 * Top Insights Panel
 * AI-driven insights for executives
 */
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from 'lucide-react';

interface Insight {
  id: string;
  type: 'tip' | 'warning' | 'success';
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  metric?: {
    value: string;
    trend: 'up' | 'down';
  };
}

export function TopInsightsPanel() {
  // AI-generated insights (mock data - in real app, this comes from analytics engine)
  const insights: Insight[] = [
    {
      id: '1',
      type: 'tip',
      title: '3 guides are underutilized',
      description: 'Rajesh, Amit, and Priya have less than 50% trip days this month. Consider cross-training or redistributing assignments.',
      actionLabel: 'View Details',
      actionLink: '/hrms/analytics/utilization',
      metric: {
        value: '<50%',
        trend: 'down',
      },
    },
    {
      id: '2',
      type: 'warning',
      title: 'Kasol trips have 20% higher crew cost',
      description: 'Porter allocation for Kasol treks is 20% above average. Review staffing requirements for these routes.',
      actionLabel: 'Review Allocation',
      actionLink: '/hrms/trips?destination=kasol',
      metric: {
        value: '+20%',
        trend: 'up',
      },
    },
    {
      id: '3',
      type: 'success',
      title: 'December utilization is best in 6 months',
      description: 'Peak season is performing well. Staff utilization at 78% is the highest since June. Team morale is high.',
      metric: {
        value: '78%',
        trend: 'up',
      },
    },
    {
      id: '4',
      type: 'tip',
      title: 'Consider hiring 2 more drivers',
      description: 'Based on January bookings projection, you may need additional drivers to meet demand without overtime costs.',
      actionLabel: 'View Forecast',
      actionLink: '/hrms/analytics/forecast',
    },
  ];

  const getInsightStyle = (type: Insight['type']) => {
    switch (type) {
      case 'tip':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: <Lightbulb className="w-5 h-5 text-blue-500" />,
          iconBg: 'bg-blue-100',
          emoji: '💡',
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
          iconBg: 'bg-yellow-100',
          emoji: '⚠️',
        };
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          iconBg: 'bg-green-100',
          emoji: '✅',
        };
    }
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">🔥</span>
        <h2 className="font-semibold text-gray-800 text-base">Top Insights</h2>
        <span className="ml-auto text-xs text-gray-400">AI-powered recommendations</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {insights.map((insight) => {
          const style = getInsightStyle(insight.type);
          return (
            <div
              key={insight.id}
              className={`p-4 rounded-lg border ${style.bg} ${style.border} hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{style.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-800">{insight.title}</h3>
                    {insight.metric && (
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
                        insight.metric.trend === 'up' 
                          ? insight.type === 'warning' 
                            ? 'bg-red-100 text-red-600'
                            : 'bg-green-100 text-green-600'
                          : insight.type === 'warning'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                      }`}>
                        {insight.metric.trend === 'up' 
                          ? <TrendingUp className="w-3 h-3" />
                          : <TrendingDown className="w-3 h-3" />
                        }
                        {insight.metric.value}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {insight.description}
                  </p>
                  {insight.actionLabel && insight.actionLink && (
                    <a
                      href={insight.actionLink}
                      className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {insight.actionLabel}
                      <ChevronRight className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
