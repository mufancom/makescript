import {Dict} from 'tslang';

import {AdapterRunScriptResult} from './adapter';

export interface ScriptRunningArgument {
  id: string;
  name: string;
  parameters: ScriptRunningArgumentParameters;
  resourcesBaseURL: string;
  password: string | undefined;
}

export type ScriptRunningArgumentParameters = Dict<unknown>;

export interface ScriptRunningResult {
  name: string;
  displayName: string;
  parameters: ScriptRunningArgumentParameters;
  deniedParameters: ScriptRunningArgumentParameters;
  result: AdapterRunScriptResult;
  output: {
    output: string;
    error: string;
  };
}
