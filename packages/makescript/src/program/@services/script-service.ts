import * as CP from 'child_process';
import * as Path from 'path';

import rimraf from 'rimraf';
import * as villa from 'villa';

import {Config} from '../config';

import {AgentService} from './agent-service';

const SCRIPTS_DIRECTORY_NAME = 'scripts';

export class ScriptService {
  private get scriptsPath(): string {
    return Path.join(this.config.workspace, SCRIPTS_DIRECTORY_NAME);
  }

  constructor(private agentService: AgentService, private config: Config) {}

  async updateScriptsRepoURL(repoURL: string): Promise<void> {
    await villa.async(rimraf)(this.scriptsPath);

    let cp = CP.spawn('git', [repoURL, this.scriptsPath]);

    await villa.awaitable(cp);

    await this.agentService.updateScriptsForAllAgents(this.scriptsPath);
  }

  async updateScripts(): Promise<void> {
    let cp = CP.spawn('git', ['pull'], {
      cwd: this.scriptsPath,
    });

    await villa.awaitable(cp);

    await this.agentService.updateScriptsForAllAgents(this.scriptsPath);
  }
}
