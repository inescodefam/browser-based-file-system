import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { NodeType } from './domain/node';
import { InMemoryNodeRepository } from './infrastructure/in-memory-node.repository';
import { NodesService } from './nodes.service';

describe('NodesService', () => {
  let service: NodesService;

  beforeEach(() => {
    service = new NodesService(new InMemoryNodeRepository());
  });

  describe('create', () => {
    it('creates a top-level folder', async () => {
      const folder = await service.createFolder({ name: 'docs' });

      expect(folder).toMatchObject({ name: 'docs', type: NodeType.FOLDER, parentId: null });
    });

    it('creates a file inside a folder', async () => {
      const folder = await service.createFolder({ name: 'docs' });

      const file = await service.createFile({ name: 'a.txt', parentId: folder.id });

      expect(file).toMatchObject({ name: 'a.txt', type: NodeType.FILE, parentId: folder.id });
    });

    it('treats parentId null like a top-level node', async () => {
      const folder = await service.createFolder({ name: 'docs', parentId: null });

      expect(folder.parentId).toBeNull();
    });

    it('throws 409 Conflict for a duplicate name in the same folder', async () => {
      await service.createFolder({ name: 'docs' });

      await expect(service.createFile({ name: 'docs' })).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('lets only one of two concurrent identical requests succeed', async () => {
      const results = await Promise.allSettled([
        service.createFolder({ name: 'race' }),
        service.createFolder({ name: 'race' }),
      ]);

      const rejected = results.filter((r) => r.status === 'rejected');
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(rejected).toHaveLength(1);
      expect(rejected[0].reason).toBeInstanceOf(ConflictException);
    });

    it('throws 404 Not Found when the parent does not exist', async () => {
      await expect(
        service.createFolder({ name: 'docs', parentId: 'missing-id' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws 400 Bad Request when the parent is a file', async () => {
      const file = await service.createFile({ name: 'a.txt' });

      await expect(
        service.createFolder({ name: 'docs', parentId: file.id }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('listChildren', () => {
    it('lists the top level and a folder separately', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      await service.createFile({ name: 'inside.txt', parentId: docs.id });
      await service.createFile({ name: 'root.txt' });

      const topLevel = await service.listChildren(null);
      const inside = await service.listChildren(docs.id);

      expect(topLevel.map((n) => n.name)).toEqual(['docs', 'root.txt']);
      expect(inside.map((n) => n.name)).toEqual(['inside.txt']);
    });

    it('puts folders first, then sorts by name', async () => {
      await service.createFile({ name: 'b.txt' });
      await service.createFolder({ name: 'z-folder' });
      await service.createFile({ name: 'a.txt' });
      await service.createFolder({ name: 'a-folder' });

      const names = (await service.listChildren(null)).map((n) => n.name);

      expect(names).toEqual(['a-folder', 'z-folder', 'a.txt', 'b.txt']);
    });

    it('throws 404 for an unknown folder', async () => {
      await expect(service.listChildren('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws 400 when the id belongs to a file', async () => {
      const file = await service.createFile({ name: 'a.txt' });

      await expect(service.listChildren(file.id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('delete', () => {
    it('deletes a folder and everything inside it', async () => {
      const docs = await service.createFolder({ name: 'docs' });
      const sub = await service.createFolder({ name: 'sub', parentId: docs.id });
      await service.createFile({ name: 'deep.txt', parentId: sub.id });

      await expect(service.delete(docs.id)).resolves.toBeUndefined();

      expect(await service.listChildren(null)).toEqual([]);
      await expect(service.listChildren(docs.id)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws 404 for an unknown id', async () => {
      await expect(service.delete('missing-id')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
