import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';

describe('Items API', () => {
  let app: INestApplication;

  beforeAll(() => {
    expect(process.env.DB_DRIVER).toBe('memory');
  });

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app); 
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  const createFolder = async (name: string, parentId?: string): Promise<{ id: string }> => {
    const res = await http().post('/folders').send({ name, parentId }).expect(201);
    return res.body as { id: string };
  };

  const createFile = async (name: string, parentId: string): Promise<{ id: string }> => {
    const res = await http().post('/files').send({ name, parentId }).expect(201);
    return res.body as { id: string };
  };

  describe('POST /folders', () => {
    it('creates a top-level folder', async () => {
      const res = await http().post('/folders').send({ name: 'docs' }).expect(201);

      expect(res.body).toMatchObject({ name: 'docs', type: 'folder', parentId: null });
      expect(res.body.id).toEqual(expect.any(String));
    });

    it('returns 409 for a duplicate name', async () => {
      await createFolder('docs');

      await http().post('/folders').send({ name: 'docs' }).expect(409);
    });

    it('treats names as case-sensitive', async () => {
      await createFolder('Docs');

      await http().post('/folders').send({ name: 'docs' }).expect(201);
    });

    it('returns 400 for an invalid name', async () => {
      const res = await http().post('/folders').send({ name: 'a/b' }).expect(400);

      expect(res.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('letters, numbers, spaces and hyphens')]),
      );
    });

    it('returns 400 for unknown properties', async () => {
      await http().post('/folders').send({ name: 'docs', type: 'file' }).expect(400);
    });

    it('returns 404 when the parent does not exist', async () => {
      await http().post('/folders').send({ name: 'docs', parentId: randomUUID() }).expect(404);
    });
  });

  describe('POST /files', () => {
    it('creates a file inside a folder', async () => {
      const folder = await createFolder('docs');

      const res = await http()
        .post('/files')
        .send({ name: 'report.pdf', parentId: folder.id })
        .expect(201);

      expect(res.body).toMatchObject({ name: 'report.pdf', type: 'file', parentId: folder.id });
    });

    it('returns 400 without a parent folder', async () => {
      await http().post('/files').send({ name: 'a.txt' }).expect(400);
    });

    it('returns 400 when the file has no extension', async () => {
      const docs = await createFolder('docs');

      await http().post('/files').send({ name: 'report', parentId: docs.id }).expect(400);
    });

    it('returns 400 when the parent is a file', async () => {
      const docs = await createFolder('docs');
      const file = await createFile('a.txt', docs.id);

      await http().post('/folders').send({ name: 'nested', parentId: file.id }).expect(400);
    });
  });

  describe('GET /items', () => {
    it('lists the top level and a folder separately', async () => {
      const docs = await createFolder('docs');
      await createFile('inside.txt', docs.id);
      await createFolder('other');

      const topLevel = await http().get('/items').expect(200);
      const inside = await http().get('/items').query({ parentId: docs.id }).expect(200);

      expect(topLevel.body.map((n: { name: string }) => n.name)).toEqual(['docs', 'other']);
      expect(inside.body.map((n: { name: string }) => n.name)).toEqual(['inside.txt']);
    });

    it('returns 400 for a parentId that is not a UUID', async () => {
      await http().get('/items').query({ parentId: 'abc' }).expect(400);
    });

    it('returns 404 for an unknown folder', async () => {
      await http().get('/items').query({ parentId: randomUUID() }).expect(404);
    });
  });

  describe('GET /items/:id/ancestors', () => {
    it('returns the folders from the top level down to the folder', async () => {
      const docs = await createFolder('docs');
      const sub = await createFolder('sub', docs.id);

      const res = await http().get(`/items/${sub.id}/ancestors`).expect(200);

      expect(res.body.map((item: { name: string }) => item.name)).toEqual(['docs', 'sub']);
    });

    it('returns 404 for an unknown folder', async () => {
      await http().get(`/items/${randomUUID()}/ancestors`).expect(404);
    });
  });

  describe('DELETE /items/:id', () => {
    it('returns 204 and deletes a folder with everything inside it', async () => {
      const docs = await createFolder('docs');
      const sub = await createFolder('sub', docs.id);
      await createFile('deep.txt', sub.id);

      await http().delete(`/items/${docs.id}`).expect(204);

      const topLevel = await http().get('/items').expect(200);
      expect(topLevel.body).toEqual([]);
      await http().get('/items').query({ parentId: sub.id }).expect(404);
    });

    it('returns 404 for an unknown id', async () => {
      await http().delete(`/items/${randomUUID()}`).expect(404);
    });

    it('returns 400 for an id that is not a UUID', async () => {
      await http().delete('/items/abc').expect(400);
    });
  });

  describe('GET /files/search', () => {
    it('finds files by exact name, optionally inside a folder', async () => {
      const docs = await createFolder('docs');
      const other = await createFolder('other');
      await createFile('report.pdf', other.id);
      await createFile('report.pdf', docs.id);

      const everywhere = await http().get('/files/search').query({ name: 'report.pdf' }).expect(200);
      const inDocs = await http()
        .get('/files/search')
        .query({ name: 'report.pdf', parentId: docs.id })
        .expect(200);

      expect(everywhere.body).toHaveLength(2);
      expect(inDocs.body).toHaveLength(1);
      expect(inDocs.body[0]).toMatchObject({ name: 'report.pdf', parentId: docs.id });
    });

    it('is case-sensitive', async () => {
      const docs = await createFolder('docs');
      await createFile('Report.pdf', docs.id);

      const res = await http().get('/files/search').query({ name: 'report.pdf' }).expect(200);

      expect(res.body).toEqual([]);
    });

    it('returns 400 without a name', async () => {
      await http().get('/files/search').expect(400);
    });

    it('returns 404 for an unknown folder', async () => {
      await http().get('/files/search').query({ name: 'a.txt', parentId: randomUUID() }).expect(404);
    });
  });

  describe('GET /files/suggestions', () => {
    it('returns files starting with the prefix, limited to SEARCH_LIMIT', async () => {
      const docs = await createFolder('docs');
      const limit = Number(process.env.SEARCH_LIMIT ?? 10);
      for (let i = 0; i < limit + 2; i++) {
        await createFile(`note-${String(i).padStart(3, '0')}.txt`, docs.id);
      }
      await createFile('other.txt', docs.id);

      const res = await http().get('/files/suggestions').query({ prefix: 'note-' }).expect(200);

      expect(res.body).toHaveLength(limit);
      expect(res.body[0].name).toBe('note-000.txt');
    });

    it('limits suggestions to a folder', async () => {
      const docs = await createFolder('docs');
      const other = await createFolder('other');
      await createFile('report.pdf', other.id);
      await createFile('report-in.txt', docs.id);

      const res = await http()
        .get('/files/suggestions')
        .query({ prefix: 'report', parentId: docs.id })
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('report-in.txt');
    });

    it('returns 400 without a prefix', async () => {
      await http().get('/files/suggestions').expect(400);
      await http().get('/files/suggestions').query({ prefix: '' }).expect(400);
    });
  });
});
