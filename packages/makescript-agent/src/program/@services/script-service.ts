import * as CP from 'child_process';
import * as FS from 'fs';
import * as Path from 'path';

import * as villa from 'villa';

import {Config} from '../config';
import {logger} from '../shared';
import {ScriptDefinition, ScriptsDefinition} from '../types';

const SCRIPTS_DIRECTORY_NAME = 'scripts';
const SCRIPTS_CONFIG_FILE_NAME = 'makescript.json';

export class ScriptService {
  readonly ready: Promise<void>;

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

    try {
      return JSON.parse(FS.readFileSync(this.scriptsDefinitionPath).toString());
    } catch {}

    return undefined;
  }

  constructor(private config: Config) {
    this.ready = this.initialize();
  }

  async syncScripts(): Promise<void> {
    logger.info('Syncing scripts ...');

    try {
      if (FS.existsSync(this.scriptsPath)) {
        await villa.awaitable(
          CP.spawn('git', ['pull'], {
            cwd: this.scriptsPath,
          }),
        );
      } else {
        await villa.awaitable(
          CP.spawn('git', [
            'clone',
            this.config.scriptsRepoURL,
            this.scriptsPath,
          ]),
        );
      }
    } catch (error) {
      throw new Error(`Failed to sync scripts: ${error.message}`);
    }

    if (!FS.existsSync(this.scriptsDefinitionPath)) {
      throw new Error(
        `Scripts definition not found in scripts repo "${this.config.scriptsRepoURL}"`,
      );
    }

    let scriptsDefinition = this.scriptsDefinition;

    if (!scriptsDefinition) {
      throw new Error(`Cannot to parse scripts definition`);
    }

    if (scriptsDefinition.initialize) {
      try {
        await villa.awaitable(CP.spawn(scriptsDefinition.initialize));
      } catch (error) {
        throw new Error(
          `Cannot to initial script repo with \`${scriptsDefinition.initialize}\`: ${error.message}`,
        );
      }
    }
  }

  getScriptDefinitionByName(name: string): ScriptDefinition | undefined {
    return this.scriptsDefinition?.scripts.find(
      definition => definition.name === name,
    );
  }

  resolveSource(script: ScriptDefinition): string {
    return Path.join(this.config.workspace, 'scripts', script.source);
  }

  private async initialize(): Promise<void> {
    await this.syncScripts();
  }
}
