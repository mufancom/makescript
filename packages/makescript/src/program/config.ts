export interface Config extends JSONConfigFile {
  workspace: string;
}

export interface JSONConfigFile {
  url: string;

  listen: {
    host: string;
    port: number;
  };

  agent: {
    token: string;
  };

  makeflow: {
    url: string;
    powerApp: {
      name: string;
      displayName: string;
      description: string;
    };
  };
}
