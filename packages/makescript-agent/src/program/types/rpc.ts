import {ScriptRunningArgumentParameters, ScriptRunningResult} from './running';
import {
  BriefScriptDefinition,
  ScriptDefinitionHooks,
} from './script-definition';

export interface IRPC {}

export interface MakescriptAgentRPCRunScriptOptions {
  id: string;
  name: string;
  parameters: ScriptRunningArgumentParameters;
  resourcesBaseURL: string;
  password: string | undefined;
}

export interface MakescriptAgentRPC extends IRPC {
  syncScripts(): Promise<void>;
  getScripts(): Promise<BriefScriptDefinition[]>;
  runScript(
    options: MakescriptAgentRPCRunScriptOptions,
  ): Promise<ScriptRunningResult>;
  triggerHook(
    scriptName: string,
    hookName: keyof ScriptDefinitionHooks,
  ): Promise<void>;
}

export interface MakescriptRPC extends IRPC {
  register(namespace: string, resume: boolean): Promise<void>;
  updateResources(id: string, buffer: Buffer): Promise<void>;
  updateOutput(id: string, output: string): Promise<void>;
}
