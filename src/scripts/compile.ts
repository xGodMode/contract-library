/**
 * Internal use only.
 *
 * Generates compiled protocols in the build directory.
 */

import path from 'path';
import fs from 'fs';

import { compileAll } from '../compiler';

const COMPILED_LIST_FILE_PATH = path.join(
    __dirname,
    '../../build/protocols.txt'
);

async function main() {
    // IMPORTANT: Currently we assume that a given protocol has all its requisite
    // contracts under the same compiler version. This may not be true and should
    // be accounted for at some point.
    const byzantium = await compileAll('byzantium');
    const constantinople = await compileAll('constantinople');
    const istanbul = await compileAll('istanbul');
    const compiledProtocols = [
        ...byzantium,
        ...constantinople,
        ...istanbul,
    ].join('\n');

    const fd = await fs.promises.open(COMPILED_LIST_FILE_PATH, 'w');
    await fd.write(compiledProtocols);
    await fd.close();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
