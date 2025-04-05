require("dotenv").config()

let mysqlConnectionPOS = null

if (process.env.IS_OLD_MYSQL5 === "Y") {
  mysqlConnectionPOS = require("mysql")
  console.log('old db use mysql5')
} else {
  mysqlConnectionPOS = require("mysql2")
  console.log('new db use mysql8')
}

const util = require('util')

const configDb = {
  host: process.env.MYSQL5_DB_HOST,
  user: process.env.MYSQL5_DB_USER,
  password: process.env.MYSQL5_DB_PASSWORD,
  database: process.env.MYSQL5_DB_NAME,
  port: process.env.MYSQL5_DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  maxIdle: 3,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
}
// const poolPOS = mysqlConnectionPOS.createConnection(configDb);
const poolPOS = mysqlConnectionPOS.createPool(configDb);
console.log('MySqlConnect config:', configDb)

poolPOS.query("SELECT 5+0 AS solution", function (error, results, fields) {
  if (error) {
    console.log('pos-restaurant connection error:', error)
    throw error
  }
  console.log("Connect old mysql ip: ", configDb.host)
  console.log("Connect old mysql version: ", results[0].solution)
  console.log('##### ##### #####')
})

poolPOS.query = util.promisify(poolPOS.query)

module.exports = poolPOS
