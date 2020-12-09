import {Server} from 'http';

import SocketIO from 'socket.io';

import {Config} from '../config';

export class SocketService {
  readonly server = new SocketIO.Server(this.httpServer, {
    path: `/join/${this.config.joinToken}`,
  });

  constructor(private httpServer: Server, private config: Config) {}
}
