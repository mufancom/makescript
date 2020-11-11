import YAML from 'yaml';

/**
 * The config type use for config file
 */
export interface MakescriptAgentConfig {
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

export function generateYamlConfig(config: MakescriptAgentConfig): string {
  // TODO: add comments
  return YAML.stringify(config);
}
