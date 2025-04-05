const byNumber = (num) => {
    switch (num) {
        case 0:
            return "DECIMAL";
        case 1:
            return "TINY";
        case 2:
            return "SHORT";
        case 3:
            return "LONG";
        case 4:
            return "FLOAT";
        case 5:
            return "DOUBLE";
        case 6:
            return "NULL";
        case 7:
            return "TIMESTAMP";
        case 8:
            return "LONGLONG";
        case 9:
            return "INT24";
        case 10:
            return "DATE";
        case 11:
            return "TIME";
        case 12:
            return "DATETIME";
        case 13:
            return "YEAR";
        case 14:
            return "NEWDATE";
        case 15:
            return "VARCHAR";
        case 16:
            return "BIT";
        case 17:
            return "TIMESTAMP2";
        case 18:
            return "DATETIME2";
        case 19:
            return "TIME2";
        case 20:
            return "TYPED_ARRAY";
        case 242:
            return "VECTOR";
        case 243:
            return "INVALID";
        case 244:
            return "BOOL";
        case 245:
            return "JSON";
        case 246:
            return "NEWDECIMAL";
        case 247:
            return "ENUM";
        case 248:
            return "SET";
        case 249:
            return "TINY_BLOB";
        case 250:
            return "MEDIUM_BLOB";
        case 251:
            return "LONG_BLOB";
        case 252:
            return "BLOB";
        case 253:
            return "VAR_STRING";
        case 254:
            return "STRING";
        case 255:
            return "GEOMETRY";
    }
}

module.exports = {
    byNumber
}