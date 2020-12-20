import {logger} from '@makeflow/makescript-agent';
import Bcrypt from 'bcrypt';
import {Command, command, metadata, param} from 'clime';

const PASSWORD_SALT_ROUNDS = 10;

export const description =
  'Generate and output a hash used for script password.';

export const brief = 'generate hash for password';

@command()
export default class extends Command {
  @metadata
  async execute(
    @param({
      description: 'The password to generate a hash.',
      required: true,
    })
    password: string,
  ): Promise<void> {
    let passwordHash = await Bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    logger.info(`The generated hash is: ${passwordHash}`);
    logger.info(
      'You can copy it to scripts definition as field "passwordHash", then it needs a password when running a script.',
    );
  }
}
