import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { useContainer, validate } from 'class-validator';
import { CreateFileDto } from './create-file.dto';
import { CreateFolderDto } from './create-folder.dto';
import { NameMaxLengthConstraint } from './decorators/name-max-length.constraint';

const MAX_LENGTH = 10;
const VALID_UUID = '3f1c2a8e-5b7d-4c1e-9a2b-6d8f0e1a2b3c';

const FORBIDDEN_CHARS_MESSAGE = 'Name must not contain "/" or "\\" and must not be "." or ".."';
const EXTENSION_MESSAGE = 'File name must have an extension, e.g. "report.pdf"';
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

    it('does not require an extension for folders', async () => {
      await expect(errorsFor(CreateFolderDto, { name: 'v1.2' })).resolves.toEqual([]);
    });

    it('trims surrounding whitespace', () => {
      const instance = plainToInstance(CreateFolderDto, { name: '  reports  ' });

      expect(instance.name).toBe('reports');
    });

    it.each(['', '   '])('rejects an empty name (%j)', async (name) => {
      expect((await errorsFor(CreateFolderDto, { name })).length).toBeGreaterThan(0);
    });

    it.each(['a/b', 'a\\b', '.', '..'])('rejects the forbidden name %j', async (name) => {
      await expect(errorsFor(CreateFolderDto, { name })).resolves.toContain(
        FORBIDDEN_CHARS_MESSAGE,
      );
    });

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
    it.each(['report.pdf', 'a.tar.gz', 'IMG.JPG'])('accepts %j', async (name) => {
      await expect(errorsFor(CreateFileDto, { name, parentId: VALID_UUID })).resolves.toEqual([]);
    });

    it.each(['report', 'report.', '.env', 'a.toolongextension', 'a.p df'])(
      'rejects %j because it has no valid extension',
      async (name) => {
        await expect(
          errorsFor(CreateFileDto, { name, parentId: VALID_UUID }),
        ).resolves.toContain(EXTENSION_MESSAGE);
      },
    );

    it('applies the shared name rules too', async () => {
      await expect(
        errorsFor(CreateFileDto, { name: 'a/b.txt', parentId: VALID_UUID }),
      ).resolves.toContain(FORBIDDEN_CHARS_MESSAGE);
    });

    it('requires a parent folder', async () => {
      expect((await errorsFor(CreateFileDto, { name: 'a.txt' })).length).toBeGreaterThan(0);
      expect(
        (await errorsFor(CreateFileDto, { name: 'a.txt', parentId: null })).length,
      ).toBeGreaterThan(0);
    });
  });
});
