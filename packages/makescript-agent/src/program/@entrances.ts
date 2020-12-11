/* eslint-disable @mufan/explicit-return-type */
import entrance from 'entrance-decorator';
import {Tiva} from 'tiva';

import {
  RPCService,
  RunningService,
  ScriptService,
  SocketService,
} from './@services';
import {Config} from './config';

export class Entrances {
  readonly ready = Promise.all([this.scriptService.ready]);

  constructor(private tiva: Tiva, private config: Config) {
    this.rpcService.up();
  }

  @entrance
  get socketService() {
    return new SocketService(this.config, this.ready);
  }

  @entrance
  get scriptService() {
    return new ScriptService(this.tiva, this.config);
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
