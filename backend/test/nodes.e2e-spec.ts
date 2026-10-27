import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';

describe('Nodes API (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => {
    //  test against the in-memory repository, whatever the .env says
    process.env.DB_DRIVER = 'memory';
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

      expect(res.body.message).toEqual(expect.arrayContaining([expect.stringContaining('"/"')]));
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

    it('returns 400 when the file has no extension', async () => {
      await http().post('/files').send({ name: 'report' }).expect(400);
    });

    it('returns 400 when the parent is a file', async () => {
      const file = await http().post('/files').send({ name: 'a.txt' }).expect(201);

      await http()
        .post('/folders')
        .send({ name: 'docs', parentId: (file.body as { id: string }).id })
        .expect(400);
    });
  });

  describe('GET /nodes', () => {
    it('lists the top level and a folder separately', async () => {
      const docs = await createFolder('docs');
      await http().post('/files').send({ name: 'inside.txt', parentId: docs.id }).expect(201);
      await http().post('/files').send({ name: 'root.txt' }).expect(201);

      const topLevel = await http().get('/nodes').expect(200);
      const inside = await http().get('/nodes').query({ parentId: docs.id }).expect(200);

      expect(topLevel.body.map((n: { name: string }) => n.name)).toEqual(['docs', 'root.txt']);
      expect(inside.body.map((n: { name: string }) => n.name)).toEqual(['inside.txt']);
    });

    it('returns 400 for a parentId that is not a UUID', async () => {
      await http().get('/nodes').query({ parentId: 'abc' }).expect(400);
    });

    it('returns 404 for an unknown folder', async () => {
      await http().get('/nodes').query({ parentId: randomUUID() }).expect(404);
    });
  });

  describe('DELETE /nodes/:id', () => {
    it('returns 204 and deletes a folder with everything inside it', async () => {
      const docs = await createFolder('docs');
      const sub = await createFolder('sub', docs.id);
      await http().post('/files').send({ name: 'deep.txt', parentId: sub.id }).expect(201);

      await http().delete(`/nodes/${docs.id}`).expect(204);

      const topLevel = await http().get('/nodes').expect(200);
      expect(topLevel.body).toEqual([]);
      await http().get('/nodes').query({ parentId: sub.id }).expect(404);
    });

    it('returns 404 for an unknown id', async () => {
      await http().delete(`/nodes/${randomUUID()}`).expect(404);
    });

    it('returns 400 for an id that is not a UUID', async () => {
      await http().delete('/nodes/abc').expect(400);
    });
  });
});
