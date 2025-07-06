declare module "bpmn-js" {
  export default class BpmnJS {
    constructor(options?: {
      container?: Element | string;
      additionalModules?: any[];
      [key: string]: any;
    });

    importXML(xml: string): Promise<{ warnings: any[] }>;

    get(serviceName: string, strict?: boolean): any;

    destroy(): void;

    on(event: string, callback: Function): void;

    off(event: string, callback: Function): void;
  }
}

declare module "bpmn-js/lib/util/ModelUtil" {
  export function is(element: any, type: string): boolean;
}
