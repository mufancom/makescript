import {
  AdapterRunScriptResult,
  ScriptRunningArgumentParameters,
} from '@makeflow/makescript-agent';

export interface RunningRecord {
  id: string;
  namespace: string;
  name: string;
  parameters: ScriptRunningArgumentParameters;
  deniedParameters: ScriptRunningArgumentParameters;
  triggerTokenLabel: string | undefined;
  makeflow: RunningRecordMakeflowInfo | undefined;
  result: AdapterRunScriptResult | undefined;
  output: RunningRecordOutput | undefined;
  createdAt: number;
  ranAt: number | undefined;
}

export interface RunningRecordMakeflowInfo {
  taskUrl: string;
  numericId: number;
  brief: string;
  assignee: {
    displayName: string;
    id: string;
  };
}

export interface RunningRecordOutput {
  output: string;
  error: string;
}
