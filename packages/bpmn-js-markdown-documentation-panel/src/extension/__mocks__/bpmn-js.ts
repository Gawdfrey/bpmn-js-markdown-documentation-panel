import { vi } from "vitest";

export const mockEventBus = {
  on: vi.fn(),
  off: vi.fn(),
  fire: vi.fn(),
};

export const mockElementRegistry = {
  get: vi.fn(),
  getAll: vi.fn().mockReturnValue([]),
  filter: vi.fn().mockReturnValue([]),
};

export const mockCanvas = {
  zoom: vi.fn(),
  scrollToElement: vi.fn(),
  getRootElement: vi.fn(),
  getContainer: vi.fn().mockReturnValue(document.createElement("div")),
};

export const mockModeling = {
  updateProperties: vi.fn(),
};

export const mockSelection = {
  get: vi.fn().mockReturnValue([]),
};

export const mockBpmnJS = {
  get: vi.fn().mockImplementation((serviceName: string) => {
    switch (serviceName) {
      case "eventBus":
        return mockEventBus;
      case "elementRegistry":
        return mockElementRegistry;
      case "canvas":
        return mockCanvas;
      case "modeling":
        return mockModeling;
      case "selection":
        return mockSelection;
      default:
        return {};
    }
  }),
  destroy: vi.fn(),
  on: vi.fn(),
  importXML: vi.fn(),
};

export const createMockElement = (id: string, type = "bpmn:Task") => ({
  id,
  type,
  businessObject: {
    id,
    $type: type,
    name: `Element ${id}`,
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
  },
});

export const createMockBpmnJS = () => ({
  ...mockBpmnJS,
  get: vi.fn().mockImplementation((serviceName: string) => {
    switch (serviceName) {
      case "eventBus":
        return { ...mockEventBus };
      case "elementRegistry":
        return { ...mockElementRegistry };
      case "canvas":
        return { ...mockCanvas };
      case "modeling":
        return { ...mockModeling };
      case "selection":
        return { ...mockSelection };
      default:
        return {};
    }
  }),
});
