import * as FS from 'fs';
import * as OS from 'os';
import * as Path from 'path';

import {Castable, Command, Options, command, metadata, option} from 'clime';
import prompts, {PromptObject} from 'prompts';
import {Tiva} from 'tiva';

import {JSONConfigFile} from '../config';
import {main} from '../main';
import {logger} from '../shared';

const JSON_CONFIG_INDENTATION = 2;

const DIR_DEFAULT = Path.resolve(OS.homedir(), '.makescript', 'agent');

const CONFIG_FILE_NAME = 'makescript-agent.json';

export class CLIOptions extends Options {
  @option({
    flag: 's',
    description: 'MakeScript server URL with token.',
    type: String,
  })
  serverURL: string | undefined;

  @option({
    flag: 'd',
    description:
      'Directory containing MakeScript node config file and contents.',
    default: DIR_DEFAULT,
  })
  dir!: Castable.Directory;
}

@command()
export default class extends Command {
  @metadata
  async execute({dir, serverURL}: CLIOptions): Promise<void> {
    let configFilePath = Path.join(dir.fullName, CONFIG_FILE_NAME);

    let configFileExists = FS.existsSync(configFilePath);

    if (!configFileExists) {
      let dirname = dir.fullName;

      if (!FS.existsSync(dirname)) {
        FS.mkdirSync(dirname, {recursive: true});
      }

      let answer = await initialQuestions();

      let jsonConfig: JSONConfigFile = {
        name: answer.name,
        server: {
          url: answer.serverURL,
        },
        scripts: {
          git: answer.repoURL,
          // if subPath is "", pass undefined instead.
          dir: answer.subPath || undefined,
        },
        proxy: undefined,
      };

      writeConfig(jsonConfig);
    }

    let jsonConfig = readConfig();

    if (serverURL && jsonConfig.server.url !== serverURL) {
      jsonConfig.server.url = serverURL;

      writeConfig(jsonConfig);
    }

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
        workspace: dir.fullName,
        agentModule: undefined,
      });
    } catch (error) {
      if (error.diagnostics) {
        logger.error(
          `Config file structure does not match:\n${error.diagnostics}`,
        );
      }

      throw error;
    }

    function writeConfig(config: JSONConfigFile): void {
      let jsonConfigText = JSON.stringify(
        config,
        undefined,
        JSON_CONFIG_INDENTATION,
      );

      FS.writeFileSync(configFilePath, jsonConfigText);
    }

    function readConfig(): JSONConfigFile {
      let jsonConfigText = FS.readFileSync(configFilePath).toString();

      return JSON.parse(jsonConfigText);
    }

    async function initialQuestions(): Promise<{
      serverURL: string;
      name: string;
      repoURL: string;
      subPath: string | undefined;
    }> {
      let promptObjects: PromptObject[] = [];

      if (!serverURL) {
        promptObjects.push({
          type: 'text' as const,
          name: 'serverURL',
          message: 'Please enter MakeScript server URL with token.',
          validate: value => /^https?:\/\/.+$/.test(value),
        });
      }

      promptObjects.push(
        ...([
          {
            type: 'text',
            name: 'name',
            message: 'What name do you want to register as',
          },
          {
            type: 'text',
            name: 'repoURL',
            message: 'Please enter the git repo url of the scripts',
            validate: value => /^(https?:\/\/.+)|(\w+\.git)$/.test(value),
          },
          {
            type: 'text',
            name: 'subPath',
            message:
              'Please enter the path of the scripts definition in the repo',
          },
        ] as PromptObject[]),
      );

      let answer = await prompts(promptObjects);

      // There is a bug (or unhandled behavior) with 'prompts'.
      // When user press CTRL + C , program will continue to execute with empty answers.
      // https://github.com/terkelg/prompts/issues/252
      if (
        (!serverURL && !answer.serverURL) ||
        !answer.name ||
        !answer.repoURL
      ) {
        process.exit(0);
      }

      return {
        serverURL: serverURL ?? answer.serverURL,
        name: answer.name,
        repoURL: answer.repoURL,
        subPath: answer.subPath ?? undefined,
      };
    }
  }
}
