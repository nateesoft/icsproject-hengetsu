const moment = require('moment')

const getMoment = (dateStr) => {
    if (!dateStr) {
        return moment().utc(true)
    } else {
        return moment(dateStr).utc(true)
    }
}

const getMomentTime = (dateStr) => {
    if (!dateStr) {
        return moment().utc(true)
    } else {
        return moment(dateStr).utc(true)
    }
}

const getYesterday = () => {
    return moment().add(-1, 'day').utc(true)
}

module.exports = {
    getMoment,
    getMomentTime,
    getYesterday
}