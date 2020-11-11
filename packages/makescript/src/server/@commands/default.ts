import * as FS from 'fs';
import * as OS from 'os';
import * as Path from 'path';

import {Castable, Command, Options, command, metadata, option} from 'clime';
import ip from 'ip';
import {v4 as uuidv4} from 'uuid';
import YAML from 'yaml';

import {MakescriptConfig, generateYamlConfig} from '../config';
import {main} from '../main';

const WORKSPACE_PATH_DEFAULT = Path.resolve(
  OS.homedir(),
  '.config',
  'makescript',
);
const GENERATE_CONFIG_DEFAULT = false;

// TODO: Type safe
const YAML_CONFIG_CONTENT_DEFAULT = (): string =>
  generateYamlConfig({
    host: '0.0.0.0',
    port: 8901,
    'web-port': 8900,
    'external-url': `${ip.address}:8901`,
    'cookie-password': uuidv4(),

    'default-agent': {
      port: 8902,
      host: 'localhost',
      token: uuidv4(),
    },
  });

const CONFIG_FILE_NAME = 'makescript.yaml';

export class CLIOptions extends Options {
  @option({
    flag: 'g',
    description: 'Whether only to generate makescript config file.',
    toggle: true,
    default: GENERATE_CONFIG_DEFAULT,
  })
  generateConfigOnly!: boolean;

  @option({
    flag: 'w',
    description: 'The path for makescript to work.',
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

    let config: MakescriptConfig = YAML.parse(yamlConfigContent);

    // TODO:
    // let tiva = new Tiva();

    // await tiva.validate(
    //   {module: '@makeflow/makescript', type: 'MakescriptAgentConfig'},
    //   config,
    // );

    await main(config, workspace.fullName);
  }
}
