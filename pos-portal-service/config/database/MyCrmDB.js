require("dotenv").config()

let mysqlConnectionCrm = null

if (process.env.IS_OLD_MYSQL5_CRM === "Y") {
  mysqlConnectionCrm = require("mysql")
  console.log('old db use crm mysql5')
} else {
  mysqlConnectionCrm = require("mysql2")
  console.log('new db use crm mysql8')
}

const util = require('util')

const configCrm = {
  host: process.env.MYSQL5_CRM_DB_HOST,
  user: process.env.MYSQL5_CRM_DB_USER,
  password: process.env.MYSQL5_CRM_DB_PASSWORD,
  database: process.env.MYSQL5_CRM_DB_NAME,
  port: process.env.MYSQL5_CRM_DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  maxIdle: 3,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
}
// const poolCrm = mysqlConnectionCrm.createConnection(configCrm);
const poolCrm = mysqlConnectionCrm.createPool(configCrm);
console.log('MyCrmDB config:', configCrm)

poolCrm.query("SELECT 5+0 AS solution", function (error, results, fields) {
  if (error) {
    console.log('mycrm connection error:', error)
    throw error
  }
  console.log("Connect crm old mysql ip: ", configCrm.host)
  console.log("Connect crm old mysql version: ", results[0].solution)
  console.log('##### ##### #####')
})

poolCrm.query = util.promisify(poolCrm.query)

module.exports = poolCrm
