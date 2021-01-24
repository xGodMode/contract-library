import fs from 'fs';
import path from 'path';
import { handleRequest } from './utils';

const OUTPUT_DIR = path.join(process.cwd(), './build/protocols');
const PROTOCOL_LIST_PATH = path.join(__dirname, '../build/protocols.txt');

/**
 * Downloads compiled contracts in GM protocol files from github and installs
 * them into a project
 * @param protocols List of protocol names
 */
export async function installer(protocols?: string[] | undefined) {
    console.log('Installing protocols for GM...');
    try {
        await fs.promises.mkdir(OUTPUT_DIR, { recursive: true });
    } catch (err) {
        if (err.code != 'EEXIST') throw err;
    }
    const allProtocolNames = await getAllProtocolNames();
    if (protocols == undefined) {
        protocols = allProtocolNames;
    }
    await Promise.all(protocols.map(handleProtocol));
    function handleProtocol(protocolName: string): Promise<void> {
        try {
            if (!allProtocolNames.includes(protocolName)) {
                throw Error('No protocol with that name exists');
            }
            return install(protocolName);
        } catch (error) {
            console.error(
                `Failed to install protocol ${protocolName}:`,
                error.message
            );
        }
    }
    console.log('Done!');
}

async function getAllProtocolNames(): Promise<Array<string>> {
    const list = await fs.promises.readFile(PROTOCOL_LIST_PATH);
    return list
        .toString()
        .split('\n')
        .map((name: string) => {
            return name.split('.json')[0];
        });
}

async function install(protocolName: string) {
    const protocolFilePath = path.join(OUTPUT_DIR, protocolName + '.json');
    const protocolUrl = `https://raw.githubusercontent.com/xGodMode/contract-library/main/build/protocols/${protocolName}.json`;
    const protocol = await handleRequest(protocolUrl, { json: true });
    await fs.promises.writeFile(
        protocolFilePath,
        JSON.stringify(protocol, null, 4)
    );
    console.log('Saved', protocolName, 'to', protocolFilePath);
}
