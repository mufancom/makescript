import {ProcedureField} from '@makeflow/types';
import {Dict} from 'tslang';

export interface IAdapter<
  TDefinition extends MakeScript.Adapter.AdapterScriptDefinition
> {
  readonly type: TDefinition['type'];

  runScript(
    argument: AdapterRunScriptArgument<TDefinition>,
  ): Promise<AdapterRunScriptResult>;
}

export interface AdapterRunScriptArgument<
  TDefinition extends MakeScript.Adapter.AdapterScriptDefinition
> {
  repoPath: string;
  cwd: string;
  env: Dict<unknown>;
  definition: TDefinition;
  resourcesPath: string;
  resourcesBaseURL: string;
  parameters: AdapterRunScriptArgumentParameters;
  onOutput(output: string): void;
  onError(error: string): void;
}

export type AdapterRunScriptArgumentParameters = Dict<unknown>;

export type AdapterRunScriptArgumentOptions = Dict<unknown>;

export interface AdapterRunScriptResult {
  ok: boolean;
  message: string;
}

export interface IScriptDefinition {
  displayName?: string;
  name: string;
  type: string;
  manual?: boolean;
  parameters?: {
    [name: string]: ScriptDefinitionParameter | true;
  };
  password?: string;
  hooks?: ScriptDefinitionHooks;
}

export interface ScriptDefinitionHooks {
  postscript?: string;
}

// Parameters

export interface ScriptDefinitionParameter {
  displayName?: string;
  required?: boolean;
  field?:
    | ProcedureField.BuiltInProcedureFieldType
    | ScriptDefinitionDetailedParameterField;
}

export interface ScriptDefinitionDetailedParameterField {
  type: ProcedureField.BuiltInProcedureFieldType;
  data?: unknown;
}

declare global {
  namespace MakeScript {
    namespace Adapter {
      interface AdapterOptionsDict {}

      type AdapterScriptDefinition = IScriptDefinition &
        {
          [TType in keyof AdapterOptionsDict]: {
            type: TType;
          } & AdapterOptionsDict[TType];
        }[keyof AdapterOptionsDict];
    }
  }
}
