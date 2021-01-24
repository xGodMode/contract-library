import fs from 'fs';
import path from 'path';
import glob from 'glob';

import { loadRemoteVersion, getSolcSemver } from '../compiler';

const INPUT_DIR = path.join(__dirname, '../../contracts/istanbul/UniswapV2/');

async function main() {
    await compileDirectoryWithImports(
        'istanbul',
        INPUT_DIR,
        path.join(INPUT_DIR, 'out.json')
    );
}

async function compileDirectoryWithImports(
    evmVersion: string,
    inputDir: string,
    outputPath: string
) {
    const files = await new Promise<Array<string>>((resolve, reject) => {
        if (!inputDir.endsWith('/')) inputDir += '/';
        glob(inputDir + 'GM*.sol', null, function (err, files: Array<string>) {
            if (err) reject(err);
            resolve(files);
        });
    });

    let semver = '0.0.0';
    const sources = {};
    const outputSelections = {};
    const outputTypes = ['abi', 'evm.bytecode', 'evm.deployedBytecode'];

    for (const file of files) {
        const fileSemver = await getSolcSemver(file);
        if (fileSemver > semver) semver = fileSemver;

        const contractName = path.basename(file);
        outputSelections[contractName.split('.sol')[0]] = outputTypes;

        const content = await fs.promises.readFile(file);
        sources[contractName] = { content: content.toString() };
    }

    const input = {
        language: 'Solidity',
        sources,
        settings: {
            evmVersion,
            outputSelection: {
                '*': outputSelections,
            },
        },
    };

    const solcV = await loadRemoteVersion('0.5.16');
    const output = solcV.compile(JSON.stringify(input), {
        import: findImports,
    });
    function findImports(filePath: string): any {
        filePath = path.join(inputDir, filePath);
        return {
            contents: fs.readFileSync(filePath).toString(),
        };
    }
    await fs.promises.writeFile(
        outputPath,
        JSON.stringify(JSON.parse(output), null, 4)
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
