const express = require("express")
const router = express.Router()

const apiService = require("../../services/api_integration")

router.post("/booking/appointments", function (req, res) {
  const { reserveNo: bookId } = req.body
  apiService
    .getAppointments(bookId)
    .then((response) => {
      if (response.status === "success") {
        res.status(200).json({ status: 2000, data: response.data })
      } else {
        res.status(200).json({ status: 4040, data: null, errorMessage: "data not found" })
      }
    })
    .catch((err) => {
      res
        .status(500)
        .json({ status: 5000, data: null, errorMessage: err.message })
    })
})

router.post("/booking/getOrder", function (req, res) {
  const { reserveNo: orderId } = req.body
  apiService
    .getOrderBooking(orderId)
    .then((response) => {
      if (response.status === "success") {
        res.status(200).json({ status: 2000, data: response.data })
      } else {
        res.status(200).json({ status: 4040, data: null, errorMessage: "data not found" })
      }
    })
    .catch((err) => {
      res
        .status(500)
        .json({ status: 5000, data: null, errorMessage: err.message })
    })
})

module.exports = router
