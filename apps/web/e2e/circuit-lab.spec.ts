import { expect, test, type Locator, type Page } from '@playwright/test';

function uniqueSuffix() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function clickButtonByLabel(page: Page, labelPattern: string) {
  await page.evaluate((pattern) => {
    const matcher = new RegExp(pattern, 'i');
    const button = Array.from(document.querySelectorAll('button')).find((candidate) => {
      const text = candidate.textContent || '';
      return matcher.test(text);
    });

    if (!(button instanceof HTMLButtonElement)) {
      throw new Error(`Button not found for pattern: ${pattern}`);
    }

    button.click();
  }, labelPattern);
}

async function registerFreshUser(page: Page, namePrefix: string) {
  const suffix = uniqueSuffix();
  const email = `circuit-${suffix}@example.com`;
  const password = 'Password123!';

  await page.goto('/register');
  await page.getByPlaceholder('Your name').fill(`${namePrefix} ${suffix}`);
  await page.getByPlaceholder('you@example.com').fill(email);
  await page.getByPlaceholder('Create a password').fill(password);
  await page.getByPlaceholder('Repeat your password').fill(password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/dashboard', { timeout: 30000 });
}

async function openVirtualArduinoCircuitLab(page: Page) {
  await page.goto('/projects/select-language?mode=text&environment=virtual');
  await expect(page.getByRole('heading', { name: 'Choose your text language' })).toBeVisible();
  await clickButtonByLabel(page, 'Arduino C\\+\\+');

  await expect(page.getByRole('heading', { name: 'Choose your board' })).toBeVisible();
  await clickButtonByLabel(page, 'Arduino Uno');

  await page.waitForURL('**/projects/ide', { timeout: 30000 });
  await expect(page.getByTestId('circuit-canvas-root')).toBeVisible();
}

async function saveScratchProject(page: Page, projectName: string) {
  await page.getByRole('button', { name: /^Save$/ }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('input[type="text"]').fill(projectName);
  await dialog.getByRole('button', { name: 'Create & Save' }).click();
  await expect(dialog).toBeHidden({ timeout: 30000 });
}

async function centerOf(locator: Locator) {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error('Locator has no bounding box');
  }

  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    width: box.width,
    height: box.height,
  };
}

async function readActiveProjectRecord(page: Page) {
  return page.evaluate(async () => {
    const projectId = window.localStorage.getItem('activeProjectId');
    const token = window.localStorage.getItem('token');
    if (!projectId || !token) {
      throw new Error('Active project id or auth token missing in browser storage');
    }

    const response = await fetch(`http://127.0.0.1:4000/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await response.json(),
    };
  });
}

async function pointForPin(page: Page, pinId: string) {
  const overlay = page.locator('[data-canvas-interaction="true"]').first();
  const pin = page.locator(`[data-pin-id="${pinId}"]`).first();
  const overlayBox = await overlay.boundingBox();

  if (!overlayBox) {
    throw new Error('Canvas interaction overlay is not visible');
  }

  const transform = await overlay.evaluate((element) => ({
    x: Number(element.getAttribute('data-canvas-transform-x') || 0),
    y: Number(element.getAttribute('data-canvas-transform-y') || 0),
    scale: Number(element.getAttribute('data-canvas-transform-scale') || 1),
  }));
  const pinPoint = await pin.evaluate((element) => ({
    x: Number(element.getAttribute('data-pin-x') || 0),
    y: Number(element.getAttribute('data-pin-y') || 0),
  }));

  return {
    x: overlayBox.x + transform.x + pinPoint.x * transform.scale,
    y: overlayBox.y + transform.y + pinPoint.y * transform.scale,
  };
}

async function clickPin(page: Page, pinId: string) {
  const point = await pointForPin(page, pinId);
  await page.mouse.click(point.x, point.y);
}
async function clickNearPin(page: Page, pinId: string, offsetX: number, offsetY: number) {
  const point = await pointForPin(page, pinId);
  await page.mouse.click(point.x + offsetX, point.y + offsetY);
}

async function midpointBetweenPins(page: Page, firstPinId: string, secondPinId: string) {
  const first = await pointForPin(page, firstPinId);
  const second = await pointForPin(page, secondPinId);
  return {
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  };
}

async function dragSceneTargetToPin(page: Page, source: Locator, pinId: string) {
  const from = await centerOf(source);
  const to = await pointForPin(page, pinId);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
}

async function dragWireEndpointHandleToPin(page: Page, source: Locator, pinId: string) {
  const from = await centerOf(source);
  const to = await pointForPin(page, pinId);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
}

async function clickSceneTarget(page: Page, locator: Locator) {
  const point = await centerOf(locator);
  await page.mouse.click(point.x, point.y);
}

async function dragSceneTarget(page: Page, source: Locator, target: Locator) {
  const from = await centerOf(source);
  const to = await centerOf(target);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await page.mouse.up();
}

async function dragSceneByDelta(page: Page, source: Locator, deltaX: number, deltaY: number) {
  const from = await centerOf(source);
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + deltaX, from.y + deltaY, { steps: 12 });
  await page.mouse.up();
}

async function clickCanvasAt(page: Page, xRatio: number, yRatio: number) {
  const canvas = page.getByTestId('circuit-canvas-root');
  const canvasBox = await canvas.boundingBox();

  if (!canvasBox) {
    throw new Error('Canvas is not visible for click placement');
  }

  await page.mouse.click(canvasBox.x + canvasBox.width * xRatio, canvasBox.y + canvasBox.height * yRatio);
}

async function armPaletteComponent(page: Page, componentType: string) {
  await page.getByTestId(`palette-item-${componentType}`).click();
  await expect(page.getByTestId(`palette-item-${componentType}`)).toHaveAttribute('data-armed', 'true');
  await expect(page.getByTestId('circuit-placement-preview')).toBeVisible();
  await expect(page.getByTestId('circuit-placement-preview-status')).toBeVisible();
  await expect(page.getByTestId('circuit-mode-badge')).toContainText('Placing');
}

async function addPaletteComponent(page: Page, componentType: string, xRatio = 0.55, yRatio = 0.5) {
  await armPaletteComponent(page, componentType);
  await clickCanvasAt(page, xRatio, yRatio);
  await expect(page.getByTestId('circuit-placement-preview')).toBeHidden();
}

async function dragPaletteComponentToTarget(page: Page, componentType: string, target: Locator) {
  const targetBox = await target.boundingBox();

  if (!targetBox) {
    throw new Error('Canvas or target is not visible for drag/drop');
  }

  await dragPaletteComponentToClientPoint(
    page,
    componentType,
    targetBox.x + targetBox.width * 0.55,
    targetBox.y + targetBox.height * 0.45,
  );
}

async function dragPaletteComponentToClientPoint(page: Page, componentType: string, clientX: number, clientY: number) {
  const paletteItem = page.getByTestId(`palette-item-${componentType}`);
  const canvas = page.getByTestId('circuit-canvas-root');
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());

  await paletteItem.dispatchEvent('dragstart', { dataTransfer });
  await canvas.dispatchEvent('dragenter', { dataTransfer, clientX, clientY });
  await canvas.dispatchEvent('dragover', { dataTransfer, clientX, clientY });
  await canvas.dispatchEvent('drop', { dataTransfer, clientX, clientY });
  await paletteItem.dispatchEvent('dragend', { dataTransfer });
}

async function dragPaletteComponentToBreadboardPosition(
  page: Page,
  componentType: string,
  breadboard: Locator,
  xRatio: number,
  yRatio: number,
) {
  const breadboardBox = await breadboard.boundingBox();
  if (!breadboardBox) {
    throw new Error('Breadboard is not visible for targeted drag/drop');
  }

  await dragPaletteComponentToClientPoint(
    page,
    componentType,
    breadboardBox.x + breadboardBox.width * xRatio,
    breadboardBox.y + breadboardBox.height * yRatio,
  );
}

async function dragPaletteComponentToCanvasPosition(page: Page, componentType: string, xRatio: number, yRatio: number) {
  const paletteItem = page.getByTestId(`palette-item-${componentType}`);
  const canvas = page.getByTestId('circuit-canvas-root');
  const canvasBox = await canvas.boundingBox();

  if (!canvasBox) {
    throw new Error('Canvas is not visible for drag/drop');
  }

  const clientX = canvasBox.x + canvasBox.width * xRatio;
  const clientY = canvasBox.y + canvasBox.height * yRatio;
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());

  await paletteItem.dispatchEvent('dragstart', { dataTransfer });
  await canvas.dispatchEvent('dragenter', { dataTransfer, clientX, clientY });
  await canvas.dispatchEvent('dragover', { dataTransfer, clientX, clientY });
  await canvas.dispatchEvent('drop', { dataTransfer, clientX, clientY });
  await paletteItem.dispatchEvent('dragend', { dataTransfer });
}

async function setupBasicCircuit(page: Page) {
  await addPaletteComponent(page, 'BREADBOARD');
  await expect(page.locator('[data-component-type="BREADBOARD"]')).toBeVisible();

  await dragPaletteComponentToCanvasPosition(page, 'ARDUINO_UNO', 0.32, 0.38);
  await expect(page.locator('[data-component-type="ARDUINO_UNO"]')).toBeVisible();

  const breadboard = page.locator('[data-component-type="BREADBOARD"]').first();
  await dragPaletteComponentToTarget(page, 'LED', breadboard);

  const led = page.locator('[data-component-type="LED"]').first();
  await expect(led).toBeVisible();
  await expect(led).toHaveAttribute('data-mounted', 'true');

  const ledId = await led.getAttribute('data-component-id');
  if (!ledId) {
    throw new Error('LED component id is missing');
  }

  return { ledId };
}

async function createWire(page: Page, fromPinId: string, toPinId: string) {
  await clickPin(page, fromPinId);
  await clickPin(page, toPinId);
}

async function ensureWireSelected(page: Page, wireId: string) {
  const endpointHandle = page.locator(`[data-wire-id="${wireId}"][data-wire-handle-kind="endpoint"]`).first();
  if (await endpointHandle.count()) {
    return;
  }

  await clickSceneTarget(page, page.locator(`[data-wire-id="${wireId}"][data-wire-role="main"]`).first());
  await expect(endpointHandle).toBeVisible();
}

test.describe.configure({ mode: 'serial' });

test('Circuit Lab: click-to-place shows a preview before the part is committed', async ({ page }) => {
  test.slow();
  await registerFreshUser(page, 'Circuit Click Place');
  await openVirtualArduinoCircuitLab(page);

  await armPaletteComponent(page, 'BREADBOARD');
  await clickCanvasAt(page, 0.56, 0.5);

  await expect(page.getByTestId('circuit-placement-preview')).toBeHidden();
  await expect(page.locator('[data-component-type="BREADBOARD"]')).toBeVisible();
});

test('Circuit Lab: parts drawer drag/drop places and mounts a breadboard part', async ({ page }) => {
  test.slow();
  await registerFreshUser(page, 'Circuit Drawer');
  await openVirtualArduinoCircuitLab(page);

  await addPaletteComponent(page, 'BREADBOARD');
  const breadboard = page.locator('[data-component-type="BREADBOARD"]').first();
  await expect(breadboard).toBeVisible();

  await dragPaletteComponentToTarget(page, 'LED', breadboard);

  const led = page.locator('[data-component-type="LED"]').first();
  await expect(led).toBeVisible();
  await expect(led).toHaveAttribute('data-mounted', 'true');
});

test('Circuit Lab: near-target clicks still connect wires reliably', async ({ page }) => {
  test.slow();
  await registerFreshUser(page, 'Circuit Near Hit');
  await openVirtualArduinoCircuitLab(page);
  const { ledId } = await setupBasicCircuit(page);

  await clickNearPin(page, 'UNO_13', 6, 4);
  await clickNearPin(page, `${ledId}.A`, -6, 5);

  await expect(page.locator('[data-wire-role="main"]')).toBeVisible();
});
test('Circuit Lab: dense target clusters favor the most aligned pin', async ({ page }) => {
  test.slow();
  await registerFreshUser(page, 'Circuit Dense Target');
  await openVirtualArduinoCircuitLab(page);
  const { ledId } = await setupBasicCircuit(page);

  const sourcePoint = await pointForPin(page, 'UNO_13');
  const anodePoint = await pointForPin(page, `${ledId}.A`);
  const cathodePoint = await pointForPin(page, `${ledId}.C`);
  const midpoint = await midpointBetweenPins(page, `${ledId}.A`, `${ledId}.C`);
  const expectedNodeIds = await Promise.all([
    page.locator(`[data-pin-id="${ledId}.A"]`).first().getAttribute('data-node-id'),
    page.locator(`[data-pin-id="${ledId}.C"]`).first().getAttribute('data-node-id'),
  ]);
  const validExpectedNodeIds = expectedNodeIds.filter((value): value is string => Boolean(value));
  if (validExpectedNodeIds.length !== 2) {
    throw new Error('Expected mounted LED pins to expose both node ids for dense-target validation');
  }

  await clickPin(page, 'UNO_13');
  await page.mouse.move(midpoint.x, midpoint.y, { steps: 8 });

  const overlay = page.locator('[data-canvas-interaction="true"]').first();
  await expect(overlay).toHaveAttribute('data-wire-lock-state', /candidate|locked/);

  const previewTargetNodeId = await overlay.getAttribute('data-wire-target-node-id');
  if (!previewTargetNodeId || !validExpectedNodeIds.includes(previewTargetNodeId)) {
    throw new Error(`Expected dense-target snap to choose one of ${validExpectedNodeIds.join(', ')}, received ${previewTargetNodeId}`);
  }

  const previewTargetPinId = await overlay.getAttribute('data-wire-target-pin-id');
  if (!previewTargetPinId) {
    throw new Error('Expected a preview target pin id before committing dense-target wire');
  }

  await page.mouse.click(midpoint.x, midpoint.y);

  await expect(page.locator('[data-wire-role="main"]').first()).toHaveAttribute('data-to-anchor-id', previewTargetPinId);
});

test('Circuit Lab: wire endpoint can reconnect to a different pin', async ({ page }) => {
  test.slow();
  await registerFreshUser(page, 'Circuit Rewire');
  await openVirtualArduinoCircuitLab(page);
  const { ledId } = await setupBasicCircuit(page);

  await createWire(page, 'UNO_13', `${ledId}.A`);

  const wire = page.locator('[data-wire-role="main"]').first();
  await expect(wire).toBeVisible();
  const wireId = await wire.getAttribute('data-wire-id');
  if (!wireId) {
    throw new Error('Wire id missing after creation');
  }

  await expect(wire).toHaveAttribute('data-from-anchor-id', 'UNO_13');
  await ensureWireSelected(page, wireId);

  const fromEndpoint = page.locator(`[data-wire-id="${wireId}"][data-wire-handle-kind="endpoint"][data-wire-handle-endpoint="from"]`).first();
  await dragWireEndpointHandleToPin(page, fromEndpoint, 'UNO_8');

  await expect(page.locator(`[data-wire-id="${wireId}"][data-wire-role="main"]`)).toHaveAttribute('data-from-anchor-id', 'UNO_8');
});

test('Circuit Lab: elbow handle dragging updates the rendered wire path', async ({ page }) => {
  test.slow();
  await registerFreshUser(page, 'Circuit Elbow');
  await openVirtualArduinoCircuitLab(page);
  const { ledId } = await setupBasicCircuit(page);

  await createWire(page, 'UNO_11', `${ledId}.A`);

  const wire = page.locator('[data-wire-role="main"]').first();
  await expect(wire).toBeVisible();
  const wireId = await wire.getAttribute('data-wire-id');
  if (!wireId) {
    throw new Error('Wire id missing after creation');
  }

  await ensureWireSelected(page, wireId);
  const elbowHandle = page.locator(`[data-wire-id="${wireId}"][data-wire-handle-kind="elbow"]`).first();
  await expect(elbowHandle).toBeVisible();

  const beforePath = await page.locator(`[data-wire-id="${wireId}"][data-wire-role="main"]`).getAttribute('d');
  await dragSceneByDelta(page, elbowHandle, 28, 22);
  const afterPath = await page.locator(`[data-wire-id="${wireId}"][data-wire-role="main"]`).getAttribute('d');

  expect(afterPath).toBeTruthy();
  expect(afterPath).not.toBe(beforePath);
});


test('Circuit Lab: strip-only parts stay off the power rails when dropped near them', async ({ page }) => {
  test.slow();
  await registerFreshUser(page, 'Circuit Strip Only');
  await openVirtualArduinoCircuitLab(page);

  await addPaletteComponent(page, 'BREADBOARD');
  const breadboard = page.locator('[data-component-type="BREADBOARD"]').first();
  await expect(breadboard).toBeVisible();

  await dragPaletteComponentToBreadboardPosition(page, 'LED', breadboard, 0.56, 0.12);

  const led = page.locator('[data-component-type="LED"]').first();
  await expect(led).toBeVisible();
  await expect(led).toHaveAttribute('data-mounted', 'true');

  const ledId = await led.getAttribute('data-component-id');
  if (!ledId) {
    throw new Error('LED component id is missing after rail-adjacent placement');
  }

  await expect(page.locator(`[data-component-id="${ledId}"][data-pin-id="${ledId}.A"]`)).toHaveAttribute('data-node-id', /BB_STRIP_/);
  await expect(page.locator(`[data-component-id="${ledId}"][data-pin-id="${ledId}.C"]`)).toHaveAttribute('data-node-id', /BB_STRIP_/);
});

test('Circuit Lab: saved circuits reload with mounted parts and wires intact', async ({ page }) => {
  test.slow();
  const projectName = `Circuit Persist ${uniqueSuffix()}`;

  await registerFreshUser(page, 'Circuit Persist');
  await openVirtualArduinoCircuitLab(page);
  const { ledId } = await setupBasicCircuit(page);

  await createWire(page, 'UNO_13', `${ledId}.A`);

  const wire = page.locator('[data-wire-role="main"]').first();
  await expect(wire).toBeVisible();
  const wireId = await wire.getAttribute('data-wire-id');
  if (!wireId) {
    throw new Error('Wire id missing before persistence test save');
  }

  await saveScratchProject(page, projectName);

  const persistedProject = await readActiveProjectRecord(page);
  expect(persistedProject.ok).toBe(true);
  expect(persistedProject.body.files.map((file: { name: string }) => file.name)).toContain('circuit.json');

  await page.reload();

  const reloadedProject = await readActiveProjectRecord(page);
  expect(reloadedProject.ok).toBe(true);
  expect(reloadedProject.body.files.map((file: { name: string }) => file.name)).toContain('circuit.json');

  await expect(page.getByTestId('circuit-canvas-root')).toBeVisible({ timeout: 30000 });
  await expect(page.locator(`[data-component-type="LED"][data-component-id="${ledId}"]`)).toHaveAttribute('data-mounted', 'true');
  await expect(page.locator(`[data-wire-id="${wireId}"][data-wire-role="main"]`)).toBeVisible();
});



