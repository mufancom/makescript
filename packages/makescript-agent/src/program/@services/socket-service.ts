import URL from 'url';

import SocketIO from 'socket.io-client';

import {Config} from '../config';
import {logger, wrapSocketToRPC} from '../shared';
import {MakescriptRPC} from '../types';

export class SocketService {
  readonly socket: SocketIO.Socket;
  readonly makescriptRPC: MakescriptRPC;

  private registered = false;

  constructor(
    private config: Config,
    private entrancesReady: Promise<unknown>,
  ) {
    let makescriptSecretURL = this.config.server.url;

    let url = URL.parse(makescriptSecretURL);

    this.socket = SocketIO.io(`${url.protocol}//${url.host}`, {
      path: url.pathname ?? '/',
    });

    let socket = this.socket;

    this.makescriptRPC = wrapSocketToRPC(socket, logger);

    socket.on('connect', () => {
      logger.info(`Connected to ${makescriptSecretURL}`);

      (async () => {
        await this.entrancesReady;

        await this.makescriptRPC.register(this.config.name, this.registered);

        this.registered = true;

        logger.info(`Successfully to registered as "${this.config.name}"`);
      })().catch(logger.error);
    });
    socket.on('disconnect', (reason: string) =>
      logger.error(`Disconnected from ${makescriptSecretURL}: ${reason}`),
    );
    socket.on('connect_error', (error: Error) =>
      logger.error(
        `Failed to connect to ${makescriptSecretURL}: ${error.message}`,
      ),
    );
  }
}
