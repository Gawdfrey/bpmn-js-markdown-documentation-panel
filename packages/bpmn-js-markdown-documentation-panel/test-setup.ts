import { beforeEach, vi } from "vitest";

// Setup global mocks before each test
beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();

  // Mock console methods to avoid noise in tests
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// Global test utilities
declare global {
  interface Window {
    testUtils: {
      createMockElement: (id: string, type?: string) => any;
      createMockBpmnJS: () => any;
    };
  }
}

// Add test utilities to global scope
if (typeof window !== "undefined") {
  window.testUtils = {
    createMockElement: (id: string, type = "bpmn:Task") => ({
      id,
      type,
      businessObject: {
        id,
        $type: type,
        get: vi.fn().mockReturnValue(undefined),
        set: vi.fn(),
      },
    }),

    createMockBpmnJS: () => ({
      get: vi.fn().mockReturnValue({
        eventBus: {
          on: vi.fn(),
          off: vi.fn(),
          fire: vi.fn(),
        },
        elementRegistry: {
          get: vi.fn(),
          getAll: vi.fn().mockReturnValue([]),
          filter: vi.fn().mockReturnValue([]),
        },
        canvas: {
          zoom: vi.fn(),
          scrollToElement: vi.fn(),
          getRootElement: vi.fn(),
        },
        modeling: {
          updateProperties: vi.fn(),
        },
        selection: {
          get: vi.fn().mockReturnValue([]),
        },
      }),
      destroy: vi.fn(),
      on: vi.fn(),
      importXML: vi.fn(),
    }),
  };
}
