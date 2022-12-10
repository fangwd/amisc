import * as fs from 'fs';
import * as os from 'os';
import { basename, join } from 'path'

import { config, tmpfile, tmpdir } from './tmp'

const defaultRandomName = config.randomName;

afterEach(() => config.randomName = defaultRandomName);

describe('tmpfile', () => {
    it('should create a temporary file', async () => {
        const tmp = await tmpfile();
        expect(fs.lstatSync(tmp.path).isFile());
    });

    it('should retry on conflicts', async () => {
        let i = 0;
        config.randomName = () => ['1', '1', '2', '2', '3'][i++]
        const names = ['1', '2', '3']
        names.forEach((name) => {
          const path = join(os.tmpdir(), name);
          try {
            if (fs.lstatSync(path).isFile()) {
              fs.unlinkSync(path);
            }
          } catch (err) {
            // ENOENT
          }
        });
        const result = await Promise.all([tmpfile(), tmpfile(), tmpfile()])
        for (const tmp of result) {
            expect(fs.lstatSync(tmp.path).isFile());
        }
        expect(result.map(t => basename(t.path)).sort()).toEqual(names)
    });

    it('should throw on too many conflicts', async () => {
        const t = 't';
        fs.writeFileSync(join(os.tmpdir(), t), 't');
        const names: string[] = []
        for (let i = 0; i < config.maxRetry; i++) {
            names.push(t)
        }
        let i = 0;
        config.randomName = () => names[i++]
        await expect(tmpfile()).rejects.toThrow();
    });
})

describe('tmpdir', () => {
    it('should create a temporary directory', async () => {
        const tmp = await tmpdir();
        expect(fs.lstatSync(tmp.path).isDirectory());
    });
});
