import * as FS from 'fs';
import * as Path from 'path';

import {ResourceConfig, logger} from '@makeflow/makescript-agent';
import rimraf from 'rimraf';
import * as villa from 'villa';

import {Config} from '../config';

const INDEX_FILE_NAME = 'index.html';

const RESOURCES_CONFIG_FILE_NAME = 'config.json';

export const RESOURCES_RELATIVE_PATH = 'outputs';

export async function getResourcePath(
  id: string,
  path: string,
  config: Config,
): Promise<string> {
  let resourceBasePath = Path.join(
    config.workspace,
    RESOURCES_RELATIVE_PATH,
    id,
  );
  let resourceConfigPath = Path.join(
    resourceBasePath,
    RESOURCES_CONFIG_FILE_NAME,
  );

  if (FS.existsSync(resourceConfigPath)) {
    try {
      let configContentBuffer = await villa.async(FS.readFile)(
        resourceConfigPath,
      );
      let configContent = JSON.parse(
        configContentBuffer.toString(),
      ) as ResourceConfig;

      if (configContent.expiresAt < Date.now()) {
        await villa.async(rimraf)(resourceBasePath);
      }
    } catch (error) {
      logger.warn(`Failed to parse resource config file: ${error.message}`);
    }
  }

  let pathToVisit = Path.join(resourceBasePath, path);

  if (!path || !/.+\..+/.test(path)) {
    return Path.join(pathToVisit, INDEX_FILE_NAME);
  }

  return pathToVisit;
}
