import {Modal} from 'antd';
import entrance from 'entrance-decorator';

import {ENTRANCES} from './@constants';
/* eslint-disable @mufan/explicit-return-type */
import {route} from './@routes';
import {
  AgentService,
  AuthorizationService,
  MakeflowService,
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
  get agentService() {
    return new AgentService();
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
        ENTRANCES.agentService.fetchRunningRecords().catch(console.error);
      }

      Modal.destroyAll();
    });

    route.status.$beforeEnterOrUpdate(() => {
      this.agentService.fetchStatus().catch(console.error);
    });

    route.scripts.$beforeEnterOrUpdate(match => {
      if (match.$exact) {
        route.scripts.records.$replace();
      }
    });

    route.scripts.records.$beforeEnter(() => {
      this.agentService.fetchRunningRecords().catch(console.error);
    });

    route.scripts.management.$beforeEnter(() => {
      this.agentService.fetchScriptDefinitionsMap().catch(console.error);
    });

    route.tokens.$beforeEnter(() => {
      this.tokenService.fetchTokens().catch(console.error);
    });

    route.notFound.$beforeEnterOrUpdate(() => {
      route.$replace();
    });
  }
}
