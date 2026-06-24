import React from 'react';

interface WeLinkLogoProps {
  className?: string; // for the overall container style
  iconSize?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showText?: boolean;
  textColor?: string; // defaults to responsive slate/white
  sloganClassName?: string;
  isDarkBackground?: boolean;
}

export const WeLinkLogoIcon: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = '' }) => {
  // SVG of the custom connected nodes constellation exactly replicating the main brand logo
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className}`}
    >
      <defs>
        {/* Glow filter for the premium constellation look */}
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        {/* Custom color gradients matching the original logo perfectly */}
        <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" /> {/* Cyan */}
          <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.75" /> {/* Sky Blue */}
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0.4" /> {/* Deep dark backing */}
        </linearGradient>
      </defs>

      {/* Network Connections (Lines) forming the perfect interconnected 'W' structure */}
      <g stroke="url(#line-gradient)" strokeWidth="1.95" strokeLinecap="round" strokeLinejoin="round">
        {/* Symmetrical Left 'V' leg connections */}
        <line x1="20" y1="28" x2="38" y2="18" />
        <line x1="20" y1="28" x2="33" y2="44" />
        <line x1="20" y1="28" x2="33" y2="75" />
        
        <line x1="38" y1="18" x2="33" y2="44" />
        <line x1="38" y1="18" x2="50" y2="40" />
        <line x1="38" y1="18" x2="50" y2="65" />
        
        {/* Symmetrical Right 'V' leg connections */}
        <line x1="80" y1="28" x2="62" y2="18" />
        <line x1="80" y1="28" x2="67" y2="44" />
        <line x1="80" y1="28" x2="67" y2="75" />
        
        <line x1="62" y1="18" x2="67" y2="44" />
        <line x1="62" y1="18" x2="50" y2="40" />
        <line x1="62" y1="18" x2="50" y2="65" />
        
        {/* Symmetrical Center connections forming the interconnected mesh */}
        <line x1="33" y1="44" x2="50" y2="40" />
        <line x1="67" y1="44" x2="50" y2="40" />
        
        <line x1="33" y1="75" x2="50" y2="65" />
        <line x1="67" y1="75" x2="50" y2="65" />
        <line x1="33" y1="75" x2="33" y2="44" />
        <line x1="67" y1="75" x2="67" y2="44" />

        {/* Dynamic diagonal supporting lines layer */}
        <line x1="33" y1="44" x2="50" y2="65" />
        <line x1="67" y1="44" x2="50" y2="65" />
        <line x1="50" y1="40" x2="50" y2="65" />
      </g>

      {/* Network Nodes (Circles exactly matching colors, positions and scale of the logo) */}
      {/* 2 Top outer nodes - Brilliant Cyan */}
      <circle cx="20" cy="28" r="4.8" fill="#14b8a6" stroke="#ffffff" strokeWidth="1.6" filter="url(#glow)" />
      <circle cx="80" cy="28" r="4.8" fill="#14b8a6" stroke="#ffffff" strokeWidth="1.6" filter="url(#glow)" />

      {/* 2 Top inner nodes - Sky/Ocean Blue-Teal */}
      <circle cx="38" cy="18" r="4.6" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.6" />
      <circle cx="62" cy="18" r="4.6" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.6" />
      
      {/* 2 Mid Left & Right nodes - Deep Turquoise Teal */}
      <circle cx="33" cy="44" r="4.6" fill="#0f766e" stroke="#ffffff" strokeWidth="1.6" />
      <circle cx="67" cy="44" r="4.6" fill="#0f766e" stroke="#ffffff" strokeWidth="1.6" />

      {/* 1 Mid Center node - Lighter bright royal blue */}
      <circle cx="50" cy="40" r="4.8" fill="#2563eb" stroke="#ffffff" strokeWidth="1.6" />

      {/* 1 Bottom Center node - Vibrant Dark Blue */}
      <circle cx="50" cy="65" r="5.2" fill="#1e3a8a" stroke="#ffffff" strokeWidth="1.8" />

      {/* 2 Bottom Outer Ground nodes - Solid deep blue */}
      <circle cx="33" cy="75" r="5.8" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.8" />
      <circle cx="67" cy="75" r="5.8" fill="#1d4ed8" stroke="#ffffff" strokeWidth="1.8" />
    </svg>
  );
};

export const WeLinkLogo: React.FC<WeLinkLogoProps> = ({
  className = '',
  iconSize = 'md',
  showText = true,
  textColor,
  sloganClassName = '',
  isDarkBackground = true
}) => {
  let size = 42;
  if (iconSize === 'sm') size = 28;
  else if (iconSize === 'md') size = 42;
  else if (iconSize === 'lg') size = 56;
  else if (iconSize === 'xl') size = 76;
  else if (typeof iconSize === 'number') size = iconSize;

  const defaultTextColor = isDarkBackground ? 'text-white' : 'text-slate-900';

  return (
    <div className={`flex items-center space-x-3.5 select-none ${className}`}>
      <WeLinkLogoIcon size={size} className="transform hover:scale-105 transition-transform duration-300" />
      {showText && (
        <div className="flex flex-col">
          <span 
            className={`font-black tracking-tight ${defaultTextColor} ${textColor || ''}`}
            style={{ 
              fontSize: size > 50 ? '1.75rem' : size > 35 ? '1.35rem' : '1.1rem',
              lineHeight: '1.15'
            }}
          >
            WeLink
          </span>
          <span 
            className={`text-[9px] font-extrabold tracking-wider block text-indigo-400 capitalize ${sloganClassName}`}
            style={{ fontSize: size > 50 ? '10px' : '8.5px' }}
          >
            commerce et carrière au bout des doigts
          </span>
        </div>
      )}
    </div>
  );
};
