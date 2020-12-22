import * as CP from 'child_process';
import * as FS from 'fs';
import * as Path from 'path';

import rimraf from 'rimraf';
import {Tiva} from 'tiva';
import {Dict} from 'tslang';
import * as villa from 'villa';

import {Config} from '../config';
import {logger} from '../shared';
import {
  BriefScriptDefinition,
  ScriptDefinition,
  ScriptsDefinition,
} from '../types';

const SCRIPTS_DIRECTORY_NAME = 'scripts';
const SCRIPTS_CONFIG_FILE_NAME_JSON = 'makescript.json';

const AGENT_MODULE_DEFAULT = './types';

export class ScriptService {
  readonly ready: Promise<void>;

  private scriptsDefinition: ScriptsDefinition | undefined;

  get scriptsPath(): string {
    return Path.join(this.config.workspace, SCRIPTS_DIRECTORY_NAME);
  }

  private get scriptsDefinitionPath(): string {
    return Path.join(this.scriptsPath, SCRIPTS_CONFIG_FILE_NAME_JSON);
  }

  get briefScriptDefinitions(): BriefScriptDefinition[] {
    let scriptsDefinition = this.scriptsDefinition;

    if (!scriptsDefinition) {
      return [];
    }

    return scriptsDefinition.scripts.map(scriptDefinition =>
      convertScriptDefinitionToBriefScriptDefinition(
        fillScriptDefinitionDefaultValue(scriptDefinition, scriptsDefinition!),
      ),
    );
  }

  constructor(private tiva: Tiva, private config: Config) {
    this.ready = this.initialize();
  }

  async syncScripts(): Promise<void> {
    logger.info('Syncing scripts ...');

    try {
      if (FS.existsSync(this.scriptsPath)) {
        let cp = CP.spawn('git', ['remote', 'get-url', 'origin'], {
          cwd: this.scriptsPath,
        });

        let remoteURL = '';

        cp.stdout.on('data', (buffer: Buffer) => {
          remoteURL += buffer.toString();
        });

        await villa.awaitable(cp);

        if (remoteURL.trim() !== this.config.scriptsRepoURL.trim()) {
          logger.info(
            'Scripts repo url changed, start to sync from the new url',
          );

          await villa.call(rimraf, this.scriptsPath);

          await villa.awaitable(
            CP.spawn('git', [
              'clone',
              this.config.scriptsRepoURL,
              this.scriptsPath,
            ]),
          );
        } else {
          await villa.awaitable(
            CP.spawn('git', ['pull'], {
              cwd: this.scriptsPath,
            }),
          );
        }
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

    this.scriptsDefinition = scriptsDefinition;

    if (scriptsDefinition.hooks?.install) {
      try {
        logger.info('Initializing scripts ...');

        await villa.awaitable(
          CP.exec(scriptsDefinition.hooks.install, {
            cwd: this.scriptsPath,
          }),
        );
      } catch (error) {
        throw new Error(
          `Cannot to initial script repo with \`${scriptsDefinition.hooks.install}\`: ${error.message}`,
        );
      }
    }

    logger.info('Scripts initialized');
  }

  getDefaultValueFilledScriptDefinitionByName(
    name: string,
  ): ScriptDefinition | undefined {
    let scriptsDefinition = this.scriptsDefinition;

    if (!scriptsDefinition) {
      return;
    }

    let definition = scriptsDefinition.scripts.find(
      definition => definition.name === name,
    );

    if (!definition) {
      return undefined;
    }

    return fillScriptDefinitionDefaultValue(definition, scriptsDefinition);
  }

  resolveSource(script: ScriptDefinition): string {
    return Path.join(this.scriptsPath, script.source);
  }

  getEnvByScriptName(scriptName: string): Dict<string> {
    return {
      SCRIPT_NAME: scriptName,
      NAMESPACE: this.config.namespace,
    };
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
          module: this.config.agentModule ?? AGENT_MODULE_DEFAULT,
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

    logger.info('The scripts definition file is correct');

    return parsedDefinition;
  }
}

function fillScriptDefinitionDefaultValue(
  definition: ScriptDefinition,
  scriptsDefinition: ScriptsDefinition,
): ScriptDefinition {
  return {
    ...definition,
    passwordHash: definition.passwordHash ?? scriptsDefinition.passwordHash,
    manual: definition.manual === true,
    hooks: {
      ...scriptsDefinition.hooks,
      ...definition.hooks,
    },
  };
}

function convertScriptDefinitionToBriefScriptDefinition(
  definition: ScriptDefinition,
): BriefScriptDefinition {
  return {
    displayName: definition.displayName,
    name: definition.name,
    type: definition.type,
    manual: definition.manual === true,
    parameters: definition.parameters ?? [],
    needsPassword: !!definition.passwordHash,
    hooks: {
      postscript: !!definition.hooks?.postscript,
    },
  };
}
