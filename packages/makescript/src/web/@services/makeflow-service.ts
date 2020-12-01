import {MFUserCandidate} from '../../program/types';
import {fetchAPI} from '../@helpers';

export class MakeflowService {
  async listUserCandidates(
    username: string,
    password: string,
  ): Promise<MFUserCandidate[]> {
    return fetchAPI('/api/makeflow/list-user-candidates', {
      method: 'POST',
      body: JSON.stringify({username, password}),
    });
  }

  async authenticate(
    username: string,
    password: string,
    userId: string,
  ): Promise<void> {
    await fetchAPI('/api/makeflow/authenticate', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        userId,
      }),
    });
  }

  async checkAuthentication(): Promise<boolean> {
    let {authenticated} = await fetchAPI('/api/makeflow/check-authentication');

    return authenticated;
  }

  async previewAppDefinition(): Promise<object> {
    return fetchAPI('/api/makeflow/power-app-definition');
  }

  async publishApp(): Promise<void> {
    await fetchAPI('/api/makeflow/publish', {method: 'POST'});
  }
}
