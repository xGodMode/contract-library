import fs from 'fs';
import path from 'path';
import readline from 'readline';

import glob from 'glob';
import requireFromString from 'require-from-string';
import solc from 'solc';
import { handleRequest } from './utils';

const INPUT_DIR = path.join(__dirname, '../contracts');
const OUTPUT_DIR = path.join(__dirname, '../build/protocols');

const binaries = {};

export async function compileAll(evmVersion: string): Promise<string[]> {
    console.log(`\nCompiling for EVM ${evmVersion}`);
    const entries = await fs.promises.readdir(
        path.join(INPUT_DIR, evmVersion),
        { withFileTypes: true }
    );
    const dirs = entries.filter((dirent) => dirent.isDirectory());
    if (dirs.length == 0) console.log('No protocols found');

    return await Promise.all(dirs.map(handleFile));
    function handleFile(dir: fs.Dirent): Promise<string> {
        try {
            return compileDirectoryWithImports(
                evmVersion,
                path.join(INPUT_DIR, evmVersion, dir.name),
                path.join(OUTPUT_DIR, `${path.basename(dir.name)}.json`)
            );
        } catch (error) {
            console.error(error);
        }
    }
}

async function compileDirectoryWithImports(
    evmVersion: string,
    inputDir: string,
    outputPath: string
): Promise<string> {
    const files = await new Promise<Array<string>>((resolve, reject) => {
        if (!inputDir.endsWith('/')) inputDir += '/';
        glob(inputDir + 'GM*.sol', null, function (err, files: Array<string>) {
            if (err) reject(err);
            resolve(files);
        });
    });

    if (files.length == 0) {
        console.log('No contracts found');
        return;
    }

    let semver = '0.0.0';
    const sources = {};
    const outputSelections = {};
    const outputTypes = ['abi', 'evm.bytecode', 'evm.deployedBytecode'];

    for (const file of files) {
        const fileSemver = await getSolcSemver(file);
        if (fileSemver > semver) semver = fileSemver;

        const contractName = path.basename(file);
        console.log(`Preparing contract ${contractName}`);
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

    console.log(`Loading solc ${semver}`);
    const solcV = await loadRemoteVersion(semver);
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
    console.log(`Finished compiling protocol ${path.basename(outputPath)}`);
    return path.basename(outputPath);
}

export async function getSolcSemver(filePath: string): Promise<string> {
    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity,
    });

    let version: string | null = null;
    for await (const line of rl) {
        if (line.startsWith('pragma')) {
            const regex = /^pragma solidity [\^\~\>\<]?=?(?<version>[0-9\.]*);/;
            try {
                const groups = line.match(regex).groups;
                version = groups.version;
                break;
            } catch (error) {
                throw Error('Failed to parse pragma solidity version');
            }
        }
    }
    if (!version) throw Error('No pragma solidity version found');
    return version;
}

export async function loadRemoteVersion(semver: string): Promise<any> {
    if (binaries[semver]) return binaries[semver];
    const baseUrl = 'https://binaries.soliditylang.org/bin';
    const binListUrl = baseUrl + '/list.json';
    const binList = await handleRequest(binListUrl, { json: true });
    const release = binList.releases[semver];
    const binary = await handleRequest(baseUrl + '/' + release);
    const solcV = solc.setupMethods(requireFromString(binary, release));
    binaries[semver] = solcV;
    return solcV;
}
