const mysql = require("mysql2")

// const MySQLType = require('./msyql_column_type')

let tableName = "MyRestaurantJefferSakon.t_sale"//MyRestaurantJefferSakon, posdb

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

let queryType = 5;

if (queryType == 1) {
    const sql = `select * from ${tableName}`
    pool.query(sql, (err, results) => {
        if (err) throw err

        console.log(results)
    })
}

if (queryType == 2) {
    const sqlAllTable = "show tables"
    pool.query(sqlAllTable, (err, results) => {
        if (err) throw err

        console.log(results)
    })
}

if (queryType == 3) {
    const sqlAllTable = `select * from ${tableName}`
    pool.query(sqlAllTable, (err, results, fields) => {
        if (err) throw err

        console.log(results)
        console.log(fields)
    })
}

const getAllFields = (fields) => {
    const myField = []
    fields.forEach(field => {
        if (field.Null === 'NO') {
            myField.push(field.Field)
        }
    })
    return myField
}

const getAllFieldsQuestion = (fields) => {
    const myField = []
    fields.forEach(field => {
        if (field.Null === 'NO') {
            myField.push("?")
        }
    })
    return myField
}

const getAllFieldsWithQuestion = (fields) => {
    const myField = []
    fields.forEach(field => {
        if (field.Null === 'NO') {
            myField.push(field.Field + " = ?")
        }
    })
    return myField
}

const getQuestionMark = (fields) => {
    const myField = []
    fields.forEach(field => {
        myField.push("?")
    })
    return myField
}

const genRequestBody = (fields) => {
    const myField = []
    fields.forEach(field => {
        const fieldName = field.Field
        const fieldType = field.Type
        // if (field.Null === 'NO') {
            if (fieldType.indexOf('char') !=-1) {
                myField.push(JSON.stringify(fieldName) + ":" + "\"\"")
            } else if (fieldType.includes("int") 
                || fieldType.includes("decimal")
                || fieldType.includes("double")
                || fieldType.includes("float")) {
                myField.push(JSON.stringify(fieldName) + ":" + "0")
            } else if (fieldType.includes("date")) {
                myField.push(JSON.stringify(fieldName) + ":" + "\"\"")
            } else {
                myField.push(JSON.stringify(fieldName) + ":" + "\"\"")
            }
        // }
    })
    return myField
}

if (queryType == 4) {
    const sqlAllTable = `desc ${tableName}`
    pool.query(sqlAllTable, (err, results) => {
        if (err) throw err

        const allFields = getAllFields(results)
        const allFieldsDefault = getAllFieldsQuestion(results)

        // postman request
        const strRequstBody = '{' + genRequestBody(results).join(',') + '}'
        console.log('########## POSTMAN ########')
        console.log(strRequstBody)
        console.log('########## POSTMAN ########')
        console.log()

        console.log('########## POST INSERT ########')
        console.log()
        console.log(`router.post('/', function (req, res, next) {`)
        console.log(`   const {${allFields.join(',')}} = req.body`)
        console.log()
        console.log(`   pool.query(`)
        console.log(`       ${`\``}INSERT INTO ${tableName} (${allFields.join(',')}) 
                            VALUES (${allFieldsDefault.join(',')})${`\``}, 
                            [${allFields.join(',')}],`)
        console.log(`       (err, results) => {`)
        console.log(`           if (err) throw err`)
        console.log(`           res.status(201).json({ status: 'data inserted.' })`)
        console.log(`       }`)
        console.log(`      )`)
        console.log(`});`)
        console.log()
        console.log('########## POST INSERT ########')
        console.log()

        const allFieldWithQuestion = getAllFieldsWithQuestion(results)
        console.log('########## PUT UPDATE ########')
        console.log()
        console.log(`router.put('/:id', function (req, res, next) {`)
        console.log(`    const id = req.params.id`)
        console.log(`    const { ${allFields.join(',')} } = req.body`.replace('id,', ''))
        console.log()    
        console.log(`    pool.query(`)
        console.log(`        ${`\``}UPDATE ${tableName} `)
        console.log(`        SET ${allFieldWithQuestion.join(',')} `.replace('id = ?,', ''))
        console.log(`        WHERE id = ?${`\``}, `)
        console.log(`        [ ${allFields.join(',')}, id ],`.replace('id,', ''))
        console.log(`        (err, results) => {`)
        console.log(`            if (err) throw err`)
        console.log()        
        console.log(`            res.status(200).json({ status: "update success"})`)
        console.log(`        }`)
        console.log(`    )`)
        console.log(`})`)
        console.log('########## PATCH UPDATE ########')
        console.log()
    })
}

if (queryType == 5) {
    tableName = "MyRestaurantJefferSakon.t_sale"
    const sqlAllTable = `desc ${tableName} `
    pool.query(sqlAllTable, (err, results) => {
        if (err) throw err

        const allFields = getAllFields(results)
        const allFieldsDefault = genRequestBody(results)
        const getQM = getQuestionMark(results)

        const sqlQuery = `INSERT INTO ${tableName} (${allFields}) values (${getQM})`;

        console.log(allFields.join(','))
        console.log(allFieldsDefault)
        console.log(sqlQuery)
    })
}
