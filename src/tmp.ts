import * as fs from 'fs'
import * as os from 'os'
import { join } from 'path'

export const tmpfile = () => _tmp(_file)
export const tmpdir = () => _tmp(_dir)

export type Tmp = {
    path: string;
    fd?: number;
}

function _file(path: string): Promise<Tmp> {
    const { O_CREAT, O_EXCL, O_RDWR } = fs.constants;
    return new Promise((resolve, reject) => {
        fs.open(path, O_CREAT | O_EXCL | O_RDWR, 0o600, (err, fd) => {
            if (err) {
                reject(err);
            }
            else {
                resolve({ path, fd })
            }
        });
    });
}

function _dir(path: string): Promise<Tmp> {
    return new Promise((resolve, reject) => {
        fs.mkdir(path, 0o700, (err) => {
            if (err) {
                reject(err);
            }
            else {
                resolve({ path })
            }
        });
    });
}

export const config = {
    randomName,
    nameLength: 8,
    maxRetry: 3,
};

const _tmp = async (create: (path: string) => Promise<Tmp>) => {
    let lastError = null;
    for (let i = 0; i < config.maxRetry; i++) {
        const path = join(os.tmpdir(), config.randomName(config.nameLength));
        try {
            const tmp = await create(path);
            return tmp;
        }
        catch (err) {
            lastError = err;
        }
    }
    throw lastError;
}

export function randomName(length: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (var i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
