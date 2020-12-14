import * as FS from 'fs';
import * as OS from 'os';
import * as Path from 'path';

import {
  MakescriptAgentRPC,
  MakescriptRPC,
  bridgeRPC,
  logger,
  wrapSocketToRPC,
} from '@makeflow/makescript-agent';
import extractZip from 'extract-zip';
import rimraf from 'rimraf';
import {Socket} from 'socket.io';
import {v4 as uuidv4} from 'uuid';
import * as villa from 'villa';

import {Config} from '../config';

import {AgentService} from './agent-service';
import {MakeflowService} from './makeflow-service';
import {SocketService} from './socket-service';

const MAKESCRIPT_TMPDIR = Path.join(OS.tmpdir(), 'makescript-temp');

export class RPCService {
  constructor(
    private agentService: AgentService,
    private makeflowService: MakeflowService,
    private socketService: SocketService,
    private config: Config,
  ) {}

  up(): void {
    this.socketService.server.on('connection', (socket: Socket) => {
      logger.info(`New connection from socket client: ${socket.id}`);

      bridgeRPC(
        new RPC(this.agentService, this.makeflowService, socket, this.config),
        socket as any,
        logger,
      );
    });
  }
}

class RPC implements MakescriptRPC {
  private agentRPC = wrapSocketToRPC<MakescriptAgentRPC>(
    this.socket as any,
    logger,
  );

  constructor(
    private agentService: AgentService,
    private makeflowService: MakeflowService,
    private socket: Socket,
    private config: Config,
  ) {}

  async register(namespace: string, resume: boolean): Promise<void> {
    logger.info(`Registering agent "${namespace}" ...`);

    if (this.agentService.registeredRPCMap.has(namespace) && !resume) {
      throw new Error(`Agent "${namespace}" has already registered`);
    }

    this.socket.on('disconnect', () => {
      logger.info(`Agent "${namespace}" disconnected`);
      this.agentService.registeredRPCMap.delete(namespace);
    });

    this.agentService.registeredRPCMap.set(namespace, this.agentRPC);

    logger.info(`Agent "${namespace}" registered`);
  }

  async updateResources(id: string, buffer: Buffer): Promise<void> {
    let temporaryPath = Path.join(MAKESCRIPT_TMPDIR, `${uuidv4()}.zip`);

    if (!FS.existsSync(MAKESCRIPT_TMPDIR)) {
      FS.mkdirSync(MAKESCRIPT_TMPDIR);
    }

    await villa.async(FS.writeFile)(temporaryPath, buffer, {
      encoding: 'binary',
    });

    await extractZip(temporaryPath, {
      dir: Path.join(this.config.resourcesPath, id),
    });

    await villa.async(rimraf)(temporaryPath);
  }

  async updateOutput(id: string, output: string): Promise<void> {
    await this.makeflowService.updatePowerItem({id, description: output});
  }
}
