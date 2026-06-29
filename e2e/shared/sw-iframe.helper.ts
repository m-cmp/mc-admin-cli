/**
 * SW Catalog iframe 공통 헬퍼
 *
 * mc-web-console SW Catalogs 페이지는 mc-application-manager-fe를
 * iframe (#targetIframe-sofrwareCatalog iframe) 으로 embed한다.
 * 이 헬퍼는 iframe 진입 후 지정 탭을 클릭하는 공통 로직을 제공한다.
 */
import type { Page, FrameLocator } from '@playwright/test';
import * as os from 'os';
import * as path from 'path';

/**
 * SW Catalogs iframe 에 진입하여 지정 탭을 클릭한다.
 *
 * @param page      Playwright Page
 * @param tabName   탭 텍스트를 매칭할 RegExp (예: /repository/i, /catalog/i)
 * @param tag       로그 식별자
 * @returns         iframe FrameLocator (실패 시 null)
 */
export async function gotoSwIframeTab(
  page: Page,
  tabName: RegExp,
  tag: string,
): Promise<FrameLocator | null> {
  // ── 1. Workspace 선택 ──
  const wsLoaded = await page.waitForFunction(
    () => {
      const sel = document.querySelector('#select-current-workspace') as HTMLSelectElement | null;
      return sel ? sel.options.length > 1 : false;
    },
    { timeout: 15_000 },
  ).then(() => true).catch(() => false);

  if (!wsLoaded) { console.warn(`[${tag}] Workspace 옵션 로드 실패`); return null; }

  await page.evaluate(() => {
    const sel = document.querySelector('#select-current-workspace') as HTMLSelectElement | null;
    if (!sel || sel.options.length < 2) return;
    sel.selectedIndex = 1;
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });

  // ── 2. Project 선택 ──
  const projLoaded = await page.waitForFunction(
    () => {
      const sel = document.querySelector('#select-current-project') as HTMLSelectElement | null;
      return sel ? sel.options.length > 1 : false;
    },
    { timeout: 15_000 },
  ).then(() => true).catch(() => false);

  if (!projLoaded) { console.warn(`[${tag}] Project 옵션 로드 실패`); return null; }

  // ── 3. sessionStorage에 workspace/project 설정 ──
  const sessionSet = await page.evaluate(() => {
    const wsSel   = document.querySelector('#select-current-workspace') as HTMLSelectElement | null;
    const projSel = document.querySelector('#select-current-project') as HTMLSelectElement | null;
    const wsApi   = (window as any).webconsolejs?.['common/api/services/workspace_api'];
    if (!wsSel || !projSel || !wsApi) return { ok: false, reason: 'missing elements or wsApi' };
    const wsOpt   = wsSel.options[wsSel.selectedIndex] || wsSel.options[1];
    const projOpt = Array.from(projSel.options).find((o: any) => o.value !== '') as HTMLOptionElement | undefined;
    if (!wsOpt?.value || !projOpt?.value)
      return { ok: false, reason: `wsVal=${wsOpt?.value} projVal=${projOpt?.value}` };
    const workspace = { Id: wsOpt.value, Name: wsOpt.text };
    const nsId      = projOpt.getAttribute('data-nsid') || projOpt.text;
    wsApi.setCurrentWorkspace(workspace);
    wsApi.setCurrentProject({ Id: projOpt.value, Name: projOpt.text, NsId: nsId });
    return { ok: true };
  }).catch((e: unknown) => ({ ok: false, reason: String(e) }));

  if (!sessionSet.ok) {
    console.warn(`[${tag}] session 설정 실패:`, (sessionSet as any).reason);
    return null;
  }

  // ── 3.5. HTTP→HTTPS 업그레이드 (app-manager-fe가 HTTPS 전용인 경우) ──
  // iframe.src setter를 패치하여 포트 18084의 HTTP URL을 HTTPS로 자동 업그레이드
  await page.addInitScript(() => {
    const desc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'src');
    if (desc && !(HTMLIFrameElement.prototype as any).__httpPatched) {
      (HTMLIFrameElement.prototype as any).__httpPatched = true;
      Object.defineProperty(HTMLIFrameElement.prototype, 'src', {
        set(value: string) {
          const fixed = value.replace(/^http:\/\/([^/]+):18084/, 'https://$1:18084');
          desc.set!.call(this, fixed);
        },
        get() { return desc.get!.call(this); },
        configurable: true,
      });
    }
  });

  await page.reload({ waitUntil: 'domcontentloaded' });

  // ── 4. iframe 로드 대기 ──
  const iframeEl      = page.locator('#targetIframe-sofrwareCatalog iframe').first();
  const iframePresent = await iframeEl.waitFor({ state: 'attached', timeout: 25_000 })
    .then(() => true).catch(() => false);
  if (!iframePresent) {
    console.warn(`[${tag}] iframe 미발견`);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-iframe-not-found.png`) }).catch(() => null);
    return null;
  }
  console.log(`[${tag}] iframe src: ${await iframeEl.getAttribute('src').catch(() => '')}`);

  // ── 5. SPA 렌더링 대기 ──
  const frame = page.frameLocator('#targetIframe-sofrwareCatalog iframe').first();
  const tabAreaLoaded = await frame.locator(
    'nav, [role="navigation"], [role="tab"], [class*="tab"], [class*="nav"], ul.nav, .menu, li'
  ).first().waitFor({ state: 'visible', timeout: 30_000 }).then(() => true).catch(() => false);

  if (!tabAreaLoaded) {
    console.warn(`[${tag}] SPA 렌더링 실패(30s)`);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-spa-not-loaded.png`) }).catch(() => null);
    return null;
  }

  // ── 6. 탭 클릭 ──
  const tab = frame.locator('[role="tab"], .nav-link, .nav-item, li, button, a')
    .filter({ hasText: tabName }).first();
  if (!await tab.isVisible({ timeout: 8_000 }).catch(() => false)) {
    const tabs = await frame
      .locator('[role="tab"], .nav-link, .nav-item, li')
      .allTextContents()
      .catch(() => [] as string[]);
    console.warn(`[${tag}] 탭 미발견 (${tabName}). 탭 목록: ${tabs.slice(0, 10).join(' | ')}`);
    await page.screenshot({ path: path.join(os.tmpdir(), `${tag}-tab-not-found.png`) }).catch(() => null);
    return null;
  }

  await tab.click();
  await page.waitForTimeout(1_000);
  console.log(`[${tag}] 탭 진입 완료 (${tabName})`);
  return frame;
}
