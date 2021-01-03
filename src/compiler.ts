import fs from 'fs';
import https from 'https';
import path from 'path';
import readline from 'readline';
import MemoryStream from 'memorystream';
import requireFromString from 'require-from-string';

import solc from 'solc';

const INPUT_DIR = path.join(__dirname, '../contracts');
const OUTPUT_DIR = path.join(__dirname, '../build');

export async function compileAll(evmVersion: string): Promise<void> {
    const directory = path.join(INPUT_DIR, evmVersion);
    const files = await fs.promises.readdir(directory);
    await Promise.all(files.map(handleFile));
    function handleFile(file: string): Promise<void> {
        try {
            return compile(file, evmVersion);
        } catch (error) {
            console.error(error);
        }
    }
}

export async function compile(inputFileName: string, evmVersion: string): Promise<void> {
    console.log('Compiling', inputFileName, '...');

    const contractName = inputFileName.split('.sol')[0];
    const outputFileName = contractName + '.json';

    const inputFilePath = path.join(INPUT_DIR, evmVersion, inputFileName)
    const outputFilePath = path.join(OUTPUT_DIR, outputFileName);

    const content = await fs.promises.readFile(inputFilePath);
    const semver = await getSolcVersion(inputFilePath);
    const solcV = await loadRemoteVersion(semver);

    const input = {
        language: 'Solidity',
        sources: {
            [inputFileName]: { content: content.toString() }
        },
        settings: {
            evmVersion,
            outputSelection: {
                '*': {
                    [contractName]: ['abi', 'evm.bytecode', 'metadata']
                }
            }
        }
    };

    const output = solcV.compile(JSON.stringify(input));
    const outputJson = JSON.parse(output);

    if (outputJson.errors) {
        console.log('Compilation failure', outputJson.errors);
    } else {
        try {
        await fs.promises.mkdir(OUTPUT_DIR);
        } catch (err) {
            if (err.code != 'EEXIST') throw err;
        }
        await fs.promises.writeFile(outputFilePath, JSON.stringify(outputJson, null, 4));
        console.log('Compilation success', outputFileName);
    }
}

async function getSolcVersion(filePath: string): Promise<string> {
    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity
    });

    let version: string | null = null;
    for await (const line of rl) {
        if (line.startsWith('pragma')) {
            const regex = /^pragma solidity [\^\~\>\<]?=?(?<version>[0-9\.]*);/;
            const groups = line.match(regex).groups;
            version = groups.version;
            break;
        }
    };
    if (!version) throw Error('No pragma solidity version found')
    return version;
}

async function loadRemoteVersion(semver: string): Promise<any> {
    const baseUrl = 'https://binaries.soliditylang.org/bin';
    const binListUrl = baseUrl + '/list.json';
    const binList = await handleRequest(binListUrl, true);
    const release = binList.releases[semver];
    const binary = await handleRequest(baseUrl + '/' + release);
    const solcV = solc.setupMethods(requireFromString(binary, release));
    return solcV;
}

function handleRequest(url: string, json?: boolean): Promise<any> {
    return new Promise((resolve, reject) => {
        const memoryStream = new MemoryStream(null, {readable: false});
        const req = https.get(url, (res) => {
            res.setEncoding('utf8');

            res.pipe(memoryStream);

            res.on('end', () => {
                if (json) {
                resolve(JSON.parse(memoryStream.toString()));
                } else {
                    resolve(memoryStream.toString());
                }
            });
        });

        req.on('error', (err) => {
            reject(err);
        });
        req.end();
    });
}
