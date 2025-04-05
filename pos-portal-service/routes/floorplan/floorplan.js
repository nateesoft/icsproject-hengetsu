const express = require('express');
const router = express.Router();

const { getFloorPlanById, createSetupFloorPlan, updateFloorPlanSetup } = require('../../services/management/FloorPlanService');

router.get('/:id', function (req, res) {
  const id = req.params.id
  getFloorPlanById(id)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/', function (req, res) {
  createSetupFloorPlan(req.body)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.put('/:id', function (req, res, next) {
  const id = req.params.id

  updateFloorPlanSetup(req.body, id)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
})

module.exports = router;
