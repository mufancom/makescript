import * as FS from 'fs';
import * as OS from 'os';
import * as Path from 'path';

import {Castable, Command, Options, command, metadata, option} from 'clime';
import {Tiva} from 'tiva';
import {v4 as uuidv4} from 'uuid';
import YAML from 'yaml';

import {ConfigFile, generateYamlConfig, transformConfig} from '../config';
import {main} from '../main';
import {logger} from '../shared';

const WORKSPACE_PATH_DEFAULT = Path.resolve(
  OS.homedir(),
  '.config',
  'makescript',
  'agent',
);
const GENERATE_CONFIG_DEFAULT = false;

// TODO: Type safe
const YAML_CONFIG_CONTENT_DEFAULT = (): string =>
  generateYamlConfig({
    'makescript-secret-url': '',
    'scripts-repo-url': '',
    namespace: 'makescript-agent',
    port: 8902,
    host: '0.0.0.0',
    token: uuidv4(),
    proxy: undefined,
  });

const CONFIG_FILE_NAME = 'agent.yaml';

export class CLIOptions extends Options {
  @option({
    flag: 'g',
    description: 'Whether only to generate makescript agent config file.',
    toggle: true,
    default: GENERATE_CONFIG_DEFAULT,
  })
  generateConfigOnly!: boolean;

  @option({
    flag: 'w',
    description: 'The path for makescript agent to work.',
    default: WORKSPACE_PATH_DEFAULT,
  })
  workspace!: Castable.Directory;
}

@command()
export default class extends Command {
  @metadata
  async execute({generateConfigOnly, workspace}: CLIOptions): Promise<void> {
    let configFilePath = Path.join(workspace.fullName, CONFIG_FILE_NAME);

    let configFileExists = FS.existsSync(configFilePath);

    if (configFileExists && generateConfigOnly) {
      console.warn(
        `The config file "${configFilePath}" has existed, so the new config has not generated.`,
      );
      return;
    }

    if (!configFileExists) {
      let dirname = workspace.fullName;

      if (!FS.existsSync(dirname)) {
        FS.mkdirSync(dirname);
      }

      FS.writeFileSync(configFilePath, YAML_CONFIG_CONTENT_DEFAULT());
    }

    if (generateConfigOnly) {
      return;
    }

    let yamlConfigContent = FS.readFileSync(configFilePath).toString();

    let configFileContent: ConfigFile = YAML.parse(yamlConfigContent);

    let tiva = new Tiva();

    logger.info('Checking config file ...');

    try {
      await tiva.validate(
        {module: '@makeflow/makescript-agent', type: 'ConfigFile'},
        configFileContent,
      );

      let config = transformConfig(configFileContent, workspace.fullName);

      await main(tiva, config);
    } catch (error) {
      if (error.diagnostics) {
        logger.error(
          `Config file structure does not match:\n${error.diagnostics}`,
        );
      } else {
        logger.error(`Unknown error occurred:\n${error.message}`);
      }

      process.exit(1);
    }
  }
}
