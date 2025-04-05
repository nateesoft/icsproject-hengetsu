const pool = require('../../config/database/MySqlConnect');

const getTableColumn = async (tableName) => {
    const sql = `desc ${tableName}`;
    const results = await pool.query(sql)
    return results
}

const getTableData = async (tableName) => {
    const sql = `select * from  ${tableName} limit 0, 100`;
    const results = await pool.query(sql)
    return results
}

module.exports = {
    getTableColumn,
    getTableData
}
