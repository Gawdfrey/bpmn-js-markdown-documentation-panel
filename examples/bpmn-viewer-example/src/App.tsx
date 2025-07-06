import { useState, useEffect } from 'react'
import BpmnViewer from './components/BpmnViewer'
import './App.css'

function App() {
  const [xml, setXml] = useState<string>('')

  useEffect(() => {
    // Load the sample BPMN diagram
    fetch('/sample-diagram.xml')
      .then(response => response.text())
      .then(xmlData => setXml(xmlData))
      .catch(error => console.error('Error loading BPMN diagram:', error));
  }, []);

  return (
    <div className="example-container" style={{ padding: '20px' }}>
      <header className="example-header">
        <h1>BPMN Documentation Panel Example</h1>
        <p>
          This example demonstrates the BPMN Documentation Panel plugin in action. 
          Click on any BPMN element to see the documentation panel appear on the right side.
        </p>
        <div className="instructions-box">
          <h3>How to test:</h3>
          <ul>
            <li>Click on any task, event, or gateway in the diagram below</li>
            <li>The documentation panel will appear on the right side</li>
            <li>Try clicking the element links within the documentation to navigate between elements</li>
            <li>Use the Overview tab to see all documented elements</li>
          </ul>
        </div>
      </header>
      
      <div className="diagram-container" style={{ height: '600px', width: '100%' }}>
        {xml ? (
          <BpmnViewer xml={xml} />
        ) : (
          <div className="loading-message">
            Loading BPMN diagram...
          </div>
        )}
      </div>
    </div>
  )
}

export default App
