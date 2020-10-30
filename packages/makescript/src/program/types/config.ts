export interface Config {
  port: number;
  externalURL: string;
  sessionSecret: string;

  makeflow: {
    address: string;
    powerApp: {
      name: string;
      displayName: string;
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
