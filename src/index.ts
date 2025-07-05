import { registerBpmnJSPlugin } from "camunda-modeler-plugin-helpers";
import { DocumentationExtension } from "./documentation-extension";

registerBpmnJSPlugin({
  __init__: ["documentationExtension"],
  documentationExtension: ["type", DocumentationExtension],
});
