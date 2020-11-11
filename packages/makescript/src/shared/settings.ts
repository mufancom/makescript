export interface Settings {
  makeflow: {
    baseUrl: string;
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
    url: string;
    token: string;
  }[];
}
