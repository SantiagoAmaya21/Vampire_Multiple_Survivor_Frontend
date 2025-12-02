/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/tests/setupTests.ts"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|scss|sass)$": "identity-obj-proxy"
  },

  transform: {
    "^.+\\.(ts|tsx)$": ["@swc/jest", {
      jsc: {
        parser: {
          syntax: "typescript",
          tsx: true,
        },
        transform: {
          react: {
            runtime: "automatic"
          }
        }
      }
    }]
  },

  transformIgnorePatterns: [
    "/node_modules/(?!(@stomp|sockjs-client)/)"
  ]
};