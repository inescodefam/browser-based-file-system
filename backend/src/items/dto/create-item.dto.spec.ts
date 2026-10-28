import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { useContainer, validate } from 'class-validator';
import { CreateFileDto } from './create-file.dto';
import { CreateFolderDto } from './create-folder.dto';
import {
  FILE_EXTENSION_MESSAGE,
  NAME_CHARS_MESSAGE,
} from './decorators/item-fields.decorators';
import { NameMaxLengthConstraint } from './decorators/name-max-length.constraint';

const MAX_LENGTH = 10;
const VALID_UUID = '3f1c2a8e-5b7d-4c1e-9a2b-6d8f0e1a2b3c';

const MAX_LENGTH_MESSAGE = `Name must be at most ${MAX_LENGTH} characters long.`;

async function errorsFor<T extends object>(
  dto: new () => T,
  payload: Record<string, unknown>,
): Promise<string[]> {
  const instance = plainToInstance(dto, payload);
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
  return errors.flatMap((error) => Object.values(error.constraints ?? {}));
}

describe('create item DTOs', () => {
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ NAME_MAX_LENGTH: MAX_LENGTH })],
        }),
      ],
      providers: [NameMaxLengthConstraint],
    }).compile();
    useContainer(moduleRef, { fallbackOnErrors: true });
  });

  describe('CreateFolderDto', () => {
    it('accepts a valid name with and without a parent', async () => {
      await expect(errorsFor(CreateFolderDto, { name: 'reports' })).resolves.toEqual([]);
      await expect(
        errorsFor(CreateFolderDto, { name: 'reports', parentId: VALID_UUID }),
      ).resolves.toEqual([]);
      await expect(
        errorsFor(CreateFolderDto, { name: 'reports', parentId: null }),
      ).resolves.toEqual([]);
    });

    it('accepts hyphens and spaces, and does not require an extension', async () => {
      await expect(errorsFor(CreateFolderDto, { name: 'folder-1' })).resolves.toEqual([]);
      await expect(errorsFor(CreateFolderDto, { name: 'my docs' })).resolves.toEqual([]);
    });

    it('rejects a dot in a folder name', async () => {
      await expect(errorsFor(CreateFolderDto, { name: 'v1.2' })).resolves.toContain(
        NAME_CHARS_MESSAGE,
      );
    });

    it('trims surrounding whitespace', () => {
      const instance = plainToInstance(CreateFolderDto, { name: '  reports  ' });

      expect(instance.name).toBe('reports');
    });

    it.each(['', '   '])('rejects an empty name (%j)', async (name) => {
      expect((await errorsFor(CreateFolderDto, { name })).length).toBeGreaterThan(0);
    });

    it.each(['a/b', 'a\\b', '.', '..', "folder's", 'folder"1"', 'folder{1}'])(
      'rejects the forbidden name %j',
      async (name) => {
        await expect(errorsFor(CreateFolderDto, { name })).resolves.toContain(NAME_CHARS_MESSAGE);
      },
    );

    it('enforces NAME_MAX_LENGTH', async () => {
      await expect(
        errorsFor(CreateFolderDto, { name: 'a'.repeat(MAX_LENGTH) }),
      ).resolves.toEqual([]);
      await expect(
        errorsFor(CreateFolderDto, { name: 'a'.repeat(MAX_LENGTH + 1) }),
      ).resolves.toContain(MAX_LENGTH_MESSAGE);
    });

    it('rejects a missing or non-string name', async () => {
      expect((await errorsFor(CreateFolderDto, {})).length).toBeGreaterThan(0);
      expect((await errorsFor(CreateFolderDto, { name: 42 })).length).toBeGreaterThan(0);
    });

    it('rejects a parentId that is not a UUID', async () => {
      expect(
        (await errorsFor(CreateFolderDto, { name: 'reports', parentId: 'abc' })).length,
      ).toBeGreaterThan(0);
    });

    it('rejects unknown properties', async () => {
      expect(
        (await errorsFor(CreateFolderDto, { name: 'reports', type: 'file' })).length,
      ).toBeGreaterThan(0);
    });
  });

  describe('CreateFileDto', () => {
    it.each(['report.pdf', 'note-1.txt', 'IMG.JPG'])('accepts %j', async (name) => {
      await expect(errorsFor(CreateFileDto, { name, parentId: VALID_UUID })).resolves.toEqual([]);
    });

    it.each(['report', 'report.', 'a.toolongextension'])(
      'rejects %j because it has no valid extension',
      async (name) => {
        await expect(
          errorsFor(CreateFileDto, { name, parentId: VALID_UUID }),
        ).resolves.toContain(FILE_EXTENSION_MESSAGE);
      },
    );

    it.each(['a/b.txt', "f'.txt", 'f{1}.txt', 'a.tar.gz', '.env'])(
      'rejects the forbidden file name %j',
      async (name) => {
        await expect(
          errorsFor(CreateFileDto, { name, parentId: VALID_UUID }),
        ).resolves.toContain(NAME_CHARS_MESSAGE);
      },
    );

    it('requires a parent folder', async () => {
      expect((await errorsFor(CreateFileDto, { name: 'a.txt' })).length).toBeGreaterThan(0);
      expect(
        (await errorsFor(CreateFileDto, { name: 'a.txt', parentId: null })).length,
      ).toBeGreaterThan(0);
    });
  });
});
