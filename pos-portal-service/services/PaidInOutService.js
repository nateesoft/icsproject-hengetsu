const { io } = require('socket.io-client')

// เชื่อมต่อกับ Socket.IO server
const socket = io(process.env.SOCKETIO_SERVER, {
  autoConnect: true
})

const pool = require('../config/database/MySqlConnect');
const { getMoment } = require('../utils/MomentUtil');
const { printPaidInOutHtml } = require('./SyncPrinterService');
const { getBranch } = require('./BranchService');
const { Unicode2ASCII } = require('../utils/StringUtil');

const PAID_IN_TYPE = "I"
const PAID_OUT_TYPE = "O"

const createPaidIn = async ({ macno, cashier, paidinAmt }) => {
    const branch = await getBranch()

    const sql = `insert into paidiofile 
                (date, time, cashier, terminal, flage, paidinamt, paidoutamt) 
                values ('${getMoment().format('YYYY-MM-DD')}', '${getMoment().format('HH:mm:ss')}', '${cashier}', '${macno}', '${PAID_IN_TYPE}', '${paidinAmt}', '0.00')`;
    const results = await pool.query(sql)

    // send to printer
    socket.emit(
        "printerMessage",
        JSON.stringify({
          id: 1,
          printerType: "receipt",
          printerName: "cashier",
          message: await printPaidInOutHtml({
            branchName: `${branch.Code} - ${branch.Name}`,
            cashier, 
            paidInOutAmt: paidinAmt,
            typeDesc: "Cash In", 
            timeProcess: getMoment().format('DD/MM/YYYY HH:mm:ss'), 
            reason: "",
            macno
          }),
          terminal: "",
          tableNo: "",
          billNo: "",
          title: "",
          billType: ""
        })
      )

    return results
}

const createPaidOut = async ({ macno, cashier, paidoutAmt, reason }) => {
  const branch = await getBranch()

  const reasonConv = Unicode2ASCII(reason)
  const sql = `insert into paidiofile 
              (date, time, cashier, terminal, flage, paidinamt, paidoutamt, reson) 
              values ('${getMoment().format('YYYY-MM-DD')}', '${getMoment().format('HH:mm:ss')}', '${cashier}', '${macno}', '${PAID_OUT_TYPE}', '0.00', '${paidoutAmt}', '${reasonConv}')`;
  const results = await pool.query(sql)

  // send to printer
  socket.emit(
      "printerMessage",
      JSON.stringify({
        id: 1,
        printerType: "receipt",
        printerName: "cashier",
        message: await printPaidInOutHtml({
          branchName: `${branch.Code} - ${branch.Name}`,
          cashier, 
          paidInOutAmt: paidoutAmt,
          typeDesc: "Cash Out", 
          timeProcess: getMoment().format('DD/MM/YYYY HH:mm:ss'), 
          reason,
          macno
        }),
        terminal: "",
        tableNo: "",
        billNo: "",
        title: "",
        billType: ""
      })
    )

  return results
}

module.exports = {
    createPaidIn,
    createPaidOut
}
