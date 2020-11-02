import {serveAPI} from './@api';
import {Config} from './config';

export async function main(config: Config): Promise<void> {
  await serveAPI({
    host: config.host,
    port: config.port,
    token: config.token,
  });
}
