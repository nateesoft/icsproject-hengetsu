const moment = require("moment")

const getApproveCode = async () => {
  const strDate = moment().format("YYYY/MM/DD")
  const strDayInt = moment().format("E")

  const YYYY = parseInt(strDate.split('/')[0])
  const MM = parseInt(strDate.split('/')[1])
  const DD = parseInt(strDate.split('/')[2])
  let DAY = parseInt(strDayInt) + 1


  return (YYYY+MM+DD) * DAY
}

module.exports = {
  getApproveCode
}
