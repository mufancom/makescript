import {
  BriefScriptDefinition,
  MakescriptAgentRPC,
  ScriptRunningArgumentParameters,
  ScriptRunningResult,
  logger,
} from '@makeflow/makescript-agent';
import * as villa from 'villa';

import {ExpectedError} from '../@core';
import {Config} from '../config';

export class AgentService {
  registeredRPCMap = new Map<string, MakescriptAgentRPC>();

  get joinLink(): string {
    return `${this.config.http.url}/join/${this.config.joinToken}`;
  }

  constructor(private config: Config) {}

  async getScriptDefinitionsMap(): Promise<
    Map<string, BriefScriptDefinition[]>
  > {
    return new Map(
      await villa.map(
        Array.from(this.registeredRPCMap),
        async ([namespace, rpc]) => {
          return [namespace, await rpc.getScripts()] as const;
        },
      ),
    );
  }

  async requireScriptDefinition(
    namespace: string,
    name: string,
  ): Promise<BriefScriptDefinition> {
    let definitions = await this.registeredRPCMap.get(namespace)?.getScripts();

    let definition = definitions?.find(definition => definition.name === name);

    if (!definition) {
      throw new Error(
        `The script definition of type "${name}" in "${name}" not found`,
      );
    }

    return definition;
  }

  async runScript(
    namespace: string,
    {
      id,
      name,
      parameters,
      resourcesBaseURL,
      password,
    }: {
      id: string;
      name: string;
      parameters: ScriptRunningArgumentParameters;
      resourcesBaseURL: string;
      password: string | undefined;
    },
  ): Promise<ScriptRunningResult> {
    let agentRPC = this.registeredRPCMap.get(namespace);

    if (!agentRPC) {
      logger.error(`Agent for ${namespace} not found.`);
      throw new ExpectedError('NAMESPACE_NOT_REGISTERED');
    }

    logger.info(`Running record "${id}" of script "${namespace}:${name}"`);

    let result = await agentRPC.runScript({
      id,
      name,
      parameters,
      resourcesBaseURL,
      password,
    });

    logger.info(
      `Complete running record "${id}" of script "${namespace}:${name}"`,
    );

    return result;
  }
}
