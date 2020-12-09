import * as CP from 'child_process';
import * as FS from 'fs';
import * as Path from 'path';

import * as villa from 'villa';

import {Config} from '../config';
import {ScriptDefinition, ScriptsDefinition, ScriptsSyncResult} from '../types';

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

  async syncScripts(): Promise<ScriptsSyncResult> {
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
      return {result: 'unzip-failed', message: error.message ?? String(error)};
    }

    if (!FS.existsSync(this.scriptsDefinitionPath)) {
      return {result: 'scripts-definition-not-found', message: ''};
    }

    let scriptsDefinition = this.scriptsDefinition;

    if (!scriptsDefinition) {
      return {
        result: 'scripts-definition-parse-error',
        message: '',
      };
    }

    try {
      await villa.awaitable(CP.spawn(scriptsDefinition.initialize));
    } catch (error) {
      return {
        result: 'initialize-failed',
        message: error.message ?? String(error),
      };
    }

    return {result: 'done', message: ''};
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
