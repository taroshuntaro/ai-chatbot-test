module.exports = {
  testEnvironment: "jsdom",
  moduleNameMapper: {
    // Next.jsのパス解決のためのエイリアス設定
    "^@/(.*)$": "<rootDir>/$1",
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/utils/(.*)$": "<rootDir>/utils/$1",
    "^@/hooks/(.*)$": "<rootDir>/hooks/$1",
    "^@/styles/(.*)$": "<rootDir>/styles/$1",
    // スタイルや画像ファイルなどのモック
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }],
  },
  transformIgnorePatterns: [
    "/node_modules/",
    "^.+\\.module\\.(css|sass|scss)$",
  ],
  collectCoverageFrom: [
    "**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
  ],
};
