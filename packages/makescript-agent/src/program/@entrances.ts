/* eslint-disable @mufan/explicit-return-type */
import entrance from 'entrance-decorator';

import {
  RPCService,
  RunningService,
  ScriptService,
  SocketService,
} from './@services';
import {Config} from './config';

export class Entrances {
  readonly ready = Promise.all([this.scriptService.ready]);

  constructor(private config: Config) {
    this.rpcService.up();
  }

  @entrance
  get socketService() {
    return new SocketService(this.config);
  }

  @entrance
  get scriptService() {
    return new ScriptService(this.config);
  }

  @entrance
  get runningService() {
    return new RunningService(this.scriptService, this.socketService);
  }

  @entrance
  get rpcService() {
    return new RPCService(
      this.runningService,
      this.scriptService,
      this.socketService,
    );
  }
}
