import { SVGProps } from "react";

/**
 * Aleksey isotype — faceted "A" mark.
 * Pure SVG: scales infinitely, sub-1KB, themable via currentColor on accents if needed.
 */
export const LogoMark = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 200"
    fill="none"
    role="img"
    aria-label="Aleksey"
    {...props}
  >
    <title>Aleksey</title>
    <polygon points="100,20 60,90 100,90" fill="#f4b5b0" />
    <polygon points="60,90 100,90 80,125" fill="#e88a82" />
    <polygon points="60,90 80,125 40,160" fill="#f4b5b0" />
    <polygon points="80,125 100,160 40,160" fill="#d65048" />
    <polygon points="100,20 160,160 120,160 100,90" fill="#e30613" />
    <polygon points="100,20 100,90 60,90" fill="#e30613" opacity="0.92" />
    <polygon points="78,118 122,118 117,128 83,128" fill="#e30613" />
  </svg>
);

export default LogoMark;
