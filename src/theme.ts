import { Platform, TextStyle } from 'react-native';

/** Warm winter-evening palette: ink, paper, kotatsu orange, blanket red. */
export const colors = {
  bg: '#F6EFE3',
  bgElevated: '#EFE6D6',
  card: '#FBF6EE',
  cardAlt: '#F0E7D7',
  ink: '#1F1B16',
  inkSoft: '#6E6459',
  inkFaint: '#9C9184',
  accent: '#E0873A',
  accentDeep: '#B96A22',
  accentSoft: 'rgba(224,135,58,0.16)',
  glow: 'rgba(224,135,58,0.28)',
  red: '#B94A3A',
  redSoft: 'rgba(185,74,58,0.12)',
  line: 'rgba(31,27,22,0.08)',
  lineStrong: 'rgba(31,27,22,0.16)',
  success: '#6F8F5E',
  danger: '#B94A3A',
  overlay: 'rgba(31,27,22,0.55)',
  onAccent: '#1F1B16',
  onInk: '#FBF6EE',
  bubbleCrew: '#FFFDF8',
  bubbleUser: '#1F1B16',
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };

export const space = (n: number) => n * 4;

/** System serif for headings; sans for chat. */
export const serif = Platform.select({
  ios: 'Georgia',
  web: "'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
  default: 'serif',
}) as string;

const tabular: TextStyle = { fontVariant: ['tabular-nums'] };

export const type: Record<string, TextStyle> = {
  display: { fontFamily: serif, fontSize: 34, fontWeight: '700', color: colors.ink, letterSpacing: -0.4, lineHeight: 40 },
  h1: { fontFamily: serif, fontSize: 27, fontWeight: '700', color: colors.ink, letterSpacing: -0.3, lineHeight: 33 },
  h2: { fontFamily: serif, fontSize: 21, fontWeight: '700', color: colors.ink, letterSpacing: -0.2, lineHeight: 27 },
  h3: { fontSize: 17, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, fontWeight: '400', color: colors.ink, lineHeight: 23 },
  bodySoft: { fontSize: 15, fontWeight: '400', color: colors.inkSoft, lineHeight: 22 },
  label: { fontSize: 12, fontWeight: '700', color: colors.accentDeep, letterSpacing: 1.4, textTransform: 'uppercase' },
  sub: { fontSize: 13, fontWeight: '500', color: colors.inkSoft },
  caption: { fontSize: 12, fontWeight: '500', color: colors.inkFaint },
  num: { fontSize: 30, fontWeight: '800', color: colors.ink, letterSpacing: -0.8, ...tabular },
  numSm: { fontSize: 15, fontWeight: '700', color: colors.ink, ...tabular },
  numLg: { fontSize: 44, fontWeight: '800', color: colors.ink, letterSpacing: -1.2, ...tabular },
  numXL: { fontSize: 64, fontWeight: '800', color: colors.ink, letterSpacing: -2.4, ...tabular },
};

/** react-native-web paints the "on" thumb teal by default; keep it white to match iOS. */
export const switchProps = Platform.OS === 'web' ? ({ activeThumbColor: '#fff' } as Record<string, unknown>) : {};
