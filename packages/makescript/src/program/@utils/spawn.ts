import * as CP from 'child_process';

import * as villa from 'villa';

export async function spawn(
  command: string,
  args: string[],
  options: CP.SpawnOptions,
): Promise<void> {
  let cp = CP.spawn(command, args, options);

  if (cp.stdout) {
    cp.stdout.pipe(process.stdout);
  }

  if (cp.stderr) {
    cp.stderr.pipe(process.stderr);
  }

  await villa.awaitable(cp);
}
