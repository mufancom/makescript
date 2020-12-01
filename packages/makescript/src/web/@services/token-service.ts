import {computed, observable} from 'mobx';

import {ActiveToken} from '../../program/types';
import {fetchAPI} from '../@helpers';

export class TokenService {
  @observable
  private _tokens: ActiveToken[] | undefined;

  @computed
  get tokens(): ActiveToken[] {
    return this._tokens || [];
  }

  async fetchTokens(): Promise<void> {
    let {tokens} = await fetchAPI('/api/tokens');

    this._tokens = tokens;
  }

  async generateToken(label: string): Promise<string> {
    let {token} = await fetchAPI('/api/token/generate', {
      method: 'POST',
      body: JSON.stringify({label}),
    });

    await this.fetchTokens();

    return token;
  }

  async disableToken(id: string): Promise<void> {
    await fetchAPI('/api/token/disable', {
      method: 'POST',
      body: JSON.stringify({
        id,
      }),
    });

    await this.fetchTokens();
  }
}
