/**
 * Generates compiled contracts in the build directory.
 *
 * Internal use only.
 */

import path from 'path';
import fs from 'fs';

import { compileAll } from '../compiler';

const COMPILED_LIST_FILE_PATH = path.join(
    __dirname,
    '../../build/contracts.txt'
);

async function main() {
    const constantinople = await compileAll('constantinople');
    const byzantium = await compileAll('byzantium');
    const compiledContracts = [...constantinople, ...byzantium].join('\n');

    const fd = await fs.promises.open(COMPILED_LIST_FILE_PATH, 'w');
    await fd.write(compiledContracts);
    await fd.close();
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
