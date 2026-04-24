const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// Map of export types to their table names and queries
const exportConfig = {
  betting: {
    table: 'betting_analyses',
    query: 'SELECT * FROM betting_analyses ORDER BY created_at DESC',
    filename: 'betting_analyses'
  },
  fantasy: {
    table: 'fantasy_teams',
    query: 'SELECT * FROM fantasy_teams ORDER BY created_at DESC',
    filename: 'fantasy_teams'
  },
  strategy: {
    table: 'game_strategies',
    query: 'SELECT * FROM game_strategies ORDER BY created_at DESC',
    filename: 'game_strategies'
  },
  esports: {
    table: 'esports_stats',
    query: 'SELECT * FROM esports_stats ORDER BY created_at DESC',
    filename: 'esports_stats'
  },
  referee: {
    table: 'referee_incidents',
    query: 'SELECT * FROM referee_incidents ORDER BY created_at DESC',
    filename: 'referee_incidents'
  }
};

// Convert rows to CSV format
function convertToCSV(rows) {
  if (rows.length === 0) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [];

  // Header row
  csvLines.push(headers.map(h => '"' + h + '"').join(','));

  // Data rows
  for (const row of rows) {
    const values = headers.map(header => {
      let value = row[header];

      if (value === null || value === undefined) {
        return '""';
      }

      if (value instanceof Date) {
        value = value.toISOString();
      }

      // Escape double quotes and wrap in quotes
      const stringValue = String(value).replace(/"/g, '""');
      return '"' + stringValue + '"';
    });
    csvLines.push(values.join(','));
  }

  return csvLines.join('\n');
}

// Export data
router.get('/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const format = (req.query.format || 'json').toLowerCase();

    // Validate export type
    if (!exportConfig[type]) {
      return res.status(400).json({
        error: 'Invalid export type. Supported types: ' + Object.keys(exportConfig).join(', ')
      });
    }

    // Validate format
    if (format !== 'json' && format !== 'csv') {
      return res.status(400).json({
        error: 'Invalid format. Supported formats: json, csv'
      });
    }

    const config = exportConfig[type];
    const result = await pool.query(config.query);

    if (format === 'csv') {
      const csv = convertToCSV(result.rows);
      const filename = config.filename + '_' + new Date().toISOString().split('T')[0] + '.csv';

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
      return res.send(csv);
    }

    // JSON format (default)
    const filename = config.filename + '_' + new Date().toISOString().split('T')[0] + '.json';
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');
    res.json({
      export_type: type,
      exported_at: new Date().toISOString(),
      record_count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
