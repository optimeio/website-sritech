import React from 'react';

const LoadingSkeleton = () => (
  <div className="bg-white rounded-lg p-4 shadow animate-pulse">
    <div className="flex gap-4">
      <div className="w-28 h-20 bg-gray-200 rounded" />
      <div className="flex-1 space-y-3 py-1">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  </div>
);

export default LoadingSkeleton;
