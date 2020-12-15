import {bridgeRPC, logger} from '../shared';
import {
  BriefScriptDefinition,
  MakescriptAgentRPC,
  MakescriptAgentRPCRunScriptOptions,
  ScriptDefinitionHooks,
  ScriptRunningResult,
} from '../types';

import {RunningService} from './running-service';
import {ScriptService} from './script-service';
import {SocketService} from './socket-service';

export class RPCService implements MakescriptAgentRPC {
  constructor(
    private runningService: RunningService,
    private scriptService: ScriptService,
    private socketService: SocketService,
  ) {}

  up(): void {
    bridgeRPC(this, this.socketService.socket, logger);
  }

  async syncScripts(): Promise<void> {
    await this.scriptService.syncScripts();
  }

  async getScripts(): Promise<BriefScriptDefinition[]> {
    return this.scriptService.briefScriptDefinitions;
  }

  async runScript({
    id,
    name,
    parameters,
    resourcesBaseURL,
    password,
  }: MakescriptAgentRPCRunScriptOptions): Promise<ScriptRunningResult> {
    return this.runningService.runScript({
      id,
      name,
      parameters,
      resourcesBaseURL,
      password,
    });
  }

  async triggerHook(
    scriptName: string,
    hookName: keyof ScriptDefinitionHooks,
  ): Promise<void> {
    await this.runningService.triggerHook(scriptName, hookName);
  }
}
