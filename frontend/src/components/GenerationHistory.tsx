import React from 'react';
import { Generation } from '../utils/api';

interface GenerationHistoryProps {
  generations: Generation[];
  onRestore: (generation: Generation) => void;
  disabled?: boolean;
}

export const GenerationHistory: React.FC<GenerationHistoryProps> = ({
  generations,
  onRestore,
  disabled,
}) => {
  if (generations.length === 0) {
    return (
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Generations</h2>
        <p className="text-gray-500 text-center py-8">
          {disabled ? 'Loading...' : 'No generations yet. Create your first one!'}
        </p>
      </div>
    );
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold mb-4">Recent Generations</h2>
      <div className="space-y-3">
        {generations.map((generation) => (
          <button
            key={generation.id}
            onClick={() => onRestore(generation)}
            disabled={disabled}
            className="w-full flex items-center gap-4 p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={`Restore generation: ${generation.prompt}`}
          >
            <img
              src={`http://localhost:3001${generation.image_url}`}
              alt={generation.prompt}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900 truncate">{generation.prompt}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500 capitalize">{generation.style}</span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs text-gray-500">{formatDate(generation.created_at)}</span>
              </div>
            </div>
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
};

