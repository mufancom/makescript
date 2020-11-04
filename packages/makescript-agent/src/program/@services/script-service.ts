import * as CP from 'child_process';
import * as FS from 'fs';
import * as Path from 'path';

import extractZip from 'extract-zip';
import rimraf from 'rimraf';
import * as villa from 'villa';

import {Config} from '../@config';
import {ScriptDefinition, ScriptsDefinition, ScriptsSyncResult} from '../types';

const SCRIPTS_DIRECTORY_NAME = 'scripts';
const SCRIPTS_CONFIG_FILE_NAME = 'makescript.json';

export class ScriptService {
  private scriptsDefinition: ScriptsDefinition | undefined;

  private get scriptsPath(): string {
    return Path.join(this.config.workspace, SCRIPTS_DIRECTORY_NAME);
  }

  private get scriptsDefinitionPath(): string {
    return Path.join(this.scriptsPath, SCRIPTS_CONFIG_FILE_NAME);
  }

  constructor(private config: Config) {
    try {
      if (FS.existsSync(this.scriptsDefinitionPath)) {
        this.scriptsDefinition = JSON.parse(
          FS.readFileSync(this.scriptsDefinitionPath).toString(),
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  async syncScripts(temporaryFilePath: string): Promise<ScriptsSyncResult> {
    try {
      await villa.async(rimraf)(this.scriptsPath);

      await extractZip(temporaryFilePath, {dir: this.scriptsPath});

      await villa.async(rimraf)(temporaryFilePath);
    } catch (error) {
      return {result: 'unzip-failed', message: error.message ?? String(error)};
    }

    if (!FS.existsSync(this.scriptsDefinitionPath)) {
      return {result: 'scripts-definition-not-found', message: ''};
    }

    let scriptsDefinition: ScriptsDefinition;

    try {
      scriptsDefinition = JSON.parse(
        FS.readFileSync(this.scriptsDefinitionPath).toString(),
      );
    } catch (error) {
      return {
        result: 'scripts-definition-parse-error',
        message: error.message ?? String(error),
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
    return Path.join(this.config.workspace, script.source);
  }
}
