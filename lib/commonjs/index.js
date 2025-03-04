"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _Camera = require("./Camera");
Object.keys(_Camera).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _Camera[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _Camera[key];
    }
  });
});
var _FaceDetector = require("./FaceDetector");
Object.keys(_FaceDetector).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _FaceDetector[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _FaceDetector[key];
    }
  });
});
//# sourceMappingURL=index.js.map