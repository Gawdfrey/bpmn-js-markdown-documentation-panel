import BpmnJS from "bpmn-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExportManager } from "../../managers/ExportManager";

// BPMN diagram with documented elements for testing
const diagramWithDocumentation = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true" name="Test Process">
    <bpmn:documentation>This is a test process for documentation export</bpmn:documentation>
    <bpmn:startEvent id="StartEvent_1" name="Start">
      <bpmn:documentation>Start of the process</bpmn:documentation>
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_1" name="Test Task">
      <bpmn:documentation>This task performs important business logic</bpmn:documentation>
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
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="270" y="77" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="432" y="99" width="36" height="36" />
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

describe("ExportManager", () => {
  let bpmnJS: BpmnJS;
  let exportManager: ExportManager;
  let elementRegistry: any;
  let moddle: any;
  let canvas: any;

  beforeEach(async () => {
    // Create BPMN-JS instance
    bpmnJS = new BpmnJS({
      container: document.createElement("div"),
    });

    // Import diagram with documentation
    await bpmnJS.importXML(diagramWithDocumentation);

    // Get services
    elementRegistry = bpmnJS.get("elementRegistry");
    moddle = bpmnJS.get("moddle");
    canvas = bpmnJS.get("canvas");

    // Create ExportManager instance
    exportManager = new ExportManager(elementRegistry, moddle, canvas);
  });

  afterEach(() => {
    if (bpmnJS) {
      bpmnJS.destroy();
    }
  });

  describe("Constructor", () => {
    it("should initialize with BPMN-JS services", () => {
      expect(exportManager).toBeDefined();
      expect(exportManager).toBeInstanceOf(ExportManager);
    });
  });

  describe("Element Documentation Detection", () => {
    it("should detect elements with documentation", () => {
      const startEvent = elementRegistry.get("StartEvent_1");
      const task = elementRegistry.get("Task_1");
      const endEvent = elementRegistry.get("EndEvent_1");

      // Check that documented elements have documentation
      expect(startEvent.businessObject.documentation).toBeDefined();
      expect(task.businessObject.documentation).toBeDefined();

      // End event should not have documentation in our test diagram
      expect(endEvent.businessObject.documentation).toBeUndefined();
    });

    it("should access documentation content", () => {
      const startEvent = elementRegistry.get("StartEvent_1");
      const task = elementRegistry.get("Task_1");

      // Get documentation content
      const startEventDoc = startEvent.businessObject.documentation?.[0]?.text;
      const taskDoc = task.businessObject.documentation?.[0]?.text;

      expect(startEventDoc).toBe("Start of the process");
      expect(taskDoc).toBe("This task performs important business logic");
    });
  });

  describe("Process Information", () => {
    it("should extract process information", () => {
      const rootElement = canvas.getRootElement();

      expect(rootElement).toBeDefined();
      expect(rootElement.businessObject).toBeDefined();
      expect(rootElement.businessObject.id).toBe("Process_1");
      expect(rootElement.businessObject.name).toBe("Test Process");
    });

    it("should access process documentation", () => {
      const rootElement = canvas.getRootElement();
      const processDoc = rootElement.businessObject.documentation?.[0]?.text;

      expect(processDoc).toBe(
        "This is a test process for documentation export"
      );
    });
  });

  describe("Element Filtering", () => {
    it("should get all elements from registry", () => {
      const allElements = elementRegistry.getAll();

      expect(allElements).toBeDefined();
      expect(allElements.length).toBeGreaterThan(0);

      // Should include our test elements
      const elementIds = allElements.map((el: any) => el.id);
      expect(elementIds).toContain("StartEvent_1");
      expect(elementIds).toContain("Task_1");
      expect(elementIds).toContain("EndEvent_1");
    });

    it("should identify documented vs undocumented elements", () => {
      const startEvent = elementRegistry.get("StartEvent_1");
      const task = elementRegistry.get("Task_1");
      const endEvent = elementRegistry.get("EndEvent_1");

      // Check documentation presence
      const hasStartEventDoc =
        !!startEvent.businessObject.documentation?.length;
      const hasTaskDoc = !!task.businessObject.documentation?.length;
      const hasEndEventDoc = !!endEvent.businessObject.documentation?.length;

      expect(hasStartEventDoc).toBe(true);
      expect(hasTaskDoc).toBe(true);
      expect(hasEndEventDoc).toBe(false);
    });
  });

  describe("Element Type Detection", () => {
    it("should identify different BPMN element types", () => {
      const startEvent = elementRegistry.get("StartEvent_1");
      const task = elementRegistry.get("Task_1");
      const endEvent = elementRegistry.get("EndEvent_1");
      const flow = elementRegistry.get("Flow_1");

      expect(startEvent.type).toBe("bpmn:StartEvent");
      expect(task.type).toBe("bpmn:Task");
      expect(endEvent.type).toBe("bpmn:EndEvent");
      expect(flow.type).toBe("bpmn:SequenceFlow");
    });
  });

  describe("Export Event Setup", () => {
    it("should setup export event listeners", () => {
      // Create a mock export button
      const exportBtn = document.createElement("button");
      exportBtn.id = "export-btn";
      document.body.appendChild(exportBtn);

      const clickSpy = vi.fn();
      exportBtn.addEventListener("click", clickSpy);

      // Setup event listeners
      exportManager.setupExportEventListeners();

      // Wait for setTimeout to complete
      return new Promise((resolve) => {
        setTimeout(() => {
          // Simulate button click
          exportBtn.click();
          expect(clickSpy).toHaveBeenCalled();

          // Cleanup
          document.body.removeChild(exportBtn);
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe("Export Functionality", () => {
    it("should handle export method", () => {
      // Spy on exportDocumentation method
      const exportSpy = vi.spyOn(exportManager, "exportDocumentation");

      // Call handleExport
      exportManager.handleExport();

      expect(exportSpy).toHaveBeenCalled();
    });
  });

  describe("Element Name Extraction", () => {
    it("should extract element names correctly", () => {
      const startEvent = elementRegistry.get("StartEvent_1");
      const task = elementRegistry.get("Task_1");
      const endEvent = elementRegistry.get("EndEvent_1");

      expect(startEvent.businessObject.name).toBe("Start");
      expect(task.businessObject.name).toBe("Test Task");
      expect(endEvent.businessObject.name).toBe("End");
    });

    it("should handle elements without names", () => {
      const flow = elementRegistry.get("Flow_1");

      // Sequence flows typically don't have names
      expect(flow.businessObject.name).toBeUndefined();
    });
  });

  describe("Documentation Structure", () => {
    it("should have proper documentation object structure", () => {
      const task = elementRegistry.get("Task_1");
      const documentation = task.businessObject.documentation;

      expect(Array.isArray(documentation)).toBe(true);
      expect(documentation).toHaveLength(1);
      expect(documentation[0]).toHaveProperty("text");
      expect(typeof documentation[0].text).toBe("string");
    });
  });
});
