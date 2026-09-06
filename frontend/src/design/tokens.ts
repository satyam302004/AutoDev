export const colors = {
  cream: {
    50: '#FFFDF5',
    100: '#FFF8E7',
    200: '#F4E9C7',
    300: '#E8D9A0',
  },
  paper: {
    100: '#FCFAF0',
    200: '#F0EAD2',
  },
  ink: {
    900: '#1A1320',
    700: '#3D2E4A',
    500: '#6B5878',
    300: '#A899B5',
    100: '#D9CFE0',
  },
  coral: '#FF6B6B',
  coralLight: '#FFB4B4',
  mint: '#6BCF7F',
  mintLight: '#B4E5BD',
  sky: '#4ECDC4',
  skyLight: '#A8E6E0',
  lemon: '#FFD93D',
  lemonLight: '#FFEC99',
  lilac: '#B197FC',
  lilacLight: '#D6C5FF',
  peach: '#FFA07A',
  peachLight: '#FFD0B5',
} as const;

export const status = {
  idle: '#A899B5',
  thinking: '#4ECDC4',
  working: '#FFD93D',
  waiting: '#6C8EF5',
  blocked: '#FF6B6B',
  success: '#6BCF7F',
  ghost: '#D9CFE0',
} as const;

export const agentAccents = {
  project_manager: colors.coral,
  requirements: colors.mint,
  architecture: colors.sky,
  planning: colors.lemon,
  backend: colors.lilac,
  frontend: colors.peach,
  qa: colors.coral,
  documentation: colors.mint,
  report: colors.sky,
} as const;

export type AgentName = keyof typeof agentAccents;
export type StatusType = keyof typeof status;

export const fonts = {
  display: "'Press Start 2P', monospace",
  ui: "'Pixelify Sans', sans-serif",
  mono: "'VT323', monospace",
} as const;

export const spacing = {
  0: 0,
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '24px',
  6: '32px',
  7: '48px',
  8: '64px',
} as const;
