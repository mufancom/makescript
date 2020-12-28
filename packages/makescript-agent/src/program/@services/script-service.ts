import * as CP from 'child_process';
import * as FS from 'fs';
import * as Path from 'path';

import rimraf from 'rimraf';
import {Tiva} from 'tiva';
import {Dict} from 'tslang';
import * as villa from 'villa';

import {Config} from '../config';
import {logger} from '../shared';
import {BriefScriptDefinition, ScriptsDefinition} from '../types';

const SCRIPTS_DIRECTORY_NAME = 'scripts';
const SCRIPTS_CONFIG_FILE_NAME_JSON = 'makescript.json';
const SCRIPTS_CONFIG_FILE_NAME_JS = 'makescript.js';

const AGENT_MODULE_DEFAULT = './types';

export class ScriptService {
  readonly ready: Promise<void>;

  private scriptsDefinition: ScriptsDefinition | undefined;

  get scriptsBasePath(): string {
    return Path.join(this.config.workspace, SCRIPTS_DIRECTORY_NAME);
  }

  get scriptsPath(): string {
    let scriptsBasePath = this.scriptsBasePath;
    let scriptsSubPath = this.config.scripts.dir;

    return scriptsSubPath
      ? Path.join(scriptsBasePath, scriptsSubPath)
      : scriptsBasePath;
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
      if (FS.existsSync(this.scriptsBasePath)) {
        let cp = CP.spawn('git', ['remote', 'get-url', 'origin'], {
          cwd: this.scriptsBasePath,
        });

        let remoteURL = '';

        cp.stdout.on('data', (buffer: Buffer) => {
          remoteURL += buffer.toString();
        });

        await villa.awaitable(cp);

        if (remoteURL.trim() !== this.config.scripts.git.trim()) {
          logger.info(
            'Scripts repo url changed, start to sync from the new url',
          );

          await villa.call(rimraf, this.scriptsBasePath);

          await villa.awaitable(
            CP.spawn('git', [
              'clone',
              this.config.scripts.git,
              this.scriptsBasePath,
            ]),
          );
        } else {
          await villa.awaitable(
            CP.spawn('git', ['pull'], {
              cwd: this.scriptsBasePath,
            }),
          );
        }
      } else {
        await villa.awaitable(
          CP.spawn('git', [
            'clone',
            this.config.scripts.git,
            this.scriptsBasePath,
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
            cwd: this.scriptsBasePath,
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
  ): MakeScript.Adapter.AdapterScriptDefinition | undefined {
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

  getEnvByScriptName(scriptName: string): Dict<string> {
    return {
      SCRIPT_NAME: scriptName,
      NAMESPACE: this.config.name,
    };
  }

  private async initialize(): Promise<void> {
    await this.syncScripts();
  }

  private async parseScriptsDefinition(): Promise<ScriptsDefinition> {
    let scriptsPath = this.scriptsPath;

    if (!FS.existsSync(this.scriptsBasePath)) {
      throw new Error(`Scripts repo not cloned`);
    }

    let jsonScriptsDefinitionPath = Path.join(
      scriptsPath,
      SCRIPTS_CONFIG_FILE_NAME_JSON,
    );
    let jsScriptsDefinitionPath = Path.join(
      scriptsPath,
      SCRIPTS_CONFIG_FILE_NAME_JS,
    );

    let existingScriptsDefinitionPath: string | undefined;

    if (FS.existsSync(jsScriptsDefinitionPath)) {
      existingScriptsDefinitionPath = jsScriptsDefinitionPath;
    } else if (FS.existsSync(jsonScriptsDefinitionPath)) {
      existingScriptsDefinitionPath = jsonScriptsDefinitionPath;
    }

    if (!existingScriptsDefinitionPath) {
      throw new Error(
        'Scripts definition not found: \n' +
          `please ensure the definition file "${SCRIPTS_CONFIG_FILE_NAME_JSON}" or "${SCRIPTS_CONFIG_FILE_NAME_JS}" is existing in scripts repo.`,
      );
    }

    logger.info('Checking scripts definition file ...');

    let {default: definition} = await import(existingScriptsDefinitionPath);

    try {
      await this.tiva.validate(
        {
          module: this.config.agentModule ?? AGENT_MODULE_DEFAULT,
          type: 'ScriptsDefinition',
        },
        definition,
      );
    } catch (error) {
      if (error.diagnostics) {
        logger.error(
          `The structure of the scripts definition file not matched: \n` +
            `    ${error.diagnostics}`,
        );
        process.exit(1);
      } else {
        throw error;
      }
    }

    logger.info('The scripts definition file is correct');

    return definition;
  }
}

function fillScriptDefinitionDefaultValue(
  definition: MakeScript.Adapter.AdapterScriptDefinition,
  scriptsDefinition: ScriptsDefinition,
): MakeScript.Adapter.AdapterScriptDefinition {
  return {
    ...definition,
    password: definition.password ?? scriptsDefinition.password,
    manual: definition.manual === true,
    hooks: {
      ...scriptsDefinition.hooks,
      ...definition.hooks,
    },
  };
}

function convertScriptDefinitionToBriefScriptDefinition(
  definition: MakeScript.Adapter.AdapterScriptDefinition,
): BriefScriptDefinition {
  return {
    displayName: definition.displayName ?? definition.name,
    name: definition.name,
    type: definition.type,
    manual: definition.manual === true,
    parameters: definition.parameters ?? {},
    needsPassword: !!definition.password,
    hooks: {
      postscript: !!definition.hooks?.postscript,
    },
  };
}
