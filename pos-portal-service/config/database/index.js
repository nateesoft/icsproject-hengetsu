require("dotenv").config()

const mysql8 = require("mysql2")

const util = require('util')
const configPos = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  maxIdle: 3,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
}
// const poolMySql8 = mysql8.createConnection(configPos)
const poolMySql8 = mysql8.createPool(configPos)
// console.log('mysql8 config(mysql2):', configPos )

poolMySql8.query("SELECT 4+4 AS solution", function (error, results, fields) {
  if (error) {
    console.log('posdb connection error:', error)
    throw error
  }
  console.log("Connect new mysql ip: ", configPos.host)
  console.log("Connect new mysql version: ", results[0].solution)
  console.log('##### ##### #####')
})

poolMySql8.query = util.promisify(poolMySql8.query)

module.exports = poolMySql8
