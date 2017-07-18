const express = require('express');
const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');

const router = express.Router();

/**
 * GET /health-check (Check service health)
 */
router.get('/health-check', (req, res) => res.send('OK'));

// mount user routes
router.use('/users', userRoutes);

// mount auth routes
router.use('/auth', authRoutes);

module.exports = router;
