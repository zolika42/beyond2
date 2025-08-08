const pad = (str, len) => str + ' '.repeat(Math.max(0, len - str.length));
const truncate = (str, len) => (str.length > len ? str.slice(0, len - 3) + '...' : str);
module.exports = { pad, truncate };
