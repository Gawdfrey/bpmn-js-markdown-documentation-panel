import { useEffect, useState } from "react";
import BpmnModeler from "./components/BpmnModeler";
import BpmnModelerWithProperties from "./components/BpmnModelerWithProperties";
import BpmnNavigatedViewer from "./components/BpmnNavigatedViewer";
import "./App.css";

type ViewMode = "modeler" | "modeler-with-properties" | "viewer";

function App() {
  const [xml, setXml] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("modeler");

  useEffect(() => {
    // Load the sample BPMN diagram
    fetch("/sample-diagram.xml")
      .then((response) => response.text())
      .then((xmlData) => setXml(xmlData))
      .catch((error) => console.error("Error loading BPMN diagram:", error));
  }, []);

  return (
    <div className="example-container" style={{ padding: "20px" }}>
      <header className="example-header">
        <h1>BPMN Documentation Panel Example</h1>
        <p>
          This example demonstrates the BPMN Documentation Panel plugin in
          action. Switch between the modeler and viewer modes using the tabs
          below.
        </p>

        {/* Tab Navigation */}
        <div className="tab-navigation" style={{ marginBottom: "20px" }}>
          <button
            type="button"
            className={`tab-button ${viewMode === "modeler" ? "active" : ""}`}
            onClick={() => setViewMode("modeler")}
            style={{
              padding: "10px 20px",
              marginRight: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: viewMode === "modeler" ? "#007bff" : "#f8f9fa",
              color: viewMode === "modeler" ? "white" : "#333",
              cursor: "pointer",
            }}
          >
            Modeler (Edit Mode)
          </button>
          <button
            type="button"
            className={`tab-button ${viewMode === "modeler-with-properties" ? "active" : ""}`}
            onClick={() => setViewMode("modeler-with-properties")}
            style={{
              padding: "10px 20px",
              marginRight: "10px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: viewMode === "modeler-with-properties" ? "#007bff" : "#f8f9fa",
              color: viewMode === "modeler-with-properties" ? "white" : "#333",
              cursor: "pointer",
            }}
          >
            Modeler + Properties Panel
          </button>
          <button
            type="button"
            className={`tab-button ${viewMode === "viewer" ? "active" : ""}`}
            onClick={() => setViewMode("viewer")}
            style={{
              padding: "10px 20px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              backgroundColor: viewMode === "viewer" ? "#007bff" : "#f8f9fa",
              color: viewMode === "viewer" ? "white" : "#333",
              cursor: "pointer",
            }}
          >
            Navigated Viewer (Read-Only)
          </button>
        </div>

        <div className="instructions-box">
          <h3>How to test:</h3>
          <ul>
            <li>
              <strong>Modeler mode:</strong> You can edit the diagram and
              add/modify elements
            </li>
            <li>
              <strong>Modeler + Properties Panel:</strong> Edit mode with built-in
              properties panel for element configuration
            </li>
            <li>
              <strong>Viewer mode:</strong> Read-only view with navigation
              controls
            </li>
            <li>
              Click on any task, event, or gateway in the diagram to see the
              documentation panel
            </li>
            <li>The documentation panel will appear on the right side</li>
            <li>
              Try clicking the element links within the documentation to
              navigate between elements
            </li>
            <li>Use the Overview tab to see all documented elements</li>
          </ul>
        </div>
      </header>

      <div
        className="diagram-container"
        style={{ height: "600px", width: "100%" }}
      >
        {xml ? (
          <>
            {viewMode === "modeler" && <BpmnModeler xml={xml} />}
            {viewMode === "modeler-with-properties" && <BpmnModelerWithProperties xml={xml} />}
            {viewMode === "viewer" && <BpmnNavigatedViewer xml={xml} />}
          </>
        ) : (
          <div className="loading-message">Loading BPMN diagram...</div>
        )}
      </div>
    </div>
  );
}

export default App;
