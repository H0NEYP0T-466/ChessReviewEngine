/**
 * Loading overlay component with progress indicator.
 */

interface LoadingOverlayProps {
  progress?: number;
  message?: string;
}

export function LoadingOverlay({ 
  progress, 
  message = 'Analyzing...' 
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-zinc-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="text-center space-y-4">
          {/* Spinner */}
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
          </div>
          
          {/* Message */}
          <p className="text-xl font-semibold">{message}</p>
          
          {/* Progress bar */}
          {progress !== undefined && (
            <div className="w-full">
              <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-500 h-full transition-all duration-300"
                  style={{ width: `${progress * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                {Math.round(progress * 100)}%
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
