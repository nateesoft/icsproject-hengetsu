const axios = require("axios")

const apiHost = process.env.BOOKING_API_HOST

const getAppointments = async (bookId) => {
  try {
    const response = await axios.get(`${apiHost}/wc-appointments/v1/appointments/${bookId}`, {
      auth: {
        username: process.env.BOOKING_API_KEY,
        password: process.env.BOOKING_API_SECRET
      }
    })
    return {
      status: "success",
      data: response.data
    }
  } catch (error) {
    return {
      status: "error",
      data: null
    }
  }
}

const getOrderBooking = async (orderId) => {
  try {
    const response = await axios.get(`${apiHost}/wc/v3/orders/${orderId}`, {
      auth: {
        username: process.env.BOOKING_API_KEY,
        password: process.env.BOOKING_API_SECRET
      }
    })
    return {
      status: "success",
      data: response.data
    }
  } catch (error) {
    return {
      status: "error",
      data: null
    }
  }
}

module.exports = {
  getAppointments,
  getOrderBooking
}
