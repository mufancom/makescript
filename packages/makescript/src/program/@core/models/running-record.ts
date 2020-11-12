import {
  AdapterRunScriptResult,
  ScriptRunningArgumentParameter,
} from '@makeflow/makescript-agent';

export interface RunningRecordModel {
  id: string;
  namespace: string;
  name: string;
  parameters: ScriptRunningArgumentParameter[];
  triggerToken: string;
  makeflowTask: RunningRecordMakeflowTask | undefined;
  result: AdapterRunScriptResult | undefined;
  createdAt: number;
  ranAt: number | undefined;
}

export interface RunningRecordMakeflowTask {
  url: string;
  numericId: number;
  brief: string;
}
