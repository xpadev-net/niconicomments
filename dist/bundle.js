/*!
niconicomments.js v0.2.78
(c) 2021 xpadev-net https://xpadev.net
Released under the MIT License.
*/
(function(global, factory) {
	typeof exports === "object" && typeof module !== "undefined" ? module.exports = factory() : typeof define === "function" && define.amd ? define([], factory) : (global = typeof globalThis !== "undefined" ? globalThis : global || self, global.NiconiComments = factory());
})(this, function() {
	//#region \0rolldown/runtime.js
	var __defProp = Object.defineProperty;
	var __exportAll = (all, no_symbols) => {
		let target = {};
		for (var name in all) __defProp(target, name, {
			get: all[name],
			enumerable: true
		});
		if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
		return target;
	};
	//#endregion
	//#region src/errors/CanvasRenderingContext2DError.ts
	/**
	* CanvasのContext取得に失敗した際に発生するエラー
	*/
	var CanvasRenderingContext2DError = class extends Error {
		constructor(options = {}) {
			super("CanvasRenderingContext2DError", options);
		}
	};
	CanvasRenderingContext2DError.prototype.name = "CanvasRenderingContext2DError";
	//#endregion
	//#region src/errors/InvalidFormatError.ts
	/**
	* 入力されたフォーマットが正しくない際に発生するエラー
	*/
	var InvalidFormatError = class extends Error {
		constructor(options = {}) {
			super("InvalidFormatError", options);
		}
	};
	InvalidFormatError.prototype.name = "InvalidFormatError";
	//#endregion
	//#region src/errors/InvalidOptionError.ts
	/**
	* 入力された設定が正しくなかった際に発生するエラー
	*/
	var InvalidOptionError = class extends Error {
		constructor(options = {}) {
			super("Invalid option\nPlease check document: https://xpadev-net.github.io/niconicomments/#p_options", options);
		}
	};
	InvalidOptionError.prototype.name = "InvalidOptionError";
	//#endregion
	//#region \0@oxc-project+runtime@0.122.0/helpers/typeof.js
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.122.0/helpers/toPrimitive.js
	function toPrimitive(t, r) {
		if ("object" != _typeof(t) || !t) return t;
		var e = t[Symbol.toPrimitive];
		if (void 0 !== e) {
			var i = e.call(t, r || "default");
			if ("object" != _typeof(i)) return i;
			throw new TypeError("@@toPrimitive must return a primitive value.");
		}
		return ("string" === r ? String : Number)(t);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.122.0/helpers/toPropertyKey.js
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.122.0/helpers/defineProperty.js
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	//#endregion
	//#region src/errors/NotImplementedError.ts
	/**
	* BaseCommentなどを継承しているプラグインで必要な関数を実装していない場合などに発生するエラー
	*/
	var NotImplementedError = class extends Error {
		constructor(pluginName, methodName, options = {}) {
			super("NotImplementedError", options);
			_defineProperty(this, "pluginName", void 0);
			_defineProperty(this, "methodName", void 0);
			this.pluginName = pluginName;
			this.methodName = methodName;
		}
	};
	NotImplementedError.prototype.name = "NotImplementedError";
	//#endregion
	//#region src/errors/index.ts
	var errors_exports = /* @__PURE__ */ __exportAll({
		CanvasRenderingContext2DError: () => CanvasRenderingContext2DError,
		InvalidFormatError: () => InvalidFormatError,
		InvalidOptionError: () => InvalidOptionError,
		NotImplementedError: () => NotImplementedError
	});
	//#endregion
	//#region src/renderer/canvasPool.ts
	/**
	* HTMLCanvasElement のオブジェクトプール
	* コメント画像生成時の document.createElement("canvas") コストを削減する
	* maxSize を超えたキャンバスは返却せずGCに委ねる（メモリ使用量の上限を保証）
	*/
	var CanvasPool = class {
		constructor(maxSize = 16) {
			_defineProperty(this, "maxSize", void 0);
			_defineProperty(this, "pool", []);
			this.maxSize = maxSize;
		}
		acquire() {
			var _this$pool$pop;
			return (_this$pool$pop = this.pool.pop()) !== null && _this$pool$pop !== void 0 ? _this$pool$pop : document.createElement("canvas");
		}
		release(canvas) {
			if (this.pool.length >= this.maxSize) return;
			canvas.width = 0;
			canvas.height = 0;
			this.pool.push(canvas);
		}
		clear() {
			this.pool.length = 0;
		}
	};
	const canvasPool = new CanvasPool();
	//#endregion
	//#region src/renderer/canvas.ts
	/**
	* Canvasを使ったレンダラー
	* dom/canvas周りのAPIを切り出したもの
	* @param canvas レンダリング先のCanvas
	* @param video レンダリングするVideo(任意)
	*/
	var CanvasRenderer = class CanvasRenderer {
		constructor(canvas, video, padding = 0, onDestroy) {
			_defineProperty(this, "rendererName", "CanvasRenderer");
			_defineProperty(this, "canvas", void 0);
			_defineProperty(this, "video", void 0);
			_defineProperty(this, "context", void 0);
			_defineProperty(this, "padding", 0);
			_defineProperty(this, "width", 0);
			_defineProperty(this, "height", 0);
			_defineProperty(this, "pooled", void 0);
			_defineProperty(this, "_onDestroy", void 0);
			this.pooled = !canvas;
			this._onDestroy = onDestroy;
			this.canvas = canvas !== null && canvas !== void 0 ? canvas : canvasPool.acquire();
			const context = this.canvas.getContext("2d");
			if (!context) throw new CanvasRenderingContext2DError();
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
			if (this.video && this.video.videoWidth > 0 && this.video.videoHeight > 0) {
				let scale;
				const height = this.canvas.height / this.video.videoHeight;
				const width = this.canvas.width / this.video.videoWidth;
				if (enableLegacyPip ? height > width : height < width) scale = width;
				else scale = height;
				const offsetX = (this.canvas.width - this.video.videoWidth * scale) * .5;
				const offsetY = (this.canvas.height - this.video.videoHeight * scale) * .5;
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
			this.context.scale(scale, arg1 !== null && arg1 !== void 0 ? arg1 : scale);
		}
		drawImage(image, x, y, width, height) {
			if (width === void 0 || height === void 0) this.context.drawImage(image.canvas, x, y);
			else this.context.drawImage(image.canvas, x, y, width, height);
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
				height: this.height
			};
		}
		measureText(text) {
			const key = `${this.context.font}\0${text}`;
			const cached = CanvasRenderer._mtCache.get(key);
			if (cached !== void 0) return cached;
			const result = this.context.measureText(text);
			if (CanvasRenderer._mtCache.size < CanvasRenderer._MT_CACHE_MAX_SIZE) CanvasRenderer._mtCache.set(key, result);
			return result;
		}
		static resetMeasureTextCache() {
			CanvasRenderer._mtCache.clear();
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
			return new CanvasRenderer(void 0, void 0, padding);
		}
		flush() {}
		invalidateImage(_image) {}
		destroy() {
			var _this$_onDestroy;
			(_this$_onDestroy = this._onDestroy) === null || _this$_onDestroy === void 0 || _this$_onDestroy.call(this);
			if (this.pooled) canvasPool.release(this.canvas);
		}
	};
	_defineProperty(CanvasRenderer, "_MT_CACHE_MAX_SIZE", 5e3);
	_defineProperty(CanvasRenderer, "_mtCache", /* @__PURE__ */ new Map());
	//#endregion
	//#region src/contexts/cache.ts
	let imageCache = {};
	/**
	* キャッシュをリセットする
	*/
	const resetImageCache = () => {
		for (const entry of Object.values(imageCache)) {
			clearTimeout(entry.timeout);
			entry.image.destroy();
		}
		imageCache = {};
		CanvasRenderer.resetMeasureTextCache();
		canvasPool.clear();
	};
	//#endregion
	//#region src/contexts/nicoscript.ts
	let nicoScripts = {
		reverse: [],
		default: [],
		replace: [],
		ban: [],
		seekDisable: [],
		jump: []
	};
	/**
	* ニコスクリプトの設定をリセットする
	*/
	const resetNicoScripts = () => {
		nicoScripts = {
			reverse: [],
			default: [],
			replace: [],
			ban: [],
			seekDisable: [],
			jump: []
		};
	};
	//#endregion
	//#region src/contexts/plugins.ts
	let plugins = [];
	/**
	* プラグインを設定する
	* @param input プラグインの配列
	*/
	const setPlugins = (input) => {
		plugins = input;
	};
	//#endregion
	//#region src/contexts/index.ts
	var contexts_exports = /* @__PURE__ */ __exportAll({
		imageCache: () => imageCache,
		nicoScripts: () => nicoScripts,
		plugins: () => plugins,
		resetImageCache: () => resetImageCache,
		resetNicoScripts: () => resetNicoScripts,
		setPlugins: () => setPlugins
	});
	//#endregion
	//#region src/contexts/debug.ts
	let isDebug = false;
	const setIsDebug = (val) => {
		isDebug = val;
	};
	//#endregion
	//#region src/definition/config.ts
	var config_exports = /* @__PURE__ */ __exportAll({
		config: () => config,
		defaultConfig: () => defaultConfig,
		defaultOptions: () => defaultOptions,
		options: () => options,
		setConfig: () => setConfig,
		setOptions: () => setOptions,
		updateConfig: () => updateConfig
	});
	let defaultConfig;
	/**
	* 設定を更新する
	* @param config 更新後の設定
	*/
	const updateConfig = (config) => {
		defaultConfig = config;
	};
	/**
	* 既定の設定
	*/
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
		video: void 0,
		lazy: false
	};
	let config;
	let options;
	/**
	* 設定を更新する
	* @param value 更新後の設定
	*/
	const setConfig = (value) => {
		config = value;
	};
	/**
	* 設定を更新する
	* @param value 更新後の設定
	*/
	const setOptions = (value) => {
		options = value;
	};
	//#endregion
	//#region src/utils/array.ts
	/**
	* phpのarray_push的なあれ
	* @param _array 追加対象の配列
	* @param key 追加対象のキー
	* @param push 追加する値
	*/
	const arrayPush = (_array, key, push) => {
		const arr = _array[key];
		if (arr) arr.push(push);
		else _array[key] = [push];
	};
	/**
	* ２つの配列を比較する
	* @param a １つ目
	* @param b ２つ目
	* @returns ２つの配列が等しいか
	*/
	const arrayEqual = (a, b) => {
		if (a.length !== b.length) return false;
		for (let i = 0, n = a.length; i < n; ++i) if (a[i] !== b[i]) return false;
		return true;
	};
	//#endregion
	//#region src/utils/color.ts
	/**
	* Hexからrgbに変換する(_live用)
	* @param _hex カラコ
	* @returns RGB
	*/
	const hex2rgb = (_hex) => {
		let hex = _hex;
		if (hex.startsWith("#")) hex = hex.slice(1);
		if (hex.length === 3) hex = hex.slice(0, 1) + hex.slice(0, 1) + hex.slice(1, 2) + hex.slice(1, 2) + hex.slice(2, 3) + hex.slice(2, 3);
		return [
			hex.slice(0, 2),
			hex.slice(2, 4),
			hex.slice(4, 6)
		].map((str) => Number.parseInt(str, 16));
	};
	/**
	* Hexからrgbaに変換する(_live用)
	* @param _hex カラコ
	* @returns RGB
	*/
	const hex2rgba = (_hex) => {
		let hex = _hex;
		if (hex.startsWith("#")) hex = hex.slice(1);
		if (hex.length === 4) hex = hex.slice(0, 1) + hex.slice(0, 1) + hex.slice(1, 2) + hex.slice(1, 2) + hex.slice(2, 3) + hex.slice(2, 3) + hex.slice(3, 4) + hex.slice(3, 4);
		return [
			hex.slice(0, 2),
			hex.slice(2, 4),
			hex.slice(4, 6),
			hex.slice(6, 8)
		].map((str, index) => {
			if (index === 3) return Number.parseInt(str, 16) / 255;
			return Number.parseInt(str, 16);
		});
	};
	/**
	* コメントの枠色を取得する
	* @param comment コメント
	* @returns 枠色
	*/
	const getStrokeColor = (comment) => {
		if (comment.strokeColor) {
			const color = comment.strokeColor.slice(1);
			const length = color.length;
			if (length === 3 || length === 6) return `rgba(${hex2rgb(color).join(",")},${config.contextStrokeOpacity})`;
			if (length === 4 || length === 8) return `rgba(${hex2rgba(color).join(",")})`;
		}
		return `rgba(${hex2rgb(comment.color === "#000000" ? config.contextStrokeInversionColor : config.contextStrokeColor).join(",")},${config.contextStrokeOpacity})`;
	};
	//#endregion
	//#region \0@oxc-project+runtime@0.122.0/helpers/objectSpread2.js
	function ownKeys(e, r) {
		var t = Object.keys(e);
		if (Object.getOwnPropertySymbols) {
			var o = Object.getOwnPropertySymbols(e);
			r && (o = o.filter(function(r) {
				return Object.getOwnPropertyDescriptor(e, r).enumerable;
			})), t.push.apply(t, o);
		}
		return t;
	}
	function _objectSpread2(e) {
		for (var r = 1; r < arguments.length; r++) {
			var t = null != arguments[r] ? arguments[r] : {};
			r % 2 ? ownKeys(Object(t), !0).forEach(function(r) {
				_defineProperty(e, r, t[r]);
			}) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r) {
				Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
			});
		}
		return e;
	}
	let store$4;
	/**
	* Returns the global configuration.
	*
	* @param config The config to merge.
	*
	* @returns The configuration.
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function getGlobalConfig(config$1) {
		var _config$1$lang, _config$1$abortEarly, _config$1$abortPipeEa;
		return {
			lang: (_config$1$lang = config$1 === null || config$1 === void 0 ? void 0 : config$1.lang) !== null && _config$1$lang !== void 0 ? _config$1$lang : store$4 === null || store$4 === void 0 ? void 0 : store$4.lang,
			message: config$1 === null || config$1 === void 0 ? void 0 : config$1.message,
			abortEarly: (_config$1$abortEarly = config$1 === null || config$1 === void 0 ? void 0 : config$1.abortEarly) !== null && _config$1$abortEarly !== void 0 ? _config$1$abortEarly : store$4 === null || store$4 === void 0 ? void 0 : store$4.abortEarly,
			abortPipeEarly: (_config$1$abortPipeEa = config$1 === null || config$1 === void 0 ? void 0 : config$1.abortPipeEarly) !== null && _config$1$abortPipeEa !== void 0 ? _config$1$abortPipeEa : store$4 === null || store$4 === void 0 ? void 0 : store$4.abortPipeEarly
		};
	}
	let store$3;
	/**
	* Returns a global error message.
	*
	* @param lang The language of the message.
	*
	* @returns The error message.
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function getGlobalMessage(lang) {
		return store$3 === null || store$3 === void 0 ? void 0 : store$3.get(lang);
	}
	let store$2;
	/**
	* Returns a schema error message.
	*
	* @param lang The language of the message.
	*
	* @returns The error message.
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function getSchemaMessage(lang) {
		return store$2 === null || store$2 === void 0 ? void 0 : store$2.get(lang);
	}
	let store$1;
	/**
	* Returns a specific error message.
	*
	* @param reference The identifier reference.
	* @param lang The language of the message.
	*
	* @returns The error message.
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function getSpecificMessage(reference, lang) {
		var _store$1$get;
		return store$1 === null || store$1 === void 0 || (_store$1$get = store$1.get(reference)) === null || _store$1$get === void 0 ? void 0 : _store$1$get.get(lang);
	}
	/**
	* Stringifies an unknown input to a literal or type string.
	*
	* @param input The unknown input.
	*
	* @returns A literal or type string.
	*
	* @internal
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function _stringify(input) {
		var _ref, _Object$getPrototypeO;
		const type = typeof input;
		if (type === "string") return `"${input}"`;
		if (type === "number" || type === "bigint" || type === "boolean") return `${input}`;
		if (type === "object" || type === "function") return (_ref = input && ((_Object$getPrototypeO = Object.getPrototypeOf(input)) === null || _Object$getPrototypeO === void 0 || (_Object$getPrototypeO = _Object$getPrototypeO.constructor) === null || _Object$getPrototypeO === void 0 ? void 0 : _Object$getPrototypeO.name)) !== null && _ref !== void 0 ? _ref : "null";
		return type;
	}
	/**
	* Adds an issue to the dataset.
	*
	* @param context The issue context.
	* @param label The issue label.
	* @param dataset The input dataset.
	* @param config The configuration.
	* @param other The optional props.
	*
	* @internal
	*/
	function _addIssue(context, label, dataset, config$1, other) {
		var _ref2, _other$expected, _other$received, _ref3, _ref4, _ref5, _ref6, _other$message;
		const input = other && "input" in other ? other.input : dataset.value;
		const expected = (_ref2 = (_other$expected = other === null || other === void 0 ? void 0 : other.expected) !== null && _other$expected !== void 0 ? _other$expected : context.expects) !== null && _ref2 !== void 0 ? _ref2 : null;
		const received = (_other$received = other === null || other === void 0 ? void 0 : other.received) !== null && _other$received !== void 0 ? _other$received : /* @__PURE__ */ _stringify(input);
		const issue = {
			kind: context.kind,
			type: context.type,
			input,
			expected,
			received,
			message: `Invalid ${label}: ${expected ? `Expected ${expected} but r` : "R"}eceived ${received}`,
			requirement: context.requirement,
			path: other === null || other === void 0 ? void 0 : other.path,
			issues: other === null || other === void 0 ? void 0 : other.issues,
			lang: config$1.lang,
			abortEarly: config$1.abortEarly,
			abortPipeEarly: config$1.abortPipeEarly
		};
		const isSchema = context.kind === "schema";
		const message$1 = (_ref3 = (_ref4 = (_ref5 = (_ref6 = (_other$message = other === null || other === void 0 ? void 0 : other.message) !== null && _other$message !== void 0 ? _other$message : context.message) !== null && _ref6 !== void 0 ? _ref6 : /* @__PURE__ */ getSpecificMessage(context.reference, issue.lang)) !== null && _ref5 !== void 0 ? _ref5 : isSchema ? /* @__PURE__ */ getSchemaMessage(issue.lang) : null) !== null && _ref4 !== void 0 ? _ref4 : config$1.message) !== null && _ref3 !== void 0 ? _ref3 : /* @__PURE__ */ getGlobalMessage(issue.lang);
		if (message$1 !== void 0) issue.message = typeof message$1 === "function" ? message$1(issue) : message$1;
		if (isSchema) dataset.typed = false;
		if (dataset.issues) dataset.issues.push(issue);
		else dataset.issues = [issue];
	}
	/**
	* Returns the Standard Schema properties.
	*
	* @param context The schema context.
	*
	* @returns The Standard Schema properties.
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function _getStandardProps(context) {
		return {
			version: 1,
			vendor: "valibot",
			validate(value$1) {
				return context["~run"]({ value: value$1 }, /* @__PURE__ */ getGlobalConfig());
			}
		};
	}
	/**
	* Disallows inherited object properties and prevents object prototype
	* pollution by disallowing certain keys.
	*
	* @param object The object to check.
	* @param key The key to check.
	*
	* @returns Whether the key is allowed.
	*
	* @internal
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function _isValidObjectKey(object$1, key) {
		return Object.hasOwn(object$1, key) && key !== "__proto__" && key !== "prototype" && key !== "constructor";
	}
	/**
	* Joins multiple `expects` values with the given separator.
	*
	* @param values The `expects` values.
	* @param separator The separator.
	*
	* @returns The joined `expects` property.
	*
	* @internal
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function _joinExpects(values$1, separator) {
		var _list$;
		const list = [...new Set(values$1)];
		if (list.length > 1) return `(${list.join(` ${separator} `)})`;
		return (_list$ = list[0]) !== null && _list$ !== void 0 ? _list$ : "never";
	}
	/**
	* A Valibot error with useful information.
	*/
	var ValiError = class extends Error {
		/**
		* Creates a Valibot error with useful information.
		*
		* @param issues The error issues.
		*/
		constructor(issues) {
			super(issues[0].message);
			this.name = "ValiError";
			this.issues = issues;
		}
	};
	/* @__NO_SIDE_EFFECTS__ */
	function check(requirement, message$1) {
		return {
			kind: "validation",
			type: "check",
			reference: check,
			async: false,
			expects: null,
			requirement,
			message: message$1,
			"~run"(dataset, config$1) {
				if (dataset.typed && !this.requirement(dataset.value)) _addIssue(this, "input", dataset, config$1);
				return dataset;
			}
		};
	}
	/* @__NO_SIDE_EFFECTS__ */
	function notValue(requirement, message$1) {
		return {
			kind: "validation",
			type: "not_value",
			reference: notValue,
			async: false,
			expects: requirement instanceof Date ? `!${requirement.toJSON()}` : `!${/* @__PURE__ */ _stringify(requirement)}`,
			requirement,
			message: message$1,
			"~run"(dataset, config$1) {
				if (dataset.typed && this.requirement <= dataset.value && this.requirement >= dataset.value) _addIssue(this, "value", dataset, config$1, { received: dataset.value instanceof Date ? dataset.value.toJSON() : /* @__PURE__ */ _stringify(dataset.value) });
				return dataset;
			}
		};
	}
	/* @__NO_SIDE_EFFECTS__ */
	function regex(requirement, message$1) {
		return {
			kind: "validation",
			type: "regex",
			reference: regex,
			async: false,
			expects: `${requirement}`,
			requirement,
			message: message$1,
			"~run"(dataset, config$1) {
				if (dataset.typed && !this.requirement.test(dataset.value)) _addIssue(this, "format", dataset, config$1);
				return dataset;
			}
		};
	}
	/**
	* Returns the fallback value of the schema.
	*
	* @param schema The schema to get it from.
	* @param dataset The output dataset if available.
	* @param config The config if available.
	*
	* @returns The fallback value.
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function getFallback(schema, dataset, config$1) {
		return typeof schema.fallback === "function" ? schema.fallback(dataset, config$1) : schema.fallback;
	}
	/**
	* Returns the default value of the schema.
	*
	* @param schema The schema to get it from.
	* @param dataset The input dataset if available.
	* @param config The config if available.
	*
	* @returns The default value.
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function getDefault(schema, dataset, config$1) {
		return typeof schema.default === "function" ? schema.default(dataset, config$1) : schema.default;
	}
	/**
	* Checks if the input matches the schema. By using a type predicate, this
	* function can be used as a type guard.
	*
	* @param schema The schema to be used.
	* @param input The input to be tested.
	*
	* @returns Whether the input matches the schema.
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function is(schema, input) {
		return !schema["~run"]({ value: input }, { abortEarly: true }).issues;
	}
	/* @__NO_SIDE_EFFECTS__ */
	function array(item, message$1) {
		return {
			kind: "schema",
			type: "array",
			reference: array,
			expects: "Array",
			async: false,
			item,
			message: message$1,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			},
			"~run"(dataset, config$1) {
				const input = dataset.value;
				if (Array.isArray(input)) {
					dataset.typed = true;
					dataset.value = [];
					for (let key = 0; key < input.length; key++) {
						const value$1 = input[key];
						const itemDataset = this.item["~run"]({ value: value$1 }, config$1);
						if (itemDataset.issues) {
							const pathItem = {
								type: "array",
								origin: "value",
								input,
								key,
								value: value$1
							};
							for (const issue of itemDataset.issues) {
								var _dataset$issues;
								if (issue.path) issue.path.unshift(pathItem);
								else issue.path = [pathItem];
								(_dataset$issues = dataset.issues) === null || _dataset$issues === void 0 || _dataset$issues.push(issue);
							}
							if (!dataset.issues) dataset.issues = itemDataset.issues;
							if (config$1.abortEarly) {
								dataset.typed = false;
								break;
							}
						}
						if (!itemDataset.typed) dataset.typed = false;
						dataset.value.push(itemDataset.value);
					}
				} else _addIssue(this, "type", dataset, config$1);
				return dataset;
			}
		};
	}
	/* @__NO_SIDE_EFFECTS__ */
	function boolean(message$1) {
		return {
			kind: "schema",
			type: "boolean",
			reference: boolean,
			expects: "boolean",
			async: false,
			message: message$1,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			},
			"~run"(dataset, config$1) {
				if (typeof dataset.value === "boolean") dataset.typed = true;
				else _addIssue(this, "type", dataset, config$1);
				return dataset;
			}
		};
	}
	/* @__NO_SIDE_EFFECTS__ */
	function instance(class_, message$1) {
		return {
			kind: "schema",
			type: "instance",
			reference: instance,
			expects: class_.name,
			async: false,
			class: class_,
			message: message$1,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			},
			"~run"(dataset, config$1) {
				if (dataset.value instanceof this.class) dataset.typed = true;
				else _addIssue(this, "type", dataset, config$1);
				return dataset;
			}
		};
	}
	/**
	* Merges two values into one single output.
	*
	* @param value1 First value.
	* @param value2 Second value.
	*
	* @returns The merge dataset.
	*
	* @internal
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function _merge(value1, value2) {
		if (typeof value1 === typeof value2) {
			if (value1 === value2 || value1 instanceof Date && value2 instanceof Date && +value1 === +value2) return { value: value1 };
			if (value1 && value2 && value1.constructor === Object && value2.constructor === Object) {
				for (const key in value2) if (key in value1) {
					const dataset = /* @__PURE__ */ _merge(value1[key], value2[key]);
					if (dataset.issue) return dataset;
					value1[key] = dataset.value;
				} else value1[key] = value2[key];
				return { value: value1 };
			}
			if (Array.isArray(value1) && Array.isArray(value2)) {
				if (value1.length === value2.length) {
					for (let index = 0; index < value1.length; index++) {
						const dataset = /* @__PURE__ */ _merge(value1[index], value2[index]);
						if (dataset.issue) return dataset;
						value1[index] = dataset.value;
					}
					return { value: value1 };
				}
			}
		}
		return { issue: true };
	}
	/* @__NO_SIDE_EFFECTS__ */
	function intersect(options, message$1) {
		return {
			kind: "schema",
			type: "intersect",
			reference: intersect,
			expects: /* @__PURE__ */ _joinExpects(options.map((option) => option.expects), "&"),
			async: false,
			options,
			message: message$1,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			},
			"~run"(dataset, config$1) {
				if (this.options.length) {
					const input = dataset.value;
					let outputs;
					dataset.typed = true;
					for (const schema of this.options) {
						const optionDataset = schema["~run"]({ value: input }, config$1);
						if (optionDataset.issues) {
							if (dataset.issues) dataset.issues.push(...optionDataset.issues);
							else dataset.issues = optionDataset.issues;
							if (config$1.abortEarly) {
								dataset.typed = false;
								break;
							}
						}
						if (!optionDataset.typed) dataset.typed = false;
						if (dataset.typed) if (outputs) outputs.push(optionDataset.value);
						else outputs = [optionDataset.value];
					}
					if (dataset.typed) {
						dataset.value = outputs[0];
						for (let index = 1; index < outputs.length; index++) {
							const mergeDataset = /* @__PURE__ */ _merge(dataset.value, outputs[index]);
							if (mergeDataset.issue) {
								_addIssue(this, "type", dataset, config$1, { received: "unknown" });
								break;
							}
							dataset.value = mergeDataset.value;
						}
					}
				} else _addIssue(this, "type", dataset, config$1);
				return dataset;
			}
		};
	}
	/* @__NO_SIDE_EFFECTS__ */
	function literal(literal_, message$1) {
		return {
			kind: "schema",
			type: "literal",
			reference: literal,
			expects: /* @__PURE__ */ _stringify(literal_),
			async: false,
			literal: literal_,
			message: message$1,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			},
			"~run"(dataset, config$1) {
				if (dataset.value === this.literal) dataset.typed = true;
				else _addIssue(this, "type", dataset, config$1);
				return dataset;
			}
		};
	}
	/* @__NO_SIDE_EFFECTS__ */
	function nullable(wrapped, default_) {
		return {
			kind: "schema",
			type: "nullable",
			reference: nullable,
			expects: `(${wrapped.expects} | null)`,
			async: false,
			wrapped,
			default: default_,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			},
			"~run"(dataset, config$1) {
				if (dataset.value === null) {
					if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
					if (dataset.value === null) {
						dataset.typed = true;
						return dataset;
					}
				}
				return this.wrapped["~run"](dataset, config$1);
			}
		};
	}
	/* @__NO_SIDE_EFFECTS__ */
	function number(message$1) {
		return {
			kind: "schema",
			type: "number",
			reference: number,
			expects: "number",
			async: false,
			message: message$1,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			},
			"~run"(dataset, config$1) {
				if (typeof dataset.value === "number" && !isNaN(dataset.value)) dataset.typed = true;
				else _addIssue(this, "type", dataset, config$1);
				return dataset;
			}
		};
	}
	/* @__NO_SIDE_EFFECTS__ */
	function object(entries$1, message$1) {
		return {
			kind: "schema",
			type: "object",
			reference: object,
			expects: "Object",
			async: false,
			entries: entries$1,
			message: message$1,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			},
			"~run"(dataset, config$1) {
				const input = dataset.value;
				if (input && typeof input === "object") {
					dataset.typed = true;
					dataset.value = {};
					for (const key in this.entries) {
						const valueSchema = this.entries[key];
						if (key in input || (valueSchema.type === "exact_optional" || valueSchema.type === "optional" || valueSchema.type === "nullish") && valueSchema.default !== void 0) {
							const value$1 = key in input ? input[key] : /* @__PURE__ */ getDefault(valueSchema);
							const valueDataset = valueSchema["~run"]({ value: value$1 }, config$1);
							if (valueDataset.issues) {
								const pathItem = {
									type: "object",
									origin: "value",
									input,
									key,
									value: value$1
								};
								for (const issue of valueDataset.issues) {
									var _dataset$issues11;
									if (issue.path) issue.path.unshift(pathItem);
									else issue.path = [pathItem];
									(_dataset$issues11 = dataset.issues) === null || _dataset$issues11 === void 0 || _dataset$issues11.push(issue);
								}
								if (!dataset.issues) dataset.issues = valueDataset.issues;
								if (config$1.abortEarly) {
									dataset.typed = false;
									break;
								}
							}
							if (!valueDataset.typed) dataset.typed = false;
							dataset.value[key] = valueDataset.value;
						} else if (valueSchema.fallback !== void 0) dataset.value[key] = /* @__PURE__ */ getFallback(valueSchema);
						else if (valueSchema.type !== "exact_optional" && valueSchema.type !== "optional" && valueSchema.type !== "nullish") {
							_addIssue(this, "key", dataset, config$1, {
								input: void 0,
								expected: `"${key}"`,
								path: [{
									type: "object",
									origin: "key",
									input,
									key,
									value: input[key]
								}]
							});
							if (config$1.abortEarly) break;
						}
					}
				} else _addIssue(this, "type", dataset, config$1);
				return dataset;
			}
		};
	}
	/* @__NO_SIDE_EFFECTS__ */
	function optional(wrapped, default_) {
		return {
			kind: "schema",
			type: "optional",
			reference: optional,
			expects: `(${wrapped.expects} | undefined)`,
			async: false,
			wrapped,
			default: default_,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			},
			"~run"(dataset, config$1) {
				if (dataset.value === void 0) {
					if (this.default !== void 0) dataset.value = /* @__PURE__ */ getDefault(this, dataset, config$1);
					if (dataset.value === void 0) {
						dataset.typed = true;
						return dataset;
					}
				}
				return this.wrapped["~run"](dataset, config$1);
			}
		};
	}
	/* @__NO_SIDE_EFFECTS__ */
	function record(key, value$1, message$1) {
		return {
			kind: "schema",
			type: "record",
			reference: record,
			expects: "Object",
			async: false,
			key,
			value: value$1,
			message: message$1,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			},
			"~run"(dataset, config$1) {
				const input = dataset.value;
				if (input && typeof input === "object") {
					dataset.typed = true;
					dataset.value = {};
					for (const entryKey in input) if (/* @__PURE__ */ _isValidObjectKey(input, entryKey)) {
						const entryValue = input[entryKey];
						const keyDataset = this.key["~run"]({ value: entryKey }, config$1);
						if (keyDataset.issues) {
							const pathItem = {
								type: "object",
								origin: "key",
								input,
								key: entryKey,
								value: entryValue
							};
							for (const issue of keyDataset.issues) {
								var _dataset$issues17;
								issue.path = [pathItem];
								(_dataset$issues17 = dataset.issues) === null || _dataset$issues17 === void 0 || _dataset$issues17.push(issue);
							}
							if (!dataset.issues) dataset.issues = keyDataset.issues;
							if (config$1.abortEarly) {
								dataset.typed = false;
								break;
							}
						}
						const valueDataset = this.value["~run"]({ value: entryValue }, config$1);
						if (valueDataset.issues) {
							const pathItem = {
								type: "object",
								origin: "value",
								input,
								key: entryKey,
								value: entryValue
							};
							for (const issue of valueDataset.issues) {
								var _dataset$issues18;
								if (issue.path) issue.path.unshift(pathItem);
								else issue.path = [pathItem];
								(_dataset$issues18 = dataset.issues) === null || _dataset$issues18 === void 0 || _dataset$issues18.push(issue);
							}
							if (!dataset.issues) dataset.issues = valueDataset.issues;
							if (config$1.abortEarly) {
								dataset.typed = false;
								break;
							}
						}
						if (!keyDataset.typed || !valueDataset.typed) dataset.typed = false;
						if (keyDataset.typed) dataset.value[keyDataset.value] = valueDataset.value;
					}
				} else _addIssue(this, "type", dataset, config$1);
				return dataset;
			}
		};
	}
	/* @__NO_SIDE_EFFECTS__ */
	function string(message$1) {
		return {
			kind: "schema",
			type: "string",
			reference: string,
			expects: "string",
			async: false,
			message: message$1,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			},
			"~run"(dataset, config$1) {
				if (typeof dataset.value === "string") dataset.typed = true;
				else _addIssue(this, "type", dataset, config$1);
				return dataset;
			}
		};
	}
	/**
	* Returns the sub issues of the provided datasets for the union issue.
	*
	* @param datasets The datasets.
	*
	* @returns The sub issues.
	*
	* @internal
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function _subIssues(datasets) {
		let issues;
		if (datasets) for (const dataset of datasets) if (issues) issues.push(...dataset.issues);
		else issues = dataset.issues;
		return issues;
	}
	/* @__NO_SIDE_EFFECTS__ */
	function union(options, message$1) {
		return {
			kind: "schema",
			type: "union",
			reference: union,
			expects: /* @__PURE__ */ _joinExpects(options.map((option) => option.expects), "|"),
			async: false,
			options,
			message: message$1,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			},
			"~run"(dataset, config$1) {
				let validDataset;
				let typedDatasets;
				let untypedDatasets;
				for (const schema of this.options) {
					const optionDataset = schema["~run"]({ value: dataset.value }, config$1);
					if (optionDataset.typed) if (optionDataset.issues) if (typedDatasets) typedDatasets.push(optionDataset);
					else typedDatasets = [optionDataset];
					else {
						validDataset = optionDataset;
						break;
					}
					else if (untypedDatasets) untypedDatasets.push(optionDataset);
					else untypedDatasets = [optionDataset];
				}
				if (validDataset) return validDataset;
				if (typedDatasets) {
					if (typedDatasets.length === 1) return typedDatasets[0];
					_addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(typedDatasets) });
					dataset.typed = true;
				} else if ((untypedDatasets === null || untypedDatasets === void 0 ? void 0 : untypedDatasets.length) === 1) return untypedDatasets[0];
				else _addIssue(this, "type", dataset, config$1, { issues: /* @__PURE__ */ _subIssues(untypedDatasets) });
				return dataset;
			}
		};
	}
	/**
	* Creates a unknown schema.
	*
	* @returns A unknown schema.
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function unknown() {
		return {
			kind: "schema",
			type: "unknown",
			reference: unknown,
			expects: "unknown",
			async: false,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			},
			"~run"(dataset) {
				dataset.typed = true;
				return dataset;
			}
		};
	}
	/**
	* Creates a modified copy of an object schema that does not contain the
	* selected entries.
	*
	* @param schema The schema to omit from.
	* @param keys The selected entries.
	*
	* @returns An object schema.
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function omit(schema, keys) {
		const entries$1 = _objectSpread2({}, schema.entries);
		for (const key of keys) delete entries$1[key];
		return _objectSpread2(_objectSpread2({}, schema), {}, {
			entries: entries$1,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			}
		});
	}
	/**
	* Parses an unknown input based on a schema.
	*
	* @param schema The schema to be used.
	* @param input The input to be parsed.
	* @param config The parse configuration.
	*
	* @returns The parsed input.
	*/
	function parse(schema, input, config$1) {
		const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
		if (dataset.issues) throw new ValiError(dataset.issues);
		return dataset.value;
	}
	/* @__NO_SIDE_EFFECTS__ */
	function pipe(...pipe$1) {
		return _objectSpread2(_objectSpread2({}, pipe$1[0]), {}, {
			pipe: pipe$1,
			get "~standard"() {
				return /* @__PURE__ */ _getStandardProps(this);
			},
			"~run"(dataset, config$1) {
				for (const item of pipe$1) if (item.kind !== "metadata") {
					if (dataset.issues && (item.kind === "schema" || item.kind === "transformation")) {
						dataset.typed = false;
						break;
					}
					if (!dataset.issues || !config$1.abortEarly && !config$1.abortPipeEarly) dataset = item["~run"](dataset, config$1);
				}
				return dataset;
			}
		});
	}
	/**
	* Parses an unknown input based on a schema.
	*
	* @param schema The schema to be used.
	* @param input The input to be parsed.
	* @param config The parse configuration.
	*
	* @returns The parse result.
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function safeParse(schema, input, config$1) {
		const dataset = schema["~run"]({ value: input }, /* @__PURE__ */ getGlobalConfig(config$1));
		return {
			typed: dataset.typed,
			success: !dataset.issues,
			output: dataset.value,
			issues: dataset.issues
		};
	}
	//#endregion
	//#region src/@types/fonts.ts
	const ZHTML5Fonts = /* @__PURE__ */ union([
		/* @__PURE__ */ literal("gothic"),
		/* @__PURE__ */ literal("mincho"),
		/* @__PURE__ */ literal("defont")
	]);
	//#endregion
	//#region src/@types/format.formatted.ts
	const ZFormattedComment = /* @__PURE__ */ object({
		id: /* @__PURE__ */ optional(/* @__PURE__ */ number(), 0),
		vpos: /* @__PURE__ */ optional(/* @__PURE__ */ number(), 0),
		content: /* @__PURE__ */ optional(/* @__PURE__ */ string(), ""),
		date: /* @__PURE__ */ optional(/* @__PURE__ */ number(), 0),
		date_usec: /* @__PURE__ */ optional(/* @__PURE__ */ number(), 0),
		owner: /* @__PURE__ */ optional(/* @__PURE__ */ boolean(), false),
		premium: /* @__PURE__ */ optional(/* @__PURE__ */ boolean(), false),
		mail: /* @__PURE__ */ optional(/* @__PURE__ */ array(/* @__PURE__ */ string()), []),
		user_id: /* @__PURE__ */ optional(/* @__PURE__ */ number(), 0),
		layer: /* @__PURE__ */ optional(/* @__PURE__ */ number(), -1),
		is_my_post: /* @__PURE__ */ optional(/* @__PURE__ */ boolean(), false)
	});
	/**
	* @deprecated
	*/
	const ZFormattedLegacyComment = /* @__PURE__ */ omit(ZFormattedComment, [
		"layer",
		"user_id",
		"is_my_post"
	]);
	//#endregion
	//#region src/@types/format.legacy.ts
	const ZApiChat = /* @__PURE__ */ object({
		thread: /* @__PURE__ */ optional(/* @__PURE__ */ string(), ""),
		no: /* @__PURE__ */ optional(/* @__PURE__ */ number(), 0),
		vpos: /* @__PURE__ */ number(),
		date: /* @__PURE__ */ optional(/* @__PURE__ */ number(), 0),
		date_usec: /* @__PURE__ */ optional(/* @__PURE__ */ number(), 0),
		nicoru: /* @__PURE__ */ optional(/* @__PURE__ */ number(), 0),
		premium: /* @__PURE__ */ optional(/* @__PURE__ */ number(), 0),
		anonymity: /* @__PURE__ */ optional(/* @__PURE__ */ number(), 0),
		user_id: /* @__PURE__ */ optional(/* @__PURE__ */ string(), ""),
		mail: /* @__PURE__ */ optional(/* @__PURE__ */ string(), ""),
		content: /* @__PURE__ */ string(),
		deleted: /* @__PURE__ */ optional(/* @__PURE__ */ number(), 0)
	});
	const ZRawApiResponse = /* @__PURE__ */ union([/* @__PURE__ */ object({ chat: ZApiChat }), /* @__PURE__ */ record(/* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ notValue("chat")), /* @__PURE__ */ unknown())]);
	/**
	* @deprecated
	*/
	const ZApiPing = /* @__PURE__ */ object({ content: /* @__PURE__ */ string() });
	/**
	* @deprecated
	*/
	const ZApiThread = /* @__PURE__ */ object({
		resultcode: /* @__PURE__ */ number(),
		thread: /* @__PURE__ */ string(),
		server_time: /* @__PURE__ */ number(),
		ticket: /* @__PURE__ */ string(),
		revision: /* @__PURE__ */ number()
	});
	/**
	* @deprecated
	*/
	const ZApiLeaf = /* @__PURE__ */ object({
		thread: /* @__PURE__ */ string(),
		count: /* @__PURE__ */ number()
	});
	/**
	* @deprecated
	*/
	const ZApiGlobalNumRes = /* @__PURE__ */ object({
		thread: /* @__PURE__ */ string(),
		num_res: /* @__PURE__ */ number()
	});
	//#endregion
	//#region src/@types/format.owner.ts
	const ZOwnerComment = /* @__PURE__ */ object({
		time: /* @__PURE__ */ string(),
		command: /* @__PURE__ */ string(),
		comment: /* @__PURE__ */ string()
	});
	//#endregion
	//#region src/@types/format.v1.ts
	const ZV1Comment = /* @__PURE__ */ object({
		id: /* @__PURE__ */ string(),
		no: /* @__PURE__ */ number(),
		vposMs: /* @__PURE__ */ number(),
		body: /* @__PURE__ */ string(),
		commands: /* @__PURE__ */ array(/* @__PURE__ */ string()),
		userId: /* @__PURE__ */ string(),
		isPremium: /* @__PURE__ */ boolean(),
		score: /* @__PURE__ */ number(),
		postedAt: /* @__PURE__ */ string(),
		nicoruCount: /* @__PURE__ */ number(),
		nicoruId: /* @__PURE__ */ nullable(/* @__PURE__ */ string()),
		source: /* @__PURE__ */ string(),
		isMyPost: /* @__PURE__ */ boolean()
	});
	const ZV1Thread = /* @__PURE__ */ object({
		id: /* @__PURE__ */ unknown(),
		fork: /* @__PURE__ */ string(),
		commentCount: /* @__PURE__ */ optional(/* @__PURE__ */ number(), 0),
		comments: /* @__PURE__ */ array(ZV1Comment)
	});
	//#endregion
	//#region src/@types/format.xml2js.ts
	const ZXml2jsChatItem = /* @__PURE__ */ object({
		_: /* @__PURE__ */ string(),
		$: /* @__PURE__ */ object({
			no: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
			vpos: /* @__PURE__ */ string(),
			date: /* @__PURE__ */ optional(/* @__PURE__ */ string(), "0"),
			date_usec: /* @__PURE__ */ optional(/* @__PURE__ */ string(), "0"),
			user_id: /* @__PURE__ */ optional(/* @__PURE__ */ string()),
			owner: /* @__PURE__ */ optional(/* @__PURE__ */ string(), ""),
			premium: /* @__PURE__ */ optional(/* @__PURE__ */ string(), ""),
			mail: /* @__PURE__ */ optional(/* @__PURE__ */ string(), "")
		})
	});
	const ZXml2jsChat = /* @__PURE__ */ object({ chat: /* @__PURE__ */ array(ZXml2jsChatItem) });
	const ZXml2jsPacket = /* @__PURE__ */ object({ packet: ZXml2jsChat });
	//#endregion
	//#region src/@types/options.ts
	const ZInputFormatType = /* @__PURE__ */ union([
		/* @__PURE__ */ literal("XMLDocument"),
		/* @__PURE__ */ literal("niconicome"),
		/* @__PURE__ */ literal("xml2js"),
		/* @__PURE__ */ literal("formatted"),
		/* @__PURE__ */ literal("legacy"),
		/* @__PURE__ */ literal("legacyOwner"),
		/* @__PURE__ */ literal("owner"),
		/* @__PURE__ */ literal("v1"),
		/* @__PURE__ */ literal("empty"),
		/* @__PURE__ */ literal("default")
	]);
	//#endregion
	//#region src/@types/types.ts
	const ZCommentFont = /* @__PURE__ */ union([
		/* @__PURE__ */ literal("defont"),
		/* @__PURE__ */ literal("mincho"),
		/* @__PURE__ */ literal("gothic"),
		/* @__PURE__ */ literal("gulim"),
		/* @__PURE__ */ literal("simsun")
	]);
	const ZCommentFlashFont = /* @__PURE__ */ union([
		/* @__PURE__ */ literal("defont"),
		/* @__PURE__ */ literal("gulim"),
		/* @__PURE__ */ literal("simsun")
	]);
	const ZCommentContentItemSpacer = /* @__PURE__ */ object({
		type: /* @__PURE__ */ literal("spacer"),
		char: /* @__PURE__ */ string(),
		charWidth: /* @__PURE__ */ number(),
		isButton: /* @__PURE__ */ optional(/* @__PURE__ */ boolean()),
		font: /* @__PURE__ */ optional(ZCommentFlashFont),
		count: /* @__PURE__ */ number()
	});
	const ZCommentContentItem = /* @__PURE__ */ union([ZCommentContentItemSpacer, /* @__PURE__ */ object({
		type: /* @__PURE__ */ literal("text"),
		content: /* @__PURE__ */ string(),
		slicedContent: /* @__PURE__ */ array(/* @__PURE__ */ string()),
		isButton: /* @__PURE__ */ optional(/* @__PURE__ */ boolean()),
		font: /* @__PURE__ */ optional(ZCommentFlashFont),
		width: /* @__PURE__ */ optional(/* @__PURE__ */ array(/* @__PURE__ */ number()))
	})]);
	const ZCommentMeasuredContentItem = /* @__PURE__ */ union([/* @__PURE__ */ intersect([ZCommentContentItem, /* @__PURE__ */ object({ width: /* @__PURE__ */ array(/* @__PURE__ */ number()) })]), ZCommentContentItemSpacer]);
	const ZCommentSize = /* @__PURE__ */ union([
		/* @__PURE__ */ literal("big"),
		/* @__PURE__ */ literal("medium"),
		/* @__PURE__ */ literal("small")
	]);
	const ZCommentLoc = /* @__PURE__ */ union([
		/* @__PURE__ */ literal("ue"),
		/* @__PURE__ */ literal("naka"),
		/* @__PURE__ */ literal("shita")
	]);
	const ZNicoScriptReverseTarget = /* @__PURE__ */ union([
		/* @__PURE__ */ literal("コメ"),
		/* @__PURE__ */ literal("投コメ"),
		/* @__PURE__ */ literal("全")
	]);
	const ZNicoScriptReplaceRange = /* @__PURE__ */ union([/* @__PURE__ */ literal("単"), /* @__PURE__ */ literal("全")]);
	const ZNicoScriptReplaceTarget = /* @__PURE__ */ union([
		/* @__PURE__ */ literal("コメ"),
		/* @__PURE__ */ literal("投コメ"),
		/* @__PURE__ */ literal("全"),
		/* @__PURE__ */ literal("含まない"),
		/* @__PURE__ */ literal("含む")
	]);
	const ZNicoScriptReplaceCondition = /* @__PURE__ */ union([/* @__PURE__ */ literal("部分一致"), /* @__PURE__ */ literal("完全一致")]);
	const ZMeasureInput = /* @__PURE__ */ object({
		font: ZCommentFont,
		content: /* @__PURE__ */ array(ZCommentContentItem),
		lineHeight: /* @__PURE__ */ number(),
		charSize: /* @__PURE__ */ number(),
		lineCount: /* @__PURE__ */ number()
	});
	//#endregion
	//#region src/definition/colors.ts
	var colors_exports = /* @__PURE__ */ __exportAll({ colors: () => colors });
	/**
	* ニコニコ動画上の色コマンドとカラーコードの対応
	*/
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
		black2: "#666666"
	};
	//#endregion
	//#region src/typeGuard.ts
	var typeGuard_exports = /* @__PURE__ */ __exportAll({ default: () => typeGuard });
	/**
	* 入力がBooleanかどうかを返す
	* @param i 入力
	* @returns 入力がBooleanかどうか
	*/
	const isBoolean = (i) => typeof i === "boolean";
	/**
	* 入力がNumberかどうかを返す
	* @param i 入力
	* @returns 入力がNumberかどうか
	*/
	const isNumber = (i) => typeof i === "number";
	/**
	* 入力がObjectかどうかを返す
	* @param i 入力
	* @returns 入力がObjectかどうか
	*/
	const isObject = (i) => typeof i === "object";
	const typeGuard = {
		formatted: {
			comment: (i) => /* @__PURE__ */ is(ZFormattedComment, i),
			comments: (i) => /* @__PURE__ */ is(/* @__PURE__ */ array(ZFormattedComment), i),
			legacyComment: (i) => /* @__PURE__ */ is(ZFormattedLegacyComment, i),
			legacyComments: (i) => /* @__PURE__ */ is(/* @__PURE__ */ array(ZFormattedLegacyComment), i)
		},
		legacy: {
			rawApiResponses: (i) => /* @__PURE__ */ is(/* @__PURE__ */ array(ZRawApiResponse), i),
			apiChat: (i) => /* @__PURE__ */ is(ZApiChat, i),
			apiGlobalNumRes: (i) => /* @__PURE__ */ is(ZApiGlobalNumRes, i),
			apiLeaf: (i) => /* @__PURE__ */ is(ZApiLeaf, i),
			apiPing: (i) => /* @__PURE__ */ is(ZApiPing, i),
			apiThread: (i) => /* @__PURE__ */ is(ZApiThread, i)
		},
		xmlDocument: (i) => {
			if (!i.documentElement || i.documentElement.nodeName !== "packet") return false;
			if (!i.documentElement.children) return false;
			for (const element of Array.from(i.documentElement.children)) {
				if (!element || element.nodeName !== "chat") continue;
				if (!typeAttributeVerify(element, ["vpos", "date"])) return false;
			}
			return true;
		},
		xml2js: {
			packet: (i) => /* @__PURE__ */ is(ZXml2jsPacket, i),
			chat: (i) => /* @__PURE__ */ is(ZXml2jsChat, i),
			chatItem: (i) => /* @__PURE__ */ is(ZXml2jsChatItem, i)
		},
		legacyOwner: { comments: (i) => /* @__PURE__ */ is(/* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ check((i) => {
			const lists = i.split(/\r\n|\r|\n/);
			for (const list of lists) if (list.split(":").length < 3) return false;
			return true;
		})), i) },
		owner: {
			comment: (i) => /* @__PURE__ */ is(ZOwnerComment, i),
			comments: (i) => /* @__PURE__ */ is(/* @__PURE__ */ array(ZOwnerComment), i)
		},
		v1: {
			comment: (i) => /* @__PURE__ */ is(ZV1Comment, i),
			comments: (i) => /* @__PURE__ */ is(/* @__PURE__ */ array(ZV1Comment), i),
			thread: (i) => /* @__PURE__ */ is(ZV1Thread, i),
			threads: (i) => /* @__PURE__ */ is(/* @__PURE__ */ array(ZV1Thread), i)
		},
		nicoScript: {
			range: { target: (i) => /* @__PURE__ */ is(ZNicoScriptReverseTarget, i) },
			replace: {
				range: (i) => /* @__PURE__ */ is(ZNicoScriptReplaceRange, i),
				target: (i) => /* @__PURE__ */ is(ZNicoScriptReplaceTarget, i),
				condition: (i) => /* @__PURE__ */ is(ZNicoScriptReplaceCondition, i)
			}
		},
		comment: {
			font: (i) => /* @__PURE__ */ is(ZCommentFont, i),
			loc: (i) => /* @__PURE__ */ is(ZCommentLoc, i),
			size: (i) => /* @__PURE__ */ is(ZCommentSize, i),
			command: { key: (i) => /* @__PURE__ */ is(/* @__PURE__ */ union([
				/* @__PURE__ */ literal("full"),
				/* @__PURE__ */ literal("ender"),
				/* @__PURE__ */ literal("_live"),
				/* @__PURE__ */ literal("invisible")
			]), i) },
			color: (i) => /* @__PURE__ */ is(/* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ check((i) => Object.keys(colors).includes(i))), i),
			colorCode: (i) => /* @__PURE__ */ is(/* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6})$/)), i),
			colorCodeAllowAlpha: (i) => /* @__PURE__ */ is(/* @__PURE__ */ pipe(/* @__PURE__ */ string(), /* @__PURE__ */ regex(/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/)), i)
		},
		config: { initOptions: (item) => {
			if (typeof item !== "object" || !item) return false;
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
				format: (i) => /* @__PURE__ */ is(ZInputFormatType, i),
				video: (i) => /* @__PURE__ */ is(/* @__PURE__ */ optional(/* @__PURE__ */ instance(HTMLVideoElement)), i)
			};
			for (const key of Object.keys(keys)) if (item[key] !== void 0 && !keys[key](item[key])) {
				console.warn(`[Incorrect input] var: initOptions, key: ${key}, value: ${item[key]}`);
				return false;
			}
			return true;
		} },
		internal: {
			CommentMeasuredContentItem: (i) => /* @__PURE__ */ is(ZCommentMeasuredContentItem, i),
			CommentMeasuredContentItemArray: (i) => /* @__PURE__ */ is(/* @__PURE__ */ array(ZCommentMeasuredContentItem), i),
			MultiConfigItem: (i) => typeof i === "object" && objectVerify(i, ["html5", "flash"]),
			HTML5Fonts: (i) => /* @__PURE__ */ is(ZHTML5Fonts, i),
			MeasureInput: (i) => /* @__PURE__ */ is(ZMeasureInput, i)
		}
	};
	/**
	* オブジェクトのプロパティを確認する
	* @param item 確認するオブジェクト
	* @param keys 確認するプロパティ
	* @returns 要求したプロパティが全て存在するかどうか
	*/
	const objectVerify = (item, keys) => {
		if (typeof item !== "object" || !item) return false;
		for (const key of keys) if (!Object.hasOwn(item, key)) return false;
		return true;
	};
	/**
	* Elementのプロパティを確認する
	* @param item 確認するElement
	* @param keys 確認するプロパティ
	* @returns 要求したプロパティが全て存在するかどうか
	*/
	const typeAttributeVerify = (item, keys) => {
		if (typeof item !== "object" || !item) return false;
		for (const key of keys) if (item.getAttribute(key) === null) return false;
		return true;
	};
	//#endregion
	//#region src/utils/config.ts
	/**
	* Configがhtml5とflashで別れてる場合は対応するものを、そうでなければ初期値を返す
	* @template T
	* @param input コンフィグアイテム
	* @param isFlash Flashかどうか
	* @returns コンフィグアイテムの値
	*/
	const getConfig = (input, isFlash = false) => {
		if (typeGuard.internal.MultiConfigItem(input)) return input[isFlash ? "flash" : "html5"];
		return input;
	};
	//#endregion
	//#region src/utils/comment.ts
	const RE_QUOTE_START = /^["'\u300c]$/;
	const RE_QUOTE_END = /^["']$/;
	const RE_WHITESPACE = /^\s+$/;
	const RE_NICOSCRIPT = /^[@\uff20](\S+)(?:\s(.+))?/;
	const RE_REVERSE = /^[@\uff20]\u9006(?:\s+)?(\u5168|\u30b3\u30e1|\u6295\u30b3\u30e1)?/;
	const RE_JUMP = /\s*((?:sm|so|nm|\uff53\uff4d|\uff53\uff4f|\uff4e\uff4d)?[1-9\uff11-\uff19][0-9\uff11-\uff19]*|#[0-9]+:[0-9]+(?:\.[0-9]+)?)\s+(.*)/;
	const RE_BUTTON_CONTENT = /* @__PURE__ */ new RegExp("^(?:(?<before>.*?)\\[)?(?<body>.*?)(?:\\](?<after>[^\\]]*?))?$", "su");
	const RE_LONG = /^[@\uff20]([0-9.]+)/;
	const RE_STROKE = /^nico:stroke:(.+)$/;
	const RE_WAKU = /^nico:waku:(.+)$/;
	const RE_FILL = /^nico:fill:(.+)$/;
	const RE_OPACITY = /^nico:opacity:(.+)$/;
	const RE_COLOR_CODE = /^#(?:[0-9a-z]{3}|[0-9a-z]{6})$/;
	const ACTIVE_CACHE_MAX_SIZE = 4096;
	const reverseActiveOwnerCache = /* @__PURE__ */ new Map();
	const reverseActiveViewerCache = /* @__PURE__ */ new Map();
	const banActiveCache = /* @__PURE__ */ new Map();
	const resetRangePointers = () => {
		reverseActiveOwnerCache.clear();
		reverseActiveViewerCache.clear();
		banActiveCache.clear();
	};
	const setCachedActiveState = (cache, vpos, result) => {
		if (cache.size >= ACTIVE_CACHE_MAX_SIZE) {
			const oldestKey = cache.keys().next().value;
			if (oldestKey !== void 0) cache.delete(oldestKey);
		}
		cache.set(vpos, result);
	};
	/**
	* 改行リサイズが発生するか
	* @param comment 判定対象のコメント
	* @returns 改行リサイズが発生するか
	*/
	const isLineBreakResize = (comment) => {
		return !comment.resized && !comment.ender && comment.lineCount >= config.lineBreakCount[comment.size];
	};
	/**
	* コメントの初期設定を取得する
	* @param vpos 現在のvpos
	* @returns コメントの初期設定
	*/
	const getDefaultCommand = (vpos) => {
		{
			let writeIdx = 0;
			for (let i = 0; i < nicoScripts.default.length; i++) {
				const item = nicoScripts.default[i];
				if (!item) continue;
				if (item.long === void 0 || item.start + item.long >= vpos) nicoScripts.default[writeIdx++] = item;
			}
			nicoScripts.default.length = writeIdx;
		}
		let color;
		let size;
		let font;
		let loc;
		for (const item of nicoScripts.default) {
			if (item.loc) loc = item.loc;
			if (item.color) color = item.color;
			if (item.size) size = item.size;
			if (item.font) font = item.font;
			if (loc && color && size && font) break;
		}
		return {
			color,
			size,
			font,
			loc
		};
	};
	/**
	* コメントが@置換の処理対象かどうかを判定する
	* @param comment 判定対象のコメント
	* @param item @置換
	* @returns コメントが@置換の処理対象かどうか
	*/
	const nicoscriptReplaceIgnoreable = (comment, item) => (item.target === "コメ" || item.target === "含まない") && comment.owner || item.target === "投コメ" && !comment.owner || item.target === "含まない" && comment.owner || item.condition === "完全一致" && comment.content !== item.keyword || item.condition === "部分一致" && comment.content.indexOf(item.keyword) === -1;
	/**
	* 置換コマンドを適用する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	*/
	const applyNicoScriptReplace = (comment, commands) => {
		{
			let writeIdx = 0;
			for (let i = 0; i < nicoScripts.replace.length; i++) {
				const item = nicoScripts.replace[i];
				if (!item) continue;
				if (item.long === void 0 || item.start + item.long >= comment.vpos) nicoScripts.replace[writeIdx++] = item;
			}
			nicoScripts.replace.length = writeIdx;
		}
		for (const item of nicoScripts.replace) {
			if (nicoscriptReplaceIgnoreable(comment, item)) continue;
			if (item.range === "単") comment.content = comment.content.replaceAll(item.keyword, item.replace);
			else comment.content = item.replace;
			if (item.loc) commands.loc = item.loc;
			if (item.color) commands.color = item.color;
			if (item.size) commands.size = item.size;
			if (item.font) commands.font = item.font;
		}
	};
	/**
	* コメントのコマンドとニコスクリプトをパースする
	* @param comment 対象のコメント
	* @returns パース後のコメント
	*/
	const parseCommandAndNicoScript = (comment) => {
		var _ref, _commands$size, _ref2, _commands$loc, _ref3, _commands$color, _ref4, _commands$font;
		const isFlash = isFlashComment(comment);
		const commands = parseCommands(comment);
		processNicoscript(comment, commands);
		const defaultCommand = getDefaultCommand(comment.vpos);
		applyNicoScriptReplace(comment, commands);
		const size = (_ref = (_commands$size = commands.size) !== null && _commands$size !== void 0 ? _commands$size : defaultCommand.size) !== null && _ref !== void 0 ? _ref : "medium";
		return {
			size,
			loc: (_ref2 = (_commands$loc = commands.loc) !== null && _commands$loc !== void 0 ? _commands$loc : defaultCommand.loc) !== null && _ref2 !== void 0 ? _ref2 : "naka",
			color: (_ref3 = (_commands$color = commands.color) !== null && _commands$color !== void 0 ? _commands$color : defaultCommand.color) !== null && _ref3 !== void 0 ? _ref3 : "#FFFFFF",
			font: (_ref4 = (_commands$font = commands.font) !== null && _commands$font !== void 0 ? _commands$font : defaultCommand.font) !== null && _ref4 !== void 0 ? _ref4 : "defont",
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
			button: commands.button
		};
	};
	/**
	* 文字列のブラケットをパースする
	* @param input 入力文字列
	* @returns パース後の文字列
	*/
	const parseBrackets = (input) => {
		const content = input.split("");
		const result = [];
		let quote = "";
		let lastChar = "";
		let string = "";
		for (const i of content) {
			if (RE_QUOTE_START.test(i) && quote === "") quote = i;
			else if (RE_QUOTE_END.test(i) && quote === i && lastChar !== "\\") {
				result.push(string.replaceAll("\\n", "\n"));
				quote = "";
				string = "";
			} else if (i === "」" && quote === "「") {
				result.push(string);
				quote = "";
				string = "";
			} else if (quote === "" && RE_WHITESPACE.test(i)) {
				if (string) {
					result.push(string);
					string = "";
				}
			} else string += i;
			lastChar = i;
		}
		result.push(string);
		return result;
	};
	/**
	* 置換コマンドを追加する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	*/
	const addNicoscriptReplace = (comment, commands) => {
		var _result$, _result$2, _result$3, _result$4;
		const result = parseBrackets(comment.content.slice(4));
		if (result[0] === void 0 || result[2] !== void 0 && !typeGuard.nicoScript.replace.range(result[2]) || result[3] !== void 0 && !typeGuard.nicoScript.replace.target(result[3]) || result[4] !== void 0 && !typeGuard.nicoScript.replace.condition(result[4])) return;
		nicoScripts.replace.unshift({
			start: comment.vpos,
			long: commands.long === void 0 ? void 0 : Math.floor(commands.long * 100),
			keyword: result[0],
			replace: (_result$ = result[1]) !== null && _result$ !== void 0 ? _result$ : "",
			range: (_result$2 = result[2]) !== null && _result$2 !== void 0 ? _result$2 : "単",
			target: (_result$3 = result[3]) !== null && _result$3 !== void 0 ? _result$3 : "コメ",
			condition: (_result$4 = result[4]) !== null && _result$4 !== void 0 ? _result$4 : "部分一致",
			color: commands.color,
			size: commands.size,
			font: commands.font,
			loc: commands.loc,
			no: comment.id
		});
		sortNicoscriptReplace();
	};
	/**
	* 置換コマンドをvpos順にソートする
	*/
	const sortNicoscriptReplace = () => {
		nicoScripts.replace.sort((a, b) => {
			if (a.start < b.start) return -1;
			if (a.start > b.start) return 1;
			if (a.no < b.no) return -1;
			if (a.no > b.no) return 1;
			return 0;
		});
	};
	/**
	* ニコスクリプトを処理する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	*/
	const processNicoscript = (comment, commands) => {
		const nicoscript = RE_NICOSCRIPT.exec(comment.content);
		if (!nicoscript) return;
		if (nicoscript[1] === "ボタン" && nicoscript[2]) {
			processAtButton(comment, commands);
			return;
		}
		if (!comment.owner) return;
		commands.invisible = true;
		if (nicoscript[1] === "デフォルト") {
			processDefaultScript(comment, commands);
			return;
		}
		if (nicoscript[1] === "逆") {
			processReverseScript(comment, commands);
			return;
		}
		if (nicoscript[1] === "コメント禁止") {
			processBanScript(comment, commands);
			return;
		}
		if (nicoscript[1] === "シーク禁止") {
			processSeekDisableScript$1(comment, commands);
			return;
		}
		if (nicoscript[1] === "ジャンプ" && nicoscript[2]) {
			processJumpScript$1(comment, commands, nicoscript[2]);
			return;
		}
		if (nicoscript[1] === "置換") addNicoscriptReplace(comment, commands);
	};
	/**
	* デフォルトコマンドを処理する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	*/
	const processDefaultScript = (comment, commands) => {
		nicoScripts.default.unshift({
			start: comment.vpos,
			long: commands.long === void 0 ? void 0 : Math.floor(commands.long * 100),
			color: commands.color,
			size: commands.size,
			font: commands.font,
			loc: commands.loc
		});
	};
	/**
	* 逆コマンドを処理する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	*/
	const processReverseScript = (comment, commands) => {
		const reverse = RE_REVERSE.exec(comment.content);
		const target = typeGuard.nicoScript.range.target(reverse === null || reverse === void 0 ? void 0 : reverse[1]) ? reverse === null || reverse === void 0 ? void 0 : reverse[1] : "全";
		if (commands.long === void 0) commands.long = 30;
		nicoScripts.reverse.unshift({
			start: comment.vpos,
			end: comment.vpos + commands.long * 100,
			target
		});
		reverseActiveOwnerCache.clear();
		reverseActiveViewerCache.clear();
	};
	/**
	* コメント禁止コマンドを処理する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	*/
	const processBanScript = (comment, commands) => {
		if (commands.long === void 0) commands.long = 30;
		nicoScripts.ban.unshift({
			start: comment.vpos,
			end: comment.vpos + commands.long * 100
		});
		banActiveCache.clear();
	};
	/**
	* シーク禁止コマンドを処理する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	*/
	const processSeekDisableScript$1 = (comment, commands) => {
		if (commands.long === void 0) commands.long = 30;
		nicoScripts.seekDisable.unshift({
			start: comment.vpos,
			end: comment.vpos + commands.long * 100
		});
	};
	/**
	* ジャンプコマンドを処理する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	* @param input 対象のコメント本文
	*/
	const processJumpScript$1 = (comment, commands, input) => {
		const options = RE_JUMP.exec(input);
		if (!(options === null || options === void 0 ? void 0 : options[1])) return;
		const end = commands.long === void 0 ? void 0 : commands.long * 100 + comment.vpos;
		nicoScripts.jump.unshift({
			start: comment.vpos,
			end,
			to: options[1],
			message: options[2]
		});
	};
	/**
	* \@ボタンを処理する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	*/
	const processAtButton = (comment, commands) => {
		var _content$groups$befor, _content$groups, _content$groups$body, _content$groups2, _content$groups$after, _content$groups3, _args$, _args$4$split, _args$2, _args$3;
		const args = parseBrackets(comment.content);
		if (args[1] === void 0) return;
		commands.invisible = false;
		const content = RE_BUTTON_CONTENT.exec(args[1]);
		const message = {
			before: (_content$groups$befor = (_content$groups = content.groups) === null || _content$groups === void 0 ? void 0 : _content$groups.before) !== null && _content$groups$befor !== void 0 ? _content$groups$befor : "",
			body: (_content$groups$body = (_content$groups2 = content.groups) === null || _content$groups2 === void 0 ? void 0 : _content$groups2.body) !== null && _content$groups$body !== void 0 ? _content$groups$body : "",
			after: (_content$groups$after = (_content$groups3 = content.groups) === null || _content$groups3 === void 0 ? void 0 : _content$groups3.after) !== null && _content$groups$after !== void 0 ? _content$groups$after : ""
		};
		commands.button = {
			message,
			commentMessage: (_args$ = args[2]) !== null && _args$ !== void 0 ? _args$ : `${message.before}${message.body}${message.after}`,
			commentVisible: args[3] !== "非表示",
			commentMail: (_args$4$split = (_args$2 = args[4]) === null || _args$2 === void 0 ? void 0 : _args$2.split(",")) !== null && _args$4$split !== void 0 ? _args$4$split : [],
			limit: Number((_args$3 = args[5]) !== null && _args$3 !== void 0 ? _args$3 : 1),
			local: comment.mail.includes("local"),
			hidden: comment.mail.includes("hidden")
		};
	};
	/**
	* コマンドをパースする
	* @param comment 対象のコメント
	* @returns パースしたコマンド
	*/
	const parseCommands = (comment) => {
		const commands = comment.mail;
		const isFlash = isFlashComment(comment);
		const result = {
			loc: void 0,
			size: void 0,
			fontSize: void 0,
			color: void 0,
			strokeColor: void 0,
			wakuColor: void 0,
			font: void 0,
			full: false,
			ender: false,
			_live: false,
			invisible: false,
			long: void 0
		};
		for (const command of commands) parseCommand(comment, command, result, isFlash);
		if (comment.content.startsWith("/")) result.invisible = true;
		return result;
	};
	/**
	* コマンドをパースする
	* @param comment 対象のコメント
	* @param _command 対象のコマンド
	* @param result パースしたコマンド
	* @param isFlash Flashコメントかどうか
	*/
	const parseCommand = (comment, _command, result, isFlash) => {
		const command = _command.toLowerCase();
		const long = RE_LONG.exec(command);
		if (long) {
			result.long = Number(long[1]);
			return;
		}
		const strokeColor = getColor(RE_STROKE.exec(command));
		if (strokeColor) {
			var _result$strokeColor;
			(_result$strokeColor = result.strokeColor) !== null && _result$strokeColor !== void 0 || (result.strokeColor = strokeColor);
			return;
		}
		const rectColor = getColor(RE_WAKU.exec(command));
		if (rectColor) {
			var _result$wakuColor;
			(_result$wakuColor = result.wakuColor) !== null && _result$wakuColor !== void 0 || (result.wakuColor = rectColor);
			return;
		}
		const fillColor = getColor(RE_FILL.exec(command));
		if (fillColor) {
			var _result$fillColor;
			(_result$fillColor = result.fillColor) !== null && _result$fillColor !== void 0 || (result.fillColor = fillColor);
			return;
		}
		const opacity = getOpacity(RE_OPACITY.exec(command));
		if (typeof opacity === "number") {
			var _result$opacity;
			(_result$opacity = result.opacity) !== null && _result$opacity !== void 0 || (result.opacity = opacity);
			return;
		}
		if (/* @__PURE__ */ is(ZCommentLoc, command)) {
			var _result$loc;
			(_result$loc = result.loc) !== null && _result$loc !== void 0 || (result.loc = command);
			return;
		}
		if (result.size === void 0 && /* @__PURE__ */ is(ZCommentSize, command)) {
			result.size = command;
			result.fontSize = getConfig(config.fontSize, isFlash)[command].default;
			return;
		}
		if (config.colors[command]) {
			var _result$color;
			(_result$color = result.color) !== null && _result$color !== void 0 || (result.color = config.colors[command]);
			return;
		}
		const colorCode = RE_COLOR_CODE.exec(command);
		if (colorCode && comment.premium) {
			var _result$color2;
			(_result$color2 = result.color) !== null && _result$color2 !== void 0 || (result.color = colorCode[0].toUpperCase());
			return;
		}
		if (/* @__PURE__ */ is(ZCommentFont, command)) {
			var _result$font;
			(_result$font = result.font) !== null && _result$font !== void 0 || (result.font = command);
			return;
		}
		if (typeGuard.comment.command.key(command)) result[command] = true;
	};
	/**
	* 正規表現の結果から色を取得する
	* @param match 正規表現の結果
	* @returns 色
	*/
	const getColor = (match) => {
		if (!match) return;
		const value = match[1];
		if (typeGuard.comment.color(value)) return colors[value];
		if (typeGuard.comment.colorCodeAllowAlpha(value)) return value;
	};
	/**
	* 正規表現の結果から透明度を取得する
	* @param match 正規表現の結果
	* @returns 透明度
	*/
	const getOpacity = (match) => {
		if (!match) return;
		const value = Number(match[1]);
		if (!Number.isNaN(value) && value >= 0) return value;
	};
	/**
	* コメントがFlash適用対象化判定返す
	* @param comment コメントデータ
	* @returns Flash適用対象かどうか
	*/
	const isFlashComment = (comment) => options.mode === "flash" || options.mode === "default" && !(comment.mail.includes("gothic") || comment.mail.includes("defont") || comment.mail.includes("mincho")) && (comment.date < config.flashThreshold || comment.mail.includes("nico:flash"));
	/**
	* コメントが逆コマンド適用対象かを返す
	* @param vpos コメントのvpos
	* @param isOwner コメントが投稿者コメントかどうか
	* @returns 逆コマンド適用対象かどうか
	*/
	const isReverseActive = (vpos, isOwner) => {
		const cache = isOwner ? reverseActiveOwnerCache : reverseActiveViewerCache;
		const cached = cache.get(vpos);
		if (cached !== void 0) return cached;
		let result = false;
		for (const range of nicoScripts.reverse) {
			if (range.target === "コメ" && isOwner || range.target === "投コメ" && !isOwner) continue;
			if (range.start < vpos && vpos < range.end) {
				result = true;
				break;
			}
		}
		setCachedActiveState(cache, vpos, result);
		return result;
	};
	/**
	* コメントがコメント禁止コマンド適用対象かを返す
	* @param vpos コメントのvpos
	* @returns コメント禁止コマンド適用対象かどうか
	*/
	const isBanActive = (vpos) => {
		const cached = banActiveCache.get(vpos);
		if (cached !== void 0) return cached;
		let result = false;
		for (const range of nicoScripts.ban) if (range.start < vpos && vpos < range.end) {
			result = true;
			break;
		}
		setCachedActiveState(banActiveCache, vpos, result);
		return result;
	};
	/**
	* 固定コメントを処理する
	* @param comment 固定コメント
	* @param collision コメントの衝突判定用配列
	* @param timeline コメントのタイムライン
	* @param lazy Y座標の計算を遅延させるか
	*/
	const processFixedComment = (comment, collision, timeline, lazy = false) => {
		const commentVpos = comment.vpos;
		const commentLong = comment.long;
		const collisionEnd = Math.max(commentLong - 20, 0);
		const posY = lazy ? -1 : getFixedPosY(comment, collision);
		for (let j = 0; j < commentLong; j++) {
			var _timeline$vpos;
			const vpos = commentVpos + j;
			if ((_timeline$vpos = timeline[vpos]) === null || _timeline$vpos === void 0 ? void 0 : _timeline$vpos.includes(comment)) continue;
			arrayPush(timeline, vpos, comment);
			if (j <= collisionEnd) arrayPush(collision, vpos, comment);
		}
		comment.posY = posY;
	};
	/**
	* nakaコメントを処理する
	* @param comment nakaコメント
	* @param collision コメントの衝突判定用配列
	* @param timeline コメントのタイムライン
	* @param lazy Y座標の計算を遅延させるか
	*/
	const processMovableComment = (comment, collision, timeline, lazy = false) => {
		const commentWidth = comment.width;
		const commentLong = comment.long;
		const commentVpos = comment.vpos;
		const speed = (config.commentDrawRange + commentWidth * config.nakaCommentSpeedOffset) / (commentLong + 100);
		const drawPadding = config.commentDrawPadding;
		const drawRange = config.commentDrawRange;
		const collisionPadding = config.collisionPadding;
		const collisionRight = config.collisionRange.right;
		const collisionLeft = config.collisionRange.left;
		const beforeVpos = Math.round(-288 / ((1632 + commentWidth) / (commentLong + 125))) - 100;
		const posY = lazy ? -1 : getMovablePosY(comment, collision, beforeVpos, speed);
		const n = commentLong + 125;
		for (let j = beforeVpos; j < n; j++) {
			var _timeline$vpos2;
			const vpos = commentVpos + j;
			const leftPos = drawPadding + drawRange - (j + 100) * speed;
			if ((_timeline$vpos2 = timeline[vpos]) === null || _timeline$vpos2 === void 0 ? void 0 : _timeline$vpos2.includes(comment)) continue;
			arrayPush(timeline, vpos, comment);
			if (leftPos + commentWidth + collisionPadding >= collisionRight && leftPos <= collisionRight) arrayPush(collision.right, vpos, comment);
			if (leftPos + commentWidth + collisionPadding >= collisionLeft && leftPos <= collisionLeft) arrayPush(collision.left, vpos, comment);
		}
		comment.posY = posY;
	};
	const getFixedPosY = (comment, collision) => {
		const commentLong = comment.long;
		const commentVpos = comment.vpos;
		let posY = 0;
		let isChanged = true;
		let count = 0;
		while (isChanged && count < 10) {
			isChanged = false;
			count++;
			for (let j = 0; j < commentLong; j++) {
				const result = getPosY(posY, comment, collision[commentVpos + j]);
				posY = result.currentPos;
				isChanged || (isChanged = result.isChanged);
				if (result.isBreak) break;
			}
		}
		return posY;
	};
	const getMovablePosY = (comment, collision, beforeVpos, speed = (config.commentDrawRange + comment.width * config.nakaCommentSpeedOffset) / (comment.long + 100)) => {
		const canvasHeight = config.canvasHeight;
		const commentHeight = comment.height;
		if (canvasHeight < commentHeight) return (commentHeight - canvasHeight) / -2;
		const commentWidth = comment.width;
		const commentLong = comment.long;
		const commentVpos = comment.vpos;
		const drawPadding = config.commentDrawPadding;
		const drawRange = config.commentDrawRange;
		const collisionRight = config.collisionRange.right;
		const collisionLeft = config.collisionRange.left;
		const n = commentLong + 125;
		let posY = 0;
		let isChanged = true;
		let count = 0;
		let lastUpdatedIndex;
		while (isChanged && count < 10) {
			isChanged = false;
			count++;
			for (let j = beforeVpos; j < n; j += 5) {
				const vpos = commentVpos + j;
				const leftPos = drawPadding + drawRange - (j + 100) * speed;
				let isBreak = false;
				if (lastUpdatedIndex !== void 0 && lastUpdatedIndex === vpos) return posY;
				if (leftPos + commentWidth >= collisionRight && leftPos <= collisionRight) {
					const result = getPosY(posY, comment, collision.right[vpos]);
					posY = result.currentPos;
					isChanged || (isChanged = result.isChanged);
					if (result.isChanged) lastUpdatedIndex = vpos;
					isBreak || (isBreak = result.isBreak);
				}
				if (leftPos + commentWidth >= collisionLeft && leftPos <= collisionLeft) {
					const result = getPosY(posY, comment, collision.left[vpos]);
					posY = result.currentPos;
					isChanged || (isChanged = result.isChanged);
					if (result.isChanged) lastUpdatedIndex = vpos;
					isBreak || (isBreak = result.isBreak);
				}
				if (isBreak) return posY;
			}
		}
		return posY;
	};
	/**
	* 当たり判定からコメントを配置できる場所を探す
	* @param _currentPos 現在のy座標
	* @param targetComment 対象コメント
	* @param collision 当たり判定
	* @returns 現在地、更新されたか、終了すべきか
	*/
	const getPosY = (_currentPos, targetComment, collision) => {
		if (!collision) return {
			currentPos: _currentPos,
			isChanged: false,
			isBreak: false
		};
		let currentPos = _currentPos;
		let isChanged = false;
		const targetIndex = targetComment.index;
		const targetOwner = targetComment.owner;
		const targetLayer = targetComment.layer;
		const targetHeight = targetComment.height;
		const canvasHeight = config.canvasHeight;
		const len = collision.length;
		restart: while (true) {
			for (let i = 0; i < len; i++) {
				const item = collision[i];
				if (item.index === targetIndex || item.posY < 0) continue;
				if (item.owner === targetOwner && item.layer === targetLayer && currentPos < item.posY + item.height && currentPos + targetHeight > item.posY) {
					currentPos = item.posY + item.height;
					isChanged = true;
					if (currentPos + targetHeight > canvasHeight) {
						if (canvasHeight < targetHeight) if (targetComment.mail.includes("naka")) currentPos = (targetHeight - canvasHeight) / -2;
						else currentPos = 0;
						else currentPos = Math.floor(Math.random() * (canvasHeight - targetHeight));
						return {
							currentPos,
							isChanged: true,
							isBreak: true
						};
					}
					continue restart;
				}
			}
			break;
		}
		return {
			currentPos,
			isChanged,
			isBreak: false
		};
	};
	/**
	* コメントのvposと現在のvposから左右の位置を返す
	* @param comment コメントデータ
	* @param vpos vpos
	* @param isReverse @逆が有効か
	* @returns x座標
	*/
	const getPosX = (comment, vpos, isReverse = false) => {
		if (comment.loc !== "naka") return (config.canvasWidth - comment.width) / 2;
		const speed = (config.commentDrawRange + comment.width * config.nakaCommentSpeedOffset) / (comment.long + 100);
		const vposLapsed = vpos - comment.vpos;
		const posX = config.commentDrawPadding + config.commentDrawRange - (vposLapsed + 100) * speed;
		if (isReverse) return config.canvasWidth - comment.width - posX;
		return posX;
	};
	/**
	* フォント名とサイズをもとにcontextで使えるフォントを生成する
	* @param font フォント名
	* @param size サイズ
	* @returns contextで使えるフォント
	*/
	const parseFont = (font, size) => {
		switch (font) {
			case "gulim":
			case "simsun": return config.fonts.flash[font].replace("[size]", `${size}`);
			case "gothic":
			case "mincho": return `${config.fonts.html5[font].weight} ${size}px ${config.fonts.html5[font].font}`;
			default: return `${config.fonts.html5.defont.weight} ${size}px ${config.fonts.html5.defont.font}`;
		}
	};
	//#endregion
	//#region src/utils/commentArt.ts
	const RE_CA_FILTER = /@[\d.]+|184|device:.+|patissier|ca/;
	/**
	* CAと思われるコメントのレイヤーを分離する
	* @param rawData コメントデータ
	* @returns レイヤー分離後のコメントデータ
	*/
	const changeCALayer = (rawData) => {
		const userScoreList = getUsersScore(rawData);
		const filteredComments = removeDuplicateCommentArt(rawData);
		updateLayerId(groupCommentsByTime(groupCommentsByUser(filteredComments.filter((comment) => {
			var _userScoreList$commen;
			return ((_userScoreList$commen = userScoreList[comment.user_id]) !== null && _userScoreList$commen !== void 0 ? _userScoreList$commen : 0) >= config.sameCAMinScore && !comment.owner;
		}))));
		return filteredComments;
	};
	/**
	* ユーザーごとのコメントアートスコアを取得する
	* @param comments コメントデータ
	* @returns ユーザーIDごとのスコア
	*/
	const getUsersScore = (comments) => {
		const userScoreList = {};
		for (const comment of comments) {
			var _comment$user_id, _comment$content$matc;
			if (comment.user_id === void 0 || comment.user_id === -1) continue;
			userScoreList[_comment$user_id = comment.user_id] || (userScoreList[_comment$user_id] = 0);
			if (comment.mail.includes("ca") || comment.mail.includes("patissier") || comment.mail.includes("ender") || comment.mail.includes("full")) {
				var _userScoreList$commen2;
				userScoreList[comment.user_id] = ((_userScoreList$commen2 = userScoreList[comment.user_id]) !== null && _userScoreList$commen2 !== void 0 ? _userScoreList$commen2 : 0) + 5;
			}
			const lineCount = ((_comment$content$matc = comment.content.match(/\r\n|\n|\r/g)) !== null && _comment$content$matc !== void 0 ? _comment$content$matc : []).length;
			if (lineCount > 2) {
				var _userScoreList$commen3;
				userScoreList[comment.user_id] = ((_userScoreList$commen3 = userScoreList[comment.user_id]) !== null && _userScoreList$commen3 !== void 0 ? _userScoreList$commen3 : 0) + lineCount / 2;
			}
		}
		return userScoreList;
	};
	/**
	* 重複するコメントアートを削除する
	* @param comments コメントデータ
	* @returns 重複を排除したコメントデータ
	*/
	const removeDuplicateCommentArt = (comments) => {
		const index = {};
		return comments.filter((comment) => {
			const key = `${comment.content}@@${[...comment.mail].sort((a, b) => a.localeCompare(b)).filter((e) => !RE_CA_FILTER.test(e)).join("")}`;
			const lastComment = index[key];
			if (lastComment === void 0) {
				index[key] = comment;
				return true;
			}
			if (comment.vpos - lastComment.vpos > config.sameCAGap || Math.abs(comment.date - lastComment.date) < config.sameCARange) {
				index[key] = comment;
				return true;
			}
			return false;
		});
	};
	/**
	* レイヤーIDを更新する
	* @param filteredComments 更新対象のコメントデータ
	*/
	const updateLayerId = (filteredComments) => {
		let layerId = 0;
		for (const user of filteredComments) for (const time of user.comments) {
			for (const comment of time.comments) comment.layer = layerId;
			layerId++;
		}
	};
	/**
	* ユーザーごとにコメントをグループ化する
	* @param comments コメントデータ
	* @returns ユーザーごとにグループ化したコメントデータ
	*/
	const groupCommentsByUser = (comments) => {
		const userMap = /* @__PURE__ */ new Map();
		for (const comment of comments) {
			let user = userMap.get(comment.user_id);
			if (!user) {
				user = {
					userId: comment.user_id,
					comments: []
				};
				userMap.set(comment.user_id, user);
			}
			user.comments.push(comment);
		}
		return Array.from(userMap.values());
	};
	/**
	* ユーザーごとにグループ化されたコメントを時間ごとにグループ化する
	* @param comments ユーザーごとにグループ化されたコメントデータ
	* @returns 時間ごとにグループ化されたコメントデータ
	*/
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
				}, [])
			});
			return result;
		}, []);
	};
	/**
	* 時間配列から該当の時間の参照を取得する
	* @param time 探す対象の時間
	* @param times 時間配列
	* @returns 該当の時間の参照
	*/
	const getTime = (time, times) => {
		const timeObj = times.find((timeObj) => timeObj.range.start - config.sameCATimestampRange <= time && timeObj.range.end + config.sameCATimestampRange >= time);
		if (timeObj) return timeObj;
		const obj = {
			range: {
				start: time,
				end: time
			},
			comments: []
		};
		times.push(obj);
		return obj;
	};
	//#endregion
	//#region src/utils/sort.ts
	/**
	* 特定のキーを使ってオブジェクトをソートする
	* @param getter ソートするキーを取得する関数
	* @returns ソート用の関数
	*/
	const nativeSort = (getter) => {
		return (a, b) => {
			if (getter(a) > getter(b)) return 1;
			if (getter(a) < getter(b)) return -1;
			return 0;
		};
	};
	//#endregion
	//#region src/utils/flash.ts
	let flashCharRegexConfig = null;
	let flashCharRegex = null;
	const getFlashCharRegex = () => {
		if (flashCharRegex === null || flashCharRegexConfig !== config) {
			flashCharRegexConfig = config;
			flashCharRegex = {
				simsunStrong: new RegExp(config.flashChar.simsunStrong),
				simsunWeak: new RegExp(config.flashChar.simsunWeak),
				gulim: new RegExp(config.flashChar.gulim),
				gothic: new RegExp(config.flashChar.gothic)
			};
		}
		return flashCharRegex;
	};
	/**
	* コメントの内容からフォント情報を取得する
	* @param part コメントの内容
	* @returns フォント情報
	*/
	const getFlashFontIndex = (part) => {
		const regex = getFlashCharRegex();
		const index = [];
		let match = regex.simsunStrong.exec(part);
		if (match !== null) index.push({
			font: "simsunStrong",
			index: match.index
		});
		match = regex.simsunWeak.exec(part);
		if (match !== null) index.push({
			font: "simsunWeak",
			index: match.index
		});
		match = regex.gulim.exec(part);
		if (match !== null) index.push({
			font: "gulim",
			index: match.index
		});
		match = regex.gothic.exec(part);
		if (match !== null) index.push({
			font: "gothic",
			index: match.index
		});
		return index;
	};
	/**
	* フォント名を取得する
	* @param font フォント
	* @returns フォント名
	*/
	const getFlashFontName = (font) => {
		if (font === "simsunStrong" || font === "simsunWeak") return "simsun";
		if (font === "gothic") return "defont";
		return font;
	};
	/**
	* コメントの内容をパースする
	* @param content コメントの内容
	* @returns パースしたコメントの内容
	*/
	const parseContent = (content) => {
		var _content$match;
		const results = [];
		const lines = Array.from((_content$match = content.match(/\n|[^\n]+/g)) !== null && _content$match !== void 0 ? _content$match : []);
		for (const line of lines) {
			const lineContent = parseLine(line);
			const firstContent = lineContent[0];
			const defaultFont = firstContent === null || firstContent === void 0 ? void 0 : firstContent.font;
			if (defaultFont) results.push(...lineContent.map((val) => {
				var _val$font;
				(_val$font = val.font) !== null && _val$font !== void 0 || (val.font = defaultFont);
				if (val.type === "spacer") {
					const spacer = config.compatSpacer.flash[val.char];
					if (!spacer) return val;
					const width = spacer[val.font];
					if (!width) return val;
					val.charWidth = width;
				}
				return val;
			}));
			else results.push(...lineContent);
		}
		return results;
	};
	/**
	* 1行分のコメントの内容をパースする
	* @param line 1行分のコメントの内容
	* @returns パースしたコメントの内容
	*/
	const parseLine = (line) => {
		var _line$match;
		const parts = Array.from((_line$match = line.match(/[ -~｡-ﾟ]+|[^ -~｡-ﾟ]+/g)) !== null && _line$match !== void 0 ? _line$match : []);
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
	/**
	* スペースの補正を行った上で結果を追加する
	* @param lineContent 結果格納用の配列
	* @param part 追加する文字列
	* @param font フォント
	*/
	const addPartToResult = (lineContent, part, font) => {
		if (part === "") return;
		for (const key of Object.keys(config.compatSpacer.flash)) {
			var _config$compatSpacer$;
			const spacerWidth = (_config$compatSpacer$ = config.compatSpacer.flash[key]) === null || _config$compatSpacer$ === void 0 ? void 0 : _config$compatSpacer$[font !== null && font !== void 0 ? font : "defont"];
			if (!spacerWidth) continue;
			const compatIndex = part.indexOf(key);
			if (compatIndex >= 0) {
				addPartToResult(lineContent, part.slice(0, compatIndex), font);
				let i = compatIndex;
				for (; i < part.length && part[i] === key; i++);
				lineContent.push({
					type: "spacer",
					char: key,
					charWidth: spacerWidth,
					font,
					count: i - compatIndex
				});
				addPartToResult(lineContent, part.slice(i), font);
				return;
			}
		}
		lineContent.push({
			type: "text",
			content: part,
			slicedContent: part.split("\n"),
			font
		});
	};
	/**
	* 全角文字の部分をパースする
	* @param part 全角文字の部分
	* @param lineContent 1行分のコメントの内容
	*/
	const parseFullWidthPart = (part, lineContent) => {
		const index = getFlashFontIndex(part);
		if (index.length === 0) addPartToResult(lineContent, part);
		else if (index.length === 1 && index[0]) addPartToResult(lineContent, part, getFlashFontName(index[0].font));
		else parseMultiFontFullWidthPart(part, index, lineContent);
	};
	/**
	* 複数のフォントが含まれる全角文字の部分をパースする
	* @param part 全角文字の部分
	* @param index フォントのインデックス
	* @param lineContent 1行分のコメントの内容
	*/
	const parseMultiFontFullWidthPart = (part, index, lineContent) => {
		index.sort(nativeSort((val) => val.index));
		if (config.flashMode === "xp") {
			let offset = 0;
			for (let i = 1, n = index.length; i < n; i++) {
				const currentVal = index[i];
				const lastVal = index[i - 1];
				if (currentVal === void 0 || lastVal === void 0) continue;
				addPartToResult(lineContent, part.slice(offset, currentVal.index), getFlashFontName(lastVal.font));
				offset = currentVal.index;
			}
			const val = index[index.length - 1];
			if (val) addPartToResult(lineContent, part.slice(offset), getFlashFontName(val.font));
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
	/**
	* コメントのボタンのパーツを取得する
	* @param comment コメント
	* @returns ボタンのデータを追加したコメント
	*/
	const getButtonParts = (comment) => {
		let leftParts;
		const parts = [];
		const atButtonPadding = getConfig(config.atButtonPadding, true);
		const lineOffset = comment.lineOffset;
		const lineHeight = comment.fontSize * comment.lineHeight;
		const offsetKey = comment.resizedY ? "resized" : "default";
		const offsetY = config.flashCommentYPaddingTop[offsetKey] + comment.fontSize * comment.lineHeight * config.flashCommentYOffset[comment.size][offsetKey];
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
				var _item$width$j;
				if (lines[j] === void 0) continue;
				const posY = (lineOffset + lineCount + 1) * lineHeight + offsetY;
				const partWidth = (_item$width$j = item.width[j]) !== null && _item$width$j !== void 0 ? _item$width$j : 0;
				if (comment.button && !comment.button.hidden) {
					if (!isLastButton && item.isButton) {
						leftParts = {
							type: "left",
							left: leftOffset + atButtonPadding,
							top: posY - lineHeight + atButtonPadding,
							width: partWidth + atButtonPadding,
							height: lineHeight
						};
						leftOffset += atButtonPadding * 2;
					} else if (isLastButton && item.isButton) parts.push({
						type: "middle",
						left: leftOffset,
						top: posY - lineHeight + atButtonPadding,
						width: partWidth,
						height: lineHeight
					});
					else if (isLastButton && !item.isButton) {
						if (leftParts) comment.buttonObjects = {
							left: leftParts,
							middle: parts,
							right: {
								type: "right",
								right: leftOffset + atButtonPadding,
								top: posY - lineHeight + atButtonPadding,
								height: lineHeight
							}
						};
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
					height: lineHeight
				}
			};
		}
		return comment;
	};
	/**
	* ボタンからのコメントを作成する
	* @param comment @ボタンのコメント
	* @param vpos コメントのvpos
	* @returns 作成したコメント
	*/
	const buildAtButtonComment = (comment, vpos) => {
		if (!comment.button || comment.button.limit <= 0) return;
		comment.button.limit -= 1;
		const mail = [...comment.button.commentMail, "from_button"];
		if (!comment.button.commentVisible) mail.push("invisible");
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
			is_my_post: true
		};
	};
	//#endregion
	//#region src/errors/TypeGuardError.ts
	/**
	* 型ガードで予期せず弾かれた場合に発生するエラー
	*/
	var TypeGuardError = class extends Error {
		constructor(options = {}) {
			super("Type Guard Error\nAn error occurred due to unexpected values\nPlease contact the developer on GitHub", options);
		}
	};
	TypeGuardError.prototype.name = "TypeGuardError";
	//#endregion
	//#region src/utils/niconico.ts
	/**
	* 各サイズの行高を返す
	* @param fontSize コメントサイズ
	* @param isFlash Flashかどうか
	* @param resized リサイズされているか
	* @returns 行高
	*/
	const getLineHeight = (fontSize, isFlash, resized = false) => {
		const lineCounts = getConfig(config.html5LineCounts, isFlash);
		const commentStageSize = getConfig(config.commentStageSize, isFlash);
		const lineHeight = commentStageSize.height / lineCounts.doubleResized[fontSize];
		const defaultLineCount = lineCounts.default[fontSize];
		if (resized) {
			const resizedLineCount = lineCounts.resized[fontSize];
			return (commentStageSize.height - lineHeight * (defaultLineCount / resizedLineCount)) / (resizedLineCount - 1);
		}
		return (commentStageSize.height - lineHeight) / (defaultLineCount - 1);
	};
	/**
	* 各サイズのフォントサイズを返す
	* @param fontSize コメントサイズ
	* @param isFlash Flashかどうか
	* @returns フォントサイズ
	*/
	const getCharSize = (fontSize, isFlash) => {
		const lineCounts = getConfig(config.html5LineCounts, isFlash);
		return getConfig(config.commentStageSize, isFlash).height / lineCounts.doubleResized[fontSize];
	};
	/**
	* コメントのサイズを計測する
	* @param comment コメント
	* @param renderer 計測対象のレンダラーインスタンス
	* @returns 計測結果
	*/
	const measure = (comment, renderer) => {
		return _objectSpread2(_objectSpread2({}, measureWidth(comment, renderer)), {}, { height: comment.lineHeight * (comment.lineCount - 1) + comment.charSize });
	};
	const addHTML5PartToResult = (lineContent, part, _font) => {
		if (part === "") return;
		const font = _font !== null && _font !== void 0 ? _font : "defont";
		for (const key of Object.keys(config.compatSpacer.html5)) {
			var _config$compatSpacer$;
			const spacerWidth = (_config$compatSpacer$ = config.compatSpacer.html5[key]) === null || _config$compatSpacer$ === void 0 ? void 0 : _config$compatSpacer$[font];
			if (!spacerWidth) continue;
			const compatIndex = part.indexOf(key);
			if (compatIndex >= 0) {
				addHTML5PartToResult(lineContent, part.slice(0, compatIndex), font);
				let i = compatIndex;
				for (; i < part.length && part[i] === key; i++);
				lineContent.push({
					type: "spacer",
					char: key,
					charWidth: spacerWidth,
					count: i - compatIndex
				});
				addHTML5PartToResult(lineContent, part.slice(i), font);
				return;
			}
		}
		lineContent.push({
			type: "text",
			content: part,
			slicedContent: part.split("\n")
		});
	};
	/**
	* コメントの幅を計測する
	* @param comment コメント
	* @param renderer 計測対象のレンダラーインスタンス
	* @returns 計測結果
	*/
	const measureWidth = (comment, renderer) => {
		const { fontSize, scale } = getFontSizeAndScale(comment.charSize);
		const lineWidth = [];
		const itemWidth = [];
		const initialFont = parseFont(comment.font, fontSize);
		renderer.setFont(initialFont);
		let lastFont = initialFont;
		let currentWidth = 0;
		for (const item of comment.content) {
			var _item$font;
			if (item.type === "spacer") {
				currentWidth += item.count * fontSize * item.charWidth;
				itemWidth.push([item.count * fontSize * item.charWidth]);
				lineWidth.push(Math.ceil(currentWidth * scale));
				continue;
			}
			const lines = item.content.split("\n");
			const font = parseFont((_item$font = item.font) !== null && _item$font !== void 0 ? _item$font : comment.font, fontSize);
			if (font !== lastFont) {
				renderer.setFont(font);
				lastFont = font;
			}
			const width = [];
			for (let j = 0, n = lines.length; j < n; j++) {
				const line = lines[j];
				if (line === void 0) throw new TypeGuardError();
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
			itemWidth
		};
	};
	/**
	* フォントサイズとスケールを返す
	* @param _charSize 文字サイズ
	* @returns フォントサイズとスケール
	*/
	const getFontSizeAndScale = (_charSize) => {
		let charSize = _charSize;
		charSize *= .8;
		if (charSize < config.html5MinFontSize) {
			if (charSize >= 1) charSize = Math.floor(charSize);
			return {
				scale: charSize / config.html5MinFontSize,
				fontSize: config.html5MinFontSize
			};
		}
		return {
			scale: 1,
			fontSize: Math.floor(charSize)
		};
	};
	//#endregion
	//#region src/utils/index.ts
	var utils_exports = /* @__PURE__ */ __exportAll({
		addHTML5PartToResult: () => addHTML5PartToResult,
		arrayEqual: () => arrayEqual,
		arrayPush: () => arrayPush,
		buildAtButtonComment: () => buildAtButtonComment,
		changeCALayer: () => changeCALayer,
		getButtonParts: () => getButtonParts,
		getCharSize: () => getCharSize,
		getConfig: () => getConfig,
		getDefaultCommand: () => getDefaultCommand,
		getFixedPosY: () => getFixedPosY,
		getFlashFontIndex: () => getFlashFontIndex,
		getFlashFontName: () => getFlashFontName,
		getFontSizeAndScale: () => getFontSizeAndScale,
		getLineHeight: () => getLineHeight,
		getMovablePosY: () => getMovablePosY,
		getPosX: () => getPosX,
		getPosY: () => getPosY,
		getStrokeColor: () => getStrokeColor,
		hex2rgb: () => hex2rgb,
		hex2rgba: () => hex2rgba,
		isBanActive: () => isBanActive,
		isFlashComment: () => isFlashComment,
		isLineBreakResize: () => isLineBreakResize,
		isReverseActive: () => isReverseActive,
		measure: () => measure,
		nativeSort: () => nativeSort,
		parseCommandAndNicoScript: () => parseCommandAndNicoScript,
		parseContent: () => parseContent,
		parseFont: () => parseFont,
		processFixedComment: () => processFixedComment,
		processMovableComment: () => processMovableComment,
		resetRangePointers: () => resetRangePointers
	});
	//#endregion
	//#region src/comments/BaseComment.ts
	/**
	* コメントの描画を行うクラスの基底クラス
	*/
	var BaseComment = class {
		/**
		* コンストラクタ
		* @param comment 処理対象のコメント
		* @param renderer 描画対象のレンダラークラス
		* @param index コメントのインデックス
		*/
		constructor(comment, renderer, index) {
			_defineProperty(this, "renderer", void 0);
			_defineProperty(this, "cacheKey", void 0);
			_defineProperty(this, "comment", void 0);
			_defineProperty(this, "pos", void 0);
			_defineProperty(this, "posY", void 0);
			_defineProperty(this, "pluginName", "BaseComment");
			_defineProperty(this, "image", void 0);
			_defineProperty(this, "buttonImage", void 0);
			_defineProperty(this, "index", void 0);
			this.renderer = renderer;
			this.posY = -1;
			this.pos = {
				x: 0,
				y: 0
			};
			comment.content = comment.content.replace(/\t/g, "  ");
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
		/**
		* コメントの描画サイズを計算する
		* @param parsedData コメント
		* @returns 描画サイズを含むコメント
		*/
		getCommentSize(parsedData) {
			console.error("getCommentSize method is not implemented", parsedData);
			throw new NotImplementedError(this.pluginName, "getCommentSize");
		}
		/**
		* コメントに含まれるニコスクリプトを処理する
		* @param comment 処理対象のコメント
		* @returns 処理結果
		*/
		parseCommandAndNicoscript(comment) {
			console.error("parseCommandAndNicoscript method is not implemented", comment);
			throw new NotImplementedError(this.pluginName, "parseCommandAndNicoscript");
		}
		/**
		* コメントの本文をパースする
		* @param comment 処理対象のコメント本文
		* @returns 処理結果
		*/
		parseContent(comment) {
			console.error("parseContent method is not implemented", comment);
			throw new NotImplementedError(this.pluginName, "parseContent");
		}
		/**
		* context.measureTextの複数行対応版
		* 画面外にはみ出すコメントの縮小も行う
		* @param comment - 独自フォーマットのコメントデータ
		* @returns - 描画サイズとリサイズの情報
		*/
		measureText(comment) {
			console.error("measureText method is not implemented", comment);
			throw new NotImplementedError(this.pluginName, "measureText");
		}
		/**
		* サイズ計測などを行うためのラッパー関数
		* @param comment コンストラクタで受け取ったコメント
		* @returns 描画サイズを含むコメント
		*/
		convertComment(comment) {
			console.error("convertComment method is not implemented", comment);
			throw new NotImplementedError(this.pluginName, "convertComment");
		}
		/**
		* コメントを描画する
		* @param vpos vpos
		* @param showCollision 当たり判定を表示するか
		* @param cursor カーソルの位置
		* @param frameActiveState フレーム単位で計算済みの active state
		*/
		draw(vpos, showCollision, cursor, frameActiveState) {
			var _frameActiveState$ban, _frameActiveState$rev, _frameActiveState$rev2;
			if ((_frameActiveState$ban = frameActiveState === null || frameActiveState === void 0 ? void 0 : frameActiveState.banActive) !== null && _frameActiveState$ban !== void 0 ? _frameActiveState$ban : isBanActive(vpos)) return;
			const reverse = this.comment.owner ? (_frameActiveState$rev = frameActiveState === null || frameActiveState === void 0 ? void 0 : frameActiveState.reverseActiveOwner) !== null && _frameActiveState$rev !== void 0 ? _frameActiveState$rev : isReverseActive(vpos, true) : (_frameActiveState$rev2 = frameActiveState === null || frameActiveState === void 0 ? void 0 : frameActiveState.reverseActiveViewer) !== null && _frameActiveState$rev2 !== void 0 ? _frameActiveState$rev2 : isReverseActive(vpos, false);
			const posX = getPosX(this.comment, vpos, reverse);
			const posY = this.comment.loc === "shita" ? config.canvasHeight - this.posY - this.comment.height : this.posY;
			this.pos = {
				x: posX,
				y: posY
			};
			this._drawBackgroundColor(posX, posY);
			this._draw(posX, posY, cursor);
			this._drawRectColor(posX, posY);
			this._drawCollision(posX, posY, showCollision);
			this._drawDebugInfo(posX, posY);
		}
		/**
		* コメント本体を描画する
		* @param posX 描画位置
		* @param posY 描画位置
		* @param cursor カーソルの位置
		*/
		_draw(posX, posY, cursor) {
			if (this.image === void 0) this.image = this.getTextImage();
			if (this.image) {
				const effectiveAlpha = typeof this.comment.opacity === "number" ? this.comment.opacity : this.comment._live ? config.contextFillLiveOpacity : 1;
				if (effectiveAlpha !== 1) {
					this.renderer.save();
					this.renderer.setGlobalAlpha(effectiveAlpha);
				}
				if (this.comment.button && !this.comment.button.hidden) {
					const button = this.getButtonImage(posX, posY, cursor);
					button && this.renderer.drawImage(button, posX, posY);
				}
				this.renderer.drawImage(this.image, posX, posY);
				if (effectiveAlpha !== 1) this.renderer.restore();
			}
		}
		/**
		* 枠コマンドで指定されている場合に枠を描画する
		* @param posX 描画位置
		* @param posY 描画位置
		*/
		_drawRectColor(posX, posY) {
			if (this.comment.wakuColor) {
				this.renderer.save();
				this.renderer.setStrokeStyle(this.comment.wakuColor);
				this.renderer.strokeRect(posX, posY, this.comment.width, this.comment.height);
				this.renderer.restore();
			}
		}
		/**
		* コメントの背景を描画する
		* @param posX 描画位置
		* @param posY 描画位置
		*/
		_drawBackgroundColor(posX, posY) {
			if (this.comment.fillColor) {
				this.renderer.save();
				this.renderer.setFillStyle(this.comment.fillColor);
				this.renderer.fillRect(posX, posY, this.comment.width, this.comment.height);
				this.renderer.restore();
			}
		}
		/**
		* コメントのメタデータを描画する
		* @param posX 描画位置
		* @param posY 描画位置
		*/
		_drawDebugInfo(posX, posY) {
			if (isDebug) {
				this.renderer.save();
				this.renderer.setFont(parseFont("defont", 30));
				this.renderer.setFillStyle("#ff00ff");
				this.renderer.fillText(this.comment.mail.join(","), posX, posY + 30);
				this.renderer.restore();
			}
		}
		/**
		* コメントの当たり判定を描画する
		* @param posX 描画位置
		* @param posY 描画位置
		* @param showCollision 当たり判定を表示するかどうか
		*/
		_drawCollision(posX, posY, showCollision) {
			console.error("_drawCollision method is not implemented", posX, posY, showCollision);
			throw new NotImplementedError(this.pluginName, "_drawCollision");
		}
		/**
		* コメントの画像を生成する
		* @returns 生成した画像
		*/
		getTextImage() {
			if (this.comment.invisible || this.comment.lineCount === 1 && this.comment.width === 0 || this.comment.height - (this.comment.charSize - this.comment.lineHeight) <= 0) return null;
			const key = this.cacheKey;
			const cache = imageCache[key];
			if (cache) {
				this.image = cache.image;
				window.setTimeout(() => {
					this.image = void 0;
				}, this.comment.long * 10 + config.cacheAge);
				clearTimeout(cache.timeout);
				cache.timeout = window.setTimeout(() => {
					var _imageCache$key;
					(_imageCache$key = imageCache[key]) === null || _imageCache$key === void 0 || _imageCache$key.image.destroy();
					delete imageCache[key];
				}, this.comment.long * 10 + config.cacheAge);
				return cache.image;
			}
			if (this.image) return this.image;
			const image = this._generateTextImage();
			this._cacheImage(image);
			return image;
		}
		/**
		* コメントの画像を実際に生成する
		*/
		_generateTextImage() {
			console.error("_generateTextImage method is not implemented");
			throw new NotImplementedError(this.pluginName, "_generateTextImage");
		}
		/**
		* 画像をキャッシュする
		* @param image キャッシュ対象の画像
		*/
		_cacheImage(image) {
			const key = this.cacheKey;
			this.image = image;
			window.setTimeout(() => {
				this.image = void 0;
			}, this.comment.long * 10 + config.cacheAge);
			imageCache[key] = {
				timeout: window.setTimeout(() => {
					var _imageCache$key2;
					(_imageCache$key2 = imageCache[key]) === null || _imageCache$key2 === void 0 || _imageCache$key2.image.destroy();
					delete imageCache[key];
				}, this.comment.long * 10 + config.cacheAge),
				image
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
			const sortedMail = [...this.comment.mail].sort().join(",");
			return `${this.pluginName}\0${sortedMail}\0${this.comment.rawContent}`;
		}
	};
	//#endregion
	//#region src/utils/border.ts
	/**
	* ボタンの左端枠を描画する
	* @param context 描画対象のレンダラークラス
	* @param left 左端のx座標
	* @param top 上端のy座標
	* @param width 幅
	* @param height 高さ
	* @param radius 角丸の半径
	*/
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
	/**
	* ボタンの中央枠を描画する
	* @param context 描画対象のレンダラークラス
	* @param left 左端のx座標
	* @param top 上端のy座標
	* @param width 幅
	* @param height 高さ
	*/
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
	/**
	* ボタンの右端枠を描画する
	* @param context 描画対象のレンダラークラス
	* @param right 右端のx座標
	* @param top 上端のy座標
	* @param height 高さ
	* @param radius 角丸の半径
	*/
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
	//#endregion
	//#region src/comments/FlashComment.ts
	let flashScriptCharRegexConfig = null;
	let flashScriptCharRegex = null;
	const getFlashScriptCharRegex = () => {
		if (flashScriptCharRegex === null || flashScriptCharRegexConfig !== config) {
			flashScriptCharRegexConfig = config;
			flashScriptCharRegex = {
				super: new RegExp(config.flashScriptChar.super, "g"),
				sub: new RegExp(config.flashScriptChar.sub, "g")
			};
		}
		return flashScriptCharRegex;
	};
	var FlashComment = class extends BaseComment {
		constructor(comment, renderer, index) {
			var _this$_globalScale;
			super(comment, renderer, index);
			_defineProperty(this, "_globalScale", void 0);
			_defineProperty(this, "pluginName", "FlashComment");
			_defineProperty(this, "buttonImage", void 0);
			(_this$_globalScale = this._globalScale) !== null && _this$_globalScale !== void 0 || (this._globalScale = getConfig(config.commentScale, true));
			this.buttonImage = renderer.getCanvas();
		}
		get content() {
			return this.comment.rawContent;
		}
		set content(input) {
			const { content, lineCount, lineOffset } = this.parseContent(input);
			const comment = _objectSpread2(_objectSpread2({}, this.comment), {}, {
				rawContent: input,
				content,
				lineCount,
				lineOffset
			});
			const val = content[0];
			if (val === null || val === void 0 ? void 0 : val.font) comment.font = val.font;
			this.comment = this.getCommentSize(comment);
			this.cacheKey = this.getCacheKey();
			this.image = void 0;
		}
		convertComment(comment) {
			this._globalScale = getConfig(config.commentScale, true);
			return getButtonParts(this.getCommentSize(this.parseCommandAndNicoscript(comment)));
		}
		/**
		* コメントの描画サイズを計算する
		* @param parsedData 計算対象のコメント
		* @returns 計算結果
		*/
		getCommentSize(parsedData) {
			if (parsedData.invisible) return _objectSpread2(_objectSpread2({}, parsedData), {}, {
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
				content: []
			});
			this.renderer.save();
			this.renderer.setFont(parseFont(parsedData.font, parsedData.fontSize));
			const measure = this.measureText(_objectSpread2(_objectSpread2({}, parsedData), {}, { scale: 1 }));
			if (options.scale !== 1 && parsedData.layer === -1) {
				measure.height *= options.scale;
				measure.width *= options.scale;
			}
			this.renderer.restore();
			if (parsedData.button && !parsedData.button.hidden) measure.width += getConfig(config.atButtonPadding, true) * 4;
			return _objectSpread2(_objectSpread2({}, parsedData), {}, {
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
				content: measure.content
			});
		}
		parseCommandAndNicoscript(comment) {
			const data = parseCommandAndNicoScript(comment);
			const { content, lineCount, lineOffset } = this.parseContent(comment.content, data.button);
			const val = content[0];
			if (val === null || val === void 0 ? void 0 : val.font) data.font = val.font;
			return _objectSpread2(_objectSpread2(_objectSpread2({}, comment), {}, { rawContent: comment.content }, data), {}, {
				content,
				lineCount,
				lineOffset
			});
		}
		parseContent(input, button) {
			var _input$match$length, _input$match, _input$match$length2, _input$match2, _input$match$length3, _input$match3;
			return {
				content: button ? [
					...parseContent(button.message.before),
					...parseContent(button.message.body).map((val) => {
						val.isButton = true;
						return val;
					}),
					...parseContent(button.message.after)
				] : parseContent(input),
				lineCount: ((_input$match$length = (_input$match = input.match(/\n/g)) === null || _input$match === void 0 ? void 0 : _input$match.length) !== null && _input$match$length !== void 0 ? _input$match$length : 0) + 1,
				lineOffset: ((_input$match$length2 = (_input$match2 = input.match(getFlashScriptCharRegex().super)) === null || _input$match2 === void 0 ? void 0 : _input$match2.length) !== null && _input$match$length2 !== void 0 ? _input$match$length2 : 0) * -1 * config.flashScriptCharOffset + ((_input$match$length3 = (_input$match3 = input.match(getFlashScriptCharRegex().sub)) === null || _input$match3 === void 0 ? void 0 : _input$match3.length) !== null && _input$match$length3 !== void 0 ? _input$match$length3 : 0) * config.flashScriptCharOffset
			};
		}
		measureText(comment) {
			var _comment$lineHeight;
			const configLineHeight = getConfig(config.lineHeight, true);
			const configFontSize = getConfig(config.fontSize, true)[comment.size];
			const configStageSize = getConfig(config.commentStageSize, true);
			const defaultFontSize = configFontSize.default;
			(_comment$lineHeight = comment.lineHeight) !== null && _comment$lineHeight !== void 0 || (comment.lineHeight = configLineHeight[comment.size].default);
			const widthLimit = configStageSize[comment.full ? "fullWidth" : "width"];
			const { scaleX, width, height } = this._measureContent(comment);
			let scale = 1;
			if (isLineBreakResize(comment)) {
				comment.resized = true;
				comment.resizedY = true;
				const lineBreakScale = config.flashLineBreakScale[comment.size];
				const scaledWidth = width * lineBreakScale;
				if (comment.loc !== "naka" && this._isDoubleResize(scaledWidth, widthLimit, comment.size, comment.lineCount, comment.full)) {
					if (scaledWidth > widthLimit) {
						const resizeRate = (Math.round(widthLimit / scaledWidth * defaultFontSize) + 1) / (defaultFontSize + 1);
						scale *= resizeRate;
					}
				} else scale *= lineBreakScale;
			} else if (comment.loc !== "naka" && width > widthLimit) {
				const resizeRate = (Math.round(widthLimit / width * defaultFontSize) + 1) / (defaultFontSize + 1);
				scale *= resizeRate;
			}
			comment.scale = scale;
			if (!typeGuard.internal.CommentMeasuredContentItemArray(comment.content)) throw new TypeGuardError();
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
				scaleX,
				width: width * scale
			};
		}
		_isDoubleResize(width, widthLimit, size, lineCount, isFull) {
			if (width < widthLimit * .9 || widthLimit * 1.1 < width) return width > widthLimit;
			if (size === "big") {
				if (8 <= lineCount && lineCount <= 14 && !isFull && widthLimit * .99 < width) return true;
				if (width <= widthLimit) return false;
				if (16 <= lineCount && width * .95 < widthLimit) return true;
				if (isFull) {
					if (width * .95 < widthLimit) return false;
					return width > widthLimit;
				}
				return true;
			}
			if (width <= widthLimit) return false;
			if ((size === "medium" && 25 <= lineCount || size === "small" && 38 <= lineCount) && width * .95 < widthLimit) return false;
			return widthLimit < width;
		}
		_measureContent(comment) {
			var _widthArr$leadLine$in, _comment$lineHeight2;
			const widthArr = [];
			const spacedWidthArr = [];
			let currentWidth = 0;
			let spacedWidth = 0;
			for (const item of comment.content) {
				var _item$font;
				if (item.type === "spacer") {
					spacedWidth += item.count * item.charWidth * comment.fontSize + Math.max(item.count - 1, 0) * config.flashLetterSpacing;
					currentWidth += item.count * item.charWidth * comment.fontSize;
					widthArr.push(currentWidth);
					spacedWidthArr.push(spacedWidth);
					continue;
				}
				const lines = item.content.split("\n");
				const widths = [];
				this.renderer.setFont(parseFont((_item$font = item.font) !== null && _item$font !== void 0 ? _item$font : comment.font, comment.fontSize));
				for (let i = 0, n = lines.length; i < n; i++) {
					const value = lines[i];
					if (value === void 0) continue;
					const measure = this.renderer.measureText(value);
					currentWidth += measure.width;
					spacedWidth += measure.width + Math.max(value.length - 1, 0) * config.flashLetterSpacing;
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
				return {
					max,
					index
				};
			})();
			return {
				scaleX: leadLine.max / ((_widthArr$leadLine$in = widthArr[leadLine.index]) !== null && _widthArr$leadLine$in !== void 0 ? _widthArr$leadLine$in : 1),
				width: leadLine.max * comment.scale,
				height: (comment.fontSize * ((_comment$lineHeight2 = comment.lineHeight) !== null && _comment$lineHeight2 !== void 0 ? _comment$lineHeight2 : 0) * comment.lineCount + config.flashCommentYPaddingTop[comment.resizedY ? "resized" : "default"]) * comment.scale
			};
		}
		_drawCollision(posX, posY, showCollision) {
			if (showCollision) {
				this.renderer.save();
				this.renderer.setStrokeStyle("rgba(255,0,255,1)");
				this.renderer.strokeRect(posX, posY, this.comment.width, this.comment.height);
				for (let i = 0, n = this.comment.lineCount; i < n; i++) {
					const linePosY = ((i + 1) * (this.comment.fontSize * this.comment.lineHeight) + config.flashCommentYPaddingTop[this.comment.resizedY ? "resized" : "default"]) * this.comment.scale;
					this.renderer.setStrokeStyle("rgba(255,255,0,0.25)");
					this.renderer.strokeRect(posX, posY + linePosY * this._globalScale, this.comment.width, this.comment.fontSize * this.comment.lineHeight * -1 * this._globalScale * this.comment.scale * (this.comment.layer === -1 ? options.scale : 1));
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
			const offsetY = config.flashCommentYPaddingTop[offsetKey] + this.comment.fontSize * this.comment.lineHeight * config.flashCommentYOffset[this.comment.size][offsetKey];
			let lastFont = this.comment.font;
			let leftOffset = 0;
			let lineCount = 0;
			let isLastButton = false;
			for (const item of this.comment.content) {
				var _item$font2;
				if (item.type === "spacer") {
					leftOffset += item.count * item.charWidth * this.comment.fontSize;
					isLastButton = !!item.isButton;
					continue;
				}
				const font = (_item$font2 = item.font) !== null && _item$font2 !== void 0 ? _item$font2 : this.comment.font;
				if (lastFont !== font) {
					lastFont = font;
					renderer.setFont(parseFont(font, this.comment.fontSize));
				}
				const lines = item.slicedContent;
				for (let lineIndex = 0, lineLength = lines.length; lineIndex < lineLength; lineIndex++) {
					var _item$width$lineIndex;
					const line = lines[lineIndex];
					if (line === void 0) continue;
					const posY = (lineOffset + lineCount + 1) * lineHeight + offsetY;
					const partWidth = (_item$width$lineIndex = item.width[lineIndex]) !== null && _item$width$lineIndex !== void 0 ? _item$width$lineIndex : 0;
					if (this.comment.button && !this.comment.button.hidden && (!isLastButton && item.isButton || isLastButton && !item.isButton)) leftOffset += atButtonPadding * 2;
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
			if (!this.comment.button || this.comment.button.hidden) return void 0;
			const { renderer } = this._setupCanvas(this.buttonImage);
			const parts = this.comment.buttonObjects;
			if (!parts) return void 0;
			const atButtonRadius = getConfig(config.atButtonRadius, true);
			const isHover = this.isHovered(cursor, posX, posY);
			renderer.save();
			const getStrokeStyle = () => {
				if (isHover) return this.comment.color;
				if (this.comment.button && this.comment.button.limit < 1) return "#777777";
				return "white";
			};
			renderer.setStrokeStyle(getStrokeStyle());
			drawLeftBorder(renderer, parts.left.left, parts.left.top, parts.left.width, parts.left.height, atButtonRadius);
			for (const part of parts.middle) drawMiddleBorder(renderer, part.left, part.top, part.width, part.height);
			drawRightBorder(renderer, parts.right.right, parts.right.top, parts.right.height, atButtonRadius);
			renderer.restore();
			return renderer;
		}
		isHovered(_cursor, _posX, _posY) {
			if (!_cursor || !this.comment.buttonObjects) return false;
			const { left, middle, right } = this.comment.buttonObjects;
			const scale = this._globalScale * this.comment.scale * this.comment.scaleX * (this.comment.layer === -1 ? options.scale : 1);
			const posX = (_posX !== null && _posX !== void 0 ? _posX : this.pos.x) / scale;
			const posY = (_posY !== null && _posY !== void 0 ? _posY : this.pos.y) / scale;
			const cursor = {
				x: _cursor.x / scale,
				y: _cursor.y / scale
			};
			if (cursor.x < posX || posX + this.comment.width < cursor.x || cursor.y < posY + left.top || posY + right.top + right.height < cursor.y) return false;
			const atButtonPadding = getConfig(config.atButtonPadding, true);
			const between = (val, min, max) => {
				return min < val && val < max;
			};
			for (const part of [left, ...middle]) if (between(cursor.x, posX + part.left, posX + part.left + part.width) && between(cursor.y, posY + part.top, posY + part.top + part.height)) return true;
			return between(cursor.x, posX + right.right - atButtonPadding, posX + right.right + getConfig(config.contextLineWidth, true) / 2) && between(cursor.y, posY + right.top, posY + right.top + right.height);
		}
		_setupCanvas(renderer) {
			const atButtonPadding = getConfig(config.atButtonPadding, true);
			renderer.setSize(this.comment.width, this.comment.height + (this.comment.button ? atButtonPadding * 2 : 0));
			renderer.setStrokeStyle(getStrokeColor(this.comment));
			renderer.setFillStyle(this.comment.color);
			renderer.setLineWidth(getConfig(config.contextLineWidth, true));
			renderer.setFont(parseFont(this.comment.font, this.comment.fontSize));
			const scale = this._globalScale * this.comment.scale * (this.comment.layer === -1 ? options.scale : 1);
			renderer.setScale(scale * this.comment.scaleX, scale);
			return { renderer };
		}
	};
	//#endregion
	//#region src/comments/HTML5Comment.ts
	const MAX_RESIZE_ITERATIONS = 20;
	var HTML5Comment = class extends BaseComment {
		constructor(comment, context, index) {
			super(comment, context, index);
			_defineProperty(this, "pluginName", "HTML5Comment");
			this.posY = -1;
		}
		get content() {
			return this.comment.rawContent;
		}
		set content(input) {
			const { content, lineCount, lineOffset } = this.parseContent(input);
			const comment = _objectSpread2(_objectSpread2({}, this.comment), {}, {
				rawContent: input,
				content,
				lineCount,
				lineOffset
			});
			this.comment = this.getCommentSize(comment);
			this.cacheKey = this.getCacheKey();
			this.image = void 0;
		}
		convertComment(comment) {
			return this.getCommentSize(this.parseCommandAndNicoscript(comment));
		}
		getCommentSize(parsedData) {
			if (parsedData.invisible) return _objectSpread2(_objectSpread2({}, parsedData), {}, {
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
				scale: 1
			});
			this.renderer.save();
			this.renderer.setFont(parseFont(parsedData.font, parsedData.fontSize));
			const measure = this.measureText(_objectSpread2(_objectSpread2({}, parsedData), {}, { scale: 1 }));
			if (options.scale !== 1 && parsedData.layer === -1) {
				measure.height *= options.scale;
				measure.width *= options.scale;
				measure.fontSize *= options.scale;
			}
			this.renderer.restore();
			return _objectSpread2(_objectSpread2({}, parsedData), {}, {
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
				scale: measure.scale
			});
		}
		parseCommandAndNicoscript(comment) {
			const data = parseCommandAndNicoScript(comment);
			const { content, lineCount, lineOffset } = this.parseContent(comment.content, data.font);
			return _objectSpread2(_objectSpread2(_objectSpread2({}, comment), {}, { rawContent: comment.content }, data), {}, {
				content,
				lineCount,
				lineOffset
			});
		}
		parseContent(input, font) {
			const content = [];
			addHTML5PartToResult(content, input, font !== null && font !== void 0 ? font : "defont");
			return {
				content,
				lineCount: input.split("\n").length,
				lineOffset: 0
			};
		}
		measureText(comment) {
			var _comment$charSize, _comment$lineHeight, _comment$charSize2;
			const scale = getConfig(config.commentScale, false);
			const configFontSize = getConfig(config.fontSize, false);
			const lineHeight = getLineHeight(comment.size, false);
			const charSize = getCharSize(comment.size, false);
			if (!comment.lineHeight) comment.lineHeight = lineHeight;
			if (!comment.charSize) comment.charSize = charSize;
			comment.fontSize = comment.charSize * .8;
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
				if ((item === null || item === void 0 ? void 0 : item.type) !== "text" || !itemWidth) continue;
				item.width = itemWidth[i];
			}
			comment.fontSize = ((_comment$charSize = comment.charSize) !== null && _comment$charSize !== void 0 ? _comment$charSize : 0) * .8;
			if (!typeGuard.internal.CommentMeasuredContentItemArray(comment.content)) throw new TypeGuardError();
			return {
				width: width * scale,
				height: height * scale,
				resized: !!comment.resized,
				fontSize: comment.fontSize,
				lineHeight: (_comment$lineHeight = comment.lineHeight) !== null && _comment$lineHeight !== void 0 ? _comment$lineHeight : 0,
				content: comment.content,
				resizedX: !!comment.resizedX,
				resizedY: !!comment.resizedY,
				charSize: (_comment$charSize2 = comment.charSize) !== null && _comment$charSize2 !== void 0 ? _comment$charSize2 : 0,
				scaleX: 1,
				scale: 1
			};
		}
		_measureComment(comment) {
			const widthLimit = getConfig(config.commentStageSize, false)[comment.full ? "fullWidth" : "width"];
			if (!typeGuard.internal.MeasureInput(comment)) throw new TypeGuardError();
			const measureResult = measure(comment, this.renderer);
			if (comment.loc !== "naka" && measureResult.width > widthLimit) return this._processResizeX(comment, measureResult.width);
			return measureResult;
		}
		_processResizeX(comment, width) {
			var _comment$charSize3, _comment$lineHeight2, _comment$charSize5;
			const widthLimit = getConfig(config.commentStageSize, false)[comment.full ? "fullWidth" : "width"];
			const lineHeight = getLineHeight(comment.size, false);
			const charSize = getCharSize(comment.size, false);
			const scale = widthLimit / width;
			comment.resizedX = true;
			const baseCharSize = Math.max(1, ((_comment$charSize3 = comment.charSize) !== null && _comment$charSize3 !== void 0 ? _comment$charSize3 : 0) * scale);
			const baseLineHeight = Math.max(1, ((_comment$lineHeight2 = comment.lineHeight) !== null && _comment$lineHeight2 !== void 0 ? _comment$lineHeight2 : 0) * scale);
			const workComment = _objectSpread2(_objectSpread2({}, comment), {}, {
				charSize: baseCharSize,
				lineHeight: baseLineHeight,
				fontSize: baseCharSize * .8
			});
			if (!typeGuard.internal.MeasureInput(workComment)) throw new TypeGuardError();
			const getMeasured = (nextCharSize) => {
				workComment.charSize = nextCharSize;
				workComment.lineHeight = baseLineHeight * (nextCharSize / baseCharSize);
				workComment.fontSize = nextCharSize * .8;
				return measure(workComment, this.renderer);
			};
			let low = Math.max(1, Math.floor(baseCharSize * .5));
			let high = Math.max(low, Math.ceil(baseCharSize * 1.5));
			let best = baseCharSize;
			let bestResult = getMeasured(baseCharSize);
			if (bestResult.width > widthLimit) {
				high = baseCharSize;
				let remainingIterations = MAX_RESIZE_ITERATIONS;
				while (remainingIterations-- > 0) {
					const candidate = getMeasured(low);
					const nextLow = Math.max(1, Math.floor(low * .5));
					if (candidate.width <= widthLimit || nextLow === low) {
						best = low;
						bestResult = candidate;
						break;
					}
					high = low;
					low = nextLow;
				}
			} else {
				let remainingIterations = MAX_RESIZE_ITERATIONS;
				while (remainingIterations-- > 0) {
					const candidate = getMeasured(high);
					if (candidate.width > widthLimit) break;
					best = high;
					bestResult = candidate;
					const nextHigh = Math.ceil(high * 1.5);
					if (nextHigh === high) break;
					high = nextHigh;
				}
			}
			if (bestResult.width <= widthLimit && low < high) {
				let left = best;
				let right = high;
				while (left <= right) {
					const mid = Math.floor((left + right) / 2);
					const candidate = getMeasured(mid);
					if (candidate.width <= widthLimit) {
						best = mid;
						bestResult = candidate;
						left = mid + 1;
					} else right = mid - 1;
				}
			}
			if (comment.resizedY) {
				var _comment$charSize4;
				const resizeScale = best / ((_comment$charSize4 = comment.charSize) !== null && _comment$charSize4 !== void 0 ? _comment$charSize4 : 1);
				comment.charSize = resizeScale * charSize;
				comment.lineHeight = resizeScale * lineHeight;
			} else {
				comment.charSize = best;
				comment.lineHeight = baseLineHeight * (best / baseCharSize);
			}
			comment.fontSize = ((_comment$charSize5 = comment.charSize) !== null && _comment$charSize5 !== void 0 ? _comment$charSize5 : 0) * .8;
			return measure(comment, this.renderer);
		}
		_drawCollision(posX, posY, showCollision) {
			if (showCollision) {
				this.renderer.save();
				const scale = getConfig(config.commentScale, false);
				this.renderer.setStrokeStyle("rgba(0,255,255,1)");
				this.renderer.strokeRect(posX, posY, this.comment.width, this.comment.height);
				for (let i = 0, n = this.comment.lineCount; i < n; i++) {
					var _config$fonts$html5$t;
					if (!typeGuard.internal.HTML5Fonts(this.comment.font)) throw new TypeGuardError();
					const linePosY = (this.comment.lineHeight * (i + 1) + (this.comment.charSize - this.comment.lineHeight) / 2 + this.comment.lineHeight * -.16 + (((_config$fonts$html5$t = config.fonts.html5[this.comment.font]) === null || _config$fonts$html5$t === void 0 ? void 0 : _config$fonts$html5$t.offset) || 0)) * scale;
					this.renderer.setStrokeStyle("rgba(255,255,0,0.5)");
					this.renderer.strokeRect(posX, posY + linePosY, this.comment.width, this.comment.fontSize * -1 * scale);
				}
				this.renderer.restore();
			}
		}
		_generateTextImage() {
			var _config$fonts$html5$t2;
			const { fontSize, scale } = getFontSizeAndScale(this.comment.charSize);
			const paddingTop = (10 - scale * 10) * ((this.comment.lineCount + 1) / config.html5HiResCommentCorrection);
			const drawScale = getConfig(config.commentScale, false) * scale * (this.comment.layer === -1 ? options.scale : 1);
			const image = this.renderer.getCanvas(4);
			image.setSize(this.comment.width, this.comment.height);
			image.setStrokeStyle(getStrokeColor(this.comment));
			image.setFillStyle(this.comment.color);
			image.setLineWidth(getConfig(config.contextLineWidth, false));
			image.setFont(parseFont(this.comment.font, fontSize));
			image.setScale(drawScale);
			let lineCount = 0;
			if (!typeGuard.internal.HTML5Fonts(this.comment.font)) throw new TypeGuardError();
			const offsetY = (this.comment.charSize - this.comment.lineHeight) / 2 + this.comment.lineHeight * -.16 + (((_config$fonts$html5$t2 = config.fonts.html5[this.comment.font]) === null || _config$fonts$html5$t2 === void 0 ? void 0 : _config$fonts$html5$t2.offset) || 0);
			for (const item of this.comment.content) {
				if ((item === null || item === void 0 ? void 0 : item.type) === "spacer") {
					lineCount += item.count * item.charWidth * this.comment.fontSize;
					continue;
				}
				const lines = item.slicedContent;
				for (let j = 0, n = lines.length; j < n; j++) {
					const line = lines[j];
					if (line === void 0) continue;
					const posY = (this.comment.lineHeight * (lineCount + 1 + paddingTop) + offsetY) / scale;
					image.strokeText(line, 0, posY);
					image.fillText(line, 0, posY);
					lineCount += 1;
				}
			}
			return image;
		}
		getButtonImage() {}
		isHovered() {
			return false;
		}
	};
	//#endregion
	//#region src/comments/index.ts
	var comments_exports = /* @__PURE__ */ __exportAll({
		BaseComment: () => BaseComment,
		FlashComment: () => FlashComment,
		HTML5Comment: () => HTML5Comment
	});
	//#endregion
	//#region src/definition/fonts.ts
	var fonts_exports = /* @__PURE__ */ __exportAll({
		fontTemplates: () => fontTemplates,
		fonts: () => fonts
	});
	/**
	* フォントを構築する
	* @param fonts フォントの配列
	* @returns フォントの文字列
	*/
	const build = (fonts) => {
		return fonts.reduce((pv, val, index) => {
			if (index === 0) return _objectSpread2({}, val);
			pv.font += `, ${val.font}`;
			return pv;
		}, {
			font: "",
			offset: 0,
			weight: 600
		});
	};
	const fontTemplates = {
		arial: {
			font: "Arial, \"ＭＳ Ｐゴシック\", \"MS PGothic\", MSPGothic, MS-PGothic",
			offset: .01,
			weight: 600
		},
		gothic: {
			font: "\"游ゴシック体\", \"游ゴシック\", \"Yu Gothic\", YuGothic, yugothic, YuGo-Medium",
			offset: -.04,
			weight: 400
		},
		gulim: {
			font: "Gulim, \"黑体\", SimHei",
			offset: .03,
			weight: 400
		},
		mincho: {
			font: "\"游明朝体\", \"游明朝\", \"Yu Mincho\", YuMincho, yumincho, YuMin-Medium",
			offset: -.01,
			weight: 400
		},
		simsun: {
			font: "\"宋体\", SimSun",
			offset: .135,
			weight: 400
		},
		macGothicPro6: {
			font: "\"ヒラギノ角ゴ ProN W6\", HiraKakuProN-W6, \"ヒラギノ角ゴ ProN\", HiraKakuProN, \"Hiragino Kaku Gothic ProN\"",
			offset: -.05,
			weight: 600
		},
		macGothicPro3: {
			font: "\"ヒラギノ角ゴ ProN W3\", HiraKakuProN-W3, \"ヒラギノ角ゴ ProN\", HiraKakuProN, \"Hiragino Kaku Gothic ProN\"",
			offset: -.04,
			weight: 300
		},
		macMincho: {
			font: "\"ヒラギノ明朝 ProN W3\", HiraMinProN-W3, \"ヒラギノ明朝 ProN\", HiraMinProN, \"Hiragino Mincho ProN\"",
			offset: -.02,
			weight: 300
		},
		macGothic1: {
			font: "\"ヒラギノ角ゴシック\", \"Hiragino Sans\", HiraginoSans",
			offset: -.05,
			weight: 600
		},
		macGothic2: {
			font: "\"ヒラギノ角ゴシック\", \"Hiragino Sans\", HiraginoSans",
			offset: -.04,
			weight: 300
		},
		sansSerif600: {
			font: "sans-serif",
			offset: 0,
			weight: 600
		},
		sansSerif400: {
			font: "sans-serif",
			offset: 0,
			weight: 400
		},
		serif: {
			font: "serif",
			offset: 0,
			weight: 400
		}
	};
	const fonts = {
		win7: {
			defont: build([fontTemplates.arial]),
			gothic: build([
				fontTemplates.gothic,
				fontTemplates.gulim,
				fontTemplates.arial
			]),
			mincho: build([
				fontTemplates.mincho,
				fontTemplates.simsun,
				fontTemplates.arial
			])
		},
		win8_1: {
			defont: build([fontTemplates.arial]),
			gothic: build([
				fontTemplates.gothic,
				fontTemplates.simsun,
				fontTemplates.arial
			]),
			mincho: build([
				fontTemplates.mincho,
				fontTemplates.simsun,
				fontTemplates.arial
			])
		},
		win: {
			defont: build([fontTemplates.arial]),
			gothic: build([fontTemplates.gulim, fontTemplates.arial]),
			mincho: build([fontTemplates.simsun, fontTemplates.arial])
		},
		mac10_9: {
			defont: build([fontTemplates.macGothicPro6]),
			gothic: build([fontTemplates.gothic, fontTemplates.macGothicPro3]),
			mincho: build([
				fontTemplates.mincho,
				fontTemplates.macMincho,
				fontTemplates.macGothicPro3
			])
		},
		mac10_11: {
			defont: build([fontTemplates.macGothic1]),
			gothic: build([fontTemplates.gothic, fontTemplates.macGothic2]),
			mincho: build([
				fontTemplates.mincho,
				fontTemplates.macMincho,
				fontTemplates.macGothic2
			])
		},
		mac: {
			defont: build([fontTemplates.macGothicPro6]),
			gothic: build([fontTemplates.macGothicPro3]),
			mincho: build([fontTemplates.macMincho])
		},
		other: {
			defont: build([fontTemplates.sansSerif600]),
			gothic: build([fontTemplates.sansSerif400]),
			mincho: build([fontTemplates.serif])
		}
	};
	//#endregion
	//#region src/definition/initConfig.ts
	var initConfig_exports = /* @__PURE__ */ __exportAll({ initConfig: () => initConfig });
	/**
	* コンフィグを初期化する
	*/
	const initConfig = () => {
		const platform = ((ua) => {
			if (RegExp(/windows nt 6\.[12]/i).exec(ua)) return "win7";
			if (RegExp(/windows nt (6\.3|10\.\d+)|win32/i).exec(ua)) return "win8_1";
			if (RegExp(/windows nt/i).exec(ua)) return "win";
			if (RegExp(/mac os x 10(.|_)(9|10)/i).exec(ua)) return "mac10_9";
			if (RegExp(/mac os x 10(.|_)\d{2}|darwin/i).exec(ua)) return "mac10_11";
			if (RegExp(/mac os x/i).exec(ua)) return "mac";
			return "other";
		})(typeof navigator !== "undefined" ? navigator.userAgent : process.platform);
		updateConfig({
			colors,
			contextStrokeColor: "#000000",
			contextStrokeInversionColor: "#FFFFFF",
			contextStrokeOpacity: .4,
			contextFillLiveOpacity: .5,
			contextLineWidth: {
				html5: 2.8,
				flash: 4
			},
			commentScale: {
				html5: 1920 / 683,
				flash: 1920 / 683
			},
			commentStageSize: {
				html5: {
					width: 512,
					fullWidth: 683,
					height: 384
				},
				flash: {
					width: 512,
					fullWidth: 640,
					height: 385
				}
			},
			fontSize: {
				html5: {
					small: {
						default: 18,
						resized: 10
					},
					medium: {
						default: 27,
						resized: 14
					},
					big: {
						default: 39,
						resized: 19.5
					}
				},
				flash: {
					small: {
						default: 15,
						resized: 7.5
					},
					medium: {
						default: 24,
						resized: 12
					},
					big: {
						default: 39,
						resized: 19.5
					}
				}
			},
			html5LineCounts: {
				default: {
					big: 8.4,
					medium: 13.1,
					small: 21
				},
				resized: {
					big: 16,
					medium: 25.4,
					small: 38
				},
				doubleResized: {
					big: 7.8,
					medium: 11.3,
					small: 16.6
				}
			},
			html5HiResCommentCorrection: 20,
			html5MinFontSize: 10,
			fonts: {
				html5: fonts[platform],
				flash: {
					gulim: `normal 600 [size]px gulim, ${fonts[platform].gothic.font}, Arial`,
					simsun: `normal 400 [size]px simsun, batang, "PMingLiU", MingLiU-ExtB, ${fonts[platform].mincho.font}, Arial`
				}
			},
			fpsInterval: 500,
			cacheAge: 2e3,
			canvasWidth: 1920,
			canvasHeight: 1080,
			commentDrawRange: 1530,
			commentDrawPadding: 195,
			collisionRange: {
				left: 235,
				right: 1685
			},
			collisionPadding: 5,
			sameCARange: 3600,
			sameCAGap: 100,
			sameCAMinScore: 10,
			sameCATimestampRange: 300,
			plugins: [],
			flashThreshold: 1499871600,
			flashChar: {
				gulim: "[ĦħĲĳĸĿŀŉ-ŋŦŧː˚⁴ⁿ₁-₄ℓ⅓⅔⅜-⅞↔↕∼⒜-⒵ⓐ-ⓩ▣-▩▶▷◀◁◈◐◑☎☏☜☞♠♡♣-♥♧-♩♬ㄱ-ㅮ㈀-㈜㉠-㉻㎀-㎄㎈-㎍㎐-㎛㎟㎠㎢-㏊㏏㏐㏓㏖㏘㏛-㏝가-힣豈-廊浪-璉練廓￦]",
				simsunStrong: "[ǎǐǒǔǖǘǚǜɑɡˊˋ‖‵ⅪⅫ∣∶∷≌≮≯⊕⒃-⒛┄-┋╭-╳▁-▃▅-▇▉-▋▍-▏▔▕◢-◥☉〖〗〞〡-〩ㄅ-ㄩ㈠-㈩㊣㏎㏑㏒㏕-兀嗀︰︱︳-﹄﹉-﹒﹔-﹗﹙-﹦﹨-﹫]",
				simsunWeak: "[ˉ℅℉↖-↙∏∕≈≤≥⊙⑴-⒂┍┎┑┒┕┖┙┚┞┟┡┢┦┧┩┪┭┮┱┲┵┶┹┺┽┾╀╁╃-╊═-╬▄█▌▓]",
				gothic: "[ϻﾟ・]"
			},
			flashMode: "vista",
			flashScriptChar: {
				super: "[ª²³¹ºʰʲʳʷʸˡ-ˣ̄ᴬ-ᵃᵅ-ᵡᶛ-ᶡᶣ-ᶿ⁰ⁱ⁴-ⁿⱽ]",
				sub: "[̠ᵢ-ᵪ₀-₎ₐ-ₜⱼ]"
			},
			lineHeight: {
				small: {
					default: 18 / 15,
					resized: 10 / 7.5
				},
				medium: {
					default: 29 / 25,
					resized: 15 / 12
				},
				big: {
					default: 45 / 39,
					resized: 24 / 19.5
				}
			},
			flashCommentYPaddingTop: {
				default: 5,
				resized: 3
			},
			flashCommentYOffset: {
				small: {
					default: -.2,
					resized: -.2
				},
				medium: {
					default: -.2,
					resized: -.2
				},
				big: {
					default: -.2,
					resized: -.2
				}
			},
			flashLetterSpacing: 1,
			flashScriptCharOffset: .12,
			commentLimit: void 0,
			hideCommentOrder: "asc",
			lineBreakCount: {
				big: 3,
				medium: 5,
				small: 7
			},
			commentPlugins: [{
				class: FlashComment,
				condition: isFlashComment
			}],
			nakaCommentSpeedOffset: .95,
			atButtonPadding: 5,
			atButtonRadius: 7,
			flashDoubleResizeHeights: { big: {
				9: 392,
				10: 384,
				11: 389,
				12: 388,
				13: 381,
				14: 381,
				15: 384
			} },
			flashLineBreakScale: {
				small: .557,
				medium: .519,
				big: .535
			},
			compatSpacer: {
				flash: {
					"　": {
						simsun: .98,
						defont: .645,
						gulim: .95
					},
					"\xA0": { simsun: .25 },
					" ": { defont: .3 },
					" ": { defont: .95 },
					" ": { defont: 1.6 },
					" ": { defont: 1.6 },
					"‪": { defont: .59 }
				},
				html5: {}
			}
		});
	};
	//#endregion
	//#region src/eventHandler.ts
	var eventHandler_exports = /* @__PURE__ */ __exportAll({
		registerHandler: () => registerHandler,
		removeHandler: () => removeHandler,
		triggerHandler: () => triggerHandler
	});
	let handlerList = [];
	const handlerCounts = {
		seekDisable: 0,
		seekEnable: 0,
		commentDisable: 0,
		commentEnable: 0,
		jump: 0
	};
	/**
	* イベントハンドラを登録する
	* @param eventName イベント名
	* @param handler イベントハンドラ
	*/
	const registerHandler = (eventName, handler) => {
		handlerList.push({
			eventName,
			handler
		});
		updateEventHandlerCounts();
	};
	/**
	* イベントハンドラを削除する
	* @param eventName イベント名
	* @param handler イベントハンドラ
	*/
	const removeHandler = (eventName, handler) => {
		handlerList = handlerList.filter((item) => item.eventName !== eventName || item.handler !== handler);
		updateEventHandlerCounts();
	};
	/**
	* イベントハンドラの登録数を更新する
	*/
	const updateEventHandlerCounts = () => {
		for (const key_ of Object.keys(handlerCounts)) {
			const key = key_;
			handlerCounts[key] = handlerList.filter((item) => item.eventName === key).length;
		}
	};
	/**
	* イベントを実行する
	* @param vpos 現在のvpos
	* @param lastVpos 前回のvpos
	*/
	const triggerHandler = (vpos, lastVpos) => {
		processCommentDisableScript(vpos, lastVpos);
		processSeekDisableScript(vpos, lastVpos);
		processJumpScript(vpos, lastVpos);
	};
	/**
	* コメント禁止コマンドを処理する
	* @param vpos 現在のvpos
	* @param lastVpos 前回のvpos
	*/
	const processCommentDisableScript = (vpos, lastVpos) => {
		if (handlerCounts.commentDisable < 1 && handlerCounts.commentEnable < 1) return;
		for (const range of nicoScripts.ban) {
			const vposInRange = range.start < vpos && vpos < range.end;
			const lastVposInRange = range.start < lastVpos && lastVpos < range.end;
			if (vposInRange && !lastVposInRange) executeEvents("commentDisable", {
				type: "commentDisable",
				timeStamp: Date.now(),
				vpos
			});
			else if (!vposInRange && lastVposInRange) executeEvents("commentEnable", {
				type: "commentEnable",
				timeStamp: Date.now(),
				vpos
			});
		}
	};
	/**
	* シーク禁止コマンドを処理する
	* @param vpos 現在のvpos
	* @param lastVpos 前回のvpos
	*/
	const processSeekDisableScript = (vpos, lastVpos) => {
		if (handlerCounts.seekDisable < 1 && handlerCounts.seekEnable < 1) return;
		for (const range of nicoScripts.seekDisable) {
			const vposInRange = range.start < vpos && vpos < range.end;
			const lastVposInRange = range.start < lastVpos && lastVpos < range.end;
			if (vposInRange && !lastVposInRange) executeEvents("seekDisable", {
				type: "seekDisable",
				timeStamp: Date.now(),
				vpos
			});
			else if (!vposInRange && lastVposInRange) executeEvents("seekEnable", {
				type: "seekEnable",
				timeStamp: Date.now(),
				vpos
			});
		}
	};
	/**
	* ジャンプコマンドを処理する
	* @param vpos 現在のvpos
	* @param lastVpos 前回のvpos
	*/
	const processJumpScript = (vpos, lastVpos) => {
		if (handlerCounts.jump < 1) return;
		for (const range of nicoScripts.jump) {
			const vposInRange = range.start < vpos && (!range.end || vpos < range.end);
			const lastVposInRange = range.start < lastVpos && (!range.end || lastVpos < range.end);
			if (vposInRange && !lastVposInRange) executeEvents("jump", {
				type: "jump",
				timeStamp: Date.now(),
				vpos,
				to: range.to,
				message: range.message
			});
		}
	};
	/**
	* 特定のイベントに紐付けられたイベントハンドラを実行する
	* @param eventName イベント名
	* @param event イベントのデータ
	*/
	const executeEvents = (eventName, event) => {
		for (const item of handlerList) {
			if (eventName !== item.eventName) continue;
			item.handler(event);
		}
	};
	//#endregion
	//#region src/input/empty.ts
	const EmptyParser = {
		key: ["empty"],
		parse: () => {
			return [];
		}
	};
	//#endregion
	//#region src/input/formatted.ts
	const FormattedParser = {
		key: ["formatted", "niconicome"],
		parse: (input) => {
			return parse(/* @__PURE__ */ array(ZFormattedComment), input);
		}
	};
	//#endregion
	//#region src/input/legacy.ts
	const LegacyParser = {
		key: ["legacy"],
		parse: (input) => {
			return fromLegacy(parse(/* @__PURE__ */ array(ZRawApiResponse), input));
		}
	};
	/**
	* ニコニコ公式のlegacy apiから帰ってきたデータ処理する
	* @param data legacy apiから帰ってきたデータ
	* @returns 変換後のデータ
	*/
	const fromLegacy = (data) => {
		const data_ = [];
		const userList = [];
		for (const _val of data) {
			const val = /* @__PURE__ */ safeParse(ZApiChat, _val.chat);
			if (!val.success) continue;
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
					is_my_post: false
				};
				if (value.mail) tmpParam.mail = value.mail.split(/\s+/g);
				if (value.content.startsWith("/") && !value.user_id) tmpParam.mail.push("invisible");
				const isUserExist = userList.indexOf(value.user_id);
				if (isUserExist === -1) {
					tmpParam.user_id = userList.length;
					userList.push(value.user_id);
				} else tmpParam.user_id = isUserExist;
				data_.push(tmpParam);
			}
		}
		return data_;
	};
	//#endregion
	//#region src/input/legacyOwner.ts
	const LegacyOwnerParser = {
		key: ["legacyOwner"],
		parse: (input) => {
			if (!typeGuard.legacyOwner.comments(input)) throw new InvalidFormatError();
			return fromLegacyOwner(input);
		}
	};
	/**
	* 旧プレイヤーの投稿者コメントのエディターのデータを処理する
	* @param data 旧投米のテキストデータ
	* @returns 変換後のデータ
	*/
	const fromLegacyOwner = (data) => {
		const data_ = [];
		const comments = data.split("\n");
		for (let i = 0, n = comments.length; i < n; i++) {
			var _commentData$;
			const value = comments[i];
			if (!value) continue;
			const commentData = value.split(":");
			if (commentData.length < 3) continue;
			if (commentData.length > 3) for (let j = 3, n = commentData.length; j < n; j++) commentData[2] += `:${commentData[j]}`;
			const tmpParam = {
				id: i,
				vpos: Number(commentData[0]) * 100,
				content: (_commentData$ = commentData[2]) !== null && _commentData$ !== void 0 ? _commentData$ : "",
				date: i,
				date_usec: 0,
				owner: true,
				premium: true,
				mail: [],
				user_id: -1,
				layer: -1,
				is_my_post: false
			};
			if (commentData[1]) tmpParam.mail = commentData[1].split(/\s+/g);
			if (tmpParam.content.startsWith("/")) tmpParam.mail.push("invisible");
			data_.push(tmpParam);
		}
		return data_;
	};
	//#endregion
	//#region src/input/owner.ts
	const OwnerParser = {
		key: ["owner"],
		parse: (input) => {
			return fromOwner(parse(/* @__PURE__ */ array(ZOwnerComment), input));
		}
	};
	/**
	* 投稿者コメントのエディターのデータを処理する
	* @param data 投米のデータ
	* @returns 変換後のデータ
	*/
	const fromOwner = (data) => {
		const data_ = [];
		for (let i = 0, n = data.length; i < n; i++) {
			const value = data[i];
			if (!value) continue;
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
				is_my_post: false
			};
			if (value.command) tmpParam.mail = value.command.split(/\s+/g);
			if (tmpParam.content.startsWith("/")) tmpParam.mail.push("invisible");
			data_.push(tmpParam);
		}
		return data_;
	};
	/**
	* 投稿者コメントのエディターは秒数の入力フォーマットに割りと色々対応しているのでvposに変換
	* @param input 分:秒.秒・分:秒・秒.秒・秒
	* @returns vpos
	*/
	const time2vpos = (input) => {
		const time = RegExp(/^(?:(\d+):(\d+)\.(\d+)|(\d+):(\d+)|(\d+)\.(\d+)|(\d+))$/).exec(input);
		if (time) {
			if (time[1] !== void 0 && time[2] !== void 0 && time[3] !== void 0) return (Number(time[1]) * 60 + Number(time[2])) * 100 + Number(time[3]) / Math.pow(10, time[3].length - 2);
			if (time[4] !== void 0 && time[5] !== void 0) return (Number(time[4]) * 60 + Number(time[5])) * 100;
			if (time[6] !== void 0 && time[7] !== void 0) return Number(time[6]) * 100 + Number(time[7]) / Math.pow(10, time[7].length - 2);
			if (time[8] !== void 0) return Number(time[8]) * 100;
		}
		return 0;
	};
	//#endregion
	//#region src/input/v1.ts
	const V1Parser = {
		key: ["v1"],
		parse: (input) => {
			return fromV1(parse(/* @__PURE__ */ array(ZV1Thread), input));
		}
	};
	/**
	* ニコニコ公式のv1 apiから帰ってきたデータ処理する
	* data内threadsのデータを渡されることを想定
	* @param data v1 apiから帰ってきたデータ
	* @returns 変換後のデータ
	*/
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
					is_my_post: value.isMyPost
				};
				if (tmpParam.content.startsWith("/") && tmpParam.owner) tmpParam.mail.push("invisible");
				const isUserExist = userList.indexOf(value.userId);
				if (isUserExist === -1) {
					tmpParam.user_id = userList.length;
					userList.push(value.userId);
				} else tmpParam.user_id = isUserExist;
				data_.push(tmpParam);
			}
		}
		return data_;
	};
	/**
	* v1 apiのpostedAtはISO 8601のtimestampなのでDate関数を使ってunix timestampに変換
	* @param date ISO 8601 timestamp
	* @returns unix timestamp
	*/
	const date2time = (date) => Math.floor(Date.parse(date) / 1e3);
	//#endregion
	//#region src/input/xml2js.ts
	const Xml2jsParser = {
		key: ["xml2js"],
		parse: (input) => {
			return fromXml2js(parse(ZXml2jsPacket, input));
		}
	};
	const fromXml2js = (data) => {
		const data_ = [];
		const userList = [];
		let index = data.packet.chat.length;
		for (const item of data.packet.chat) {
			var _item$$$user_id;
			const tmpParam = {
				id: Number(item.$.no) || index++,
				vpos: Number(item.$.vpos) || 0,
				content: item._,
				date: Number(item.$.date) || 0,
				date_usec: Number(item.$.date_usec) || 0,
				owner: !(item.$.owner === "0" || item.$.user_id),
				premium: item.$.premium === "1",
				mail: item.$.mail.split(/\s+/g),
				user_id: -1,
				layer: -1,
				is_my_post: false
			};
			if (tmpParam.content.startsWith("/") && tmpParam.owner) tmpParam.mail.push("invisible");
			const userId = (_item$$$user_id = item.$.user_id) !== null && _item$$$user_id !== void 0 ? _item$$$user_id : "";
			const isUserExist = userList.indexOf(userId);
			if (isUserExist === -1) {
				tmpParam.user_id = userList.length;
				userList.push(userId);
			} else tmpParam.user_id = isUserExist;
			data_.push(tmpParam);
		}
		return data_;
	};
	//#endregion
	//#region src/input/xmlDocument.ts
	const XmlDocumentParser = {
		key: ["formatted", "niconicome"],
		parse: (input) => {
			if (!typeGuard.xmlDocument(input)) throw new InvalidFormatError();
			return parseXMLDocument(input);
		}
	};
	/**
	* niconicome等が吐き出すxml形式のコメントデータを処理する
	* @param data 吐き出されたxmlをDOMParserでparseFromStringしたもの
	* @returns 変換後のデータ
	*/
	const parseXMLDocument = (data) => {
		const data_ = [];
		const userList = [];
		let index = Array.from(data.documentElement.children).length;
		for (const item of Array.from(data.documentElement.children)) {
			var _item$textContent, _item$getAttribute2;
			if (item.nodeName !== "chat") continue;
			const tmpParam = {
				id: Number(item.getAttribute("no")) || index++,
				vpos: Number(item.getAttribute("vpos")),
				content: (_item$textContent = item.textContent) !== null && _item$textContent !== void 0 ? _item$textContent : "",
				date: Number(item.getAttribute("date")) || 0,
				date_usec: Number(item.getAttribute("date_usec")) || 0,
				owner: !item.getAttribute("user_id"),
				premium: item.getAttribute("premium") === "1",
				mail: [],
				user_id: -1,
				layer: -1,
				is_my_post: false
			};
			if (item.getAttribute("mail")) {
				var _item$getAttribute$sp, _item$getAttribute;
				tmpParam.mail = (_item$getAttribute$sp = (_item$getAttribute = item.getAttribute("mail")) === null || _item$getAttribute === void 0 ? void 0 : _item$getAttribute.split(/\s+/g)) !== null && _item$getAttribute$sp !== void 0 ? _item$getAttribute$sp : [];
			}
			if (tmpParam.content.startsWith("/") && tmpParam.owner) tmpParam.mail.push("invisible");
			const userId = (_item$getAttribute2 = item.getAttribute("user_id")) !== null && _item$getAttribute2 !== void 0 ? _item$getAttribute2 : "";
			const isUserExist = userList.indexOf(userId);
			if (isUserExist === -1) {
				tmpParam.user_id = userList.length;
				userList.push(userId);
			} else tmpParam.user_id = isUserExist;
			data_.push(tmpParam);
		}
		return data_;
	};
	//#endregion
	//#region src/input/index.ts
	const parsers = [
		EmptyParser,
		FormattedParser,
		LegacyParser,
		LegacyOwnerParser,
		OwnerParser,
		V1Parser,
		Xml2jsParser,
		XmlDocumentParser
	];
	//#endregion
	//#region src/inputParser.ts
	var inputParser_exports = /* @__PURE__ */ __exportAll({ default: () => convert2formattedComment });
	/**
	* 入力されたデータを内部用のデータに変換
	* @param data 入力データ(XMLDocument/niconicome/formatted/legacy/owner/v1)
	* @param type 誤検出防止のため入力フォーマットは書かせる
	* @returns 変換後のデータを返す
	*/
	const convert2formattedComment = (data, type) => {
		const parser = parsers.find((parser) => parser.key.includes(type));
		if (!parser) throw new InvalidFormatError();
		return sort(parser.parse(data));
	};
	/**
	* 共通処理
	* 投稿時間、日時順にソート
	* ※破壊関数
	* @param data ソート対象の配列
	* @returns ソート後の配列
	*/
	const sort = (data) => {
		data.sort((a, b) => a.vpos - b.vpos || a.date - b.date || a.date_usec - b.date_usec);
		return data;
	};
	//#endregion
	//#region src/renderer/webgl2.ts
	const SPRITE_VERT = `#version 300 es
layout(location = 0) in vec2 aPosition;
uniform mat4 uProjection;
uniform vec4 uRect;
out vec2 vTexCoord;
void main() {
  vTexCoord = aPosition;
  vec2 pos = uRect.xy + aPosition * uRect.zw;
  gl_Position = uProjection * vec4(pos, 0.0, 1.0);
}`;
	const SPRITE_FRAG = `#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uTexture;
uniform float uAlpha;
out vec4 fragColor;
void main() {
  vec4 c = texture(uTexture, vTexCoord);
  fragColor = vec4(c.rgb * uAlpha, c.a * uAlpha);
}`;
	const RECT_VERT = `#version 300 es
layout(location = 0) in vec2 aPosition;
uniform mat4 uProjection;
uniform vec4 uRect;
void main() {
  vec2 pos = uRect.xy + aPosition * uRect.zw;
  gl_Position = uProjection * vec4(pos, 0.0, 1.0);
}`;
	const RECT_FRAG = `#version 300 es
precision mediump float;
uniform vec4 uColor;
out vec4 fragColor;
void main() {
  fragColor = uColor;
}`;
	const GC_INTERVAL_FRAMES = 60;
	const GC_MAX_IDLE_FRAMES = 300;
	const COLOR_CACHE_MAX_SIZE = 256;
	var WebGL2Renderer = class {
		constructor(canvas, video) {
			_defineProperty(this, "rendererName", "WebGL2Renderer");
			_defineProperty(this, "canvas", void 0);
			_defineProperty(this, "video", void 0);
			_defineProperty(this, "gl", void 0);
			_defineProperty(this, "spriteProg", void 0);
			_defineProperty(this, "spriteLocRect", void 0);
			_defineProperty(this, "spriteLocProj", void 0);
			_defineProperty(this, "spriteLocAlpha", void 0);
			_defineProperty(this, "rectProg", void 0);
			_defineProperty(this, "rectLocRect", void 0);
			_defineProperty(this, "rectLocProj", void 0);
			_defineProperty(this, "rectLocColor", void 0);
			_defineProperty(this, "quadVAO", void 0);
			_defineProperty(this, "quadBuf", void 0);
			_defineProperty(this, "maxTextureSize", void 0);
			_defineProperty(this, "tileCanvas", null);
			_defineProperty(this, "tileCtx", null);
			_defineProperty(this, "proj", new Float32Array(16));
			_defineProperty(this, "scaleX", 1);
			_defineProperty(this, "scaleY", 1);
			_defineProperty(this, "state", {
				alpha: 1,
				fillStyle: "#000000",
				strokeStyle: "#000000",
				lineWidth: 1,
				font: "10px sans-serif",
				scaleX: 1,
				scaleY: 1
			});
			_defineProperty(this, "stateStack", []);
			_defineProperty(this, "cmds", []);
			_defineProperty(this, "texMap", /* @__PURE__ */ new Map());
			_defineProperty(this, "frameCount", 0);
			_defineProperty(this, "helper", void 0);
			_defineProperty(this, "helperDirty", false);
			_defineProperty(this, "colorCtx", void 0);
			_defineProperty(this, "colorCache", /* @__PURE__ */ new Map());
			_defineProperty(this, "width", void 0);
			_defineProperty(this, "height", void 0);
			_defineProperty(this, "_onContextLost", void 0);
			_defineProperty(this, "_onContextRestored", void 0);
			this.canvas = canvas;
			this.video = video;
			this.width = canvas.width;
			this.height = canvas.height;
			const gl = canvas.getContext("webgl2", {
				alpha: true,
				premultipliedAlpha: true,
				antialias: false,
				depth: false,
				stencil: false,
				powerPreference: "high-performance"
			});
			if (!gl) throw new Error("WebGL2 not available");
			this.gl = gl;
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
			gl.viewport(0, 0, canvas.width, canvas.height);
			this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
			try {
				const glRes = this._initGLResources();
				this.spriteProg = glRes.spriteProg;
				this.spriteLocRect = glRes.spriteLocRect;
				this.spriteLocProj = glRes.spriteLocProj;
				this.spriteLocAlpha = glRes.spriteLocAlpha;
				this.rectProg = glRes.rectProg;
				this.rectLocRect = glRes.rectLocRect;
				this.rectLocProj = glRes.rectLocProj;
				this.rectLocColor = glRes.rectLocColor;
				this.quadVAO = glRes.quadVAO;
				this.quadBuf = glRes.quadBuf;
				this.helper = this._createHelper(canvas.width, canvas.height);
				const colorEl = document.createElement("canvas");
				colorEl.width = 1;
				colorEl.height = 1;
				const colorCtx = colorEl.getContext("2d");
				if (!colorCtx) throw new Error("Failed to create 2D context");
				this.colorCtx = colorCtx;
			} catch (e) {
				var _gl$getExtension;
				(_gl$getExtension = gl.getExtension("WEBGL_lose_context")) === null || _gl$getExtension === void 0 || _gl$getExtension.loseContext();
				throw e;
			}
			this._updateProjection();
			this._onContextLost = (e) => e.preventDefault();
			this._onContextRestored = () => {
				try {
					this._rebuildGLResources();
				} catch (e) {
					console.error("WebGL2Renderer: context restore failed, renderer is now inactive:", e);
					this.destroy();
				}
			};
			canvas.addEventListener("webglcontextlost", this._onContextLost);
			canvas.addEventListener("webglcontextrestored", this._onContextRestored);
		}
		_getUniformLocation(prog, name) {
			const loc = this.gl.getUniformLocation(prog, name);
			if (!loc) throw new Error(`Uniform ${name} not found`);
			return loc;
		}
		_createHelper(w, h) {
			const el = document.createElement("canvas");
			el.width = w;
			el.height = h;
			return new CanvasRenderer(el);
		}
		_createShader(type, source) {
			const gl = this.gl;
			const s = gl.createShader(type);
			if (!s) throw new Error("Failed to create shader");
			gl.shaderSource(s, source);
			gl.compileShader(s);
			if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
				const log = gl.getShaderInfoLog(s);
				gl.deleteShader(s);
				throw new Error(`Shader compile: ${log}`);
			}
			return s;
		}
		_createProgram(vs, fs) {
			const gl = this.gl;
			const p = gl.createProgram();
			if (!p) throw new Error("Failed to create program");
			try {
				const vShader = this._createShader(gl.VERTEX_SHADER, vs);
				const fShader = this._createShader(gl.FRAGMENT_SHADER, fs);
				gl.attachShader(p, vShader);
				gl.attachShader(p, fShader);
				gl.linkProgram(p);
				gl.deleteShader(vShader);
				gl.deleteShader(fShader);
				if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
					const log = gl.getProgramInfoLog(p);
					throw new Error(`Program link: ${log}`);
				}
				return p;
			} catch (e) {
				gl.deleteProgram(p);
				throw e;
			}
		}
		_initGLResources() {
			const gl = this.gl;
			const spriteProg = this._createProgram(SPRITE_VERT, SPRITE_FRAG);
			const spriteLocRect = this._getUniformLocation(spriteProg, "uRect");
			const spriteLocProj = this._getUniformLocation(spriteProg, "uProjection");
			const spriteLocAlpha = this._getUniformLocation(spriteProg, "uAlpha");
			const spriteLocTex = this._getUniformLocation(spriteProg, "uTexture");
			gl.useProgram(spriteProg);
			gl.uniform1i(spriteLocTex, 0);
			const rectProg = this._createProgram(RECT_VERT, RECT_FRAG);
			const rectLocRect = this._getUniformLocation(rectProg, "uRect");
			const rectLocProj = this._getUniformLocation(rectProg, "uProjection");
			const rectLocColor = this._getUniformLocation(rectProg, "uColor");
			const quadVAO = gl.createVertexArray();
			if (!quadVAO) throw new Error("Failed to create vertex array");
			const quadBuf = gl.createBuffer();
			if (!quadBuf) throw new Error("Failed to create buffer");
			gl.bindVertexArray(quadVAO);
			gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
				0,
				0,
				1,
				0,
				0,
				1,
				1,
				1
			]), gl.STATIC_DRAW);
			gl.enableVertexAttribArray(0);
			gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
			gl.bindVertexArray(null);
			gl.useProgram(null);
			return {
				spriteProg,
				spriteLocRect,
				spriteLocProj,
				spriteLocAlpha,
				rectProg,
				rectLocRect,
				rectLocProj,
				rectLocColor,
				quadVAO,
				quadBuf
			};
		}
		_updateProjection() {
			const w = this.canvas.width / this.scaleX;
			const h = this.canvas.height / this.scaleY;
			const p = this.proj;
			p.fill(0);
			p[0] = 2 / w;
			p[5] = -2 / h;
			p[10] = -1;
			p[12] = -1;
			p[13] = 1;
			p[15] = 1;
		}
		_parseColor(css) {
			var _d$, _d$2, _d$3, _d$4;
			const cached = this.colorCache.get(css);
			if (cached) return cached;
			this.colorCtx.clearRect(0, 0, 1, 1);
			this.colorCtx.fillStyle = css;
			this.colorCtx.fillRect(0, 0, 1, 1);
			const d = this.colorCtx.getImageData(0, 0, 1, 1).data;
			const result = [
				((_d$ = d[0]) !== null && _d$ !== void 0 ? _d$ : 0) / 255,
				((_d$2 = d[1]) !== null && _d$2 !== void 0 ? _d$2 : 0) / 255,
				((_d$3 = d[2]) !== null && _d$3 !== void 0 ? _d$3 : 0) / 255,
				((_d$4 = d[3]) !== null && _d$4 !== void 0 ? _d$4 : 0) / 255
			];
			if (this.colorCache.size >= COLOR_CACHE_MAX_SIZE) {
				const firstKey = this.colorCache.keys().next().value;
				if (firstKey !== void 0) this.colorCache.delete(firstKey);
			}
			this.colorCache.set(css, result);
			return result;
		}
		_createTexture(uploadSource) {
			const gl = this.gl;
			const tex = gl.createTexture();
			if (!tex) throw new Error("Failed to create texture");
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, uploadSource);
			return tex;
		}
		_extractTile(source, sx, sy, sw, sh) {
			if (!this.tileCanvas) {
				this.tileCanvas = document.createElement("canvas");
				this.tileCtx = this.tileCanvas.getContext("2d");
			}
			if (!this.tileCtx) throw new Error("Failed to create 2D context for tile");
			this.tileCanvas.width = sw;
			this.tileCanvas.height = sh;
			this.tileCtx.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
			return this.tileCanvas;
		}
		_buildTiles(source) {
			const gl = this.gl;
			const max = this.maxTextureSize;
			const w = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
			const h = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
			if (w <= 0 || h <= 0) return [];
			if (w <= max && h <= max) {
				const tex = this._createTexture(source);
				gl.bindTexture(gl.TEXTURE_2D, null);
				return [{
					tex,
					srcX: 0,
					srcY: 0,
					srcW: w,
					srcH: h
				}];
			}
			const tilesX = Math.ceil(w / max);
			const tilesY = Math.ceil(h / max);
			const tiles = [];
			try {
				for (let ty = 0; ty < tilesY; ty++) for (let tx = 0; tx < tilesX; tx++) {
					const srcX = tx * max;
					const srcY = ty * max;
					const srcW = Math.min(max, w - srcX);
					const srcH = Math.min(max, h - srcY);
					const tileCanvas = this._extractTile(source, srcX, srcY, srcW, srcH);
					const tex = this._createTexture(tileCanvas);
					tiles.push({
						tex,
						srcX,
						srcY,
						srcW,
						srcH
					});
				}
			} catch (e) {
				for (const tile of tiles) gl.deleteTexture(tile.tex);
				throw e;
			}
			gl.bindTexture(gl.TEXTURE_2D, null);
			return tiles;
		}
		_uploadTexture(source, forceUpload) {
			const gl = this.gl;
			let entry = this.texMap.get(source);
			if (!entry) {
				const w = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
				const h = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
				entry = {
					tiles: this._buildTiles(source),
					sourceW: w,
					sourceH: h,
					lastFrame: this.frameCount
				};
				this.texMap.set(source, entry);
				return entry;
			}
			if (forceUpload && entry.lastFrame < this.frameCount) {
				const oldTiles = entry.tiles;
				entry.tiles = this._buildTiles(source);
				for (const tile of oldTiles) gl.deleteTexture(tile.tex);
				const w = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
				const h = source instanceof HTMLVideoElement ? source.videoHeight : source.height;
				entry.sourceW = w;
				entry.sourceH = h;
			}
			entry.lastFrame = this.frameCount;
			return entry;
		}
		_deleteTiles(entry) {
			for (const tile of entry.tiles) this.gl.deleteTexture(tile.tex);
		}
		_gcTextures() {
			const threshold = this.frameCount - GC_MAX_IDLE_FRAMES;
			for (const [source, entry] of this.texMap) if (entry.lastFrame < threshold) {
				this._deleteTiles(entry);
				this.texMap.delete(source);
			}
		}
		_rebuildGLResources() {
			const gl = this.gl;
			this.texMap.clear();
			this.cmds.length = 0;
			this.helperDirty = false;
			gl.enable(gl.BLEND);
			gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
			gl.viewport(0, 0, this.canvas.width, this.canvas.height);
			const res = this._initGLResources();
			this.spriteProg = res.spriteProg;
			this.spriteLocRect = res.spriteLocRect;
			this.spriteLocProj = res.spriteLocProj;
			this.spriteLocAlpha = res.spriteLocAlpha;
			this.rectProg = res.rectProg;
			this.rectLocRect = res.rectLocRect;
			this.rectLocProj = res.rectLocProj;
			this.rectLocColor = res.rectLocColor;
			this.quadVAO = res.quadVAO;
			this.quadBuf = res.quadBuf;
		}
		save() {
			this.stateStack.push(_objectSpread2({}, this.state));
			this.helper.save();
		}
		restore() {
			const s = this.stateStack.pop();
			if (s) {
				const scaleChanged = s.scaleX !== this.state.scaleX || s.scaleY !== this.state.scaleY;
				this.state = s;
				this.scaleX = s.scaleX;
				this.scaleY = s.scaleY;
				if (scaleChanged) this._updateProjection();
			}
			this.helper.restore();
		}
		setScale(scale, arg1) {
			this.scaleX *= scale;
			this.scaleY *= arg1 !== null && arg1 !== void 0 ? arg1 : scale;
			this.state.scaleX = this.scaleX;
			this.state.scaleY = this.scaleY;
			this._updateProjection();
			this.helper.setScale(scale, arg1);
		}
		getFont() {
			return this.state.font;
		}
		setFont(font) {
			this.state.font = font;
		}
		getFillStyle() {
			return this.state.fillStyle;
		}
		setFillStyle(color) {
			this.state.fillStyle = color;
		}
		setStrokeStyle(color) {
			this.state.strokeStyle = color;
		}
		setLineWidth(width) {
			this.state.lineWidth = width;
		}
		setGlobalAlpha(alpha) {
			this.state.alpha = alpha;
		}
		setSize(width, height) {
			const oldEntry = this.texMap.get(this.helper.canvas);
			if (oldEntry) {
				this._deleteTiles(oldEntry);
				this.texMap.delete(this.helper.canvas);
			}
			this.helper.destroy();
			this.helperDirty = false;
			this.cmds.length = 0;
			this.stateStack.length = 0;
			this.width = width;
			this.height = height;
			this.canvas.width = width;
			this.canvas.height = height;
			this.gl.viewport(0, 0, width, height);
			this.scaleX = 1;
			this.scaleY = 1;
			this.state = {
				alpha: 1,
				fillStyle: "#000000",
				strokeStyle: "#000000",
				lineWidth: 1,
				font: "10px sans-serif",
				scaleX: 1,
				scaleY: 1
			};
			this._updateProjection();
			this.helper = this._createHelper(width, height);
		}
		getSize() {
			return {
				width: this.width,
				height: this.height
			};
		}
		getCanvas(padding = 0) {
			const inner = new CanvasRenderer(void 0, void 0, padding, () => {
				this.invalidateImage(inner);
			});
			return inner;
		}
		clearRect(x, y, w, h) {
			this.gl.clearColor(0, 0, 0, 0);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);
			this.cmds.length = 0;
			this.helper.clearRect(x, y, w, h);
			this.helperDirty = false;
		}
		drawImage(image, x, y, width, height) {
			const source = image.canvas;
			this.cmds.push({
				kind: 0,
				source,
				x,
				y,
				w: width !== null && width !== void 0 ? width : source.width,
				h: height !== null && height !== void 0 ? height : source.height,
				alpha: this.state.alpha
			});
		}
		fillRect(x, y, w, h) {
			let nx = x, ny = y, nw = w, nh = h;
			if (nw < 0) {
				nx += nw;
				nw = -nw;
			}
			if (nh < 0) {
				ny += nh;
				nh = -nh;
			}
			const [r, g, b, a] = this._parseColor(this.state.fillStyle);
			const ea = a * this.state.alpha;
			this.cmds.push({
				kind: 1,
				x: nx,
				y: ny,
				w: nw,
				h: nh,
				r: r * ea,
				g: g * ea,
				b: b * ea,
				a: ea
			});
		}
		strokeRect(x, y, w, h) {
			let nx = x, ny = y, nw = w, nh = h;
			if (nw < 0) {
				nx += nw;
				nw = -nw;
			}
			if (nh < 0) {
				ny += nh;
				nh = -nh;
			}
			const [r, g, b, a] = this._parseColor(this.state.strokeStyle);
			const ea = a * this.state.alpha;
			const lw = this.state.lineWidth;
			const half = lw / 2;
			const pr = r * ea, pg = g * ea, pb = b * ea;
			if (nh <= lw || nw <= lw) {
				this.cmds.push({
					kind: 1,
					x: nx - half,
					y: ny - half,
					w: nw + lw,
					h: nh + lw,
					r: pr,
					g: pg,
					b: pb,
					a: ea
				});
				return;
			}
			this.cmds.push({
				kind: 1,
				x: nx - half,
				y: ny - half,
				w: nw + lw,
				h: lw,
				r: pr,
				g: pg,
				b: pb,
				a: ea
			});
			this.cmds.push({
				kind: 1,
				x: nx - half,
				y: ny + nh - half,
				w: nw + lw,
				h: lw,
				r: pr,
				g: pg,
				b: pb,
				a: ea
			});
			this.cmds.push({
				kind: 1,
				x: nx - half,
				y: ny + half,
				w: lw,
				h: nh - lw,
				r: pr,
				g: pg,
				b: pb,
				a: ea
			});
			this.cmds.push({
				kind: 1,
				x: nx + nw - half,
				y: ny + half,
				w: lw,
				h: nh - lw,
				r: pr,
				g: pg,
				b: pb,
				a: ea
			});
		}
		drawVideo(enableLegacyPip) {
			if (!this.video || this.video.videoWidth === 0 || this.video.videoHeight === 0) return;
			let scale;
			const hRatio = this.canvas.height / this.video.videoHeight;
			const wRatio = this.canvas.width / this.video.videoWidth;
			if (enableLegacyPip ? hRatio > wRatio : hRatio < wRatio) scale = wRatio;
			else scale = hRatio;
			const offsetX = (this.canvas.width - this.video.videoWidth * scale) * .5;
			const offsetY = (this.canvas.height - this.video.videoHeight * scale) * .5;
			this.cmds.push({
				kind: 0,
				source: this.video,
				x: offsetX,
				y: offsetY,
				w: this.video.videoWidth * scale,
				h: this.video.videoHeight * scale,
				alpha: 1
			});
		}
		fillText(text, x, y) {
			this.helper.save();
			this.helper.setFont(this.state.font);
			this.helper.setFillStyle(this.state.fillStyle);
			this.helper.setGlobalAlpha(this.state.alpha);
			this.helper.fillText(text, x, y);
			this.helper.restore();
			this.helperDirty = true;
		}
		strokeText(text, x, y) {
			this.helper.save();
			this.helper.setFont(this.state.font);
			this.helper.setStrokeStyle(this.state.strokeStyle);
			this.helper.setLineWidth(this.state.lineWidth);
			this.helper.setGlobalAlpha(this.state.alpha);
			this.helper.strokeText(text, x, y);
			this.helper.restore();
			this.helperDirty = true;
		}
		measureText(text) {
			this.helper.save();
			this.helper.setFont(this.state.font);
			const result = this.helper.measureText(text);
			this.helper.restore();
			return result;
		}
		beginPath() {
			this.helper.beginPath();
		}
		closePath() {
			this.helper.closePath();
		}
		moveTo(x, y) {
			this.helper.moveTo(x, y);
		}
		lineTo(x, y) {
			this.helper.lineTo(x, y);
		}
		quadraticCurveTo(cpx, cpy, x, y) {
			this.helper.quadraticCurveTo(cpx, cpy, x, y);
		}
		stroke() {
			this.helper.save();
			this.helper.setStrokeStyle(this.state.strokeStyle);
			this.helper.setLineWidth(this.state.lineWidth);
			this.helper.setGlobalAlpha(this.state.alpha);
			this.helper.stroke();
			this.helper.restore();
			this.helperDirty = true;
		}
		flush() {
			const gl = this.gl;
			gl.bindVertexArray(this.quadVAO);
			try {
				let currentProg = null;
				for (const cmd of this.cmds) if (cmd.kind === 0) {
					if (currentProg !== this.spriteProg) {
						gl.useProgram(this.spriteProg);
						gl.uniformMatrix4fv(this.spriteLocProj, false, this.proj);
						currentProg = this.spriteProg;
					}
					gl.activeTexture(gl.TEXTURE0);
					const entry = this._uploadTexture(cmd.source, cmd.source instanceof HTMLVideoElement);
					const sx = cmd.w / entry.sourceW;
					const sy = cmd.h / entry.sourceH;
					for (const tile of entry.tiles) {
						gl.bindTexture(gl.TEXTURE_2D, tile.tex);
						gl.uniform4f(this.spriteLocRect, cmd.x + tile.srcX * sx, cmd.y + tile.srcY * sy, tile.srcW * sx, tile.srcH * sy);
						gl.uniform1f(this.spriteLocAlpha, cmd.alpha);
						gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
					}
				} else {
					if (currentProg !== this.rectProg) {
						gl.useProgram(this.rectProg);
						gl.uniformMatrix4fv(this.rectLocProj, false, this.proj);
						currentProg = this.rectProg;
					}
					gl.uniform4f(this.rectLocRect, cmd.x, cmd.y, cmd.w, cmd.h);
					gl.uniform4f(this.rectLocColor, cmd.r, cmd.g, cmd.b, cmd.a);
					gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
				}
				if (this.helperDirty) {
					if (currentProg !== this.spriteProg) {
						gl.useProgram(this.spriteProg);
						gl.uniformMatrix4fv(this.spriteLocProj, false, this.proj);
					}
					gl.activeTexture(gl.TEXTURE0);
					this.invalidateImage(this.helper);
					const helperEntry = this._uploadTexture(this.helper.canvas, false);
					const logicalW = this.canvas.width / this.scaleX;
					const logicalH = this.canvas.height / this.scaleY;
					for (const tile of helperEntry.tiles) {
						gl.bindTexture(gl.TEXTURE_2D, tile.tex);
						gl.uniform4f(this.spriteLocRect, tile.srcX / helperEntry.sourceW * logicalW, tile.srcY / helperEntry.sourceH * logicalH, tile.srcW / helperEntry.sourceW * logicalW, tile.srcH / helperEntry.sourceH * logicalH);
						gl.uniform1f(this.spriteLocAlpha, 1);
						gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
					}
				}
			} finally {
				gl.bindVertexArray(null);
				this.cmds.length = 0;
				this.helperDirty = false;
				this.frameCount++;
			}
			if (this.frameCount % GC_INTERVAL_FRAMES === 0) this._gcTextures();
		}
		invalidateImage(image) {
			if (!(image instanceof CanvasRenderer)) return;
			const entry = this.texMap.get(image.canvas);
			if (entry) {
				this._deleteTiles(entry);
				this.texMap.delete(image.canvas);
			}
		}
		destroy() {
			var _gl$getExtension2;
			const gl = this.gl;
			for (const entry of this.texMap.values()) this._deleteTiles(entry);
			this.texMap.clear();
			this.colorCache.clear();
			gl.deleteVertexArray(this.quadVAO);
			gl.deleteBuffer(this.quadBuf);
			gl.deleteProgram(this.spriteProg);
			gl.deleteProgram(this.rectProg);
			this.helper.destroy();
			this.tileCanvas = null;
			this.tileCtx = null;
			this.canvas.removeEventListener("webglcontextlost", this._onContextLost);
			this.canvas.removeEventListener("webglcontextrestored", this._onContextRestored);
			(_gl$getExtension2 = gl.getExtension("WEBGL_lose_context")) === null || _gl$getExtension2 === void 0 || _gl$getExtension2.loseContext();
		}
	};
	//#endregion
	//#region src/renderer/index.ts
	var renderer_exports = /* @__PURE__ */ __exportAll({
		CanvasRenderer: () => CanvasRenderer,
		WebGL2Renderer: () => WebGL2Renderer,
		createRenderer: () => createRenderer
	});
	function createRenderer(canvas, video) {
		try {
			return new WebGL2Renderer(canvas, video);
		} catch (e) {
			console.warn("WebGL2 initialisation failed, falling back to Canvas2D:", e);
			try {
				return new CanvasRenderer(canvas, video);
			} catch (err) {
				console.warn("Canvas2D context failed, creating fresh canvas:", err);
				const fresh = document.createElement("canvas");
				fresh.width = canvas.width;
				fresh.height = canvas.height;
				fresh.id = canvas.id;
				fresh.className = canvas.className;
				fresh.style.cssText = canvas.style.cssText;
				if (canvas.parentNode) canvas.replaceWith(fresh);
				return new CanvasRenderer(fresh, video);
			}
		}
	}
	//#endregion
	//#region src/utils/plugins.ts
	/**
	* コメントのインスタンスを生成する
	* @param comment コメント
	* @param context 描画対象のCanvasコンテキスト
	* @param index コメントのインデックス
	* @returns プラグインまたは内臓のコメントインスタンス
	*/
	const createCommentInstance = (comment, context, index) => {
		for (const plugin of config.commentPlugins) if (plugin.condition(comment)) return new plugin.class(comment, context, index);
		return new HTML5Comment(comment, context, index);
	};
	//#endregion
	//#region src/internal.ts
	var internal_exports = /* @__PURE__ */ __exportAll({
		comments: () => comments_exports,
		contexts: () => contexts_exports,
		definition: () => definition,
		errors: () => errors_exports,
		eventHandler: () => eventHandler_exports,
		inputParser: () => inputParser_exports,
		renderer: () => renderer_exports,
		typeGuard: () => typeGuard_exports,
		utils: () => utils_exports
	});
	const definition = {
		colors: colors_exports,
		config: config_exports,
		fonts: fonts_exports,
		initConfig: initConfig_exports
	};
	//#endregion
	//#region src/main.ts
	var _NiconiComments;
	const EMPTY_TIMELINE = Object.freeze([]);
	const BAN_FRAME_POSITION_RESOLUTION_BUDGET = 256;
	const toIntegerOrInfinity = (value) => {
		if (Number.isNaN(value) || value === 0) return 0;
		if (!Number.isFinite(value)) return value;
		return Math.trunc(value);
	};
	const getSliceBounds = (length, start, end) => {
		let startIndex = toIntegerOrInfinity(start);
		let endIndex = end === void 0 ? length : toIntegerOrInfinity(end);
		if (startIndex === -Infinity) startIndex = 0;
		else if (startIndex < 0) startIndex = Math.max(length + startIndex, 0);
		else startIndex = Math.min(startIndex, length);
		if (endIndex === -Infinity) endIndex = 0;
		else if (endIndex < 0) endIndex = Math.max(length + endIndex, 0);
		else endIndex = Math.min(endIndex, length);
		if (endIndex < startIndex) endIndex = startIndex;
		return {
			startIndex,
			endIndex
		};
	};
	const hasNakaComment = (items) => {
		let hasNaka = false;
		for (const item of items) if (item.loc === "naka") {
			hasNaka = true;
			break;
		}
		return hasNaka;
	};
	let activeInstanceCount = 0;
	var NiconiComments = class {
		get lastVposInt() {
			return Math.floor(this.lastVpos);
		}
		/**
		* NiconiComments Constructor
		* @param renderer 描画対象のキャンバス
		* @param data 描画用のコメント
		* @param initOptions 初期化オプション
		*/
		constructor(_renderer, data, initOptions = {}) {
			_defineProperty(this, "enableLegacyPiP", void 0);
			_defineProperty(this, "showCollision", void 0);
			_defineProperty(this, "showFPS", void 0);
			_defineProperty(this, "showCommentCount", void 0);
			_defineProperty(this, "activeInstanceRegistered", false);
			_defineProperty(this, "lastVpos", void 0);
			_defineProperty(this, "_cachedSplit", null);
			_defineProperty(this, "commentArrayIndexMap", void 0);
			_defineProperty(this, "processedCommentIndex", void 0);
			_defineProperty(this, "comments", void 0);
			_defineProperty(this, "renderer", void 0);
			_defineProperty(this, "collision", void 0);
			_defineProperty(this, "timeline", void 0);
			if (activeInstanceCount > 0) console.warn("Multiple NiconiComments instances detected in one runtime. Module-scoped nicoscript/active-state caches are shared and may affect each other.");
			const constructorStart = performance.now();
			initConfig();
			if (!typeGuard.config.initOptions(initOptions)) throw new InvalidOptionError();
			setOptions(Object.assign({}, defaultOptions, initOptions));
			setConfig(Object.assign({}, defaultConfig, options.config));
			setIsDebug(options.debug);
			resetImageCache();
			resetNicoScripts();
			resetRangePointers();
			let renderer = _renderer;
			if (renderer instanceof HTMLCanvasElement) renderer = createRenderer(renderer, options.video);
			else if (options.video) console.warn("options.video is ignored because renderer is not HTMLCanvasElement");
			this.renderer = renderer;
			logger(`renderer: ${renderer.rendererName}`);
			this.renderer.setLineWidth(getConfig(config.contextLineWidth, false));
			const rendererSize = this.renderer.getSize();
			this.renderer.setScale(rendererSize.width / config.canvasWidth, rendererSize.height / config.canvasHeight);
			let formatType = options.format;
			if (options.formatted) console.warn("Deprecated: options.formatted is no longer recommended. Please use options.format. https://xpadev-net.github.io/niconicomments/#p_format");
			if (formatType === "default") formatType = options.formatted ? "formatted" : "legacy";
			if (options.useLegacy) console.warn("Deprecated: options.useLegacy is no longer recommended. Please use options.mode. https://xpadev-net.github.io/niconicomments/#p_mode");
			if (options.mode === "default" && options.useLegacy) options.mode = "html5";
			const parsedData = convert2formattedComment(data, formatType);
			this.showCollision = options.showCollision;
			this.showFPS = options.showFPS;
			this.showCommentCount = options.showCommentCount;
			this.enableLegacyPiP = options.enableLegacyPiP;
			this.timeline = {};
			this.collision = {
				ue: {},
				shita: {},
				left: {},
				right: {}
			};
			this.lastVpos = -1;
			this.commentArrayIndexMap = /* @__PURE__ */ new WeakMap();
			this.processedCommentIndex = -1;
			this.comments = this.preRendering(parsedData);
			this._rebuildCommentArrayIndex(this.comments);
			this.activeInstanceRegistered = true;
			activeInstanceCount += 1;
			logger(`constructor complete: ${performance.now() - constructorStart}ms`);
		}
		/**
		* Releases this instance's module-scoped registration.
		* Call this when the instance is no longer used to avoid
		* spurious multi-instance warnings on future constructions.
		*/
		destroy() {
			if (!this.activeInstanceRegistered) return;
			this.activeInstanceRegistered = false;
			if (activeInstanceCount > 0) activeInstanceCount -= 1;
		}
		_rebuildCommentArrayIndex(comments) {
			this.commentArrayIndexMap = /* @__PURE__ */ new WeakMap();
			for (let i = 0, n = comments.length; i < n; i++) {
				const comment = comments[i];
				if (!comment) continue;
				this.commentArrayIndexMap.set(comment, i);
			}
		}
		/**
		* 事前に当たり判定を考慮してコメントの描画場所を決定する
		* @param _rawData コメントデータ
		* @returns コメントのインスタンス配列
		*/
		preRendering(_rawData) {
			let rawData = _rawData;
			const preRenderingStart = performance.now();
			if (options.keepCA) rawData = changeCALayer(rawData);
			let instances = rawData.reduce((pv, val, index) => {
				pv.push(createCommentInstance(val, this.renderer, index));
				return pv;
			}, []);
			this.getCommentPos(instances, instances.length, options.lazy);
			this.sortTimelineComment();
			const plugins = [];
			for (const plugin of config.plugins) try {
				const canvas = this.renderer.getCanvas();
				const pluginInstance = new plugin(canvas, instances);
				plugins.push({
					canvas,
					instance: pluginInstance
				});
				if (pluginInstance.transformComments) instances = pluginInstance.transformComments(instances);
			} catch (_e) {
				console.error("Failed to init plugin");
			}
			setPlugins(plugins);
			logger(`preRendering complete: ${performance.now() - preRenderingStart}ms`);
			return instances;
		}
		/**
		* 計算された描画サイズをもとに各コメントの配置位置を決定する
		* @param data コメントデータ
		* @param end 終了インデックス
		* @param lazy 遅延処理を行うか
		*/
		getCommentPos(data, end, lazy = false) {
			const getCommentPosStart = performance.now();
			const startIndex = this.processedCommentIndex + 1;
			if (startIndex >= end) return;
			for (let i = startIndex; i < end; i++) {
				const comment = data[i];
				if (!comment) continue;
				this.processedCommentIndex = i;
				if (comment.invisible || comment.posY > -1 && !lazy) continue;
				if (comment.loc === "naka") processMovableComment(comment, this.collision, this.timeline, lazy);
				else processFixedComment(comment, this.collision[comment.loc], this.timeline, lazy);
			}
			if (lazy) this.processedCommentIndex = -1;
			logger(`getCommentPos complete: ${performance.now() - getCommentPosStart}ms`);
		}
		/**
		* 投稿者コメントを前に移動
		*/
		sortTimelineComment() {
			const sortCommentStart = performance.now();
			for (const vpos of Object.keys(this.timeline)) {
				const item = this.timeline[Number(vpos)];
				if (!item) continue;
				item.sort((a, b) => Number(a.owner) - Number(b.owner) || a.index - b.index);
			}
			logger(`parseData complete: ${performance.now() - sortCommentStart}ms`);
		}
		/**
		* 動的にコメント追加する
		* ※すでに存在するコメントの位置はvposに関係なく更新されません
		* @param rawComments コメントデータ
		*/
		addComments(...rawComments) {
			resetRangePointers();
			const comments = rawComments.reduce((pv, val, index) => {
				pv.push(createCommentInstance(val, this.renderer, this.comments.length + index));
				return pv;
			}, []);
			for (const plugin of plugins) try {
				var _plugin$instance$addC, _plugin$instance;
				(_plugin$instance$addC = (_plugin$instance = plugin.instance).addComments) === null || _plugin$instance$addC === void 0 || _plugin$instance$addC.call(_plugin$instance, comments);
			} catch (e) {
				console.error("Failed to add comments", e);
			}
			for (const comment of comments) {
				if (comment.invisible) continue;
				if (comment.loc === "naka") processMovableComment(comment, this.collision, this.timeline);
				else processFixedComment(comment, this.collision[comment.loc], this.timeline);
			}
			this.comments.push(...comments);
			const baseOffset = this.comments.length - comments.length;
			for (let i = 0, n = comments.length; i < n; i++) {
				const comment = comments[i];
				if (!comment) continue;
				this.commentArrayIndexMap.set(comment, baseOffset + i);
			}
			if (!options.lazy) {
				const prePushTail = baseOffset - 1;
				if (this.processedCommentIndex < prePushTail) this.getCommentPos(this.comments, prePushTail + 1);
				this.processedCommentIndex = Math.max(this.processedCommentIndex, this.comments.length - 1);
			}
			this.sortTimelineComment();
			this._cachedSplit = null;
		}
		/**
		* キャンバスを描画する
		* @param vpos 動画の現在位置の100倍 ニコニコから吐き出されるコメントの位置情報は主にこれ
		* @param forceRendering キャッシュを使用せずに再描画を強制するか
		* @param cursor カーソルの位置
		* @returns 再描画されたか
		*/
		drawCanvas(vpos, forceRendering = false, cursor) {
			var _this$timeline$vposIn, _this$timeline$this$l, _this$_cachedSplit;
			const profile = isDebug ? {
				triggerHandler: 0,
				drawVideo: 0,
				drawPlugins: 0,
				drawCollision: 0,
				drawComments: 0,
				drawFPS: 0,
				drawCommentCount: 0,
				flush: 0,
				total: 0
			} : void 0;
			const setProfile = (key, start) => {
				if (profile) profile[key] = performance.now() - start;
			};
			const vposInt = Math.floor(vpos);
			const drawCanvasStart = performance.now();
			if (this.lastVpos === vpos && !forceRendering) return false;
			const triggerHandlerStart = profile ? performance.now() : 0;
			triggerHandler(vposInt, this.lastVposInt);
			setProfile("triggerHandler", triggerHandlerStart);
			const timelineRange = (_this$timeline$vposIn = this.timeline[vposInt]) !== null && _this$timeline$vposIn !== void 0 ? _this$timeline$vposIn : EMPTY_TIMELINE;
			const lastTimelineRange = (_this$timeline$this$l = this.timeline[this.lastVposInt]) !== null && _this$timeline$this$l !== void 0 ? _this$timeline$this$l : EMPTY_TIMELINE;
			const currentHasNaka = hasNakaComment(timelineRange);
			const lastHasNaka = ((_this$_cachedSplit = this._cachedSplit) === null || _this$_cachedSplit === void 0 ? void 0 : _this$_cachedSplit.vpos) === this.lastVposInt ? this._cachedSplit.hasNaka : hasNakaComment(lastTimelineRange);
			this._cachedSplit = {
				vpos: vposInt,
				hasNaka: currentHasNaka
			};
			if (!forceRendering && plugins.length === 0 && !currentHasNaka && !lastHasNaka) {
				if (arrayEqual(timelineRange, lastTimelineRange)) return false;
			}
			this.renderer.clearRect(0, 0, config.canvasWidth, config.canvasHeight);
			this.lastVpos = vpos;
			const drawVideoStart = profile ? performance.now() : 0;
			this._drawVideo();
			setProfile("drawVideo", drawVideoStart);
			const drawPluginsStart = profile ? performance.now() : 0;
			for (const plugin of plugins) try {
				var _plugin$instance$draw, _plugin$instance2;
				if (((_plugin$instance$draw = (_plugin$instance2 = plugin.instance).draw) === null || _plugin$instance$draw === void 0 ? void 0 : _plugin$instance$draw.call(_plugin$instance2, vpos)) !== false) this.renderer.invalidateImage(plugin.canvas);
				this.renderer.drawImage(plugin.canvas, 0, 0);
			} catch (e) {
				console.error("Failed to draw comments", e);
			}
			setProfile("drawPlugins", drawPluginsStart);
			const drawCollisionStart = profile ? performance.now() : 0;
			this._drawCollision(vposInt);
			setProfile("drawCollision", drawCollisionStart);
			const drawCommentsStart = profile ? performance.now() : 0;
			const drawnCount = this._drawComments(timelineRange, vpos, cursor);
			setProfile("drawComments", drawCommentsStart);
			const drawFPSStart = profile ? performance.now() : 0;
			this._drawFPS(drawCanvasStart);
			setProfile("drawFPS", drawFPSStart);
			const drawCommentCountStart = profile ? performance.now() : 0;
			this._drawCommentCount(drawnCount);
			setProfile("drawCommentCount", drawCommentCountStart);
			const flushStart = profile ? performance.now() : 0;
			this.renderer.flush();
			setProfile("flush", flushStart);
			if (profile) {
				profile.total = performance.now() - drawCanvasStart;
				logger(`drawCanvas profile: trigger=${profile.triggerHandler.toFixed(2)}ms, video=${profile.drawVideo.toFixed(2)}ms, plugins=${profile.drawPlugins.toFixed(2)}ms, collision=${profile.drawCollision.toFixed(2)}ms, comments=${profile.drawComments.toFixed(2)}ms, fps=${profile.drawFPS.toFixed(2)}ms, count=${profile.drawCommentCount.toFixed(2)}ms, flush=${profile.flush.toFixed(2)}ms, total=${profile.total.toFixed(2)}ms`);
			} else logger(`drawCanvas complete: ${performance.now() - drawCanvasStart}ms`);
			return true;
		}
		/**
		* 背景動画が設定されている場合に描画する
		*/
		_drawVideo() {
			this.renderer.drawVideo(this.enableLegacyPiP);
		}
		/**
		* コメントを描画する
		* @param timelineRange 指定されたvposに存在するコメント
		* @param vpos vpos
		* @param cursor カーソルの位置
		* @returns 描画したコメント数
		*/
		_drawComments(timelineRange, vpos, cursor) {
			let startIndex = 0;
			let endIndex = timelineRange.length;
			if (config.commentLimit !== void 0) if (config.hideCommentOrder === "asc") ({startIndex, endIndex} = getSliceBounds(timelineRange.length, -config.commentLimit));
			else ({startIndex, endIndex} = getSliceBounds(timelineRange.length, 0, config.commentLimit));
			const frameActiveState = {
				banActive: isBanActive(vpos),
				reverseActiveOwner: isReverseActive(vpos, true),
				reverseActiveViewer: isReverseActive(vpos, false)
			};
			if (frameActiveState.banActive && !options.lazy) return 0;
			let maxCommentOffset = -1;
			let requiresFullScan = false;
			for (let i = startIndex; i < endIndex; i++) {
				const comment = timelineRange[i];
				if (!comment || comment.invisible) continue;
				const commentOffset = this.commentArrayIndexMap.get(comment);
				if (commentOffset === void 0) {
					requiresFullScan = true;
					break;
				}
				if (maxCommentOffset < commentOffset) maxCommentOffset = commentOffset;
			}
			if (frameActiveState.banActive) {
				const resolutionEnd = this.processedCommentIndex + 1 + BAN_FRAME_POSITION_RESOLUTION_BUDGET;
				if (requiresFullScan && this.processedCommentIndex < this.comments.length - 1) this.getCommentPos(this.comments, Math.min(this.comments.length, resolutionEnd));
				else if (maxCommentOffset >= 0 && this.processedCommentIndex < maxCommentOffset) this.getCommentPos(this.comments, Math.min(maxCommentOffset + 1, resolutionEnd));
				return 0;
			}
			if (requiresFullScan && this.processedCommentIndex < this.comments.length - 1) this.getCommentPos(this.comments, this.comments.length);
			else if (requiresFullScan) logger("_drawComments: requiresFullScan with no unprocessed comments — possible plugin side-effect");
			else if (maxCommentOffset >= 0 && this.processedCommentIndex < maxCommentOffset) this.getCommentPos(this.comments, maxCommentOffset + 1);
			const guardUnregisteredUnresolved = requiresFullScan;
			let drawnCount = 0;
			for (let i = startIndex; i < endIndex; i++) {
				const comment = timelineRange[i];
				if (!comment || comment.invisible) continue;
				if (guardUnregisteredUnresolved) {
					if (this.commentArrayIndexMap.get(comment) === void 0 && comment.posY < 0) {
						logger("_drawComments: skip unresolved unregistered comment (possible plugin-injected entry)");
						continue;
					}
				}
				comment.draw(vpos, this.showCollision, cursor, frameActiveState);
				drawnCount += 1;
			}
			return drawnCount;
		}
		/**
		* 当たり判定を描画する
		* @param vpos vpos
		*/
		_drawCollision(vpos) {
			if (this.showCollision) {
				this.renderer.save();
				const leftCollision = this.collision.left[vpos];
				const rightCollision = this.collision.right[vpos];
				this.renderer.setFillStyle("red");
				if (leftCollision) for (const comment of leftCollision) this.renderer.fillRect(config.collisionRange.left, comment.posY, getConfig(config.contextLineWidth, comment.flash), comment.height);
				if (rightCollision) for (const comment of rightCollision) this.renderer.fillRect(config.collisionRange.right, comment.posY, getConfig(config.contextLineWidth, comment.flash) * -1, comment.height);
				this.renderer.restore();
			}
		}
		/**
		* FPSを描画する
		* @param drawCanvasStart 処理を開始した時間(ms)
		*/
		_drawFPS(drawCanvasStart) {
			if (this.showFPS) {
				this.renderer.save();
				this.renderer.setFont(parseFont("defont", 60));
				this.renderer.setFillStyle("#00FF00");
				this.renderer.setStrokeStyle(`rgba(${hex2rgb(config.contextStrokeColor).join(",")},${config.contextStrokeOpacity})`);
				const drawTime = Math.floor(performance.now() - drawCanvasStart);
				const fps = Math.floor(1e3 / (drawTime === 0 ? 1 : drawTime));
				this.renderer.strokeText(`FPS:${fps}(${drawTime}ms)`, 100, 100);
				this.renderer.fillText(`FPS:${fps}(${drawTime}ms)`, 100, 100);
				this.renderer.restore();
			}
		}
		/**
		* 描画されたコメント数を描画する
		* @param count コメント描画数
		*/
		_drawCommentCount(count) {
			if (this.showCommentCount) {
				this.renderer.save();
				this.renderer.setFont(parseFont("defont", 60));
				this.renderer.setFillStyle("#00FF00");
				this.renderer.setStrokeStyle(`rgba(${hex2rgb(config.contextStrokeColor).join(",")},${config.contextStrokeOpacity})`);
				this.renderer.strokeText(`Count:${count !== null && count !== void 0 ? count : 0}`, 100, 200);
				this.renderer.fillText(`Count:${count !== null && count !== void 0 ? count : 0}`, 100, 200);
				this.renderer.restore();
			}
		}
		/**
		* イベントハンドラを追加
		* @template K
		* @param eventName イベント名
		* @param handler イベントハンドラ
		*/
		addEventListener(eventName, handler) {
			registerHandler(eventName, handler);
		}
		/**
		* イベントハンドラを削除
		* @template K
		* @param eventName イベント名
		* @param handler イベントハンドラ
		*/
		removeEventListener(eventName, handler) {
			removeHandler(eventName, handler);
		}
		/**
		* キャンバスを消去する
		*/
		clear() {
			const size = this.renderer.getSize();
			this.renderer.clearRect(0, 0, size.width, size.height);
		}
		/**
		* \@ボタンの呼び出し用
		* @param vpos 再生位置
		* @param pos カーソルの位置
		*/
		click(vpos, pos) {
			const _comments = this.timeline[vpos];
			if (!_comments) return;
			for (let i = _comments.length - 1; i >= 0; i--) {
				const comment = _comments[i];
				if (!comment) continue;
				if (comment.isHovered(pos)) {
					const newComment = buildAtButtonComment(comment.comment, vpos);
					if (!newComment) continue;
					this.addComments(newComment);
				}
			}
		}
	};
	_NiconiComments = NiconiComments;
	_defineProperty(NiconiComments, "typeGuard", typeGuard);
	_defineProperty(NiconiComments, "default", _NiconiComments);
	_defineProperty(NiconiComments, "FlashComment", {
		condition: isFlashComment,
		class: FlashComment
	});
	_defineProperty(NiconiComments, "internal", internal_exports);
	const logger = (msg) => {
		if (isDebug) console.debug(msg);
	};
	//#endregion
	return NiconiComments;
});
