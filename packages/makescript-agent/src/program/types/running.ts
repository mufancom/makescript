import {Dict} from 'tslang';

export interface ScriptRunningArgument {
  token: string;
  name: string;
  parameters: ScriptRunningArgumentParameters;
  resourcesBaseURL: string;
  hostURL: string;
}

export type ScriptRunningArgumentParameters = Dict<unknown>;
