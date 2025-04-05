const express = require('express');
const router = express.Router();

const { getMenuSetup, getMenuSetupAll, getOptionalByMenuCode, getMenuSetupByMenuCode, createMenuSetup, createMenuSetupRef, searchMenuSetup } = require('../../services/management/MenuSetupService');

router.get('/', function (req, res, next) {
  getMenuSetup()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/all', function (req, res, next) {
  getMenuSetupAll()
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/optional/:menuCode', function (req, res, next) {
  const menuCode = req.params.menuCode
  getOptionalByMenuCode(menuCode)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.get('/:menuCode', function (req, res, next) {
  const menuCode = req.params.menuCode
  getMenuSetupByMenuCode(menuCode)
  .then(rows => {
    res.status(200).json({ status: 2000, data: rows })
  })
  .catch(err => {
    res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
  })
});

router.post('/', function (req, res, next) {
  const payload = req.body
  createMenuSetup(payload)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/search', function (req, res, next) {
  const { search } = req.body
  searchMenuSetup(search)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

router.post('/list', function (req, res, next) {
  const payload = req.body
  createMenuSetupRef(payload)
    .then(rows => {
      res.status(200).json({ status: 2000, data: rows })
    })
    .catch(err => {
      res.status(500).json({ status: 5000, data: null, errorMessage: err.message })
    })
});

module.exports = router;
