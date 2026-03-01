"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateMatrix = void 0;
var _qrcode = _interopRequireDefault(require("qrcode"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// The purpose of this function is to generate a matrix of 1s and 0s from a string.
// The matrix is used later to generate a path for the QR code.
// [1, 1, 1, 1, 1, 1, 1, 0, 1, 0,
//  1, 0, 1, 1, 0, 0, 0, 0, 1, 1,
//  1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
//  0, 1, 0, 1, 0, 1, 0, 1, 1, 0,
//  1, 0, 0, 1, 0, 0, 0, 0, 0, 1,
//  1, 0, 1, 1, 1, 0, 1, 0, 1, 0,
//  0, 1, 0, 0, 1, 0, 1, 0, 1, 0 ...

// Deeply Inspired by https://github.com/awesomejerry/react-native-qrcode-svg/blob/master/src/genMatrix.js

const generateMatrix = (value, errorCorrectionLevel) => {
  // Convert the QR code data into an array
  const arr = Array.prototype.slice.call(_qrcode.default.create(value, {
    errorCorrectionLevel
  }).modules.data, 0);

  // Calculate the square root of the array length
  const sqrt = Math.sqrt(arr.length);

  // Convert the flat array into a matrix representation
  return arr.reduce((rows, key, index) => (index % sqrt === 0 ? rows.push([key]) : rows[rows.length - 1].push(key)) && rows, []);
};
exports.generateMatrix = generateMatrix;
//# sourceMappingURL=generate-matrix.js.map