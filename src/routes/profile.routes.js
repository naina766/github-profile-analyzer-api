const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');

// 1. Analyze profile
router.post('/analyze/:username', profileController.analyzeProfile);

// 2. Get list of all profiles
router.get('/', profileController.getProfiles);

// 3. Get global aggregated database statistics
router.get('/analytics', profileController.getAnalytics);

// 4. Get cached profile details
router.get('/:username', profileController.getProfile);

// 5. Refresh profile analysis (bypass cache)
router.put('/refresh/:username', profileController.refreshProfile);

// 6. Delete profile details
router.delete('/:username', profileController.deleteProfile);

module.exports = router;
