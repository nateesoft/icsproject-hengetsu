const express = require('express');
const router = express.Router();

const { getTemplateById, updateTemplate } = require('../../services/management/FloorPlanService');

router.get('/:id', function (req, res) {
  const id = req.params.id
  getTemplateById(id)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.patch('/:id', function (req, res, next) {
  const id = req.params.id
  updateTemplate(req.body, id)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
})

module.exports = router;
