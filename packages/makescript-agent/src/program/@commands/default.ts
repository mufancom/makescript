import * as FS from 'fs';
import * as OS from 'os';
import * as Path from 'path';

import {Castable, Command, Options, command, metadata, option} from 'clime';
import prompts, {PromptObject} from 'prompts';
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
    flag: 'l',
    description: 'The makescript host join link.',
    // TODO: It will throw an error if this is not pass
    type: Castable.CommaSeparatedStrings,
  })
  joinLink: Castable.CommaSeparatedStrings | undefined;

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
  async execute({
    generateConfigOnly,
    workspace,
    joinLink: [joinLink] = [],
  }: CLIOptions): Promise<void> {
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

      let answer = await initialQuestions();

      let jsonConfig: JSONConfigFile = {
        makescriptJoinLink: answer.joinLink,
        scriptsRepoURL: answer.repoURL,
        // if subPath is "", pass undefined instead.
        scriptsSubPath: answer.subPath || undefined,
        namespace: answer.namespace,
        proxy: undefined,
      };

      writeConfig(jsonConfig);
    }

    if (generateConfigOnly) {
      return;
    }

    let jsonConfig = readConfig();

    if (joinLink && jsonConfig.makescriptJoinLink !== joinLink) {
      jsonConfig.makescriptJoinLink = joinLink;

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

    function writeConfig(config: JSONConfigFile): void {
      let jsonConfigText = JSON.stringify(config);

      FS.writeFileSync(configFilePath, jsonConfigText);
    }

    function readConfig(): JSONConfigFile {
      let jsonConfigText = FS.readFileSync(configFilePath).toString();

      return JSON.parse(jsonConfigText);
    }

    async function initialQuestions(): Promise<{
      joinLink: string;
      namespace: string;
      repoURL: string;
      subPath: string | undefined;
    }> {
      let promptObjects: PromptObject[] = [];

      if (!joinLink) {
        promptObjects.push({
          type: 'text' as const,
          name: 'joinLink',
          message: 'Please enter the makescript host join link',
          validate: value => /^https?:\/\/.+$/.test(value),
        });
      }

      promptObjects.push(
        ...([
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
        (!joinLink && !answer.joinLink) ||
        !answer.namespace ||
        !answer.repoURL
      ) {
        process.exit(0);
      }

      return {
        joinLink: joinLink ?? answer.joinLink,
        namespace: answer.namespace,
        repoURL: answer.repoURL,
        subPath: answer.subPath ?? undefined,
      };
    }
  }
}
