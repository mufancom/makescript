import {fetchAPI} from '../@helpers';

export class AuthorizationService {
  async check(): Promise<void> {
    await fetchAPI('/api/check');
  }

  async login(username: string, password: string): Promise<void> {
    await fetchAPI('/api/login', {
      method: 'post',
      body: JSON.stringify({
        username,
        password,
      }),
    });
  }

  async initialize(username: string, password: string): Promise<void> {
    await fetchAPI('/api/initialize', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
      }),
    });
  }
}
