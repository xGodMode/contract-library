import fs from 'fs';
import path from 'path';
import { handleRequest } from './utils';

const OUTPUT_DIR = path.join(process.cwd(), './build/contracts');
const CONTRACTS_LIST_PATH = path.join(__dirname, '../build/contracts.txt');

/**
 * Downloads compiled GM contracts from github and installs them into a project
 * @param contracts List of GM contract names
 */
export async function installer(contracts?: string[] | undefined) {
    console.log('Installing GM contracts...');
    try {
        await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
    } catch (err) {
        if (err.code != 'EEXIST') throw err;
    }
    const allContractNames = await getAllContractNames();
    if (contracts == undefined) {
        contracts = allContractNames;
    }
    await Promise.all(contracts.map(handleContract));
    function handleContract(contractName: string): Promise<void> {
        try {
            if (!allContractNames.includes(contractName)) {
                throw Error('No contract with that name exists');
            }
            return install(contractName);
        } catch (error) {
            console.error(`Failed to install ${contractName}:`, error.message);
        }
    }
    console.log('Done!');
}

async function getAllContractNames(): Promise<Array<string>> {
    const list = await fs.promises.readFile(CONTRACTS_LIST_PATH);
    return list
        .toString()
        .split('\n')
        .map((name: string) => {
            return name.split('.json')[0];
        });
}

async function install(contractName: string) {
    const contractFilePath = path.join(OUTPUT_DIR, contractName + '.json');
    const contractUrl = `https://raw.githubusercontent.com/xGodMode/contract-library/main/build/contracts/${contractName}.json`;
    const contract = await handleRequest(contractUrl, { json: true });
    await fs.promises.writeFile(
        contractFilePath,
        JSON.stringify(contract, null, 4)
    );
    console.log('Saved', contractName, 'to', contractFilePath);
}
