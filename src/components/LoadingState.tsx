'use client';

interface LoadingStateProps {
  current: number;
  total: number;
}

const STAGES = [
  'Cleaning transcript...',
  'Analyzing decisions and action items...',
  'Extracting key quotes and pain points...',
  'Identifying objections and risks...',
  'Writing summary...',
];

function getStageMessage(current: number, total: number): string {
  if (total === 0) return 'Preparing transcript...';
  if (current >= total) return 'Writing final summary...';

  // Map current chunk to a descriptive stage
  const progress = current / total;
  const stageIndex = Math.min(Math.floor(progress * STAGES.length), STAGES.length - 1);
  return `${STAGES[stageIndex]} (chunk ${current} of ${total})`;
}

export default function LoadingState({ current, total }: LoadingStateProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="mt-8 p-8 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-3 border-gray-300 border-t-brand rounded-full animate-spin" />

        <p className="text-sm text-gray-600 font-medium">
          {getStageMessage(current, total)}
        </p>

        {total > 0 && (
          <div className="w-full max-w-xs">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
