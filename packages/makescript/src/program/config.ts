import {Config as AgentConfig} from '@makeflow/makescript-agent';

export interface Config {
  /**
   * The port to listen for API
   */
  port: number;
  /**
   * The port to listen for administration web client
   */
  'web-port': number;
  'external-url': string;
  'session-secret': string;
  /**
   * The path for storing data
   */
  workspace: string;

  'default-agent': AgentConfig;

  makeflow: {
    address: string;
    'power-app': {
      name: string;
      'display-name': string;
      description: string;
    };
  };

  mail: {
    host: string;
    port: number;
    username: string;
    password: string;
  };

  agents: {
    address: string;
    token: string;
  }[];

  /**
   * Not yet implemented
   */
  adapters: {
    /**
     * @unique
     *
     * The script type to execute
     */
    type: string;
    /**
     * The node package to execute the scripts with this type
     */
    package: string;
  }[];
}
