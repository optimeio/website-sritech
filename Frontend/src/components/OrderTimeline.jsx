import React from 'react';

const stages = ['Ordered', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const statusToIndex = (status = 'Processing') => {
  const map = {
    'Pending': 0,
    'Processing': 1,
    'Packed': 1,
    'Shipped': 2,
    'Out for Delivery': 3,
    'Delivered': 4
  };
  return map[status] || 1;
};

const OrderTimeline = ({ status, variant = 'card' }) => {
  const idx = statusToIndex(status);

  if (variant === 'detailed') {
    // Detailed progress bar view for tracking page
    return (
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          {stages.map((s, i) => {
            const stageCompleted = i < idx;
            const stageCurrent = i === idx;
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold mb-2 ${
                      stageCompleted
                        ? 'bg-green-500 text-white'
                        : stageCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {stageCompleted ? '✓' : i + 1}
                  </div>
                  <div
                    className={`text-xs font-medium text-center ${
                      stageCompleted
                        ? 'text-green-600'
                        : stageCurrent
                        ? 'text-blue-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {s}
                  </div>
                </div>
                {i < stages.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 mt-6 ${
                      i < idx ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // Card view (original)
  return (
    <div className="flex items-center gap-4 flex-wrap">
      {stages.map((s, i) => {
        const stageCompleted = i < idx;
        const stageCurrent = i === idx;
        return (
          <div key={s} className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                stageCompleted
                  ? 'bg-green-500 text-white'
                  : stageCurrent
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {stageCompleted ? '✓' : i + 1}
            </div>
            <div
              className={`text-xs font-medium ${
                stageCompleted
                  ? 'text-green-600'
                  : stageCurrent
                  ? 'text-blue-600'
                  : 'text-gray-500'
              }`}
            >
              {s}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderTimeline;
