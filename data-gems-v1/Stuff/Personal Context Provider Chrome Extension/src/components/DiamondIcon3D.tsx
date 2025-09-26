import svgPaths from "../imports/svg-ox6rnhqfis";

interface DiamondIcon3DProps {
  className?: string;
}

export function DiamondIcon3D({ className = "h-10 w-10" }: DiamondIcon3DProps) {
  return (
    <div className={`relative ${className}`}>
      <svg 
        className="block size-full drop-shadow-lg" 
        fill="none" 
        preserveAspectRatio="xMidYMid meet" 
        viewBox="0 0 489 576"
        style={{
          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
        }}
      >
        <defs>
          {/* Gradients for 3D effect */}
          <linearGradient id="topLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="topRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="bottomLeft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.4" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="bottomRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        <g className="transform-gpu">
          {/* Top left face - lightest */}
          <path
            d={svgPaths.p7ee6100}
            fill="url(#topLeft)"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          
          {/* Top right face - medium light */}
          <path
            d={svgPaths.pc2d2080}
            fill="url(#topRight)"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          
          {/* Bottom left face - medium dark */}
          <path
            d={svgPaths.p3ec54480}
            fill="url(#bottomLeft)"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          
          {/* Bottom right face - darkest */}
          <path
            d={svgPaths.p32385f80}
            fill="url(#bottomRight)"
            stroke="currentColor"
            strokeOpacity="0.2"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
        
        {/* Highlight on top edge for extra 3D effect */}
        <path
          d="M244.027 0L147.709 388.385H340.345L244.027 0Z"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="1"
          strokeLinejoin="round"
        />
      </svg>
      
      {/* Additional glow effect */}
      <div 
        className="absolute inset-0 opacity-20 blur-sm"
        style={{
          background: 'radial-gradient(circle at 40% 30%, currentColor 0%, transparent 70%)'
        }}
      />
    </div>
  );
}