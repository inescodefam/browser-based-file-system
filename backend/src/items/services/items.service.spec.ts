import { ConfigService } from '@nestjs/config';
import { ItemType } from '../domain/item';
import {
  ItemAlreadyExistsError,
  ItemNotFoundError,
  ParentIsNotFolderError,
  ParentNotFoundError,
} from '../domain/item.errors';
import { InMemoryItemRepository } from '../infrastructure/in-memory-item.repository';
import { ItemsService } from './items.service';

const SEARCH_LIMIT = 3;

describe('ItemsService', () => {
  let service: ItemsService;

  beforeEach(() => {
    service = new ItemsService(
      new InMemoryItemRepository(),
      new ConfigService({ SEARCH_LIMIT }),
    );
  });

  describe('create', () => {
    it('creates a top-level folder', async () => {
      const folder = await service.createFolder({ name: 'docs' });

      expect(folder).toMatchObject({ name: 'docs', type: ItemType.FOLDER, parentId: null });
    });

    it('creates a file inside a folder', async () => {
      const folder = await service.createFolder({ name: 'docs' });

      const file = await service.createFile({ name: 'a.txt', parentId: folder.id });

      expect(file).toMatchObject({ name: 'a.txt', type: ItemType.FILE, parentId: folder.id });
    });

    it('treats parentId null like a top-level folder', async () => {
      const folder = await service.createFolder({ name: 'docs', parentId: null });

      expect(folder.parentId).toBeNull();
    });

    it('throws ItemAlreadyExistsError for a duplicate name in the same folder', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      await service.createFolder({ name: 'sub', parentId: docs.id });

      await expect(
        service.createFile({ name: 'sub', parentId: docs.id }),
      ).rejects.toBeInstanceOf(ItemAlreadyExistsError);
    });

    it('lets only one of two concurrent identical requests succeed', async () => {
      const results = await Promise.allSettled([
        service.createFolder({ name: 'race' }),
        service.createFolder({ name: 'race' }),
      ]);

      const rejected = results.filter((r) => r.status === 'rejected');
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toBeInstanceOf(ItemAlreadyExistsError);
    });

    it('throws ParentNotFoundError when the parent does not exist', async () => {
      await expect(
        service.createFolder({ name: 'docs', parentId: 'missing-id' }),
      ).rejects.toBeInstanceOf(ParentNotFoundError);
    });

    it('throws ParentIsNotFolderError when the parent is a file', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      const file = await service.createFile({ name: 'a.txt', parentId: docs.id });

      await expect(
        service.createFolder({ name: 'nested', parentId: file.id }),
      ).rejects.toBeInstanceOf(ParentIsNotFolderError);
    });
  });

  describe('listChildren', () => {
    it('lists the top level and a folder separately', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      await service.createFile({ name: 'inside.txt', parentId: docs.id });
      await service.createFolder({ name: 'other' });

      const topLevel = await service.listChildren(null);
      const inside = await service.listChildren(docs.id);

      expect(topLevel.map((n) => n.name)).toEqual(['docs', 'other']);
      expect(inside.map((n) => n.name)).toEqual(['inside.txt']);
    });

    it('puts folders first, then sorts by name', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      await service.createFile({ name: 'b.txt', parentId: docs.id });
      await service.createFolder({ name: 'z-folder', parentId: docs.id });
      await service.createFile({ name: 'a.txt', parentId: docs.id });
      await service.createFolder({ name: 'a-folder', parentId: docs.id });

      const names = (await service.listChildren(docs.id)).map((n) => n.name);

      expect(names).toEqual(['a-folder', 'z-folder', 'a.txt', 'b.txt']);
    });

    it('throws ParentNotFoundError for an unknown folder', async () => {
      await expect(service.listChildren('missing-id')).rejects.toBeInstanceOf(
        ParentNotFoundError,
      );
    });

    it('throws ParentIsNotFolderError when the id belongs to a file', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      const file = await service.createFile({ name: 'a.txt', parentId: docs.id });

      await expect(service.listChildren(file.id)).rejects.toBeInstanceOf(
        ParentIsNotFolderError,
      );
    });
  });

  describe('getAncestors', () => {
    it('returns the folders from the top level down to the folder', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      const sub = await service.createFolder({ name: 'sub', parentId: docs.id });

      const ancestors = await service.getAncestors(sub.id);

      expect(ancestors.map((item) => item.id)).toEqual([docs.id, sub.id]);
    });

    it('throws ItemNotFoundError for an unknown id', async () => {
      await expect(service.getAncestors('missing-id')).rejects.toBeInstanceOf(ItemNotFoundError);
    });

    it('throws ParentIsNotFolderError when the id belongs to a file', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      const file = await service.createFile({ name: 'a.txt', parentId: docs.id });

      await expect(service.getAncestors(file.id)).rejects.toBeInstanceOf(ParentIsNotFolderError);
    });
  });

  describe('delete', () => {
    it('deletes a folder and everything inside it', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      const sub = await service.createFolder({ name: 'sub', parentId: docs.id });
      await service.createFile({ name: 'deep.txt', parentId: sub.id });

      await expect(service.delete(docs.id)).resolves.toBeUndefined();

      expect(await service.listChildren(null)).toEqual([]);
      await expect(service.listChildren(docs.id)).rejects.toBeInstanceOf(ParentNotFoundError);
    });

    it('throws ItemNotFoundError for an unknown id', async () => {
      await expect(service.delete('missing-id')).rejects.toBeInstanceOf(ItemNotFoundError);
    });
  });

  describe('findFilesByName', () => {
    it('finds files by exact name everywhere', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      const other = await service.createFolder({ name: 'other' });
      await service.createFile({ name: 'report.pdf', parentId: other.id });
      await service.createFile({ name: 'report.pdf', parentId: docs.id });

      const found = await service.findFilesByName('report.pdf', null);

      expect(found).toHaveLength(2);
    });

    it('limits the search to a folder and its subfolders', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      const sub = await service.createFolder({ name: 'sub', parentId: docs.id });
      const other = await service.createFolder({ name: 'other' });
      await service.createFile({ name: 'x.txt', parentId: sub.id });
      await service.createFile({ name: 'x.txt', parentId: other.id });

      const found = await service.findFilesByName('x.txt', docs.id);

      expect(found).toHaveLength(1);
      expect(found[0].parentId).toBe(sub.id);
    });

    it('is case-sensitive', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      await service.createFile({ name: 'Report.pdf', parentId: docs.id });

      await expect(service.findFilesByName('report.pdf', null)).resolves.toEqual([]);
    });

    it('throws ParentNotFoundError for an unknown folder', async () => {
      await expect(service.findFilesByName('x.txt', 'missing-id')).rejects.toBeInstanceOf(
        ParentNotFoundError,
      );
    });

    it('throws ParentIsNotFolderError when the folder is a file', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      const file = await service.createFile({ name: 'a.txt', parentId: docs.id });

      await expect(service.findFilesByName('x.txt', file.id)).rejects.toBeInstanceOf(
        ParentIsNotFolderError,
      );
    });
  });

  describe('suggestFiles', () => {
    it('returns files starting with the prefix, ordered by name', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      await service.createFile({ name: 'report-b.txt', parentId: docs.id });
      await service.createFile({ name: 'report-a.txt', parentId: docs.id });
      await service.createFile({ name: 'other.txt', parentId: docs.id });

      const names = (await service.suggestFiles('report')).map((n) => n.name);

      expect(names).toEqual(['report-a.txt', 'report-b.txt']);
    });

    it('returns at most SEARCH_LIMIT results', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      for (const name of ['f1.txt', 'f2.txt', 'f3.txt', 'f4.txt', 'f5.txt']) {
        await service.createFile({ name, parentId: docs.id });
      }

      const suggestions = await service.suggestFiles('f');

      expect(suggestions).toHaveLength(SEARCH_LIMIT);
    });

    it('limits suggestions to a folder and its subfolders', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      const other = await service.createFolder({ name: 'other' });
      await service.createFile({ name: 'report.pdf', parentId: other.id });
      await service.createFile({ name: 'report-in.txt', parentId: docs.id });

      const names = (await service.suggestFiles('report', docs.id)).map((n) => n.name);

      expect(names).toEqual(['report-in.txt']);
    });
  });
});
