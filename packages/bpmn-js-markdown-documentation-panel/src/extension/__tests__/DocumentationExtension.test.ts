import BpmnJS from "bpmn-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import documentationExtensionModule from "../index";

// Simple BPMN diagram XML for testing
const simpleDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Test Task">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="EndEvent_1" name="End">
      <bpmn:incoming>Flow_2</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="99" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="187" y="142" width="25" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="270" y="77" width="100" height="80" />
        <bpmndi:BPMNLabel />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="432" y="99" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="444" y="142" width="20" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="215" y="117" />
        <di:waypoint x="270" y="117" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="370" y="117" />
        <di:waypoint x="432" y="117" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

describe("DocumentationExtension", () => {
  let bpmnJS: BpmnJS;

  beforeEach(async () => {
    // Create a real BPMN-JS instance with the documentation extension
    bpmnJS = new BpmnJS({
      container: document.createElement("div"),
      additionalModules: [documentationExtensionModule],
    });

    // Import the simple diagram
    await bpmnJS.importXML(simpleDiagram);
  });

  afterEach(() => {
    if (bpmnJS) {
      bpmnJS.destroy();
    }
  });

  describe("Module Integration", () => {
    it("should register the documentation extension service", () => {
      // Test that the documentation extension service is available
      const documentationExtension = bpmnJS.get("documentationExtension");
      expect(documentationExtension).toBeDefined();
    });

    it("should detect viewer mode (no modeling service)", () => {
      // In viewer mode, there's no modeling service
      const modeling = bpmnJS.get("modeling", false);
      expect(modeling).toBeNull();
    });

    it("should have the correct module configuration", () => {
      expect(documentationExtensionModule.__init__).toContain(
        "documentationExtension"
      );
      expect(documentationExtensionModule.documentationExtension).toBeDefined();
      expect(documentationExtensionModule.documentationExtension[0]).toBe(
        "type"
      );
    });
  });

  describe("Element Registry Integration", () => {
    it("should access elements from the registry", () => {
      const elementRegistry = bpmnJS.get("elementRegistry");

      // Test accessing known elements
      const startEvent = elementRegistry.get("StartEvent_1");
      expect(startEvent).toBeDefined();
      expect(startEvent.id).toBe("StartEvent_1");
      expect(startEvent.type).toBe("bpmn:StartEvent");

      const task = elementRegistry.get("Task_1");
      expect(task).toBeDefined();
      expect(task.id).toBe("Task_1");
      expect(task.type).toBe("bpmn:Task");

      const endEvent = elementRegistry.get("EndEvent_1");
      expect(endEvent).toBeDefined();
      expect(endEvent.id).toBe("EndEvent_1");
      expect(endEvent.type).toBe("bpmn:EndEvent");
    });

    it("should get all elements", () => {
      const elementRegistry = bpmnJS.get("elementRegistry");
      const allElements = elementRegistry.getAll();

      expect(allElements).toBeDefined();
      expect(allElements.length).toBeGreaterThan(0);

      // Should include our test elements
      const elementIds = allElements.map((el: any) => el.id);
      expect(elementIds).toContain("StartEvent_1");
      expect(elementIds).toContain("Task_1");
      expect(elementIds).toContain("EndEvent_1");
    });
  });

  describe("Event Bus Integration", () => {
    it("should be able to register event listeners", () => {
      const eventBus = bpmnJS.get("eventBus");
      const mockCallback = vi.fn();

      eventBus.on("test.event", mockCallback);
      eventBus.fire("test.event", { data: "test" });

      expect(mockCallback).toHaveBeenCalled();
      expect(mockCallback.mock.calls[0][1]).toEqual({ data: "test" });
    });

    it("should handle element selection events", () => {
      const eventBus = bpmnJS.get("eventBus");
      const selection = bpmnJS.get("selection");
      const elementRegistry = bpmnJS.get("elementRegistry");

      const mockCallback = vi.fn();
      eventBus.on("selection.changed", mockCallback);

      const task = elementRegistry.get("Task_1");
      selection.select(task);

      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe("Canvas Integration", () => {
    it("should access canvas methods", () => {
      const canvas = bpmnJS.get("canvas");

      expect(canvas.zoom).toBeDefined();
      expect(canvas.scrollToElement).toBeDefined();
      expect(canvas.getRootElement).toBeDefined();

      const rootElement = canvas.getRootElement();
      expect(rootElement).toBeDefined();
    });
  });

  describe("Element Business Object Access", () => {
    it("should access element business objects", () => {
      const elementRegistry = bpmnJS.get("elementRegistry");
      const task = elementRegistry.get("Task_1");

      expect(task.businessObject).toBeDefined();
      expect(task.businessObject.id).toBe("Task_1");
      expect(task.businessObject.name).toBe("Test Task");
      expect(task.businessObject.$type).toBe("bpmn:Task");
    });

    it("should handle documentation property access", () => {
      const elementRegistry = bpmnJS.get("elementRegistry");
      const task = elementRegistry.get("Task_1");

      // Test getting documentation (should be undefined or empty array initially)
      const documentation = task.businessObject.get("documentation");
      expect(
        documentation === undefined ||
          (Array.isArray(documentation) && documentation.length === 0)
      ).toBe(true);

      // Test setting documentation (would require modeling service in real scenario)
      expect(task.businessObject.set).toBeDefined();
    });
  });

  describe("Real World Element Types", () => {
    it("should identify different BPMN element types correctly", () => {
      const elementRegistry = bpmnJS.get("elementRegistry");

      const startEvent = elementRegistry.get("StartEvent_1");
      expect(startEvent.type).toBe("bpmn:StartEvent");

      const task = elementRegistry.get("Task_1");
      expect(task.type).toBe("bpmn:Task");

      const endEvent = elementRegistry.get("EndEvent_1");
      expect(endEvent.type).toBe("bpmn:EndEvent");

      const flow1 = elementRegistry.get("Flow_1");
      expect(flow1.type).toBe("bpmn:SequenceFlow");
    });
  });
});
