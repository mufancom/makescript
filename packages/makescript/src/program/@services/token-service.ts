import {v4 as uuidv4} from 'uuid';

import {TokenModel} from '../@core';
import {calculateHash} from '../@utils';
import {ActiveToken, convertTokenModelToActiveToken} from '../types';

import {DBService} from './db-service';

export class TokenService {
  constructor(private dbService: DBService) {}

  async generateToken(label: string): Promise<string> {
    let token = uuidv4();

    let hash = calculateHash(token);

    await this.dbService.db
      .get('tokens')
      .push({
        id: uuidv4(),
        label,
        hash,
        disabledAt: undefined,
      })
      .write();

    return token;
  }

  async disableToken(id: string): Promise<void> {
    await this.dbService.db
      .get('tokens')
      .find({id})
      .assign({disabledAt: Date.now()})
      .write();
  }

  getActiveToken(token: string): TokenModel | undefined {
    let hash = calculateHash(token);

    return this.dbService.db
      .get('tokens')
      .find(model => model.hash === hash && !model.disabledAt)
      .value();
  }

  getActiveTokens(): ActiveToken[] {
    return this.dbService.db
      .get('tokens')
      .filter(tokenModel => !tokenModel.disabledAt)
      .value()
      .map(model => convertTokenModelToActiveToken(model));
  }
}
