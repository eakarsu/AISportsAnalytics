const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const router = express.Router();

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'AI Sports Analytics API',
    version: '1.0.0',
    description: 'AI-powered Sports Analytics Platform API with Betting Analyzer, Fantasy Optimizer, Game Strategy Advisor, Esports Tracker, and Referee Assistant.',
    contact: {
      name: 'AI Sports Analytics',
      email: 'support@aisportsanalytics.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      },
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          limit: { type: 'integer' },
          total: { type: 'integer' },
          pages: { type: 'integer' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string' },
          name: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      BettingAnalysis: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          match_name: { type: 'string' },
          sport: { type: 'string' },
          team_a: { type: 'string' },
          team_b: { type: 'string' },
          odds_team_a: { type: 'number' },
          odds_team_b: { type: 'number' },
          odds_draw: { type: 'number' },
          predicted_winner: { type: 'string' },
          confidence_score: { type: 'number' },
          analysis_notes: { type: 'string' },
          match_date: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      FantasyTeam: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          team_name: { type: 'string' },
          sport: { type: 'string' },
          budget: { type: 'number' },
          total_points: { type: 'number' },
          player_count: { type: 'integer' },
          formation: { type: 'string' },
          strategy: { type: 'string' },
          optimization_score: { type: 'number' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      GameStrategy: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          game_type: { type: 'string' },
          strategy_name: { type: 'string' },
          description: { type: 'string' },
          difficulty_level: { type: 'string' },
          win_rate: { type: 'number' },
          key_moves: { type: 'string' },
          counter_strategies: { type: 'string' },
          best_situations: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      EsportsStats: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          player_name: { type: 'string' },
          game_title: { type: 'string' },
          team_name: { type: 'string' },
          region: { type: 'string' },
          role: { type: 'string' },
          matches_played: { type: 'integer' },
          wins: { type: 'integer' },
          losses: { type: 'integer' },
          kda_ratio: { type: 'number' },
          avg_score: { type: 'number' },
          ranking: { type: 'integer' },
          earnings: { type: 'number' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      RefereeIncident: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          match_name: { type: 'string' },
          sport: { type: 'string' },
          incident_type: { type: 'string' },
          description: { type: 'string' },
          time_occurred: { type: 'string' },
          players_involved: { type: 'string' },
          severity: { type: 'string' },
          ai_ruling: { type: 'string' },
          actual_ruling: { type: 'string' },
          video_url: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          title: { type: 'string' },
          message: { type: 'string' },
          type: { type: 'string' },
          link: { type: 'string' },
          is_read: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Favorite: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          entity_type: { type: 'string' },
          entity_id: { type: 'integer' },
          entity_name: { type: 'string' },
          sport: { type: 'string' },
          notes: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Feedback: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          type: { type: 'string' },
          subject: { type: 'string' },
          message: { type: 'string' },
          rating: { type: 'integer' },
          status: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      ContactMessage: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string' },
          subject: { type: 'string' },
          message: { type: 'string' },
          category: { type: 'string' },
          status: { type: 'string' },
          admin_reply: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      AuditLog: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          user_id: { type: 'integer' },
          action: { type: 'string' },
          entity_type: { type: 'string' },
          entity_id: { type: 'integer' },
          details: { type: 'string' },
          ip_address: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' },
                  name: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          201: { description: 'User registered successfully' },
          400: { description: 'User already exists' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/api/betting': {
      get: {
        tags: ['Betting'],
        summary: 'Get all betting analyses',
        responses: {
          200: {
            description: 'List of betting analyses',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { '$ref': '#/components/schemas/BettingAnalysis' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Betting'],
        summary: 'Create a betting analysis',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { '$ref': '#/components/schemas/BettingAnalysis' }
            }
          }
        },
        responses: {
          201: { description: 'Betting analysis created' }
        }
      }
    },
    '/api/betting/{id}': {
      get: {
        tags: ['Betting'],
        summary: 'Get a single betting analysis',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Betting analysis details' },
          404: { description: 'Not found' }
        }
      },
      put: {
        tags: ['Betting'],
        summary: 'Update a betting analysis',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Updated successfully' },
          404: { description: 'Not found' }
        }
      },
      delete: {
        tags: ['Betting'],
        summary: 'Delete a betting analysis',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Deleted successfully' },
          404: { description: 'Not found' }
        }
      }
    },
    '/api/fantasy': {
      get: {
        tags: ['Fantasy'],
        summary: 'Get all fantasy teams',
        responses: {
          200: {
            description: 'List of fantasy teams',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { '$ref': '#/components/schemas/FantasyTeam' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Fantasy'],
        summary: 'Create a fantasy team',
        responses: {
          201: { description: 'Fantasy team created' }
        }
      }
    },
    '/api/fantasy/{id}': {
      get: {
        tags: ['Fantasy'],
        summary: 'Get a single fantasy team with players',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Fantasy team details with players' },
          404: { description: 'Not found' }
        }
      },
      put: {
        tags: ['Fantasy'],
        summary: 'Update a fantasy team',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Updated successfully' },
          404: { description: 'Not found' }
        }
      },
      delete: {
        tags: ['Fantasy'],
        summary: 'Delete a fantasy team',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Deleted successfully' },
          404: { description: 'Not found' }
        }
      }
    },
    '/api/strategy': {
      get: {
        tags: ['Strategy'],
        summary: 'Get all game strategies',
        responses: {
          200: {
            description: 'List of game strategies',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { '$ref': '#/components/schemas/GameStrategy' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Strategy'],
        summary: 'Create a game strategy',
        responses: {
          201: { description: 'Strategy created' }
        }
      }
    },
    '/api/strategy/{id}': {
      get: {
        tags: ['Strategy'],
        summary: 'Get a single game strategy',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Strategy details' },
          404: { description: 'Not found' }
        }
      },
      put: {
        tags: ['Strategy'],
        summary: 'Update a game strategy',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Updated successfully' },
          404: { description: 'Not found' }
        }
      },
      delete: {
        tags: ['Strategy'],
        summary: 'Delete a game strategy',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Deleted successfully' },
          404: { description: 'Not found' }
        }
      }
    },
    '/api/esports': {
      get: {
        tags: ['Esports'],
        summary: 'Get all esports player stats',
        responses: {
          200: {
            description: 'List of esports stats',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { '$ref': '#/components/schemas/EsportsStats' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Esports'],
        summary: 'Create esports player stats',
        responses: {
          201: { description: 'Stats created' }
        }
      }
    },
    '/api/esports/{id}': {
      get: {
        tags: ['Esports'],
        summary: 'Get single esports player stats',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Player stats details' },
          404: { description: 'Not found' }
        }
      },
      put: {
        tags: ['Esports'],
        summary: 'Update esports player stats',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Updated successfully' },
          404: { description: 'Not found' }
        }
      },
      delete: {
        tags: ['Esports'],
        summary: 'Delete esports player stats',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Deleted successfully' },
          404: { description: 'Not found' }
        }
      }
    },
    '/api/referee': {
      get: {
        tags: ['Referee'],
        summary: 'Get all referee incidents',
        responses: {
          200: {
            description: 'List of referee incidents',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { '$ref': '#/components/schemas/RefereeIncident' }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Referee'],
        summary: 'Create a referee incident',
        responses: {
          201: { description: 'Incident created' }
        }
      }
    },
    '/api/referee/{id}': {
      get: {
        tags: ['Referee'],
        summary: 'Get a single referee incident',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Incident details' },
          404: { description: 'Not found' }
        }
      },
      put: {
        tags: ['Referee'],
        summary: 'Update a referee incident',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Updated successfully' },
          404: { description: 'Not found' }
        }
      },
      delete: {
        tags: ['Referee'],
        summary: 'Delete a referee incident',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Deleted successfully' },
          404: { description: 'Not found' }
        }
      }
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Get all notifications for authenticated user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: { description: 'Paginated list of notifications' },
          401: { description: 'Unauthorized' }
        }
      },
      post: {
        tags: ['Notifications'],
        summary: 'Create a notification',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Notification created' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/api/notifications/{id}': {
      get: {
        tags: ['Notifications'],
        summary: 'Get a single notification',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Notification details' },
          404: { description: 'Not found' }
        }
      },
      delete: {
        tags: ['Notifications'],
        summary: 'Delete a notification',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Deleted successfully' },
          404: { description: 'Not found' }
        }
      }
    },
    '/api/notifications/{id}/read': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark a notification as read',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Marked as read' },
          404: { description: 'Not found' }
        }
      }
    },
    '/api/notifications/read-all': {
      put: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'All notifications marked as read' }
        }
      }
    },
    '/api/favorites': {
      get: {
        tags: ['Favorites'],
        summary: 'Get all favorites for authenticated user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: { description: 'Paginated list of favorites' },
          401: { description: 'Unauthorized' }
        }
      },
      post: {
        tags: ['Favorites'],
        summary: 'Create a favorite',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Favorite created' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/api/favorites/{id}': {
      get: {
        tags: ['Favorites'],
        summary: 'Get a single favorite',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Favorite details' },
          404: { description: 'Not found' }
        }
      },
      put: {
        tags: ['Favorites'],
        summary: 'Update a favorite',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Updated successfully' },
          404: { description: 'Not found' }
        }
      },
      delete: {
        tags: ['Favorites'],
        summary: 'Delete a favorite',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Deleted successfully' },
          404: { description: 'Not found' }
        }
      }
    },
    '/api/feedback': {
      get: {
        tags: ['Feedback'],
        summary: 'Get all feedback',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: { description: 'Paginated list of feedback' }
        }
      },
      post: {
        tags: ['Feedback'],
        summary: 'Create feedback',
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Feedback created' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/api/feedback/{id}': {
      get: {
        tags: ['Feedback'],
        summary: 'Get single feedback',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Feedback details' },
          404: { description: 'Not found' }
        }
      },
      put: {
        tags: ['Feedback'],
        summary: 'Update feedback',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Updated successfully' },
          404: { description: 'Not found' }
        }
      },
      delete: {
        tags: ['Feedback'],
        summary: 'Delete feedback',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Deleted successfully' },
          404: { description: 'Not found' }
        }
      }
    },
    '/api/audit': {
      get: {
        tags: ['Audit'],
        summary: 'Get all audit logs',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: { description: 'Paginated list of audit logs' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/api/contact': {
      get: {
        tags: ['Contact'],
        summary: 'Get all contact messages',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: { description: 'Paginated list of contact messages' }
        }
      },
      post: {
        tags: ['Contact'],
        summary: 'Create a contact message',
        responses: {
          201: { description: 'Contact message created' }
        }
      }
    },
    '/api/contact/{id}': {
      get: {
        tags: ['Contact'],
        summary: 'Get a single contact message',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Contact message details' },
          404: { description: 'Not found' }
        }
      },
      put: {
        tags: ['Contact'],
        summary: 'Update a contact message (admin reply)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Updated successfully' },
          404: { description: 'Not found' }
        }
      },
      delete: {
        tags: ['Contact'],
        summary: 'Delete a contact message',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'Deleted successfully' },
          404: { description: 'Not found' }
        }
      }
    },
    '/api/search': {
      get: {
        tags: ['Search'],
        summary: 'Search across all entity types',
        parameters: [
          { name: 'q', in: 'query', required: true, schema: { type: 'string' }, description: 'Search term' },
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['all', 'betting', 'fantasy', 'strategy', 'esports', 'referee'], default: 'all' }, description: 'Entity type to search' }
        ],
        responses: {
          200: { description: 'Search results grouped by entity type' },
          400: { description: 'Missing search query' }
        }
      }
    },
    '/api/export/{type}': {
      get: {
        tags: ['Export'],
        summary: 'Export data in CSV or JSON format',
        parameters: [
          { name: 'type', in: 'path', required: true, schema: { type: 'string', enum: ['betting', 'fantasy', 'strategy', 'esports', 'referee'] } },
          { name: 'format', in: 'query', schema: { type: 'string', enum: ['json', 'csv'], default: 'json' } }
        ],
        responses: {
          200: { description: 'Exported data' },
          400: { description: 'Invalid export type or format' }
        }
      }
    },
    '/api/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Get system statistics (row counts for all tables)',
        responses: {
          200: { description: 'System statistics' }
        }
      }
    },
    '/api/admin/users': {
      get: {
        tags: ['Admin'],
        summary: 'List all users',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
        ],
        responses: {
          200: { description: 'Paginated list of users' }
        }
      }
    },
    '/api/admin/users/{id}': {
      delete: {
        tags: ['Admin'],
        summary: 'Delete a user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: { description: 'User deleted' },
          404: { description: 'User not found' }
        }
      }
    }
  }
};

const swaggerSpec = swaggerJsdoc({
  swaggerDefinition,
  apis: [] // We define paths inline above rather than via JSDoc annotations
});

router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'AI Sports Analytics API Docs'
}));

module.exports = router;
