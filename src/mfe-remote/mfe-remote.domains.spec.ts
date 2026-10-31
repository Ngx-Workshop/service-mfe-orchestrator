import {
  BadRequestException,
  ParseEnumPipe,
  ValidationPipe,
} from '@nestjs/common';
import { model } from 'mongoose';
import { CreateMfeRemoteDto } from './dto/create-mfe-remote.dto';
import { UpdateMfeRemoteDto } from './dto/update-mfe-remote.dto';
import { MfeRemoteController } from './mfe-remote.controller';
import { MfeRemoteService } from './mfe-remote.service';
import { MfeRemoteDomain, MfeRemoteSchema } from './schemas/mfe-remote.schema';

const { ADMIN, WORKSHOP } = MfeRemoteDomain;

describe('remote domains', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  const body = {
    name: 'Remote',
    remoteEntryUrl: 'https://example.com/remoteEntry.js',
    type: 'user-journey',
  };

  it.each(
    [[ADMIN], [WORKSHOP], [ADMIN, WORKSHOP], []].map((domains) => ({ domains }))
  )('accepts domain selection $domains', async ({ domains }) => {
    await expect(
      pipe.transform(
        { ...body, domains },
        { type: 'body', metatype: CreateMfeRemoteDto }
      )
    ).resolves.toBeDefined();
  });

  it.each(
    [null, 'admin', ['unknown'], ['admin', 'admin']].map((domains) => ({
      domains,
    }))
  )(
    'rejects invalid domains $domains on create and update',
    async ({ domains }) => {
      for (const metatype of [CreateMfeRemoteDto, UpdateMfeRemoteDto]) {
        await expect(
          pipe.transform({ ...body, domains }, { type: 'body', metatype })
        ).rejects.toBeInstanceOf(BadRequestException);
      }
    }
  );

  it('allows omitted domains for old clients without synthesizing a stored array', async () => {
    await expect(
      pipe.transform(body, { type: 'body', metatype: CreateMfeRemoteDto })
    ).resolves.toBeDefined();
    const Remote = model('DomainSchemaTest', MfeRemoteSchema);
    expect(new Remote(body).domains).toBeUndefined();
    expect(new Remote({ ...body, domains: [] }).domains).toEqual([]);
    expect(
      new Remote({ ...body, domains: ['unknown'] }).validateSync()
    ).toBeDefined();
  });

  it('validates domain parameters and forwards the archive filter', async () => {
    const enumPipe = new ParseEnumPipe<unknown>(MfeRemoteDomain);
    await expect(
      enumPipe.transform('unknown', { type: 'param' })
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(enumPipe.transform(ADMIN, { type: 'param' })).resolves.toBe(
      ADMIN
    );
    const service = { findByDomain: jest.fn() };
    const controller = new MfeRemoteController(
      service as unknown as MfeRemoteService
    );
    controller.findByDomain(ADMIN, 'false');
    controller.findByDomain(WORKSHOP);
    expect(service.findByDomain.mock.calls).toEqual([
      [ADMIN, false],
      [WORKSHOP, undefined],
    ]);
  });

  it.each([ADMIN, WORKSHOP])(
    'queries explicit membership and only falls back for missing domains: %s',
    async (domain) => {
      const records = [{ domains: [domain] }];
      const find = jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(records) });
      const service = new MfeRemoteService({ find } as any);
      expect(await service.findByDomain(domain, false)).toBe(records);
      expect(find).toHaveBeenCalledWith({
        archived: false,
        $or: [
          { domains: domain },
          {
            domains: { $exists: false },
            ...(domain === ADMIN
              ? { $or: [{ isAdmin: true }, { type: 'structural' }] }
              : { isAdmin: { $ne: true } }),
          },
        ],
      });
      await service.findByDomain(domain);
      expect(find.mock.calls[1][0]).not.toHaveProperty('archived');
    }
  );
});
