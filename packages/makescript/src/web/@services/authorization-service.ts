import {fetchAPI} from '../@helpers';

export class AuthorizationService {
  async check(): Promise<void> {
    await fetchAPI('/api/check');
  }

  async login(password: string | undefined): Promise<void> {
    await fetchAPI('/api/login', {
      method: 'post',
      body: JSON.stringify({
        password,
      }),
    });
  }

  async initialize(password: string | undefined): Promise<void> {
    await fetchAPI('/api/initialize', {
      method: 'POST',
      body: JSON.stringify({
        password,
      }),
    });
  }
}
