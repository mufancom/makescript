export interface Config extends JSONConfigFile {
  workspace: string;
}

export interface JSONConfigFile {
  host: string;
  port: number;
  url: string;

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
}
