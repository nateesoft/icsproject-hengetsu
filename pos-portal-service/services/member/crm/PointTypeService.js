const pool = require('../../../config/database/MyCrmDB')
const { getMoment } = require('../../../utils/MomentUtil')

const curdate = getMoment().format('YYYY-MM-DD')
const curtime = getMoment().format('HH:mm:ss')

const getDataBranchPoint = async () => {
    const EEE = getMoment().format('ddd')
    const sql = `SELECT * FROM pointtype 
                WHERE curdate() BETWEEN Point_StartDateService and Point_FinishDateService 
                AND (point1>0 or point2>0 or point3>0) 
                AND Point_TypeDateService like '%${EEE}%' limit 1`;
    const results = await pool.query(sql)
    if(results.length>0){
        return results[0]
    }
    return null
}

module.exports = {
    getDataBranchPoint
}
