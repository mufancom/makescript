import {Server} from 'http';

import entrance from 'entrance-decorator';

import {
  AgentService,
  AppService,
  DBService,
  MakeflowService,
  RecordService,
  RunningService,
  SocketService,
  TokenService,
} from './@services';
import {Config} from './config';

export class Entrances {
  readonly ready = Promise.all([this.dbService.ready]);

  constructor(private httpServer: Server, readonly config: Config) {
    this.up();
  }

  up(): void {
    this.appService.up();
  }

  @entrance
  get dbService(): DBService {
    return new DBService(this.config);
  }

  @entrance
  get socketService(): SocketService {
    return new SocketService(this.httpServer, this.config);
  }

  @entrance
  get makeflowService(): MakeflowService {
    return new MakeflowService(
      this.agentService,
      this.recordService,
      this.tokenService,
      this.dbService,
      this.config,
    );
  }

  @entrance
  get agentService(): AgentService {
    return new AgentService();
  }

  @entrance
  get runningService(): RunningService {
    return new RunningService(
      this.agentService,
      this.makeflowService,
      this.dbService,
      this.config,
    );
  }

  @entrance
  get tokenService(): TokenService {
    return new TokenService(this.dbService);
  }

  @entrance
  get recordService(): RecordService {
    return new RecordService(this.dbService);
  }

  @entrance
  get appService(): AppService {
    return new AppService(
      this.agentService,
      this.makeflowService,
      this.socketService,
      this.dbService,
      this.config,
    );
  }
}
