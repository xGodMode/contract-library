import https from 'https';

import MemoryStream from 'memorystream';

import { HTTPError } from '@xgm/error-codes';

export async function handleRequest(
    url: string,
    options: { readable?: boolean; json?: boolean; stream?: boolean } = {}
): Promise<string | object | MemoryStream> {
    return new Promise((resolve, reject) => {
        const memoryStream = new MemoryStream(null, {
            readable: options.readable || false,
        });
        const req = https.get(url, (res) => {
            if (res.statusCode >= 400) {
                throw HTTPError(
                    res.statusCode,
                    `${url} ${res.statusCode} ${res.statusMessage}`
                );
            }

            res.setEncoding('utf8');

            res.pipe(memoryStream);

            res.on('end', () => {
                if (options.json) {
                    resolve(JSON.parse(memoryStream.toString()));
                } else if (options.stream) {
                    resolve(memoryStream);
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
