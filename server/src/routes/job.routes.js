// src/routes/job.routes.js
const express = require('express');
const router = express.Router();
const jobController = require('../controllers/job.controller');
const cronAuth = require('../middlewares/cronAuth.middleware');

// POST /api/v1/jobs/limpar — protegido por x-cron-secret
router.post('/limpar', cronAuth, jobController.executarLimpeza);

module.exports = router;
