import * as CP from 'child_process';
import * as FS from 'fs';
import * as Path from 'path';

import {ScriptsDefinition} from '@makeflow/makescript-agent';
import rimraf from 'rimraf';
import * as villa from 'villa';

import {ExpectedError} from '../@core';
import {Config} from '../config';

import {AgentService} from './agent-service';
import {DBService} from './db-service';

const SCRIPTS_DIRECTORY_NAME = 'scripts';

const SCRIPTS_CONFIG_FILE_NAME = 'makescript.json';

export class ScriptService {
  private get scriptsPath(): string {
    return Path.join(this.config.workspace, SCRIPTS_DIRECTORY_NAME);
  }

  private get scriptsDefinitionPath(): string {
    return Path.join(this.scriptsPath, SCRIPTS_CONFIG_FILE_NAME);
  }

  get scriptsDefinition(): ScriptsDefinition {
    if (!FS.existsSync(this.scriptsDefinitionPath)) {
      throw new ExpectedError('SCRIPTS_DEFINITION_FILE_NOT_FOUND');
    }

    return JSON.parse(FS.readFileSync(this.scriptsDefinitionPath).toString());
  }

  constructor(
    private agentService: AgentService,
    private dbService: DBService,
    private config: Config,
  ) {}

  async updateScriptsRepoURL(repoURL: string): Promise<void> {
    await villa.async(rimraf)(this.scriptsPath);

    let cp = CP.spawn('git', [repoURL, this.scriptsPath]);

    await villa.awaitable(cp);

    await this.agentService.updateScriptsForAllAgents(this.scriptsPath);

    this.dbService.db.get('settings').assign({scriptsRepoURL: repoURL});
  }

  async updateScripts(): Promise<void> {
    let cp = CP.spawn('git', ['pull'], {
      cwd: this.scriptsPath,
    });

    await villa.awaitable(cp);

    await this.agentService.updateScriptsForAllAgents(this.scriptsPath);
  }
}
