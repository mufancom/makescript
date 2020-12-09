/* eslint-disable @mufan/explicit-return-type */
import entrance from 'entrance-decorator';

import {RunningService, ScriptService} from './@services';
import {MakescriptService} from './@services/makescript-service';
import {SocketService} from './@services/socket-service';
import {Config} from './config';

export class Entrances {
  readonly ready = Promise.all([this.scriptService.ready]);

  constructor(private config: Config) {}

  @entrance
  get socketService() {
    return new SocketService(this.config);
  }

  @entrance
  get makescriptService() {
    return new MakescriptService(
      this.scriptService,
      this.runningService,
      this.socketService,
      this.config,
    );
  }

  @entrance
  get scriptService() {
    return new ScriptService(this.config);
  }

  @entrance
  get runningService() {
    return new RunningService(this.scriptService, this.socketService);
  }
}
