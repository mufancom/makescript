import type {ProcedureField} from '@makeflow/types';
import {Dict} from 'tslang';

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
  // TODO: Add version for migration
  scripts: ScriptDefinition[];
  passwordHash?: string;
  hooks?: ScriptsDefinitionHooks;
}

export interface ScriptsDefinitionHooks extends ScriptDefinitionHooks {
  install: string;
}

export interface IScriptDefinition {
  displayName: string;
  name: string;
  type: string;
  manual?: boolean;
  parameters?: ScriptDefinitionParameter[];
  options?: Dict<ScriptDefinitionOptionsItem>;
  passwordHash?: string;
  hooks?: ScriptDefinitionHooks;
}

export type ScriptDefinition =
  | NodeScriptDefinition
  | ProcessScriptDefinition
  | ShellScriptDefinition
  | SQLITEScriptDefinition;

export interface NodeScriptDefinition extends IScriptDefinition {
  type: 'node';
  module: string;
}

export interface ProcessScriptDefinition extends IScriptDefinition {
  type: 'process';
  command: string;
}

export interface ShellScriptDefinition extends IScriptDefinition {
  type: 'shell';
  command: string;
}

export interface SQLITEScriptDefinition extends IScriptDefinition {
  type: 'sqlite';
  file: string;
  options: {
    path: ScriptDefinitionOptionsItem;
    password: ScriptDefinitionOptionsItem;
  };
}

// Hooks

export interface ScriptDefinitionHooks {
  postscript?: string;
}

// Parameters

// TODO: Compatible for dict
export type ScriptDefinitionParameter =
  | ScriptDefinitionDetailedParameter
  | string;

export interface ScriptDefinitionDetailedParameter {
  name: string;
  displayName: string;
  required?: boolean;
  field?:
    | ProcedureField.BuiltInProcedureFieldType
    | ScriptDefinitionDetailedParameterField;
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
  type: 'value';
  value: unknown;
}

export interface ScriptDefinitionOptionsEnvItem {
  type: 'env';
  env: string;
  required?: boolean;
}
