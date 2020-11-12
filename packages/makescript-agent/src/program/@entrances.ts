import entrance from 'entrance-decorator';

import {RunningService, ScriptService} from './@services';
import {Config} from './config';

export class Entrances {
  constructor(private config: Config) {}

  @entrance
  get scriptService(): ScriptService {
    return new ScriptService(this.config);
  }

  @entrance
  get runningService(): RunningService {
    return new RunningService(this.scriptService);
  }
}
