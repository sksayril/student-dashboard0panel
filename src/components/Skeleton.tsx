import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
  theme?: 'light' | 'dark' | 'blue';
}

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse',
  theme = 'light',
}: SkeletonProps) {
  const themeClasses = {
    light: 'bg-gray-200 dark:bg-gray-300',
    dark: 'bg-white/20 dark:bg-white/20',
    blue: 'bg-white/40 dark:bg-white/40',
  };
  
  const baseClasses = themeClasses[theme];
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton components
export function SkeletonCard({ theme = 'dark' }: { theme?: 'light' | 'dark' | 'blue' }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <Skeleton variant="rectangular" height={200} theme={theme} className="rounded-lg mb-4 bg-white/40" />
      <Skeleton variant="text" width="60%" theme={theme} className="mb-2 bg-white/40" />
      <Skeleton variant="text" width="40%" theme={theme} className="bg-white/40" />
    </div>
  );
}

export function SkeletonCourseCard() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <Skeleton variant="rectangular" height={180} theme="light" />
      <div className="p-4">
        <Skeleton variant="text" width="80%" theme="light" className="mb-3 h-6" />
        <Skeleton variant="text" width="60%" theme="light" className="mb-2" />
        <Skeleton variant="text" width="40%" theme="light" className="mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width={60} height={24} theme="light" />
          <Skeleton variant="rounded" width={100} height={36} theme="light" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonProfile({ theme = 'dark' }: { theme?: 'light' | 'dark' | 'blue' }) {
  return (
    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-white/20">
      <Skeleton variant="circular" width={128} height={128} theme={theme} className="bg-white/40" />
      <div className="flex-1">
        <Skeleton variant="text" width="40%" theme={theme} className="mb-4 h-8 bg-white/40" />
        <Skeleton variant="text" width="30%" theme={theme} className="mb-2 bg-white/40" />
        <Skeleton variant="text" width="50%" theme={theme} className="bg-white/40" />
      </div>
    </div>
  );
}

export function SkeletonTable({ theme = 'light' }: { theme?: 'light' | 'dark' | 'blue' }) {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="rectangular" width={60} height={60} theme={theme} className="rounded-lg" />
          <div className="flex-1">
            <Skeleton variant="text" width="40%" theme={theme} className="mb-2" />
            <Skeleton variant="text" width="60%" theme={theme} />
          </div>
          <Skeleton variant="rounded" width={100} height={32} theme={theme} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ theme = 'dark' }: { theme?: 'light' | 'dark' | 'blue' }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
          <Skeleton variant="text" width="60%" theme={theme} className="mb-2 h-4 bg-white/40" />
          <Skeleton variant="text" width="40%" theme={theme} className="h-8 bg-white/40" />
        </div>
      ))}
    </div>
  );
}


