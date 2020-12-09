import {Dict} from 'tslang';

import {logger} from '../@utils';
import {Config} from '../config';
import {
  SocketEventGetScriptsRequestData,
  SocketEventGetScriptsResponseData,
  SocketEventRunScriptRequestData,
  SocketEventRunScriptResponseData,
  SocketEventSyncScriptsRequestData,
  SocketEventSyncScriptsResponseData,
} from '../types';

import {RunningService} from './running-service';
import {ScriptService} from './script-service';
import {SocketService} from './socket-service';

export class MakescriptService {
  private registered = false;

  constructor(
    private scriptService: ScriptService,
    private runningService: RunningService,
    private socketService: SocketService,
    private config: Config,
  ) {}

  initialize(): void {
    let socket = this.socketService.socket;

    socket.on(
      'sync-scripts',
      (
        {}: SocketEventSyncScriptsRequestData,
        callback: (data: unknown) => void,
      ) => {
        this.scriptService
          .syncScripts()
          .then(result => {
            let response: SocketEventSyncScriptsResponseData = result;
            callback(response);
          })
          .catch(logger.error);
      },
    );

    socket.on(
      'get-scripts',
      (
        {}: SocketEventGetScriptsRequestData,
        callback: (data: unknown) => void,
      ) => {
        let response: SocketEventGetScriptsResponseData =
          this.scriptService.scriptsDefinition?.scripts ?? [];

        callback(response);
      },
    );

    socket.on(
      'run-script',
      (
        {
          id,
          name,
          parameters,
          resourcesBaseURL,
        }: SocketEventRunScriptRequestData,
        callback: (data: unknown) => void,
      ) => {
        this.runningService
          .runScript({
            id,
            name,
            parameters,
            resourcesBaseURL,
          })
          .then(result => {
            let response: SocketEventRunScriptResponseData = {
              id,
              result,
            };

            callback(response);
          })
          .catch(error => {
            logger.error(error);

            callback({message: error.message});
          });
      },
    );

    socket.on('connect', () => {
      this.register();
    });
  }

  private register(): void {
    let socket = this.socketService.socket;

    socket.emit(
      'register',
      {namespace: this.config.namespace, resume: this.registered},
      (response: Dict<unknown>) => {
        if (response?.error) {
          logger.error((response?.message as string) ?? '');
          process.exit(1);
        }

        this.registered = true;
        logger.info(`Successfully to registered as ${this.config.namespace}`);
      },
    );
  }
}
