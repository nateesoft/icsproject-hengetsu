const pool = require('../config/database/MySqlConnect')

const getEmployeeByCode = async (code) => {
    const sql = `select code,name from employ where Code='${code}' limit 1`
    const results = await pool.query(sql)
    if (results.length > 0) {
        return {
            pinValid: true
        }
    }
    return {
        pinValid: false
    }
}

const getEmployeeActiveStatus = async () => {
    const sql = `select Username, MacNo, OnACT from posuser where OnACT='Y'`
    const results = await pool.query(sql)
    return results
}

const employForceLogout = async (username) => {
    const sql = `update posuser set OnACT='N' where OnACT='Y' and Username='${username}'`
    const results = await pool.query(sql)
    return results
}

module.exports = {
    getEmployeeByCode,
    getEmployeeActiveStatus,
    employForceLogout
}
