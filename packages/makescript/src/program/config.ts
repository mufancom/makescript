import {MakescriptAgentConfig} from '@makeflow/makescript-agent';
import YAML from 'yaml';

/**
 * The config type use for config file
 */
export interface MakescriptConfig {
  /**
   * The host ot listen on
   */
  host: string;

  /**
   * The port to listen for API
   */
  port: number;
  /**
   * The port to listen for administration web client
   */
  'web-port': number;
  'external-url': string;
  'cookie-password': string;

  'default-agent': MakescriptAgentConfig;

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

export function generateYamlConfig(config: MakescriptConfig): string {
  // TODO: add comments
  return YAML.stringify(config);
}
