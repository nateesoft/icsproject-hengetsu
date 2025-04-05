const mysql = require("mysql2")
const {getMoment} = require('../utils/MomentUtil')

const pool = mysql.createPool({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "nathee2024",
    waitForConnections: true,
    connectionLimit: 10,
    maxIdle: 3,
    idleTimeout: 60000,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
})

const displayAllField = (fields) => {
    const myField = []
    fields.forEach(field => {
        myField.push(field.Field)
    })
    return myField
}

const displayAllFieldAssign = (fields) => {
    const myField = []
    fields.forEach(field => {
        myField.push(field.Field + "='${" + field.Field + "}'")
    })
    return myField
}

const displayOldToNewAssign = (fields, tableName) => {
    const myField = []
    fields.forEach(field => {
        myField.push(`const ${field.Field}=${tableName}.${field.Field}`)
    })
    return myField
}

const displayQueryUpdateAssign = (fields) => {
    const myField = []
    fields.forEach(field => {
        myField.push("'${" + field.Field + "}'")
    })
    return myField
}

const displayQuestionMark = (fields) => {
    const myField = []
    fields.forEach(field => {
        myField.push("?")
    })
    return myField
}

const assignFieldWithQuestionMark = (fields) => {
    const myField = []
    fields.forEach(field => {
        myField.push(field.Field + " = ?")
    })
    return myField
}

const assignFieldWithDefautValue = (fields) => {
    const myField = []
    fields.forEach(field => {
        const checkFieldType = field.Type.toLowerCase()
        if (checkFieldType.includes('char')) {
            myField.push("const " + field.Field + " = \"\";")
        } else if (checkFieldType.includes('int') || checkFieldType.includes('double') || checkFieldType.includes('float')) {
            myField.push("const " + field.Field + " = 0;")
        } else if (checkFieldType.includes("datetime")) {
            myField.push("const " + field.Field + " = " + "\"now()\"")
        } else if (checkFieldType.includes("date")) {
            myField.push("const " + field.Field + " = " + "\"curdate()\"")
        } else {
            myField.push("const " + field.Field + " = \"\";")
        }
    })
    return myField
}

// const tableName = 'MyRestaurantJefferSakon.tablefile'
const tableName = 'posdb.pos_setting'
// const tableName = 'mycrmbranch.mplu'
const sqlAllTable = `desc ${tableName} `
pool.query(sqlAllTable, (err, results) => {
    if (err) throw err

    const allFields = displayAllField(results)
    const allFieldsAssign = displayAllFieldAssign(results)
    const allFieldsDefault = assignFieldWithDefautValue(results)
    const getQM = displayQuestionMark(results)

    const sqlQuery = `INSERT INTO ${tableName} (${allFields}) VALUES (${getQM})`;
    const sqlQueryInsert = `INSERT INTO ${tableName} (${allFields}) \nVALUES (${displayQueryUpdateAssign(results)})`;
    const sqlUpdate = `UPDATE ${tableName} SET ${displayAllFieldAssign(results)} WHERE id='xxxx'`;
    const paramAssign = displayOldToNewAssign(results, "mplu").join(';\n');

    console.log(tableName + "=>", allFields.join(','))
    console.log(tableName + "=>", allFieldsDefault.join('\n'))
    console.log(tableName + "=>", sqlQuery)
    console.log(tableName + "(insert)=>", sqlQueryInsert)
    console.log(paramAssign)
    console.log(tableName + "(update)=>", sqlUpdate)
})

console.log(getMoment().format('ddd'))

const currentDate = getMoment()

const startDate = getMoment("2024-12-01T17:50:00.000Z")
const endDate = getMoment("2024-12-10T18:55:00.000Z")

const activeDate = currentDate.isBetween(startDate, endDate)
console.log(activeDate)
console.log('currentDate:', currentDate.format('YYYY-MM-DD HH:mm:ss'))
console.log('startDate:', startDate.format('YYYY-MM-DD HH:mm:ss'))
console.log('endDate:', endDate.format('YYYY-MM-DD HH:mm:ss'))

// console.log(getYesterday().format('YYYY-MM-DD HH:mm:ss'))
