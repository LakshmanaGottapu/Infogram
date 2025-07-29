// components/Loader.tsx
import { type CSSProperties } from "react";

function LoadSpinner({
  size = 48,
  color = "#3b82f6",
  className = "",
  style = {}
}: {
  readonly size?: number;
  readonly color?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
}) {
  return (
    <div
      className={`flex justify-center items-center ${className}`}
      style={style}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 38 38"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
      >
        <defs>
          <linearGradient x1="8.042%" y1="0%" x2="65.682%" y2="23.865%" id="a">
            <stop stopColor={color} stopOpacity="0" offset="0%" />
            <stop stopColor={color} stopOpacity=".631" offset="63.146%" />
            <stop stopColor={color} offset="100%" />
          </linearGradient>
        </defs>
        <g fill="none" fillRule="evenodd">
          <g transform="translate(1 1)">
            <path d="M36 18c0-9.94-8.06-18-18-18" stroke="url(#a)" strokeWidth="2" />
            <circle cx="36" cy="18" r="1" fill={color} />
          </g>
        </g>
      </svg>
    </div>
  );
}

export default LoadSpinner;
