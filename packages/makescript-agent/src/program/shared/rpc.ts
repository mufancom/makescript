import {Socket} from 'socket.io-client';
import {Dict} from 'tslang';

import {IRPC} from '../types';

import {Logger} from './logger';

export function bridgeRPC(
  rpc: IRPC,
  socket: Socket,
  logger: Logger = console,
): void {
  socket.onAny((event, {parameters}, callback) => {
    let methodName = convertEventNameToRPCMethodName(event);

    if (!methodName) {
      return;
    }

    if (!(methodName in rpc)) {
      logger.error(`Called an unknown RPC method "${methodName}"`);
      return;
    }

    if (typeof (rpc as any)[methodName] !== 'function') {
      logger.error(`RPC method "${methodName}" is not a callable method`);
      return;
    }

    Promise.resolve((rpc as Dict<CallableFunction>)[methodName](...parameters))
      .then(result => callback({result}))
      .catch(error => callback({error: error.message ?? 'Unknown error'}));
  });
}

export function wrapSocketToRPC<T extends IRPC>(
  socket: Socket,
  logger: Logger = console,
): T {
  return new Proxy(
    {},
    {
      get(_, methodName) {
        if (typeof methodName !== 'string') {
          throw new Error(`Unknown RPC call "${String(methodName)}"`);
        }

        return async (...params: unknown[]) => {
          return new Promise((resolve, reject) => {
            socket.emit(
              convertRPCMethodNameToEventName(methodName),
              {parameters: params},
              ({error, result}: {error: string; result: unknown}) => {
                if (error) {
                  logger.error(`RPC calling thrown an error: ${error}`);
                  reject(new Error(error));
                } else {
                  resolve(result);
                }
              },
            );
          });
        };
      },
    },
  ) as T;
}

export function convertRPCMethodNameToEventName(name: string): string {
  return `rpc:${name}`;
}

export function convertEventNameToRPCMethodName(
  name: string,
): string | undefined {
  let execResult = /^rpc:(.+)$/.exec(name);

  if (!execResult) {
    return undefined;
  }

  return execResult[1];
}
