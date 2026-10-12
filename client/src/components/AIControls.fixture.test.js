import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import AIWorkspace, { workspaceFields } from './AIWorkspace';
import AIReport from './AIReport';
import features from './aiWorkspaceFeatures.json';

async function render(element) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(element); });
  return { container, root };
}

test('all workspace examples fill every field without generation', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  const requests = [];
  global.fetch = jest.fn(async (url, options) => {
    requests.push({ url, method: options?.method || 'GET' });
    return { ok: true, json: async () => ({ items: [] }) };
  });
  const { container, root } = await render(<AIWorkspace feature={features[0]} />);
  const buttons = [...container.querySelectorAll('.ai-preset-bar button')];
  expect(buttons).toHaveLength(3);
  for (const button of buttons) {
    await act(async () => { button.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    for (const field of workspaceFields) expect(container.querySelector(`#${features[0].id}-${field.key}`).value).not.toBe('');
  }
  expect(requests.every((request) => request.method === 'GET')).toBe(true);
  expect(errors).not.toHaveBeenCalled();
  await act(async () => { root.unmount(); });
  errors.mockRestore();
  container.remove();
});

test('returned and saved structured reports show labels, facts, and table rows', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const result = { findings: { viable: false, sample_size: 0, note: '' }, comparisons: [{ team: 'Home', edge: 0 }, { team: 'Away', edge: 1 }] };
  for (const response of [result, { id: 1, result_json: result }]) {
    const { container, root } = await render(<AIReport response={response} />);
    expect(container.textContent).toContain('Findings');
    expect(container.textContent).toContain('Viable');
    expect(container.textContent).toContain('No');
    expect(container.textContent).toContain('0');
    expect(container.textContent).toContain('Empty string');
    expect(container.querySelectorAll('tbody tr')).toHaveLength(2);
    await act(async () => { root.unmount(); });
    container.remove();
  }
});
