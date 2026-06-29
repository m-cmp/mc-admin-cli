/**
 * mc-data-manager 포털(iframe) 로딩 헬퍼
 *
 * mc-web-console(https://15.164.139.37:3001) → Data Migration iframe → mc-data-manager-fe(:3300)
 */
import type { Frame } from '@playwright/test';

export {
  loadDataFrame,
  clickServiceTab,
  fillField,
  submitAndCheckResult,
} from '../../../shared/data-iframe.helper';

/** iframe src에 mc-data-manager 포트가 포함됐는지 확인 */
export async function assertDataManagerIframe(
  page: import('@playwright/test').Page,
  tag: string,
): Promise<boolean> {
  const iframeEl = page.locator('#targetIframe iframe').first();
  const attached = await iframeEl.waitFor({ state: 'attached', timeout: 15_000 })
    .then(() => true).catch(() => false);

  if (!attached) {
    console.warn(`[${tag}] iframe 미로드 — workspace/project 미선택 또는 mc-data-manager-fe URL 미설정`);
    return false;
  }

  const src = await iframeEl.getAttribute('src') || '';
  console.log(`[${tag}] iframe src: ${src}`);
  return /3300/.test(src);
}

type CredOption = { value: string; text: string };

/** credential 드롭다운 옵션 목록 */
export async function listCredentialOptions(
  frame: Frame,
  selector = '#targetCredentialSelect',
): Promise<CredOption[]> {
  const credSelect = frame.locator(selector);
  if (await credSelect.count() === 0) return [];
  return credSelect.evaluate(
    (e) => Array.from((e as HTMLSelectElement).options)
      .filter(o => o.value !== 'none' && o.value !== '')
      .map(o => ({ value: o.value, text: o.text })),
  );
}

/**
 * Tumblebug/등록 credential 선택
 * @param filterKeywords — 옵션 text에 포함될 키워드 (소문자 비교)
 */
export async function selectRegisteredCredential(
  frame: Frame,
  page: import('@playwright/test').Page,
  tag: string,
  filterKeywords: string[],
  selector = '#targetCredentialSelect',
): Promise<CredOption | null> {
  const opts = await listCredentialOptions(frame, selector);
  if (opts.length === 0) {
    console.warn(`[${tag}] credential 옵션 없음`);
    return null;
  }

  const lowered = filterKeywords.map(k => k.toLowerCase());
  const matched = opts.filter(o =>
    lowered.some(kw => o.text.toLowerCase().includes(kw)),
  );
  const pick = matched[0] ?? opts[0];
  await frame.locator(selector).selectOption(pick.value);
  await page.waitForTimeout(1500);
  console.log(`[${tag}] credential 선택: ${pick.text} (${pick.value})`);
  return pick;
}
