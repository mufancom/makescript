import * as CP from 'child_process';
import * as FS from 'fs';
import * as Path from 'path';

import {Tiva} from 'tiva';
import * as villa from 'villa';

import {Config} from '../config';
import {logger} from '../shared';
import {ScriptDefinition, ScriptsDefinition} from '../types';

const SCRIPTS_DIRECTORY_NAME = 'scripts';
const SCRIPTS_CONFIG_FILE_NAME_JSON = 'makescript.json';

export class ScriptService {
  readonly ready: Promise<void>;

  private _scriptsDefinition: ScriptsDefinition | undefined;

  private get scriptsPath(): string {
    return Path.join(this.config.workspace, SCRIPTS_DIRECTORY_NAME);
  }

  private get scriptsDefinitionPath(): string {
    return Path.join(this.scriptsPath, SCRIPTS_CONFIG_FILE_NAME_JSON);
  }

  get scriptsDefinition(): ScriptsDefinition | undefined {
    return this._scriptsDefinition;
  }

  constructor(private tiva: Tiva, private config: Config) {
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

    let scriptsDefinition = await this.parseScriptsDefinition();

    this._scriptsDefinition = scriptsDefinition;

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

  private async parseScriptsDefinition(): Promise<ScriptsDefinition> {
    if (!FS.existsSync(this.scriptsPath)) {
      throw new Error(`Scripts repo not cloned`);
    }

    if (!FS.existsSync(this.scriptsDefinitionPath)) {
      throw new Error(
        'Scripts definition not found: \n' +
          `please ensure the definition file "${SCRIPTS_CONFIG_FILE_NAME_JSON}" is existing in scripts repo.`,
      );
    }

    logger.info('Checking scripts definition file ...');

    let scriptsDefinitionBuffer = await villa.async(FS.readFile)(
      this.scriptsDefinitionPath,
    );
    let scriptsDefinitionContent = scriptsDefinitionBuffer.toString();

    let parsedDefinition = JSON.parse(scriptsDefinitionContent);

    try {
      await this.tiva.validate(
        {
          module: '@makeflow/makescript-agent',
          type: 'ScriptsDefinition',
        },
        parsedDefinition,
      );
    } catch (error) {
      if (error.diagnostics) {
        logger.error(
          `The structure of the scripts definition file "${this.scriptsDefinitionPath}" not matched: \n` +
            `    ${error.diagnostics}`,
        );
        process.exit(1);
      } else {
        throw error;
      }
    }

    return parsedDefinition;
  }
}
