import {Dict} from 'tslang';

export interface IAdapter<TOptions = AdapterRunScriptArgumentOptions> {
  runScript(
    argument: AdapterRunScriptArgument<TOptions>,
  ): Promise<AdapterRunScriptResult>;
}

export interface AdapterRunScriptArgument<
  TOptions = AdapterRunScriptArgumentOptions
> {
  source: string;
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