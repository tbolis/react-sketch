/**
 * A coloring page, as an SVG data URL: the outline of a house with a sun, to use as
 * the overlay image. The fill is transparent, so the drawing below shows through.
 */
const outline = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600" fill="none" stroke="#263238" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">
  <rect x="150" y="280" width="300" height="220"/>
  <path d="M120 290 L300 140 L480 290 Z"/>
  <rect x="270" y="380" width="60" height="120"/>
  <rect x="180" y="320" width="60" height="60"/>
  <rect x="360" y="320" width="60" height="60"/>
  <circle cx="520" cy="90" r="45"/>
  <path d="M40 500 H560"/>
</svg>`;

export default `data:image/svg+xml;charset=utf-8,${encodeURIComponent(outline)}`;
