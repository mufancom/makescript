import {ScriptRunningArgumentParameters, ScriptRunningResult} from './running';
import {ScriptDefinition} from './script-definition';
import {ScriptsSyncResult} from './scripts';

export type SocketEvent = SocketEventSyncScripts;

export type SocketEventType = SocketEvent['event'];

// sync-scripts

export interface SocketEventSyncScriptsRequestData {}

export type SocketEventSyncScriptsResponseData = ScriptsSyncResult;

export interface SocketEventSyncScripts {
  event: 'sync-scripts';
  request: SocketEventSyncScriptsRequestData;
  response: SocketEventSyncScriptsResponseData;
}

// get-scripts

export interface SocketEventGetScriptsRequestData {}

export type SocketEventGetScriptsResponseData = ScriptDefinition[];

export interface SocketEventGetScripts {
  event: 'get-scripts';
  request: SocketEventGetScriptsRequestData;
  response: SocketEventGetScriptsResponseData;
}

// run-script

export interface SocketEventRunScriptRequestData {
  id: string;
  name: string;
  parameters: ScriptRunningArgumentParameters;
  resourcesBaseURL: string;
}

export interface SocketEventRunScriptResponseData {
  id: string;
  result: ScriptRunningResult;
}

export interface SocketEventRunScript {
  event: 'run-script';
  request: SocketEventRunScriptRequestData;
  response: SocketEventRunScriptResponseData;
}

// register

export interface SocketEventRegisterRequestData {
  id: string;
  namespace: string;
  token: string | undefined;
}

export interface SocketEventRegisterResponseData {
  id: string;
  token: string;
}

export interface SocketEventRegister {
  event: 'register';
  request: SocketEventRegisterRequestData;
  response: SocketEventRegisterResponseData;
}
