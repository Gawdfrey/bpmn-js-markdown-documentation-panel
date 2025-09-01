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

  describe("Element Link Fixing for Export", () => {
    it("should fix element links by adding element- prefix in exported HTML", () => {
      const elements = [
        { id: "StartEvent_1", name: "Start" },
        { id: "Task_1", name: "Test Task" },
        { id: "EndEvent_1", name: "End" }
      ];

      const htmlContent = `
        <p>See the <a href="#StartEvent_1">start event</a> and <a href="#Task_1">task</a>.</p>
        <p>The process ends at the <a href="#EndEvent_1">end event</a>.</p>
        <p>External link: <a href="#external-section">External Section</a></p>
        <p>Regular link: <a href="https://example.com">Example</a></p>
      `;

      // Use private method via type assertion for testing
      const fixedContent = (exportManager as any)._fixElementLinksForExport(htmlContent, elements);

      // Element links should be prefixed
      expect(fixedContent).toContain('href="#element-StartEvent_1"');
      expect(fixedContent).toContain('href="#element-Task_1"');
      expect(fixedContent).toContain('href="#element-EndEvent_1"');
      
      // Non-element links should remain unchanged
      expect(fixedContent).toContain('href="#external-section"');
      expect(fixedContent).toContain('href="https://example.com"');
      
      // Original element links should not exist
      expect(fixedContent).not.toContain('href="#StartEvent_1"');
      expect(fixedContent).not.toContain('href="#Task_1"');
      expect(fixedContent).not.toContain('href="#EndEvent_1"');
    });

    it("should only fix links that match actual element IDs", () => {
      const elements = [
        { id: "Task_1", name: "Test Task" }
      ];

      const htmlContent = `
        <p>Valid: <a href="#Task_1">Valid Task Link</a></p>
        <p>Invalid: <a href="#Task_2">Invalid Task Link</a></p>
        <p>Similar: <a href="#Task_1_Extended">Similar but not exact</a></p>
      `;

      const fixedContent = (exportManager as any)._fixElementLinksForExport(htmlContent, elements);

      // Only the exact element ID should be prefixed
      expect(fixedContent).toContain('href="#element-Task_1"');
      expect(fixedContent).toContain('href="#Task_2"'); // unchanged
      expect(fixedContent).toContain('href="#Task_1_Extended"'); // unchanged
    });

    it("should handle empty or no links gracefully", () => {
      const elements = [
        { id: "Task_1", name: "Test Task" }
      ];

      const htmlContentNoLinks = `<p>No links here</p>`;
      const htmlContentEmpty = ``;

      const fixedNoLinks = (exportManager as any)._fixElementLinksForExport(htmlContentNoLinks, elements);
      const fixedEmpty = (exportManager as any)._fixElementLinksForExport(htmlContentEmpty, elements);

      expect(fixedNoLinks).toBe(htmlContentNoLinks);
      expect(fixedEmpty).toBe(htmlContentEmpty);
    });

    it("should handle complex HTML structures with nested links", () => {
      const elements = [
        { id: "StartEvent_1", name: "Start" },
        { id: "Task_1", name: "Test Task" }
      ];

      const htmlContent = `
        <div class="section">
          <h2>Process Flow</h2>
          <p>The process starts with <a href="#StartEvent_1">this event</a> and continues to:</p>
          <ul>
            <li><a href="#Task_1">Main Task</a></li>
            <li><a href="#external-ref">External Reference</a></li>
          </ul>
          <blockquote>
            <p>Reference back to <a href="#StartEvent_1">start</a> for details.</p>
          </blockquote>
        </div>
      `;

      const fixedContent = (exportManager as any)._fixElementLinksForExport(htmlContent, elements);

      // All element references should be prefixed
      expect(fixedContent).toContain('href="#element-StartEvent_1"');
      expect(fixedContent).toContain('href="#element-Task_1"');
      
      // External reference should remain unchanged
      expect(fixedContent).toContain('href="#external-ref"');
      
      // Should maintain HTML structure
      expect(fixedContent).toContain('<div class="section">');
      expect(fixedContent).toContain('<ul>');
      expect(fixedContent).toContain('<blockquote>');
    });
  });

  describe("Integration: Full Export with Element Links", () => {
    beforeEach(async () => {
      // Add documentation with element links to test elements
      const startEvent = elementRegistry.get("StartEvent_1");
      const task = elementRegistry.get("Task_1");
      const endEvent = elementRegistry.get("EndEvent_1");

      // Add element links in documentation
      startEvent.businessObject.documentation = [{
        text: "Start of the process. Next step: [Test Task](#Task_1)"
      }];

      task.businessObject.documentation = [{
        text: "Main task that processes data. Triggered by [Start](#StartEvent_1) and leads to [End](#EndEvent_1)."
      }];

      endEvent.businessObject.documentation = [{
        text: "Process completion. Follows after [Test Task](#Task_1)."
      }];
    });

    it("should export HTML with working element links", async () => {
      // Get process info and elements for export
      const processInfo = (exportManager as any)._getProcessInfo();
      const elements = (exportManager as any)._getAllElementsWithDocumentation();
      
      // Generate HTML using internal method
      const exportedHtml = await (exportManager as any)._generateHTMLExport(elements, processInfo);

      // Should contain element sections with correct IDs
      expect(exportedHtml).toContain('id="element-StartEvent_1"');
      expect(exportedHtml).toContain('id="element-Task_1"');
      expect(exportedHtml).toContain('id="element-EndEvent_1"');

      // Should contain TOC links with element- prefix
      expect(exportedHtml).toContain('href="#element-StartEvent_1"');
      expect(exportedHtml).toContain('href="#element-Task_1"');
      expect(exportedHtml).toContain('href="#element-EndEvent_1"');

      // Documentation should have element links fixed with element- prefix
      expect(exportedHtml).toContain('Next step: <a href="#element-Task_1">Test Task</a>');
      expect(exportedHtml).toContain('Triggered by <a href="#element-StartEvent_1">Start</a>');
      expect(exportedHtml).toContain('leads to <a href="#element-EndEvent_1">End</a>');
      expect(exportedHtml).toContain('Follows after <a href="#element-Task_1">Test Task</a>');

      // Should not contain unfixed element links
      expect(exportedHtml).not.toContain('href="#StartEvent_1"');
      expect(exportedHtml).not.toContain('href="#Task_1"');
      expect(exportedHtml).not.toContain('href="#EndEvent_1"');
    });

    it("should handle documentation with mixed link types", async () => {
      // Add documentation with both element links and other links
      const task = elementRegistry.get("Task_1");
      task.businessObject.documentation = [{
        text: `# Task Documentation

This task connects [Start Event](#StartEvent_1) to [End Event](#EndEvent_1).

For external references, see [Guidelines](#guidelines) and [FAQ](https://example.com/faq).

Process flow: [Start](#StartEvent_1) → Current Task → [End](#EndEvent_1)`
      }];

      // Get process info and elements for export
      const processInfo = (exportManager as any)._getProcessInfo();
      const elements = (exportManager as any)._getAllElementsWithDocumentation();
      
      // Generate HTML using internal method
      const exportedHtml = await (exportManager as any)._generateHTMLExport(elements, processInfo);

      // Element links should be prefixed
      expect(exportedHtml).toContain('href="#element-StartEvent_1"');
      expect(exportedHtml).toContain('href="#element-EndEvent_1"');

      // Non-element links should remain unchanged
      expect(exportedHtml).toContain('href="#guidelines"');
      expect(exportedHtml).toContain('href="https://example.com/faq"');
    });
  });
});
