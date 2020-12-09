import {Server} from 'http';

import entrance from 'entrance-decorator';

import {
  AgentService,
  DBService,
  MakeflowService,
  RunningService,
  SocketService,
  TokenService,
  UserService,
} from './@services';
import {Config} from './config';

export class Entrances {
  readonly ready = Promise.all([this.dbService.ready]);

  constructor(private httpServer: Server, readonly config: Config) {}

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
      this.runningService,
      this.tokenService,
      this.socketService,
      this.dbService,
      this.config,
    );
  }

  @entrance
  get agentService(): AgentService {
    return new AgentService(this.socketService, this.config);
  }

  @entrance
  get runningService(): RunningService {
    return new RunningService(this.agentService, this.dbService, this.config);
  }

  @entrance
  get userService(): UserService {
    return new UserService(this.dbService);
  }

  @entrance
  get tokenService(): TokenService {
    return new TokenService(this.dbService);
  }
}
