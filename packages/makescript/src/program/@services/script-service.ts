import * as CP from 'child_process';
import * as FS from 'fs';
import * as Path from 'path';

import {ScriptsDefinition} from '@makeflow/makescript-agent';
import rimraf from 'rimraf';
import * as villa from 'villa';

import {spawn} from '../@utils';
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

  get scriptsDefinition(): ScriptsDefinition | undefined {
    if (!FS.existsSync(this.scriptsDefinitionPath)) {
      return undefined;
    }

    return JSON.parse(FS.readFileSync(this.scriptsDefinitionPath).toString());
  }

  get scriptsRepoURL(): string | undefined {
    return this.dbService.db.get('settings').value().scriptsRepoURL;
  }

  constructor(
    private agentService: AgentService,
    private dbService: DBService,
    private config: Config,
  ) {}

  async updateScriptsRepoURL(repoURL: string): Promise<void> {
    await villa.async(rimraf)(this.scriptsPath);

    await spawn('git', ['clone', repoURL, this.scriptsPath], {});

    await this.dbService.db
      .get('settings')
      .assign({scriptsRepoURL: repoURL})
      .write();

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
