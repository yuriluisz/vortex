import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getLatestDeployment,
  pollDeployment,
  pollHealthcheck,
  verifyDeployment
} from '../../scripts/verify-deploy.mjs';

describe('verify-deploy script', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('getLatestDeployment should parse tRPC response and find latest action', async () => {
    const mockActions = [
      {
        id: 'action-1',
        projectName: 'prod',
        serviceName: 'vortex',
        type: 'deployment',
        status: 'done',
        createdAt: '2026-09-14 10:00:00',
      },
      {
        id: 'action-2',
        projectName: 'other',
        serviceName: 'vortex',
        type: 'deployment',
        status: 'done',
        createdAt: '2026-09-14 10:05:00',
      }
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ json: mockActions }),
    } as unknown as Response);

    const result = await getLatestDeployment({
      baseUrl: 'http://137.131.189.41:3000',
      apiKey: 'test-token',
      projectName: 'prod',
      serviceName: 'vortex',
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe('action-1');
    expect(result?.status).toBe('done');
  });

  it('pollDeployment should wait until status is done', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      const status = callCount >= 2 ? 'done' : 'pending';
      return {
        ok: true,
        status: 200,
        json: async () => ({
          json: [
            {
              id: 'deploy-123',
              projectName: 'prod',
              serviceName: 'vortex',
              type: 'deployment',
              status,
            }
          ]
        })
      };
    });

    const result = await pollDeployment({
      baseUrl: 'http://137.131.189.41:3000',
      apiKey: 'test-token',
      projectName: 'prod',
      serviceName: 'vortex',
      maxWaitMs: 5000,
      pollIntervalMs: 10,
    });

    expect(result.status).toBe('done');
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  it('pollDeployment should throw if deployment fails with error status', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        json: [
          {
            id: 'deploy-error',
            projectName: 'prod',
            serviceName: 'vortex',
            type: 'deployment',
            status: 'error',
          }
        ]
      })
    });

    await expect(
      pollDeployment({
        baseUrl: 'http://137.131.189.41:3000',
        apiKey: 'test-token',
        projectName: 'prod',
        serviceName: 'vortex',
        maxWaitMs: 1000,
        pollIntervalMs: 10,
      })
    ).rejects.toThrow(/Deployment failed on Easypanel with status 'error'/);
  });

  it('pollHealthcheck should retry until 200 OK', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return {
        ok: callCount >= 2,
        status: callCount >= 2 ? 200 : 502,
      };
    });

    const ok = await pollHealthcheck({
      appUrl: 'https://vortexpages.online',
      maxWaitMs: 2000,
      pollIntervalMs: 10,
    });

    expect(ok).toBe(true);
    expect(callCount).toBe(2);
  });

  it('verifyDeployment should orchestrate deployment poll and healthcheck successfully', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('trpc')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            json: [
              {
                id: 'deploy-complete',
                projectName: 'prod',
                serviceName: 'vortex',
                type: 'deployment',
                status: 'done',
              }
            ]
          })
        };
      }
      return {
        ok: true,
        status: 200,
      };
    });

    const success = await verifyDeployment({
      baseUrl: 'http://137.131.189.41:3000',
      apiKey: 'test-token',
      projectName: 'prod',
      serviceName: 'vortex',
      appUrl: 'https://vortexpages.online',
      maxWaitMs: 2000,
      pollIntervalMs: 10,
    });

    expect(success).toBe(true);
  });
});
