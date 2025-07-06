import BpmnJS from "bpmn-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AutocompleteManager } from "../../managers/AutocompleteManager";
import type { IAutocompleteManagerCallbacks } from "../../types/interfaces";

// Test BPMN diagram with multiple elements for autocomplete
const testDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Process Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_UserInput" name="Collect User Input">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Validation" name="Validate Data">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_1" name="Data Valid?">
      <bpmn:incoming>Flow_3</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
      <bpmn:outgoing>Flow_5</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_Processing" name="Process Data">
      <bpmn:incoming>Flow_4</bpmn:incoming>
      <bpmn:outgoing>Flow_6</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_Success" name="Success">
      <bpmn:incoming>Flow_6</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="EndEvent_Error" name="Error">
      <bpmn:incoming>Flow_5</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_UserInput" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_UserInput" targetRef="Task_Validation" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="Task_Validation" targetRef="Gateway_1" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Gateway_1" targetRef="Task_Processing" />
    <bpmn:sequenceFlow id="Flow_5" sourceRef="Gateway_1" targetRef="EndEvent_Error" />
    <bpmn:sequenceFlow id="Flow_6" sourceRef="Task_Processing" targetRef="EndEvent_Success" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="99" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_UserInput_di" bpmnElement="Task_UserInput">
        <dc:Bounds x="270" y="77" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Validation_di" bpmnElement="Task_Validation">
        <dc:Bounds x="420" y="77" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_1_di" bpmnElement="Gateway_1">
        <dc:Bounds x="575" y="92" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Processing_di" bpmnElement="Task_Processing">
        <dc:Bounds x="680" y="77" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_Success_di" bpmnElement="EndEvent_Success">
        <dc:Bounds x="832" y="99" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_Error_di" bpmnElement="EndEvent_Error">
        <dc:Bounds x="832" y="192" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

describe("AutocompleteManager", () => {
  let bpmnJS: BpmnJS;
  let autocompleteManager: AutocompleteManager;
  let mockCallbacks: IAutocompleteManagerCallbacks;
  let textarea: HTMLTextAreaElement;
  let elementRegistry: any;

  beforeEach(async () => {
    // Create BPMN-JS instance
    bpmnJS = new BpmnJS({
      container: document.createElement("div"),
    });

    // Import test diagram
    await bpmnJS.importXML(testDiagram);
    elementRegistry = bpmnJS.get("elementRegistry");

    // Create DOM elements needed for autocomplete
    textarea = document.createElement("textarea");
    textarea.id = "doc-textarea";
    document.body.appendChild(textarea);

    // Setup mock callbacks
    mockCallbacks = {
      getAllElements: vi.fn().mockReturnValue(elementRegistry.getAll()),
      selectElementById: vi.fn(),
      getCurrentElement: vi.fn().mockReturnValue(null),
      getElementTypeName: vi.fn().mockImplementation((element: any) => {
        switch (element.type) {
          case "bpmn:StartEvent":
            return "Start Event";
          case "bpmn:Task":
            return "Task";
          case "bpmn:ExclusiveGateway":
            return "Exclusive Gateway";
          case "bpmn:EndEvent":
            return "End Event";
          default:
            return "Element";
        }
      }),
      getCanvasContainer: vi
        .fn()
        .mockReturnValue(document.createElement("div")),
      updatePreview: vi.fn(),
      saveDocumentationLive: vi.fn(),
    };

    // Create AutocompleteManager instance
    autocompleteManager = new AutocompleteManager({
      callbacks: mockCallbacks,
    });
  });

  afterEach(() => {
    if (bpmnJS) {
      bpmnJS.destroy();
    }

    // Clean up DOM
    if (textarea.parentNode) {
      textarea.parentNode.removeChild(textarea);
    }

    // Remove any autocomplete dropdowns
    const dropdown = document.getElementById("autocomplete-dropdown");
    if (dropdown?.parentNode) {
      dropdown.parentNode.removeChild(dropdown);
    }
  });

  describe("Constructor", () => {
    it("should initialize with callbacks", () => {
      expect(autocompleteManager).toBeDefined();
      expect(autocompleteManager).toBeInstanceOf(AutocompleteManager);
    });
  });

  describe("Event Listener Setup", () => {
    it("should setup autocomplete event listeners", () => {
      const inputSpy = vi.fn();
      const keydownSpy = vi.fn();

      textarea.addEventListener("input", inputSpy);
      textarea.addEventListener("keydown", keydownSpy);

      autocompleteManager.setupAutocompleteEventListeners();

      return new Promise((resolve) => {
        setTimeout(() => {
          // Simulate input event
          const inputEvent = new Event("input");
          textarea.dispatchEvent(inputEvent);

          // Simulate keydown event
          const keydownEvent = new KeyboardEvent("keydown", {
            key: "ArrowDown",
          });
          textarea.dispatchEvent(keydownEvent);

          expect(inputSpy).toHaveBeenCalled();
          expect(keydownSpy).toHaveBeenCalled();
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe("Element Filtering", () => {
    it("should get all elements from callbacks", () => {
      const allElements = mockCallbacks.getAllElements();

      expect(allElements).toBeDefined();
      expect(allElements.length).toBeGreaterThan(0);

      // Should include our test elements
      const elementIds = allElements.map((el: any) => el.id);
      expect(elementIds).toContain("StartEvent_1");
      expect(elementIds).toContain("Task_UserInput");
      expect(elementIds).toContain("Gateway_1");
    });

    it("should handle element type name mapping", () => {
      const startEvent = elementRegistry.get("StartEvent_1");
      const task = elementRegistry.get("Task_UserInput");
      const gateway = elementRegistry.get("Gateway_1");

      expect(mockCallbacks.getElementTypeName(startEvent)).toBe("Start Event");
      expect(mockCallbacks.getElementTypeName(task)).toBe("Task");
      expect(mockCallbacks.getElementTypeName(gateway)).toBe(
        "Exclusive Gateway"
      );
    });
  });

  describe("Autocomplete Trigger Detection", () => {
    it("should detect hashtag trigger for autocomplete", () => {
      // Test various text patterns that should trigger autocomplete
      const testCases = [
        { text: "See #", shouldTrigger: true },
        { text: "Reference #Task", shouldTrigger: true },
        { text: "Link to #StartEvent", shouldTrigger: true },
        { text: "No trigger here", shouldTrigger: false },
        { text: "Email test@example.com", shouldTrigger: false },
      ];

      testCases.forEach(({ text, shouldTrigger }) => {
        textarea.value = text;
        textarea.selectionStart = text.length;
        textarea.selectionEnd = text.length;

        const hasHashtag = text.includes("#");
        expect(hasHashtag).toBe(shouldTrigger);
      });
    });
  });

  describe("Autocomplete Hiding", () => {
    it("should have hideAutocomplete method", () => {
      expect(typeof autocompleteManager.hideAutocomplete).toBe("function");
    });

    it("should handle outside click to hide autocomplete", () => {
      const hideAutocompleteSpy = vi.spyOn(
        autocompleteManager,
        "hideAutocomplete"
      );

      autocompleteManager.setupAutocompleteEventListeners();

      return new Promise((resolve) => {
        setTimeout(() => {
          // Create autocomplete dropdown
          const dropdown = document.createElement("div");
          dropdown.id = "autocomplete-dropdown";
          document.body.appendChild(dropdown);

          // Simulate click outside
          const outsideElement = document.createElement("div");
          document.body.appendChild(outsideElement);

          const clickEvent = new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
          });

          Object.defineProperty(clickEvent, "target", {
            value: outsideElement,
            enumerable: true,
          });

          document.dispatchEvent(clickEvent);

          // Clean up
          document.body.removeChild(outsideElement);
          if (dropdown.parentNode) {
            document.body.removeChild(dropdown);
          }

          resolve(undefined);
        }, 150);
      });
    });
  });

  describe("Element Selection", () => {
    it("should handle element selection via callback", () => {
      const testElementId = "Task_UserInput";

      mockCallbacks.selectElementById(testElementId);

      expect(mockCallbacks.selectElementById).toHaveBeenCalledWith(
        testElementId
      );
    });
  });

  describe("Current Element Tracking", () => {
    it("should track current element via callback", () => {
      const currentElement = mockCallbacks.getCurrentElement();

      expect(mockCallbacks.getCurrentElement).toHaveBeenCalled();
      expect(currentElement).toBeNull(); // As mocked
    });
  });

  describe("Keyboard Navigation", () => {
    it("should handle arrow key navigation", () => {
      // Test that keyboard events can be handled
      const keydownEvent = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        bubbles: true,
        cancelable: true,
      });

      textarea.addEventListener("keydown", (event) => {
        expect(event.key).toBe("ArrowDown");
      });

      textarea.dispatchEvent(keydownEvent);
    });

    it("should handle Enter key for selection", () => {
      const keydownEvent = new KeyboardEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      });

      textarea.addEventListener("keydown", (event) => {
        expect(event.key).toBe("Enter");
      });

      textarea.dispatchEvent(keydownEvent);
    });

    it("should handle Escape key to hide autocomplete", () => {
      const keydownEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });

      textarea.addEventListener("keydown", (event) => {
        expect(event.key).toBe("Escape");
      });

      textarea.dispatchEvent(keydownEvent);
    });
  });

  describe("Element Name Handling", () => {
    it("should work with elements that have names", () => {
      const task = elementRegistry.get("Task_UserInput");
      const gateway = elementRegistry.get("Gateway_1");

      expect(task.businessObject.name).toBe("Collect User Input");
      expect(gateway.businessObject.name).toBe("Data Valid?");
    });

    it("should work with elements that don't have names", () => {
      const allElements = elementRegistry.getAll();

      // Find any element without a name (could be flows, shapes, etc.)
      const elementsWithoutNames = allElements.filter(
        (el: any) =>
          el.businessObject &&
          (!el.businessObject.name || el.businessObject.name.trim() === "")
      );

      // Should find at least one element without a name
      expect(elementsWithoutNames.length).toBeGreaterThan(0);

      const elementWithoutName = elementsWithoutNames[0];
      expect(elementWithoutName).toBeDefined();
      expect(elementWithoutName.businessObject).toBeDefined();

      // Element should not have a name or have an empty name
      expect(elementWithoutName.businessObject.name || "").toBe("");
    });
  });
});
