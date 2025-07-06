import BpmnJS from "bpmn-js/lib/Modeler";
import { DocumentationExtension } from "bpmn-js-markdown-documentation-panel";
import type React from "react";
import { useEffect, useRef } from "react";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "bpmn-js-markdown-documentation-panel/dist/style.css";

interface BpmnModelerProps {
  xml: string;
  className?: string;
}

const BpmnModeler: React.FC<BpmnModelerProps> = ({ xml, className }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnJS | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create BPMN modeler with documentation extension
    const modeler = new BpmnJS({
      container: containerRef.current,
      additionalModules: [DocumentationExtension],
    });

    modelerRef.current = modeler;

    // Import the XML
    modeler
      .importXML(xml)
      .then(() => {
        console.log("BPMN diagram imported successfully in modeler");

        // Fit diagram to viewport
        const canvas = modeler.get("canvas");
        // @ts-ignore
        canvas.zoom("fit-viewport");
      })
      .catch((error) => {
        console.error("Error importing BPMN diagram:", error);
      });

    return () => {
      modeler.destroy();
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

export default BpmnModeler;
