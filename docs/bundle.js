/*!
  niconicomments.js v0.2.76
  (c) 2021 xpadev-net https://xpadev.net
  Released under the MIT License.
*/
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.NiconiComments = factory());
})(this, (function () { 'use strict';

    let imageCache = {};
    const resetImageCache = () => {
        imageCache = {};
    };

    let nicoScripts = {
        reverse: [],
        default: [],
        replace: [],
        ban: [],
        seekDisable: [],
        jump: [],
    };
    const resetNicoScripts = () => {
        nicoScripts = {
            reverse: [],
            default: [],
            replace: [],
            ban: [],
            seekDisable: [],
            jump: [],
        };
    };

    let plugins = [];
    const setPlugins = (input) => {
        plugins = input;
    };

    var index$4 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get imageCache () { return imageCache; },
        get nicoScripts () { return nicoScripts; },
        get plugins () { return plugins; },
        resetImageCache: resetImageCache,
        resetNicoScripts: resetNicoScripts,
        setPlugins: setPlugins
    });

    let isDebug = false;
    const setIsDebug = (val) => {
        isDebug = val;
    };

    let defaultConfig;
    const updateConfig = (config) => {
        defaultConfig = config;
    };
    const defaultOptions = {
        config: {},
        debug: false,
        enableLegacyPiP: false,
        format: "default",
        formatted: false,
        keepCA: false,
        mode: "default",
        scale: 1,
        showCollision: false,
        showCommentCount: false,
        showFPS: false,
        useLegacy: false,
        video: undefined,
        lazy: false,
    };
    let config;
    let options;
    const setConfig = (value) => {
        config = value;
    };
    const setOptions = (value) => {
        options = value;
    };

    var config$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get config () { return config; },
        get defaultConfig () { return defaultConfig; },
        defaultOptions: defaultOptions,
        get options () { return options; },
        setConfig: setConfig,
        setOptions: setOptions,
        updateConfig: updateConfig
    });

    class CanvasRenderingContext2DError extends Error {
        constructor(options = {}) {
            super("CanvasRenderingContext2DError", options);
        }
    }
    CanvasRenderingContext2DError.prototype.name = "CanvasRenderingContext2DError";

    class InvalidFormatError extends Error {
        constructor(options = {}) {
            super("InvalidFormatError", options);
        }
    }
    InvalidFormatError.prototype.name = "InvalidFormatError";

    class InvalidOptionError extends Error {
        constructor(options = {}) {
            super("Invalid option\nPlease check document: https://xpadev-net.github.io/niconicomments/#p_options", options);
        }
    }
    InvalidOptionError.prototype.name = "InvalidOptionError";

    class NotImplementedError extends Error {
        pluginName;
        methodName;
        constructor(pluginName, methodName, options = {}) {
            super("NotImplementedError", options);
            this.pluginName = pluginName;
            this.methodName = methodName;
        }
    }
    NotImplementedError.prototype.name = "NotImplementedError";

    var index$3 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        CanvasRenderingContext2DError: CanvasRenderingContext2DError,
        InvalidFormatError: InvalidFormatError,
        InvalidOptionError: InvalidOptionError,
        NotImplementedError: NotImplementedError
    });

    const arrayPush = (_array, key, push) => {
        let array = _array;
        if (!array) {
            array = {};
        }
        if (!array[Number(key)]) {
            array[Number(key)] = [];
        }
        array[Number(key)]?.push(push);
    };
    const arrayEqual = (a, b) => {
        if (a.length !== b.length)
            return false;
        for (let i = 0, n = a.length; i < n; ++i) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    };

    const hex2rgb = (_hex) => {
        let hex = _hex;
        if (hex.startsWith("#"))
            hex = hex.slice(1);
        if (hex.length === 3)
            hex =
                hex.slice(0, 1) +
                    hex.slice(0, 1) +
                    hex.slice(1, 2) +
                    hex.slice(1, 2) +
                    hex.slice(2, 3) +
                    hex.slice(2, 3);
        return [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6)].map((str) => Number.parseInt(str, 16));
    };
    const hex2rgba = (_hex) => {
        let hex = _hex;
        if (hex.startsWith("#"))
            hex = hex.slice(1);
        if (hex.length === 4)
            hex =
                hex.slice(0, 1) +
                    hex.slice(0, 1) +
                    hex.slice(1, 2) +
                    hex.slice(1, 2) +
                    hex.slice(2, 3) +
                    hex.slice(2, 3) +
                    hex.slice(3, 4) +
                    hex.slice(3, 4);
        return [
            hex.slice(0, 2),
            hex.slice(2, 4),
            hex.slice(4, 6),
            hex.slice(4, 6),
        ].map((str, index) => {
            if (index === 3)
                return Number.parseInt(str, 16) / 256;
            return Number.parseInt(str, 16);
        });
    };
    const getStrokeColor = (comment) => {
        if (comment.strokeColor) {
            const color = comment.strokeColor.slice(1);
            const length = color.length;
            if (length === 3 || length === 6) {
                return `rgba(${hex2rgb(color).join(",")},${config.contextStrokeOpacity})`;
            }
            if (length === 4 || length === 8) {
                return `rgba(${hex2rgba(color).join(",")})`;
            }
        }
        return `rgba(${hex2rgb(comment.color === "#000000"
        ? config.contextStrokeInversionColor
        : config.contextStrokeColor).join(",")},${config.contextStrokeOpacity})`;
    };

    function _arrayLikeToArray(r, a) {
      (null == a || a > r.length) && (a = r.length);
      for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
      return n;
    }
    function _arrayWithoutHoles(r) {
      if (Array.isArray(r)) return _arrayLikeToArray(r);
    }
    function _assertThisInitialized(e) {
      if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return e;
    }
    function _callSuper(t, o, e) {
      return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));
    }
    function _classCallCheck(a, n) {
      if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
    }
    function _construct(t, e, r) {
      if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments);
      var o = [null];
      o.push.apply(o, e);
      var p = new (t.bind.apply(t, o))();
      return r && _setPrototypeOf(p, r.prototype), p;
    }
    function _createClass(e, r, t) {
      return Object.defineProperty(e, "prototype", {
        writable: false
      }), e;
    }
    function _createForOfIteratorHelper(r, e) {
      var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
      if (!t) {
        if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e) {
          t && (r = t);
          var n = 0,
            F = function () {};
          return {
            s: F,
            n: function () {
              return n >= r.length ? {
                done: true
              } : {
                done: false,
                value: r[n++]
              };
            },
            e: function (r) {
              throw r;
            },
            f: F
          };
        }
        throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
      }
      var o,
        a = true,
        u = false;
      return {
        s: function () {
          t = t.call(r);
        },
        n: function () {
          var r = t.next();
          return a = r.done, r;
        },
        e: function (r) {
          u = true, o = r;
        },
        f: function () {
          try {
            a || null == t.return || t.return();
          } finally {
            if (u) throw o;
          }
        }
      };
    }
    function _defineProperty(e, r, t) {
      return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: true,
        configurable: true,
        writable: true
      }) : e[r] = t, e;
    }
    function _getPrototypeOf(t) {
      return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
        return t.__proto__ || Object.getPrototypeOf(t);
      }, _getPrototypeOf(t);
    }
    function _inherits(t, e) {
      if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
      t.prototype = Object.create(e && e.prototype, {
        constructor: {
          value: t,
          writable: true,
          configurable: true
        }
      }), Object.defineProperty(t, "prototype", {
        writable: false
      }), e && _setPrototypeOf(t, e);
    }
    function _isNativeFunction(t) {
      try {
        return -1 !== Function.toString.call(t).indexOf("[native code]");
      } catch (n) {
        return "function" == typeof t;
      }
    }
    function _isNativeReflectConstruct() {
      try {
        var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      } catch (t) {}
      return (_isNativeReflectConstruct = function () {
        return !!t;
      })();
    }
    function _iterableToArray(r) {
      if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
    }
    function _nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function ownKeys(e, r) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function (r) {
          return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
      }
      return t;
    }
    function _objectSpread2(e) {
      for (var r = 1; r < arguments.length; r++) {
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), true).forEach(function (r) {
          _defineProperty(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
          Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
      }
      return e;
    }
    function _possibleConstructorReturn(t, e) {
      if (e && ("object" == typeof e || "function" == typeof e)) return e;
      if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
      return _assertThisInitialized(t);
    }
    function _setPrototypeOf(t, e) {
      return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
        return t.__proto__ = e, t;
      }, _setPrototypeOf(t, e);
    }
    function _toConsumableArray(r) {
      return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
    }
    function _toPrimitive(t, r) {
      if ("object" != typeof t || !t) return t;
      var e = t[Symbol.toPrimitive];
      if (void 0 !== e) {
        var i = e.call(t, r);
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return ("string" === r ? String : Number)(t);
    }
    function _toPropertyKey(t) {
      var i = _toPrimitive(t, "string");
      return "symbol" == typeof i ? i : i + "";
    }
    function _typeof(o) {
      "@babel/helpers - typeof";

      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
        return typeof o;
      } : function (o) {
        return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
      }, _typeof(o);
    }
    function _unsupportedIterableToArray(r, a) {
      if (r) {
        if ("string" == typeof r) return _arrayLikeToArray(r, a);
        var t = {}.toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
      }
    }
    function _wrapNativeSuper(t) {
      var r = "function" == typeof Map ? new Map() : void 0;
      return _wrapNativeSuper = function (t) {
        if (null === t || !_isNativeFunction(t)) return t;
        if ("function" != typeof t) throw new TypeError("Super expression must either be null or a function");
        if (void 0 !== r) {
          if (r.has(t)) return r.get(t);
          r.set(t, Wrapper);
        }
        function Wrapper() {
          return _construct(t, arguments, _getPrototypeOf(this).constructor);
        }
        return Wrapper.prototype = Object.create(t.prototype, {
          constructor: {
            value: Wrapper,
            enumerable: false,
            writable: true,
            configurable: true
          }
        }), _setPrototypeOf(Wrapper, t);
      }, _wrapNativeSuper(t);
    }

    // src/storages/globalConfig/globalConfig.ts
    var store;
    // @__NO_SIDE_EFFECTS__
    function getGlobalConfig(config2) {
      var _config2$lang, _store, _config2$abortEarly, _store2, _config2$abortPipeEar, _store3;
      return {
        lang: (_config2$lang = void 0 ) !== null && _config2$lang !== void 0 ? _config2$lang : (_store = store) === null || _store === void 0 ? void 0 : _store.lang,
        message: config2 === null || config2 === void 0 ? void 0 : config2.message,
        abortEarly: (_config2$abortEarly = void 0 ) !== null && _config2$abortEarly !== void 0 ? _config2$abortEarly : (_store2 = store) === null || _store2 === void 0 ? void 0 : _store2.abortEarly,
        abortPipeEarly: (_config2$abortPipeEar = void 0 ) !== null && _config2$abortPipeEar !== void 0 ? _config2$abortPipeEar : (_store3 = store) === null || _store3 === void 0 ? void 0 : _store3.abortPipeEarly
      };
    }

    // src/storages/globalMessage/globalMessage.ts
    var store2;
    // @__NO_SIDE_EFFECTS__
    function getGlobalMessage(lang) {
      var _store4;
      return (_store4 = store2) === null || _store4 === void 0 ? void 0 : _store4.get(lang);
    }

    // src/storages/schemaMessage/schemaMessage.ts
    var store3;
    // @__NO_SIDE_EFFECTS__
    function getSchemaMessage(lang) {
      var _store6;
      return (_store6 = store3) === null || _store6 === void 0 ? void 0 : _store6.get(lang);
    }

    // src/storages/specificMessage/specificMessage.ts
    var store4;
    // @__NO_SIDE_EFFECTS__
    function getSpecificMessage(reference, lang) {
      var _store8;
      return (_store8 = store4) === null || _store8 === void 0 || (_store8 = _store8.get(reference)) === null || _store8 === void 0 ? void 0 : _store8.get(lang);
    }

    // src/utils/_stringify/_stringify.ts
    // @__NO_SIDE_EFFECTS__
    function _stringify(input) {
      var type = _typeof(input);
      if (type === "string") {
        return "\"".concat(input, "\"");
      }
      if (type === "number" || type === "bigint" || type === "boolean") {
        return "".concat(input);
      }
      if (type === "object" || type === "function") {
        var _ref, _Object$getPrototypeO;
        return (_ref = input && ((_Object$getPrototypeO = Object.getPrototypeOf(input)) === null || _Object$getPrototypeO === void 0 || (_Object$getPrototypeO = _Object$getPrototypeO.constructor) === null || _Object$getPrototypeO === void 0 ? void 0 : _Object$getPrototypeO.name)) !== null && _ref !== void 0 ? _ref : "null";
      }
      return type;
    }

    // src/utils/_addIssue/_addIssue.ts
    function _addIssue(context, label, dataset, config2, other) {
      var _ref2, _other$expected, _other$received, _ref3, _ref4, _ref5, _ref6, _other$message;
      var input = other && "input" in other ? other.input : dataset.value;
      var expected = (_ref2 = (_other$expected = other === null || other === void 0 ? void 0 : other.expected) !== null && _other$expected !== void 0 ? _other$expected : context.expects) !== null && _ref2 !== void 0 ? _ref2 : null;
      var received = (_other$received = other === null || other === void 0 ? void 0 : other.received) !== null && _other$received !== void 0 ? _other$received : _stringify(input);
      var issue = {
        kind: context.kind,
        type: context.type,
        input: input,
        expected: expected,
        received: received,
        message: "Invalid ".concat(label, ": ").concat(expected ? "Expected ".concat(expected, " but r") : "R", "eceived ").concat(received),
        requirement: context.requirement,
        path: other === null || other === void 0 ? void 0 : other.path,
        issues: other === null || other === void 0 ? void 0 : other.issues,
        lang: config2.lang,
        abortEarly: config2.abortEarly,
        abortPipeEarly: config2.abortPipeEarly
      };
      var isSchema = context.kind === "schema";
      var message2 = (_ref3 = (_ref4 = (_ref5 = (_ref6 = (_other$message = other === null || other === void 0 ? void 0 : other.message) !== null && _other$message !== void 0 ? _other$message : context.message) !== null && _ref6 !== void 0 ? _ref6 : getSpecificMessage(context.reference, issue.lang)) !== null && _ref5 !== void 0 ? _ref5 : isSchema ? getSchemaMessage(issue.lang) : null) !== null && _ref4 !== void 0 ? _ref4 : config2.message) !== null && _ref3 !== void 0 ? _ref3 : getGlobalMessage(issue.lang);
      if (message2 !== void 0) {
        issue.message = typeof message2 === "function" ?
        // @ts-expect-error
        message2(issue) : message2;
      }
      if (isSchema) {
        dataset.typed = false;
      }
      if (dataset.issues) {
        dataset.issues.push(issue);
      } else {
        dataset.issues = [issue];
      }
    }

    // src/utils/_getStandardProps/_getStandardProps.ts
    // @__NO_SIDE_EFFECTS__
    function _getStandardProps(context) {
      return {
        version: 1,
        vendor: "valibot",
        validate: function validate(value2) {
          return context["~run"]({
            value: value2
          }, getGlobalConfig());
        }
      };
    }

    // src/utils/_isValidObjectKey/_isValidObjectKey.ts
    // @__NO_SIDE_EFFECTS__
    function _isValidObjectKey(object2, key) {
      return Object.hasOwn(object2, key) && key !== "__proto__" && key !== "prototype" && key !== "constructor";
    }

    // src/utils/_joinExpects/_joinExpects.ts
    // @__NO_SIDE_EFFECTS__
    function _joinExpects(values2, separator) {
      var _list$;
      var list = _toConsumableArray(new Set(values2));
      if (list.length > 1) {
        return "(".concat(list.join(" ".concat(separator, " ")), ")");
      }
      return (_list$ = list[0]) !== null && _list$ !== void 0 ? _list$ : "never";
    }

    // src/utils/ValiError/ValiError.ts
    var ValiError = /*#__PURE__*/function (_Error) {
      /**
       * Creates a Valibot error with useful information.
       *
       * @param issues The error issues.
       */
      function ValiError(issues) {
        var _this;
        _classCallCheck(this, ValiError);
        _this = _callSuper(this, ValiError, [issues[0].message]);
        _this.name = "ValiError";
        _this.issues = issues;
        return _this;
      }
      _inherits(ValiError, _Error);
      return _createClass(ValiError);
    }(/*#__PURE__*/_wrapNativeSuper(Error));

    // src/actions/check/check.ts
    // @__NO_SIDE_EFFECTS__
    function check(requirement, message2) {
      return {
        kind: "validation",
        type: "check",
        reference: check,
        async: false,
        expects: null,
        requirement: requirement,
        message: message2,
        "~run": function run(dataset, config2) {
          if (dataset.typed && !this.requirement(dataset.value)) {
            _addIssue(this, "input", dataset, config2);
          }
          return dataset;
        }
      };
    }

    // src/actions/notValue/notValue.ts
    // @__NO_SIDE_EFFECTS__
    function notValue(requirement, message2) {
      return {
        kind: "validation",
        type: "not_value",
        reference: notValue,
        async: false,
        expects: requirement instanceof Date ? "!".concat(requirement.toJSON()) : "!".concat(_stringify(requirement)),
        requirement: requirement,
        message: message2,
        "~run": function run(dataset, config2) {
          if (dataset.typed && this.requirement <= dataset.value && this.requirement >= dataset.value) {
            _addIssue(this, "value", dataset, config2, {
              received: dataset.value instanceof Date ? dataset.value.toJSON() : _stringify(dataset.value)
            });
          }
          return dataset;
        }
      };
    }

    // src/actions/regex/regex.ts
    // @__NO_SIDE_EFFECTS__
    function regex(requirement, message2) {
      return {
        kind: "validation",
        type: "regex",
        reference: regex,
        async: false,
        expects: "".concat(requirement),
        requirement: requirement,
        message: message2,
        "~run": function run(dataset, config2) {
          if (dataset.typed && !this.requirement.test(dataset.value)) {
            _addIssue(this, "format", dataset, config2);
          }
          return dataset;
        }
      };
    }

    // src/methods/getFallback/getFallback.ts
    // @__NO_SIDE_EFFECTS__
    function getFallback(schema, dataset, config2) {
      return typeof schema.fallback === "function" ?
      // @ts-expect-error
      schema.fallback(dataset, config2) :
      // @ts-expect-error
      schema.fallback;
    }

    // src/methods/getDefault/getDefault.ts
    // @__NO_SIDE_EFFECTS__
    function getDefault(schema, dataset, config2) {
      return typeof schema["default"] === "function" ?
      // @ts-expect-error
      schema["default"](dataset, config2) :
      // @ts-expect-error
      schema["default"];
    }

    // src/methods/is/is.ts
    // @__NO_SIDE_EFFECTS__
    function is(schema, input) {
      return !schema["~run"]({
        value: input
      }, {
        abortEarly: true
      }).issues;
    }

    // src/schemas/array/array.ts
    // @__NO_SIDE_EFFECTS__
    function array(item, message2) {
      return {
        kind: "schema",
        type: "array",
        reference: array,
        expects: "Array",
        async: false,
        item: item,
        message: message2,
        get "~standard"() {
          return _getStandardProps(this);
        },
        "~run": function run(dataset, config2) {
          var input = dataset.value;
          if (Array.isArray(input)) {
            dataset.typed = true;
            dataset.value = [];
            for (var key = 0; key < input.length; key++) {
              var value2 = input[key];
              var itemDataset = this.item["~run"]({
                value: value2
              }, config2);
              if (itemDataset.issues) {
                var pathItem = {
                  type: "array",
                  origin: "value",
                  input: input,
                  key: key,
                  value: value2
                };
                var _iterator12 = _createForOfIteratorHelper(itemDataset.issues),
                  _step12;
                try {
                  for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
                    var _dataset$issues;
                    var issue = _step12.value;
                    if (issue.path) {
                      issue.path.unshift(pathItem);
                    } else {
                      issue.path = [pathItem];
                    }
                    (_dataset$issues = dataset.issues) === null || _dataset$issues === void 0 || _dataset$issues.push(issue);
                  }
                } catch (err) {
                  _iterator12.e(err);
                } finally {
                  _iterator12.f();
                }
                if (!dataset.issues) {
                  dataset.issues = itemDataset.issues;
                }
                if (config2.abortEarly) {
                  dataset.typed = false;
                  break;
                }
              }
              if (!itemDataset.typed) {
                dataset.typed = false;
              }
              dataset.value.push(itemDataset.value);
            }
          } else {
            _addIssue(this, "type", dataset, config2);
          }
          return dataset;
        }
      };
    }

    // src/schemas/boolean/boolean.ts
    // @__NO_SIDE_EFFECTS__
    function _boolean(message2) {
      return {
        kind: "schema",
        type: "boolean",
        reference: _boolean,
        expects: "boolean",
        async: false,
        message: message2,
        get "~standard"() {
          return _getStandardProps(this);
        },
        "~run": function run(dataset, config2) {
          if (typeof dataset.value === "boolean") {
            dataset.typed = true;
          } else {
            _addIssue(this, "type", dataset, config2);
          }
          return dataset;
        }
      };
    }

    // src/schemas/instance/instance.ts
    // @__NO_SIDE_EFFECTS__
    function instance(class_, message2) {
      return {
        kind: "schema",
        type: "instance",
        reference: instance,
        expects: class_.name,
        async: false,
        "class": class_,
        message: message2,
        get "~standard"() {
          return _getStandardProps(this);
        },
        "~run": function run(dataset, config2) {
          if (dataset.value instanceof this["class"]) {
            dataset.typed = true;
          } else {
            _addIssue(this, "type", dataset, config2);
          }
          return dataset;
        }
      };
    }

    // src/schemas/intersect/utils/_merge/_merge.ts
    // @__NO_SIDE_EFFECTS__
    function _merge(value1, value2) {
      if (_typeof(value1) === _typeof(value2)) {
        if (value1 === value2 || value1 instanceof Date && value2 instanceof Date && +value1 === +value2) {
          return {
            value: value1
          };
        }
        if (value1 && value2 && value1.constructor === Object && value2.constructor === Object) {
          for (var key in value2) {
            if (key in value1) {
              var dataset = /* @__PURE__ */_merge(value1[key], value2[key]);
              if (dataset.issue) {
                return dataset;
              }
              value1[key] = dataset.value;
            } else {
              value1[key] = value2[key];
            }
          }
          return {
            value: value1
          };
        }
        if (Array.isArray(value1) && Array.isArray(value2)) {
          if (value1.length === value2.length) {
            for (var index = 0; index < value1.length; index++) {
              var _dataset = /* @__PURE__ */_merge(value1[index], value2[index]);
              if (_dataset.issue) {
                return _dataset;
              }
              value1[index] = _dataset.value;
            }
            return {
              value: value1
            };
          }
        }
      }
      return {
        issue: true
      };
    }

    // src/schemas/intersect/intersect.ts
    // @__NO_SIDE_EFFECTS__
    function intersect(options, message2) {
      return {
        kind: "schema",
        type: "intersect",
        reference: intersect,
        expects: _joinExpects(options.map(function (option) {
          return option.expects;
        }), "&"),
        async: false,
        options: options,
        message: message2,
        get "~standard"() {
          return _getStandardProps(this);
        },
        "~run": function run(dataset, config2) {
          if (this.options.length) {
            var input = dataset.value;
            var outputs;
            dataset.typed = true;
            var _iterator14 = _createForOfIteratorHelper(this.options),
              _step14;
            try {
              for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
                var schema = _step14.value;
                var optionDataset = schema["~run"]({
                  value: input
                }, config2);
                if (optionDataset.issues) {
                  if (dataset.issues) {
                    var _dataset$issues3;
                    (_dataset$issues3 = dataset.issues).push.apply(_dataset$issues3, _toConsumableArray(optionDataset.issues));
                  } else {
                    dataset.issues = optionDataset.issues;
                  }
                  if (config2.abortEarly) {
                    dataset.typed = false;
                    break;
                  }
                }
                if (!optionDataset.typed) {
                  dataset.typed = false;
                }
                if (dataset.typed) {
                  if (outputs) {
                    outputs.push(optionDataset.value);
                  } else {
                    outputs = [optionDataset.value];
                  }
                }
              }
            } catch (err) {
              _iterator14.e(err);
            } finally {
              _iterator14.f();
            }
            if (dataset.typed) {
              dataset.value = outputs[0];
              for (var index = 1; index < outputs.length; index++) {
                var mergeDataset = _merge(dataset.value, outputs[index]);
                if (mergeDataset.issue) {
                  _addIssue(this, "type", dataset, config2, {
                    received: "unknown"
                  });
                  break;
                }
                dataset.value = mergeDataset.value;
              }
            }
          } else {
            _addIssue(this, "type", dataset, config2);
          }
          return dataset;
        }
      };
    }

    // src/schemas/literal/literal.ts
    // @__NO_SIDE_EFFECTS__
    function literal(literal_, message2) {
      return {
        kind: "schema",
        type: "literal",
        reference: literal,
        expects: _stringify(literal_),
        async: false,
        literal: literal_,
        message: message2,
        get "~standard"() {
          return _getStandardProps(this);
        },
        "~run": function run(dataset, config2) {
          if (dataset.value === this.literal) {
            dataset.typed = true;
          } else {
            _addIssue(this, "type", dataset, config2);
          }
          return dataset;
        }
      };
    }

    // src/schemas/nullable/nullable.ts
    // @__NO_SIDE_EFFECTS__
    function nullable(wrapped, default_) {
      return {
        kind: "schema",
        type: "nullable",
        reference: nullable,
        expects: "(".concat(wrapped.expects, " | null)"),
        async: false,
        wrapped: wrapped,
        "default": default_,
        get "~standard"() {
          return _getStandardProps(this);
        },
        "~run": function run(dataset, config2) {
          if (dataset.value === null) {
            if (this["default"] !== void 0) {
              dataset.value = getDefault(this, dataset, config2);
            }
            if (dataset.value === null) {
              dataset.typed = true;
              return dataset;
            }
          }
          return this.wrapped["~run"](dataset, config2);
        }
      };
    }

    // src/schemas/number/number.ts
    // @__NO_SIDE_EFFECTS__
    function number(message2) {
      return {
        kind: "schema",
        type: "number",
        reference: number,
        expects: "number",
        async: false,
        message: message2,
        get "~standard"() {
          return _getStandardProps(this);
        },
        "~run": function run(dataset, config2) {
          if (typeof dataset.value === "number" && !isNaN(dataset.value)) {
            dataset.typed = true;
          } else {
            _addIssue(this, "type", dataset, config2);
          }
          return dataset;
        }
      };
    }

    // src/schemas/object/object.ts
    // @__NO_SIDE_EFFECTS__
    function object(entries2, message2) {
      return {
        kind: "schema",
        type: "object",
        reference: object,
        expects: "Object",
        async: false,
        entries: entries2,
        message: message2,
        get "~standard"() {
          return _getStandardProps(this);
        },
        "~run": function run(dataset, config2) {
          var input = dataset.value;
          if (input && _typeof(input) === "object") {
            dataset.typed = true;
            dataset.value = {};
            for (var key in this.entries) {
              var valueSchema = this.entries[key];
              if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") &&
              // @ts-expect-error
              valueSchema["default"] !== void 0) {
                var value2 = key in input ?
                // @ts-expect-error
                input[key] : getDefault(valueSchema);
                var valueDataset = valueSchema["~run"]({
                  value: value2
                }, config2);
                if (valueDataset.issues) {
                  var pathItem = {
                    type: "object",
                    origin: "value",
                    input: input,
                    key: key,
                    value: value2
                  };
                  var _iterator28 = _createForOfIteratorHelper(valueDataset.issues),
                    _step28;
                  try {
                    for (_iterator28.s(); !(_step28 = _iterator28.n()).done;) {
                      var _dataset$issues11;
                      var issue = _step28.value;
                      if (issue.path) {
                        issue.path.unshift(pathItem);
                      } else {
                        issue.path = [pathItem];
                      }
                      (_dataset$issues11 = dataset.issues) === null || _dataset$issues11 === void 0 || _dataset$issues11.push(issue);
                    }
                  } catch (err) {
                    _iterator28.e(err);
                  } finally {
                    _iterator28.f();
                  }
                  if (!dataset.issues) {
                    dataset.issues = valueDataset.issues;
                  }
                  if (config2.abortEarly) {
                    dataset.typed = false;
                    break;
                  }
                }
                if (!valueDataset.typed) {
                  dataset.typed = false;
                }
                dataset.value[key] = valueDataset.value;
              } else if (valueSchema.fallback !== void 0) {
                dataset.value[key] = getFallback(valueSchema);
              } else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
                _addIssue(this, "key", dataset, config2, {
                  input: void 0,
                  expected: "\"".concat(key, "\""),
                  path: [{
                    type: "object",
                    origin: "key",
                    input: input,
                    key: key,
                    // @ts-expect-error
                    value: input[key]
                  }]
                });
                if (config2.abortEarly) {
                  break;
                }
              }
            }
          } else {
            _addIssue(this, "type", dataset, config2);
          }
          return dataset;
        }
      };
    }

    // src/schemas/optional/optional.ts
    // @__NO_SIDE_EFFECTS__
    function optional(wrapped, default_) {
      return {
        kind: "schema",
        type: "optional",
        reference: optional,
        expects: "(".concat(wrapped.expects, " | undefined)"),
        async: false,
        wrapped: wrapped,
        "default": default_,
        get "~standard"() {
          return _getStandardProps(this);
        },
        "~run": function run(dataset, config2) {
          if (dataset.value === void 0) {
            if (this["default"] !== void 0) {
              dataset.value = getDefault(this, dataset, config2);
            }
            if (dataset.value === void 0) {
              dataset.typed = true;
              return dataset;
            }
          }
          return this.wrapped["~run"](dataset, config2);
        }
      };
    }

    // src/schemas/record/record.ts
    // @__NO_SIDE_EFFECTS__
    function record(key, value2, message2) {
      return {
        kind: "schema",
        type: "record",
        reference: record,
        expects: "Object",
        async: false,
        key: key,
        value: value2,
        message: message2,
        get "~standard"() {
          return _getStandardProps(this);
        },
        "~run": function run(dataset, config2) {
          var input = dataset.value;
          if (input && _typeof(input) === "object") {
            dataset.typed = true;
            dataset.value = {};
            for (var entryKey in input) {
              if (_isValidObjectKey(input, entryKey)) {
                var entryValue = input[entryKey];
                var keyDataset = this.key["~run"]({
                  value: entryKey
                }, config2);
                if (keyDataset.issues) {
                  var pathItem = {
                    type: "object",
                    origin: "key",
                    input: input,
                    key: entryKey,
                    value: entryValue
                  };
                  var _iterator37 = _createForOfIteratorHelper(keyDataset.issues),
                    _step37;
                  try {
                    for (_iterator37.s(); !(_step37 = _iterator37.n()).done;) {
                      var _dataset$issues17;
                      var issue = _step37.value;
                      issue.path = [pathItem];
                      (_dataset$issues17 = dataset.issues) === null || _dataset$issues17 === void 0 || _dataset$issues17.push(issue);
                    }
                  } catch (err) {
                    _iterator37.e(err);
                  } finally {
                    _iterator37.f();
                  }
                  if (!dataset.issues) {
                    dataset.issues = keyDataset.issues;
                  }
                  if (config2.abortEarly) {
                    dataset.typed = false;
                    break;
                  }
                }
                var valueDataset = this.value["~run"]({
                  value: entryValue
                }, config2);
                if (valueDataset.issues) {
                  var _pathItem5 = {
                    type: "object",
                    origin: "value",
                    input: input,
                    key: entryKey,
                    value: entryValue
                  };
                  var _iterator38 = _createForOfIteratorHelper(valueDataset.issues),
                    _step38;
                  try {
                    for (_iterator38.s(); !(_step38 = _iterator38.n()).done;) {
                      var _dataset$issues18;
                      var _issue5 = _step38.value;
                      if (_issue5.path) {
                        _issue5.path.unshift(_pathItem5);
                      } else {
                        _issue5.path = [_pathItem5];
                      }
                      (_dataset$issues18 = dataset.issues) === null || _dataset$issues18 === void 0 || _dataset$issues18.push(_issue5);
                    }
                  } catch (err) {
                    _iterator38.e(err);
                  } finally {
                    _iterator38.f();
                  }
                  if (!dataset.issues) {
                    dataset.issues = valueDataset.issues;
                  }
                  if (config2.abortEarly) {
                    dataset.typed = false;
                    break;
                  }
                }
                if (!keyDataset.typed || !valueDataset.typed) {
                  dataset.typed = false;
                }
                if (keyDataset.typed) {
                  dataset.value[keyDataset.value] = valueDataset.value;
                }
              }
            }
          } else {
            _addIssue(this, "type", dataset, config2);
          }
          return dataset;
        }
      };
    }

    // src/schemas/string/string.ts
    // @__NO_SIDE_EFFECTS__
    function string(message2) {
      return {
        kind: "schema",
        type: "string",
        reference: string,
        expects: "string",
        async: false,
        message: message2,
        get "~standard"() {
          return _getStandardProps(this);
        },
        "~run": function run(dataset, config2) {
          if (typeof dataset.value === "string") {
            dataset.typed = true;
          } else {
            _addIssue(this, "type", dataset, config2);
          }
          return dataset;
        }
      };
    }

    // src/schemas/union/utils/_subIssues/_subIssues.ts
    // @__NO_SIDE_EFFECTS__
    function _subIssues(datasets) {
      var issues;
      if (datasets) {
        var _iterator61 = _createForOfIteratorHelper(datasets),
          _step61;
        try {
          for (_iterator61.s(); !(_step61 = _iterator61.n()).done;) {
            var dataset = _step61.value;
            if (issues) {
              var _issues;
              (_issues = issues).push.apply(_issues, _toConsumableArray(dataset.issues));
            } else {
              issues = dataset.issues;
            }
          }
        } catch (err) {
          _iterator61.e(err);
        } finally {
          _iterator61.f();
        }
      }
      return issues;
    }

    // src/schemas/union/union.ts
    // @__NO_SIDE_EFFECTS__
    function union(options, message2) {
      return {
        kind: "schema",
        type: "union",
        reference: union,
        expects: _joinExpects(options.map(function (option) {
          return option.expects;
        }), "|"),
        async: false,
        options: options,
        message: message2,
        get "~standard"() {
          return _getStandardProps(this);
        },
        "~run": function run(dataset, config2) {
          var _untypedDatasets;
          var validDataset;
          var typedDatasets;
          var untypedDatasets;
          var _iterator62 = _createForOfIteratorHelper(this.options),
            _step62;
          try {
            for (_iterator62.s(); !(_step62 = _iterator62.n()).done;) {
              var schema = _step62.value;
              var optionDataset = schema["~run"]({
                value: dataset.value
              }, config2);
              if (optionDataset.typed) {
                if (optionDataset.issues) {
                  if (typedDatasets) {
                    typedDatasets.push(optionDataset);
                  } else {
                    typedDatasets = [optionDataset];
                  }
                } else {
                  validDataset = optionDataset;
                  break;
                }
              } else {
                if (untypedDatasets) {
                  untypedDatasets.push(optionDataset);
                } else {
                  untypedDatasets = [optionDataset];
                }
              }
            }
          } catch (err) {
            _iterator62.e(err);
          } finally {
            _iterator62.f();
          }
          if (validDataset) {
            return validDataset;
          }
          if (typedDatasets) {
            if (typedDatasets.length === 1) {
              return typedDatasets[0];
            }
            _addIssue(this, "type", dataset, config2, {
              issues: _subIssues(typedDatasets)
            });
            dataset.typed = true;
          } else if (((_untypedDatasets = untypedDatasets) === null || _untypedDatasets === void 0 ? void 0 : _untypedDatasets.length) === 1) {
            return untypedDatasets[0];
          } else {
            _addIssue(this, "type", dataset, config2, {
              issues: _subIssues(untypedDatasets)
            });
          }
          return dataset;
        }
      };
    }

    // src/schemas/unknown/unknown.ts
    // @__NO_SIDE_EFFECTS__
    function unknown() {
      return {
        kind: "schema",
        type: "unknown",
        reference: unknown,
        expects: "unknown",
        async: false,
        get "~standard"() {
          return _getStandardProps(this);
        },
        "~run": function run(dataset) {
          dataset.typed = true;
          return dataset;
        }
      };
    }

    // src/methods/omit/omit.ts
    // @__NO_SIDE_EFFECTS__
    function omit(schema, keys) {
      var entries2 = _objectSpread2({}, schema.entries);
      var _iterator68 = _createForOfIteratorHelper(keys),
        _step68;
      try {
        for (_iterator68.s(); !(_step68 = _iterator68.n()).done;) {
          var key = _step68.value;
          delete entries2[key];
        }
      } catch (err) {
        _iterator68.e(err);
      } finally {
        _iterator68.f();
      }
      return _objectSpread2(_objectSpread2({}, schema), {}, {
        entries: entries2,
        get "~standard"() {
          return _getStandardProps(this);
        }
      });
    }

    // src/methods/parse/parse.ts
    function parse(schema, input, config2) {
      var dataset = schema["~run"]({
        value: input
      }, getGlobalConfig(config2));
      if (dataset.issues) {
        throw new ValiError(dataset.issues);
      }
      return dataset.value;
    }

    // src/methods/pipe/pipe.ts
    // @__NO_SIDE_EFFECTS__
    function pipe() {
      for (var _len3 = arguments.length, pipe2 = new Array(_len3), _key11 = 0; _key11 < _len3; _key11++) {
        pipe2[_key11] = arguments[_key11];
      }
      return _objectSpread2(_objectSpread2({}, pipe2[0]), {}, {
        pipe: pipe2,
        get "~standard"() {
          return _getStandardProps(this);
        },
        "~run": function run(dataset, config2) {
          for (var _i2 = 0, _pipe = pipe2; _i2 < _pipe.length; _i2++) {
            var item = _pipe[_i2];
            if (item.kind !== "metadata") {
              if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
                dataset.typed = false;
                break;
              }
              if (!dataset.issues || !config2.abortEarly && !config2.abortPipeEarly) {
                dataset = item["~run"](dataset, config2);
              }
            }
          }
          return dataset;
        }
      });
    }

    // src/methods/safeParse/safeParse.ts
    // @__NO_SIDE_EFFECTS__
    function safeParse(schema, input, config2) {
      var dataset = schema["~run"]({
        value: input
      }, getGlobalConfig(config2));
      return {
        typed: dataset.typed,
        success: !dataset.issues,
        output: dataset.value,
        issues: dataset.issues
      };
    }

    const ZHTML5Fonts = union([
        literal("gothic"),
        literal("mincho"),
        literal("defont"),
    ]);

    const ZFormattedComment = object({
        id: optional(number(), 0),
        vpos: optional(number(), 0),
        content: optional(string(), ""),
        date: optional(number(), 0),
        date_usec: optional(number(), 0),
        owner: optional(_boolean(), false),
        premium: optional(_boolean(), false),
        mail: optional(array(string()), []),
        user_id: optional(number(), 0),
        layer: optional(number(), -1),
        is_my_post: optional(_boolean(), false),
    });
    const ZFormattedLegacyComment = omit(ZFormattedComment, [
        "layer",
        "user_id",
        "is_my_post",
    ]);

    const ZApiChat = object({
        thread: optional(string(), ""),
        no: optional(number(), 0),
        vpos: number(),
        date: optional(number(), 0),
        date_usec: optional(number(), 0),
        nicoru: optional(number(), 0),
        premium: optional(number(), 0),
        anonymity: optional(number(), 0),
        user_id: optional(string(), ""),
        mail: optional(string(), ""),
        content: string(),
        deleted: optional(number(), 0),
    });
    const ZRawApiResponse = union([
        object({ chat: ZApiChat }),
        record(pipe(string(), notValue("chat")), unknown()),
    ]);
    const ZApiPing = object({
        content: string(),
    });
    const ZApiThread = object({
        resultcode: number(),
        thread: string(),
        server_time: number(),
        ticket: string(),
        revision: number(),
    });
    const ZApiLeaf = object({
        thread: string(),
        count: number(),
    });
    const ZApiGlobalNumRes = object({
        thread: string(),
        num_res: number(),
    });

    const ZOwnerComment = object({
        time: string(),
        command: string(),
        comment: string(),
    });

    const ZV1Comment = object({
        id: string(),
        no: number(),
        vposMs: number(),
        body: string(),
        commands: array(string()),
        userId: string(),
        isPremium: _boolean(),
        score: number(),
        postedAt: string(),
        nicoruCount: number(),
        nicoruId: nullable(string()),
        source: string(),
        isMyPost: _boolean(),
    });
    const ZV1Thread = object({
        id: unknown(),
        fork: string(),
        commentCount: optional(number(), 0),
        comments: array(ZV1Comment),
    });

    const ZXml2jsChatItem = object({
        _: string(),
        $: object({
            no: optional(string()),
            vpos: string(),
            date: optional(string(), "0"),
            date_usec: optional(string(), "0"),
            user_id: optional(string()),
            owner: optional(string(), ""),
            premium: optional(string(), ""),
            mail: optional(string(), ""),
        }),
    });
    const ZXml2jsChat = object({
        chat: array(ZXml2jsChatItem),
    });
    const ZXml2jsPacket = object({
        packet: ZXml2jsChat,
    });

    const ZInputFormatType = union([
        literal("XMLDocument"),
        literal("niconicome"),
        literal("xml2js"),
        literal("formatted"),
        literal("legacy"),
        literal("legacyOwner"),
        literal("owner"),
        literal("v1"),
        literal("empty"),
        literal("default"),
    ]);

    const ZCommentFont = union([
        literal("defont"),
        literal("mincho"),
        literal("gothic"),
        literal("gulim"),
        literal("simsun"),
    ]);
    const ZCommentFlashFont = union([
        literal("defont"),
        literal("gulim"),
        literal("simsun"),
    ]);
    const ZCommentContentItemSpacer = object({
        type: literal("spacer"),
        char: string(),
        charWidth: number(),
        isButton: optional(_boolean()),
        font: optional(ZCommentFlashFont),
        count: number(),
    });
    const ZCommentContentItemText = object({
        type: literal("text"),
        content: string(),
        slicedContent: array(string()),
        isButton: optional(_boolean()),
        font: optional(ZCommentFlashFont),
        width: optional(array(number())),
    });
    const ZCommentContentItem = union([
        ZCommentContentItemSpacer,
        ZCommentContentItemText,
    ]);
    const ZCommentMeasuredContentItemText = intersect([
        ZCommentContentItem,
        object({
            width: array(number()),
        }),
    ]);
    const ZCommentMeasuredContentItem = union([
        ZCommentMeasuredContentItemText,
        ZCommentContentItemSpacer,
    ]);
    const ZCommentSize = union([
        literal("big"),
        literal("medium"),
        literal("small"),
    ]);
    const ZCommentLoc = union([
        literal("ue"),
        literal("naka"),
        literal("shita"),
    ]);
    const ZNicoScriptReverseTarget = union([
        literal("\u30b3\u30e1"),
        literal("\u6295\u30b3\u30e1"),
        literal("\u5168"),
    ]);
    const ZNicoScriptReplaceRange = union([
        literal("\u5358"),
        literal("\u5168"),
    ]);
    const ZNicoScriptReplaceTarget = union([
        literal("\u30b3\u30e1"),
        literal("\u6295\u30b3\u30e1"),
        literal("\u5168"),
        literal("\u542b\u307e\u306a\u3044"),
        literal("\u542b\u3080"),
    ]);
    const ZNicoScriptReplaceCondition = union([
        literal("\u90e8\u5206\u4e00\u81f4"),
        literal("\u5b8c\u5168\u4e00\u81f4"),
    ]);
    const ZMeasureInput = object({
        font: ZCommentFont,
        content: array(ZCommentContentItem),
        lineHeight: number(),
        charSize: number(),
        lineCount: number(),
    });

    const colors = {
        white: "#FFFFFF",
        red: "#FF0000",
        pink: "#FF8080",
        orange: "#FFC000",
        yellow: "#FFFF00",
        green: "#00FF00",
        cyan: "#00FFFF",
        blue: "#0000FF",
        purple: "#C000FF",
        black: "#000000",
        white2: "#CCCC99",
        niconicowhite: "#CCCC99",
        red2: "#CC0033",
        truered: "#CC0033",
        pink2: "#FF33CC",
        orange2: "#FF6600",
        passionorange: "#FF6600",
        yellow2: "#999900",
        madyellow: "#999900",
        green2: "#00CC66",
        elementalgreen: "#00CC66",
        cyan2: "#00CCCC",
        blue2: "#3399FF",
        marinblue: "#3399FF",
        purple2: "#6633CC",
        nobleviolet: "#6633CC",
        black2: "#666666",
    };

    var colors$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        colors: colors
    });

    const isBoolean = (i) => typeof i === "boolean";
    const isNumber = (i) => typeof i === "number";
    const isObject = (i) => typeof i === "object";
    const typeGuard = {
        formatted: {
            comment: (i) => is(ZFormattedComment, i),
            comments: (i) => is(array(ZFormattedComment), i),
            legacyComment: (i) => is(ZFormattedLegacyComment, i),
            legacyComments: (i) => is(array(ZFormattedLegacyComment), i),
        },
        legacy: {
            rawApiResponses: (i) => is(array(ZRawApiResponse), i),
            apiChat: (i) => is(ZApiChat, i),
            apiGlobalNumRes: (i) => is(ZApiGlobalNumRes, i),
            apiLeaf: (i) => is(ZApiLeaf, i),
            apiPing: (i) => is(ZApiPing, i),
            apiThread: (i) => is(ZApiThread, i),
        },
        xmlDocument: (i) => {
            if (!i.documentElement ||
                i.documentElement.nodeName !== "packet")
                return false;
            if (!i.documentElement.children)
                return false;
            for (const element of Array.from(i.documentElement.children)) {
                if (!element || element.nodeName !== "chat")
                    continue;
                if (!typeAttributeVerify(element, ["vpos", "date"]))
                    return false;
            }
            return true;
        },
        xml2js: {
            packet: (i) => is(ZXml2jsPacket, i),
            chat: (i) => is(ZXml2jsChat, i),
            chatItem: (i) => is(ZXml2jsChatItem, i),
        },
        legacyOwner: {
            comments: (i) => is(pipe(string(), check((i) => {
                const lists = i.split(/\r\n|\r|\n/);
                for (const list of lists) {
                    if (list.split(":").length < 3) {
                        return false;
                    }
                }
                return true;
            })), i),
        },
        owner: {
            comment: (i) => is(ZOwnerComment, i),
            comments: (i) => is(array(ZOwnerComment), i),
        },
        v1: {
            comment: (i) => is(ZV1Comment, i),
            comments: (i) => is(array(ZV1Comment), i),
            thread: (i) => is(ZV1Thread, i),
            threads: (i) => is(array(ZV1Thread), i),
        },
        nicoScript: {
            range: {
                target: (i) => is(ZNicoScriptReverseTarget, i),
            },
            replace: {
                range: (i) => is(ZNicoScriptReplaceRange, i),
                target: (i) => is(ZNicoScriptReplaceTarget, i),
                condition: (i) => is(ZNicoScriptReplaceCondition, i),
            },
        },
        comment: {
            font: (i) => is(ZCommentFont, i),
            loc: (i) => is(ZCommentLoc, i),
            size: (i) => is(ZCommentSize, i),
            command: {
                key: (i) => is(union([
                    literal("full"),
                    literal("ender"),
                    literal("_live"),
                    literal("invisible"),
                ]), i),
            },
            color: (i) => is(pipe(string(), check((i) => Object.keys(colors).includes(i))), i),
            colorCode: (i) => is(pipe(string(), regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6})$/)), i),
            colorCodeAllowAlpha: (i) => is(pipe(string(), regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)), i),
        },
        config: {
            initOptions: (item) => {
                if (typeof item !== "object" || !item)
                    return false;
                const keys = {
                    useLegacy: isBoolean,
                    formatted: isBoolean,
                    showCollision: isBoolean,
                    showFPS: isBoolean,
                    showCommentCount: isBoolean,
                    drawAllImageOnLoad: isBoolean,
                    debug: isBoolean,
                    enableLegacyPiP: isBoolean,
                    keepCA: isBoolean,
                    scale: isNumber,
                    config: isObject,
                    format: (i) => is(ZInputFormatType, i),
                    video: (i) => is(optional(instance(HTMLVideoElement)), i),
                };
                for (const key of Object.keys(keys)) {
                    if (item[key] !== undefined &&
                        !keys[key](item[key])) {
                        console.warn(`[Incorrect input] var: initOptions, key: ${key}, value: ${item[key]}`);
                        return false;
                    }
                }
                return true;
            },
        },
        internal: {
            CommentMeasuredContentItem: (i) => is(ZCommentMeasuredContentItem, i),
            CommentMeasuredContentItemArray: (i) => is(array(ZCommentMeasuredContentItem), i),
            MultiConfigItem: (i) => typeof i === "object" && objectVerify(i, ["html5", "flash"]),
            HTML5Fonts: (i) => is(ZHTML5Fonts, i),
            MeasureInput: (i) => is(ZMeasureInput, i),
        },
    };
    const objectVerify = (item, keys) => {
        if (typeof item !== "object" || !item)
            return false;
        for (const key of keys) {
            if (!Object.hasOwn(item, key))
                return false;
        }
        return true;
    };
    const typeAttributeVerify = (item, keys) => {
        if (typeof item !== "object" || !item)
            return false;
        for (const key of keys) {
            if (item.getAttribute(key) === null)
                return false;
        }
        return true;
    };

    var typeGuard$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        default: typeGuard
    });

    const getConfig = (input, isFlash = false) => {
        if (typeGuard.internal.MultiConfigItem(input)) {
            return input[isFlash ? "flash" : "html5"];
        }
        return input;
    };

    const isLineBreakResize = (comment) => {
        return (!comment.resized &&
            !comment.ender &&
            comment.lineCount >= config.lineBreakCount[comment.size]);
    };
    const getDefaultCommand = (vpos) => {
        nicoScripts.default = nicoScripts.default.filter((item) => !item.long || item.start + item.long >= vpos);
        let color = undefined;
        let size = undefined;
        let font = undefined;
        let loc = undefined;
        for (const item of nicoScripts.default) {
            if (item.loc) {
                loc = item.loc;
            }
            if (item.color) {
                color = item.color;
            }
            if (item.size) {
                size = item.size;
            }
            if (item.font) {
                font = item.font;
            }
            if (loc && color && size && font)
                break;
        }
        return { color, size, font, loc };
    };
    const nicoscriptReplaceIgnoreable = (comment, item) => ((item.target === "\u30b3\u30e1" ||
        item.target === "\u542b\u307e\u306a\u3044") &&
        comment.owner) ||
        (item.target === "\u6295\u30b3\u30e1" && !comment.owner) ||
        (item.target === "\u542b\u307e\u306a\u3044" && comment.owner) ||
        (item.condition === "\u5b8c\u5168\u4e00\u81f4" &&
            comment.content !== item.keyword) ||
        (item.condition === "\u90e8\u5206\u4e00\u81f4" &&
            comment.content.indexOf(item.keyword) === -1);
    const applyNicoScriptReplace = (comment, commands) => {
        nicoScripts.replace = nicoScripts.replace.filter((item) => !item.long || item.start + item.long >= comment.vpos);
        for (const item of nicoScripts.replace) {
            if (nicoscriptReplaceIgnoreable(comment, item))
                continue;
            if (item.range === "\u5358") {
                comment.content = comment.content.replaceAll(item.keyword, item.replace);
            }
            else {
                comment.content = item.replace;
            }
            if (item.loc) {
                commands.loc = item.loc;
            }
            if (item.color) {
                commands.color = item.color;
            }
            if (item.size) {
                commands.size = item.size;
            }
            if (item.font) {
                commands.font = item.font;
            }
        }
    };
    const parseCommandAndNicoScript = (comment) => {
        const isFlash = isFlashComment(comment);
        const commands = parseCommands(comment);
        processNicoscript(comment, commands);
        const defaultCommand = getDefaultCommand(comment.vpos);
        applyNicoScriptReplace(comment, commands);
        const size = commands.size ?? defaultCommand.size ?? "medium";
        return {
            size: size,
            loc: commands.loc ?? defaultCommand.loc ?? "naka",
            color: commands.color ?? defaultCommand.color ?? "#FFFFFF",
            font: commands.font ?? defaultCommand.font ?? "defont",
            fontSize: getConfig(config.fontSize, isFlash)[size].default,
            long: commands.long ? Math.floor(Number(commands.long) * 100) : 300,
            flash: isFlash,
            full: commands.full,
            ender: commands.ender,
            _live: commands._live,
            invisible: commands.invisible,
            strokeColor: commands.strokeColor,
            wakuColor: commands.wakuColor,
            fillColor: commands.fillColor,
            opacity: commands.opacity,
            button: commands.button,
        };
    };
    const parseBrackets = (input) => {
        const content = input.split("");
        const result = [];
        let quote = "";
        let lastChar = "";
        let string = "";
        for (const i of content) {
            if (RegExp(/^["'\u300c]$/).exec(i) && quote === "") {
                quote = i;
            }
            else if (RegExp(/^["']$/).exec(i) && quote === i && lastChar !== "\\") {
                result.push(string.replaceAll("\\n", "\n"));
                quote = "";
                string = "";
            }
            else if (i === "\u300d" && quote === "\u300c") {
                result.push(string);
                quote = "";
                string = "";
            }
            else if (quote === "" && RegExp(/^\s+$/).exec(i)) {
                if (string) {
                    result.push(string);
                    string = "";
                }
            }
            else {
                string += i;
            }
            lastChar = i;
        }
        result.push(string);
        return result;
    };
    const addNicoscriptReplace = (comment, commands) => {
        const result = parseBrackets(comment.content.slice(4));
        if (result[0] === undefined ||
            (result[2] !== undefined &&
                !typeGuard.nicoScript.replace.range(result[2])) ||
            (result[3] !== undefined &&
                !typeGuard.nicoScript.replace.target(result[3])) ||
            (result[4] !== undefined &&
                !typeGuard.nicoScript.replace.condition(result[4])))
            return;
        nicoScripts.replace.unshift({
            start: comment.vpos,
            long: commands.long === undefined ? undefined : Math.floor(commands.long * 100),
            keyword: result[0],
            replace: result[1] ?? "",
            range: result[2] ?? "\u5358",
            target: result[3] ?? "\u30b3\u30e1",
            condition: result[4] ?? "\u90e8\u5206\u4e00\u81f4",
            color: commands.color,
            size: commands.size,
            font: commands.font,
            loc: commands.loc,
            no: comment.id,
        });
        sortNicoscriptReplace();
    };
    const sortNicoscriptReplace = () => {
        nicoScripts.replace.sort((a, b) => {
            if (a.start < b.start)
                return -1;
            if (a.start > b.start)
                return 1;
            if (a.no < b.no)
                return -1;
            if (a.no > b.no)
                return 1;
            return 0;
        });
    };
    const processNicoscript = (comment, commands) => {
        const nicoscript = RegExp(/^[@\uff20](\S+)(?:\s(.+))?/).exec(comment.content);
        if (!nicoscript)
            return;
        if (nicoscript[1] === "\u30dc\u30bf\u30f3" && nicoscript[2]) {
            processAtButton(comment, commands);
            return;
        }
        if (!comment.owner)
            return;
        commands.invisible = true;
        if (nicoscript[1] === "\u30c7\u30d5\u30a9\u30eb\u30c8") {
            processDefaultScript(comment, commands);
            return;
        }
        if (nicoscript[1] === "\u9006") {
            processReverseScript(comment, commands);
            return;
        }
        if (nicoscript[1] === "\u30b3\u30e1\u30f3\u30c8\u7981\u6b62") {
            processBanScript(comment, commands);
            return;
        }
        if (nicoscript[1] === "\u30b7\u30fc\u30af\u7981\u6b62") {
            processSeekDisableScript$1(comment, commands);
            return;
        }
        if (nicoscript[1] === "\u30b8\u30e3\u30f3\u30d7" && nicoscript[2]) {
            processJumpScript$1(comment, commands, nicoscript[2]);
            return;
        }
        if (nicoscript[1] === "\u7f6e\u63db") {
            addNicoscriptReplace(comment, commands);
        }
    };
    const processDefaultScript = (comment, commands) => {
        nicoScripts.default.unshift({
            start: comment.vpos,
            long: commands.long === undefined ? undefined : Math.floor(commands.long * 100),
            color: commands.color,
            size: commands.size,
            font: commands.font,
            loc: commands.loc,
        });
    };
    const processReverseScript = (comment, commands) => {
        const reverse = RegExp(/^[@\uff20]\u9006(?:\s+)?(\u5168|\u30b3\u30e1|\u6295\u30b3\u30e1)?/).exec(comment.content);
        const target = typeGuard.nicoScript.range.target(reverse?.[1])
            ? reverse?.[1]
            : "全";
        if (commands.long === undefined) {
            commands.long = 30;
        }
        nicoScripts.reverse.unshift({
            start: comment.vpos,
            end: comment.vpos + commands.long * 100,
            target,
        });
    };
    const processBanScript = (comment, commands) => {
        if (commands.long === undefined) {
            commands.long = 30;
        }
        nicoScripts.ban.unshift({
            start: comment.vpos,
            end: comment.vpos + commands.long * 100,
        });
    };
    const processSeekDisableScript$1 = (comment, commands) => {
        if (commands.long === undefined) {
            commands.long = 30;
        }
        nicoScripts.seekDisable.unshift({
            start: comment.vpos,
            end: comment.vpos + commands.long * 100,
        });
    };
    const processJumpScript$1 = (comment, commands, input) => {
        const options = RegExp(/\s*((?:sm|so|nm|\uff53\uff4d|\uff53\uff4f|\uff4e\uff4d)?[1-9\uff11-\uff19][0-9\uff11-\uff19]*|#[0-9]+:[0-9]+(?:\.[0-9]+)?)\s+(.*)/).exec(input);
        if (!options?.[1])
            return;
        const end = commands.long === undefined
            ? undefined
            : commands.long * 100 + comment.vpos;
        nicoScripts.jump.unshift({
            start: comment.vpos,
            end,
            to: options[1],
            message: options[2],
        });
    };
    const processAtButton = (comment, commands) => {
        const args = parseBrackets(comment.content);
        if (args[1] === undefined)
            return;
        commands.invisible = false;
        const content = RegExp(/^(?:(?<before>.*?)\[)?(?<body>.*?)(?:\](?<after>[^\]]*?))?$/su).exec(args[1]);
        const message = {
            before: content.groups?.before ?? "",
            body: content.groups?.body ?? "",
            after: content.groups?.after ?? "",
        };
        commands.button = {
            message,
            commentMessage: args[2] ?? `${message.before}${message.body}${message.after}`,
            commentVisible: args[3] !== "\u975e\u8868\u793a",
            commentMail: args[4]?.split(",") ?? [],
            limit: Number(args[5] ?? 1),
            local: comment.mail.includes("local"),
            hidden: comment.mail.includes("hidden"),
        };
    };
    const parseCommands = (comment) => {
        const commands = comment.mail;
        const isFlash = isFlashComment(comment);
        const result = {
            loc: undefined,
            size: undefined,
            fontSize: undefined,
            color: undefined,
            strokeColor: undefined,
            wakuColor: undefined,
            font: undefined,
            full: false,
            ender: false,
            _live: false,
            invisible: false,
            long: undefined,
        };
        for (const command of commands) {
            parseCommand(comment, command, result, isFlash);
        }
        if (comment.content.startsWith("/")) {
            result.invisible = true;
        }
        return result;
    };
    const parseCommand = (comment, _command, result, isFlash) => {
        const command = _command.toLowerCase();
        const long = RegExp(/^[@\uff20]([0-9.]+)/).exec(command);
        if (long) {
            result.long = Number(long[1]);
            return;
        }
        const strokeColor = getColor(RegExp(/^nico:stroke:(.+)$/).exec(command));
        if (strokeColor) {
            result.strokeColor ??= strokeColor;
            return;
        }
        const rectColor = getColor(RegExp(/^nico:waku:(.+)$/).exec(command));
        if (rectColor) {
            result.wakuColor ??= rectColor;
            return;
        }
        const fillColor = getColor(RegExp(/^nico:fill:(.+)$/).exec(command));
        if (fillColor) {
            result.fillColor ??= fillColor;
            return;
        }
        const opacity = getOpacity(RegExp(/^nico:opacity:(.+)$/).exec(command));
        if (typeof opacity === "number") {
            result.opacity ??= opacity;
            return;
        }
        if (is(ZCommentLoc, command)) {
            result.loc ??= command;
            return;
        }
        if (result.size === undefined && is(ZCommentSize, command)) {
            result.size = command;
            result.fontSize = getConfig(config.fontSize, isFlash)[command].default;
            return;
        }
        if (config.colors[command]) {
            result.color ??= config.colors[command];
            return;
        }
        const colorCode = RegExp(/^#(?:[0-9a-z]{3}|[0-9a-z]{6})$/).exec(command);
        if (colorCode && comment.premium) {
            result.color ??= colorCode[0].toUpperCase();
            return;
        }
        if (is(ZCommentFont, command)) {
            result.font ??= command;
            return;
        }
        if (typeGuard.comment.command.key(command)) {
            result[command] = true;
        }
    };
    const getColor = (match) => {
        if (!match)
            return;
        const value = match[1];
        if (typeGuard.comment.color(value)) {
            return colors[value];
        }
        if (typeGuard.comment.colorCodeAllowAlpha(value)) {
            return value;
        }
        return;
    };
    const getOpacity = (match) => {
        if (!match)
            return;
        const value = Number(match[1]);
        if (!Number.isNaN(value) && value >= 0) {
            return value;
        }
        return;
    };
    const isFlashComment = (comment) => options.mode === "flash" ||
        (options.mode === "default" &&
            !(comment.mail.includes("gothic") ||
                comment.mail.includes("defont") ||
                comment.mail.includes("mincho")) &&
            (comment.date < config.flashThreshold ||
                comment.mail.includes("nico:flash")));
    const isReverseActive = (vpos, isOwner) => {
        for (const range of nicoScripts.reverse) {
            if ((range.target === "コメ" && isOwner) ||
                (range.target === "投コメ" && !isOwner))
                continue;
            if (range.start < vpos && vpos < range.end) {
                return true;
            }
        }
        return false;
    };
    const isBanActive = (vpos) => {
        for (const range of nicoScripts.ban) {
            if (range.start < vpos && vpos < range.end)
                return true;
        }
        return false;
    };
    const processFixedComment = (comment, collision, timeline, lazy = false) => {
        const posY = lazy ? -1 : getFixedPosY(comment, collision);
        for (let j = 0; j < comment.long; j++) {
            const vpos = comment.vpos + j;
            if (timeline[vpos]?.includes(comment))
                continue;
            arrayPush(timeline, vpos, comment);
            if (j > comment.long - 20)
                continue;
            arrayPush(collision, vpos, comment);
        }
        comment.posY = posY;
    };
    const processMovableComment = (comment, collision, timeline, lazy = false) => {
        const beforeVpos = Math.round(-288 / ((1632 + comment.width) / (comment.long + 125))) - 100;
        const posY = lazy ? -1 : getMovablePosY(comment, collision, beforeVpos);
        for (let j = beforeVpos, n = comment.long + 125; j < n; j++) {
            const vpos = comment.vpos + j;
            const leftPos = getPosX(comment.comment, vpos);
            if (timeline[vpos]?.includes(comment))
                continue;
            arrayPush(timeline, vpos, comment);
            if (leftPos + comment.width + config.collisionPadding >=
                config.collisionRange.right &&
                leftPos <= config.collisionRange.right) {
                arrayPush(collision.right, vpos, comment);
            }
            if (leftPos + comment.width + config.collisionPadding >=
                config.collisionRange.left &&
                leftPos <= config.collisionRange.left) {
                arrayPush(collision.left, vpos, comment);
            }
        }
        comment.posY = posY;
    };
    const getFixedPosY = (comment, collision) => {
        let posY = 0;
        let isChanged = true;
        let count = 0;
        while (isChanged && count < 10) {
            isChanged = false;
            count++;
            for (let j = 0; j < comment.long; j++) {
                const result = getPosY(posY, comment, collision[comment.vpos + j]);
                posY = result.currentPos;
                isChanged = result.isChanged;
                if (result.isBreak)
                    break;
            }
        }
        return posY;
    };
    const getMovablePosY = (comment, collision, beforeVpos) => {
        if (config.canvasHeight < comment.height) {
            return (comment.height - config.canvasHeight) / -2;
        }
        let posY = 0;
        let isChanged = true;
        let lastUpdatedIndex = undefined;
        while (isChanged) {
            isChanged = false;
            for (let j = beforeVpos, n = comment.long + 125; j < n; j += 5) {
                const vpos = comment.vpos + j;
                const leftPos = getPosX(comment.comment, vpos);
                let isBreak = false;
                if (lastUpdatedIndex !== undefined && lastUpdatedIndex === vpos) {
                    return posY;
                }
                if (leftPos + comment.width >= config.collisionRange.right &&
                    leftPos <= config.collisionRange.right) {
                    const result = getPosY(posY, comment, collision.right[vpos]);
                    posY = result.currentPos;
                    isChanged ||= result.isChanged;
                    if (result.isChanged)
                        lastUpdatedIndex = vpos;
                    isBreak = result.isBreak;
                }
                if (leftPos + comment.width >= config.collisionRange.left &&
                    leftPos <= config.collisionRange.left) {
                    const result = getPosY(posY, comment, collision.left[vpos]);
                    posY = result.currentPos;
                    isChanged ||= result.isChanged;
                    if (result.isChanged)
                        lastUpdatedIndex = vpos;
                    isBreak = result.isBreak;
                }
                if (isBreak)
                    return posY;
            }
        }
        return posY;
    };
    const getPosY = (_currentPos, targetComment, collision, _isChanged = false) => {
        let isBreak = false;
        if (!collision)
            return { currentPos: _currentPos, isChanged: _isChanged, isBreak };
        let currentPos = _currentPos;
        let isChanged = _isChanged;
        for (const collisionItem of collision) {
            if (collisionItem.index === targetComment.index || collisionItem.posY < 0)
                continue;
            if (collisionItem.owner === targetComment.owner &&
                collisionItem.layer === targetComment.layer &&
                currentPos < collisionItem.posY + collisionItem.height &&
                currentPos + targetComment.height > collisionItem.posY) {
                if (collisionItem.posY + collisionItem.height > currentPos) {
                    currentPos = collisionItem.posY + collisionItem.height;
                    isChanged = true;
                }
                if (currentPos + targetComment.height > config.canvasHeight) {
                    if (config.canvasHeight < targetComment.height) {
                        if (targetComment.mail.includes("naka")) {
                            currentPos = (targetComment.height - config.canvasHeight) / -2;
                        }
                        else {
                            currentPos = 0;
                        }
                    }
                    else {
                        currentPos = Math.floor(Math.random() * (config.canvasHeight - targetComment.height));
                    }
                    isBreak = true;
                    break;
                }
                return getPosY(currentPos, targetComment, collision, true);
            }
        }
        return { currentPos, isChanged, isBreak };
    };
    const getPosX = (comment, vpos, isReverse = false) => {
        if (comment.loc !== "naka") {
            return (config.canvasWidth - comment.width) / 2;
        }
        const speed = (config.commentDrawRange + comment.width * config.nakaCommentSpeedOffset) /
            (comment.long + 100);
        const vposLapsed = vpos - comment.vpos;
        const posX = config.commentDrawPadding +
            config.commentDrawRange -
            (vposLapsed + 100) * speed;
        if (isReverse) {
            return config.canvasWidth - comment.width - posX;
        }
        return posX;
    };
    const parseFont = (font, size) => {
        switch (font) {
            case "gulim":
            case "simsun":
                return config.fonts.flash[font].replace("[size]", `${size}`);
            case "gothic":
            case "mincho":
                return `${config.fonts.html5[font].weight} ${size}px ${config.fonts.html5[font].font}`;
            default:
                return `${config.fonts.html5.defont.weight} ${size}px ${config.fonts.html5.defont.font}`;
        }
    };

    const changeCALayer = (rawData) => {
        const userScoreList = getUsersScore(rawData);
        const filteredComments = removeDuplicateCommentArt(rawData);
        const commentArts = filteredComments.filter((comment) => (userScoreList[comment.user_id] ?? 0) >= config.sameCAMinScore &&
            !comment.owner);
        const commentArtsGroupedByUser = groupCommentsByUser(commentArts);
        const commentArtsGroupedByTimes = groupCommentsByTime(commentArtsGroupedByUser);
        updateLayerId(commentArtsGroupedByTimes);
        return filteredComments;
    };
    const getUsersScore = (comments) => {
        const userScoreList = {};
        for (const comment of comments) {
            if (comment.user_id === undefined || comment.user_id === -1)
                continue;
            userScoreList[comment.user_id] ||= 0;
            if (comment.mail.includes("ca") ||
                comment.mail.includes("patissier") ||
                comment.mail.includes("ender") ||
                comment.mail.includes("full")) {
                userScoreList[comment.user_id] =
                    (userScoreList[comment.user_id] ?? 0) + 5;
            }
            const lineCount = (comment.content.match(/\r\n|\n|\r/g) ?? []).length;
            if (lineCount > 2) {
                userScoreList[comment.user_id] =
                    (userScoreList[comment.user_id] ?? 0) + lineCount / 2;
            }
        }
        return userScoreList;
    };
    const removeDuplicateCommentArt = (comments) => {
        const index = {};
        return comments.filter((comment) => {
            const key = `${comment.content}@@${[...comment.mail]
            .sort((a, b) => a.localeCompare(b))
            .filter((e) => !RegExp(/@[\d.]+|184|device:.+|patissier|ca/).exec(e))
            .join("")}`;
            const lastComment = index[key];
            if (lastComment === undefined) {
                index[key] = comment;
                return true;
            }
            if (comment.vpos - lastComment.vpos > config.sameCAGap ||
                Math.abs(comment.date - lastComment.date) < config.sameCARange) {
                index[key] = comment;
                return true;
            }
            return false;
        });
    };
    const updateLayerId = (filteredComments) => {
        let layerId = 0;
        for (const user of filteredComments) {
            for (const time of user.comments) {
                for (const comment of time.comments) {
                    comment.layer = layerId;
                }
                layerId++;
            }
        }
    };
    const groupCommentsByUser = (comments) => {
        return comments.reduce((users, comment) => {
            const user = getUser(comment.user_id, users);
            user.comments.push(comment);
            return users;
        }, []);
    };
    const getUser = (userId, users) => {
        const user = users.find((user) => user.userId === userId);
        if (user)
            return user;
        const obj = {
            userId,
            comments: [],
        };
        users.push(obj);
        return obj;
    };
    const groupCommentsByTime = (comments) => {
        return comments.reduce((result, user) => {
            result.push({
                userId: user.userId,
                comments: user.comments.reduce((result, comment) => {
                    const time = getTime(comment.date, result);
                    time.comments.push(comment);
                    time.range.start = Math.min(time.range.start, comment.date);
                    time.range.end = Math.max(time.range.end, comment.date);
                    return result;
                }, []),
            });
            return result;
        }, []);
    };
    const getTime = (time, times) => {
        const timeObj = times.find((timeObj) => timeObj.range.start - config.sameCATimestampRange <= time &&
            timeObj.range.end + config.sameCATimestampRange >= time);
        if (timeObj)
            return timeObj;
        const obj = {
            range: {
                start: time,
                end: time,
            },
            comments: [],
        };
        times.push(obj);
        return obj;
    };

    const nativeSort = (getter) => {
        return (a, b) => {
            if (getter(a) > getter(b)) {
                return 1;
            }
            if (getter(a) < getter(b)) {
                return -1;
            }
            return 0;
        };
    };

    const getFlashFontIndex = (part) => {
        const regex = {
            simsunStrong: new RegExp(config.flashChar.simsunStrong),
            simsunWeak: new RegExp(config.flashChar.simsunWeak),
            gulim: new RegExp(config.flashChar.gulim),
            gothic: new RegExp(config.flashChar.gothic),
        };
        const index = [];
        let match = regex.simsunStrong.exec(part);
        if (match !== null) {
            index.push({ font: "simsunStrong", index: match.index });
        }
        match = regex.simsunWeak.exec(part);
        if (match !== null) {
            index.push({ font: "simsunWeak", index: match.index });
        }
        match = regex.gulim.exec(part);
        if (match !== null) {
            index.push({ font: "gulim", index: match.index });
        }
        match = regex.gothic.exec(part);
        if (match !== null) {
            index.push({ font: "gothic", index: match.index });
        }
        return index;
    };
    const getFlashFontName = (font) => {
        if (font === "simsunStrong" || font === "simsunWeak")
            return "simsun";
        if (font === "gothic")
            return "defont";
        return font;
    };
    const parseContent = (content) => {
        const results = [];
        const lines = Array.from(content.match(/\n|[^\n]+/g) ?? []);
        for (const line of lines) {
            const lineContent = parseLine(line);
            const firstContent = lineContent[0];
            const defaultFont = firstContent?.font;
            if (defaultFont) {
                results.push(...lineContent.map((val) => {
                    val.font ??= defaultFont;
                    if (val.type === "spacer") {
                        const spacer = config.compatSpacer.flash[val.char];
                        if (!spacer)
                            return val;
                        const width = spacer[val.font];
                        if (!width)
                            return val;
                        val.charWidth = width;
                    }
                    return val;
                }));
            }
            else {
                results.push(...lineContent);
            }
        }
        return results;
    };
    const parseLine = (line) => {
        const parts = Array.from(line.match(/[ -~｡-ﾟ]+|[^ -~｡-ﾟ]+/g) ?? []);
        const lineContent = [];
        for (const part of parts) {
            if (part.match(/[ -~｡-ﾟ]+/g) !== null) {
                addPartToResult(lineContent, part, "defont");
                continue;
            }
            parseFullWidthPart(part, lineContent);
        }
        return lineContent;
    };
    const addPartToResult = (lineContent, part, font) => {
        if (part === "")
            return;
        for (const key of Object.keys(config.compatSpacer.flash)) {
            const spacerWidth = config.compatSpacer.flash[key]?.[font ?? "defont"];
            if (!spacerWidth)
                continue;
            const compatIndex = part.indexOf(key);
            if (compatIndex >= 0) {
                addPartToResult(lineContent, part.slice(0, compatIndex), font);
                let i = compatIndex;
                for (; i < part.length && part[i] === key; i++) {
                }
                lineContent.push({
                    type: "spacer",
                    char: key,
                    charWidth: spacerWidth,
                    font,
                    count: i - compatIndex,
                });
                addPartToResult(lineContent, part.slice(i), font);
                return;
            }
        }
        lineContent.push({
            type: "text",
            content: part,
            slicedContent: part.split("\n"),
            font,
        });
    };
    const parseFullWidthPart = (part, lineContent) => {
        const index = getFlashFontIndex(part);
        if (index.length === 0) {
            addPartToResult(lineContent, part);
        }
        else if (index.length === 1 && index[0]) {
            addPartToResult(lineContent, part, getFlashFontName(index[0].font));
        }
        else {
            parseMultiFontFullWidthPart(part, index, lineContent);
        }
    };
    const parseMultiFontFullWidthPart = (part, index, lineContent) => {
        index.sort(nativeSort((val) => val.index));
        if (config.flashMode === "xp") {
            let offset = 0;
            for (let i = 1, n = index.length; i < n; i++) {
                const currentVal = index[i];
                const lastVal = index[i - 1];
                if (currentVal === undefined || lastVal === undefined)
                    continue;
                const content = part.slice(offset, currentVal.index);
                addPartToResult(lineContent, content, getFlashFontName(lastVal.font));
                offset = currentVal.index;
            }
            const val = index[index.length - 1];
            if (val) {
                const content = part.slice(offset);
                addPartToResult(lineContent, content, getFlashFontName(val.font));
            }
            return;
        }
        const firstVal = index[0];
        const secondVal = index[1];
        if (!firstVal || !secondVal) {
            addPartToResult(lineContent, part);
            return;
        }
        if (firstVal.font !== "gothic") {
            addPartToResult(lineContent, part, getFlashFontName(firstVal.font));
            return;
        }
        const firstContent = part.slice(0, secondVal.index);
        const secondContent = part.slice(secondVal.index);
        addPartToResult(lineContent, firstContent, getFlashFontName(firstVal.font));
        addPartToResult(lineContent, secondContent, getFlashFontName(secondVal.font));
    };
    const getButtonParts = (comment) => {
        let leftParts = undefined;
        const parts = [];
        const atButtonPadding = getConfig(config.atButtonPadding, true);
        const lineOffset = comment.lineOffset;
        const lineHeight = comment.fontSize * comment.lineHeight;
        const offsetKey = comment.resizedY ? "resized" : "default";
        const offsetY = config.flashCommentYPaddingTop[offsetKey] +
            comment.fontSize *
                comment.lineHeight *
                config.flashCommentYOffset[comment.size][offsetKey];
        let leftOffset = 0;
        let lineCount = 0;
        let isLastButton = false;
        for (const item of comment.content) {
            if (item.type === "spacer") {
                leftOffset += item.count * comment.fontSize * item.charWidth;
                continue;
            }
            const lines = item.slicedContent;
            for (let j = 0, n = lines.length; j < n; j++) {
                const line = lines[j];
                if (line === undefined)
                    continue;
                const posY = (lineOffset + lineCount + 1) * lineHeight + offsetY;
                const partWidth = item.width[j] ?? 0;
                if (comment.button && !comment.button.hidden) {
                    if (!isLastButton && item.isButton) {
                        leftParts = {
                            type: "left",
                            left: leftOffset + atButtonPadding,
                            top: posY - lineHeight + atButtonPadding,
                            width: partWidth + atButtonPadding,
                            height: lineHeight,
                        };
                        leftOffset += atButtonPadding * 2;
                    }
                    else if (isLastButton && item.isButton) {
                        parts.push({
                            type: "middle",
                            left: leftOffset,
                            top: posY - lineHeight + atButtonPadding,
                            width: partWidth,
                            height: lineHeight,
                        });
                    }
                    else if (isLastButton && !item.isButton) {
                        if (leftParts) {
                            comment.buttonObjects = {
                                left: leftParts,
                                middle: parts,
                                right: {
                                    type: "right",
                                    right: leftOffset + atButtonPadding,
                                    top: posY - lineHeight + atButtonPadding,
                                    height: lineHeight,
                                },
                            };
                        }
                        return comment;
                    }
                }
                if (j < n - 1) {
                    leftOffset = 0;
                    lineCount += 1;
                    continue;
                }
                leftOffset += partWidth;
            }
            isLastButton = !!item.isButton;
        }
        if (comment.button && !comment.button.hidden && isLastButton && leftParts) {
            const posY = (lineOffset + lineCount + 1) * lineHeight + offsetY;
            comment.buttonObjects = {
                left: leftParts,
                middle: parts,
                right: {
                    type: "right",
                    right: leftOffset + atButtonPadding,
                    top: posY - lineHeight + atButtonPadding,
                    height: lineHeight,
                },
            };
        }
        return comment;
    };
    const buildAtButtonComment = (comment, vpos) => {
        if (!comment.button || comment.button.limit <= 0)
            return;
        comment.button.limit -= 1;
        const mail = [...comment.button.commentMail, "from_button"];
        if (!comment.button.commentVisible) {
            mail.push("invisible");
        }
        return {
            id: -1,
            vpos,
            content: comment.button.commentMessage,
            date: -1,
            date_usec: -1,
            owner: false,
            premium: true,
            mail,
            user_id: -10,
            layer: -1,
            is_my_post: true,
        };
    };

    class TypeGuardError extends Error {
        constructor(options = {}) {
            super("Type Guard Error\nAn error occurred due to unexpected values\nPlease contact the developer on GitHub", options);
        }
    }
    TypeGuardError.prototype.name = "TypeGuardError";

    const getLineHeight = (fontSize, isFlash, resized = false) => {
        const lineCounts = getConfig(config.html5LineCounts, isFlash);
        const commentStageSize = getConfig(config.commentStageSize, isFlash);
        const lineHeight = commentStageSize.height / lineCounts.doubleResized[fontSize];
        const defaultLineCount = lineCounts.default[fontSize];
        if (resized) {
            const resizedLineCount = lineCounts.resized[fontSize];
            return ((commentStageSize.height -
                lineHeight * (defaultLineCount / resizedLineCount)) /
                (resizedLineCount - 1));
        }
        return (commentStageSize.height - lineHeight) / (defaultLineCount - 1);
    };
    const getCharSize = (fontSize, isFlash) => {
        const lineCounts = getConfig(config.html5LineCounts, isFlash);
        const commentStageSize = getConfig(config.commentStageSize, isFlash);
        return commentStageSize.height / lineCounts.doubleResized[fontSize];
    };
    const measure = (comment, renderer) => {
        const width = measureWidth(comment, renderer);
        return {
            ...width,
            height: comment.lineHeight * (comment.lineCount - 1) + comment.charSize,
        };
    };
    const addHTML5PartToResult = (lineContent, part, _font) => {
        if (part === "")
            return;
        const font = _font ?? "defont";
        for (const key of Object.keys(config.compatSpacer.html5)) {
            const spacerWidth = config.compatSpacer.html5[key]?.[font];
            if (!spacerWidth)
                continue;
            const compatIndex = part.indexOf(key);
            if (compatIndex >= 0) {
                addHTML5PartToResult(lineContent, part.slice(0, compatIndex), font);
                let i = compatIndex;
                for (; i < part.length && part[i] === key; i++) {
                }
                lineContent.push({
                    type: "spacer",
                    char: key,
                    charWidth: spacerWidth,
                    count: i - compatIndex,
                });
                addHTML5PartToResult(lineContent, part.slice(i), font);
                return;
            }
        }
        lineContent.push({
            type: "text",
            content: part,
            slicedContent: part.split("\n"),
        });
    };
    const measureWidth = (comment, renderer) => {
        const { fontSize, scale } = getFontSizeAndScale(comment.charSize);
        const lineWidth = [];
        const itemWidth = [];
        renderer.setFont(parseFont(comment.font, fontSize));
        let currentWidth = 0;
        for (const item of comment.content) {
            if (item.type === "spacer") {
                currentWidth += item.count * fontSize * item.charWidth;
                itemWidth.push([item.count * fontSize * item.charWidth]);
                lineWidth.push(Math.ceil(currentWidth * scale));
                continue;
            }
            const lines = item.content.split("\n");
            renderer.setFont(parseFont(item.font ?? comment.font, fontSize));
            const width = [];
            for (let j = 0, n = lines.length; j < n; j++) {
                const line = lines[j];
                if (line === undefined)
                    throw new TypeGuardError();
                const measure = renderer.measureText(line);
                currentWidth += measure.width;
                width.push(measure.width);
                if (j < lines.length - 1) {
                    lineWidth.push(Math.ceil(currentWidth * scale));
                    currentWidth = 0;
                }
            }
            itemWidth.push(width);
            lineWidth.push(Math.ceil(currentWidth * scale));
        }
        return {
            width: Math.max(...lineWidth),
            lineWidth,
            itemWidth,
        };
    };
    const getFontSizeAndScale = (_charSize) => {
        let charSize = _charSize;
        charSize *= 0.8;
        if (charSize < config.html5MinFontSize) {
            if (charSize >= 1)
                charSize = Math.floor(charSize);
            return {
                scale: charSize / config.html5MinFontSize,
                fontSize: config.html5MinFontSize,
            };
        }
        return {
            scale: 1,
            fontSize: Math.floor(charSize),
        };
    };

    var index$2 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        addHTML5PartToResult: addHTML5PartToResult,
        arrayEqual: arrayEqual,
        arrayPush: arrayPush,
        buildAtButtonComment: buildAtButtonComment,
        changeCALayer: changeCALayer,
        getButtonParts: getButtonParts,
        getCharSize: getCharSize,
        getConfig: getConfig,
        getDefaultCommand: getDefaultCommand,
        getFixedPosY: getFixedPosY,
        getFlashFontIndex: getFlashFontIndex,
        getFlashFontName: getFlashFontName,
        getFontSizeAndScale: getFontSizeAndScale,
        getLineHeight: getLineHeight,
        getMovablePosY: getMovablePosY,
        getPosX: getPosX,
        getPosY: getPosY,
        getStrokeColor: getStrokeColor,
        hex2rgb: hex2rgb,
        hex2rgba: hex2rgba,
        isBanActive: isBanActive,
        isFlashComment: isFlashComment,
        isLineBreakResize: isLineBreakResize,
        isReverseActive: isReverseActive,
        measure: measure,
        nativeSort: nativeSort,
        parseCommandAndNicoScript: parseCommandAndNicoScript,
        parseContent: parseContent,
        parseFont: parseFont,
        processFixedComment: processFixedComment,
        processMovableComment: processMovableComment
    });

    class BaseComment {
        renderer;
        cacheKey;
        comment;
        pos;
        posY;
        pluginName = "BaseComment";
        image;
        buttonImage;
        index;
        constructor(comment, renderer, index) {
            this.renderer = renderer;
            this.posY = -1;
            this.pos = { x: 0, y: 0 };
            comment.content = comment.content.replace(/\t/g, "\u2003\u2003");
            this.comment = this.convertComment(comment);
            this.cacheKey = this.getCacheKey();
            this.index = index;
        }
        get invisible() {
            return this.comment.invisible;
        }
        get loc() {
            return this.comment.loc;
        }
        get long() {
            return this.comment.long;
        }
        get vpos() {
            return this.comment.vpos;
        }
        get width() {
            return this.comment.width;
        }
        get height() {
            return this.comment.height;
        }
        get flash() {
            return false;
        }
        get layer() {
            return this.comment.layer;
        }
        get owner() {
            return this.comment.owner;
        }
        get mail() {
            return this.comment.mail;
        }
        get content() {
            throw new NotImplementedError(this.pluginName, "set: content");
        }
        set content(_) {
            throw new NotImplementedError(this.pluginName, "set: content");
        }
        getCommentSize(parsedData) {
            console.error("getCommentSize method is not implemented", parsedData);
            throw new NotImplementedError(this.pluginName, "getCommentSize");
        }
        parseCommandAndNicoscript(comment) {
            console.error("parseCommandAndNicoscript method is not implemented", comment);
            throw new NotImplementedError(this.pluginName, "parseCommandAndNicoscript");
        }
        parseContent(comment) {
            console.error("parseContent method is not implemented", comment);
            throw new NotImplementedError(this.pluginName, "parseContent");
        }
        measureText(comment) {
            console.error("measureText method is not implemented", comment);
            throw new NotImplementedError(this.pluginName, "measureText");
        }
        convertComment(comment) {
            console.error("convertComment method is not implemented", comment);
            throw new NotImplementedError(this.pluginName, "convertComment");
        }
        draw(vpos, showCollision, cursor) {
            if (isBanActive(vpos))
                return;
            const reverse = isReverseActive(vpos, this.comment.owner);
            const posX = getPosX(this.comment, vpos, reverse);
            const posY = this.comment.loc === "shita"
                ? config.canvasHeight - this.posY - this.comment.height
                : this.posY;
            this.pos = {
                x: posX,
                y: posY,
            };
            this._drawBackgroundColor(posX, posY);
            this._draw(posX, posY, cursor);
            this._drawRectColor(posX, posY);
            this._drawCollision(posX, posY, showCollision);
            this._drawDebugInfo(posX, posY);
        }
        _draw(posX, posY, cursor) {
            if (this.image === undefined) {
                this.image = this.getTextImage();
            }
            if (this.image) {
                this.renderer.save();
                if (typeof this.comment.opacity === "number") {
                    this.renderer.setGlobalAlpha(this.comment.opacity);
                }
                else if (this.comment._live) {
                    this.renderer.setGlobalAlpha(config.contextFillLiveOpacity);
                }
                else {
                    this.renderer.setGlobalAlpha(1);
                }
                if (this.comment.button && !this.comment.button.hidden) {
                    const button = this.getButtonImage(posX, posY, cursor);
                    button && this.renderer.drawImage(button, posX, posY);
                }
                this.renderer.drawImage(this.image, posX, posY);
                this.renderer.restore();
            }
        }
        _drawRectColor(posX, posY) {
            if (this.comment.wakuColor) {
                this.renderer.save();
                this.renderer.setStrokeStyle(this.comment.wakuColor);
                this.renderer.strokeRect(posX, posY, this.comment.width, this.comment.height);
                this.renderer.restore();
            }
        }
        _drawBackgroundColor(posX, posY) {
            if (this.comment.fillColor) {
                this.renderer.save();
                this.renderer.setFillStyle(this.comment.fillColor);
                this.renderer.fillRect(posX, posY, this.comment.width, this.comment.height);
                this.renderer.restore();
            }
        }
        _drawDebugInfo(posX, posY) {
            if (isDebug) {
                this.renderer.save();
                this.renderer.setFont(parseFont("defont", 30));
                this.renderer.setFillStyle("#ff00ff");
                this.renderer.fillText(this.comment.mail.join(","), posX, posY + 30);
                this.renderer.restore();
            }
        }
        _drawCollision(posX, posY, showCollision) {
            console.error("_drawCollision method is not implemented", posX, posY, showCollision);
            throw new NotImplementedError(this.pluginName, "_drawCollision");
        }
        getTextImage() {
            if (this.comment.invisible ||
                (this.comment.lineCount === 1 && this.comment.width === 0) ||
                this.comment.height - (this.comment.charSize - this.comment.lineHeight) <=
                    0)
                return null;
            const cache = imageCache[this.cacheKey];
            if (cache) {
                this.image = cache.image;
                window.setTimeout(() => {
                    this.image = undefined;
                }, this.comment.long * 10 + config.cacheAge);
                clearTimeout(cache.timeout);
                cache.timeout = window.setTimeout(() => {
                    imageCache[this.cacheKey]?.image.destroy();
                    delete imageCache[this.cacheKey];
                }, this.comment.long * 10 + config.cacheAge);
                return cache.image;
            }
            if (this.image)
                return this.image;
            const image = this._generateTextImage();
            this._cacheImage(image);
            return image;
        }
        _generateTextImage() {
            console.error("_generateTextImage method is not implemented");
            throw new NotImplementedError(this.pluginName, "_generateTextImage");
        }
        _cacheImage(image) {
            this.image = image;
            window.setTimeout(() => {
                this.image = undefined;
            }, this.comment.long * 10 + config.cacheAge);
            imageCache[this.cacheKey] = {
                timeout: window.setTimeout(() => {
                    delete imageCache[this.cacheKey];
                }, this.comment.long * 10 + config.cacheAge),
                image,
            };
        }
        getButtonImage(posX, posY, cursor) {
            console.error("getButtonImage method is not implemented", posX, posY, cursor);
            throw new NotImplementedError(this.pluginName, "getButtonImage");
        }
        isHovered(cursor, posX, posY) {
            console.error("isHovered method is not implemented", posX, posY, cursor);
            throw new NotImplementedError(this.pluginName, "getButtonImage");
        }
        getCacheKey() {
            return `${JSON.stringify(this.comment.content)}@@${this.pluginName}@@${[
            ...this.comment.mail,
        ]
            .sort((a, b) => a.localeCompare(b))
            .join(",")}`;
        }
    }

    const drawLeftBorder = (context, left, top, width, height, radius) => {
        context.save();
        context.beginPath();
        context.moveTo(left + width, top);
        context.lineTo(left + radius, top);
        context.quadraticCurveTo(left, top, left, top + radius);
        context.lineTo(left, top + height - radius);
        context.quadraticCurveTo(left, top + height, left + radius, top + height);
        context.lineTo(left + width, top + height);
        context.stroke();
        context.restore();
    };
    const drawMiddleBorder = (context, left, top, width, height) => {
        context.save();
        context.beginPath();
        context.moveTo(left + width, top);
        context.lineTo(left, top);
        context.moveTo(left + width, top + height);
        context.lineTo(left, top + height);
        context.stroke();
        context.restore();
    };
    const drawRightBorder = (context, right, top, height, radius) => {
        context.save();
        context.beginPath();
        context.moveTo(right - radius, top);
        context.quadraticCurveTo(right, top, right, top + radius);
        context.lineTo(right, top + height - radius);
        context.quadraticCurveTo(right, top + height, right - radius, top + height);
        context.stroke();
        context.restore();
    };

    class FlashComment extends BaseComment {
        _globalScale;
        pluginName = "FlashComment";
        buttonImage;
        constructor(comment, renderer, index) {
            super(comment, renderer, index);
            this._globalScale ??= getConfig(config.commentScale, true);
            this.buttonImage = renderer.getCanvas();
        }
        get content() {
            return this.comment.rawContent;
        }
        set content(input) {
            const { content, lineCount, lineOffset } = this.parseContent(input);
            const comment = {
                ...this.comment,
                rawContent: input,
                content,
                lineCount,
                lineOffset,
            };
            const val = content[0];
            if (val?.font) {
                comment.font = val.font;
            }
            this.comment = this.getCommentSize(comment);
            this.cacheKey = this.getCacheKey();
            this.image = undefined;
        }
        convertComment(comment) {
            this._globalScale = getConfig(config.commentScale, true);
            return getButtonParts(this.getCommentSize(this.parseCommandAndNicoscript(comment)));
        }
        getCommentSize(parsedData) {
            if (parsedData.invisible) {
                return {
                    ...parsedData,
                    height: 0,
                    width: 0,
                    lineHeight: 0,
                    fontSize: 0,
                    resized: false,
                    resizedX: false,
                    resizedY: false,
                    charSize: 0,
                    scale: 1,
                    scaleX: 1,
                    content: [],
                };
            }
            this.renderer.save();
            this.renderer.setFont(parseFont(parsedData.font, parsedData.fontSize));
            const measure = this.measureText({ ...parsedData, scale: 1 });
            if (options.scale !== 1 && parsedData.layer === -1) {
                measure.height *= options.scale;
                measure.width *= options.scale;
            }
            this.renderer.restore();
            if (parsedData.button && !parsedData.button.hidden) {
                measure.width += getConfig(config.atButtonPadding, true) * 4;
            }
            return {
                ...parsedData,
                height: measure.height * this._globalScale,
                width: measure.width * this._globalScale,
                lineHeight: measure.lineHeight,
                fontSize: measure.fontSize,
                resized: measure.resized,
                resizedX: measure.resizedX,
                resizedY: measure.resizedY,
                charSize: measure.charSize,
                scale: measure.scale,
                scaleX: measure.scaleX,
                content: measure.content,
            };
        }
        parseCommandAndNicoscript(comment) {
            const data = parseCommandAndNicoScript(comment);
            const { content, lineCount, lineOffset } = this.parseContent(comment.content, data.button);
            const val = content[0];
            if (val?.font) {
                data.font = val.font;
            }
            return {
                ...comment,
                rawContent: comment.content,
                ...data,
                content,
                lineCount,
                lineOffset,
            };
        }
        parseContent(input, button) {
            const content = button
                ? [
                    ...parseContent(button.message.before),
                    ...parseContent(button.message.body).map((val) => {
                        val.isButton = true;
                        return val;
                    }),
                    ...parseContent(button.message.after),
                ]
                : parseContent(input);
            const lineCount = (input.match(/\n/g)?.length ?? 0) + 1;
            const lineOffset = (input.match(new RegExp(config.flashScriptChar.super, "g"))?.length ??
                0) *
                -1 *
                config.flashScriptCharOffset +
                (input.match(new RegExp(config.flashScriptChar.sub, "g"))?.length ?? 0) *
                    config.flashScriptCharOffset;
            return {
                content,
                lineCount,
                lineOffset,
            };
        }
        measureText(comment) {
            const configLineHeight = getConfig(config.lineHeight, true);
            const configFontSize = getConfig(config.fontSize, true)[comment.size];
            const configStageSize = getConfig(config.commentStageSize, true);
            const defaultFontSize = configFontSize.default;
            comment.lineHeight ??= configLineHeight[comment.size].default;
            const widthLimit = configStageSize[comment.full ? "fullWidth" : "width"];
            const { scaleX, width, height } = this._measureContent(comment);
            let scale = 1;
            if (isLineBreakResize(comment)) {
                comment.resized = true;
                comment.resizedY = true;
                const lineBreakScale = config.flashLineBreakScale[comment.size];
                const scaledWidth = width * lineBreakScale;
                if (comment.loc !== "naka" &&
                    this._isDoubleResize(scaledWidth, widthLimit, comment.size, comment.lineCount, comment.full)) {
                    if (scaledWidth > widthLimit) {
                        const resizedFontSize = Math.round((widthLimit / scaledWidth) * defaultFontSize);
                        const resizeRate = (resizedFontSize + 1) / (defaultFontSize + 1);
                        scale *= resizeRate;
                    }
                }
                else {
                    scale *= lineBreakScale;
                }
            }
            else if (comment.loc !== "naka" && width > widthLimit) {
                const resizeRate = (Math.round((widthLimit / width) * defaultFontSize) + 1) /
                    (defaultFontSize + 1);
                scale *= resizeRate;
            }
            comment.scale = scale;
            if (!typeGuard.internal.CommentMeasuredContentItemArray(comment.content)) {
                throw new TypeGuardError();
            }
            return {
                charSize: 0,
                height: height * scale,
                resized: !!comment.resized,
                fontSize: comment.fontSize,
                lineHeight: comment.lineHeight,
                content: comment.content,
                resizedX: !!comment.resizedX,
                resizedY: !!comment.resizedY,
                scale: comment.scale,
                scaleX: scaleX,
                width: width * scale,
            };
        }
        _isDoubleResize(width, widthLimit, size, lineCount, isFull) {
            if (width < widthLimit * 0.9 || widthLimit * 1.1 < width)
                return width > widthLimit;
            if (size === "big") {
                if (8 <= lineCount &&
                    lineCount <= 14 &&
                    !isFull &&
                    widthLimit * 0.99 < width)
                    return true;
                if (width <= widthLimit)
                    return false;
                if (16 <= lineCount && width * 0.95 < widthLimit)
                    return true;
                if (isFull) {
                    if (width * 0.95 < widthLimit)
                        return false;
                    return width > widthLimit;
                }
                return true;
            }
            if (width <= widthLimit)
                return false;
            if (((size === "medium" && 25 <= lineCount) ||
                (size === "small" && 38 <= lineCount)) &&
                width * 0.95 < widthLimit)
                return false;
            return widthLimit < width;
        }
        _measureContent(comment) {
            const widthArr = [];
            const spacedWidthArr = [];
            let currentWidth = 0;
            let spacedWidth = 0;
            for (const item of comment.content) {
                if (item.type === "spacer") {
                    spacedWidth +=
                        item.count * item.charWidth * comment.fontSize +
                            Math.max(item.count - 1, 0) * config.flashLetterSpacing;
                    currentWidth += item.count * item.charWidth * comment.fontSize;
                    widthArr.push(currentWidth);
                    spacedWidthArr.push(spacedWidth);
                    continue;
                }
                const lines = item.content.split("\n");
                const widths = [];
                this.renderer.setFont(parseFont(item.font ?? comment.font, comment.fontSize));
                for (let i = 0, n = lines.length; i < n; i++) {
                    const value = lines[i];
                    if (value === undefined)
                        continue;
                    const measure = this.renderer.measureText(value);
                    currentWidth += measure.width;
                    spacedWidth +=
                        measure.width +
                            Math.max(value.length - 1, 0) * config.flashLetterSpacing;
                    widths.push(measure.width);
                    if (i < lines.length - 1) {
                        widthArr.push(currentWidth);
                        spacedWidthArr.push(spacedWidth);
                        spacedWidth = 0;
                        currentWidth = 0;
                    }
                }
                widthArr.push(currentWidth);
                spacedWidthArr.push(spacedWidth);
                item.width = widths;
            }
            const leadLine = (() => {
                let max = 0;
                let index = -1;
                spacedWidthArr.forEach((val, i) => {
                    if (max < val) {
                        max = val;
                        index = i;
                    }
                });
                return { max, index };
            })();
            const scaleX = leadLine.max / (widthArr[leadLine.index] ?? 1);
            const width = leadLine.max * comment.scale;
            const height = (comment.fontSize * (comment.lineHeight ?? 0) * comment.lineCount +
                config.flashCommentYPaddingTop[comment.resizedY ? "resized" : "default"]) *
                comment.scale;
            return { scaleX, width, height };
        }
        _drawCollision(posX, posY, showCollision) {
            if (showCollision) {
                this.renderer.save();
                this.renderer.setStrokeStyle("rgba(255,0,255,1)");
                this.renderer.strokeRect(posX, posY, this.comment.width, this.comment.height);
                for (let i = 0, n = this.comment.lineCount; i < n; i++) {
                    const linePosY = ((i + 1) * (this.comment.fontSize * this.comment.lineHeight) +
                        config.flashCommentYPaddingTop[this.comment.resizedY ? "resized" : "default"]) *
                        this.comment.scale;
                    this.renderer.setStrokeStyle("rgba(255,255,0,0.25)");
                    this.renderer.strokeRect(posX, posY + linePosY * this._globalScale, this.comment.width, this.comment.fontSize *
                        this.comment.lineHeight *
                        -1 *
                        this._globalScale *
                        this.comment.scale *
                        (this.comment.layer === -1 ? options.scale : 1));
                }
                this.renderer.restore();
            }
        }
        _generateTextImage() {
            const renderer = this.renderer.getCanvas();
            this._setupCanvas(renderer);
            const atButtonPadding = getConfig(config.atButtonPadding, true);
            const lineOffset = this.comment.lineOffset;
            const lineHeight = this.comment.fontSize * this.comment.lineHeight;
            const offsetKey = this.comment.resizedY ? "resized" : "default";
            const offsetY = config.flashCommentYPaddingTop[offsetKey] +
                this.comment.fontSize *
                    this.comment.lineHeight *
                    config.flashCommentYOffset[this.comment.size][offsetKey];
            let lastFont = this.comment.font;
            let leftOffset = 0;
            let lineCount = 0;
            let isLastButton = false;
            for (const item of this.comment.content) {
                if (item.type === "spacer") {
                    leftOffset += item.count * item.charWidth * this.comment.fontSize;
                    isLastButton = !!item.isButton;
                    continue;
                }
                const font = item.font ?? this.comment.font;
                if (lastFont !== font) {
                    lastFont = font;
                    renderer.setFont(parseFont(font, this.comment.fontSize));
                }
                const lines = item.slicedContent;
                for (let lineIndex = 0, lineLength = lines.length; lineIndex < lineLength; lineIndex++) {
                    const line = lines[lineIndex];
                    if (line === undefined)
                        continue;
                    const posY = (lineOffset + lineCount + 1) * lineHeight + offsetY;
                    const partWidth = item.width[lineIndex] ?? 0;
                    if (this.comment.button &&
                        !this.comment.button.hidden &&
                        ((!isLastButton && item.isButton) || (isLastButton && !item.isButton))) {
                        leftOffset += atButtonPadding * 2;
                    }
                    renderer.strokeText(line, leftOffset, posY);
                    renderer.fillText(line, leftOffset, posY);
                    leftOffset += partWidth;
                    if (lineIndex < lineLength - 1) {
                        leftOffset = 0;
                        lineCount += 1;
                    }
                }
                isLastButton = !!item.isButton;
            }
            return renderer;
        }
        getButtonImage(posX, posY, cursor) {
            if (!this.comment.button || this.comment.button.hidden)
                return undefined;
            const { renderer } = this._setupCanvas(this.buttonImage);
            const parts = this.comment.buttonObjects;
            if (!parts)
                return undefined;
            const atButtonRadius = getConfig(config.atButtonRadius, true);
            const isHover = this.isHovered(cursor, posX, posY);
            renderer.save();
            const getStrokeStyle = () => {
                if (isHover) {
                    return this.comment.color;
                }
                if (this.comment.button && this.comment.button.limit < 1) {
                    return "#777777";
                }
                return "white";
            };
            renderer.setStrokeStyle(getStrokeStyle());
            drawLeftBorder(renderer, parts.left.left, parts.left.top, parts.left.width, parts.left.height, atButtonRadius);
            for (const part of parts.middle) {
                drawMiddleBorder(renderer, part.left, part.top, part.width, part.height);
            }
            drawRightBorder(renderer, parts.right.right, parts.right.top, parts.right.height, atButtonRadius);
            renderer.restore();
            return renderer;
        }
        isHovered(_cursor, _posX, _posY) {
            if (!_cursor || !this.comment.buttonObjects)
                return false;
            const { left, middle, right } = this.comment.buttonObjects;
            const scale = this._globalScale *
                this.comment.scale *
                this.comment.scaleX *
                (this.comment.layer === -1 ? options.scale : 1);
            const posX = (_posX ?? this.pos.x) / scale;
            const posY = (_posY ?? this.pos.y) / scale;
            const cursor = {
                x: _cursor.x / scale,
                y: _cursor.y / scale,
            };
            if (cursor.x < posX ||
                posX + this.comment.width < cursor.x ||
                cursor.y < posY + left.top ||
                posY + right.top + right.height < cursor.y) {
                return false;
            }
            const atButtonPadding = getConfig(config.atButtonPadding, true);
            const between = (val, min, max) => {
                return min < val && val < max;
            };
            for (const part of [left, ...middle]) {
                if (between(cursor.x, posX + part.left, posX + part.left + part.width) &&
                    between(cursor.y, posY + part.top, posY + part.top + part.height)) {
                    return true;
                }
            }
            return (between(cursor.x, posX + right.right - atButtonPadding, posX + right.right + getConfig(config.contextLineWidth, true) / 2) && between(cursor.y, posY + right.top, posY + right.top + right.height));
        }
        _setupCanvas(renderer) {
            const atButtonPadding = getConfig(config.atButtonPadding, true);
            renderer.setSize(this.comment.width, this.comment.height + (this.comment.button ? atButtonPadding * 2 : 0));
            renderer.setStrokeStyle(getStrokeColor(this.comment));
            renderer.setFillStyle(this.comment.color);
            renderer.setLineWidth(getConfig(config.contextLineWidth, true));
            renderer.setFont(parseFont(this.comment.font, this.comment.fontSize));
            const scale = this._globalScale *
                this.comment.scale *
                (this.comment.layer === -1 ? options.scale : 1);
            renderer.setScale(scale * this.comment.scaleX, scale);
            return { renderer };
        }
    }

    class HTML5Comment extends BaseComment {
        pluginName = "HTML5Comment";
        constructor(comment, context, index) {
            super(comment, context, index);
            this.posY = -1;
        }
        get content() {
            return this.comment.rawContent;
        }
        set content(input) {
            const { content, lineCount, lineOffset } = this.parseContent(input);
            const comment = {
                ...this.comment,
                rawContent: input,
                content,
                lineCount,
                lineOffset,
            };
            this.comment = this.getCommentSize(comment);
            this.cacheKey = this.getCacheKey();
            this.image = undefined;
        }
        convertComment(comment) {
            return this.getCommentSize(this.parseCommandAndNicoscript(comment));
        }
        getCommentSize(parsedData) {
            if (parsedData.invisible) {
                return {
                    ...parsedData,
                    height: 0,
                    width: 0,
                    lineHeight: 0,
                    fontSize: 0,
                    resized: false,
                    resizedX: false,
                    resizedY: false,
                    charSize: 0,
                    content: [],
                    scaleX: 1,
                    scale: 1,
                };
            }
            this.renderer.save();
            this.renderer.setFont(parseFont(parsedData.font, parsedData.fontSize));
            const measure = this.measureText({ ...parsedData, scale: 1 });
            if (options.scale !== 1 && parsedData.layer === -1) {
                measure.height *= options.scale;
                measure.width *= options.scale;
                measure.fontSize *= options.scale;
            }
            this.renderer.restore();
            return {
                ...parsedData,
                height: measure.height,
                width: measure.width,
                lineHeight: measure.lineHeight,
                fontSize: measure.fontSize,
                resized: measure.resized,
                resizedX: measure.resizedX,
                resizedY: measure.resizedY,
                charSize: measure.charSize,
                content: measure.content,
                scaleX: measure.scaleX,
                scale: measure.scale,
            };
        }
        parseCommandAndNicoscript(comment) {
            const data = parseCommandAndNicoScript(comment);
            const { content, lineCount, lineOffset } = this.parseContent(comment.content, data.font);
            return {
                ...comment,
                rawContent: comment.content,
                ...data,
                content,
                lineCount,
                lineOffset,
            };
        }
        parseContent(input, font) {
            const content = [];
            addHTML5PartToResult(content, input, font ?? "defont");
            const lineCount = input.split("\n").length;
            const lineOffset = 0;
            return {
                content,
                lineCount,
                lineOffset,
            };
        }
        measureText(comment) {
            const scale = getConfig(config.commentScale, false);
            const configFontSize = getConfig(config.fontSize, false);
            const lineHeight = getLineHeight(comment.size, false);
            const charSize = getCharSize(comment.size, false);
            if (!comment.lineHeight)
                comment.lineHeight = lineHeight;
            if (!comment.charSize)
                comment.charSize = charSize;
            comment.fontSize = comment.charSize * 0.8;
            this.renderer.setFont(parseFont(comment.font, comment.fontSize));
            if (isLineBreakResize(comment)) {
                comment.fontSize = configFontSize[comment.size].resized;
                const lineHeight = getLineHeight(comment.size, false, true);
                comment.charSize = comment.charSize * (lineHeight / comment.lineHeight);
                comment.lineHeight = lineHeight;
                comment.resized = true;
                comment.resizedY = true;
            }
            const { width, height, itemWidth } = this._measureComment(comment);
            for (let i = 0, n = comment.content.length; i < n; i++) {
                const item = comment.content[i];
                if (item?.type !== "text" || !itemWidth)
                    continue;
                item.width = itemWidth[i];
            }
            comment.fontSize = (comment.charSize ?? 0) * 0.8;
            if (!typeGuard.internal.CommentMeasuredContentItemArray(comment.content)) {
                throw new TypeGuardError();
            }
            return {
                width: width * scale,
                height: height * scale,
                resized: !!comment.resized,
                fontSize: comment.fontSize,
                lineHeight: comment.lineHeight ?? 0,
                content: comment.content,
                resizedX: !!comment.resizedX,
                resizedY: !!comment.resizedY,
                charSize: comment.charSize ?? 0,
                scaleX: 1,
                scale: 1,
            };
        }
        _measureComment(comment) {
            const widthLimit = getConfig(config.commentStageSize, false)[comment.full ? "fullWidth" : "width"];
            if (!typeGuard.internal.MeasureInput(comment))
                throw new TypeGuardError();
            const measureResult = measure(comment, this.renderer);
            if (comment.loc !== "naka" && measureResult.width > widthLimit) {
                return this._processResizeX(comment, measureResult.width);
            }
            return measureResult;
        }
        _processResizeX(comment, width) {
            const widthLimit = getConfig(config.commentStageSize, false)[comment.full ? "fullWidth" : "width"];
            const lineHeight = getLineHeight(comment.size, false);
            const charSize = getCharSize(comment.size, false);
            const scale = widthLimit / width;
            comment.resizedX = true;
            let _comment = { ...comment };
            _comment.charSize = (_comment.charSize ?? 0) * scale;
            _comment.lineHeight = (_comment.lineHeight ?? 0) * scale;
            _comment.fontSize = _comment.charSize * 0.8;
            if (!typeGuard.internal.MeasureInput(_comment))
                throw new TypeGuardError();
            let result = measure(_comment, this.renderer);
            if (result.width > widthLimit) {
                while (result.width >= widthLimit) {
                    const originalCharSize = _comment.charSize;
                    _comment.charSize -= 1;
                    _comment.lineHeight *= _comment.charSize / originalCharSize;
                    _comment.fontSize = _comment.charSize * 0.8;
                    result = measure(_comment, this.renderer);
                }
            }
            else {
                let lastComment = { ..._comment };
                while (result.width < widthLimit) {
                    lastComment = { ..._comment };
                    const originalCharSize = _comment.charSize;
                    _comment.charSize += 1;
                    _comment.lineHeight *= _comment.charSize / originalCharSize;
                    _comment.fontSize = _comment.charSize * 0.8;
                    result = measure(_comment, this.renderer);
                }
                _comment = lastComment;
            }
            if (comment.resizedY) {
                const scale = (_comment.charSize ?? 0) / (comment.charSize ?? 0);
                comment.charSize = scale * charSize;
                comment.lineHeight = scale * lineHeight;
            }
            else {
                comment.charSize = _comment.charSize;
                comment.lineHeight = _comment.lineHeight;
            }
            comment.fontSize = (comment.charSize ?? 0) * 0.8;
            if (!typeGuard.internal.MeasureInput(comment))
                throw new TypeGuardError();
            return measure(comment, this.renderer);
        }
        _drawCollision(posX, posY, showCollision) {
            if (showCollision) {
                this.renderer.save();
                const scale = getConfig(config.commentScale, false);
                this.renderer.setStrokeStyle("rgba(0,255,255,1)");
                this.renderer.strokeRect(posX, posY, this.comment.width, this.comment.height);
                for (let i = 0, n = this.comment.lineCount; i < n; i++) {
                    if (!typeGuard.internal.HTML5Fonts(this.comment.font))
                        throw new TypeGuardError();
                    const linePosY = (this.comment.lineHeight * (i + 1) +
                        (this.comment.charSize - this.comment.lineHeight) / 2 +
                        this.comment.lineHeight * -0.16 +
                        (config.fonts.html5[this.comment.font]?.offset || 0)) *
                        scale;
                    this.renderer.setStrokeStyle("rgba(255,255,0,0.5)");
                    this.renderer.strokeRect(posX, posY + linePosY, this.comment.width, this.comment.fontSize * -1 * scale);
                }
                this.renderer.restore();
            }
        }
        _generateTextImage() {
            const { fontSize, scale } = getFontSizeAndScale(this.comment.charSize);
            const paddingTop = (10 - scale * 10) *
                ((this.comment.lineCount + 1) / config.html5HiResCommentCorrection);
            const drawScale = getConfig(config.commentScale, false) *
                scale *
                (this.comment.layer === -1 ? options.scale : 1);
            const DEFAULT_COMMENT_PADDING = 4;
            const image = this.renderer.getCanvas(DEFAULT_COMMENT_PADDING);
            image.setSize(this.comment.width, this.comment.height);
            image.setStrokeStyle(getStrokeColor(this.comment));
            image.setFillStyle(this.comment.color);
            image.setLineWidth(getConfig(config.contextLineWidth, false));
            image.setFont(parseFont(this.comment.font, fontSize));
            image.setScale(drawScale);
            let lineCount = 0;
            if (!typeGuard.internal.HTML5Fonts(this.comment.font))
                throw new TypeGuardError();
            const offsetY = (this.comment.charSize - this.comment.lineHeight) / 2 +
                this.comment.lineHeight * -0.16 +
                (config.fonts.html5[this.comment.font]?.offset || 0);
            for (const item of this.comment.content) {
                if (item?.type === "spacer") {
                    lineCount += item.count * item.charWidth * this.comment.fontSize;
                    continue;
                }
                const lines = item.slicedContent;
                for (let j = 0, n = lines.length; j < n; j++) {
                    const line = lines[j];
                    if (line === undefined)
                        continue;
                    const posY = (this.comment.lineHeight * (lineCount + 1 + paddingTop) + offsetY) /
                        scale;
                    image.strokeText(line, 0, posY);
                    image.fillText(line, 0, posY);
                    lineCount += 1;
                }
            }
            return image;
        }
        getButtonImage() {
            return undefined;
        }
        isHovered() {
            return false;
        }
    }

    var index$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        BaseComment: BaseComment,
        FlashComment: FlashComment,
        HTML5Comment: HTML5Comment
    });

    const build = (fonts) => {
        return fonts.reduce((pv, val, index) => {
            if (index === 0) {
                return { ...val };
            }
            pv.font += `, ${val.font}`;
            return pv;
        }, { font: "", offset: 0, weight: 600 });
    };
    const fontTemplates = {
        arial: {
            font: 'Arial, "ＭＳ Ｐゴシック", "MS PGothic", MSPGothic, MS-PGothic',
            offset: 0.01,
            weight: 600,
        },
        gothic: {
            font: '"游ゴシック体", "游ゴシック", "Yu Gothic", YuGothic, yugothic, YuGo-Medium',
            offset: -0.04,
            weight: 400,
        },
        gulim: {
            font: 'Gulim, "黑体", SimHei',
            offset: 0.03,
            weight: 400,
        },
        mincho: {
            font: '"游明朝体", "游明朝", "Yu Mincho", YuMincho, yumincho, YuMin-Medium',
            offset: -0.01,
            weight: 400,
        },
        simsun: {
            font: '"宋体", SimSun',
            offset: 0.135,
            weight: 400,
        },
        macGothicPro6: {
            font: '"ヒラギノ角ゴ ProN W6", HiraKakuProN-W6, "ヒラギノ角ゴ ProN", HiraKakuProN, "Hiragino Kaku Gothic ProN"',
            offset: -0.05,
            weight: 600,
        },
        macGothicPro3: {
            font: '"ヒラギノ角ゴ ProN W3", HiraKakuProN-W3, "ヒラギノ角ゴ ProN", HiraKakuProN, "Hiragino Kaku Gothic ProN"',
            offset: -0.04,
            weight: 300,
        },
        macMincho: {
            font: '"ヒラギノ明朝 ProN W3", HiraMinProN-W3, "ヒラギノ明朝 ProN", HiraMinProN, "Hiragino Mincho ProN"',
            offset: -0.02,
            weight: 300,
        },
        macGothic1: {
            font: '"ヒラギノ角ゴシック", "Hiragino Sans", HiraginoSans',
            offset: -0.05,
            weight: 600,
        },
        macGothic2: {
            font: '"ヒラギノ角ゴシック", "Hiragino Sans", HiraginoSans',
            offset: -0.04,
            weight: 300,
        },
        sansSerif600: {
            font: "sans-serif",
            offset: 0,
            weight: 600,
        },
        sansSerif400: {
            font: "sans-serif",
            offset: 0,
            weight: 400,
        },
        serif: {
            font: "serif",
            offset: 0,
            weight: 400,
        },
    };
    const fonts = {
        win7: {
            defont: build([fontTemplates.arial]),
            gothic: build([
                fontTemplates.gothic,
                fontTemplates.gulim,
                fontTemplates.arial,
            ]),
            mincho: build([
                fontTemplates.mincho,
                fontTemplates.simsun,
                fontTemplates.arial,
            ]),
        },
        win8_1: {
            defont: build([fontTemplates.arial]),
            gothic: build([
                fontTemplates.gothic,
                fontTemplates.simsun,
                fontTemplates.arial,
            ]),
            mincho: build([
                fontTemplates.mincho,
                fontTemplates.simsun,
                fontTemplates.arial,
            ]),
        },
        win: {
            defont: build([fontTemplates.arial]),
            gothic: build([fontTemplates.gulim, fontTemplates.arial]),
            mincho: build([fontTemplates.simsun, fontTemplates.arial]),
        },
        mac10_9: {
            defont: build([fontTemplates.macGothicPro6]),
            gothic: build([fontTemplates.gothic, fontTemplates.macGothicPro3]),
            mincho: build([
                fontTemplates.mincho,
                fontTemplates.macMincho,
                fontTemplates.macGothicPro3,
            ]),
        },
        mac10_11: {
            defont: build([fontTemplates.macGothic1]),
            gothic: build([fontTemplates.gothic, fontTemplates.macGothic2]),
            mincho: build([
                fontTemplates.mincho,
                fontTemplates.macMincho,
                fontTemplates.macGothic2,
            ]),
        },
        mac: {
            defont: build([fontTemplates.macGothicPro6]),
            gothic: build([fontTemplates.macGothicPro3]),
            mincho: build([fontTemplates.macMincho]),
        },
        other: {
            defont: build([fontTemplates.sansSerif600]),
            gothic: build([fontTemplates.sansSerif400]),
            mincho: build([fontTemplates.serif]),
        },
    };

    var fonts$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        fontTemplates: fontTemplates,
        fonts: fonts
    });

    const initConfig = () => {
        const platform = ((ua) => {
            if (RegExp(/windows nt 6\.[12]/i).exec(ua)) {
                return "win7";
            }
            if (RegExp(/windows nt (6\.3|10\.\d+)|win32/i).exec(ua)) {
                return "win8_1";
            }
            if (RegExp(/windows nt/i).exec(ua)) {
                return "win";
            }
            if (RegExp(/mac os x 10(.|_)(9|10)/i).exec(ua)) {
                return "mac10_9";
            }
            if (RegExp(/mac os x 10(.|_)\d{2}|darwin/i).exec(ua)) {
                return "mac10_11";
            }
            if (RegExp(/mac os x/i).exec(ua)) {
                return "mac";
            }
            return "other";
        })(typeof navigator !== "undefined" ? navigator.userAgent : process.platform);
        const defaultConfig = {
            colors: colors,
            contextStrokeColor: "#000000",
            contextStrokeInversionColor: "#FFFFFF",
            contextStrokeOpacity: 0.4,
            contextFillLiveOpacity: 0.5,
            contextLineWidth: {
                html5: 2.8,
                flash: 4,
            },
            commentScale: {
                html5: 1920 / 683,
                flash: 1920 / 683,
            },
            commentStageSize: {
                html5: {
                    width: 512,
                    fullWidth: 683,
                    height: 384,
                },
                flash: {
                    width: 512,
                    fullWidth: 640,
                    height: 385,
                },
            },
            fontSize: {
                html5: {
                    small: {
                        default: 18,
                        resized: 10,
                    },
                    medium: {
                        default: 27,
                        resized: 14,
                    },
                    big: {
                        default: 39,
                        resized: 19.5,
                    },
                },
                flash: {
                    small: {
                        default: 15,
                        resized: 7.5,
                    },
                    medium: {
                        default: 24,
                        resized: 12,
                    },
                    big: {
                        default: 39,
                        resized: 19.5,
                    },
                },
            },
            html5LineCounts: {
                default: {
                    big: 8.4,
                    medium: 13.1,
                    small: 21,
                },
                resized: {
                    big: 16,
                    medium: 25.4,
                    small: 38,
                },
                doubleResized: {
                    big: 7.8,
                    medium: 11.3,
                    small: 16.6,
                },
            },
            html5HiResCommentCorrection: 20,
            html5MinFontSize: 10,
            fonts: {
                html5: fonts[platform],
                flash: {
                    gulim: `normal 600 [size]px gulim, ${fonts[platform].gothic.font}, Arial`,
                    simsun: `normal 400 [size]px simsun, batang, "PMingLiU", MingLiU-ExtB, ${fonts[platform].mincho.font}, Arial`,
                },
            },
            fpsInterval: 500,
            cacheAge: 2000,
            canvasWidth: 1920,
            canvasHeight: 1080,
            commentDrawRange: 1530,
            commentDrawPadding: 195,
            collisionRange: {
                left: 235,
                right: 1685,
            },
            collisionPadding: 5,
            sameCARange: 3600,
            sameCAGap: 100,
            sameCAMinScore: 10,
            sameCATimestampRange: 300,
            plugins: [],
            flashThreshold: 1499871600,
            flashChar: {
                gulim: "[\u0126\u0127\u0132\u0133\u0138\u013f\u0140\u0149-\u014b\u0166\u0167\u02d0\u02da\u2074\u207f\u2081-\u2084\u2113\u2153\u2154\u215c-\u215e\u2194\u2195\u223c\u249c-\u24b5\u24d0-\u24e9\u25a3-\u25a9\u25b6\u25b7\u25c0\u25c1\u25c8\u25d0\u25d1\u260e\u260f\u261c\u261e\u2660\u2661\u2663-\u2665\u2667-\u2669\u266c\u3131-\u316e\u3200-\u321c\u3260-\u327b\u3380-\u3384\u3388-\u338d\u3390-\u339b\u339f\u33a0\u33a2-\u33ca\u33cf\u33d0\u33d3\u33d6\u33d8\u33db-\u33dd\uac00-\ud7a3\uf900-\uf928\uf92a-\uf994\uf996\ufa0b\uffe6]",
                simsunStrong: "[\u01ce\u01d0\u01d2\u01d4\u01d6\u01d8\u01da\u01dc\u0251\u0261\u02ca\u02cb\u2016\u2035\u216a\u216b\u2223\u2236\u2237\u224c\u226e\u226f\u2295\u2483-\u249b\u2504-\u250b\u256d-\u2573\u2581-\u2583\u2585-\u2587\u2589-\u258b\u258d-\u258f\u2594\u2595\u25e2-\u25e5\u2609\u3016\u3017\u301e\u3021-\u3029\u3105-\u3129\u3220-\u3229\u32a3\u33ce\u33d1\u33d2\u33d5\ue758-\ue864\ufa0c\ufa0d\ufe30\ufe31\ufe33-\ufe44\ufe49-\ufe52\ufe54-\ufe57\ufe59-\ufe66\ufe68-\ufe6b]",
                simsunWeak: "[\u02c9\u2105\u2109\u2196-\u2199\u220f\u2215\u2248\u2264\u2265\u2299\u2474-\u2482\u250d\u250e\u2511\u2512\u2515\u2516\u2519\u251a\u251e\u251f\u2521\u2522\u2526\u2527\u2529\u252a\u252d\u252e\u2531\u2532\u2535\u2536\u2539\u253a\u253d\u253e\u2540\u2541\u2543-\u254a\u2550-\u256c\u2584\u2588\u258c\u2593]",
                gothic: "[\u03fb\uff9f\u30fb]",
            },
            flashMode: "vista",
            flashScriptChar: {
                super: "[\u00aa\u00b2\u00b3\u00b9\u00ba\u02b0\u02b2\u02b3\u02b7\u02b8\u02e1-\u02e3\u0304\u1d2c-\u1d43\u1d45-\u1d61\u1d9b-\u1da1\u1da3-\u1dbf\u2070\u2071\u2074-\u207f\u2c7d]",
                sub: "[\u0320\u1d62-\u1d6a\u2080-\u208e\u2090-\u209c\u2c7c]",
            },
            lineHeight: {
                small: {
                    default: 18 / 15,
                    resized: 10 / 7.5,
                },
                medium: {
                    default: 29 / 25,
                    resized: 15 / 12,
                },
                big: {
                    default: 45 / 39,
                    resized: 24 / 19.5,
                },
            },
            flashCommentYPaddingTop: {
                default: 5,
                resized: 3,
            },
            flashCommentYOffset: {
                small: { default: -0.2, resized: -0.2 },
                medium: { default: -0.2, resized: -0.2 },
                big: { default: -0.2, resized: -0.2 },
            },
            flashLetterSpacing: 1,
            flashScriptCharOffset: 0.12,
            commentLimit: undefined,
            hideCommentOrder: "asc",
            lineBreakCount: {
                big: 3,
                medium: 5,
                small: 7,
            },
            commentPlugins: [
                {
                    class: FlashComment,
                    condition: isFlashComment,
                },
            ],
            nakaCommentSpeedOffset: 0.95,
            atButtonPadding: 5,
            atButtonRadius: 7,
            flashDoubleResizeHeights: {
                big: {
                    9: 392,
                    10: 384,
                    11: 389,
                    12: 388,
                    13: 381,
                    14: 381,
                    15: 384,
                },
            },
            flashLineBreakScale: {
                small: 0.557,
                medium: 0.519,
                big: 0.535,
            },
            compatSpacer: {
                flash: {
                    "\u3000": {
                        simsun: 0.98,
                        defont: 0.645,
                        gulim: 0.95,
                    },
                    "\u00a0": {
                        simsun: 0.25,
                    },
                    "\u0020": {
                        defont: 0.3,
                    },
                    "\u2001": {
                        defont: 0.95,
                    },
                    "\u2004": {
                        defont: 1.6,
                    },
                    "\u2007": {
                        defont: 1.6,
                    },
                    "\u202a": {
                        defont: 0.59,
                    },
                },
                html5: {},
            },
        };
        updateConfig(defaultConfig);
    };

    var initConfig$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        initConfig: initConfig
    });

    let handlerList = [];
    const handlerCounts = {
        seekDisable: 0,
        seekEnable: 0,
        commentDisable: 0,
        commentEnable: 0,
        jump: 0,
    };
    const registerHandler = (eventName, handler) => {
        handlerList.push({ eventName, handler });
        updateEventHandlerCounts();
    };
    const removeHandler = (eventName, handler) => {
        handlerList = handlerList.filter((item) => item.eventName !== eventName || item.handler !== handler);
        updateEventHandlerCounts();
    };
    const updateEventHandlerCounts = () => {
        for (const key_ of Object.keys(handlerCounts)) {
            const key = key_;
            handlerCounts[key] = handlerList.filter((item) => item.eventName === key).length;
        }
    };
    const triggerHandler = (vpos, lastVpos) => {
        processCommentDisableScript(vpos, lastVpos);
        processSeekDisableScript(vpos, lastVpos);
        processJumpScript(vpos, lastVpos);
    };
    const processCommentDisableScript = (vpos, lastVpos) => {
        if (handlerCounts.commentDisable < 1 && handlerCounts.commentEnable < 1)
            return;
        for (const range of nicoScripts.ban) {
            const vposInRange = range.start < vpos && vpos < range.end;
            const lastVposInRange = range.start < lastVpos && lastVpos < range.end;
            if (vposInRange && !lastVposInRange) {
                executeEvents("commentDisable", {
                    type: "commentDisable",
                    timeStamp: new Date().getTime(),
                    vpos: vpos,
                });
            }
            else if (!vposInRange && lastVposInRange) {
                executeEvents("commentEnable", {
                    type: "commentEnable",
                    timeStamp: new Date().getTime(),
                    vpos: vpos,
                });
            }
        }
    };
    const processSeekDisableScript = (vpos, lastVpos) => {
        if (handlerCounts.seekDisable < 1 && handlerCounts.seekEnable < 1)
            return;
        for (const range of nicoScripts.seekDisable) {
            const vposInRange = range.start < vpos && vpos < range.end;
            const lastVposInRange = range.start < lastVpos && lastVpos < range.end;
            if (vposInRange && !lastVposInRange) {
                executeEvents("seekDisable", {
                    type: "seekDisable",
                    timeStamp: new Date().getTime(),
                    vpos: vpos,
                });
            }
            else if (!vposInRange && lastVposInRange) {
                executeEvents("seekEnable", {
                    type: "seekEnable",
                    timeStamp: new Date().getTime(),
                    vpos: vpos,
                });
            }
        }
    };
    const processJumpScript = (vpos, lastVpos) => {
        if (handlerCounts.jump < 1)
            return;
        for (const range of nicoScripts.jump) {
            const vposInRange = range.start < vpos && (!range.end || vpos < range.end);
            const lastVposInRange = range.start < lastVpos && (!range.end || lastVpos < range.end);
            if (vposInRange && !lastVposInRange) {
                executeEvents("jump", {
                    type: "jump",
                    timeStamp: new Date().getTime(),
                    vpos: vpos,
                    to: range.to,
                    message: range.message,
                });
            }
        }
    };
    const executeEvents = (eventName, event) => {
        for (const item of handlerList) {
            if (eventName !== item.eventName)
                continue;
            item.handler(event);
        }
    };

    var eventHandler = /*#__PURE__*/Object.freeze({
        __proto__: null,
        registerHandler: registerHandler,
        removeHandler: removeHandler,
        triggerHandler: triggerHandler
    });

    const EmptyParser = {
        key: ["empty"],
        parse: () => {
            return [];
        },
    };

    const FormattedParser = {
        key: ["formatted", "niconicome"],
        parse: (input) => {
            return parse(array(ZFormattedComment), input);
        },
    };

    const LegacyParser = {
        key: ["legacy"],
        parse: (input) => {
            return fromLegacy(parse(array(ZRawApiResponse), input));
        },
    };
    const fromLegacy = (data) => {
        const data_ = [];
        const userList = [];
        for (const _val of data) {
            const val = safeParse(ZApiChat, _val.chat);
            if (!val.success)
                continue;
            const value = val.output;
            if (value.deleted !== 1) {
                const tmpParam = {
                    id: value.no,
                    vpos: value.vpos,
                    content: value.content || "",
                    date: value.date,
                    date_usec: value.date_usec || 0,
                    owner: !value.user_id,
                    premium: value.premium === 1,
                    mail: [],
                    user_id: -1,
                    layer: -1,
                    is_my_post: false,
                };
                if (value.mail) {
                    tmpParam.mail = value.mail.split(/\s+/g);
                }
                if (value.content.startsWith("/") && !value.user_id) {
                    tmpParam.mail.push("invisible");
                }
                const isUserExist = userList.indexOf(value.user_id);
                if (isUserExist === -1) {
                    tmpParam.user_id = userList.length;
                    userList.push(value.user_id);
                }
                else {
                    tmpParam.user_id = isUserExist;
                }
                data_.push(tmpParam);
            }
        }
        return data_;
    };

    const LegacyOwnerParser = {
        key: ["legacyOwner"],
        parse: (input) => {
            if (!typeGuard.legacyOwner.comments(input))
                throw new InvalidFormatError();
            return fromLegacyOwner(input);
        },
    };
    const fromLegacyOwner = (data) => {
        const data_ = [];
        const comments = data.split("\n");
        for (let i = 0, n = comments.length; i < n; i++) {
            const value = comments[i];
            if (!value)
                continue;
            const commentData = value.split(":");
            if (commentData.length < 3) {
                continue;
            }
            if (commentData.length > 3) {
                for (let j = 3, n = commentData.length; j < n; j++) {
                    commentData[2] += `:${commentData[j]}`;
                }
            }
            const tmpParam = {
                id: i,
                vpos: Number(commentData[0]) * 100,
                content: commentData[2] ?? "",
                date: i,
                date_usec: 0,
                owner: true,
                premium: true,
                mail: [],
                user_id: -1,
                layer: -1,
                is_my_post: false,
            };
            if (commentData[1]) {
                tmpParam.mail = commentData[1].split(/[\s+]/g);
            }
            if (tmpParam.content.startsWith("/")) {
                tmpParam.mail.push("invisible");
            }
            data_.push(tmpParam);
        }
        return data_;
    };

    const OwnerParser = {
        key: ["owner"],
        parse: (input) => {
            return fromOwner(parse(array(ZOwnerComment), input));
        },
    };
    const fromOwner = (data) => {
        const data_ = [];
        for (let i = 0, n = data.length; i < n; i++) {
            const value = data[i];
            if (!value)
                continue;
            const tmpParam = {
                id: i,
                vpos: time2vpos(value.time),
                content: value.comment,
                date: i,
                date_usec: 0,
                owner: true,
                premium: true,
                mail: [],
                user_id: -1,
                layer: -1,
                is_my_post: false,
            };
            if (value.command) {
                tmpParam.mail = value.command.split(/\s+/g);
            }
            if (tmpParam.content.startsWith("/")) {
                tmpParam.mail.push("invisible");
            }
            data_.push(tmpParam);
        }
        return data_;
    };
    const time2vpos = (input) => {
        const time = RegExp(/^(?:(\d+):(\d+)\.(\d+)|(\d+):(\d+)|(\d+)\.(\d+)|(\d+))$/).exec(input);
        if (time) {
            if (time[1] !== undefined &&
                time[2] !== undefined &&
                time[3] !== undefined) {
                return ((Number(time[1]) * 60 + Number(time[2])) * 100 +
                    Number(time[3]) / 10 ** (time[3].length - 2));
            }
            if (time[4] !== undefined && time[5] !== undefined) {
                return (Number(time[4]) * 60 + Number(time[5])) * 100;
            }
            if (time[6] !== undefined && time[7] !== undefined) {
                return (Number(time[6]) * 100 + Number(time[7]) / 10 ** (time[7].length - 2));
            }
            if (time[8] !== undefined) {
                return Number(time[8]) * 100;
            }
        }
        return 0;
    };

    const V1Parser = {
        key: ["v1"],
        parse: (input) => {
            return fromV1(parse(array(ZV1Thread), input));
        },
    };
    const fromV1 = (data) => {
        const data_ = [];
        const userList = [];
        for (const item of data) {
            const val = item.comments;
            const forkName = item.fork;
            for (const value of val) {
                const tmpParam = {
                    id: value.no,
                    vpos: Math.floor(value.vposMs / 10),
                    content: value.body,
                    date: date2time(value.postedAt),
                    date_usec: 0,
                    owner: forkName === "owner",
                    premium: value.isPremium,
                    mail: value.commands,
                    user_id: -1,
                    layer: -1,
                    is_my_post: value.isMyPost,
                };
                if (tmpParam.content.startsWith("/") && tmpParam.owner) {
                    tmpParam.mail.push("invisible");
                }
                const isUserExist = userList.indexOf(value.userId);
                if (isUserExist === -1) {
                    tmpParam.user_id = userList.length;
                    userList.push(value.userId);
                }
                else {
                    tmpParam.user_id = isUserExist;
                }
                data_.push(tmpParam);
            }
        }
        return data_;
    };
    const date2time = (date) => Math.floor(Date.parse(date) / 1000);

    const Xml2jsParser = {
        key: ["xml2js"],
        parse: (input) => {
            return fromXml2js(parse(ZXml2jsPacket, input));
        },
    };
    const fromXml2js = (data) => {
        const data_ = [];
        const userList = [];
        let index = data.packet.chat.length;
        for (const item of data.packet.chat) {
            const tmpParam = {
                id: Number(item.$.no) || index++,
                vpos: Number(item.$.vpos),
                content: item._,
                date: Number(item.$.date),
                date_usec: Number(item.$.date_usec),
                owner: !(item.$.owner === "0" || item.$.user_id),
                premium: item.$.premium === "1",
                mail: item.$.mail.split(/\s+/g),
                user_id: -1,
                layer: -1,
                is_my_post: false,
            };
            if (tmpParam.content.startsWith("/") && tmpParam.owner) {
                tmpParam.mail.push("invisible");
            }
            const userId = item.$.user_id ?? "";
            const isUserExist = userList.indexOf(userId);
            if (isUserExist === -1) {
                tmpParam.user_id = userList.length;
                userList.push(userId);
            }
            else {
                tmpParam.user_id = isUserExist;
            }
            data_.push(tmpParam);
        }
        return data_;
    };

    const XmlDocumentParser = {
        key: ["formatted", "niconicome"],
        parse: (input) => {
            if (!typeGuard.xmlDocument(input))
                throw new InvalidFormatError();
            return parseXMLDocument(input);
        },
    };
    const parseXMLDocument = (data) => {
        const data_ = [];
        const userList = [];
        let index = Array.from(data.documentElement.children).length;
        for (const item of Array.from(data.documentElement.children)) {
            if (item.nodeName !== "chat")
                continue;
            const tmpParam = {
                id: Number(item.getAttribute("no")) || index++,
                vpos: Number(item.getAttribute("vpos")),
                content: item.textContent ?? "",
                date: Number(item.getAttribute("date")) || 0,
                date_usec: Number(item.getAttribute("date_usec")) || 0,
                owner: !item.getAttribute("user_id"),
                premium: item.getAttribute("premium") === "1",
                mail: [],
                user_id: -1,
                layer: -1,
                is_my_post: false,
            };
            if (item.getAttribute("mail")) {
                tmpParam.mail = item.getAttribute("mail")?.split(/\s+/g) ?? [];
            }
            if (tmpParam.content.startsWith("/") && tmpParam.owner) {
                tmpParam.mail.push("invisible");
            }
            const userId = item.getAttribute("user_id") ?? "";
            const isUserExist = userList.indexOf(userId);
            if (isUserExist === -1) {
                tmpParam.user_id = userList.length;
                userList.push(userId);
            }
            else {
                tmpParam.user_id = isUserExist;
            }
            data_.push(tmpParam);
        }
        return data_;
    };

    const parsers = [
        EmptyParser,
        FormattedParser,
        LegacyParser,
        LegacyOwnerParser,
        OwnerParser,
        V1Parser,
        Xml2jsParser,
        XmlDocumentParser,
    ];

    const convert2formattedComment = (data, type) => {
        const parser = parsers.find((parser) => parser.key.includes(type));
        if (!parser)
            throw new InvalidFormatError();
        return sort(parser.parse(data));
    };
    const sort = (data) => {
        data.sort((a, b) => {
            if (a.vpos < b.vpos)
                return -1;
            if (a.vpos > b.vpos)
                return 1;
            if (a.date < b.date)
                return -1;
            if (a.date > b.date)
                return 1;
            if (a.date_usec < b.date_usec)
                return -1;
            if (a.date_usec > b.date_usec)
                return 1;
            return 0;
        });
        return data;
    };

    var inputParser = /*#__PURE__*/Object.freeze({
        __proto__: null,
        default: convert2formattedComment
    });

    class CanvasRenderer {
        canvas;
        video;
        context;
        padding = 0;
        width = 0;
        height = 0;
        constructor(canvas, video, padding = 0) {
            this.canvas = canvas ?? document.createElement("canvas");
            const context = this.canvas.getContext("2d");
            if (!context)
                throw new CanvasRenderingContext2DError();
            this.context = context;
            this.context.textAlign = "start";
            this.context.textBaseline = "alphabetic";
            this.context.lineJoin = "round";
            this.video = video;
            this.padding = padding;
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            if (this.padding > 0) {
                this.canvas.width += this.padding * 2;
                this.canvas.height += this.padding * 2;
                this.context.translate(this.padding, this.padding);
            }
        }
        drawVideo(enableLegacyPip) {
            if (this.video) {
                let scale;
                const height = this.canvas.height / this.video.videoHeight;
                const width = this.canvas.width / this.video.videoWidth;
                if (enableLegacyPip ? height > width : height < width) {
                    scale = width;
                }
                else {
                    scale = height;
                }
                const offsetX = (this.canvas.width - this.video.videoWidth * scale) * 0.5;
                const offsetY = (this.canvas.height - this.video.videoHeight * scale) * 0.5;
                this.context.drawImage(this.video, offsetX, offsetY, this.video.videoWidth * scale, this.video.videoHeight * scale);
            }
        }
        getFont() {
            return this.context.font;
        }
        getFillStyle() {
            return this.context.fillStyle;
        }
        setScale(scale, arg1) {
            this.context.scale(scale, arg1 ?? scale);
        }
        drawImage(image, x, y, width, height) {
            if (!(image instanceof CanvasRenderer)) {
                throw new TypeError("CanvasRenderer.drawImage: 'image' argument must be an instance of CanvasRenderer.");
            }
            if (width === undefined || height === undefined)
                this.context.drawImage(image.canvas, x, y);
            else
                this.context.drawImage(image.canvas, x, y, width, height);
        }
        fillRect(x, y, width, height) {
            this.context.fillRect(x, y, width, height);
        }
        strokeRect(x, y, width, height) {
            this.context.strokeRect(x, y, width, height);
        }
        fillText(text, x, y) {
            this.context.fillText(text, x, y);
        }
        strokeText(text, x, y) {
            this.context.strokeText(text, x, y);
        }
        quadraticCurveTo(cpx, cpy, x, y) {
            this.context.quadraticCurveTo(cpx, cpy, x, y);
        }
        clearRect(x, y, width, height) {
            this.context.clearRect(x, y, width, height);
        }
        setFont(font) {
            this.context.font = font;
        }
        setFillStyle(color) {
            this.context.fillStyle = color;
        }
        setStrokeStyle(color) {
            this.context.strokeStyle = color;
        }
        setLineWidth(width) {
            this.context.lineWidth = width;
        }
        setGlobalAlpha(alpha) {
            this.context.globalAlpha = alpha;
        }
        setSize(width, height) {
            this.width = width;
            this.height = height;
            this.canvas.width = width + this.padding * 2;
            this.canvas.height = height + this.padding * 2;
        }
        getSize() {
            return {
                width: this.width,
                height: this.height,
            };
        }
        measureText(text) {
            return this.context.measureText(text);
        }
        beginPath() {
            this.context.beginPath();
        }
        closePath() {
            this.context.closePath();
        }
        moveTo(x, y) {
            this.context.moveTo(x, y);
        }
        lineTo(x, y) {
            this.context.lineTo(x, y);
        }
        stroke() {
            this.context.stroke();
        }
        save() {
            this.context.save();
        }
        restore() {
            this.context.restore();
        }
        getCanvas(padding = 0) {
            return new CanvasRenderer(undefined, undefined, padding);
        }
        destroy() {
        }
    }

    var index = /*#__PURE__*/Object.freeze({
        __proto__: null,
        CanvasRenderer: CanvasRenderer
    });

    const createCommentInstance = (comment, context, index) => {
        for (const plugin of config.commentPlugins) {
            if (plugin.condition(comment)) {
                return new plugin.class(comment, context, index);
            }
        }
        return new HTML5Comment(comment, context, index);
    };

    const definition = {
        colors: colors$1,
        config: config$1,
        fonts: fonts$1,
        initConfig: initConfig$1,
    };

    var internal = /*#__PURE__*/Object.freeze({
        __proto__: null,
        comments: index$1,
        contexts: index$4,
        definition: definition,
        errors: index$3,
        eventHandler: eventHandler,
        inputParser: inputParser,
        renderer: index,
        typeGuard: typeGuard$1,
        utils: index$2
    });

    class NiconiComments {
        enableLegacyPiP;
        showCollision;
        showFPS;
        showCommentCount;
        lastVpos;
        get lastVposInt() {
            return Math.floor(this.lastVpos);
        }
        processedCommentIndex;
        comments;
        renderer;
        collision;
        timeline;
        static typeGuard = typeGuard;
        static default = NiconiComments;
        static FlashComment = {
            condition: isFlashComment,
            class: FlashComment,
        };
        static internal = internal;
        constructor(_renderer, data, initOptions = {}) {
            const constructorStart = performance.now();
            initConfig();
            if (!typeGuard.config.initOptions(initOptions))
                throw new InvalidOptionError();
            setOptions(Object.assign(defaultOptions, initOptions));
            setConfig(Object.assign(defaultConfig, options.config));
            setIsDebug(options.debug);
            resetImageCache();
            resetNicoScripts();
            let renderer = _renderer;
            if (renderer instanceof HTMLCanvasElement) {
                renderer = new CanvasRenderer(renderer, options.video);
            }
            else if (options.video) {
                console.warn("options.video is ignored because renderer is not HTMLCanvasElement");
            }
            this.renderer = renderer;
            this.renderer.setLineWidth(getConfig(config.contextLineWidth, false));
            const rendererSize = this.renderer.getSize();
            this.renderer.setScale(rendererSize.width / config.canvasWidth, rendererSize.height / config.canvasHeight);
            let formatType = options.format;
            if (options.formatted) {
                console.warn("Deprecated: options.formatted is no longer recommended. Please use options.format. https://xpadev-net.github.io/niconicomments/#p_format");
            }
            if (formatType === "default") {
                formatType = options.formatted ? "formatted" : "legacy";
            }
            if (options.useLegacy) {
                console.warn("Deprecated: options.useLegacy is no longer recommended. Please use options.mode. https://xpadev-net.github.io/niconicomments/#p_mode");
            }
            if (options.mode === "default" && options.useLegacy) {
                options.mode = "html5";
            }
            const parsedData = convert2formattedComment(data, formatType);
            this.showCollision = options.showCollision;
            this.showFPS = options.showFPS;
            this.showCommentCount = options.showCommentCount;
            this.enableLegacyPiP = options.enableLegacyPiP;
            this.timeline = {};
            this.collision = {
                ue: [],
                shita: [],
                left: [],
                right: [],
            };
            this.lastVpos = -1;
            this.processedCommentIndex = -1;
            this.comments = this.preRendering(parsedData);
            logger(`constructor complete: ${performance.now() - constructorStart}ms`);
        }
        preRendering(_rawData) {
            let rawData = _rawData;
            const preRenderingStart = performance.now();
            if (options.keepCA) {
                rawData = changeCALayer(rawData);
            }
            let instances = rawData.reduce((pv, val, index) => {
                pv.push(createCommentInstance(val, this.renderer, index));
                return pv;
            }, []);
            this.getCommentPos(instances, instances.length, options.lazy);
            this.sortTimelineComment();
            const plugins = [];
            for (const plugin of config.plugins) {
                try {
                    const canvas = this.renderer.getCanvas();
                    const pluginInstance = new plugin(canvas, instances);
                    plugins.push({
                        canvas,
                        instance: pluginInstance,
                    });
                    if (pluginInstance.transformComments) {
                        instances = pluginInstance.transformComments(instances);
                    }
                }
                catch (e) {
                    console.error("Failed to init plugin");
                }
            }
            setPlugins(plugins);
            logger(`preRendering complete: ${performance.now() - preRenderingStart}ms`);
            return instances;
        }
        getCommentPos(data, end, lazy = false) {
            const getCommentPosStart = performance.now();
            if (this.processedCommentIndex + 1 >= end)
                return;
            for (const comment of data.slice(this.processedCommentIndex + 1, end)) {
                if (comment.invisible || (comment.posY > -1 && !lazy))
                    continue;
                if (comment.loc === "naka") {
                    processMovableComment(comment, this.collision, this.timeline, lazy);
                }
                else {
                    processFixedComment(comment, this.collision[comment.loc], this.timeline, lazy);
                }
                this.processedCommentIndex = comment.index;
            }
            if (lazy) {
                this.processedCommentIndex = 0;
            }
            logger(`getCommentPos complete: ${performance.now() - getCommentPosStart}ms`);
        }
        sortTimelineComment() {
            const sortCommentStart = performance.now();
            for (const vpos of Object.keys(this.timeline)) {
                const item = this.timeline[Number(vpos)];
                if (!item)
                    continue;
                const owner = [];
                const user = [];
                for (const comment of item) {
                    if (comment?.owner) {
                        owner.push(comment);
                    }
                    else {
                        user.push(comment);
                    }
                }
                this.timeline[Number(vpos)] = user.concat(owner);
            }
            logger(`parseData complete: ${performance.now() - sortCommentStart}ms`);
        }
        addComments(...rawComments) {
            const comments = rawComments.reduce((pv, val, index) => {
                pv.push(createCommentInstance(val, this.renderer, this.comments.length + index));
                return pv;
            }, []);
            for (const plugin of plugins) {
                try {
                    plugin.instance.addComments?.(comments);
                }
                catch (e) {
                    console.error("Failed to add comments", e);
                }
            }
            for (const comment of comments) {
                if (comment.invisible)
                    continue;
                if (comment.loc === "naka") {
                    processMovableComment(comment, this.collision, this.timeline);
                }
                else {
                    processFixedComment(comment, this.collision[comment.loc], this.timeline);
                }
            }
        }
        drawCanvas(vpos, forceRendering = false, cursor) {
            const vposInt = Math.floor(vpos);
            const drawCanvasStart = performance.now();
            if (this.lastVpos === vpos && !forceRendering)
                return false;
            triggerHandler(vposInt, this.lastVposInt);
            const timelineRange = this.timeline[vposInt];
            if (!forceRendering &&
                plugins.length === 0 &&
                timelineRange?.filter((item) => item.loc === "naka").length === 0 &&
                this.timeline[this.lastVposInt]?.filter((item) => item.loc === "naka")
                    ?.length === 0) {
                const current = timelineRange.filter((item) => item.loc !== "naka");
                const last = this.timeline[this.lastVposInt]?.filter((item) => item.loc !== "naka") ?? [];
                if (arrayEqual(current, last))
                    return false;
            }
            this.renderer.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
            this.lastVpos = vpos;
            this._drawVideo();
            for (const plugin of plugins) {
                try {
                    plugin.instance.draw?.(vpos);
                    this.renderer.drawImage(plugin.canvas, 0, 0);
                }
                catch (e) {
                    console.error("Failed to draw comments", e);
                }
            }
            this._drawCollision(vposInt);
            this._drawComments(timelineRange, vpos, cursor);
            this._drawFPS(drawCanvasStart);
            this._drawCommentCount(timelineRange?.length);
            logger(`drawCanvas complete: ${performance.now() - drawCanvasStart}ms`);
            return true;
        }
        _drawVideo() {
            this.renderer.drawVideo(this.enableLegacyPiP);
        }
        _drawComments(timelineRange, vpos, cursor) {
            if (timelineRange) {
                const targetComment = (() => {
                    if (config.commentLimit === undefined) {
                        return timelineRange;
                    }
                    if (config.hideCommentOrder === "asc") {
                        return timelineRange.slice(-config.commentLimit);
                    }
                    return timelineRange.slice(0, config.commentLimit);
                })();
                for (const comment of targetComment) {
                    if (comment.invisible) {
                        continue;
                    }
                    this.getCommentPos(this.comments, comment.index + 1);
                    comment.draw(vpos, this.showCollision, cursor);
                }
            }
        }
        _drawCollision(vpos) {
            if (this.showCollision) {
                this.renderer.save();
                const leftCollision = this.collision.left[vpos];
                const rightCollision = this.collision.right[vpos];
                this.renderer.setFillStyle("red");
                if (leftCollision) {
                    for (const comment of leftCollision) {
                        this.renderer.fillRect(config.collisionRange.left, comment.posY, getConfig(config.contextLineWidth, comment.flash), comment.height);
                    }
                }
                if (rightCollision) {
                    for (const comment of rightCollision) {
                        this.renderer.fillRect(config.collisionRange.right, comment.posY, getConfig(config.contextLineWidth, comment.flash) * -1, comment.height);
                    }
                }
                this.renderer.restore();
            }
        }
        _drawFPS(drawCanvasStart) {
            if (this.showFPS) {
                this.renderer.save();
                this.renderer.setFont(parseFont("defont", 60));
                this.renderer.setFillStyle("#00FF00");
                this.renderer.setStrokeStyle(`rgba(${hex2rgb(config.contextStrokeColor).join(",")},${config.contextStrokeOpacity})`);
                const drawTime = Math.floor(performance.now() - drawCanvasStart);
                const fps = Math.floor(1000 / (drawTime === 0 ? 1 : drawTime));
                this.renderer.strokeText(`FPS:${fps}(${drawTime}ms)`, 100, 100);
                this.renderer.fillText(`FPS:${fps}(${drawTime}ms)`, 100, 100);
                this.renderer.restore();
            }
        }
        _drawCommentCount(count) {
            if (this.showCommentCount) {
                this.renderer.save();
                this.renderer.setFont(parseFont("defont", 60));
                this.renderer.setFillStyle("#00FF00");
                this.renderer.setStrokeStyle(`rgba(${hex2rgb(config.contextStrokeColor).join(",")},${config.contextStrokeOpacity})`);
                this.renderer.strokeText(`Count:${count ?? 0}`, 100, 200);
                this.renderer.fillText(`Count:${count ?? 0}`, 100, 200);
                this.renderer.restore();
            }
        }
        addEventListener(eventName, handler) {
            registerHandler(eventName, handler);
        }
        removeEventListener(eventName, handler) {
            removeHandler(eventName, handler);
        }
        clear() {
            const size = this.renderer.getSize();
            this.renderer.clearRect(0, 0, size.width, size.height);
        }
        click(vpos, pos) {
            const _comments = this.timeline[vpos];
            if (!_comments)
                return;
            const comments = [..._comments].reverse();
            for (const comment of comments) {
                if (comment.isHovered(pos)) {
                    const newComment = buildAtButtonComment(comment.comment, vpos);
                    if (!newComment)
                        continue;
                    this.addComments(newComment);
                }
            }
        }
    }
    const logger = (msg) => {
        if (isDebug)
            console.debug(msg);
    };

    return NiconiComments;

}));
