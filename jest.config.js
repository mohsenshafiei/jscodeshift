module.exports = {
  roots: ["src", "parser", "sample"],
  preset: "ts-jest", // Use ts-jest for TypeScript support
  testEnvironment: "node", // Set the environment to node (default) or jsdom for frontend tests
  testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"], // Specify test file patterns
};

// roots: ["src", "bin", "parser", "sample"],
// testMatch: ["**/__tests__/**/*.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"], // Specify test file patterns
