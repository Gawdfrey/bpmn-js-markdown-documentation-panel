import BpmnJS from "bpmn-js/lib/Modeler";
import { DocumentationExtension } from "bpmn-js-markdown-documentation-panel";
import type React from "react";
import { useEffect, useRef } from "react";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "bpmn-js-markdown-documentation-panel/dist/style.css";

interface BpmnViewerProps {
  xml: string;
  className?: string;
}

const BpmnViewer: React.FC<BpmnViewerProps> = ({ xml, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<BpmnJS | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create BPMN viewer with documentation extension
    const viewer = new BpmnJS({
      container: containerRef.current,
      additionalModules: [DocumentationExtension],
    });

    viewerRef.current = viewer;

    // Import the XML
    viewer
      .importXML(xml)
      .then(() => {
        console.log("BPMN diagram imported successfully");

        // Fit diagram to viewport
        const canvas = viewer.get("canvas");
        // @ts-ignore
        canvas.zoom("fit-viewport");
      })
      .catch(() => {});

    return () => {
      viewer.destroy();
    };
  }, [xml]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        border: "1px solid #ccc",
        borderRadius: "4px",
      }}
    />
  );
};

export default BpmnViewer;
