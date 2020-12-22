import * as FS from 'fs';
import * as OS from 'os';
import * as Path from 'path';

import {Castable, Command, Options, command, metadata, option} from 'clime';
import prompts from 'prompts';
import {Tiva} from 'tiva';

import {JSONConfigFile} from '../config';
import {main} from '../main';
import {logger} from '../shared';

const WORKSPACE_PATH_DEFAULT = Path.resolve(
  OS.homedir(),
  '.config',
  'makescript',
  'agent',
);
const GENERATE_CONFIG_DEFAULT = false;

const CONFIG_FILE_NAME = 'agent.json';

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
        FS.mkdirSync(dirname, {recursive: true});
      }

      let answer = await prompts([
        {
          type: 'text',
          name: 'hostURL',
          message: 'Please enter the makescript host secret url to join',
          validate: value => /^https?:\/\/.+$/.test(value),
        },
        {
          type: 'text',
          name: 'namespace',
          message: 'What namespace do you want to register as',
        },
        {
          type: 'text',
          name: 'repoURL',
          message: 'Please enter the git repo url of the scripts',
          validate: value => /^(https?:\/\/.+)|(\w+\.git)$/.test(value),
        },
      ]);

      // There is a bug (or unhandled behavior) with 'prompts'.
      // When user press CTRL + C , program will continue to execute with empty answers.
      // https://github.com/terkelg/prompts/issues/252
      if (!answer.hostURL || !answer.namespace || !answer.repoURL) {
        return;
      }

      let jsonConfig: JSONConfigFile = {
        makescriptSecretURL: answer.hostURL,
        scriptsRepoURL: answer.repoURL,
        namespace: answer.namespace,
        proxy: undefined,
      };

      let jsonConfigText = JSON.stringify(jsonConfig);

      FS.writeFileSync(configFilePath, jsonConfigText);
    }

    if (generateConfigOnly) {
      return;
    }

    let jsonConfigText = FS.readFileSync(configFilePath).toString();

    let jsonConfig: JSONConfigFile = JSON.parse(jsonConfigText);

    let tiva = new Tiva({
      project: Path.join(__dirname, '../../../src/program'),
    });

    logger.info('Checking config file ...');

    try {
      await tiva.validate(
        {
          module: './config',
          type: 'JSONConfigFile',
        },
        jsonConfig,
      );

      await main(tiva, {
        ...jsonConfig,
        workspace: workspace.fullName,
        agentModule: undefined,
      });
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
