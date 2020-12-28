import {
  ScriptDefinitionHooks,
  ScriptDefinitionParameter,
} from '../@adapters/adapter';

export interface BriefScriptDefinition {
  displayName: string;
  name: string;
  type: string;
  manual: boolean;
  parameters: {
    [name: string]: ScriptDefinitionParameter | true;
  };
  needsPassword: boolean;
  hooks: {
    [TKey in keyof Required<ScriptDefinitionHooks>]: boolean;
  };
}

export interface ScriptsDefinition {
  scripts: MakeScript.Adapter.AdapterScriptDefinition[];
  password?: string;
  hooks?: ScriptsDefinitionHooks;
}

export interface ScriptsDefinitionHooks extends ScriptDefinitionHooks {
  install: string;
}
