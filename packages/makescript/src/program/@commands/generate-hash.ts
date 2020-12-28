import {logger} from '@makeflow/makescript-agent';
import Bcrypt from 'bcrypt';
import {Command, command, metadata} from 'clime';
import prompts from 'prompts';

const PASSWORD_SALT_ROUNDS = 10;

export const description =
  'Generate and output a hash used for script password.';

export const brief = 'generate hash for password';

@command()
export default class extends Command {
  @metadata
  async execute(): Promise<void> {
    // TODO: prompts 2

    let {password, repeatingPassword} = await prompts([
      {
        name: 'password',
        type: 'password',
        message: 'Please enter the password to generate a hash',
        validate: value => value?.length > 6,
      },
      {
        name: 'repeatingPassword',
        type: 'password',
        message: 'Please repeat the password',
        validate: (value, previousValues) => value === previousValues.password,
      },
    ]);

    // There is a bug (or unhandled behavior) with 'prompts'.
    // When user press CTRL + C , program will continue to execute with empty answers.
    // https://github.com/terkelg/prompts/issues/252
    if (!password || !repeatingPassword || password !== repeatingPassword) {
      return;
    }

    let passwordHash = await Bcrypt.hash(password, PASSWORD_SALT_ROUNDS);

    logger.info(`The generated hash is:`);
    logger.info(`\t${passwordHash}`);
    logger.info(
      'You can copy it to scripts definition as field "passwordHash", then it needs a password when running a script.',
    );
  }
}
