import * as FS from 'fs';
import * as OS from 'os';
import * as Path from 'path';

import {
  ScriptDefinition,
  ScriptRunningArgumentParameters,
  ScriptRunningResult,
  SocketEventGetScriptsResponseData,
  SocketEventRunScriptResponseData,
  SocketEventSyncScriptsResponseData,
} from '@makeflow/makescript-agent';
import extractZip from 'extract-zip';
import SocketIO from 'socket.io';
import {v4 as uuidv4} from 'uuid';
import * as villa from 'villa';

import {ExpectedError} from '../@core';
import {logger} from '../@utils';
import {Config} from '../config';

import {SocketService} from './socket-service';

const MAKESCRIPT_TMPDIR = Path.join(OS.tmpdir(), 'makescript-temp');

export class AgentService {
  scriptDefinitionsMap = new Map<string, ScriptDefinition[]>();

  private socketMap = new Map<string, SocketIO.Socket>();

  constructor(private socketService: SocketService, private config: Config) {
    this.initialize();
  }

  async updateScriptsForAllAgents(): Promise<void> {
    for (let socket of this.socketMap.values()) {
      await new Promise(resolve =>
        socket.emit(
          'sync-scripts',
          {},
          (response: SocketEventSyncScriptsResponseData) => {
            resolve(response);
          },
        ),
      );
    }
  }

  async runScript(
    namespace: string,
    {
      id,
      name,
      parameters,
      resourcesBaseURL,
    }: {
      id: string;
      name: string;
      parameters: ScriptRunningArgumentParameters;
      resourcesBaseURL: string;
    },
  ): Promise<ScriptRunningResult> {
    let socket = this.socketMap.get(namespace);

    if (!socket) {
      logger.info(`Agent for ${namespace} not found.`);
      throw new ExpectedError('NAMESPACE_NOT_REGISTERED');
    }

    logger.info(`Running record "${id}" of script "${namespace}:${name}"`);

    let response = await new Promise<SocketEventRunScriptResponseData>(
      resolve =>
        socket!.emit(
          'run-script',
          {
            id,
            name,
            parameters,
            resourcesBaseURL,
          },
          (response: SocketEventRunScriptResponseData) => {
            resolve(response);
          },
        ),
    );

    logger.info(
      `Complete running record "${id}" of script "${namespace}:${name}"`,
    );

    return response.result;
  }

  private initialize(): void {
    let server = this.socketService.server;

    server.on('connection', (socket: SocketIO.Socket) => {
      socket.on('register', ({namespace, resume}, callback) => {
        logger.info(`Registering agent "${namespace}" ...`);

        if (this.socketMap.has(namespace) && !resume) {
          logger.info(`Agent "${namespace}" has already registered`);
          callback({error: true, message: 'Namespace has registered.'});
          socket.disconnect();
          return;
        }

        socket.on('disconnect', () => {
          logger.info(`Agent "${namespace}" disconnected`);
          this.socketMap.delete(namespace);
        });

        this.socketMap.set(namespace, socket);

        callback({error: false});

        this.retrieveScriptDefinitions().catch(logger.error);

        logger.info(`Agent "${namespace}" registered`);
      });

      // TODO:
      socket.on('update-resources', async ({id, buffer}) => {
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

        // await villa.async(rimraf)(temporaryPath);
      });
    });
  }

  private async retrieveScriptDefinitions(): Promise<void> {
    for (let [namespace, socket] of this.socketMap.entries()) {
      let scriptDefinitions = await new Promise<
        SocketEventGetScriptsResponseData
      >(resolve => {
        socket.emit(
          'get-scripts',
          {},
          (response: SocketEventGetScriptsResponseData) => resolve(response),
        );
      });

      this.scriptDefinitionsMap.set(namespace, scriptDefinitions);
    }
  }
}
