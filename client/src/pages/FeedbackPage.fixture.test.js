import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FeedbackPage from './FeedbackPage';

jest.mock('axios');

test('renders all 15 project seed feedback rows from a paginated API payload', async () => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  const source = fs.readFileSync(path.resolve(__dirname, '../../../server/seed.js'), 'utf8');
  const block = source.match(/const feedbackData = \[([\s\S]*?)\n    \];/)[1];
  const subjects = [...block.matchAll(/subject: '([^']+)'/g)].map((match) => match[1]);
  expect(subjects).toHaveLength(15);
  axios.get.mockResolvedValue({ data: { data: subjects.map((subject, i) => ({ id: i + 1, subject, type: 'suggestion', rating: 5, status: 'open' })), pagination: { page: 1, limit: 20, total: 15 } } });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(<FeedbackPage />); });
  expect(container.querySelectorAll('tbody tr')).toHaveLength(15);
  for (const subject of subjects) expect(container.textContent).toContain(subject);
  await act(async () => { root.unmount(); });
  expect(errors).not.toHaveBeenCalled();
  errors.mockRestore();
  container.remove();
});
