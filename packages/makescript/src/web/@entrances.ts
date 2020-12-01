import {Modal} from 'antd';
import entrance from 'entrance-decorator';

/* eslint-disable @mufan/explicit-return-type */
import {route} from './@routes';
import {
  AuthorizationService,
  MakeflowService,
  ScriptService,
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
  get scriptsService() {
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
    route.$beforeUpdate(() => Modal.destroyAll());

    route.scripts.$beforeEnterOrUpdate(match => {
      if (match.$exact) {
        route.scripts.records.$replace();
      }
    });

    route.scripts.records.$beforeEnter(() => {
      this.scriptsService.fetchRunningRecords().catch(console.error);
    });

    route.scripts.management.$beforeEnter(() => {
      this.scriptsService.fetchScriptsDefinition().catch(console.error);
    });

    route.tokens.$beforeEnter(() => {
      console.log('aaaaaa');

      this.tokenService.fetchTokens().catch(console.error);
    });

    route.notFound.$beforeEnterOrUpdate(() => {
      route.home.$replace();
    });
  }
}
