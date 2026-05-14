# Audit Note — AISportsAnalytics

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_08.md` (section 6).

## Original Recommendations

### Missing AI Counterparts
- AI-driven injury impact prediction
- Player performance regression modeling

### Missing Non-AI Features
- ESPN/league API integration
- Cross-sport modeling
- Live chat / social features

### Custom Feature Suggestions
- Cross-sport player valuation
- Injury timeline & performance decay
- Live betting optimization
- Ref decision prediction
- Sentiment analysis on sports news

## Implemented (this round)
1. `POST /api/ai/injury-impact` — recovery + downstream impact projection.
2. `POST /api/ai/performance-regression` — regression signals & projection.

Pattern reused: `callOpenRouter` + `parseAIJson` + `aiCache` + `persistAnalysis`. Syntax-checked.

## Backlog (prioritized)
1. **MECHANICAL** Live betting optimization endpoint.
2. **MECHANICAL** Sports news sentiment endpoint.
3. **NEEDS-CREDS** ESPN/league official API integrations.
4. **NEEDS-PRODUCT-DECISION** Live chat, social leaderboards, follow-picks.

## Apply pass 3 (frontend)
- **Action:** LEFT-AS-IS. FE already fully wired for both pass-2 endpoints.
- `client/src/pages/InjuryImpact.js` posts to `/ai/injury-impact` via `apiPost` (JWT in localStorage).
- `client/src/pages/PerformanceRegression.js` posts to `/ai/performance-regression`.
- Both pages routed in `client/src/App.js` (`/injury-impact`, `/performance-regression`).
- No frontend changes required this pass.

## Apply pass 4 (mechanical backlog)
- **Action:** LEFT-AS-IS (already done in earlier passes).
- Both mechanical backlog items already implemented end-to-end:
  - `POST /api/ai/live-betting-optimize` (`server/routes/ai.js:826`) + FE `client/src/pages/LiveBettingOptimize.js` + route `/live-betting-optimize` in `client/src/App.js:105` + sidebar entry in `Layout.js:43`.
  - `POST /api/ai/news-sentiment` (`server/routes/ai.js:877`) + FE `client/src/pages/NewsSentiment.js` + route `/news-sentiment` in `App.js:106` + sidebar entry in `Layout.js:44`.
- Remaining backlog items are NEEDS-CREDS (ESPN/league APIs) or NEEDS-PRODUCT-DECISION (live chat, social leaderboards).
- No code changes required this pass.
