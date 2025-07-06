import BpmnJS from "bpmn-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import documentationExtensionModule from "../../index";

// BPMN diagram for integration testing
const integrationDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true" name="Integration Test Process">
    <bpmn:documentation>This process is used for integration testing of the documentation panel</bpmn:documentation>
    <bpmn:startEvent id="StartEvent_1" name="Start Process">
      <bpmn:documentation>Initial event that triggers the process flow</bpmn:documentation>
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="UserTask_1" name="Review Application">
      <bpmn:documentation>User reviews the submitted application for completeness.

**Key Points:**
- Check all required fields are filled
- Verify supporting documents are attached
- Validate contact information

See also: [End Process](#EndEvent_1)</bpmn:documentation>
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:serviceTask id="ServiceTask_1" name="Send Notification">
      <bpmn:documentation>Automated notification sent to applicant about review status.

This task connects to the [Review Application](#UserTask_1) task.</bpmn:documentation>
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_3</bpmn:outgoing>
    </bpmn:serviceTask>
    <bpmn:endEvent id="EndEvent_1" name="Process Complete">
      <bpmn:documentation>Final event marking the completion of the review process</bpmn:documentation>
      <bpmn:incoming>Flow_3</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="UserTask_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="UserTask_1" targetRef="ServiceTask_1" />
    <bpmn:sequenceFlow id="Flow_3" sourceRef="ServiceTask_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="179" y="99" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="UserTask_1_di" bpmnElement="UserTask_1">
        <dc:Bounds x="270" y="77" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="ServiceTask_1_di" bpmnElement="ServiceTask_1">
        <dc:Bounds x="420" y="77" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="572" y="99" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="215" y="117" />
        <di:waypoint x="270" y="117" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="370" y="117" />
        <di:waypoint x="420" y="117" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_3_di" bpmnElement="Flow_3">
        <di:waypoint x="520" y="117" />
        <di:waypoint x="572" y="117" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

describe("Documentation Integration", () => {
  let bpmnJS: BpmnJS;
  let documentationExtension: any;

  beforeEach(async () => {
    // Create BPMN-JS instance with documentation extension
    bpmnJS = new BpmnJS({
      container: document.createElement("div"),
      additionalModules: [documentationExtensionModule],
    });

    // Import diagram with rich documentation
    await bpmnJS.importXML(integrationDiagram);

    // Get the documentation extension service
    documentationExtension = bpmnJS.get("documentationExtension");
  });

  afterEach(() => {
    if (bpmnJS) {
      bpmnJS.destroy();
    }
  });

  describe("Extension Integration", () => {
    it("should have documentation extension loaded", () => {
      expect(documentationExtension).toBeDefined();
    });

    it("should access all required BPMN-JS services", () => {
      const eventBus = bpmnJS.get("eventBus");
      const elementRegistry = bpmnJS.get("elementRegistry");
      const canvas = bpmnJS.get("canvas");
      const moddle = bpmnJS.get("moddle");
      const selection = bpmnJS.get("selection");

      expect(eventBus).toBeDefined();
      expect(elementRegistry).toBeDefined();
      expect(canvas).toBeDefined();
      expect(moddle).toBeDefined();
      expect(selection).toBeDefined();
    });
  });

  describe("Element Documentation", () => {
    it("should access process-level documentation", () => {
      const canvas = bpmnJS.get("canvas");
      const rootElement = canvas.getRootElement();

      expect(rootElement.businessObject.documentation).toBeDefined();
      expect(rootElement.businessObject.documentation[0].text).toContain(
        "integration testing"
      );
    });

    it("should access element-level documentation", () => {
      const elementRegistry = bpmnJS.get("elementRegistry");

      const startEvent = elementRegistry.get("StartEvent_1");
      const userTask = elementRegistry.get("UserTask_1");
      const serviceTask = elementRegistry.get("ServiceTask_1");
      const endEvent = elementRegistry.get("EndEvent_1");

      // Check that all elements have documentation
      expect(startEvent.businessObject.documentation).toBeDefined();
      expect(userTask.businessObject.documentation).toBeDefined();
      expect(serviceTask.businessObject.documentation).toBeDefined();
      expect(endEvent.businessObject.documentation).toBeDefined();
    });

    it("should handle rich markdown documentation", () => {
      const elementRegistry = bpmnJS.get("elementRegistry");
      const userTask = elementRegistry.get("UserTask_1");

      const documentation = userTask.businessObject.documentation[0].text;

      // Check markdown formatting
      expect(documentation).toContain("**Key Points:**");
      expect(documentation).toContain("- Check all required fields");
      expect(documentation).toContain("[End Process](#EndEvent_1)");
    });

    it("should handle cross-references between elements", () => {
      const elementRegistry = bpmnJS.get("elementRegistry");
      const userTask = elementRegistry.get("UserTask_1");
      const serviceTask = elementRegistry.get("ServiceTask_1");

      const userTaskDoc = userTask.businessObject.documentation[0].text;
      const serviceTaskDoc = serviceTask.businessObject.documentation[0].text;

      // Check cross-references
      expect(userTaskDoc).toContain("#EndEvent_1");
      expect(serviceTaskDoc).toContain("#UserTask_1");
    });
  });

  describe("Event Handling", () => {
    it("should respond to element selection events", () => {
      const eventBus = bpmnJS.get("eventBus");
      const selection = bpmnJS.get("selection");
      const elementRegistry = bpmnJS.get("elementRegistry");

      const selectionChangedSpy = vi.fn();
      eventBus.on("selection.changed", selectionChangedSpy);

      // Select an element
      const userTask = elementRegistry.get("UserTask_1");
      selection.select(userTask);

      expect(selectionChangedSpy).toHaveBeenCalled();
    });

    it("should respond to element click events", () => {
      const eventBus = bpmnJS.get("eventBus");
      const elementRegistry = bpmnJS.get("elementRegistry");

      const elementClickSpy = vi.fn();
      eventBus.on("element.click", elementClickSpy);

      // Simulate element click
      const userTask = elementRegistry.get("UserTask_1");
      eventBus.fire("element.click", { element: userTask });

      expect(elementClickSpy).toHaveBeenCalled();
      expect(elementClickSpy.mock.calls[0][1].element.id).toBe("UserTask_1");
    });
  });

  describe("Documentation Coverage", () => {
    it("should identify documented vs undocumented elements", () => {
      const elementRegistry = bpmnJS.get("elementRegistry");
      const allElements = elementRegistry.getAll();

      const documentedElements = allElements.filter(
        (element: any) =>
          element.businessObject.documentation &&
          element.businessObject.documentation.length > 0
      );

      const undocumentedElements = allElements.filter(
        (element: any) =>
          !element.businessObject.documentation ||
          element.businessObject.documentation.length === 0
      );

      // In our test diagram, most elements should be documented
      expect(documentedElements.length).toBeGreaterThan(0);

      // Should include our documented elements
      const documentedIds = documentedElements.map((el: any) => el.id);
      expect(documentedIds).toContain("StartEvent_1");
      expect(documentedIds).toContain("UserTask_1");
      expect(documentedIds).toContain("ServiceTask_1");
      expect(documentedIds).toContain("EndEvent_1");
    });

    it("should calculate documentation coverage percentage", () => {
      const elementRegistry = bpmnJS.get("elementRegistry");
      const allElements = elementRegistry.getAll();

      // Filter to only BPMN elements (exclude diagram elements)
      const bpmnElements = allElements.filter(
        (element: any) =>
          element.businessObject &&
          element.businessObject.$type &&
          element.businessObject.$type.startsWith("bpmn:")
      );

      const documentedElements = bpmnElements.filter(
        (element: any) =>
          element.businessObject.documentation &&
          element.businessObject.documentation.length > 0
      );

      const coveragePercentage =
        (documentedElements.length / bpmnElements.length) * 100;

      expect(coveragePercentage).toBeGreaterThan(0);
      expect(coveragePercentage).toBeLessThanOrEqual(100);
    });
  });

  describe("Element Type Recognition", () => {
    it("should recognize different BPMN element types", () => {
      const elementRegistry = bpmnJS.get("elementRegistry");

      const startEvent = elementRegistry.get("StartEvent_1");
      const userTask = elementRegistry.get("UserTask_1");
      const serviceTask = elementRegistry.get("ServiceTask_1");
      const endEvent = elementRegistry.get("EndEvent_1");

      expect(startEvent.type).toBe("bpmn:StartEvent");
      expect(userTask.type).toBe("bpmn:UserTask");
      expect(serviceTask.type).toBe("bpmn:ServiceTask");
      expect(endEvent.type).toBe("bpmn:EndEvent");
    });

    it("should handle task subtypes correctly", () => {
      const elementRegistry = bpmnJS.get("elementRegistry");

      const userTask = elementRegistry.get("UserTask_1");
      const serviceTask = elementRegistry.get("ServiceTask_1");

      // Both should be tasks but with different subtypes
      expect(userTask.businessObject.$type).toBe("bpmn:UserTask");
      expect(serviceTask.businessObject.$type).toBe("bpmn:ServiceTask");

      // Both should have task-like properties
      expect(userTask.businessObject.name).toBeDefined();
      expect(serviceTask.businessObject.name).toBeDefined();
    });
  });

  describe("Markdown Link Processing", () => {
    it("should identify markdown links in documentation", () => {
      const elementRegistry = bpmnJS.get("elementRegistry");
      const userTask = elementRegistry.get("UserTask_1");
      const serviceTask = elementRegistry.get("ServiceTask_1");

      const userTaskDoc = userTask.businessObject.documentation[0].text;
      const serviceTaskDoc = serviceTask.businessObject.documentation[0].text;

      // Check for markdown link pattern [text](#elementId)
      const linkPattern = /\[([^\]]+)\]\(#([^)]+)\)/g;

      const userTaskLinks = userTaskDoc.match(linkPattern);
      const serviceTaskLinks = serviceTaskDoc.match(linkPattern);

      expect(userTaskLinks).toBeTruthy();
      expect(serviceTaskLinks).toBeTruthy();

      expect(userTaskLinks[0]).toContain("#EndEvent_1");
      expect(serviceTaskLinks[0]).toContain("#UserTask_1");
    });

    it("should validate that linked elements exist", () => {
      const elementRegistry = bpmnJS.get("elementRegistry");
      const userTask = elementRegistry.get("UserTask_1");

      const documentation = userTask.businessObject.documentation[0].text;
      const linkPattern = /\[([^\]]+)\]\(#([^)]+)\)/g;
      const matches = [...documentation.matchAll(linkPattern)];

      matches.forEach((match) => {
        const linkedElementId = match[2];
        const linkedElement = elementRegistry.get(linkedElementId);

        expect(linkedElement).toBeDefined();
        expect(linkedElement.id).toBe(linkedElementId);
      });
    });
  });

  describe("Canvas Integration", () => {
    it("should scroll to elements when navigating", () => {
      const canvas = bpmnJS.get("canvas");
      const elementRegistry = bpmnJS.get("elementRegistry");

      const userTask = elementRegistry.get("UserTask_1");

      // Test canvas scrolling functionality
      expect(canvas.scrollToElement).toBeDefined();

      // Scroll to element should not throw
      expect(() => canvas.scrollToElement(userTask)).not.toThrow();
    });

    it("should handle zoom operations", () => {
      const canvas = bpmnJS.get("canvas");

      expect(canvas.zoom).toBeDefined();

      // Zoom should not throw
      expect(() => canvas.zoom("fit-viewport")).not.toThrow();
    });
  });
});
