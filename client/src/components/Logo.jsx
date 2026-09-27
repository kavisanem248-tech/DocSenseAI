import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ 
  size = 'md', 
  linkTo = '/', 
  showTagline = false,
  className = '' 
}) {
  // Height configurations preserving natural square / aspect-ratio
  const sizeClasses = {
    xs: 'h-8 w-auto',
    sm: 'h-9 w-auto',
    md: 'h-11 w-auto',
    lg: 'h-20 w-auto',
    xl: 'h-32 w-auto',
  };

  const imageElement = (
    <img
      src="/docsenseai-logo.png"
      alt="DocSenseAI — Intelligent Document Analysis Platform"
      className={`${sizeClasses[size] || sizeClasses.md} object-contain transition-transform group-hover:scale-[1.02] ${className}`}
      loading="eager"
    />
  );

  if (!linkTo) {
    return (
      <div className="flex flex-col items-center">
        {imageElement}
        {showTagline && (
          <p className="text-xs text-blue-600 font-medium tracking-tight mt-1">
            Understand Documents. Discover Insights. Verify Sources.
          </p>
        )}
      </div>
    );
  }

  return (
    <Link to={linkTo} className="flex items-center gap-2 group cursor-pointer">
      {imageElement}
      {showTagline && (
        <span className="hidden lg:inline-block text-[11px] font-medium text-slate-500 pl-2 border-l border-slate-200">
          Understand Documents. Discover Insights. Verify Sources.
        </span>
      )}
    </Link>
  );
}
