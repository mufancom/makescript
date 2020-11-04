import * as FS from 'fs';

import archiver from 'archiver';

export async function zip(
  sourceDirectoryPath: string,
  destFilePath: string,
): Promise<void> {
  let output = FS.createWriteStream(destFilePath);
  let archive = archiver('zip');

  // TODO: remove me
  // output.on('close', resolve);
  // archive.on('error', reject);

  archive.pipe(output);

  archive.directory(sourceDirectoryPath, false);

  await archive.finalize();
}
