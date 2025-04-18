const pool = require('../config/database/MySqlConnect');
const { mappingResultDataList } = require('../utils/ConvertThai');

const getAllGroup = async () => {
    const sql = `select GroupCode, GroupName from groupfile order by GroupCode`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

const getProductListByGroupCode = async (groupCode) => {
    const sql = `select PCode, PDesc, PGroup, PType, PStatus, PSet, PPrice11, PPrice12, PPrice13, PPrice14, PPrice15 
        from product p  where p.PGroup='${groupCode}' 
        order by PCode`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

module.exports = {
    getAllGroup,
    getProductListByGroupCode
}
