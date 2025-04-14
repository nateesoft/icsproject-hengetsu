const express = require("express")
const router = express.Router()

router.post("/order", function (req, res) {
  const { branchCode, tableNo } = req.body

  const trackingId = `tc${branchCode}${tableNo}` // wait compute trackingId in db
  res.status(200).json(
    { 
      status: 1000, 
      data: {
        redirectUrl: `${process.env.CUSTOMER_ORDER_HOST}/${trackingId}`
      }
    })
})

module.exports = router
