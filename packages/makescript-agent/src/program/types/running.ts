import {Dict} from 'tslang';

import {AdapterRunScriptResult} from '../@adapters/adapter';

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
  parameters: ScriptRunningArgumentParameters;
  deniedParameters: ScriptRunningArgumentParameters;
  result: AdapterRunScriptResult;
  output: {
    output: string;
    error: string;
  };
}
