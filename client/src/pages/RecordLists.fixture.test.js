import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import BettingAnalyzer from './BettingAnalyzer';
import FantasyOptimizer from './FantasyOptimizer';
import GameStrategy from './GameStrategy';
import EsportsTracker from './EsportsTracker';
import RefereeAssistant from './RefereeAssistant';
import Favorites from './Favorites';
import Notifications from './Notifications';

jest.mock('axios');
const seed = fs.readFileSync(path.resolve(__dirname, '../../../server/seed.js'), 'utf8');
const cases = [
  [BettingAnalyzer, 'bettingData', 'match_name', '/api/betting', 'tbody tr', 16],
  [FantasyOptimizer, 'fantasyTeams', 'team_name', '/api/fantasy', 'tbody tr', 16],
  [GameStrategy, 'strategies', 'strategy_name', '/api/strategy', 'tbody tr', 16],
  [EsportsTracker, 'esportsStats', 'player_name', '/api/esports', 'tbody tr', 16],
  [RefereeAssistant, 'refereeIncidents', 'match_name', '/api/referee', 'tbody tr', 16],
  [Favorites, 'favorites', 'entity_name', '/api/favorites', 'tbody tr', 15],
  [Notifications, 'notifications', 'title', '/api/notifications', '.card-clickable', 15],
];

test.each(cases)('%p shows project fixture rows with paginated API data', async (Component, fixture, nameKey, endpoint, selector, expected) => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const errors = jest.spyOn(console, 'error').mockImplementation(() => {});
  const block = seed.match(new RegExp(`const ${fixture} = \\[([\\s\\S]*?)\\n    \\];`))[1];
  const names = [...block.matchAll(new RegExp(`${nameKey}: '([^']+)'`, 'g'))].map((match) => match[1]);
  expect(names).toHaveLength(expected);
  const rows = names.map((name, index) => ({
    id: index + 1, [nameKey]: name, sport: 'Football', type: 'alert', entity_type: 'team',
    status: 'open', priority: 'normal', rating: 5, confidence_score: 60,
    total_points: 100, optimization_score: 70, odds_team_a: 2, odds_team_b: 2,
    wins: 10, losses: 5, matches_played: 15, kda_ratio: 2, earnings: 1000,
    ranking: index + 1, severity: 'Minor', created_at: '2026-01-01T12:00:00Z',
  }));
  axios.get.mockImplementation(async (url) => ({ data: url === endpoint ? { data: rows, pagination: { page: 1, limit: 20, total: rows.length } } : [] }));
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => { root.render(<Component />); });
  expect(container.querySelectorAll(selector)).toHaveLength(expected);
  expect(errors).not.toHaveBeenCalled();
  await act(async () => { root.unmount(); });
  container.remove();
  errors.mockRestore();
  axios.get.mockReset();
});
