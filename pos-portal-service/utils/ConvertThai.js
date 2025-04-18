const { ASCII2Unicode, Unicode2ASCII } = require('./StringUtil')

const mappingResultData = (result) => {
    const fields = Array.from(new Set(result.flatMap(obj => Object.keys(obj))));
    const mappingResult = result.map(item => {
        const newItem = { ...item };
        fields.forEach(key => {
          if (typeof newItem[key] === "string") {
            newItem[key] = ASCII2Unicode(newItem[key]);
          }
        });
        return newItem;
      });
    return mappingResult[0]
}

const mappingResultDataList = (resultList) => {
    const fields = Array.from(new Set(resultList.flatMap(obj => Object.keys(obj))));
    const mappingResult = resultList.map(item => {
        const newItem = { ...item };
        fields.forEach(key => {
          if (typeof newItem[key] === "string") {
            newItem[key] = ASCII2Unicode(newItem[key]);
          }
        });
        return newItem;
      });
    return mappingResult
}

module.exports = {
    mappingResultData,
    mappingResultDataList
}

// const myList = [
//     {index:1, name: "A1", age: 21, remark: "³ÔªªÒ"},
//     {index:2, name: "A2", age: 22, remark: "à¾ªÃ"},
//     {index:3, name: "A3", age: 23, remark: "ÁÒÂ´ì"},
//     {index:4, name: "A4", age: 24, remark: "âµâ¹è"}
// ]

// const results = mappingResultDataList(myList)
// console.log(results)

// const results2 = mappingResultData(myList)
// console.log(results2)
