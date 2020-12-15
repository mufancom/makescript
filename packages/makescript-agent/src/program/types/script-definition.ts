import type {ProcedureField} from '@makeflow/types';

export interface BriefScriptDefinition {
  displayName: string;
  name: string;
  type: string;
  manual: boolean;
  parameters: ScriptDefinitionParameter[];
  needsPassword: boolean;
  hooks: {
    [TKey in keyof Required<ScriptDefinitionHooks>]: boolean;
  };
}

export interface ScriptsDefinition {
  scripts: ScriptDefinition[];
  initialize?: string;
  passwordHash?: string;
  hooks?: ScriptDefinitionHooks;
}

export interface ScriptDefinition {
  displayName: string;
  name: string;
  type: string;
  source: string;
  manual?: boolean;
  parameters?: ScriptDefinitionParameter[];
  options?: ScriptDefinitionOptionsItem[];
  passwordHash?: string;
  hooks?: ScriptDefinitionHooks;
}

// Hooks

export interface ScriptDefinitionHooks {
  postTrigger?: string;
}

// Parameters

// TODO: Compatible for dict
export type ScriptDefinitionParameter =
  | ScriptDefinitionDetailedParameter
  | string;

export interface ScriptDefinitionDetailedParameter {
  name: string;
  displayName: string;
  required: boolean;
  field?: ScriptDefinitionDetailedParameterField;
}

export interface ScriptDefinitionDetailedParameterField {
  type: ProcedureField.BuiltInProcedureFieldType;
  data?: unknown;
}

// Options

// TODO: Update to dict
export type ScriptDefinitionOptionsItem =
  | ScriptDefinitionOptionsValueItem
  | ScriptDefinitionOptionsEnvItem;

export interface ScriptDefinitionOptionsValueItem {
  name: string;
  type: 'value';
  value: unknown;
}

export interface ScriptDefinitionOptionsEnvItem {
  name: string;
  type: 'env';
  env: string;
  required?: boolean;
}
