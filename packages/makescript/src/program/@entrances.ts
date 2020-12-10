import {Server} from 'http';

import entrance from 'entrance-decorator';

import {
  AgentService,
  DBService,
  MakeflowService,
  RPCService,
  RecordService,
  RunningService,
  SocketService,
  TokenService,
  UserService,
} from './@services';
import {Config} from './config';

export class Entrances {
  readonly ready = Promise.all([this.dbService.ready]);

  constructor(private httpServer: Server, readonly config: Config) {
    this.up();
  }

  up(): void {
    this.rpcService.up();
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
  get userService(): UserService {
    return new UserService(this.dbService);
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
  get rpcService(): RPCService {
    return new RPCService(
      this.agentService,
      this.makeflowService,
      this.socketService,
      this.config,
    );
  }
}
