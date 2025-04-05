const CryptoJS = require("crypto-js")
const crypto = require('crypto')
const SECRET_PASS = process.env.API_SECRET_PASS;

// Encrypt user input text
const encryptData = (text) => {
    try {
      const data = CryptoJS.AES.encrypt(
        JSON.stringify(text),
        SECRET_PASS
      ).toString();
      return data
    } catch (error) {
      console.log(error)
    }
  };

  // Decrypt user input text
  const decryptData = (text) => {
    try {
      const bytes = CryptoJS.AES.decrypt(text, SECRET_PASS);
      const data = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      return data
    } catch (error) {
        console.log(error)
    }
  };

const Unicode2ASCII = unicode => {
    if (!unicode) return '';
    let ascii = unicode.split('');
    let code;
    for (let i = 0; i < unicode.length; i++) {
        code = unicode.charCodeAt(i);
        if (0xE01 <= code && code <= 0xE5B) {
            ascii[i] = String.fromCharCode(code - 0xD60);
        }
    }
    return ascii.join('');
}

const ASCII2Unicode = ascii => {
    if (!ascii) return '';
    let unicode = ascii.split('');
    let code;
    for (let i = 0; i < ascii.length; i++) {
        code = ascii.charCodeAt(i);
        if (0xA1 <= code && code <= 0xFB) {
            unicode[i] = String.fromCharCode(code + 0xD60);
        }
    }
    return unicode.join('');
}

const PrefixFormat = (str, padString, length) => {
    while (str.length < length)
        str = padString + str;
    return str;
}

const PrefixZeroFormat = (str, length) => {
    while (("" + str).length < length)
        str = "0" + str;
    return str;
}

const generateUUID = () => {
    return crypto.randomUUID()
}

module.exports = {
    Unicode2ASCII,
    ASCII2Unicode,
    PrefixFormat,
    PrefixZeroFormat,
    encryptData,
    decryptData,
    generateUUID
}