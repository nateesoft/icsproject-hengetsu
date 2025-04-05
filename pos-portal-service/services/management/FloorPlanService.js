const pool = require('../../config/database')

const { getAllTable } = require('../TableFileService')

const getNewArray = (tables, nodes) => {

    const getStatusBG = (tableNo) => {
        const getTcode = tables.filter(tb => tb.Tcode === tableNo)
        if(getTcode.length>0){
            if (getTcode[0].TOnAct === 'Y') {
                return "purple"
            } else {
                return "green"
            }
        }
    }

    const getCustomer = (tableNo) => {
        const getTcode = tables.filter(tb => tb.Tcode === tableNo)
        if(getTcode.length>0){
            return getTcode[0].TCustomer
        }
    }

    const newNodes = nodes.filter(item => item.data.label !== "")
    return newNodes.map(item => {
        const backgroundColor = getStatusBG(item.data.label)
        return {
            ...item,
            data: {
                ...item.data,
                bgColor: backgroundColor,
                customer: getCustomer(item.data.label)
            }
        }
    })
}

const getTemplateById = async (id) => {
    const tables = await getAllTable()

    const sql = `select * from floorplan_template where id='${id}'`
    const results = await pool.query(sql)
    if (results.length > 0) {
        const unique = [...new Set(getNewArray(tables, results[0].template.nodes))]
        const newResponse = {
            id: results[0].id,
            template: { 
                ...results[0].template,
                nodes: unique
            }
        }
        return newResponse
    }
    return null
}

const updateTemplate = async (payload, id) => {
    const { template } = payload
    const sqlQuery = `select * from floorplan_template where id='${id}'`
    const results = await pool.query(sqlQuery)
    if (results.length > 0) {
        const sql = `UPDATE floorplan_template set template='${template}' WHERE id = '${id}'`
        await pool.query(sql)
    } else {
        const sqlInsert = `INSERT INTO floorplan_template (id, template) 
                values ('${id}', '${template}')`;
        await pool.query(sqlInsert)
    }
    return id
}

const getFloorPlanById = async (id) => {
    const sql = `select * from floorplan_setup where id='${id}'`
    const results = await pool.query(sql)
    if (results.length > 0) {
        return results[0]
    }
    return null
}

const createSetupFloorPlan = async (payload) => {
    const { id, table_no, zone, customer_size, table_image, table_status } = payload
    const sql = `INSERT INTO floorplan_setup 
      (id,table_no,zone,customer_size,table_image,table_status) 
      VALUES (?,?,?,?,?,?)`
    const results = await pool.query(sql, [id, table_no, zone, customer_size, table_image, table_status])
    return results
}

const updateFloorPlanSetup = async (payload, id) => {
    const { table_no, zone, customer_size, table_image, table_status } = payload
    const sql = `UPDATE floorplan_setup 
      SET table_no = ?,zone = ?,customer_size = ?,table_image = ?,table_status = ? 
      WHERE id = ?`
    const results = await pool.query(sql, [table_no, zone, customer_size, table_image, table_status, id])
    return results
}

module.exports = {
    getTemplateById,
    updateTemplate,
    getFloorPlanById,
    createSetupFloorPlan,
    updateFloorPlanSetup
}
