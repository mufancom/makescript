import chalk from 'chalk';

export type LOG_TYPE = 'info' | 'warning' | 'error';

export type Logger = typeof logger;

export const logger = {
  info(message: string): void {
    console.info(
      message
        .split('\n')
        .map(line => `[${chalk.green('INFO')}] ${line}`)
        .join('\n'),
    );
  },

  warn(message: string): void {
    console.warn(
      message
        .split('\n')
        .map(line => `[${chalk.yellow('WARNING')}] ${line}`)
        .join('\n'),
    );
  },

  error(message: string): void {
    console.error(
      message
        .split('\n')
        .map(line => `[${chalk.red('ERROR')}] ${line}`)
        .join('\n'),
    );
  },
};
