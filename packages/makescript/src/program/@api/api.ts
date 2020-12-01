import {Entrances} from '../@entrances';

import {serveExternalAPI} from './@external';
import {serveWeb} from './@web';

export async function serveAPI(entrances: Entrances): Promise<void> {
  await serveExternalAPI(entrances);
  await serveWeb(entrances);
}
