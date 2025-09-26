import svgPaths from "./svg-yvwbwxpyu3";
import { imgGroup } from "./svg-sivby";

function Group() {
  return (
    <div
      className="absolute inset-[26.64%_-15.78%_12.68%_-15.78%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[62px_-227px] mask-size-[393px_852px]"
      data-name="Group"
      style={{ maskImage: `url('${imgGroup}')` }}
    >
      <div className="absolute inset-[-29.014%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 817 817">
          <g filter="url(#filter0_df_2_172)" id="Group">
            <path d={svgPaths.p1888d400} fill="var(--fill-0, #FFE96D)" fillOpacity="0.75" id="Vector" />
          </g>
          <defs>
            <filter
              colorInterpolationFilters="sRGB"
              filterUnits="userSpaceOnUse"
              height="817"
              id="filter0_df_2_172"
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
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_2_172" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_2_172" mode="normal" result="shape" />
              <feGaussianBlur result="effect2_foregroundBlur_2_172" stdDeviation="75" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Group1() {
  return (
    <div
      className="absolute inset-[17.72%_-7.38%_29.34%_-7.38%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[29px_-151px] mask-size-[393px_852px] mix-blend-color-dodge"
      data-name="Group"
      style={{ maskImage: `url('${imgGroup}')` }}
    >
      <div className="absolute inset-[-30.244%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 725 725">
          <g filter="url(#filter0_df_2_175)" id="Group" style={{ mixBlendMode: "color-dodge" }}>
            <path d={svgPaths.p19f9b470} fill="var(--fill-0, #FFC76D)" fillOpacity="0.85" id="Vector" />
          </g>
          <defs>
            <filter
              colorInterpolationFilters="sRGB"
              filterUnits="userSpaceOnUse"
              height="723.8"
              id="filter0_df_2_175"
              width="723.8"
              x="0.600006"
              y="0.600006"
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
              <feBlend in2="BackgroundImageFix" mode="normal" result="effect1_dropShadow_2_175" />
              <feBlend in="SourceGraphic" in2="effect1_dropShadow_2_175" mode="normal" result="shape" />
              <feGaussianBlur result="effect2_foregroundBlur_2_175" stdDeviation="68.2" />
            </filter>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute bottom-0 contents left-[-15.78%] right-[-15.78%] top-0" data-name="Group">
      <div
        className="absolute inset-0 mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0px] mask-size-[393px_852px]"
        data-name="Vector"
        style={{ maskImage: `url('${imgGroup}')` }}
      >
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 393 852">
          <path d={svgPaths.p3d03e200} fill="var(--fill-0, #FFB4E7)" id="Vector" />
        </svg>
      </div>
      <Group />
      <Group1 />
    </div>
  );
}

function ClipPathGroup() {
  return (
    <div className="absolute contents inset-0" data-name="Clip path group">
      <Group2 />
    </div>
  );
}

export default function SplashscreenSample192() {
  return (
    <div className="relative size-full" data-name="Splashscreen Sample 19 2">
      <ClipPathGroup />
    </div>
  );
}