import {ScriptRunningArgumentParameters, ScriptRunningResult} from './running';
import {ScriptDefinition} from './script-definition';

export interface IRPC {}

export interface MakescriptAgentRPCRunScriptOptions {
  id: string;
  name: string;
  parameters: ScriptRunningArgumentParameters;
  resourcesBaseURL: string;
}

export interface MakescriptAgentRPC extends IRPC {
  syncScripts(): Promise<void>;
  getScripts(): Promise<ScriptDefinition[]>;
  runScript(
    options: MakescriptAgentRPCRunScriptOptions,
  ): Promise<ScriptRunningResult>;
}

export interface MakescriptRPC extends IRPC {
  register(namespace: string, resume: boolean): Promise<void>;
  updateResources(id: string, buffer: Buffer): Promise<void>;
  updateOutput(id: string, output: string): Promise<void>;
}
