'use client';

interface LoadingStateProps {
  current: number;
  total: number;
}

export default function LoadingState({ current, total }: LoadingStateProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="mt-8 p-8 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-3 border-gray-300 border-t-blue-600 rounded-full animate-spin" />

        <p className="text-sm text-gray-600 font-medium">
          {total > 0
            ? `Processing chunk ${current} of ${total}...`
            : 'Preparing transcript...'}
        </p>

        {total > 0 && (
          <div className="w-full max-w-xs">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
