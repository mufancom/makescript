export interface Config {
  /**
   * The port to listen on
   */
  port: number;
  /**
   * The host to listen on
   */
  host: string;
  /**
   * @uuid
   *
   * The token to authenticate
   */
  token: string;
  /**
   * A
   */
  'working-dir': string;
}
