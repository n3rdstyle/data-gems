import svgPaths from "../imports/svg-yvwbwxpyu3";

interface GradientBlobBackgroundProps {
  className?: string;
}

export function GradientBlobBackground({ className = "" }: GradientBlobBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Base pink gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-200/60 via-pink-100/40 to-orange-100/60" />
      
      {/* Yellow blob - top */}
      <div className="absolute top-[-20%] left-[10%] w-32 h-32 opacity-75">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 817 817">
          <defs>
            <filter
              id="yellowBlob"
              colorInterpolationFilters="sRGB"
              filterUnits="userSpaceOnUse"
              height="817"
              width="817"
              x="0"
              y="0"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix
                in="SourceAlpha"
                result="hardAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              />
              <feOffset dy="4" />
              <feGaussianBlur stdDeviation="2" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow" mode="normal" result="shape" />
              <feGaussianBlur result="effect2_foregroundBlur" stdDeviation="30" />
            </filter>
          </defs>
          <g filter="url(#yellowBlob)">
            <circle cx="408.5" cy="408.5" r="258.5" fill="#FFE96D" fillOpacity="0.75" />
          </g>
        </svg>
      </div>

      {/* Orange blob - center */}
      <div className="absolute top-[20%] right-[-10%] w-28 h-28 opacity-85">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 725 725">
          <defs>
            <filter
              id="orangeBlob"
              colorInterpolationFilters="sRGB"
              filterUnits="userSpaceOnUse"
              height="725"
              width="725"
              x="0"
              y="0"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix
                in="SourceAlpha"
                result="hardAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              />
              <feOffset dy="4" />
              <feGaussianBlur stdDeviation="2" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow" mode="normal" result="shape" />
              <feGaussianBlur result="effect2_foregroundBlur" stdDeviation="25" />
            </filter>
          </defs>
          <g filter="url(#orangeBlob)" style={{ mixBlendMode: "color-dodge" }}>
            <circle cx="362.5" cy="362.5" r="225.5" fill="#FFC76D" fillOpacity="0.85" />
          </g>
        </svg>
      </div>

      {/* Additional pink blob - bottom */}
      <div className="absolute bottom-[-15%] left-[-5%] w-24 h-24 opacity-60">
        <div className="w-full h-full bg-gradient-to-br from-pink-300/70 to-rose-200/50 rounded-full blur-sm" />
      </div>
    </div>
  );
}