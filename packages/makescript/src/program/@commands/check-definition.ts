import {logger} from '@makeflow/makescript-agent';
import {Castable, Command, command, metadata, param} from 'clime';
import {Tiva} from 'tiva';

export const description = 'Check scripts definition';

export const brief = 'check scripts definition';

export const PATH_DEFAULT = 'makescript.json';

@command()
export default class extends Command {
  @metadata
  async execute(
    @param({
      description: 'The file path fo the scripts definition.',
      required: false,
      default: PATH_DEFAULT,
    })
    path: Castable.File,
  ): Promise<void> {
    if (!(await path.exists())) {
      logger.error(`The file "${path.fullName}" not found`);
      process.exit(1);
    }

    logger.info(`Checking scripts definition "${path.baseName}"`);

    let tiva = new Tiva();

    let {default: content} = await import(path.fullName);

    try {
      await tiva.validate(
        {
          module: '@makeflow/makescript-agent',
          type: 'ScriptsDefinition',
        },
        content,
      );
    } catch (error) {
      if (error.diagnostics) {
        logger.error(error.diagnostics);
      }

      throw error;
    }

    logger.info('The content of the scripts definition is correct.');
    process.exit(0);
  }
}
