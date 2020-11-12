import YAML from 'yaml';

/**
 * Config type use for the app internal
 */
export interface Config {
  port: number;
  host: string;
  token: string;
  workspace: string;
}

/**
 * The config type use for config file
 */
export interface ConfigFile {
  /**
   * The port to listen on
   */
  port: number;
  /**
   * The host to listen on
   */
  host: string;
  /**
   * @uuid
   *
   * The token to authenticate
   */
  token: string;
}

export function generateYamlConfig(config: ConfigFile): string {
  // TODO: add comments
  return YAML.stringify(config);
}

export function transformConfig(config: ConfigFile, workspace: string): Config {
  return {
    port: config.port,
    host: config.host,
    token: config.token,
    workspace,
  };
}
