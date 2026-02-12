import React from 'react';

const BaseIcon = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {children}
  </svg>
);

export const LuminaLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="100%" stopColor="#881337" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <rect width="100" height="100" rx="30" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
    <path 
      d="M35 25 Q35 75 35 75 L65 75" 
      stroke="url(#logoGrad)" 
      strokeWidth="12" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      filter="url(#glow)"
    />
    <circle cx="72" cy="28" r="6" fill="#f43f5e" filter="url(#glow)">
      <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
    </circle>
  </svg>
);

export const PlayIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M7 4v16l12-8-12-8z" fill="currentColor" stroke="none" />
  </BaseIcon>
);

export const PauseIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
    <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
  </BaseIcon>
);

export const SkipForwardIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M5 4l10 8-10 8V4z" fill="currentColor" stroke="none" />
    <rect x="17" y="4" width="2" height="16" rx="1" fill="currentColor" stroke="none" />
  </BaseIcon>
);

export const SkipBackIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M19 4l-10 8 10 8V4z" fill="currentColor" stroke="none" />
    <rect x="5" y="4" width="2" height="16" rx="1" fill="currentColor" stroke="none" />
  </BaseIcon>
);

export const ListIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <circle cx="3" cy="6" r="1" fill="currentColor" />
    <circle cx="3" cy="12" r="1" fill="currentColor" />
    <circle cx="3" cy="18" r="1" fill="currentColor" />
  </BaseIcon>
);

export const SparklesIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1" />
  </BaseIcon>
);

export const HomeIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </BaseIcon>
);

export const FullscreenIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </BaseIcon>
);

export const LoopIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M17 1l4 4-4 4" />
    <path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <path d="M7 23l-4-4 4-4" />
    <path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </BaseIcon>
);

export const ABRepeatIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M7 13c0 2.21 1.79 4 4 4h7" />
    <path d="M18 13l3 4-3 4" />
    <path d="M17 11c0-2.21-1.79-4-4-4H6" />
    <path d="M6 15l-3-4 3-4" />
    <text x="6" y="14" fontSize="6" fontWeight="900" fontFamily="sans-serif" fill="currentColor" stroke="none">A</text>
    <text x="14" y="14" fontSize="6" fontWeight="900" fontFamily="sans-serif" fill="currentColor" stroke="none">B</text>
  </BaseIcon>
);

export const FitIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M3 8V5a2 2 0 0 1 2-2h3m8 0h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3m-8 0H5a2 2 0 0 1-2-2v-3" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
  </BaseIcon>
);

export const SpeedIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" stroke="none" />
  </BaseIcon>
);

export const LinkIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </BaseIcon>
);

export const VolumeHighIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </BaseIcon>
);

export const VolumeLowIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </BaseIcon>
);

export const VolumeMuteIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
    <line x1="23" y1="9" x2="17" y2="15" />
    <line x1="17" y1="9" x2="23" y2="15" />
  </BaseIcon>
);

export const SubtitleIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M7 15h10M7 11h4M13 11h4" />
  </BaseIcon>
);

export const SettingsIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </BaseIcon>
);

export const CameraIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </BaseIcon>
);

export const GifIcon = ({ className }: { className?: string }) => (
  <BaseIcon className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M7 8h3v2H8v2h2v2H7V8zm5 0h2v6h-2V8zm5 0h3v2h-2v1h2v1h-2v2h-1V8z" fill="currentColor" stroke="none" />
  </BaseIcon>
);
