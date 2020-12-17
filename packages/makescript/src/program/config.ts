import YAML from 'yaml';

/**
 * The config type use for app internal
 */

export interface Config {
  webAdmin: {
    host: string;
    port: number;
    url: string;
  };

  api: {
    host: string;
    port: number;
    url: string;
  };

  joinToken: string;

  makeflow: {
    baseURL: string;
    powerApp: {
      name: string;
      displayName: string;
      description: string;
    };
  };

  defaultAgent:
    | {
        scriptsRepoURL: string;
      }
    | undefined;

  resourcesPath: string;

  workspace: string;
}

/**
 * The config type use for config file
 */
export interface ConfigFile {
  'web-admin': {
    host: string;
    port: number;
    url: string;
  };

  api: {
    host: string;
    port: number;
    url: string;
  };

  makeflow: {
    'base-url': string;
    'power-app': {
      name: string;
      'display-name': string;
      description: string;
    };
  };

  'join-token': string;

  'resources-path': string;

  'default-agent'?: {
    'scripts-repo-url': string;
  };

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

    makeflow: {
      baseURL: configFile.makeflow['base-url'],
      powerApp: {
        name: configFile.makeflow['power-app'].name,
        displayName: configFile.makeflow['power-app']['display-name'],
        description: configFile.makeflow['power-app'].description,
      },
    },

    defaultAgent: configFile['default-agent']
      ? {scriptsRepoURL: configFile['default-agent']['scripts-repo-url']}
      : undefined,

    joinToken: configFile['join-token'],

    resourcesPath: configFile['resources-path'],
    workspace,
  };
}
