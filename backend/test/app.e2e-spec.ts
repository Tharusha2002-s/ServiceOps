import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';

describe('ServiceOps Enterprise ITSM API (Supertest E2E + OWASP Security)', () => {
  let app: INestApplication;
  let empToken: string;
  let adminToken: string;

  beforeAll(async () => {
    process.env.REDIS_ENABLED = 'false';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
    app.use(cookieParser('test-cookie-secret'));
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();

    const empLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'employee@serviceops.local', password: 'Password@123' })
      .expect(200);
    empToken = empLogin.body.data.accessToken;

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin@serviceops.local', password: 'Password@123' })
      .expect(200);
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health & /metrics expose live DB readiness, Prometheus telemetry & Helmet headers', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.components?.database?.status).toBe('healthy');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();

    const metricsRes = await request(app.getHttpServer()).get('/metrics').expect(200);
    expect(metricsRes.text).toContain('serviceops_up 1');
    expect(metricsRes.text).toContain('serviceops_tickets_total');
  });

  it('enforces unauthenticated 401 and employee RBAC 403 boundaries', async () => {
    await request(app.getHttpServer()).get('/api/v1/tickets').expect(401);
    await request(app.getHttpServer())
      .get('/api/v1/reports/summary')
      .set('Authorization', `Bearer ${empToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${empToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/api/v1/settings')
      .set('Authorization', `Bearer ${empToken}`)
      .expect(403);
  });

  it('rejects mass-assignment / role injection via ValidationPipe on self-registration (BR-001)', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'evil.e2e@serviceops.local',
        password: 'Password@123',
        firstName: 'Evil',
        lastName: 'User',
        role: 'SYSTEM_ADMINISTRATOR',
      })
      .expect(400);
  });

  it('serves authenticated Knowledge Base, Notifications, Reports & Audit Chain', async () => {
    const kbRes = await request(app.getHttpServer())
      .get('/api/v1/knowledge')
      .set('Authorization', `Bearer ${empToken}`)
      .expect(200);
    expect(kbRes.body.data.every((a: any) => a.status === 'PUBLISHED')).toBe(true);

    const notifRes = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${empToken}`)
      .expect(200);
    expect(typeof notifRes.body.data.unreadCount).toBe('number');

    await request(app.getHttpServer())
      .get('/api/v1/reports/summary?range=7d')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const auditVerify = await request(app.getHttpServer())
      .get('/api/v1/audit/verify')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(auditVerify.body.data.intact).toBe(true);
  });
});
