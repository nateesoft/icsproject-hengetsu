const pool = require('../config/database/MySqlConnect')
const { mappingResultDataList, mappingResultData } = require('../utils/ConvertThai')

const getAllProduct = async pcode => {
    const sql = `select * from product`;
    const results = await pool.query(sql)

    return mappingResultDataList(results)
}

const getProductByPCode = async pcode => {
    const sql = `select * from product where PCode='${pcode}'`;
    const results = await pool.query(sql)

    return mappingResultData(results)
}

const getProductActiveByPCode = async pcode => {
    const sql = `select * from product where PCode='${pcode}' and pactive='Y' limit 1`;
    const results = await pool.query(sql)

    return mappingResultData(results)
}

const listIngredeint = async (pluCode) => {
    const sql = `select i.*,pdesc,PBPack,pstock,pactive 
    from product p inner join pingredent i on p.pcode=i.pingcode 
    where i.pcode='${pluCode}' and PFix='L' and PStock='Y'`;
    const results = await pool.query(sql)

    return mappingResultDataList(results)
}

const getPSetByPCode = async (pluCode) => {
    const sql = `select ps.*, p.PStock, p.PSet from pset ps 
        inner join product p on ps.PCode =p.PCode 
        where ps.pcode='${pluCode}'`;
    const results = await pool.query(sql)

    return mappingResultDataList(results)
}

const getPCategoryByRLinkIndex = async (main_R_Index) => {
    const sql = `select * from balance where R_LinkIndex='${main_R_Index}'`;
    const results = await pool.query(sql)
    return mappingResultDataList(results)
}

module.exports = {
    getProductByPCode,
    getProductActiveByPCode,
    listIngredeint,
    getPSetByPCode,
    getAllProduct,
    getPCategoryByRLinkIndex
}
