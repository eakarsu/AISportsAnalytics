const { body, query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateRegister = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  handleValidation
];

const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation
];

const validateBetting = [
  body('match_name').trim().notEmpty().withMessage('Match name is required'),
  body('sport').trim().notEmpty().withMessage('Sport is required'),
  body('team_a').trim().notEmpty().withMessage('Team A is required'),
  body('team_b').trim().notEmpty().withMessage('Team B is required'),
  handleValidation
];

const validateFantasy = [
  body('team_name').trim().notEmpty().withMessage('Team name is required'),
  body('sport').trim().notEmpty().withMessage('Sport is required'),
  handleValidation
];

const validateStrategy = [
  body('game_type').trim().notEmpty().withMessage('Game type is required'),
  body('strategy_name').trim().notEmpty().withMessage('Strategy name is required'),
  handleValidation
];

const validateEsports = [
  body('player_name').trim().notEmpty().withMessage('Player name is required'),
  body('game_title').trim().notEmpty().withMessage('Game title is required'),
  handleValidation
];

const validateReferee = [
  body('match_name').trim().notEmpty().withMessage('Match name is required'),
  body('sport').trim().notEmpty().withMessage('Sport is required'),
  body('incident_type').trim().notEmpty().withMessage('Incident type is required'),
  handleValidation
];

const validateFeedback = [
  body('type').trim().notEmpty().withMessage('Feedback type is required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  handleValidation
];

const validateContact = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  handleValidation
];

const validateForgotPassword = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  handleValidation
];

const validateResetPassword = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidation
];

module.exports = {
  handleValidation,
  validateRegister,
  validateLogin,
  validateBetting,
  validateFantasy,
  validateStrategy,
  validateEsports,
  validateReferee,
  validateFeedback,
  validateContact,
  validateForgotPassword,
  validateResetPassword
};
