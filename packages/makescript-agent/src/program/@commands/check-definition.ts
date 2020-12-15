import * as Path from 'path';

import {Castable, Command, command, metadata, param} from 'clime';
import {Tiva} from 'tiva';

import {logger} from '../shared';

export const description = 'Check scripts definition';

export const brief = 'check scripts definition';

@command()
export default class extends Command {
  @metadata
  async execute(
    @param({
      description: 'The file path fo the scripts definition.',
      required: true,
    })
    path: Castable.File,
  ): Promise<void> {
    logger.info('Checking scripts definition');

    let tiva = new Tiva({
      project: Path.join(__dirname, '../../../src/program'),
    });

    if (!path.exists()) {
      logger.error(`The file "${path.fullName}" not found`);
      process.exit(1);
    }

    let content = await path.json();

    try {
      await tiva.validate(
        {
          module: './types',
          type: 'ScriptsDefinition',
        },
        content,
      );
    } catch (error) {
      if (error.diagnostics) {
        logger.error(error.diagnostics);
        process.exit(1);
      }

      throw error;
    }

    logger.info('The content of the scripts definition is correct.');
    process.exit(0);
  }
}
