// Shared art palette so every illustration reads as one world.
export const C = {
  ink: '#253047',
  mint: '#A5E0D3',
  mintLight: '#D3F3EA',
  mintDark: '#7CC3B3',
  blush: '#F7C9DA',
  pink: '#F49AB8',
  rose: '#E2657F',
  cream: '#FFF8ED',
  lavender: '#EDE7FA',
  lavDeep: '#B9A6E8',
  star: '#F5C76B',
  yellow: '#FFE9A8',
  sky: '#BFE3F2',
  glow: '#8FF5E4',
  midnight: '#171C34',
  white: '#FFFFFF',
  tofu: '#FFFFFF',
  tofuEar: '#F3ECE2',
  husky: '#7F889C',
  huskyDark: '#5D6579',
  huskyWhite: '#F7F7FA',
  skinLily: '#FCE4D6',
  skinSatyam: '#E3B38E',
  hairLily: '#3B2B3A',
  hairSatyam: '#2A2430',
  hoodie: '#4F79A8',
  hoodieLight: '#7FA2CB',
  water: '#CDEFFC',
  leaf: '#6DBA6A',
  coffee: '#A86F45',
  foam: '#F1DCC0',
} as const

/**
 * Nested <svg> elements inside another SVG default to height="100%", which
 * misplaces characters in scenes. Derive the height from the viewBox ratio.
 */
export function autoHeight(width: number | string | undefined, height: number | string | undefined, ratio: number) {
  if (height !== undefined) return height
  return typeof width === 'number' ? Math.round(width * ratio * 100) / 100 : undefined
}
