import {Modal} from 'antd';
import entrance from 'entrance-decorator';

import {ENTRANCES} from './@constants';
/* eslint-disable @mufan/explicit-return-type */
import {route} from './@routes';
import {
  AuthorizationService,
  MakeflowService,
  ScriptsService as ScriptService,
  TokenService,
} from './@services';

export class Entrances {
  readonly ready = Promise.all([]);

  constructor() {
    this.up();
  }

  @entrance
  get tokenService() {
    return new TokenService();
  }

  @entrance
  get scriptService() {
    return new ScriptService();
  }

  @entrance
  get authorizationService() {
    return new AuthorizationService();
  }

  @entrance
  get makeflowService() {
    return new MakeflowService();
  }

  up() {
    // Route services
    route.$beforeEnterOrUpdate(match => {
      if (match.$exact) {
        ENTRANCES.scriptService.fetchRunningRecords().catch(console.error);
      }

      Modal.destroyAll();
    });

    route.status.$beforeEnterOrUpdate(() => {
      this.scriptService.fetchStatus().catch(console.error);
    });

    route.scripts.$beforeEnterOrUpdate(match => {
      if (match.$exact) {
        route.scripts.records.$replace();
      }
    });

    route.scripts.records.$beforeEnter(() => {
      this.scriptService.fetchRunningRecords().catch(console.error);
    });

    route.scripts.management.$beforeEnter(() => {
      this.scriptService.fetchScriptDefinitionsMap().catch(console.error);
    });

    route.tokens.$beforeEnter(() => {
      this.tokenService.fetchTokens().catch(console.error);
    });

    route.notFound.$beforeEnterOrUpdate(() => {
      route.$replace();
    });
  }
}
