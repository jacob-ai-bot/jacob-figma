import { vi } from "vitest";

const figmaMock = {
  ui: {
    postMessage: vi.fn(),
  },
};

// @ts-expect-error - We're adding a mock to the global scope
global.figma = figmaMock; // Assign the mock to the global scope

vi.mock("@create-figma-plugin/utilities", () => ({
  emit: vi.fn(),
}));
