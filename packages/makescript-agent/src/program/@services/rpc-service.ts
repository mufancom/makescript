import {bridgeRPC} from '../shared';
import {
  MakescriptAgentRPC,
  MakescriptAgentRPCRunScriptOptions,
  ScriptDefinition,
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
    bridgeRPC(this, this.socketService.socket);
  }

  async syncScripts(): Promise<void> {
    await this.scriptService.syncScripts();
  }

  async getScripts(): Promise<ScriptDefinition[]> {
    return this.scriptService.scriptsDefinition?.scripts ?? [];
  }

  async runScript({
    id,
    name,
    parameters,
    resourcesBaseURL,
  }: MakescriptAgentRPCRunScriptOptions): Promise<ScriptRunningResult> {
    return this.runningService.runScript({
      id,
      name,
      parameters,
      resourcesBaseURL,
    });
  }
}
