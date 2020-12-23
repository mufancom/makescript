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
  makescript: {
    joinLink: string;
    namespace: string;
  };
  scripts: {
    repoURL: string;
    // TODO: use `| undefined`
    path?: string;
  };
  // TODO: use `| undefined`
  proxy?: {
    url: string;
    username: string;
    password: string;
  };
}
