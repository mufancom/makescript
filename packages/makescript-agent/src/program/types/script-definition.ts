import type {ProcedureField} from '@makeflow/types';

export interface ScriptsDefinition {
  scripts: ScriptDefinition[];
  initialize: string;
}

export interface ScriptDefinition {
  displayName: string;
  name: string;
  type: string;
  source: string;
  manual: boolean;
  parameters: ScriptDefinitionParameter[];
  options: ScriptDefinitionOptionsItem[];
  config: ScriptDefinitionConfig;
}

// Parameters

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
  data: unknown;
}

// Options

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
  required: boolean;
}

// Config

export interface ScriptDefinitionConfig {
  output: ScriptDefinitionConfigOutput;
}

export type ScriptDefinitionConfigOutput = 'aggregate' | 'stream' | 'cover';
