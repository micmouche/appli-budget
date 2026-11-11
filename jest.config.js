/** Configuration Jest : preset jest-expo (React Native + TypeScript). */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|victory-native|@shopify/react-native-skia|lucide-react-native|@gorhom/bottom-sheet|zustand|drizzle-orm)',
  ],
  collectCoverageFrom: ['src/finance/**/*.ts', '!src/finance/**/*.test.ts', '!src/finance/index.ts'],
  coverageThreshold: {
    global: { statements: 95, branches: 85, functions: 95, lines: 95 },
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
};
