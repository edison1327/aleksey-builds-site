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
    <path d="M100 20L60 90H100L100 20Z" fill="#f4b5b0" />
    <path d="M60 90L100 90L80 125L60 90Z" fill="#e88a82" />
    <path d="M60 90L80 125L40 160L60 90Z" fill="#f4b5b0" />
    <path d="M80 125L100 160H40L80 125Z" fill="#d65048" />
    <path d="M100 20L160 160H120L100 90L100 20Z" fill="currentColor" className="text-primary" />
    <path d="M100 20L100 90H60L100 20Z" fill="currentColor" className="text-primary" opacity="0.92" />
    <path d="M78 118H122L117 128H83L78 118Z" fill="currentColor" className="text-primary" />
  </svg>
);

export default LogoMark;
