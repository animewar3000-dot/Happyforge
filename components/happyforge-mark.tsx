import type { SVGProps } from "react";

export function HappyforgeMark({
  size = 26,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      viewBox="0 0 26 26"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <rect x="2" y="2" width="9" height="9" rx="2" fill="#B9F078" />
      <rect x="15" y="2" width="9" height="9" rx="2" fill="#A99AEF" />
      <rect x="2" y="15" width="9" height="9" rx="2" fill="#78D9D0" />
      <rect x="15" y="15" width="9" height="9" rx="2" fill="#171E29" stroke="#929EAD" />
    </svg>
  );
}
