const express = require('express');
const router = express.Router();

const { createPaidIn, createPaidOut } = require('../../services/PaidInOutService');

/* create paid-in */
router.post('/in', function (req, res) {
  createPaidIn(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

/* create paid-out */
router.post('/out', function (req, res) {
  createPaidOut(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
