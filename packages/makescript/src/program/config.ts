export interface Config extends JSONConfigFile {
  workspace: string;
}

export interface JSONConfigFile {
  /**
   * 可让外部访问到的地址，默认为 http://localhost:8900
   */
  url: string;

  listen: {
    /**
     * MakeScript 服务监听到的 host，默认为 localhost
     */
    host: string;
    /**
     * MakeScript 服务监听到的端口，默认为 8900
     */
    port: number;
  };

  agent: {
    /**
     * 提供给 Agent 验证身份的 Token
     */
    token: string;
  };

  /**
   * Makeflow 相关配置
   */
  makeflow: {
    /**
     * Makeflow 的地址，默认为 https://www.makeflow.com
     */
    url: string;
    powerApp: {
      name: string;
      displayName: string;
      description: string;
    };
  };
}
