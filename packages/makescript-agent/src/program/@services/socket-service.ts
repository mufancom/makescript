import URL from 'url';

import SocketIO from 'socket.io-client';

import {Config} from '../config';
import {logger, wrapSocketToRPC} from '../shared';
import {MakescriptRPC} from '../types';

export class SocketService {
  readonly socket: SocketIO.Socket;
  readonly makescriptRPC: MakescriptRPC;

  private registered = false;

  constructor(private config: Config) {
    let makescriptSecretURL = this.config.makescriptSecretURL;

    let url = URL.parse(makescriptSecretURL);

    this.socket = SocketIO.io(`${url.protocol}//${url.host}`, {
      path: url.pathname ?? '/',
    });

    let socket = this.socket;

    this.makescriptRPC = wrapSocketToRPC(socket);

    socket.on('connect', () => {
      logger.info(`Connected to ${makescriptSecretURL}`);

      this.makescriptRPC
        .register(this.config.namespace, this.registered)
        .then(() => {
          this.registered = true;
          logger.info(
            `Successfully to registered as "${this.config.namespace}"`,
          );
        })
        .catch(logger.error);
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
