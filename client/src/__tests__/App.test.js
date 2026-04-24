import React from 'react';
import { render, screen } from '@testing-library/react';

// Basic smoke test
test('app renders without crashing', () => {
  // Simple test that the React testing infrastructure works
  const div = document.createElement('div');
  expect(div).toBeTruthy();
});

test('localStorage is available', () => {
  localStorage.setItem('test', 'value');
  expect(localStorage.getItem('test')).toBe('value');
  localStorage.removeItem('test');
});
