import {v4 as uuidv4} from 'uuid';

import {ExpectedError, UserModel} from '../@core';
import {calculateHash} from '../@utils';

import {DBService} from './db-service';

const USER_PASSWORD_HASH_SALT = 'makescript-user-password-hash-salt';

export class UserService {
  get hasAnyUser(): boolean {
    return this.dbService.db.get('users').size().value() > 0;
  }

  constructor(private dbService: DBService) {}

  validateUser(username: string, password: string): UserModel | undefined {
    return this.dbService.db
      .get('users')
      .find({
        username,
        passwordHash: calculatePasswordHash(password),
      })
      .value();
  }

  getUserById(id: string): UserModel | undefined {
    return this.dbService.db
      .get('users')
      .find({
        id,
      })
      .value();
  }

  async initializeAdminUser({
    username,
    password,
    notificationHook,
  }: {
    username: string;
    password: string;
    notificationHook: string | undefined;
  }): Promise<UserModel> {
    if (this.hasAnyUser) {
      throw new ExpectedError('APP_ALREADY_INITIALIZED');
    }

    let insertedUsers = await this.dbService.db
      .get('users')
      .push({
        id: uuidv4(),
        username,
        passwordHash: calculatePasswordHash(password),
        notificationHook,
        admin: true,
      })
      .write();

    return insertedUsers[0];
  }

  async createUser(username: string): Promise<string> {
    let pushedUserModels = await this.dbService.db
      .get('users')
      .push({
        id: uuidv4(),
        username,
        passwordHash: undefined,
        notificationHook: undefined,
        admin: false,
      })
      .write();

    if (!pushedUserModels.length) {
      throw new Error();
    }

    let newUserModel = pushedUserModels[0];

    return newUserModel.id;
  }

  async initializeUser(id: string, password: string): Promise<void> {
    await this.dbService.db
      .get('users')
      .find({id})
      .assign({
        passwordHash: calculatePasswordHash(password),
      })
      .write();
  }
}

function calculatePasswordHash(password: string): string {
  return calculateHash(password, USER_PASSWORD_HASH_SALT);
}
