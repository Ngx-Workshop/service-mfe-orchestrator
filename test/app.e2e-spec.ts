import { Test } from '@nestjs/testing';
import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { RemoteAuthGuard, Role } from '@tmdjr/ngx-auth-client';
import type { Request } from 'express';
import type { Server } from 'node:http';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS callable Supertest.
import request = require('supertest');
import {
  MfeRemote,
  MfeRemoteType,
  StructuralOverrideMode,
} from '../src/mfe-remote/schemas/mfe-remote.schema';
import { CreateMfeRemoteDto } from '../src/mfe-remote/dto/create-mfe-remote.dto';
import { MfeRemoteService } from '../src/mfe-remote/mfe-remote.service';
import {
  configureObservability,
  createServiceLogger,
  currentRequestId,
} from '../src/observability/observability';

type LogEntry = {
  level: string;
  context: string;
  message: {
    event: string;
    operation: string;
    outcome: string;
    reason?: string;
    requestId?: string;
    operationId?: string;
    durationMs: number;
  };
};

function capture(stream: NodeJS.WriteStream) {
  return jest.spyOn(stream, 'write').mockImplementation(() => true);
}

describe('Remote contracts with real application guards and isolated storage', () => {
  let app: INestApplication<Server>;
  let service: MfeRemoteService;
  let stdout: ReturnType<typeof capture>;
  let stderr: ReturnType<typeof capture>;
  const exec = jest.fn();
  const save = jest.fn();
  const query = () => ({ exec });
  const storage = Object.assign(
    jest.fn(() => ({ save })),
    {
      find: jest.fn(query),
      findOne: jest.fn(query),
      findById: jest.fn(query),
      findByIdAndUpdate: jest.fn(query),
      findByIdAndDelete: jest.fn(query),
    }
  );
  const remote = {
    canActivate: jest.fn((context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest<Request>();
      const role = req.headers['x-test-role'];
      if (!role) return false;
      Object.assign(req, { user: { role } });
      return true;
    }),
  };
  const body: CreateMfeRemoteDto = {
    name: 'remote',
    remoteEntryUrl: 'https://example.com/remoteEntry.js',
    type: MfeRemoteType.STRUCTURAL,
    domains: [],
    structuralOverrides: {
      header: StructuralOverrideMode.DISABLED,
      nav: StructuralOverrideMode.COMPACT,
    },
  };

  beforeAll(async () => {
    const previous = process.env.GENERATE_OPENAPI;
    process.env.GENERATE_OPENAPI = 'true';
    try {
      const { AppModule } = await import('../src/app.module');
      const module = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(getModelToken(MfeRemote.name))
        .useValue(storage)
        .overrideProvider(RemoteAuthGuard)
        .useValue(remote)
        .compile();
      app = module.createNestApplication({ logger: false });
      service = module.get(MfeRemoteService);
      configureObservability(app);
      app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })
      );
      await app.init();
      app.useLogger(createServiceLogger());
    } finally {
      if (previous === undefined) delete process.env.GENERATE_OPENAPI;
      else process.env.GENERATE_OPENAPI = previous;
    }
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => {
    stdout = capture(process.stdout);
    stderr = capture(process.stderr);
    jest.clearAllMocks();
    exec
      .mockReset()
      .mockResolvedValue({ ...body, archived: false, version: 2 });
    save.mockReset().mockResolvedValue(body);
  });
  afterEach(() => {
    stdout.mockRestore();
    stderr.mockRestore();
  });
  function entries(): LogEntry[] {
    return [...stdout.mock.calls, ...stderr.mock.calls].map(
      (call) => JSON.parse(String(call[0])) as LogEntry
    );
  }

  it('keeps all reads public and ignores unrecognized archived values', async () => {
    for (const path of [
      '/mfe-remotes',
      '/mfe-remotes/domain/admin?archived=false',
      '/mfe-remotes/id',
      '/mfe-remotes/name/remote',
    ]) {
      await request(app.getHttpServer()).get(path).expect(200);
    }
    await request(app.getHttpServer())
      .get('/mfe-remotes?archived=other')
      .expect(200);
    expect(storage.find).toHaveBeenLastCalledWith({});
    expect(remote.canActivate).not.toHaveBeenCalled();
  });

  it.each([
    ['post', '/mfe-remotes'],
    ['patch', '/mfe-remotes/id'],
    ['delete', '/mfe-remotes/id'],
    ['patch', '/mfe-remotes/id/archive'],
    ['patch', '/mfe-remotes/id/unarchive'],
    ['patch', '/mfe-remotes/id/status'],
  ] as const)('guards %s %s before persistence', async (method, path) => {
    await request(app.getHttpServer())[method](path).send(body).expect(401);
    await request(app.getHttpServer())
      [method](path)
      .set('x-test-role', 'not-admin')
      .send(body)
      .expect(403);
    expect(storage).not.toHaveBeenCalled();
    expect(exec).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
  });

  it('preserves registration metadata and timestamps', async () => {
    const response = await request(app.getHttpServer())
      .post('/mfe-remotes')
      .set('x-test-role', Role.Admin)
      .send(body)
      .expect(201);
    expect(response.body).toEqual(body);
    expect(storage).toHaveBeenCalledWith({
      ...body,
      lastUpdated: expect.any(Date) as unknown,
    });
    await request(app.getHttpServer())
      .post('/mfe-remotes')
      .set('x-test-role', Role.Admin)
      .send({ ...body, domains: ['unknown'] })
      .expect(400);
    await request(app.getHttpServer())
      .get('/mfe-remotes/domain/unknown')
      .expect(400);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['archive', { archived: true }],
    ['unarchive', { archived: false }],
    ['status', { status: 'ready' }],
  ])('preserves %s update options and response', async (suffix, update) => {
    await request(app.getHttpServer())
      .patch(`/mfe-remotes/id/${suffix}`)
      .set('x-test-role', Role.Admin)
      .send(update)
      .expect(200);
    expect(storage.findByIdAndUpdate).toHaveBeenCalledWith(
      'id',
      { ...update, lastUpdated: expect.any(Date) as unknown },
      { new: true, runValidators: true }
    );
  });

  it('preserves duplicate, missing and storage-failure HTTP outcomes', async () => {
    save.mockRejectedValueOnce({ code: 11000 });
    const conflict = await request(app.getHttpServer())
      .post('/mfe-remotes')
      .set('x-test-role', Role.Admin)
      .send(body)
      .expect(409);
    expect(conflict.body).toMatchObject({
      message: 'MFE Remote with this name already exists',
    });
    exec.mockResolvedValueOnce(null);
    const missing = await request(app.getHttpServer())
      .get('/mfe-remotes/id')
      .expect(404);
    expect(missing.body).toMatchObject({
      message: 'MFE Remote with ID "id" not found',
    });
    exec.mockResolvedValueOnce(null);
    await request(app.getHttpServer())
      .patch('/mfe-remotes/id')
      .set('x-test-role', Role.Admin)
      .send({ archived: true })
      .expect(404);
    exec.mockResolvedValueOnce(null);
    await request(app.getHttpServer())
      .delete('/mfe-remotes/id')
      .set('x-test-role', Role.Admin)
      .expect(404);
    exec.mockRejectedValueOnce(new Error('private-storage-canary'));
    await request(app.getHttpServer())
      .patch('/mfe-remotes/id')
      .set('x-test-role', Role.Admin)
      .send({ archived: true })
      .expect(500);
    await request(app.getHttpServer())
      .delete('/mfe-remotes/id')
      .set('x-test-role', Role.Admin)
      .expect(204);
  });

  it('preserves anonymous GET/HEAD heartbeat with production guard wiring', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
    await request(app.getHttpServer()).head('/health').expect(200);
    expect(remote.canActivate).not.toHaveBeenCalled();
    expect(entries()).toEqual([]);
    await request(app.getHttpServer()).post('/health').expect(404);
  });

  it('correlates concurrent mutation/access JSON without logging untrusted data', async () => {
    const contexts: Array<string | undefined> = [];
    exec.mockImplementation(async () => {
      const id = currentRequestId();
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(currentRequestId()).toBe(id);
      contexts.push(id);
      return body;
    });
    const responses = await Promise.all(
      ['private-id-one', 'private-id-two'].map((id) =>
        request(app.getHttpServer())
          .patch(`/mfe-remotes/${id}/status`)
          .set('x-test-role', Role.Admin)
          .set('X-Request-ID', 'private-incoming-id')
          .set('Authorization', 'Bearer private-auth')
          .set('Cookie', 'private-cookie')
          .send({ status: 'private-status-content' })
          .expect(200)
      )
    );
    const ids = responses.map((response) => response.headers['x-request-id']);
    expect(new Set(ids).size).toBe(2);
    expect(contexts.sort()).toEqual([...ids].sort());
    const domain = entries().filter(
      (entry) => entry.message.event === 'mfe_remote_mutation'
    );
    expect(domain).toHaveLength(2);
    expect(new Set(domain.map((entry) => entry.message.operationId)).size).toBe(
      2
    );
    for (const entry of domain) {
      expect(entry).toMatchObject({
        level: 'log',
        context: 'MfeRemoteService',
        message: {
          operation: 'update',
          outcome: 'success',
          durationMs: expect.any(Number) as unknown,
        },
      });
      expect(ids).toContain(entry.message.requestId);
      expect(entry.message.operationId).toMatch(/^[0-9a-f-]{36}$/);
      expect(entry.message.durationMs).toBeGreaterThanOrEqual(10);
    }
    expect(
      entries().filter((entry) => entry.message.event === 'http_request')
    ).toHaveLength(2);
    expect(JSON.stringify(entries())).not.toContain('private-');
    expect(currentRequestId()).toBeUndefined();
  });

  it('logs safe failure categories and preserves storage error identity outside HTTP', async () => {
    const storageError = new Error('private-error-content');
    exec.mockRejectedValueOnce(storageError);
    await expect(
      service.update('private-id', { status: 'private-body' })
    ).rejects.toBe(storageError);
    exec.mockResolvedValueOnce(null);
    await expect(service.archive('private-id')).rejects.toMatchObject({
      status: 404,
    });
    save.mockRejectedValueOnce({ code: 11000, message: 'private-duplicate' });
    await expect(service.create(body)).rejects.toMatchObject({ status: 409 });
    const domain = entries().filter(
      (entry) => entry.message.event === 'mfe_remote_mutation'
    );
    expect(domain.map((entry) => [entry.level, entry.message.reason])).toEqual(
      expect.arrayContaining([
        ['error', 'storage_error'],
        ['warn', 'not_found'],
        ['warn', 'conflict'],
      ])
    );
    expect(domain).toHaveLength(3);
    expect(domain.every((entry) => entry.message.requestId === undefined)).toBe(
      true
    );
    expect(JSON.stringify(domain)).not.toContain('private-');
  });

  it('preserves the generic HTTP failure body without raw exception content or duplicate logs', async () => {
    exec.mockRejectedValueOnce(new Error('private-error-content'));
    const response = await request(app.getHttpServer())
      .patch('/mfe-remotes/private-id')
      .set('x-test-role', Role.Admin)
      .send({ description: 'private-body' })
      .expect(500);
    expect(response.body).toEqual({
      statusCode: 500,
      message: 'Internal server error',
    });
    const logs = entries();
    expect(logs).toHaveLength(2);
    expect(logs.every((entry) => entry.level === 'error')).toBe(true);
    expect(logs.map((entry) => entry.message.event)).toEqual([
      'mfe_remote_mutation',
      'http_request',
    ]);
    expect(logs[0].message.requestId).toBe(response.headers['x-request-id']);
    expect(JSON.stringify(logs)).not.toContain('private-');
  });

  it('preserves http-errors style responses without serializing extra error properties', async () => {
    exec.mockRejectedValueOnce({
      statusCode: 503,
      message: 'Unavailable',
      token: 'private-token',
    });
    const response = await request(app.getHttpServer())
      .patch('/mfe-remotes/id')
      .set('x-test-role', Role.Admin)
      .send({ archived: true })
      .expect(503);
    expect(response.body).toEqual({ statusCode: 503, message: 'Unavailable' });
    expect(JSON.stringify(entries())).not.toContain('private-');
  });
});
