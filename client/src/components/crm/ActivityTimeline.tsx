import React from 'react';
import { Activity } from '../../types/crm';

interface ActivityTimelineProps {
    activities: Activity[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ activities }) => {
    if (activities.length === 0) {
        return <div className="text-gray-500 text-sm py-4">No activity history yet.</div>;
    }

    return (
        <div className="space-y-4">
            {activities.map((activity) => (
                <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold
                            ${activity.type === 'CALL' ? 'bg-blue-500' :
                                activity.type === 'EMAIL' ? 'bg-green-500' :
                                    activity.type === 'MEETING' ? 'bg-purple-500' : 'bg-gray-500'}`}
                        >
                            {activity.type[0]}
                        </div>
                        <div className="w-[1px] h-full bg-slate-200 dark:bg-slate-800 my-1"></div>
                    </div>
                    <div className="flex-1 pb-4">
                        <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-sm">{activity.subject}</h4>
                            <span className="text-xs text-gray-400">
                                {new Date(activity.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            {activity.description}
                        </p>
                        {activity.outcome && (
                            <div className="mt-2 text-xs bg-slate-100 dark:bg-slate-800 inline-block px-2 py-1 rounded">
                                Outcome: {activity.outcome}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};
