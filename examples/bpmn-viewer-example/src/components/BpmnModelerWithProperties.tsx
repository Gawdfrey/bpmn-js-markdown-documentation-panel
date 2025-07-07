import BpmnJS from "bpmn-js/lib/Modeler";
import { DocumentationExtension } from "bpmn-js-markdown-documentation-panel";
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
  // @ts-ignore
} from "bpmn-js-properties-panel";
import type React from "react";
import { useEffect, useRef } from "react";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "@bpmn-io/properties-panel/dist/assets/properties-panel.css";
import "bpmn-js-markdown-documentation-panel/dist/style.css";

interface BpmnModelerWithPropertiesProps {
  xml: string;
  className?: string;
}

const BpmnModelerWithProperties: React.FC<BpmnModelerWithPropertiesProps> = ({
  xml,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const propertiesPanelRef = useRef<HTMLDivElement>(null);
  const modelerRef = useRef<BpmnJS | null>(null);

  useEffect(() => {
    if (!containerRef.current || !propertiesPanelRef.current) return;

    // Create BPMN modeler with documentation extension and properties panel
    const modeler = new BpmnJS({
      container: containerRef.current,
      propertiesPanel: {
        parent: propertiesPanelRef.current,
      },
      additionalModules: [
        DocumentationExtension,
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
      ],
    });

    modelerRef.current = modeler;

    // Import the XML
    modeler
      .importXML(xml)
      .then(() => {
        console.log(
          "BPMN diagram imported successfully in modeler with properties"
        );

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
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        border: "1px solid #ccc",
        borderRadius: "4px",
      }}
    >
      <div
        ref={containerRef}
        style={{
          flex: 1,
          height: "100%",
        }}
      />
      <div
        ref={propertiesPanelRef}
        className="bio-properties-panel-container"
        style={{
          width: "300px",
          height: "100%",
          borderLeft: "1px solid #ccc",
          overflow: "auto",
        }}
      />
    </div>
  );
};

export default BpmnModelerWithProperties;
