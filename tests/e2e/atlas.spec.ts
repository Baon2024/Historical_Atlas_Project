import { test, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  // Exercise the local fallback without spending CARTO tile requests.
  await page.route('https://basemaps.cartocdn.com/**', (route) =>
    route.abort(),
  );
});

test('desktop globe, inspector, timeline and scenario navigation', async ({
  page,
}) => {
  const errors: string[] = [];

  page.on('pageerror', (error) => errors.push(error.message));

  await page.setViewportSize({ width: 1920, height: 1080 });

  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Mediterranean powers', exact: true }),
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: 'Roman Republic' }),
  ).toBeVisible();

  await expect(page.locator('[data-map-ready=true]')).toBeVisible({
    timeout: 45000,
  });

  await page.waitForTimeout(2500);

  await mkdir('.cache/qa', { recursive: true });

  await page.screenshot({ path: '.cache/qa/desktop.png' });

  await page.setViewportSize({ width: 1536, height: 1024 });

  await page.screenshot({ path: '.cache/qa/reference-size.png' });

  await page.setViewportSize({ width: 1920, height: 1080 });

  await page.waitForTimeout(150);

  await writeFile(
    '.cache/qa/normal-performance.json',
    JSON.stringify(
      await page.evaluate(() => ({
        fcp: performance.getEntriesByName('first-contentful-paint')[0]
          ?.startTime,
        mapReady: performance.getEntriesByName('epoch-map-ready')[0]?.startTime,
        viewport: `${innerWidth}×${innerHeight}`,
      })),
      null,
      2,
    ),
  );

  await page.mouse.move(1192, 412);

  await expect(page.getByRole('tooltip')).toHaveText('Roman Republic');

  await page.mouse.click(1192, 412);

  await expect(
    page.getByRole('region', { name: 'Roman Republic' }),
  ).toBeVisible();

  await page.mouse.click(1700, 790);

  await expect(
    page.getByRole('region', { name: 'Roman Republic' }),
  ).toHaveCount(0);

  await page.getByRole('button', { name: 'Roman Republic' }).click();

  await expect(
    page.getByRole('region', { name: 'Roman Republic' }),
  ).toBeVisible();

  await expect(
    page.getByRole('definition').filter({ hasText: 'Rome' }),
  ).toBeVisible();

  await page.waitForTimeout(1000);

  await page.screenshot({ path: '.cache/qa/inspector.png' });

  await page.keyboard.press('Escape');

  await expect(
    page.getByRole('region', { name: 'Roman Republic' }),
  ).toHaveCount(0);

  await page.getByRole('button', { name: 'Carthaginian Republic' }).click();

  await page.getByRole('button', { name: 'Next snapshot' }).click();

  await expect(
    page.getByRole('region', { name: 'Carthaginian Republic' }),
  ).toHaveCount(0);

  await expect(page.locator('.timeline-date')).toContainText('201 BCE');

  await page.getByRole('slider').focus();

  await page.keyboard.press('Home');

  await expect(page.locator('.timeline-date')).toContainText('264 BCE');

  await expect(
    page.getByRole('button', { name: 'Previous snapshot' }),
  ).toBeDisabled();

  await page.getByLabel('Choose a chapter').selectOption('eurasian-empires');

  await expect(
    page.getByRole('button', { name: 'Mongol Empire' }),
  ).toBeVisible();

  await expect(page.locator('.timeline-date')).toContainText('1,206 CE');

  await page.getByRole('button', { name: 'Mongol Empire' }).click();

  await expect(
    page.getByRole('region', { name: 'Mongol Empire' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Close territory inspector' }).click();

  await page.getByRole('button', { name: 'Reset globe view' }).click();

  await page.waitForTimeout(1000);

  await page.mouse.move(1250, 650);

  await page.mouse.down();

  await page.mouse.move(950, 650, { steps: 15 });

  await page.mouse.up();

  await page.screenshot({ path: '.cache/qa/rotated-globe.png' });

  expect(errors).toEqual([]);
});

test('mobile layout, collapsed chapter and bottom inspector', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.setViewportSize({ width: 375, height: 667 });

  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Mediterranean powers', exact: true }),
  ).toBeVisible();

  await expect(
    page.getByRole('button', { name: 'Roman Republic' }),
  ).not.toBeVisible();

  await expect(page.locator('[data-map-ready=true]')).toBeVisible({
    timeout: 45000,
  });

  await page.getByRole('button', { name: 'Expand chapter details' }).click();

  await page.getByRole('button', { name: 'Roman Republic' }).click();

  await expect(
    page.getByRole('region', { name: 'Roman Republic' }),
  ).toBeVisible();

  expect(
    await page
      .getByRole('region', { name: 'Roman Republic' })
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe('none');

  await page.waitForTimeout(1500);

  await page.screenshot({ path: '.cache/qa/mobile-inspector.png' });

  await page.getByRole('button', { name: 'Close territory inspector' }).click();

  await page.screenshot({ path: '.cache/qa/mobile.png' });

  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);

  await page.getByRole('button', { name: 'Next snapshot' }).click();

  await expect(page.locator('.timeline-date')).toContainText('201 BCE');
});

test('all demo snapshots work with dataset requests blocked', async ({
  page,
}) => {
  const datasetRequests: string[] = [];

  page.on('request', (request) => {
    if (/\/data\/(manifest\.json|scenarios\/)/.test(request.url())) {
      datasetRequests.push(request.url());
    }
  });

  await page.route('**/data/manifest.json', (route) => route.abort());

  await page.route('**/data/scenarios/**', (route) => route.abort());

  await page.goto('/');

  await expect(
    page.getByRole('button', { name: 'Roman Republic' }),
  ).toBeVisible();

  for (const year of ['264 BCE', '218 BCE', '201 BCE']) {
    await page.getByRole('button', { name: 'Show ' + year }).click();

    await expect(page.locator('.timeline-date')).toContainText(year);

    await expect(
      page.getByRole('button', { name: 'Roman Republic' }),
    ).toBeVisible();
  }

  await page.getByRole('button', { name: 'Roman Republic' }).click();

  await page.getByLabel('Choose a chapter').selectOption('eurasian-empires');

  await expect(
    page.getByRole('region', { name: 'Roman Republic' }),
  ).toHaveCount(0);

  for (const year of ['1,206 CE', '1,227 CE', '1,260 CE']) {
    await page.getByRole('button', { name: 'Show ' + year }).click();

    await expect(page.locator('.timeline-date')).toContainText(year);

    await expect(
      page.getByRole('button', { name: 'Mongol Empire' }),
    ).toBeVisible();
  }

  await page.getByRole('button', { name: 'Mongol Empire' }).click();

  await expect(
    page.getByRole('definition').filter({ hasText: 'Karakorum' }),
  ).toBeVisible();

  expect(datasetRequests).toEqual([]);
});

test('WebGL fallback retains keyboard territory exploration', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;

    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type === 'webgl2') return null;

      return original.apply(this, [type, ...args] as Parameters<
        typeof original
      >);
    } as typeof original;
  });

  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Your globe needs WebGL 2' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Roman Republic' }).click();

  await expect(
    page.getByRole('region', { name: 'Roman Republic' }),
  ).toBeVisible();
});

test('CARTO key setup and tile failures keep local geography usable', async ({
  page,
}) => {
  const tileRequests: string[] = [];

  const legacyRequests: string[] = [];

  page.on('request', (request) => {
    if (request.url().startsWith('https://basemaps.cartocdn.com/')) {
      tileRequests.push(request.url());
    }

    if (request.url().startsWith('https://tile.openstreetmap.org/')) {
      legacyRequests.push(request.url());
    }
  });

  await page.goto('/');

  await expect(page.getByRole('button', { name: 'Retry map' })).toBeVisible({
    timeout: 45000,
  });

  await expect(
    page.getByRole('button', { name: 'Roman Republic' }),
  ).toBeVisible();

  if (tileRequests.length === 0) {
    await expect(page.getByRole('alert')).toContainText(
      'Set NEXT_PUBLIC_CARTO_API_KEY in .env',
    );
  } else {
    expect(
      tileRequests.every((url) =>
        Boolean(new URL(url).searchParams.get('key')),
      ),
    ).toBe(true);
  }

  expect(legacyRequests).toEqual([]);
});
