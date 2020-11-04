export interface ScriptRunningArgument {
  token: string;
  name: string;
  parameters: ScriptRunningArgumentParameter[];
  resourcesBaseURL: string;
  hostURL: string;
}

export interface ScriptRunningArgumentParameter {
  name: string;
  value: unknown;
}
