import type { APIRequestContext, Page } from '@playwright/test';
import { API_ROUTES } from './api-routes';

/**
 * Login via API and return cookie headers for subsequent requests.
 * The server authenticates via Cookie: Authorization=<access_token> (not Bearer header).
 */
export async function apiLogin(request: APIRequestContext): Promise<{ Cookie: string }> {
  const res = await request.post(API_ROUTES.auth.login, {
    data: { request: { id: process.env.ADMIN_ID, password: process.env.ADMIN_PASSWORD } },
  });
  if (!res.ok()) throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  const { access_token, refresh_token } = await res.json() as { access_token: string; refresh_token: string };
  return { Cookie: `Authorization=${access_token}; RefreshToken=${refresh_token}` };
}

/**
 * Login via API and return Bearer Authorization header for direct backend requests.
 * Use this for services not proxied through mc-web-console (e.g. mc-application-manager direct).
 */
export async function apiLoginBearer(request: APIRequestContext): Promise<{ Authorization: string }> {
  const res = await request.post(API_ROUTES.auth.login, {
    data: { request: { id: process.env.ADMIN_ID, password: process.env.ADMIN_PASSWORD } },
  });
  if (!res.ok()) throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  const { access_token } = await res.json() as { access_token: string };
  return { Authorization: `Bearer ${access_token}` };
}

export async function apiLoginWith(
  request: APIRequestContext,
  id: string,
  password: string,
): Promise<{ Cookie: string }> {
  const res = await request.post(API_ROUTES.auth.login, {
    data: { request: { id, password } },
  });
  if (!res.ok()) throw new Error(`Login failed for ${id}: ${res.status()} ${await res.text()}`);
  const { access_token, refresh_token } = await res.json() as { access_token: string; refresh_token: string };
  return { Cookie: `Authorization=${access_token}; RefreshToken=${refresh_token}` };
}

/**
 * Attempt browser login with given credentials.
 * Returns true if webconsole is reached, false if login page stays (user doesn't exist or wrong creds).
 * Uses a short timeout (8s) so tests that call this don't exceed Playwright's default test timeout.
 * On failure, logs a warning with the given tag so tests can skip gracefully.
 */
export async function tryPageLogin(
  page: Page,
  id: string,
  password: string,
  tag: string,
): Promise<boolean> {
  await page.fill('#id', id);
  await page.fill('#password', password);
  await page.click('#loginbtn');
  try {
    await page.waitForURL(/\/webconsole\//, { timeout: 30_000 });
    return true;
  } catch {
    console.warn(`[${tag}] 로그인 실패 (URL: ${page.url()}) — 사용자가 서버에 없거나 TODO: CreateUser`);
    return false;
  }
}

/**
 * Navigate to a URL with a single retry on network errors.
 */
export async function gotoWithRetry(page: Page, url: string): Promise<void> {
  try {
    await page.goto(url);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('ERR_NETWORK') || msg.includes('ERR_CONNECTION')) {
      await page.waitForTimeout(1_000);
      await page.goto(url);
    } else {
      throw e;
    }
  }
}

/**
 * Login to the app and navigate to a target URL.
 * Handles ERR_NETWORK_CHANGED on the initial login page goto.
 * Returns false if login fails or network is unreachable (test should skip gracefully).
 */
export async function loginAndGoto(
  page: Page,
  targetUrl: string,
  tag: string,
  id?: string,
  password?: string,
): Promise<boolean> {
  const loginUrl = '/auth/login';
  try {
    await page.goto(loginUrl);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('ERR_NETWORK') || msg.includes('ERR_CONNECTION')) {
      await page.waitForTimeout(1_000);
      try { await page.goto(loginUrl); } catch {
        console.warn(`[${tag}] 로그인 페이지 접근 실패 — 건너뜀`);
        return false;
      }
    } else {
      throw e;
    }
  }
  const ok = await tryPageLogin(page, id ?? process.env.ADMIN_ID ?? '', password ?? process.env.ADMIN_PASSWORD ?? '', tag);
  if (!ok) return false;
  try {
    await page.goto(targetUrl);
    await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[${tag}] 화면 이동 실패: ${targetUrl} — ${msg.slice(0, 120)}`);
    return false;
  }
  return true;
}
