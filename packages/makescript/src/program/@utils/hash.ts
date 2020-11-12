import crypto from 'crypto';

export function calculateHash(string: string, salt?: string): string {
  let md5 = crypto.createHash('md5');

  md5.update(string);

  if (salt) {
    md5.update(salt);
  }

  return md5.digest().toString();
}
