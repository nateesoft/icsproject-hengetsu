const express = require('express');
const { getOverviewReport } = require('../../../services/management/ReportService');
const router = express.Router();

router.get('/', async (req, res, next) => {
  res.send('Success')
});

router.get('/all', async (req, res, next) => {
  getOverviewReport()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
