import * as FS from 'fs';
import * as OS from 'os';
import * as Path from 'path';

import {Castable, Command, Options, command, metadata, option} from 'clime';
import YAML from 'yaml';

import {Config} from '../config';
import {main} from '../main';

const CONFIG_PATH_DEFAULT = Path.resolve(
  OS.homedir(),
  '.config',
  'makescript',
  'makescript.yaml',
);
const GENERATE_CONFIG_DEFAULT = false;

// TODO: Type safe
const YAML_CONFIG_CONTENT_DEFAULT = `# Config for makescript

# The port to listen on
port: 8902

# The interface host to listen on
host: 0.0.0.0
`;

export class CLIOptions extends Options {
  @option({
    flag: 'g',
    description: 'Whether only to generate makescript config file.',
    toggle: true,
    default: GENERATE_CONFIG_DEFAULT,
  })
  generateConfigOnly!: boolean;

  @option({
    flag: 'c',
    description: 'The path of makescript config.',
    default: CONFIG_PATH_DEFAULT,
  })
  configPath!: Castable.File;
}

@command()
export default class extends Command {
  @metadata
  async execute({generateConfigOnly, configPath}: CLIOptions): Promise<void> {
    let fileExists = await configPath.exists();

    if (fileExists && generateConfigOnly) {
      console.warn(
        `The config file "${configPath.fullName}" has existed, so the new config has not generated.`,
      );
      return;
    }

    if (!fileExists) {
      let dirname = Path.dirname(configPath.fullName);

      if (!FS.existsSync(dirname)) {
        FS.mkdirSync(dirname);
      }

      FS.writeFileSync(configPath.fullName, YAML_CONFIG_CONTENT_DEFAULT);
    }

    if (generateConfigOnly) {
      return;
    }

    let yamlConfigContent = await configPath.text();

    let config: Config = YAML.parse(yamlConfigContent);

    await main(config);
  }
}
