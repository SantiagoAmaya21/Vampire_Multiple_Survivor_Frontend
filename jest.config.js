/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",

  setupFilesAfterEnv: ["<rootDir>/src/tests/setupTests.ts"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|scss|sass)$": "identity-obj-proxy"
  },

  transform: {
    "^.+\\.(ts|tsx)$": "babel-jest"
  },

  transformIgnorePatterns: [
    "/node_modules/"
  ]
};
