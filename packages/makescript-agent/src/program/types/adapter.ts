import {Dict} from 'tslang';

import {ScriptDefinition} from './script-definition';

export interface IAdapter<
  TDefinition extends ScriptDefinition,
  TOptions = AdapterRunScriptArgumentOptions
> {
  readonly type: TDefinition['type'];

  runScript(
    argument: AdapterRunScriptArgument<TDefinition, TOptions>,
  ): Promise<AdapterRunScriptResult>;
}

export interface AdapterRunScriptArgument<
  TDefinition extends ScriptDefinition,
  TOptions = AdapterRunScriptArgumentOptions
> {
  repoPath: string;
  cwd: string;
  env: Dict<unknown>;
  definition: TDefinition;
  resourcesPath: string;
  resourcesBaseURL: string;
  parameters: AdapterRunScriptArgumentParameters;
  options: TOptions;
  onOutput(output: string): void;
  onError(error: string): void;
}

export type AdapterRunScriptArgumentParameters = Dict<unknown>;

export type AdapterRunScriptArgumentOptions = Dict<unknown>;

export interface AdapterRunScriptResult {
  result: AdapterRunScriptResultType;
  message: string;
}

export type AdapterRunScriptResultType =
  | 'done'
  | 'options-error'
  | 'parameters-error'
  | 'unknown-error';
