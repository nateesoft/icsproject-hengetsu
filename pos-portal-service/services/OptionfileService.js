const pool = require('../config/database/MySqlConnect')

const getAllOptionFile = async () => {
    const sql = `SELECT * FROM optionfile`;
    const results = await pool.query(sql)
    return results
}

const getOptionfileByProductCode = async (productCode) => {
    const sql = `select o.* from product p 
      inner join optionfile o on p.PGroup = o.PGroup 
      where p.PCode = '${productCode}'`;
    const results = await pool.query(sql)
    return results
}

module.exports = {
    getAllOptionFile,
    getOptionfileByProductCode
}
