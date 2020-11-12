export interface UserModel {
  id: string;
  username: string;
  passwordHash: string | undefined;
  notificationHook: string | undefined;
  admin: boolean;
}
