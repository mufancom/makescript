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
  /**
   * MakeScript Agent 注册到 MakeScript 时的名称
   */
  name: string;

  server: {
    /**
     * 包含 Token 信息的 MakeScript 地址，类似 https://example.com/token
     */
    url: string;
  };

  scripts: {
    /**
     * 脚本仓库的地址
     */
    git: string;
    /**
     * 脚本定义文件所在目录
     */
    dir?: string;
  };

  /**
   * Agent 要使用的网络代理
   */
  proxy?: string | undefined;
}
