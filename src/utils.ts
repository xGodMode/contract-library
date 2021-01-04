import https from 'https';

import MemoryStream from 'memorystream';

export async function handleRequest(
    url: string,
    options: { json?: boolean; stream?: boolean } = {}
): Promise<string | object | MemoryStream> {
    return new Promise((resolve, reject) => {
        const memoryStream = new MemoryStream(null, { readable: false });
        const req = https.get(url, (res) => {
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
