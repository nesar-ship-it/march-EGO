"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {};
exports.default = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactNativeSkia = require("@shopify/react-native-skia");
var _generateMatrix = require("./qrcode/generate-matrix");
var _transformMatrixIntoPath = require("./qrcode/transform-matrix-into-path");
var _reactNative = require("react-native");
var _types = require("./types");
Object.keys(_types).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _types[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _types[key];
    }
  });
});
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const QRCode = /*#__PURE__*/_react.default.memo(({
  value,
  style,
  pathColor = '#000000',
  children,
  errorCorrectionLevel = 'H',
  strokeWidth = 1,
  pathStyle = 'fill',
  padding = 0,
  size,
  shapeOptions,
  logo,
  logoAreaSize
}) => {
  const canvasSize = size;
  const effectiveLogoAreaSize = logoAreaSize ?? (logo ? 70 : 0);
  const computedPath = (0, _react.useMemo)(() => {
    return (0, _transformMatrixIntoPath.transformMatrixIntoPath)((0, _generateMatrix.generateMatrix)(value, errorCorrectionLevel), size, shapeOptions, effectiveLogoAreaSize);
  }, [value, errorCorrectionLevel, size, shapeOptions, effectiveLogoAreaSize]);
  const path = (0, _react.useMemo)(() => {
    return _reactNativeSkia.Skia.Path.MakeFromSVGString(computedPath.path);
  }, [computedPath]);
  const canvasStyle = (0, _react.useMemo)(() => {
    return _reactNative.StyleSheet.flatten([style, {
      width: canvasSize,
      height: canvasSize
    }]);
  }, [style, canvasSize]);
  const pathContainerStyle = (0, _react.useMemo)(() => {
    return [{
      translateX: padding
    }, {
      translateY: padding
    }];
  }, [padding]);
  return /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.container
  }, /*#__PURE__*/_react.default.createElement(_reactNativeSkia.Canvas, {
    style: canvasStyle
  }, /*#__PURE__*/_react.default.createElement(_reactNativeSkia.Group, {
    transform: pathContainerStyle
  }, /*#__PURE__*/_react.default.createElement(_reactNativeSkia.Path, {
    strokeWidth: strokeWidth,
    path: path,
    color: pathColor,
    style: pathStyle
  }, children))), Boolean(logo) && /*#__PURE__*/_react.default.createElement(_reactNative.View, {
    style: styles.logo
  }, logo));
});
const styles = _reactNative.StyleSheet.create({
  logo: {
    position: 'absolute'
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center'
  }
});
var _default = exports.default = QRCode;
//# sourceMappingURL=index.js.map