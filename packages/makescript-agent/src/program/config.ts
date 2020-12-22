/**
 * Config type use for the app internal
 */
export interface Config extends JSONConfigFile {
  /**
   * Makescript agent module name, be used for type validation.
   * Usually its value should be "@makeflow/makescript-agent".
   */
  agentModule: string | undefined;
  workspace: string;
}

export interface JSONConfigFile {
  makescriptSecretURL: string;
  scriptsRepoURL: string;
  namespace: string;
  proxy?: {
    url: string;
    username: string;
    password: string;
  };
}
