import * as Path from 'path';

import {
  Config as AgentConfig,
  ConfigFile as AgentConfigFile,
  transformConfig as transformAgentConfig,
} from '@makeflow/makescript-agent';
import YAML from 'yaml';

const DEFAULT_AGENT_DIRECTORY = 'agent';

/**
 * The config type use for app internal
 */

export interface Config {
  webAdmin: {
    host: string;
    port: number;
  };

  api: {
    host: string;
    port: number;
    url: string;
  };

  defaultAgent: AgentConfig;

  makeflow: {
    baseURL: string;
    powerApp: {
      name: string;
      displayName: string;
      description: string;
    };
  };

  agents: {
    namespace: string;
    url: string;
    token: string;
  }[];

  workspace: string;
}

/**
 * The config type use for config file
 */
export interface ConfigFile {
  'web-admin': {
    host: string;
    port: number;
  };

  api: {
    host: string;
    port: number;
    url: string;
  };

  'default-agent': AgentConfigFile;

  makeflow: {
    'base-url': string;
    'power-app': {
      name: string;
      'display-name': string;
      description: string;
    };
  };

  agents: {
    namespace: string;
    url: string;
    token: string;
  }[];

  /**
   * Not yet implemented
   */
  // adapters: {
  //   /**
  //    * @unique
  //    *
  //    * The script type to execute
  //    */
  //   type: string;
  //   /**
  //    * The node package to execute the scripts with this type
  //    */
  //   package: string;
  // }[];
}

export function generateYamlConfig(config: ConfigFile): string {
  // TODO: add comments
  return YAML.stringify(config);
}

export function transformConfig(
  configFile: ConfigFile,
  workspace: string,
): Config {
  return {
    webAdmin: configFile['web-admin'],
    api: configFile.api,

    defaultAgent: transformAgentConfig(
      configFile['default-agent'],
      Path.join(workspace, DEFAULT_AGENT_DIRECTORY),
    ),

    makeflow: {
      baseURL: configFile.makeflow['base-url'],
      powerApp: {
        name: configFile.makeflow['power-app'].name,
        displayName: configFile.makeflow['power-app']['display-name'],
        description: configFile.makeflow['power-app'].description,
      },
    },

    agents: configFile.agents,

    workspace,
  };
}
