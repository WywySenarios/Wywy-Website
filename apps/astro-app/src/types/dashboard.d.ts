export interface DashboardComponentBaseSchema {
  name: string;
  type: string;
  metrics: Array<string>;
  function?: string;
  "function args"?: Array<string>;
  selector?: string;
  "selector args"?: Array<string>;
}
