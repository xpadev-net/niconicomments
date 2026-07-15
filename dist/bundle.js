/*!
niconicomments.js v0.3.1
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
	//#region \0@oxc-project+runtime@0.134.0/helpers/esm/typeof.js
	function _typeof(o) {
		"@babel/helpers - typeof";
		return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function(o) {
			return typeof o;
		} : function(o) {
			return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
		}, _typeof(o);
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.134.0/helpers/esm/toPrimitive.js
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
	//#region \0@oxc-project+runtime@0.134.0/helpers/esm/toPropertyKey.js
	function toPropertyKey(t) {
		var i = toPrimitive(t, "string");
		return "symbol" == _typeof(i) ? i : i + "";
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.134.0/helpers/esm/defineProperty.js
	function _defineProperty(e, r, t) {
		return (r = toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
			value: t,
			enumerable: !0,
			configurable: !0,
			writable: !0
		}) : e[r] = t, e;
	}
	//#endregion
	//#region \0@oxc-project+runtime@0.134.0/helpers/esm/objectSpread2.js
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
	const DEFAULT_CONFIG = {
		lang: void 0,
		message: void 0,
		abortEarly: void 0,
		abortPipeEarly: void 0
	};
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
		if (!config$1 && true) return DEFAULT_CONFIG;
		return {
			lang: (_config$1$lang = config$1 === null || config$1 === void 0 ? void 0 : config$1.lang) !== null && _config$1$lang !== void 0 ? _config$1$lang : void 0,
			message: config$1 === null || config$1 === void 0 ? void 0 : config$1.message,
			abortEarly: (_config$1$abortEarly = config$1 === null || config$1 === void 0 ? void 0 : config$1.abortEarly) !== null && _config$1$abortEarly !== void 0 ? _config$1$abortEarly : void 0,
			abortPipeEarly: (_config$1$abortPipeEa = config$1 === null || config$1 === void 0 ? void 0 : config$1.abortPipeEarly) !== null && _config$1$abortPipeEa !== void 0 ? _config$1$abortPipeEa : void 0
		};
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
		const message$1 = (_ref3 = (_ref4 = (_ref5 = (_ref6 = (_other$message = other === null || other === void 0 ? void 0 : other.message) !== null && _other$message !== void 0 ? _other$message : context.message) !== null && _ref6 !== void 0 ? _ref6 : (context.reference, issue.lang, void 0)) !== null && _ref5 !== void 0 ? _ref5 : isSchema ? (issue.lang, void 0) : null) !== null && _ref4 !== void 0 ? _ref4 : config$1.message) !== null && _ref3 !== void 0 ? _ref3 : (issue.lang, void 0);
		if (message$1 !== void 0) issue.message = typeof message$1 === "function" ? message$1(issue) : message$1;
		if (isSchema) dataset.typed = false;
		if (dataset.issues) dataset.issues.push(issue);
		else dataset.issues = [issue];
	}
	const _standardCache = /* @__PURE__ */ new WeakMap();
	/**
	* Returns the Standard Schema properties.
	*
	* @param context The schema context.
	*
	* @returns The Standard Schema properties.
	*/
	/* @__NO_SIDE_EFFECTS__ */
	function _getStandardProps(context) {
		let cached = _standardCache.get(context);
		if (!cached) {
			cached = {
				version: 1,
				vendor: "valibot",
				validate(value$1) {
					return context["~run"]({ value: value$1 }, /* @__PURE__ */ getGlobalConfig());
				}
			};
			_standardCache.set(context, cached);
		}
		return cached;
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
		return Object.prototype.hasOwnProperty.call(object$1, key) && key !== "__proto__" && key !== "prototype" && key !== "constructor";
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
	const ABORT_EARLY_CONFIG = { abortEarly: true };
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
		return !schema["~run"]({ value: input }, ABORT_EARLY_CONFIG).issues;
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
				const nextValue = _objectSpread2({}, value1);
				for (const key in value2) if (key in value1) {
					const dataset = /* @__PURE__ */ _merge(value1[key], value2[key]);
					if (dataset.issue) return dataset;
					nextValue[key] = dataset.value;
				} else nextValue[key] = value2[key];
				return { value: nextValue };
			}
			if (Array.isArray(value1) && Array.isArray(value2)) {
				if (value1.length === value2.length) {
					const nextValue = [...value1];
					for (let index = 0; index < value1.length; index++) {
						const dataset = /* @__PURE__ */ _merge(value1[index], value2[index]);
						if (dataset.issue) return dataset;
						nextValue[index] = dataset.value;
					}
					return { value: nextValue };
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
							if (dataset.issues) for (const issue of optionDataset.issues) dataset.issues.push(issue);
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
		if (datasets) for (const dataset of datasets) if (issues) for (const issue of dataset.issues) issues.push(issue);
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
	//#region src/@types/format.numeric.ts
	const MAX_SAFE_TIMELINE_VALUE = Number.MAX_SAFE_INTEGER;
	const MIN_SAFE_TIMELINE_VALUE = Number.MIN_SAFE_INTEGER;
	const isFiniteNumberInRange$1 = (value, { min = 0, max = MAX_SAFE_TIMELINE_VALUE, integer = true } = {}) => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value));
	const rangedNumber = (options) => /* @__PURE__ */ pipe(/* @__PURE__ */ number(), /* @__PURE__ */ check((value) => isFiniteNumberInRange$1(value, options)));
	const ZCommentId = rangedNumber();
	const ZCommentVpos = rangedNumber({ min: MIN_SAFE_TIMELINE_VALUE });
	const ZCommentDate = rangedNumber();
	const ZCommentDateUsec = rangedNumber({ max: 999999 });
	const ZCommentUserId = rangedNumber({ min: -1 });
	const ZCommentLayer = rangedNumber({ min: -1 });
	const ZCommentScore = rangedNumber({ min: MIN_SAFE_TIMELINE_VALUE });
	const toFiniteNumberInRange = (value, options) => {
		if (value === null || value === void 0 || typeof value === "string" && value.trim() === "") return;
		const numericValue = typeof value === "number" ? value : Number(value);
		return isFiniteNumberInRange$1(numericValue, options) ? numericValue : void 0;
	};
	//#endregion
	//#region src/@types/format.formatted.ts
	const ZFormattedComment = /* @__PURE__ */ object({
		id: /* @__PURE__ */ optional(ZCommentId, 0),
		vpos: /* @__PURE__ */ optional(ZCommentVpos, 0),
		content: /* @__PURE__ */ optional(/* @__PURE__ */ string(), ""),
		date: /* @__PURE__ */ optional(ZCommentDate, 0),
		date_usec: /* @__PURE__ */ optional(ZCommentDateUsec, 0),
		owner: /* @__PURE__ */ optional(/* @__PURE__ */ boolean(), false),
		premium: /* @__PURE__ */ optional(/* @__PURE__ */ boolean(), false),
		mail: /* @__PURE__ */ optional(/* @__PURE__ */ array(/* @__PURE__ */ string()), []),
		user_id: /* @__PURE__ */ optional(ZCommentUserId, 0),
		layer: /* @__PURE__ */ optional(ZCommentLayer, -1),
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
		no: /* @__PURE__ */ optional(ZCommentId, 0),
		vpos: ZCommentVpos,
		date: /* @__PURE__ */ optional(ZCommentDate, 0),
		date_usec: /* @__PURE__ */ optional(ZCommentDateUsec, 0),
		nicoru: /* @__PURE__ */ optional(ZCommentId, 0),
		premium: /* @__PURE__ */ optional(ZCommentId, 0),
		anonymity: /* @__PURE__ */ optional(ZCommentId, 0),
		user_id: /* @__PURE__ */ optional(/* @__PURE__ */ string(), ""),
		mail: /* @__PURE__ */ optional(/* @__PURE__ */ string(), ""),
		content: /* @__PURE__ */ string(),
		deleted: /* @__PURE__ */ optional(ZCommentId, 0)
	});
	const ZRawApiResponse = /* @__PURE__ */ record(/* @__PURE__ */ string(), /* @__PURE__ */ unknown());
	/**
	* @deprecated
	*/
	const ZApiPing = /* @__PURE__ */ object({ content: /* @__PURE__ */ string() });
	/**
	* @deprecated
	*/
	const ZApiThread = /* @__PURE__ */ object({
		resultcode: ZCommentId,
		thread: /* @__PURE__ */ string(),
		server_time: ZCommentDate,
		ticket: /* @__PURE__ */ string(),
		revision: ZCommentId
	});
	/**
	* @deprecated
	*/
	const ZApiLeaf = /* @__PURE__ */ object({
		thread: /* @__PURE__ */ string(),
		count: ZCommentId
	});
	/**
	* @deprecated
	*/
	const ZApiGlobalNumRes = /* @__PURE__ */ object({
		thread: /* @__PURE__ */ string(),
		num_res: ZCommentId
	});
	//#endregion
	//#region src/@types/format.owner.ts
	const ZOwnerComment = /* @__PURE__ */ object({
		time: /* @__PURE__ */ string(),
		command: /* @__PURE__ */ optional(/* @__PURE__ */ string(), ""),
		comment: /* @__PURE__ */ string()
	});
	//#endregion
	//#region src/@types/format.v1.ts
	const ZV1Comment = /* @__PURE__ */ object({
		id: /* @__PURE__ */ string(),
		no: ZCommentId,
		vposMs: ZCommentVpos,
		body: /* @__PURE__ */ string(),
		commands: /* @__PURE__ */ array(/* @__PURE__ */ string()),
		userId: /* @__PURE__ */ string(),
		isPremium: /* @__PURE__ */ boolean(),
		score: ZCommentScore,
		postedAt: /* @__PURE__ */ string(),
		nicoruCount: ZCommentId,
		nicoruId: /* @__PURE__ */ nullable(/* @__PURE__ */ string()),
		source: /* @__PURE__ */ string(),
		isMyPost: /* @__PURE__ */ boolean()
	});
	const ZV1Thread = /* @__PURE__ */ object({
		id: /* @__PURE__ */ unknown(),
		fork: /* @__PURE__ */ string(),
		commentCount: /* @__PURE__ */ optional(ZCommentId, 0),
		comments: /* @__PURE__ */ array(ZV1Comment)
	});
	//#endregion
	//#region src/@types/format.xml2js.ts
	const ZXml2jsChatItem = /* @__PURE__ */ object({
		_: /* @__PURE__ */ optional(/* @__PURE__ */ string(), ""),
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
	* @param config インスタンス設定
	* @returns 枠色
	*/
	const getStrokeColor = (comment, config) => {
		if (comment.strokeColor) {
			const color = comment.strokeColor.slice(1);
			const length = color.length;
			if (length === 3 || length === 6) return `rgba(${hex2rgb(color).join(",")},${config.contextStrokeOpacity})`;
			if (length === 4 || length === 8) return `rgba(${hex2rgba(color).join(",")})`;
		}
		return `rgba(${hex2rgb(comment.color === "#000000" ? config.contextStrokeInversionColor : config.contextStrokeColor).join(",")},${config.contextStrokeOpacity})`;
	};
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
	const MAX_OPTION_SCALE = 8;
	const MAX_CANVAS_DIMENSION$1 = 8192;
	const MAX_CANVAS_AREA$1 = 16777216;
	const MAX_FONT_SIZE = 512;
	const MAX_LINE_HEIGHT = 16;
	const MAX_COMMENT_LIMIT = 1e4;
	const MAX_COMMENT_LINE_COUNT = 256;
	const MAX_COMMENT_RANGE = 864e5;
	const MAX_UNIX_TIME_SECONDS = 4102444800;
	const MAX_CONFIG_RATIO = 64;
	const MAX_CONFIG_SPACING = 1024;
	const COMMENT_SIZES = [
		"big",
		"medium",
		"small"
	];
	const RESIZED_KEYS = ["default", "resized"];
	const FLASH_CHAR_KEYS = [
		"simsunStrong",
		"simsunWeak",
		"gulim",
		"gothic"
	];
	const FLASH_SCRIPT_CHAR_KEYS = ["super", "sub"];
	const FLASH_FONT_KEYS = ["gulim", "simsun"];
	const HTML5_FONT_KEYS = [
		"gothic",
		"mincho",
		"defont"
	];
	const FLASH_SPACER_FONT_KEYS = [
		"gulim",
		"simsun",
		"defont"
	];
	const COLOR_CODE_PATTERN = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
	/**
	* 入力がBooleanかどうかを返す
	* @param i 入力
	* @returns 入力がBooleanかどうか
	*/
	const isBoolean = (i) => typeof i === "boolean";
	const isRecord = (i) => typeof i === "object" && i !== null;
	const isPlainRecord = (i) => isRecord(i) && !Array.isArray(i) && (Object.getPrototypeOf(i) === Object.prototype || Object.getPrototypeOf(i) === null);
	const isFiniteNumberInRange = (i, { min = 0, max, integer = false }) => typeof i === "number" && Number.isFinite(i) && i >= min && i <= max && (!integer || Number.isInteger(i));
	const isValidOptionScale = (i) => isFiniteNumberInRange(i, {
		min: Number.MIN_VALUE,
		max: MAX_OPTION_SCALE
	});
	const isMode = (i) => i === "default" || i === "html5" || i === "flash";
	const isHideCommentOrder = (i) => i === "asc" || i === "desc";
	const isBoundedSpacing = (i) => isFiniteNumberInRange(i, { max: MAX_CONFIG_SPACING });
	const isBoundedOffset = (i) => isFiniteNumberInRange(i, {
		min: -1024,
		max: MAX_CONFIG_SPACING
	});
	const hasConfigKeys = (item, keys) => keys.every((key) => Object.hasOwn(item, key));
	const hasOnlyConfigKeys = (item, keys) => Object.keys(item).every((key) => keys.includes(key));
	const isColorCode = (item) => typeof item === "string" && COLOR_CODE_PATTERN.test(item);
	const isRegexSource = (item) => {
		if (typeof item !== "string") return false;
		try {
			new RegExp(item);
			return true;
		} catch (_unused) {
			return false;
		}
	};
	const isBoundedNumberConfigItem = (item, validate) => {
		if (validate(item)) return true;
		if (!isRecord(item) || !hasConfigKeys(item, ["html5", "flash"])) return false;
		return validate(item.html5) && validate(item.flash);
	};
	const isBoundedResizedItem = (item, validate) => {
		if (!isRecord(item) || !hasConfigKeys(item, RESIZED_KEYS)) return false;
		return RESIZED_KEYS.every((key) => validate(item[key]));
	};
	const isBoundedSizeItem = (item, validate) => {
		if (!isRecord(item) || !hasConfigKeys(item, COMMENT_SIZES)) return false;
		return COMMENT_SIZES.every((size) => validate(item[size]));
	};
	const isBoundedFontSizeConfig = (item) => isBoundedNumberConfigItem(item, (value) => isBoundedSizeItem(value, (sizeValue) => isBoundedResizedItem(sizeValue, (resizedValue) => isFiniteNumberInRange(resizedValue, {
		min: Number.MIN_VALUE,
		max: MAX_FONT_SIZE
	}))));
	const isBoundedLineHeightConfig = (item) => isBoundedNumberConfigItem(item, (value) => isBoundedSizeItem(value, (sizeValue) => isBoundedResizedItem(sizeValue, (resizedValue) => isFiniteNumberInRange(resizedValue, {
		min: Number.MIN_VALUE,
		max: MAX_LINE_HEIGHT
	}))));
	const isBoundedLineCountsConfig = (item) => isBoundedNumberConfigItem(item, (value) => {
		if (!isRecord(value) || !hasConfigKeys(value, [
			"default",
			"resized",
			"doubleResized"
		])) return false;
		return [
			"default",
			"resized",
			"doubleResized"
		].every((key) => isBoundedSizeItem(value[key], (count) => isFiniteNumberInRange(count, {
			min: Number.MIN_VALUE,
			max: MAX_COMMENT_LINE_COUNT
		})));
	});
	const isBoundedCommentStageSizeConfig = (item) => isBoundedNumberConfigItem(item, (value) => {
		if (!isRecord(value) || !hasConfigKeys(value, [
			"width",
			"fullWidth",
			"height"
		])) return false;
		return [
			"width",
			"fullWidth",
			"height"
		].every((key) => isFiniteNumberInRange(value[key], {
			min: Number.MIN_VALUE,
			max: MAX_CANVAS_DIMENSION$1
		}));
	});
	const isBoundedCollisionRange = (item) => isRecord(item) && hasConfigKeys(item, ["left", "right"]) && isFiniteNumberInRange(item.left, { max: MAX_CANVAS_DIMENSION$1 }) && isFiniteNumberInRange(item.right, { max: MAX_CANVAS_DIMENSION$1 });
	const isBoundedLineBreakCount = (item) => isBoundedSizeItem(item, (count) => isFiniteNumberInRange(count, {
		min: 1,
		max: MAX_COMMENT_LINE_COUNT,
		integer: true
	}));
	const isBoundedFlashDoubleResizeHeights = (item) => {
		if (!isRecord(item)) return false;
		for (const size of Object.keys(item)) {
			if (!COMMENT_SIZES.includes(size)) return false;
			const heights = item[size];
			if (!isRecord(heights)) return false;
			for (const height of Object.values(heights)) if (!isFiniteNumberInRange(height, { max: MAX_CANVAS_DIMENSION$1 })) return false;
		}
		return true;
	};
	const isValidPlugins = (item) => Array.isArray(item) && item.every((plugin) => typeof plugin === "function");
	const isValidCommentPlugins = (item) => Array.isArray(item) && item.every((plugin) => isRecord(plugin) && typeof plugin.class === "function" && typeof plugin.condition === "function");
	const isValidCommentLimit = (item) => item === void 0 || isFiniteNumberInRange(item, {
		max: MAX_COMMENT_LIMIT,
		integer: true
	});
	const isValidColors = (item) => isPlainRecord(item) && Object.values(item).every(isColorCode);
	const isValidFlashChar = (item) => isPlainRecord(item) && hasConfigKeys(item, FLASH_CHAR_KEYS) && FLASH_CHAR_KEYS.every((key) => isRegexSource(item[key]));
	const isValidFlashMode = (item) => item === "xp" || item === "vista";
	const isValidFlashScriptChar = (item) => isPlainRecord(item) && hasConfigKeys(item, FLASH_SCRIPT_CHAR_KEYS) && FLASH_SCRIPT_CHAR_KEYS.every((key) => isRegexSource(item[key]));
	const isValidFontFamily = (item) => typeof item === "string" && item.length > 0;
	const isValidFontItem = (item) => isPlainRecord(item) && isValidFontFamily(item.font) && isFiniteNumberInRange(item.offset, {
		min: -1024,
		max: MAX_CONFIG_SPACING
	}) && isFiniteNumberInRange(item.weight, {
		min: Number.MIN_VALUE,
		max: 1e3
	});
	const isValidFonts = (item) => {
		if (!isPlainRecord(item) || !hasConfigKeys(item, ["flash", "html5"])) return false;
		const flash = item.flash;
		if (!isPlainRecord(flash) || !hasConfigKeys(flash, FLASH_FONT_KEYS)) return false;
		if (!FLASH_FONT_KEYS.every((key) => isValidFontFamily(flash[key]))) return false;
		const html5 = item.html5;
		if (!isPlainRecord(html5) || !hasConfigKeys(html5, HTML5_FONT_KEYS)) return false;
		return HTML5_FONT_KEYS.every((key) => isValidFontItem(html5[key]));
	};
	const isValidCompatSpacerFontMap = (item, keys) => {
		if (!isPlainRecord(item) || !hasOnlyConfigKeys(item, keys)) return false;
		return Object.values(item).every((value) => isFiniteNumberInRange(value, { max: MAX_CONFIG_RATIO }));
	};
	const isValidCompatSpacerKey = (key) => key.length === 1;
	const isValidCompatSpacerGroup = (item, keys) => isPlainRecord(item) && Object.entries(item).every(([key, value]) => isValidCompatSpacerKey(key) && isValidCompatSpacerFontMap(value, keys));
	const isValidCompatSpacer = (item) => isPlainRecord(item) && hasConfigKeys(item, ["flash", "html5"]) && isValidCompatSpacerGroup(item.flash, FLASH_SPACER_FONT_KEYS) && isValidCompatSpacerGroup(item.html5, HTML5_FONT_KEYS);
	const isValidConfig = (item) => {
		if (!isRecord(item)) return false;
		const validators = {
			cacheAge: (i) => isFiniteNumberInRange(i, { max: MAX_COMMENT_RANGE }),
			canvasHeight: (i) => isFiniteNumberInRange(i, {
				min: 1,
				max: MAX_CANVAS_DIMENSION$1
			}),
			canvasWidth: (i) => isFiniteNumberInRange(i, {
				min: 1,
				max: MAX_CANVAS_DIMENSION$1
			}),
			atButtonPadding: isBoundedSpacing,
			atButtonRadius: isBoundedSpacing,
			collisionPadding: isBoundedSpacing,
			collisionRange: isBoundedCollisionRange,
			colors: isValidColors,
			commentDrawPadding: (i) => isFiniteNumberInRange(i, { max: MAX_CANVAS_DIMENSION$1 }),
			commentDrawRange: (i) => isFiniteNumberInRange(i, { max: MAX_CANVAS_DIMENSION$1 }),
			commentLimit: isValidCommentLimit,
			commentPlugins: isValidCommentPlugins,
			commentScale: (i) => isBoundedNumberConfigItem(i, (value) => isFiniteNumberInRange(value, {
				min: Number.MIN_VALUE,
				max: MAX_CONFIG_RATIO
			})),
			commentStageSize: isBoundedCommentStageSizeConfig,
			contextLineWidth: (i) => isBoundedNumberConfigItem(i, (value) => isFiniteNumberInRange(value, { max: MAX_CONFIG_SPACING })),
			contextStrokeColor: isColorCode,
			contextStrokeInversionColor: isColorCode,
			contextStrokeOpacity: (i) => isFiniteNumberInRange(i, { max: 1 }),
			contextFillLiveOpacity: (i) => isFiniteNumberInRange(i, { max: 1 }),
			compatSpacer: isValidCompatSpacer,
			fonts: isValidFonts,
			flashChar: isValidFlashChar,
			flashLetterSpacing: (i) => isFiniteNumberInRange(i, { max: MAX_CONFIG_SPACING }),
			flashMode: isValidFlashMode,
			flashCommentYPaddingTop: (i) => isBoundedResizedItem(i, isBoundedSpacing),
			flashCommentYOffset: (i) => isBoundedSizeItem(i, (sizeValue) => isBoundedResizedItem(sizeValue, isBoundedOffset)),
			flashDoubleResizeHeights: isBoundedFlashDoubleResizeHeights,
			flashLineBreakScale: (i) => isBoundedSizeItem(i, (value) => isFiniteNumberInRange(value, {
				min: Number.MIN_VALUE,
				max: MAX_CONFIG_RATIO
			})),
			flashScriptCharOffset: (i) => isFiniteNumberInRange(i, { max: MAX_CONFIG_RATIO }),
			flashScriptChar: isValidFlashScriptChar,
			flashThreshold: (i) => isFiniteNumberInRange(i, { max: MAX_UNIX_TIME_SECONDS }),
			fontSize: isBoundedFontSizeConfig,
			fpsInterval: (i) => isFiniteNumberInRange(i, { max: MAX_COMMENT_RANGE }),
			hideCommentOrder: isHideCommentOrder,
			html5HiResCommentCorrection: (i) => isFiniteNumberInRange(i, { max: MAX_CONFIG_SPACING }),
			html5LineCounts: isBoundedLineCountsConfig,
			html5MinFontSize: (i) => isFiniteNumberInRange(i, {
				min: Number.MIN_VALUE,
				max: MAX_FONT_SIZE
			}),
			lineBreakCount: isBoundedLineBreakCount,
			lineHeight: isBoundedLineHeightConfig,
			nakaCommentSpeedOffset: (i) => isFiniteNumberInRange(i, { max: MAX_CONFIG_RATIO }),
			plugins: isValidPlugins,
			sameCAGap: (i) => isFiniteNumberInRange(i, { max: MAX_COMMENT_RANGE }),
			sameCAMinScore: (i) => isFiniteNumberInRange(i, {
				max: MAX_COMMENT_LIMIT,
				integer: true
			}),
			sameCARange: (i) => isFiniteNumberInRange(i, { max: MAX_COMMENT_RANGE }),
			sameCATimestampRange: (i) => isFiniteNumberInRange(i, { max: MAX_COMMENT_RANGE })
		};
		for (const [key, validator] of Object.entries(validators)) if (item[key] !== void 0 && !validator(item[key])) {
			console.warn(`[Incorrect input] var: initOptions.config, key: ${key}, value: ${item[key]}`);
			return false;
		}
		const width = item.canvasWidth;
		const height = item.canvasHeight;
		if (typeof width === "number" && typeof height === "number" && width * height > MAX_CANVAS_AREA$1) {
			console.warn(`[Incorrect input] var: initOptions.config, key: canvasArea, value: ${width * height}`);
			return false;
		}
		return true;
	};
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
			var _document$documentEle;
			if (!isRecord(i)) return false;
			const document = i;
			if (((_document$documentEle = document.documentElement) === null || _document$documentEle === void 0 ? void 0 : _document$documentEle.nodeName) !== "packet") return false;
			if (!document.documentElement.children) return false;
			for (const element of Array.from(document.documentElement.children)) {
				if ((element === null || element === void 0 ? void 0 : element.nodeName) !== "chat") continue;
				if (!typeAttributeVerify(element, ["vpos"])) return false;
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
			for (const list of lists) {
				if (list.trim() === "") continue;
				if (list.split(":").length < 3) return false;
			}
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
				lazy: isBoolean,
				mode: isMode,
				scale: isValidOptionScale,
				config: isValidConfig,
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
	//#region src/utils/rangeCache.ts
	const ACTIVE_CACHE_MAX_SIZE = 4096;
	var RangeCacheContext = class {
		constructor() {
			_defineProperty(this, "reverseActiveOwner", /* @__PURE__ */ new Map());
			_defineProperty(this, "reverseActiveViewer", /* @__PURE__ */ new Map());
			_defineProperty(this, "banActive", /* @__PURE__ */ new Map());
		}
		reset() {
			this.reverseActiveOwner.clear();
			this.reverseActiveViewer.clear();
			this.banActive.clear();
		}
		setCachedActiveState(cache, vpos, result) {
			if (cache.size >= ACTIVE_CACHE_MAX_SIZE) {
				const oldestKey = cache.keys().next().value;
				if (oldestKey !== void 0) cache.delete(oldestKey);
			}
			cache.set(vpos, result);
		}
	};
	//#endregion
	//#region src/utils/comment.ts
	const RE_QUOTE_START = /^["'「]$/;
	const RE_QUOTE_END = /^["']$/;
	const RE_WHITESPACE = /^\s+$/;
	const RE_NICOSCRIPT = /^[@＠](\S+)(?:\s(.+))?/;
	const RE_REVERSE = /^[@＠]逆(?:\s+)?(全|コメ|投コメ)?/;
	const RE_JUMP = /\s*((?:sm|so|nm|ｓｍ|ｓｏ|ｎｍ)?[1-9１-９][0-9１-９]*|#[0-9]+:[0-9]+(?:\.[0-9]+)?)\s+(.*)/;
	const RE_BUTTON_CONTENT = /* @__PURE__ */ new RegExp("^(?:(?<before>.*?)\\[)?(?<body>.*?)(?:\\](?<after>[^\\]]*?))?$", "su");
	const RE_LONG = /^[@＠]([0-9.]+)/;
	const RE_STROKE = /^nico:stroke:(.+)$/;
	const RE_WAKU = /^nico:waku:(.+)$/;
	const RE_FILL = /^nico:fill:(.+)$/;
	const RE_OPACITY = /^nico:opacity:(.+)$/;
	const RE_COLOR_CODE = /^#(?:[0-9a-z]{3}|[0-9a-z]{6})$/;
	const DEFAULT_NICOSCRIPT_LONG = 3e3;
	const MAX_COMMENT_LONG = 12e3;
	const MAX_NICOSCRIPT_LONG = 3600 * 100;
	const MAX_AT_BUTTON_COMMAND_CHARS = 16384;
	const MAX_AT_BUTTON_TEXT_CHARS = 4096;
	const MAX_NICOSCRIPT_COMMAND_CHARS = 16384;
	const MAX_NICOSCRIPT_TEXT_CHARS = 4096;
	const LAZY_LOOKAHEAD_LEAD_IN = 288;
	const LAZY_LOOKAHEAD_SAFETY_BUFFER = 100;
	const STANDARD_LAZY_LOOKAHEAD_CANVAS_WIDTH = 1920;
	const STANDARD_LAZY_LOOKAHEAD_TRAVEL_WIDTH = 1632;
	const MAX_LAZY_COMMENT_LOOKAHEAD = Math.ceil(LAZY_LOOKAHEAD_LEAD_IN * 12125 / STANDARD_LAZY_LOOKAHEAD_TRAVEL_WIDTH) + LAZY_LOOKAHEAD_SAFETY_BUFFER;
	const getLazyCommentLookahead = (canvasWidth) => {
		if (!Number.isFinite(canvasWidth) || canvasWidth <= 0) return MAX_LAZY_COMMENT_LOOKAHEAD;
		return Math.ceil(LAZY_LOOKAHEAD_LEAD_IN * 12125 * (STANDARD_LAZY_LOOKAHEAD_CANVAS_WIDTH / canvasWidth) / STANDARD_LAZY_LOOKAHEAD_TRAVEL_WIDTH) + LAZY_LOOKAHEAD_SAFETY_BUFFER;
	};
	const normalizeLongCentiseconds = (value, max) => {
		if (!Number.isFinite(value) || value <= 0) return 0;
		return Math.min(Math.floor(value), max);
	};
	const normalizeCommentLong = (value) => {
		if (value === void 0) return 300;
		return normalizeLongCentiseconds(value * 100, 12e3) || 300;
	};
	const normalizeParsedCommandLong = (value) => {
		if (value === void 0) return;
		if (!Number.isFinite(value) || value < 0) return;
		return value;
	};
	const normalizeOptionalNicoscriptLong = (value) => {
		if (value === void 0) return;
		if (value === 0) return 0;
		return normalizeLongCentiseconds(value * 100, 36e4) || void 0;
	};
	const normalizeNicoscriptLong = (value) => {
		if (value === void 0) return DEFAULT_NICOSCRIPT_LONG;
		return normalizeLongCentiseconds(value * 100, 36e4) || 3e3;
	};
	const clampString = (value, maxLength) => value.length > maxLength ? value.slice(0, maxLength) : value;
	const takeButtonText = (value, remaining) => {
		if (!value || remaining.value <= 0) return "";
		const text = clampString(value, remaining.value);
		remaining.value -= text.length;
		return text;
	};
	const normalizeAtButtonLimit = (value) => {
		const limit = Number(value !== null && value !== void 0 ? value : 1);
		if (!Number.isFinite(limit) || limit <= 0) return 0;
		return Math.min(Math.floor(limit), 100);
	};
	const normalizeAtButtonMail = (value) => {
		if (!value) return [];
		return value.split(",", 16).map((command) => clampString(command, 64)).filter((command) => command.length > 0);
	};
	const hasParsedMailCommand = (commands, target) => {
		const len = Math.min(commands.length, 64);
		for (let i = 0; i < len; i++) if (commands[i] === target) return true;
		return false;
	};
	const processedTimelineComments = /* @__PURE__ */ new WeakMap();
	const MOVABLE_COLLISION_BUCKET_SIZE = 100;
	const movableCollisionIndexes = /* @__PURE__ */ new WeakMap();
	const getMovableCollisionIndex = (collision) => {
		const current = movableCollisionIndexes.get(collision);
		if (current) return current;
		const created = {
			buckets: /* @__PURE__ */ new Map(),
			durations: /* @__PURE__ */ new Set(),
			registeredComments: /* @__PURE__ */ new WeakSet()
		};
		movableCollisionIndexes.set(collision, created);
		return created;
	};
	const getMovableCommentBeforeVpos = (comment) => Math.round(-288 / ((1632 + comment.width) / (comment.long + 125))) - 100;
	const getMovableCommentActiveRange = (comment) => ({
		start: comment.vpos + getMovableCommentBeforeVpos(comment),
		end: comment.vpos + comment.long + 125
	});
	const getMovableCommentCollisionRange = (comment, activeRange, config, speed) => {
		const initialLeft = config.commentDrawPadding + config.commentDrawRange;
		return {
			start: Math.max(activeRange.start, comment.vpos - 100 + (initialLeft - config.collisionRange.right) / speed),
			end: Math.min(activeRange.end, comment.vpos - 100 + (initialLeft + comment.width + config.collisionPadding - config.collisionRange.left) / speed)
		};
	};
	const forEachMovableCollisionBucket = (comment, callback) => {
		const { start, end } = getMovableCommentActiveRange(comment);
		const firstBucket = Math.floor(start / MOVABLE_COLLISION_BUCKET_SIZE);
		const lastBucket = Math.floor((end - 1) / MOVABLE_COLLISION_BUCKET_SIZE);
		for (let bucket = firstBucket; bucket <= lastBucket; bucket++) callback(bucket);
	};
	const registerMovableCollisionComment = (collision, comment) => {
		const index = getMovableCollisionIndex(collision);
		if (index.registeredComments.has(comment)) return;
		index.registeredComments.add(comment);
		index.durations.add(comment.long);
		forEachMovableCollisionBucket(comment, (bucket) => {
			const comments = index.buckets.get(bucket);
			if (comments) comments.push(comment);
			else index.buckets.set(bucket, [comment]);
		});
	};
	const doMovableTrajectoriesIntersect = (comment, commentCollisionRange, commentSpeed, candidate, config) => {
		const candidateSpeed = (config.commentDrawRange + candidate.width * config.nakaCommentSpeedOffset) / (candidate.long + 100);
		const candidateCollisionRange = getMovableCommentCollisionRange(candidate, getMovableCommentActiveRange(candidate), config, candidateSpeed);
		const sharedStart = Math.max(commentCollisionRange.start, candidateCollisionRange.start);
		const sharedEnd = Math.min(commentCollisionRange.end, candidateCollisionRange.end);
		if (sharedStart >= sharedEnd) return false;
		const getCandidateLeftRelativeToComment = (vpos) => (vpos - comment.vpos + 100) * commentSpeed - (vpos - candidate.vpos + 100) * candidateSpeed;
		const relativeAtStart = getCandidateLeftRelativeToComment(sharedStart);
		const relativeAtEnd = getCandidateLeftRelativeToComment(sharedEnd);
		const minRelativeLeft = Math.min(relativeAtStart, relativeAtEnd);
		const maxRelativeLeft = Math.max(relativeAtStart, relativeAtEnd);
		const padding = config.collisionPadding;
		return minRelativeLeft <= comment.width + padding && maxRelativeLeft >= -(candidate.width + padding);
	};
	const getAnalyticMovableCollisionCandidates = (comment, collision, config) => {
		const index = getMovableCollisionIndex(collision);
		if (index.durations.size === 0) return void 0;
		if (index.durations.size === 1 && index.durations.has(comment.long)) return;
		const commentRange = getMovableCommentActiveRange(comment);
		const commentSpeed = (config.commentDrawRange + comment.width * config.nakaCommentSpeedOffset) / (comment.long + 100);
		const commentCollisionRange = getMovableCommentCollisionRange(comment, commentRange, config, commentSpeed);
		const seen = /* @__PURE__ */ new Set();
		const candidates = [];
		forEachMovableCollisionBucket(comment, (bucket) => {
			const bucketComments = index.buckets.get(bucket);
			if (!bucketComments) return;
			for (const candidate of bucketComments) {
				if (seen.has(candidate) || candidate === comment || candidate.long === comment.long) continue;
				seen.add(candidate);
				if (doMovableTrajectoriesIntersect(comment, commentCollisionRange, commentSpeed, candidate, config)) candidates.push(candidate);
			}
		});
		return candidates;
	};
	const activeRangeScanCaches = /* @__PURE__ */ new WeakMap();
	const getActiveRangeScanCaches = (rangeCache) => {
		const cached = activeRangeScanCaches.get(rangeCache);
		if (cached) return cached;
		const next = {
			reverse: /* @__PURE__ */ new WeakMap(),
			ban: /* @__PURE__ */ new WeakMap()
		};
		activeRangeScanCaches.set(rangeCache, next);
		return next;
	};
	const getActiveRangeScanState = (ranges, scanCache) => {
		const cached = scanCache.get(ranges);
		if ((cached === null || cached === void 0 ? void 0 : cached.sourceLength) === ranges.length) return cached;
		const validRanges = ranges.filter((range) => range.start < range.end);
		const sortedByStart = [...validRanges].sort((a, b) => a.start - b.start);
		const sortedByEnd = [...validRanges].sort((a, b) => a.end - b.end);
		const next = {
			sourceLength: ranges.length,
			sortedByStart,
			sortedByEnd,
			startIndex: 0,
			endIndex: 0,
			activeCount: 0,
			lastVpos: -Infinity
		};
		scanCache.set(ranges, next);
		return next;
	};
	const changeReverseTargetCount = (counts, range, delta) => {
		counts[range.target] += delta;
	};
	const durationEndsAfter = (range, vpos) => range.long === void 0 || vpos < range.start + range.long;
	const isDurationRangeActive = (range, vpos) => range.start <= vpos && durationEndsAfter(range, vpos);
	const getActiveRangeState = (ranges, vpos, scanCache, changeTargetCount) => {
		if (!Number.isFinite(vpos)) return;
		const state = getActiveRangeScanState(ranges, scanCache);
		if (vpos < state.lastVpos) {
			state.startIndex = 0;
			state.endIndex = 0;
			state.activeCount = 0;
			state.targetCounts = void 0;
		}
		if (changeTargetCount && !state.targetCounts) state.targetCounts = {
			コメ: 0,
			投コメ: 0,
			全: 0
		};
		state.lastVpos = vpos;
		while (state.startIndex < state.sortedByStart.length) {
			const range = state.sortedByStart[state.startIndex];
			if (!range || vpos < range.start) break;
			state.startIndex++;
			state.activeCount++;
			if (state.targetCounts) changeTargetCount === null || changeTargetCount === void 0 || changeTargetCount(state.targetCounts, range, 1);
		}
		while (state.endIndex < state.sortedByEnd.length) {
			const range = state.sortedByEnd[state.endIndex];
			if (!range || vpos < range.end) break;
			state.endIndex++;
			if (range.start <= vpos) {
				state.activeCount--;
				if (state.targetCounts) changeTargetCount === null || changeTargetCount === void 0 || changeTargetCount(state.targetCounts, range, -1);
			}
		}
		return state;
	};
	const isTimelineProcessed = (timeline, comment) => {
		var _processedTimelineCom, _processedTimelineCom2;
		return (_processedTimelineCom = (_processedTimelineCom2 = processedTimelineComments.get(comment)) === null || _processedTimelineCom2 === void 0 ? void 0 : _processedTimelineCom2.has(timeline)) !== null && _processedTimelineCom !== void 0 ? _processedTimelineCom : false;
	};
	const markTimelineProcessed = (timeline, comment) => {
		const processed = processedTimelineComments.get(comment);
		if (processed) {
			processed.add(timeline);
			return;
		}
		processedTimelineComments.set(comment, new WeakSet([timeline]));
	};
	const isValidTimelineCommentRange = (comment) => isFiniteNumberInRange$1(comment.vpos, { min: Number.MIN_SAFE_INTEGER }) && isFiniteNumberInRange$1(comment.long, {
		min: 1,
		max: 12e3
	}) && isFiniteNumberInRange$1(comment.height, { integer: false });
	const isValidMovableCommentRange = (comment) => isValidTimelineCommentRange(comment) && isFiniteNumberInRange$1(comment.width, { integer: false });
	const rejectInvalidTimelineComment = (comment) => {
		comment.comment.invisible = true;
		try {
			comment.invisible = true;
		} catch (_e) {}
		comment.posY = 0;
	};
	/**
	* 改行リサイズが発生するか
	* @param comment 判定対象のコメント
	* @param config インスタンス設定
	* @returns 改行リサイズが発生するか
	*/
	const isLineBreakResize = (comment, config) => {
		return !comment.resized && !comment.ender && comment.lineCount >= config.lineBreakCount[comment.size];
	};
	/**
	* コメントの初期設定を取得する
	* @param vpos 現在のvpos
	* @param nicoScripts ニコスクリプト
	* @returns コメントの初期設定
	*/
	const getDefaultCommand = (vpos, nicoScripts) => {
		{
			let writeIdx = 0;
			for (let i = 0; i < nicoScripts.default.length; i++) {
				const item = nicoScripts.default[i];
				if (!item) continue;
				if (durationEndsAfter(item, vpos)) nicoScripts.default[writeIdx++] = item;
			}
			nicoScripts.default.length = writeIdx;
		}
		let color;
		let size;
		let font;
		let loc;
		for (const item of nicoScripts.default) {
			if (!isDurationRangeActive(item, vpos)) continue;
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
	const nicoscriptReplaceIgnoreable = (comment, item) => {
		if (!(item.target === "コメ" && !comment.owner || item.target === "投コメ" && comment.owner || item.target === "全" || item.target === "含む" || item.target === "含まない")) return true;
		const conditionMatches = item.condition === "完全一致" ? comment.content === item.keyword : comment.content.includes(item.keyword);
		return !(item.target === "含まない" ? !conditionMatches : conditionMatches);
	};
	/**
	* 置換コマンドを適用する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	* @param nicoScripts ニコスクリプト
	*/
	const applyNicoScriptReplace = (comment, commands, nicoScripts) => {
		{
			let writeIdx = 0;
			for (let i = 0; i < nicoScripts.replace.length; i++) {
				const item = nicoScripts.replace[i];
				if (!item) continue;
				if (durationEndsAfter(item, comment.vpos)) nicoScripts.replace[writeIdx++] = item;
			}
			nicoScripts.replace.length = writeIdx;
		}
		for (const item of nicoScripts.replace) {
			if (!isDurationRangeActive(item, comment.vpos)) continue;
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
	* @param ctx インスタンスコンテキスト
	* @returns パース後のコメント
	*/
	const parseCommandAndNicoScript = (comment, ctx) => {
		var _ref, _commands$size, _ref2, _commands$loc, _ref3, _commands$color, _ref4, _commands$font;
		const { config, options, nicoScripts, rangeCache } = ctx;
		const isFlash = isFlashComment(comment, config, options);
		const commands = parseCommands(comment, config, options);
		commands.long = normalizeParsedCommandLong(commands.long);
		processNicoscript(comment, commands, nicoScripts, rangeCache);
		const defaultCommand = getDefaultCommand(comment.vpos, nicoScripts);
		applyNicoScriptReplace(comment, commands, nicoScripts);
		const size = (_ref = (_commands$size = commands.size) !== null && _commands$size !== void 0 ? _commands$size : defaultCommand.size) !== null && _ref !== void 0 ? _ref : "medium";
		return {
			size,
			loc: (_ref2 = (_commands$loc = commands.loc) !== null && _commands$loc !== void 0 ? _commands$loc : defaultCommand.loc) !== null && _ref2 !== void 0 ? _ref2 : "naka",
			color: (_ref3 = (_commands$color = commands.color) !== null && _commands$color !== void 0 ? _commands$color : defaultCommand.color) !== null && _ref3 !== void 0 ? _ref3 : "#FFFFFF",
			font: (_ref4 = (_commands$font = commands.font) !== null && _commands$font !== void 0 ? _commands$font : defaultCommand.font) !== null && _ref4 !== void 0 ? _ref4 : "defont",
			fontSize: getConfig(config.fontSize, isFlash)[size].default,
			long: normalizeCommentLong(commands.long),
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
	* @param nicoScripts ニコスクリプト
	*/
	const addNicoscriptReplace = (comment, commands, nicoScripts, commandInput) => {
		var _result$, _result$2, _result$3, _result$4;
		const result = parseBrackets(commandInput.slice(4));
		if (result[0] === void 0 || result[2] !== void 0 && !typeGuard.nicoScript.replace.range(result[2]) || result[3] !== void 0 && !typeGuard.nicoScript.replace.target(result[3]) || result[4] !== void 0 && !typeGuard.nicoScript.replace.condition(result[4])) return;
		nicoScripts.replace.unshift({
			start: comment.vpos,
			long: normalizeOptionalNicoscriptLong(commands.long),
			keyword: clampString(result[0], MAX_NICOSCRIPT_TEXT_CHARS),
			replace: clampString((_result$ = result[1]) !== null && _result$ !== void 0 ? _result$ : "", MAX_NICOSCRIPT_TEXT_CHARS),
			range: (_result$2 = result[2]) !== null && _result$2 !== void 0 ? _result$2 : "単",
			target: (_result$3 = result[3]) !== null && _result$3 !== void 0 ? _result$3 : "コメ",
			condition: (_result$4 = result[4]) !== null && _result$4 !== void 0 ? _result$4 : "部分一致",
			color: commands.color,
			size: commands.size,
			font: commands.font,
			loc: commands.loc,
			no: comment.id
		});
		sortNicoscriptReplace(nicoScripts);
	};
	/**
	* 置換コマンドをvpos順にソートする
	* @param nicoScripts ニコスクリプト
	*/
	const sortNicoscriptReplace = (nicoScripts) => {
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
	* @param nicoScripts ニコスクリプト
	* @param rangeCache レンジキャッシュ
	*/
	const processNicoscript = (comment, commands, nicoScripts, rangeCache) => {
		const nicoscriptInput = clampString(comment.content, MAX_NICOSCRIPT_COMMAND_CHARS);
		const nicoscript = RE_NICOSCRIPT.exec(nicoscriptInput);
		if (!nicoscript) return;
		if (nicoscript[1] === "ボタン" && nicoscript[2]) {
			if (hasParsedMailCommand(comment.mail, "from_button")) return;
			processAtButton(comment, commands);
			return;
		}
		if (!comment.owner) return;
		commands.invisible = true;
		if (nicoscript[1] === "デフォルト") {
			processDefaultScript(comment, commands, nicoScripts);
			return;
		}
		if (nicoscript[1] === "逆") {
			processReverseScript(comment, commands, nicoScripts, rangeCache);
			return;
		}
		if (nicoscript[1] === "コメント禁止") {
			processBanScript(comment, commands, nicoScripts, rangeCache);
			return;
		}
		if (nicoscript[1] === "シーク禁止") {
			processSeekDisableScript(comment, commands, nicoScripts);
			return;
		}
		if (nicoscript[1] === "ジャンプ" && nicoscript[2]) {
			processJumpScript(comment, commands, nicoscript[2], nicoScripts);
			return;
		}
		if (nicoscript[1] === "置換") addNicoscriptReplace(comment, commands, nicoScripts, nicoscriptInput);
	};
	/**
	* デフォルトコマンドを処理する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	* @param nicoScripts ニコスクリプト
	*/
	const processDefaultScript = (comment, commands, nicoScripts) => {
		nicoScripts.default.unshift({
			start: comment.vpos,
			long: normalizeOptionalNicoscriptLong(commands.long),
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
	* @param nicoScripts ニコスクリプト
	* @param rangeCache レンジキャッシュ
	*/
	const processReverseScript = (comment, commands, nicoScripts, rangeCache) => {
		const reverse = RE_REVERSE.exec(comment.content);
		const target = typeGuard.nicoScript.range.target(reverse === null || reverse === void 0 ? void 0 : reverse[1]) ? reverse === null || reverse === void 0 ? void 0 : reverse[1] : "全";
		const long = normalizeNicoscriptLong(commands.long);
		nicoScripts.reverse.unshift({
			start: comment.vpos,
			end: comment.vpos + long,
			target
		});
		rangeCache.reverseActiveOwner.clear();
		rangeCache.reverseActiveViewer.clear();
	};
	/**
	* コメント禁止コマンドを処理する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	* @param nicoScripts ニコスクリプト
	* @param rangeCache レンジキャッシュ
	*/
	const processBanScript = (comment, commands, nicoScripts, rangeCache) => {
		const long = normalizeNicoscriptLong(commands.long);
		nicoScripts.ban.unshift({
			start: comment.vpos,
			end: comment.vpos + long
		});
		rangeCache.banActive.clear();
	};
	/**
	* シーク禁止コマンドを処理する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	* @param nicoScripts ニコスクリプト
	*/
	const processSeekDisableScript = (comment, commands, nicoScripts) => {
		const long = normalizeNicoscriptLong(commands.long);
		nicoScripts.seekDisable.unshift({
			start: comment.vpos,
			end: comment.vpos + long
		});
	};
	/**
	* ジャンプコマンドを処理する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	* @param input 対象のコメント本文
	* @param nicoScripts ニコスクリプト
	*/
	const processJumpScript = (comment, commands, input, nicoScripts) => {
		const jumpOptions = RE_JUMP.exec(input);
		if (!(jumpOptions === null || jumpOptions === void 0 ? void 0 : jumpOptions[1])) return;
		const long = normalizeOptionalNicoscriptLong(commands.long);
		const end = long === void 0 ? void 0 : long + comment.vpos;
		nicoScripts.jump.unshift({
			start: comment.vpos,
			end,
			to: jumpOptions[1],
			message: jumpOptions[2]
		});
	};
	/**
	* \@ボタンを処理する
	* @param comment 対象のコメント
	* @param commands 対象のコマンド
	*/
	const processAtButton = (comment, commands) => {
		var _content$groups, _content$groups2, _content$groups3, _args$;
		const args = parseBrackets(clampString(comment.content, MAX_AT_BUTTON_COMMAND_CHARS));
		if (args[1] === void 0) return;
		commands.invisible = false;
		const content = RE_BUTTON_CONTENT.exec(args[1]);
		const remainingText = { value: MAX_AT_BUTTON_TEXT_CHARS };
		const message = {
			before: takeButtonText((_content$groups = content.groups) === null || _content$groups === void 0 ? void 0 : _content$groups.before, remainingText),
			body: takeButtonText((_content$groups2 = content.groups) === null || _content$groups2 === void 0 ? void 0 : _content$groups2.body, remainingText),
			after: takeButtonText((_content$groups3 = content.groups) === null || _content$groups3 === void 0 ? void 0 : _content$groups3.after, remainingText)
		};
		commands.button = {
			message,
			commentMessage: clampString((_args$ = args[2]) !== null && _args$ !== void 0 ? _args$ : `${message.before}${message.body}${message.after}`, MAX_AT_BUTTON_TEXT_CHARS),
			commentVisible: args[3] !== "非表示",
			commentMail: normalizeAtButtonMail(args[4]),
			limit: normalizeAtButtonLimit(args[5]),
			local: hasParsedMailCommand(comment.mail, "local"),
			hidden: hasParsedMailCommand(comment.mail, "hidden")
		};
	};
	/**
	* コマンドをパースする
	* @param comment 対象のコメント
	* @param config インスタンス設定
	* @param options インスタンスオプション
	* @returns パースしたコマンド
	*/
	const parseCommands = (comment, config, options) => {
		const isFlash = isFlashComment(comment, config, options);
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
		const len = Math.min(comment.mail.length, 64);
		for (let i = 0; i < len; i++) {
			const command = comment.mail[i];
			if (command === void 0) continue;
			if (command.length > 128) continue;
			parseCommand(comment, command, result, isFlash, config);
		}
		if (comment.content.startsWith("/")) result.invisible = true;
		return result;
	};
	/**
	* コマンドをパースする
	* @param comment 対象のコメント
	* @param _command 対象のコマンド
	* @param result パースしたコマンド
	* @param isFlash Flashコメントかどうか
	* @param config インスタンス設定
	*/
	const parseCommand = (comment, _command, result, isFlash, config) => {
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
	* @param config インスタンス設定
	* @param options インスタンスオプション
	* @returns Flash適用対象かどうか
	*/
	const isFlashComment = (comment, config, options) => options.mode === "flash" || options.mode === "default" && !(hasParsedMailCommand(comment.mail, "gothic") || hasParsedMailCommand(comment.mail, "defont") || hasParsedMailCommand(comment.mail, "mincho")) && (comment.date < config.flashThreshold || hasParsedMailCommand(comment.mail, "nico:flash"));
	/**
	* コメントが逆コマンド適用対象かを返す
	* @param vpos コメントのvpos
	* @param isOwner コメントが投稿者コメントかどうか
	* @param nicoScripts ニコスクリプト
	* @param rangeCache レンジキャッシュ
	* @returns 逆コマンド適用対象かどうか
	*/
	const isReverseActive = (vpos, isOwner, nicoScripts, rangeCache) => {
		var _activeState$targetCo, _activeState$targetCo2, _activeState$targetCo3, _activeState$targetCo4, _activeState$targetCo5, _activeState$targetCo6, _activeState$targetCo7, _activeState$targetCo8;
		const cache = isOwner ? rangeCache.reverseActiveOwner : rangeCache.reverseActiveViewer;
		const cached = cache.get(vpos);
		if (cached !== void 0) return cached;
		const activeState = getActiveRangeState(nicoScripts.reverse, vpos, getActiveRangeScanCaches(rangeCache).reverse, changeReverseTargetCount);
		const result = isOwner ? ((_activeState$targetCo = activeState === null || activeState === void 0 || (_activeState$targetCo2 = activeState.targetCounts) === null || _activeState$targetCo2 === void 0 ? void 0 : _activeState$targetCo2.投コメ) !== null && _activeState$targetCo !== void 0 ? _activeState$targetCo : 0) > 0 || ((_activeState$targetCo3 = activeState === null || activeState === void 0 || (_activeState$targetCo4 = activeState.targetCounts) === null || _activeState$targetCo4 === void 0 ? void 0 : _activeState$targetCo4.全) !== null && _activeState$targetCo3 !== void 0 ? _activeState$targetCo3 : 0) > 0 : ((_activeState$targetCo5 = activeState === null || activeState === void 0 || (_activeState$targetCo6 = activeState.targetCounts) === null || _activeState$targetCo6 === void 0 ? void 0 : _activeState$targetCo6.コメ) !== null && _activeState$targetCo5 !== void 0 ? _activeState$targetCo5 : 0) > 0 || ((_activeState$targetCo7 = activeState === null || activeState === void 0 || (_activeState$targetCo8 = activeState.targetCounts) === null || _activeState$targetCo8 === void 0 ? void 0 : _activeState$targetCo8.全) !== null && _activeState$targetCo7 !== void 0 ? _activeState$targetCo7 : 0) > 0;
		rangeCache.setCachedActiveState(cache, vpos, result);
		return result;
	};
	/**
	* コメントがコメント禁止コマンド適用対象かを返す
	* @param vpos コメントのvpos
	* @param nicoScripts ニコスクリプト
	* @param rangeCache レンジキャッシュ
	* @returns コメント禁止コマンド適用対象かどうか
	*/
	const isBanActive = (vpos, nicoScripts, rangeCache) => {
		var _getActiveRangeState$, _getActiveRangeState;
		const cached = rangeCache.banActive.get(vpos);
		if (cached !== void 0) return cached;
		const result = ((_getActiveRangeState$ = (_getActiveRangeState = getActiveRangeState(nicoScripts.ban, vpos, getActiveRangeScanCaches(rangeCache).ban)) === null || _getActiveRangeState === void 0 ? void 0 : _getActiveRangeState.activeCount) !== null && _getActiveRangeState$ !== void 0 ? _getActiveRangeState$ : 0) > 0;
		rangeCache.setCachedActiveState(rangeCache.banActive, vpos, result);
		return result;
	};
	/**
	* 固定コメントを処理する
	* @param comment 固定コメント
	* @param collision コメントの衝突判定用配列
	* @param timeline コメントのタイムライン
	* @param lazy Y座標の計算を遅延させるか
	* @param config インスタンス設定
	*/
	const processFixedComment = (comment, collision, timeline, lazy = false, config, touchedTimeline) => {
		if (!isValidTimelineCommentRange(comment)) {
			rejectInvalidTimelineComment(comment);
			return;
		}
		const commentVpos = comment.vpos;
		const commentLong = comment.long;
		const collisionEnd = Math.max(commentLong - 20, 0);
		const posY = lazy ? -1 : getFixedPosY(comment, collision, config);
		if (!isTimelineProcessed(timeline, comment)) {
			for (let j = 0; j < commentLong; j++) {
				const vpos = commentVpos + j;
				arrayPush(timeline, vpos, comment);
				touchedTimeline === null || touchedTimeline === void 0 || touchedTimeline.add(vpos);
				if (j <= collisionEnd) arrayPush(collision, vpos, comment);
			}
			markTimelineProcessed(timeline, comment);
		}
		comment.posY = posY;
	};
	/**
	* nakaコメントを処理する
	* @param comment nakaコメント
	* @param collision コメントの衝突判定用配列
	* @param timeline コメントのタイムライン
	* @param lazy Y座標の計算を遅延させるか
	* @param config インスタンス設定
	*/
	const processMovableComment = (comment, collision, timeline, lazy = false, config, touchedTimeline) => {
		if (!isValidMovableCommentRange(comment)) {
			rejectInvalidTimelineComment(comment);
			return;
		}
		const commentWidth = comment.width;
		const commentLong = comment.long;
		const commentVpos = comment.vpos;
		const speed = (config.commentDrawRange + commentWidth * config.nakaCommentSpeedOffset) / (commentLong + 100);
		const drawPadding = config.commentDrawPadding;
		const drawRange = config.commentDrawRange;
		const collisionPadding = config.collisionPadding;
		const collisionRight = config.collisionRange.right;
		const collisionLeft = config.collisionRange.left;
		const beforeVpos = getMovableCommentBeforeVpos(comment);
		const posY = lazy ? -1 : getMovablePosY(comment, collision, beforeVpos, config, speed);
		const n = commentLong + 125;
		if (!isTimelineProcessed(timeline, comment)) {
			for (let j = beforeVpos; j < n; j++) {
				const vpos = commentVpos + j;
				const leftPos = drawPadding + drawRange - (j + 100) * speed;
				arrayPush(timeline, vpos, comment);
				touchedTimeline === null || touchedTimeline === void 0 || touchedTimeline.add(vpos);
				if (leftPos + commentWidth + collisionPadding >= collisionRight && leftPos <= collisionRight) arrayPush(collision.right, vpos, comment);
				if (leftPos + commentWidth + collisionPadding >= collisionLeft && leftPos <= collisionLeft) arrayPush(collision.left, vpos, comment);
			}
			markTimelineProcessed(timeline, comment);
		}
		comment.posY = posY;
		registerMovableCollisionComment(collision, comment);
	};
	const getFixedPosY = (comment, collision, config) => {
		const commentLong = comment.long;
		const commentVpos = comment.vpos;
		let posY = 0;
		let isChanged = true;
		let count = 0;
		while (isChanged && count < 10) {
			isChanged = false;
			count++;
			for (let j = 0; j < commentLong; j++) {
				const result = getPosY(posY, comment, collision[commentVpos + j], config);
				posY = result.currentPos;
				isChanged || (isChanged = result.isChanged);
				if (result.isBreak) break;
			}
		}
		return posY;
	};
	const getMovablePosY = (comment, collision, beforeVpos, config, speed = (config.commentDrawRange + comment.width * config.nakaCommentSpeedOffset) / (comment.long + 100)) => {
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
		const analyticCandidates = getAnalyticMovableCollisionCandidates(comment, collision, config);
		let posY = 0;
		let isChanged = true;
		let count = 0;
		let lastUpdatedIndex;
		while (isChanged && count < 10) {
			isChanged = false;
			count++;
			const analyticResult = getPosY(posY, comment, analyticCandidates, config);
			posY = analyticResult.currentPos;
			isChanged || (isChanged = analyticResult.isChanged);
			if (analyticResult.isBreak) return posY;
			for (let j = beforeVpos; j < n; j += 5) {
				const vpos = commentVpos + j;
				const leftPos = drawPadding + drawRange - (j + 100) * speed;
				let isBreak = false;
				if (lastUpdatedIndex !== void 0 && lastUpdatedIndex === vpos) return posY;
				if (leftPos + commentWidth >= collisionRight && leftPos <= collisionRight) {
					const result = getPosY(posY, comment, collision.right[vpos], config);
					posY = result.currentPos;
					isChanged || (isChanged = result.isChanged);
					if (result.isChanged) lastUpdatedIndex = vpos;
					isBreak || (isBreak = result.isBreak);
				}
				if (leftPos + commentWidth >= collisionLeft && leftPos <= collisionLeft) {
					const result = getPosY(posY, comment, collision.left[vpos], config);
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
	* @param config インスタンス設定
	* @returns 現在地、更新されたか、終了すべきか
	*/
	const getPosY = (_currentPos, targetComment, collision, config) => {
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
	* @param config インスタンス設定
	* @returns x座標
	*/
	const getPosX = (comment, vpos, config, isReverse = false) => {
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
	* @param config インスタンス設定
	* @returns contextで使えるフォント
	*/
	const parseFont = (font, size, config) => {
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
	const HASH_OFFSET_A = 2166136261;
	const HASH_OFFSET_B = 2654435769;
	const HASH_PRIME_A = 16777619;
	const HASH_PRIME_B = 2246822507;
	const HASH_SEPARATOR = 31;
	/**
	* CAと思われるコメントのレイヤーを分離する
	* @param rawData コメントデータ
	* @param config インスタンス設定
	* @returns レイヤー分離後のコメントデータ
	*/
	const changeCALayer = (rawData, config) => {
		const userScoreList = getUsersScore(rawData);
		const filteredComments = removeDuplicateCommentArt(rawData, config);
		updateLayerId(groupCommentsByTime(groupCommentsByUser(filteredComments.filter((comment) => {
			var _userScoreList$commen;
			return ((_userScoreList$commen = userScoreList[comment.user_id]) !== null && _userScoreList$commen !== void 0 ? _userScoreList$commen : 0) >= config.sameCAMinScore && !comment.owner;
		})), config));
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
	* @param config インスタンス設定
	* @returns 重複を排除したコメントデータ
	*/
	const removeDuplicateCommentArt = (comments, config) => {
		const index = /* @__PURE__ */ new Map();
		return comments.filter((comment) => {
			const key = getCommentArtDuplicateKey(comment);
			const lastComment = index.get(key);
			if (lastComment === void 0) {
				index.set(key, comment);
				return true;
			}
			if (comment.vpos - lastComment.vpos > config.sameCAGap || Math.abs(comment.date - lastComment.date) < config.sameCARange) {
				index.set(key, comment);
				return true;
			}
			return false;
		});
	};
	const getCommentArtDuplicateKey = (comment) => {
		const mailHash = hashStringList(Array.from(new Set(comment.mail.filter((mail) => !RE_CA_FILTER.test(mail)))).sort((a, b) => a.localeCompare(b)));
		return `content=${hashString$1(comment.content)};mail=${mailHash}`;
	};
	const hashStringList = (values) => {
		const state = createHashState();
		for (const value of values) {
			mixHashCode(state, value.length);
			for (let i = 0; i < value.length; i++) mixHashCode(state, value.charCodeAt(i));
			mixHashCode(state, HASH_SEPARATOR);
		}
		return `${values.length}:${toBase36(state.hashA)}:${toBase36(state.hashB)}`;
	};
	const hashString$1 = (value) => {
		const state = createHashState();
		for (let i = 0; i < value.length; i++) mixHashCode(state, value.charCodeAt(i));
		return `${value.length}:${toBase36(state.hashA)}:${toBase36(state.hashB)}`;
	};
	const createHashState = () => ({
		hashA: HASH_OFFSET_A,
		hashB: HASH_OFFSET_B
	});
	const mixHashCode = (state, code) => {
		state.hashA = Math.imul(state.hashA ^ code, HASH_PRIME_A);
		state.hashB = Math.imul(state.hashB + code, HASH_PRIME_B) ^ state.hashB >>> 13;
	};
	const toBase36 = (value) => (value >>> 0).toString(36);
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
	* @param config インスタンス設定
	* @returns 時間ごとにグループ化されたコメントデータ
	*/
	const groupCommentsByTime = (comments, config) => {
		return comments.map((user) => ({
			userId: user.userId,
			comments: groupUserCommentsByTime(user.comments, config)
		}));
	};
	/**
	* ユーザー内のコメントを入力順に走査して時間ごとにグループ化する
	* @param comments ユーザー単位のコメントデータ
	* @param config インスタンス設定
	* @returns 時間ごとにグループ化したコメントデータ
	*/
	const groupUserCommentsByTime = (comments, config) => {
		const result = [];
		const bucketSize = getTimeBucketSize(config);
		const bucketIndex = /* @__PURE__ */ new Map();
		for (const comment of comments) {
			let time = getTimeFromBucketIndex(comment.date, bucketSize, bucketIndex, config);
			if (time === void 0) {
				time = {
					bucketEnd: 0,
					bucketStart: 1,
					index: result.length,
					range: {
						start: comment.date,
						end: comment.date
					},
					comments: []
				};
				result.push(time);
			}
			time.comments.push(comment);
			time.range.start = Math.min(time.range.start, comment.date);
			time.range.end = Math.max(time.range.end, comment.date);
			updateTimeBucketIndex(time, bucketSize, bucketIndex, config);
		}
		return result;
	};
	const getTimeFromBucketIndex = (time, bucketSize, bucketIndex, config) => {
		const candidates = bucketIndex.get(getTimeBucket(time, bucketSize));
		if (candidates === void 0) return void 0;
		let result;
		for (const candidate of candidates) if ((result === void 0 || candidate.index < result.index) && isSameCommentArtTime(time, candidate, config)) result = candidate;
		return result;
	};
	const updateTimeBucketIndex = (time, bucketSize, bucketIndex, config) => {
		const bucketStart = getTimeBucket(time.range.start - config.sameCATimestampRange, bucketSize);
		const bucketEnd = getTimeBucket(time.range.end + config.sameCATimestampRange, bucketSize);
		if (!Number.isFinite(bucketStart) || !Number.isFinite(bucketEnd)) return;
		for (let bucket = bucketStart; bucket <= bucketEnd; bucket++) {
			if (bucket >= time.bucketStart && bucket <= time.bucketEnd) continue;
			let bucketItems = bucketIndex.get(bucket);
			if (bucketItems === void 0) {
				bucketItems = /* @__PURE__ */ new Set();
				bucketIndex.set(bucket, bucketItems);
			}
			bucketItems.add(time);
		}
		time.bucketStart = bucketStart;
		time.bucketEnd = bucketEnd;
	};
	const getTimeBucketSize = (config) => config.sameCATimestampRange === Infinity ? Infinity : Number.isFinite(config.sameCATimestampRange) && config.sameCATimestampRange > 0 ? Math.ceil(config.sameCATimestampRange * 2) + 1 : 1;
	const getTimeBucket = (time, bucketSize) => bucketSize === Infinity ? 0 : Math.floor(time / bucketSize);
	const isSameCommentArtTime = (time, timeObj, config) => timeObj.range.start - config.sameCATimestampRange <= time && timeObj.range.end + config.sameCATimestampRange >= time;
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
	const MAX_FLASH_COMMENT_CHARS = 16384;
	const MAX_FLASH_CONTENT_ITEMS = 2048;
	const flashCharRegexCache = /* @__PURE__ */ new WeakMap();
	const flashSpacerKeysCache = /* @__PURE__ */ new WeakMap();
	const getFlashCharRegex = (config) => {
		let cached = flashCharRegexCache.get(config);
		if (!cached) {
			cached = {
				simsunStrong: new RegExp(config.flashChar.simsunStrong),
				simsunWeak: new RegExp(config.flashChar.simsunWeak),
				gulim: new RegExp(config.flashChar.gulim),
				gothic: new RegExp(config.flashChar.gothic)
			};
			flashCharRegexCache.set(config, cached);
		}
		return cached;
	};
	const getFlashSpacerKeys = (config) => {
		let cached = flashSpacerKeysCache.get(config);
		if (!cached) {
			cached = Object.keys(config.compatSpacer.flash).filter((key) => key.length > 0);
			flashSpacerKeysCache.set(config, cached);
		}
		return cached;
	};
	const clampFlashContent = (input) => {
		let lineCount = 1;
		let end = 0;
		for (; end < input.length && end < 16384; end++) if (input[end] === "\n") {
			if (lineCount >= 256) break;
			lineCount++;
		}
		return {
			content: input.slice(0, end),
			lineCount
		};
	};
	/**
	* コメントの内容からフォント情報を取得する
	* @param part コメントの内容
	* @param config インスタンス設定
	* @returns フォント情報
	*/
	const getFlashFontIndex = (part, config) => {
		const regex = getFlashCharRegex(config);
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
	* @param config インスタンス設定
	* @returns パースしたコメントの内容
	*/
	const parseContent = (content, config) => {
		var _clamped$content$matc;
		const results = [];
		const clamped = clampFlashContent(content);
		const lines = Array.from((_clamped$content$matc = clamped.content.match(/\n|[^\n]+/g)) !== null && _clamped$content$matc !== void 0 ? _clamped$content$matc : []);
		for (const line of lines) {
			const remainingItems = MAX_FLASH_CONTENT_ITEMS - results.length;
			if (remainingItems <= 0) break;
			const lineContent = parseLine(line, config, remainingItems);
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
	* @param config インスタンス設定
	* @returns パースしたコメントの内容
	*/
	const parseLine = (line, config, maxItems = MAX_FLASH_CONTENT_ITEMS) => {
		var _line$match;
		const parts = Array.from((_line$match = line.match(/[ -~｡-ﾟ]+|[^ -~｡-ﾟ]+/g)) !== null && _line$match !== void 0 ? _line$match : []);
		const lineContent = [];
		for (const part of parts) {
			if (lineContent.length >= maxItems) break;
			if (part.match(/[ -~｡-ﾟ]+/g) !== null) {
				addPartToResult(lineContent, part, config, "defont", maxItems);
				continue;
			}
			parseFullWidthPart(part, lineContent, config, maxItems);
		}
		return lineContent;
	};
	/**
	* スペースの補正を行った上で結果を追加する
	* @param lineContent 結果格納用の配列
	* @param part 追加する文字列
	* @param config インスタンス設定
	* @param font フォント
	*/
	const addPartToResult = (lineContent, part, config, font, maxItems = MAX_FLASH_CONTENT_ITEMS) => {
		if (part === "" || lineContent.length >= maxItems) return;
		const tasks = [{
			type: "segment",
			value: part
		}];
		const spacerKeys = getFlashSpacerKeys(config);
		const fontName = font !== null && font !== void 0 ? font : "defont";
		while (tasks.length > 0 && lineContent.length < maxItems) {
			const task = tasks.pop();
			if (task.type === "spacer") {
				lineContent.push({
					type: "spacer",
					char: task.char,
					charWidth: task.charWidth,
					font,
					count: task.count
				});
				continue;
			}
			if (task.value === "") continue;
			let match;
			for (const key of spacerKeys) {
				var _config$compatSpacer$;
				const spacerWidth = (_config$compatSpacer$ = config.compatSpacer.flash[key]) === null || _config$compatSpacer$ === void 0 ? void 0 : _config$compatSpacer$[fontName];
				if (!spacerWidth) continue;
				const compatIndex = task.value.indexOf(key);
				if (compatIndex < 0) continue;
				let count = 0;
				let end = compatIndex;
				while (task.value.startsWith(key, end)) {
					count++;
					end += key.length;
				}
				match = {
					key,
					index: compatIndex,
					width: spacerWidth,
					count,
					end
				};
				break;
			}
			if (!match) {
				lineContent.push({
					type: "text",
					content: task.value,
					slicedContent: task.value.split("\n"),
					font
				});
				continue;
			}
			const after = task.value.slice(match.end);
			if (after !== "") tasks.push({
				type: "segment",
				value: after
			});
			tasks.push({
				type: "spacer",
				char: match.key,
				charWidth: match.width,
				count: match.count
			});
			const before = task.value.slice(0, match.index);
			if (before !== "") tasks.push({
				type: "segment",
				value: before
			});
		}
	};
	/**
	* 全角文字の部分をパースする
	* @param part 全角文字の部分
	* @param lineContent 1行分のコメントの内容
	* @param config インスタンス設定
	*/
	const parseFullWidthPart = (part, lineContent, config, maxItems = MAX_FLASH_CONTENT_ITEMS) => {
		if (lineContent.length >= maxItems) return;
		const index = getFlashFontIndex(part, config);
		if (index.length === 0) addPartToResult(lineContent, part, config, void 0, maxItems);
		else if (index.length === 1 && index[0]) addPartToResult(lineContent, part, config, getFlashFontName(index[0].font), maxItems);
		else parseMultiFontFullWidthPart(part, index, lineContent, config, maxItems);
	};
	/**
	* 複数のフォントが含まれる全角文字の部分をパースする
	* @param part 全角文字の部分
	* @param index フォントのインデックス
	* @param lineContent 1行分のコメントの内容
	* @param config インスタンス設定
	*/
	const parseMultiFontFullWidthPart = (part, index, lineContent, config, maxItems = MAX_FLASH_CONTENT_ITEMS) => {
		index.sort(nativeSort((val) => val.index));
		if (config.flashMode === "xp") {
			let offset = 0;
			for (let i = 1, n = index.length; i < n; i++) {
				if (lineContent.length >= maxItems) return;
				const currentVal = index[i];
				const lastVal = index[i - 1];
				if (currentVal === void 0 || lastVal === void 0) continue;
				addPartToResult(lineContent, part.slice(offset, currentVal.index), config, getFlashFontName(lastVal.font), maxItems);
				offset = currentVal.index;
			}
			const val = index[index.length - 1];
			if (val) addPartToResult(lineContent, part.slice(offset), config, getFlashFontName(val.font), maxItems);
			return;
		}
		const firstVal = index[0];
		const secondVal = index[1];
		if (!firstVal || !secondVal) {
			addPartToResult(lineContent, part, config, void 0, maxItems);
			return;
		}
		if (firstVal.font !== "gothic") {
			addPartToResult(lineContent, part, config, getFlashFontName(firstVal.font), maxItems);
			return;
		}
		const firstContent = part.slice(0, secondVal.index);
		const secondContent = part.slice(secondVal.index);
		addPartToResult(lineContent, firstContent, config, getFlashFontName(firstVal.font), maxItems);
		addPartToResult(lineContent, secondContent, config, getFlashFontName(secondVal.font), maxItems);
	};
	/**
	* コメントのボタンのパーツを取得する
	* @param comment コメント
	* @param config インスタンス設定
	* @returns ボタンのデータを追加したコメント
	*/
	const getButtonParts = (comment, config) => {
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
	* @param config インスタンス設定
	* @param resized リサイズされているか
	* @returns 行高
	*/
	const getLineHeight = (fontSize, isFlash, config, resized = false) => {
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
	* @param config インスタンス設定
	* @returns フォントサイズ
	*/
	const getCharSize = (fontSize, isFlash, config) => {
		const lineCounts = getConfig(config.html5LineCounts, isFlash);
		return getConfig(config.commentStageSize, isFlash).height / lineCounts.doubleResized[fontSize];
	};
	/**
	* コメントのサイズを計測する
	* @param comment コメント
	* @param renderer 計測対象のレンダラーインスタンス
	* @param config インスタンス設定
	* @returns 計測結果
	*/
	const measure = (comment, renderer, config, layerScale = 1) => {
		return _objectSpread2(_objectSpread2({}, measureWidth(comment, renderer, config, layerScale)), {}, { height: comment.lineHeight * (comment.lineCount - 1) + comment.charSize });
	};
	const addHTML5PartToResult = (lineContent, part, config, _font) => {
		if (part === "") return;
		const font = _font !== null && _font !== void 0 ? _font : "defont";
		for (const key of Object.keys(config.compatSpacer.html5)) {
			var _config$compatSpacer$;
			const spacerWidth = (_config$compatSpacer$ = config.compatSpacer.html5[key]) === null || _config$compatSpacer$ === void 0 ? void 0 : _config$compatSpacer$[font];
			if (!spacerWidth) continue;
			const compatIndex = part.indexOf(key);
			if (compatIndex >= 0) {
				addHTML5PartToResult(lineContent, part.slice(0, compatIndex), config, font);
				let i = compatIndex;
				for (; i < part.length && part[i] === key; i++);
				lineContent.push({
					type: "spacer",
					char: key,
					charWidth: spacerWidth,
					count: i - compatIndex
				});
				addHTML5PartToResult(lineContent, part.slice(i), config, font);
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
	* @param config インスタンス設定
	* @returns 計測結果
	*/
	const measureWidth = (comment, renderer, config, layerScale = 1) => {
		const { fontSize, scale } = getFontSizeAndScale(comment.charSize, config);
		const drawScale = getConfig(config.commentScale, false) * scale * layerScale;
		const lineWidth = [];
		const itemWidth = [];
		const initialFont = parseFont(comment.font, fontSize, config);
		renderer.setFont(initialFont);
		let lastFont = initialFont;
		let currentWidth = 0;
		for (const item of comment.content) {
			var _item$slicedContent, _item$font;
			if (item.type === "spacer") {
				currentWidth += item.count * fontSize * item.charWidth;
				itemWidth.push([item.count * fontSize * item.charWidth]);
				lineWidth.push(Math.ceil(currentWidth * scale));
				continue;
			}
			const lines = (_item$slicedContent = item.slicedContent) !== null && _item$slicedContent !== void 0 ? _item$slicedContent : item.content.split("\n");
			const font = parseFont((_item$font = item.font) !== null && _item$font !== void 0 ? _item$font : comment.font, fontSize, config);
			if (font !== lastFont) {
				renderer.setFont(font);
				lastFont = font;
			}
			const width = [];
			for (let j = 0, n = lines.length; j < n; j++) {
				var _renderer$measureText, _renderer$measureText2;
				const line = lines[j];
				if (line === void 0) throw new TypeGuardError();
				const m = (_renderer$measureText = (_renderer$measureText2 = renderer.measureTextAtDrawScale) === null || _renderer$measureText2 === void 0 ? void 0 : _renderer$measureText2.call(renderer, line, drawScale)) !== null && _renderer$measureText !== void 0 ? _renderer$measureText : renderer.measureText(line);
				currentWidth += m.width;
				width.push(m.width);
				if (j < lines.length - 1) {
					lineWidth.push(Math.ceil(currentWidth * scale));
					currentWidth = 0;
				}
			}
			itemWidth.push(width);
			lineWidth.push(Math.ceil(currentWidth * scale));
		}
		let maxWidth = 0;
		for (const width of lineWidth) if (width > maxWidth) maxWidth = width;
		return {
			width: maxWidth,
			lineWidth,
			itemWidth
		};
	};
	/**
	* フォントサイズとスケールを返す
	* @param _charSize 文字サイズ
	* @param config インスタンス設定
	* @returns フォントサイズとスケール
	*/
	const getFontSizeAndScale = (_charSize, config) => {
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
		DEFAULT_COMMENT_LONG: () => 300,
		DEFAULT_NICOSCRIPT_LONG: () => DEFAULT_NICOSCRIPT_LONG,
		MAX_AT_BUTTON_COMMAND_CHARS: () => MAX_AT_BUTTON_COMMAND_CHARS,
		MAX_AT_BUTTON_LIMIT: () => 100,
		MAX_AT_BUTTON_MAIL_CHARS: () => 64,
		MAX_AT_BUTTON_MAIL_ENTRIES: () => 16,
		MAX_AT_BUTTON_TEXT_CHARS: () => MAX_AT_BUTTON_TEXT_CHARS,
		MAX_COMMENT_LONG: () => MAX_COMMENT_LONG,
		MAX_FLASH_COMMENT_CHARS: () => MAX_FLASH_COMMENT_CHARS,
		MAX_FLASH_COMMENT_LINES: () => 256,
		MAX_FLASH_CONTENT_ITEMS: () => MAX_FLASH_CONTENT_ITEMS,
		MAX_LAZY_COMMENT_LOOKAHEAD: () => MAX_LAZY_COMMENT_LOOKAHEAD,
		MAX_NICOSCRIPT_COMMAND_CHARS: () => MAX_NICOSCRIPT_COMMAND_CHARS,
		MAX_NICOSCRIPT_LONG: () => MAX_NICOSCRIPT_LONG,
		MAX_NICOSCRIPT_TEXT_CHARS: () => MAX_NICOSCRIPT_TEXT_CHARS,
		MAX_PARSED_COMMAND_MAIL_CHARS: () => 128,
		MAX_PARSED_COMMAND_MAIL_ENTRIES: () => 64,
		RangeCacheContext: () => RangeCacheContext,
		addHTML5PartToResult: () => addHTML5PartToResult,
		arrayEqual: () => arrayEqual,
		arrayPush: () => arrayPush,
		buildAtButtonComment: () => buildAtButtonComment,
		changeCALayer: () => changeCALayer,
		clampFlashContent: () => clampFlashContent,
		getButtonParts: () => getButtonParts,
		getCharSize: () => getCharSize,
		getConfig: () => getConfig,
		getDefaultCommand: () => getDefaultCommand,
		getFixedPosY: () => getFixedPosY,
		getFlashFontIndex: () => getFlashFontIndex,
		getFlashFontName: () => getFlashFontName,
		getFontSizeAndScale: () => getFontSizeAndScale,
		getLazyCommentLookahead: () => getLazyCommentLookahead,
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
		processMovableComment: () => processMovableComment
	});
	//#endregion
	//#region src/comments/BaseComment.ts
	const VISUALLY_BLANK_RE = /^[\s\u00AD\u200B-\u200D\u2060\u115F\u1160\u3164\uFFA0]*$/;
	const MAX_CACHE_KEY_CONTENT_LENGTH = 512;
	const MAX_CACHE_KEY_EDGE_LENGTH = 256;
	const MAX_IMAGE_CACHE_ENTRIES = 1024;
	const imageCacheEntries = /* @__PURE__ */ new WeakMap();
	const destroyedTextImages = /* @__PURE__ */ new WeakSet();
	const destroyTextImage = (image) => {
		if (typeof image.destroy !== "function") return false;
		if (destroyedTextImages.has(image)) return false;
		destroyedTextImages.add(image);
		image.destroy();
		return true;
	};
	const hashString = (input) => {
		let hash = 2166136261;
		for (let i = 0, n = input.length; i < n; i++) {
			hash ^= input.charCodeAt(i);
			hash = Math.imul(hash, 16777619);
		}
		return (hash >>> 0).toString(36);
	};
	const boundedCachePart = (input) => {
		if (input.length <= MAX_CACHE_KEY_CONTENT_LENGTH) return input;
		return `${input.slice(0, MAX_CACHE_KEY_EDGE_LENGTH)}\0${input.slice(-256)}\0${input.length}\0${hashString(input)}`;
	};
	const isOutsideStage = (posX, posY, width, height, config) => !Number.isFinite(posX) || !Number.isFinite(posY) || !Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0 || posX >= config.canvasWidth || posY >= config.canvasHeight || posX + width <= 0 || posY + height <= 0;
	/**
	* コメントの描画を行うクラスの基底クラス
	*/
	var BaseComment = class {
		/**
		* コンストラクタ
		* @param comment 処理対象のコメント
		* @param renderer 描画対象のレンダラークラス
		* @param index コメントのインデックス
		* @param ctx インスタンスコンテキスト
		*/
		constructor(comment, renderer, index, ctx) {
			_defineProperty(this, "renderer", void 0);
			_defineProperty(this, "config", void 0);
			_defineProperty(this, "ctx", void 0);
			_defineProperty(this, "cacheKey", void 0);
			_defineProperty(this, "comment", void 0);
			_defineProperty(this, "pos", void 0);
			_defineProperty(this, "posY", void 0);
			_defineProperty(this, "pluginName", "BaseComment");
			_defineProperty(this, "image", void 0);
			_defineProperty(this, "buttonImage", void 0);
			_defineProperty(this, "index", void 0);
			_defineProperty(this, "_timeoutIds", /* @__PURE__ */ new Set());
			_defineProperty(this, "_destroyed", false);
			this.renderer = renderer;
			this.ctx = ctx;
			this.config = ctx.config;
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
			const { nicoScripts, rangeCache } = this.ctx;
			if ((_frameActiveState$ban = frameActiveState === null || frameActiveState === void 0 ? void 0 : frameActiveState.banActive) !== null && _frameActiveState$ban !== void 0 ? _frameActiveState$ban : isBanActive(vpos, nicoScripts, rangeCache)) return;
			const reverse = this.comment.owner ? (_frameActiveState$rev = frameActiveState === null || frameActiveState === void 0 ? void 0 : frameActiveState.reverseActiveOwner) !== null && _frameActiveState$rev !== void 0 ? _frameActiveState$rev : isReverseActive(vpos, true, nicoScripts, rangeCache) : (_frameActiveState$rev2 = frameActiveState === null || frameActiveState === void 0 ? void 0 : frameActiveState.reverseActiveViewer) !== null && _frameActiveState$rev2 !== void 0 ? _frameActiveState$rev2 : isReverseActive(vpos, false, nicoScripts, rangeCache);
			const posX = getPosX(this.comment, vpos, this.config, reverse);
			const posY = this.comment.loc === "shita" ? this.config.canvasHeight - this.posY - this.comment.height : this.posY;
			this.pos = {
				x: posX,
				y: posY
			};
			if (isOutsideStage(posX, posY, this.comment.width, this.comment.height, this.config)) return;
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
			if (this.image && destroyedTextImages.has(this.image)) this.image = void 0;
			if (this.image === void 0) this.image = this.getTextImage();
			if (this.image) {
				const effectiveAlpha = typeof this.comment.opacity === "number" ? this.comment.opacity : this.comment._live ? this.config.contextFillLiveOpacity : 1;
				if (effectiveAlpha !== 1) {
					this.renderer.save();
					this.renderer.setGlobalAlpha(effectiveAlpha);
				}
				try {
					if (this.comment.button && !this.comment.button.hidden) {
						const button = this.getButtonImage(posX, posY, cursor);
						button && this.renderer.drawImage(button, posX, posY);
					}
					this.renderer.drawImage(this.image, posX, posY);
				} finally {
					if (effectiveAlpha !== 1) this.renderer.restore();
				}
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
				try {
					this.renderer.setStrokeStyle(this.comment.wakuColor);
					this.renderer.strokeRect(posX, posY, this.comment.width, this.comment.height);
				} finally {
					this.renderer.restore();
				}
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
				try {
					this.renderer.setFillStyle(this.comment.fillColor);
					this.renderer.fillRect(posX, posY, this.comment.width, this.comment.height);
				} finally {
					this.renderer.restore();
				}
			}
		}
		/**
		* コメントのメタデータを描画する
		* @param posX 描画位置
		* @param posY 描画位置
		*/
		_drawDebugInfo(posX, posY) {
			if (this.ctx.options.debug) {
				this.renderer.save();
				try {
					this.renderer.setFont(parseFont("defont", 30, this.config));
					this.renderer.setFillStyle("#ff00ff");
					this.renderer.fillText(this.comment.mail.join(","), posX, posY + 30);
				} finally {
					this.renderer.restore();
				}
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
			if (this._destroyed) return null;
			if (this.comment.invisible || this.comment.lineCount === 1 && this.comment.width === 0 || this.comment.height - (this.comment.charSize - this.comment.lineHeight) <= 0 || !this.canGenerateTextImage() || VISUALLY_BLANK_RE.test(this.comment.rawContent)) return null;
			const key = this.cacheKey;
			const { imageCache, config } = this.ctx;
			const cache = imageCache.get(key);
			if (cache) {
				const entries = imageCacheEntries.get(imageCache);
				if (entries === null || entries === void 0 ? void 0 : entries.delete(key)) entries.add(key);
				this.image = cache.image;
				this._setCommentImageClearTimeout(this.comment.long * 10 + config.cacheAge);
				clearTimeout(cache.timeout);
				const cachedImage = cache.image;
				cache.timeout = this._setCacheImageExpiryTimeout(key, cachedImage, this.comment.long * 10 + config.cacheAge);
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
			const { imageCache, config } = this.ctx;
			const lifetime = this.comment.long * 10 + config.cacheAge;
			let entries = imageCacheEntries.get(imageCache);
			if (!entries) {
				entries = /* @__PURE__ */ new Set();
				imageCacheEntries.set(imageCache, entries);
			}
			this.image = image;
			if (!entries.has(key) && entries.size >= MAX_IMAGE_CACHE_ENTRIES) {
				for (const entryKey of entries) if (!imageCache.get(entryKey)) entries.delete(entryKey);
			}
			if (!entries.has(key) && entries.size >= MAX_IMAGE_CACHE_ENTRIES) {
				const oldestKey = entries.keys().next().value;
				if (oldestKey !== void 0) {
					const oldest = imageCache.get(oldestKey);
					if (oldest) {
						clearTimeout(oldest.timeout);
						destroyTextImage(oldest.image);
					}
					imageCache.delete(oldestKey);
					entries.delete(oldestKey);
				}
			}
			this._setCommentImageClearTimeout(lifetime);
			const timeout = this._setCacheImageExpiryTimeout(key, image, lifetime);
			imageCache.set(key, {
				timeout,
				image
			});
			entries.delete(key);
			entries.add(key);
		}
		canGenerateTextImage() {
			return true;
		}
		getButtonImage(_posX, _posY, _cursor) {}
		isHovered(_cursor, _posX, _posY) {
			return false;
		}
		getCacheKey() {
			var _this$comment$mail;
			const mail = boundedCachePart(JSON.stringify((_this$comment$mail = this.comment.mail) !== null && _this$comment$mail !== void 0 ? _this$comment$mail : []));
			return `${this.pluginName}\0${mail}\0${boundedCachePart(this.comment.rawContent)}`;
		}
		_setCommentImageClearTimeout(lifetime) {
			const timeout = window.setTimeout(() => {
				this._timeoutIds.delete(timeout);
				this.image = void 0;
			}, lifetime);
			this._timeoutIds.add(timeout);
		}
		_setCacheImageExpiryTimeout(key, image, lifetime) {
			const timeout = window.setTimeout(() => {
				var _this$ctx$imageCache$;
				this._timeoutIds.delete(timeout);
				if (((_this$ctx$imageCache$ = this.ctx.imageCache.get(key)) === null || _this$ctx$imageCache$ === void 0 ? void 0 : _this$ctx$imageCache$.image) === image) {
					var _imageCacheEntries$ge;
					destroyTextImage(image);
					this.ctx.imageCache.delete(key);
					(_imageCacheEntries$ge = imageCacheEntries.get(this.ctx.imageCache)) === null || _imageCacheEntries$ge === void 0 || _imageCacheEntries$ge.delete(key);
				}
			}, lifetime);
			this._timeoutIds.add(timeout);
			return timeout;
		}
		destroy() {
			if (this._destroyed) return;
			this._destroyed = true;
			for (const timeout of this._timeoutIds) clearTimeout(timeout);
			this._timeoutIds.clear();
			const textImage = this.image;
			if (textImage) {
				var _this$ctx$imageCache$2;
				if (((_this$ctx$imageCache$2 = this.ctx.imageCache.get(this.cacheKey)) === null || _this$ctx$imageCache$2 === void 0 ? void 0 : _this$ctx$imageCache$2.image) !== textImage) destroyTextImage(textImage);
			}
			this.image = null;
			if (this.buttonImage && this.buttonImage !== textImage) destroyTextImage(this.buttonImage);
			this.buttonImage = null;
		}
	};
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
			_defineProperty(this, "pooledCanvases", /* @__PURE__ */ new WeakSet());
			this.maxSize = maxSize;
		}
		acquire() {
			const canvas = this.pool.pop();
			if (canvas) {
				this.pooledCanvases.delete(canvas);
				return canvas;
			}
			return document.createElement("canvas");
		}
		release(canvas) {
			if (this.pooledCanvases.has(canvas)) return;
			if (this.pool.length >= this.maxSize) return;
			canvas.width = 0;
			canvas.height = 0;
			this.pooledCanvases.add(canvas);
			this.pool.push(canvas);
		}
		clear() {
			this.pool.length = 0;
			this.pooledCanvases = /* @__PURE__ */ new WeakSet();
		}
	};
	const canvasPool = new CanvasPool();
	//#endregion
	//#region src/renderer/canvas.ts
	const MAX_CANVAS_DIMENSION = 8192;
	const MAX_CANVAS_AREA = 16777216;
	const MAX_MEASURE_TEXT_CACHE_TEXT_LENGTH = 512;
	const clampCanvasSize = (width, height) => {
		let nextWidth = Number.isFinite(width) ? Math.max(0, Math.floor(width)) : 0;
		let nextHeight = Number.isFinite(height) ? Math.max(0, Math.floor(height)) : 0;
		if (nextWidth > MAX_CANVAS_DIMENSION || nextHeight > MAX_CANVAS_DIMENSION) {
			const scale = Math.min(MAX_CANVAS_DIMENSION / Math.max(1, nextWidth), MAX_CANVAS_DIMENSION / Math.max(1, nextHeight));
			nextWidth = Math.floor(nextWidth * scale);
			nextHeight = Math.floor(nextHeight * scale);
		}
		if (nextWidth * nextHeight > 16777216) {
			const scale = Math.sqrt(MAX_CANVAS_AREA / (nextWidth * nextHeight));
			nextWidth = Math.floor(nextWidth * scale);
			nextHeight = Math.floor(nextHeight * scale);
		}
		return {
			width: nextWidth,
			height: nextHeight
		};
	};
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
			_defineProperty(this, "_destroyed", false);
			this.pooled = !canvas;
			this._onDestroy = onDestroy;
			this.canvas = canvas !== null && canvas !== void 0 ? canvas : canvasPool.acquire();
			const context = this.canvas.getContext("2d");
			if (!context) throw new CanvasRenderingContext2DError();
			this.context = context;
			this.video = video;
			this.padding = padding;
			this.width = this.canvas.width;
			this.height = this.canvas.height;
			if (this.padding > 0) {
				this.canvas.width += this.padding * 2;
				this.canvas.height += this.padding * 2;
			}
			this.resetContextState();
		}
		resetContextState() {
			this.context.textAlign = "start";
			this.context.textBaseline = "alphabetic";
			this.context.lineJoin = "round";
			if (this.padding > 0) this.context.translate(this.padding, this.padding);
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
			const rect = getDrawImageRect(image, x, y, width, height);
			this.context.drawImage(image.canvas, rect.x, rect.y, rect.width, rect.height);
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
			const transform = this.context.getTransform();
			this.context.save();
			try {
				this.context.setTransform(1, 0, 0, 1, 0, 0);
				this.context.clearRect(x * transform.a + transform.e, y * transform.d + transform.f, width * transform.a, height * transform.d);
			} finally {
				this.context.restore();
			}
		}
		clear() {
			this.context.save();
			try {
				this.context.setTransform(1, 0, 0, 1, 0, 0);
				this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
			} finally {
				this.context.restore();
			}
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
			const paddingSize = this.padding * 2;
			const size = clampCanvasSize(width + paddingSize, height + paddingSize);
			this.width = Math.max(0, size.width - paddingSize);
			this.height = Math.max(0, size.height - paddingSize);
			this.canvas.width = size.width;
			this.canvas.height = size.height;
			this.resetContextState();
		}
		getSize() {
			return {
				width: this.width,
				height: this.height
			};
		}
		getImagePadding() {
			return this.padding;
		}
		measureText(text) {
			if (text.length > MAX_MEASURE_TEXT_CACHE_TEXT_LENGTH) return this.context.measureText(text);
			const key = `${this.context.font}\0${text}`;
			const cached = CanvasRenderer._mtCache.get(key);
			if (cached !== void 0) return cached;
			const result = this.context.measureText(text);
			if (CanvasRenderer._mtCache.size < CanvasRenderer._MT_CACHE_MAX_SIZE) CanvasRenderer._mtCache.set(key, result);
			return result;
		}
		/**
		* Measure text on a dedicated detached canvas, so WKWebView resolves fonts
		* like the offscreen render canvas instead of the connected main canvas.
		*
		* The `drawScale` transform is still applied to mirror render-time state and
		* keep cache keys distinct, but the WKWebView mismatch observed for #323 is
		* caused by connected-vs-detached canvas font matching, not by the transform.
		*/
		measureTextAtDrawScale(text, drawScale) {
			const font = this.context.font;
			if (text.length > MAX_MEASURE_TEXT_CACHE_TEXT_LENGTH) return this._measureAtScale(text, font, drawScale);
			const key = `@${drawScale}\0${font}\0${text}`;
			const cached = CanvasRenderer._mtCache.get(key);
			if (cached !== void 0) return cached;
			const result = this._measureAtScale(text, font, drawScale);
			if (CanvasRenderer._mtCache.size < CanvasRenderer._MT_CACHE_MAX_SIZE) CanvasRenderer._mtCache.set(key, result);
			return result;
		}
		_measureAtScale(text, font, drawScale) {
			if (typeof document === "undefined") return this.context.measureText(text);
			if (!CanvasRenderer._dsCanvas) {
				CanvasRenderer._dsCanvas = document.createElement("canvas");
				CanvasRenderer._dsCanvas.width = 1;
				CanvasRenderer._dsCanvas.height = 1;
				CanvasRenderer._dsCtx = CanvasRenderer._dsCanvas.getContext("2d");
			}
			const ctx = CanvasRenderer._dsCtx;
			if (!ctx) return this.context.measureText(text);
			if (CanvasRenderer._dsScale !== drawScale) {
				ctx.setTransform(drawScale, 0, 0, drawScale, 0, 0);
				CanvasRenderer._dsScale = drawScale;
				CanvasRenderer._dsFont = "";
			}
			if (CanvasRenderer._dsFont !== font) {
				ctx.font = font;
				CanvasRenderer._dsFont = font;
			}
			return ctx.measureText(text);
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
			if (this._destroyed) return;
			this._destroyed = true;
			(_this$_onDestroy = this._onDestroy) === null || _this$_onDestroy === void 0 || _this$_onDestroy.call(this);
			if (this.pooled) canvasPool.release(this.canvas);
		}
	};
	_defineProperty(CanvasRenderer, "_MT_CACHE_MAX_SIZE", 5e3);
	_defineProperty(CanvasRenderer, "_mtCache", /* @__PURE__ */ new Map());
	_defineProperty(CanvasRenderer, "_dsCanvas", null);
	_defineProperty(CanvasRenderer, "_dsCtx", null);
	_defineProperty(CanvasRenderer, "_dsScale", 0);
	_defineProperty(CanvasRenderer, "_dsFont", "");
	const getDrawImageRect = (image, x, y, width, height) => {
		const source = image.canvas;
		const sourceWidth = source.width;
		const sourceHeight = source.height;
		const hasDestinationSize = width !== void 0 && height !== void 0;
		const defaultRect = {
			x,
			y,
			width: hasDestinationSize ? width : sourceWidth,
			height: hasDestinationSize ? height : sourceHeight
		};
		if (!(image instanceof CanvasRenderer)) return defaultRect;
		const padding = image.getImagePadding();
		if (padding <= 0) return defaultRect;
		const logicalSize = image.getSize();
		const contentWidth = hasDestinationSize ? width : logicalSize.width;
		const contentHeight = hasDestinationSize ? height : logicalSize.height;
		const scaleX = !hasDestinationSize || logicalSize.width <= 0 ? 1 : width / logicalSize.width;
		const scaleY = !hasDestinationSize || logicalSize.height <= 0 ? 1 : height / logicalSize.height;
		const paddingX = padding * scaleX;
		const paddingY = padding * scaleY;
		return {
			x: x - paddingX,
			y: y - paddingY,
			width: contentWidth + paddingX * 2,
			height: contentHeight + paddingY * 2
		};
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
	const flashScriptCharRegexCache = /* @__PURE__ */ new WeakMap();
	const MAX_FLASH_COMMENT_IMAGE_WIDTH = 8192;
	const MAX_FLASH_COMMENT_IMAGE_HEIGHT = 8192;
	const isWithinFlashImageBounds = (width, height) => {
		return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 && width <= MAX_FLASH_COMMENT_IMAGE_WIDTH && height <= MAX_FLASH_COMMENT_IMAGE_HEIGHT && width * height <= 16777216;
	};
	const takeFlashDisplayPart = (value, remaining) => {
		if (!value || !remaining.value) return "";
		const part = remaining.value.slice(0, value.length);
		remaining.value = remaining.value.slice(part.length);
		return part;
	};
	var FlashComment = class extends BaseComment {
		constructor(comment, renderer, index, ctx) {
			var _this$_globalScale;
			super(comment, renderer, index, ctx);
			_defineProperty(this, "_globalScale", void 0);
			_defineProperty(this, "_buttonImageState", void 0);
			_defineProperty(this, "pluginName", "FlashComment");
			(_this$_globalScale = this._globalScale) !== null && _this$_globalScale !== void 0 || (this._globalScale = getConfig(this.config.commentScale, true));
		}
		get _flashScriptCharRegex() {
			let cached = flashScriptCharRegexCache.get(this.ctx.config);
			if (!cached) {
				cached = {
					super: new RegExp(this.ctx.config.flashScriptChar.super, "g"),
					sub: new RegExp(this.ctx.config.flashScriptChar.sub, "g")
				};
				flashScriptCharRegexCache.set(this.ctx.config, cached);
			}
			return cached;
		}
		get content() {
			return this.comment.rawContent;
		}
		get flash() {
			return true;
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
		destroy() {
			super.destroy();
			this._buttonImageState = void 0;
		}
		convertComment(comment) {
			this._globalScale = getConfig(this.config.commentScale, true);
			return getButtonParts(this.getCommentSize(this.parseCommandAndNicoscript(comment)), this.config);
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
			this.renderer.setFont(parseFont(parsedData.font, parsedData.fontSize, this.config));
			const meas = this.measureText(_objectSpread2(_objectSpread2({}, parsedData), {}, { scale: 1 }));
			if (this.ctx.options.scale !== 1 && parsedData.layer === -1) {
				meas.height *= this.ctx.options.scale;
				meas.width *= this.ctx.options.scale;
			}
			this.renderer.restore();
			if (parsedData.button && !parsedData.button.hidden) meas.width += getConfig(this.config.atButtonPadding, true) * 4;
			return _objectSpread2(_objectSpread2({}, parsedData), {}, {
				height: meas.height * this._globalScale,
				width: meas.width * this._globalScale,
				lineHeight: meas.lineHeight,
				fontSize: meas.fontSize,
				resized: meas.resized,
				resizedX: meas.resizedX,
				resizedY: meas.resizedY,
				charSize: meas.charSize,
				scale: meas.scale,
				scaleX: meas.scaleX,
				content: meas.content
			});
		}
		parseCommandAndNicoscript(comment) {
			const data = parseCommandAndNicoScript(comment, this.ctx);
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
			var _clamped$content$matc, _clamped$content$matc2, _clamped$content$matc3, _clamped$content$matc4;
			const content = [];
			const appendContent = (value, isButton = false) => {
				const remaining = MAX_FLASH_CONTENT_ITEMS - content.length;
				if (remaining <= 0) return;
				const parsed = parseContent(value, this.config).slice(0, remaining);
				if (isButton) for (const val of parsed) val.isButton = true;
				content.push(...parsed);
			};
			const clamped = clampFlashContent(button ? `${button.message.before}${button.message.body}${button.message.after}` : input);
			if (button) {
				const remainingDisplayText = { value: clamped.content };
				appendContent(takeFlashDisplayPart(button.message.before, remainingDisplayText));
				appendContent(takeFlashDisplayPart(button.message.body, remainingDisplayText), true);
				appendContent(takeFlashDisplayPart(button.message.after, remainingDisplayText));
			} else appendContent(clamped.content);
			return {
				content,
				lineCount: clamped.lineCount,
				lineOffset: ((_clamped$content$matc = (_clamped$content$matc2 = clamped.content.match(this._flashScriptCharRegex.super)) === null || _clamped$content$matc2 === void 0 ? void 0 : _clamped$content$matc2.length) !== null && _clamped$content$matc !== void 0 ? _clamped$content$matc : 0) * -1 * this.config.flashScriptCharOffset + ((_clamped$content$matc3 = (_clamped$content$matc4 = clamped.content.match(this._flashScriptCharRegex.sub)) === null || _clamped$content$matc4 === void 0 ? void 0 : _clamped$content$matc4.length) !== null && _clamped$content$matc3 !== void 0 ? _clamped$content$matc3 : 0) * this.config.flashScriptCharOffset
			};
		}
		measureText(comment) {
			var _comment$lineHeight;
			const configLineHeight = getConfig(this.config.lineHeight, true);
			const configFontSize = getConfig(this.config.fontSize, true)[comment.size];
			const configStageSize = getConfig(this.config.commentStageSize, true);
			const defaultFontSize = configFontSize.default;
			(_comment$lineHeight = comment.lineHeight) !== null && _comment$lineHeight !== void 0 || (comment.lineHeight = configLineHeight[comment.size].default);
			const widthLimit = configStageSize[comment.full ? "fullWidth" : "width"];
			const layerScale = comment.layer === -1 ? this.ctx.options.scale : 1;
			const drawScale = this._globalScale * layerScale;
			const { scaleX, width, height } = this._measureContent(comment, drawScale);
			let scale = 1;
			if (isLineBreakResize(comment, this.config)) {
				comment.resized = true;
				comment.resizedY = true;
				const lineBreakScale = this.config.flashLineBreakScale[comment.size];
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
		_measureContent(comment, drawScale) {
			var _comment$lineHeight2;
			const measureTextAtDrawScale = this.renderer.measureTextAtDrawScale;
			const measureText = measureTextAtDrawScale ? (val) => measureTextAtDrawScale.call(this.renderer, val, drawScale) : (val) => this.renderer.measureText(val);
			let currentWidth = 0;
			let spacedWidth = 0;
			let leadLineWidth = 1;
			let leadLineSpacedWidth = 0;
			const recordLineWidth = () => {
				if (leadLineSpacedWidth < spacedWidth) {
					leadLineWidth = currentWidth || 1;
					leadLineSpacedWidth = spacedWidth;
				}
			};
			for (const item of comment.content) {
				var _item$font;
				if (item.type === "spacer") {
					spacedWidth += item.count * item.charWidth * comment.fontSize + Math.max(item.count - 1, 0) * this.config.flashLetterSpacing;
					currentWidth += item.count * item.charWidth * comment.fontSize;
					recordLineWidth();
					continue;
				}
				const lines = item.content.split("\n");
				const widths = [];
				this.renderer.setFont(parseFont((_item$font = item.font) !== null && _item$font !== void 0 ? _item$font : comment.font, comment.fontSize, this.config));
				for (let i = 0, n = lines.length; i < n; i++) {
					const value = lines[i];
					if (value === void 0) continue;
					const meas = measureText(value);
					currentWidth += meas.width;
					spacedWidth += meas.width + Math.max(value.length - 1, 0) * this.config.flashLetterSpacing;
					widths.push(meas.width);
					if (i < lines.length - 1) {
						recordLineWidth();
						spacedWidth = 0;
						currentWidth = 0;
					}
				}
				recordLineWidth();
				item.width = widths;
			}
			return {
				scaleX: leadLineSpacedWidth / leadLineWidth,
				width: leadLineSpacedWidth * comment.scale,
				height: (comment.fontSize * ((_comment$lineHeight2 = comment.lineHeight) !== null && _comment$lineHeight2 !== void 0 ? _comment$lineHeight2 : 0) * comment.lineCount + this.config.flashCommentYPaddingTop[comment.resizedY ? "resized" : "default"]) * comment.scale
			};
		}
		_drawCollision(posX, posY, showCollision) {
			if (showCollision) {
				this.renderer.save();
				try {
					this.renderer.setStrokeStyle("rgba(255,0,255,1)");
					this.renderer.strokeRect(posX, posY, this.comment.width, this.comment.height);
					for (let i = 0, n = this.comment.lineCount; i < n; i++) {
						const linePosY = ((i + 1) * (this.comment.fontSize * this.comment.lineHeight) + this.config.flashCommentYPaddingTop[this.comment.resizedY ? "resized" : "default"]) * this.comment.scale;
						this.renderer.setStrokeStyle("rgba(255,255,0,0.25)");
						this.renderer.strokeRect(posX, posY + linePosY * this._globalScale, this.comment.width, this.comment.fontSize * this.comment.lineHeight * -1 * this._globalScale * this.comment.scale * (this.comment.layer === -1 ? this.ctx.options.scale : 1));
					}
				} finally {
					this.renderer.restore();
				}
			}
		}
		_generateTextImage() {
			const renderer = this.renderer.getCanvas();
			try {
				this._setupCanvas(renderer);
				const atButtonPadding = getConfig(this.config.atButtonPadding, true);
				const lineOffset = this.comment.lineOffset;
				const lineHeight = this.comment.fontSize * this.comment.lineHeight;
				const offsetKey = this.comment.resizedY ? "resized" : "default";
				const offsetY = this.config.flashCommentYPaddingTop[offsetKey] + this.comment.fontSize * this.comment.lineHeight * this.config.flashCommentYOffset[this.comment.size][offsetKey];
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
						renderer.setFont(parseFont(font, this.comment.fontSize, this.config));
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
			} catch (e) {
				if (typeof renderer.destroy === "function") renderer.destroy();
				throw e;
			}
			return renderer;
		}
		canGenerateTextImage() {
			const atButtonPadding = this.comment.button ? getConfig(this.config.atButtonPadding, true) * 2 : 0;
			return isWithinFlashImageBounds(this.comment.width, this.comment.height + atButtonPadding);
		}
		getButtonImage(posX, posY, cursor) {
			var _this$buttonImage, _this$buttonImage2;
			if (!this.comment.button || this.comment.button.hidden) return void 0;
			const parts = this.comment.buttonObjects;
			if (!parts) return void 0;
			const isHover = this.isHovered(cursor, posX, posY);
			const strokeStyle = (() => {
				if (isHover) return this.comment.color;
				if (this.comment.button && this.comment.button.limit < 1) return "#777777";
				return "white";
			})();
			const atButtonPadding = getConfig(this.config.atButtonPadding, true);
			const nextState = {
				height: this.comment.height + atButtonPadding * 2,
				strokeStyle,
				width: this.comment.width
			};
			if (!(!this.buttonImage || !this._buttonImageState || this._buttonImageState.width !== nextState.width || this._buttonImageState.height !== nextState.height || this._buttonImageState.strokeStyle !== nextState.strokeStyle)) return (_this$buttonImage = this.buttonImage) !== null && _this$buttonImage !== void 0 ? _this$buttonImage : void 0;
			const renderer = (_this$buttonImage2 = this.buttonImage) !== null && _this$buttonImage2 !== void 0 ? _this$buttonImage2 : this.renderer.getCanvas();
			this.buttonImage = renderer;
			this._setupCanvas(renderer);
			const atButtonRadius = getConfig(this.config.atButtonRadius, true);
			renderer.save();
			renderer.setStrokeStyle(strokeStyle);
			drawLeftBorder(renderer, parts.left.left, parts.left.top, parts.left.width, parts.left.height, atButtonRadius);
			for (const part of parts.middle) drawMiddleBorder(renderer, part.left, part.top, part.width, part.height);
			drawRightBorder(renderer, parts.right.right, parts.right.top, parts.right.height, atButtonRadius);
			renderer.restore();
			this._buttonImageState = nextState;
			return renderer;
		}
		isHovered(_cursor, _posX, _posY) {
			if (!_cursor || !this.comment.buttonObjects) return false;
			const { left, middle, right } = this.comment.buttonObjects;
			const scaleY = this._globalScale * this.comment.scale * (this.comment.layer === -1 ? this.ctx.options.scale : 1);
			const scaleX = scaleY * this.comment.scaleX;
			const posX = (_posX !== null && _posX !== void 0 ? _posX : this.pos.x) / scaleX;
			const posY = (_posY !== null && _posY !== void 0 ? _posY : this.pos.y) / scaleY;
			const cursor = {
				x: _cursor.x / scaleX,
				y: _cursor.y / scaleY
			};
			if (cursor.x < posX || posX + this.comment.width < cursor.x || cursor.y < posY + left.top || posY + right.top + right.height < cursor.y) return false;
			const atButtonPadding = getConfig(this.config.atButtonPadding, true);
			const between = (val, min, max) => {
				return min < val && val < max;
			};
			for (const part of [left, ...middle]) if (between(cursor.x, posX + part.left, posX + part.left + part.width) && between(cursor.y, posY + part.top, posY + part.top + part.height)) return true;
			return between(cursor.x, posX + right.right - atButtonPadding, posX + right.right + getConfig(this.config.contextLineWidth, true) / 2) && between(cursor.y, posY + right.top, posY + right.top + right.height);
		}
		_setupCanvas(renderer) {
			const atButtonPadding = getConfig(this.config.atButtonPadding, true);
			renderer.setSize(this.comment.width, this.comment.height + (this.comment.button ? atButtonPadding * 2 : 0));
			renderer.setStrokeStyle(getStrokeColor(this.comment, this.config));
			renderer.setFillStyle(this.comment.color);
			renderer.setLineWidth(getConfig(this.config.contextLineWidth, true));
			renderer.setFont(parseFont(this.comment.font, this.comment.fontSize, this.config));
			const scale = this._globalScale * this.comment.scale * (this.comment.layer === -1 ? this.ctx.options.scale : 1);
			renderer.setScale(scale * this.comment.scaleX, scale);
			return { renderer };
		}
	};
	//#endregion
	//#region src/comments/HTML5Comment.ts
	const MAX_RESIZE_ITERATIONS = 20;
	const MIN_HTML5_RESIZE_CHAR_SIZE = 1e-6;
	const MAX_HTML5_COMMENT_CHARS = 16384;
	const MAX_HTML5_COMMENT_LINES = 256;
	const HTML5_COMMENT_IMAGE_PADDING = 4;
	const MAX_HTML5_COMMENT_IMAGE_WIDTH = 8192 - HTML5_COMMENT_IMAGE_PADDING * 2;
	const MAX_HTML5_COMMENT_IMAGE_HEIGHT = 8192 - HTML5_COMMENT_IMAGE_PADDING * 2;
	const MAX_HTML5_COMMENT_IMAGE_AREA = MAX_CANVAS_AREA;
	const clampHTML5Content = (input) => {
		let lineCount = 1;
		let end = 0;
		for (; end < input.length && end < MAX_HTML5_COMMENT_CHARS; end++) if (input[end] === "\n") {
			if (lineCount >= MAX_HTML5_COMMENT_LINES) break;
			lineCount++;
		}
		return {
			content: input.slice(0, end),
			lineCount
		};
	};
	const isWithinImageBounds = (width, height) => {
		const paddedWidth = width + HTML5_COMMENT_IMAGE_PADDING * 2;
		const paddedHeight = height + HTML5_COMMENT_IMAGE_PADDING * 2;
		return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 && width <= MAX_HTML5_COMMENT_IMAGE_WIDTH && height <= MAX_HTML5_COMMENT_IMAGE_HEIGHT && paddedWidth * paddedHeight <= MAX_HTML5_COMMENT_IMAGE_AREA;
	};
	var HTML5Comment = class extends BaseComment {
		constructor(comment, context, index, ctx) {
			super(comment, context, index, ctx);
			_defineProperty(this, "pluginName", "HTML5Comment");
			_defineProperty(this, "textImageBoundsCache", /* @__PURE__ */ new WeakMap());
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
			this.renderer.setFont(parseFont(parsedData.font, parsedData.fontSize, this.config));
			const meas = this.measureText(_objectSpread2(_objectSpread2({}, parsedData), {}, { scale: 1 }));
			if (this.ctx.options.scale !== 1 && parsedData.layer === -1) {
				meas.height *= this.ctx.options.scale;
				meas.width *= this.ctx.options.scale;
				meas.fontSize *= this.ctx.options.scale;
			}
			this.renderer.restore();
			return _objectSpread2(_objectSpread2({}, parsedData), {}, {
				height: meas.height,
				width: meas.width,
				lineHeight: meas.lineHeight,
				fontSize: meas.fontSize,
				resized: meas.resized,
				resizedX: meas.resizedX,
				resizedY: meas.resizedY,
				charSize: meas.charSize,
				content: meas.content,
				scaleX: meas.scaleX,
				scale: meas.scale
			});
		}
		parseCommandAndNicoscript(comment) {
			const data = parseCommandAndNicoScript(comment, this.ctx);
			const { content, lineCount, lineOffset } = this.parseContent(comment.content, data.font);
			return _objectSpread2(_objectSpread2(_objectSpread2({}, comment), {}, { rawContent: comment.content }, data), {}, {
				content,
				lineCount,
				lineOffset
			});
		}
		parseContent(input, font) {
			const content = [];
			const clamped = clampHTML5Content(input);
			addHTML5PartToResult(content, clamped.content, this.config, font !== null && font !== void 0 ? font : "defont");
			return {
				content,
				lineCount: clamped.lineCount,
				lineOffset: 0
			};
		}
		measureText(comment) {
			var _comment$charSize, _comment$lineHeight, _comment$charSize2;
			const scale = getConfig(this.config.commentScale, false);
			const configFontSize = getConfig(this.config.fontSize, false);
			const lineHeight = getLineHeight(comment.size, false, this.config);
			const charSize = getCharSize(comment.size, false, this.config);
			if (!comment.lineHeight) comment.lineHeight = lineHeight;
			if (!comment.charSize) comment.charSize = charSize;
			comment.fontSize = comment.charSize * .8;
			this.renderer.setFont(parseFont(comment.font, comment.fontSize, this.config));
			if (isLineBreakResize(comment, this.config)) {
				comment.fontSize = configFontSize[comment.size].resized;
				const newLineHeight = getLineHeight(comment.size, false, this.config, true);
				comment.charSize = comment.charSize * (newLineHeight / comment.lineHeight);
				comment.lineHeight = newLineHeight;
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
			const widthLimit = getConfig(this.config.commentStageSize, false)[comment.full ? "fullWidth" : "width"];
			if (!typeGuard.internal.MeasureInput(comment)) throw new TypeGuardError();
			const layerScale = comment.layer === -1 ? this.ctx.options.scale : 1;
			const measureResult = measure(comment, this.renderer, this.config, layerScale);
			if (comment.loc !== "naka" && measureResult.width > widthLimit) return this._processResizeX(comment, measureResult.width, layerScale);
			return measureResult;
		}
		_processResizeX(comment, width, layerScale = 1) {
			var _comment$charSize3, _comment$lineHeight2, _comment$charSize6;
			const widthLimit = getConfig(this.config.commentStageSize, false)[comment.full ? "fullWidth" : "width"];
			const lineHeight = getLineHeight(comment.size, false, this.config);
			const charSize = getCharSize(comment.size, false, this.config);
			const scale = widthLimit / width;
			comment.resizedX = true;
			const currentCharSize = Math.max(MIN_HTML5_RESIZE_CHAR_SIZE, (_comment$charSize3 = comment.charSize) !== null && _comment$charSize3 !== void 0 ? _comment$charSize3 : 0);
			const currentLineHeight = Math.max(MIN_HTML5_RESIZE_CHAR_SIZE, (_comment$lineHeight2 = comment.lineHeight) !== null && _comment$lineHeight2 !== void 0 ? _comment$lineHeight2 : 0);
			const rawBaseCharSize = currentCharSize * scale;
			const rawBaseLineHeight = currentLineHeight * scale;
			const baseCharSize = Math.max(MIN_HTML5_RESIZE_CHAR_SIZE, rawBaseCharSize);
			const baseLineHeight = Math.max(MIN_HTML5_RESIZE_CHAR_SIZE, rawBaseLineHeight);
			const legacyBaseCharSize = Math.max(1, rawBaseCharSize);
			const legacyBaseLineHeight = Math.max(1, rawBaseLineHeight);
			const workComment = _objectSpread2(_objectSpread2({}, comment), {}, {
				charSize: legacyBaseCharSize,
				lineHeight: legacyBaseLineHeight,
				fontSize: legacyBaseCharSize * .8
			});
			if (!typeGuard.internal.MeasureInput(workComment)) throw new TypeGuardError();
			const getLegacyMeasured = (nextCharSize) => {
				workComment.charSize = nextCharSize;
				workComment.lineHeight = legacyBaseLineHeight * (nextCharSize / legacyBaseCharSize);
				workComment.fontSize = nextCharSize * .8;
				return measure(workComment, this.renderer, this.config, layerScale);
			};
			if (baseCharSize >= 1) {
				var _comment$charSize5;
				let resizedCharSize = legacyBaseCharSize;
				let resizedLineHeight = legacyBaseLineHeight;
				let result = getLegacyMeasured(resizedCharSize);
				if (result.width > widthLimit) {
					let remainingIterations = MAX_RESIZE_ITERATIONS;
					while (result.width > widthLimit && resizedCharSize > 1 && remainingIterations-- > 0) {
						const originalCharSize = resizedCharSize;
						resizedCharSize = Math.max(1, resizedCharSize - 1);
						resizedLineHeight *= resizedCharSize / originalCharSize;
						workComment.lineHeight = resizedLineHeight;
						result = getLegacyMeasured(resizedCharSize);
					}
				} else {
					let lastCharSize = resizedCharSize;
					let lastLineHeight = resizedLineHeight;
					let remainingIterations = MAX_RESIZE_ITERATIONS;
					while (result.width < widthLimit && remainingIterations-- > 0) {
						lastCharSize = resizedCharSize;
						lastLineHeight = resizedLineHeight;
						const originalCharSize = resizedCharSize;
						resizedCharSize += 1;
						resizedLineHeight *= resizedCharSize / originalCharSize;
						workComment.lineHeight = resizedLineHeight;
						result = getLegacyMeasured(resizedCharSize);
					}
					resizedCharSize = lastCharSize;
					resizedLineHeight = lastLineHeight;
				}
				if (comment.resizedY) {
					var _comment$charSize4;
					const resizeScale = resizedCharSize / ((_comment$charSize4 = comment.charSize) !== null && _comment$charSize4 !== void 0 ? _comment$charSize4 : 1);
					comment.charSize = resizeScale * charSize;
					comment.lineHeight = resizeScale * lineHeight;
				} else {
					comment.charSize = resizedCharSize;
					comment.lineHeight = resizedLineHeight;
				}
				comment.fontSize = ((_comment$charSize5 = comment.charSize) !== null && _comment$charSize5 !== void 0 ? _comment$charSize5 : 0) * .8;
				return measure(comment, this.renderer, this.config, layerScale);
			}
			const getMeasured = (_nextCharSize) => {
				var _workComment$charSize;
				const nextCharSize = Math.max(MIN_HTML5_RESIZE_CHAR_SIZE, _nextCharSize);
				if (comment.resizedY) {
					const resizeScale = nextCharSize / currentCharSize;
					workComment.charSize = resizeScale * charSize;
					workComment.lineHeight = resizeScale * lineHeight;
				} else {
					workComment.charSize = nextCharSize;
					workComment.lineHeight = baseLineHeight * (nextCharSize / baseCharSize);
				}
				workComment.fontSize = ((_workComment$charSize = workComment.charSize) !== null && _workComment$charSize !== void 0 ? _workComment$charSize : 0) * .8;
				return measure(workComment, this.renderer, this.config, layerScale);
			};
			let best = baseCharSize;
			if (getMeasured(baseCharSize).width > widthLimit) {
				let low = MIN_HTML5_RESIZE_CHAR_SIZE;
				let high = baseCharSize;
				let remainingIterations = MAX_RESIZE_ITERATIONS;
				const lowResult = getMeasured(low);
				best = low;
				if (lowResult.width <= widthLimit) while (remainingIterations-- > 0 && low < high) {
					const candidateCharSize = (low + high) / 2;
					if (getMeasured(candidateCharSize).width <= widthLimit) {
						best = candidateCharSize;
						low = candidateCharSize;
					} else high = candidateCharSize;
				}
			} else {
				let low = baseCharSize;
				let high = currentCharSize;
				let remainingIterations = MAX_RESIZE_ITERATIONS;
				while (remainingIterations-- > 0 && low < high) {
					const mid = (low + high) / 2;
					if (getMeasured(mid).width <= widthLimit) {
						best = mid;
						low = mid;
					} else high = mid;
				}
			}
			if (comment.resizedY) {
				const resizeScale = best / currentCharSize;
				comment.charSize = resizeScale * charSize;
				comment.lineHeight = resizeScale * lineHeight;
			} else {
				comment.charSize = best;
				comment.lineHeight = baseLineHeight * (best / baseCharSize);
			}
			comment.fontSize = ((_comment$charSize6 = comment.charSize) !== null && _comment$charSize6 !== void 0 ? _comment$charSize6 : 0) * .8;
			return measure(comment, this.renderer, this.config, layerScale);
		}
		_drawCollision(posX, posY, showCollision) {
			if (showCollision) {
				this.renderer.save();
				try {
					const scale = getConfig(this.config.commentScale, false);
					this.renderer.setStrokeStyle("rgba(0,255,255,1)");
					this.renderer.strokeRect(posX, posY, this.comment.width, this.comment.height);
					for (let i = 0, n = this.comment.lineCount; i < n; i++) {
						var _this$config$fonts$ht;
						if (!typeGuard.internal.HTML5Fonts(this.comment.font)) throw new TypeGuardError();
						const linePosY = (this.comment.lineHeight * (i + 1) + (this.comment.charSize - this.comment.lineHeight) / 2 + this.comment.lineHeight * -.16 + (((_this$config$fonts$ht = this.config.fonts.html5[this.comment.font]) === null || _this$config$fonts$ht === void 0 ? void 0 : _this$config$fonts$ht.offset) || 0)) * scale;
						this.renderer.setStrokeStyle("rgba(255,255,0,0.5)");
						this.renderer.strokeRect(posX, posY + linePosY, this.comment.width, this.comment.fontSize * -1 * scale);
					}
				} finally {
					this.renderer.restore();
				}
			}
		}
		canGenerateTextImage() {
			return isWithinImageBounds(this.comment.width, this.getTextImageBounds().height);
		}
		getTextImageBounds() {
			const cached = this.textImageBoundsCache.get(this.comment);
			if (cached !== void 0) return cached;
			const { scale } = getFontSizeAndScale(this.comment.charSize, this.config);
			const paddingTop = (10 - scale * 10) * ((this.comment.lineCount + 1) / this.config.html5HiResCommentCorrection);
			const layerScale = this.comment.layer === -1 ? this.ctx.options.scale : 1;
			const paddingTopHeight = this.comment.lineHeight * paddingTop * getConfig(this.config.commentScale, false) * layerScale;
			const bounds = {
				height: this.comment.height + paddingTopHeight,
				paddingTop: paddingTopHeight
			};
			this.textImageBoundsCache.set(this.comment, bounds);
			return bounds;
		}
		_draw(posX, posY, cursor) {
			const bounds = this.getTextImageBounds();
			const drawY = this.comment.owner && this.comment.resizedX ? posY : posY - bounds.paddingTop;
			super._draw(posX, drawY, cursor);
		}
		_generateTextImage() {
			const { fontSize, scale } = getFontSizeAndScale(this.comment.charSize, this.config);
			const paddingTop = (10 - scale * 10) * ((this.comment.lineCount + 1) / this.config.html5HiResCommentCorrection);
			const drawScale = getConfig(this.config.commentScale, false) * scale * (this.comment.layer === -1 ? this.ctx.options.scale : 1);
			const image = this.renderer.getCanvas(HTML5_COMMENT_IMAGE_PADDING);
			try {
				var _this$config$fonts$ht2;
				image.setSize(this.comment.width, this.getTextImageBounds().height);
				image.setStrokeStyle(getStrokeColor(this.comment, this.config));
				image.setFillStyle(this.comment.color);
				image.setLineWidth(getConfig(this.config.contextLineWidth, false));
				image.setFont(parseFont(this.comment.font, fontSize, this.config));
				image.setScale(drawScale);
				let lineCount = 0;
				if (!typeGuard.internal.HTML5Fonts(this.comment.font)) throw new TypeGuardError();
				const offsetY = (this.comment.charSize - this.comment.lineHeight) / 2 + this.comment.lineHeight * -.16 + (((_this$config$fonts$ht2 = this.config.fonts.html5[this.comment.font]) === null || _this$config$fonts$ht2 === void 0 ? void 0 : _this$config$fonts$ht2.offset) || 0);
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
			} catch (e) {
				if (typeof image.destroy === "function") image.destroy();
				throw e;
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
	//#region src/contexts/cache.ts
	var ImageCacheContext = class {
		constructor() {
			_defineProperty(this, "_cache", {});
		}
		get(key) {
			return this._cache[key];
		}
		set(key, value) {
			this._cache[key] = value;
		}
		delete(key) {
			delete this._cache[key];
		}
		reset() {
			for (const entry of Object.values(this._cache)) {
				clearTimeout(entry.timeout);
				if (typeof entry.image.destroy === "function") entry.image.destroy();
			}
			this._cache = {};
		}
	};
	//#endregion
	//#region src/contexts/nicoscript.ts
	const createNicoScripts = () => ({
		reverse: [],
		default: [],
		replace: [],
		ban: [],
		seekDisable: [],
		jump: []
	});
	//#endregion
	//#region src/contexts/index.ts
	var contexts_exports = /* @__PURE__ */ __exportAll({
		ImageCacheContext: () => ImageCacheContext,
		createNicoScripts: () => createNicoScripts
	});
	//#endregion
	//#region src/definition/config.ts
	var config_exports = /* @__PURE__ */ __exportAll({
		defaultConfig: () => defaultConfig,
		defaultOptions: () => defaultOptions,
		resetOptions: () => resetOptions,
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
	const setConfig = updateConfig;
	/**
	* 既定の設定
	*/
	const createDefaultOptions = () => ({
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
	});
	const defaultOptions = createDefaultOptions();
	const setOptions = (options) => {
		Object.assign(defaultOptions, options);
	};
	const resetOptions = () => {
		Object.assign(defaultOptions, createDefaultOptions());
	};
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
			/**
			* 色コマンド・カラコ対応
			* -> src/definition/color.ts
			*/
			colors,
			/**
			* fillColorが#000000以外の時の枠線の色
			*/
			contextStrokeColor: "#000000",
			/**
			* fillColorが#000000の時の枠線の色
			*/
			contextStrokeInversionColor: "#FFFFFF",
			/**
			* 枠線の透明度
			*/
			contextStrokeOpacity: .4,
			/**
			* _liveコマンドの透明度
			*/
			contextFillLiveOpacity: .5,
			/**
			* 縁取り線の太さ
			*/
			contextLineWidth: {
				html5: 2.8,
				flash: 4
			},
			/**
			* コメントのリサイズ
			*/
			commentScale: {
				html5: 1920 / 683,
				flash: 1920 / 683
			},
			/**
			* 描画範囲(リサイズ前)
			*/
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
			/**
			* フォントサイズ
			*/
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
			/**
			* 行高
			*/
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
			/**
			* 高解像度時のズレ補正値 @html5?
			*/
			html5HiResCommentCorrection: 20,
			/**
			* 最小フォントサイズ @html5
			* 描画時のフォントサイズはこれ以上小さくならない
			* これ以上縮小する場合はコメントのズレが発生する
			*/
			html5MinFontSize: 10,
			fonts: {
				/**
				* フォント @html5?
				*/
				html5: fonts[platform],
				/**
				* 描画に使うフォント
				* [size]に数値が入る
				*/
				flash: {
					gulim: `normal 600 [size]px gulim, ${fonts[platform].gothic.font}, Arial`,
					simsun: `normal 400 [size]px simsun, batang, "PMingLiU", MingLiU-ExtB, ${fonts[platform].mincho.font}, Arial`
				}
			},
			/**
			* fpsを更新する間隔(ms)
			*/
			fpsInterval: 500,
			/**
			* キャッシュの追加保持期間(ms)
			*/
			cacheAge: 2e3,
			/**
			* キャンバスの横幅
			*/
			canvasWidth: 1920,
			/**
			* キャンバスの高さ
			*/
			canvasHeight: 1080,
			/**
			* コメントの処理範囲
			*/
			commentDrawRange: 1530,
			/**
			* コメントの処理範囲外(片側)の幅
			* (config.canvasWidth - config.commentDrawRange) / 2,
			*/
			commentDrawPadding: 195,
			/**
			* 当たり判定の左右幅
			* left: collisionWidth,
			* right: canvasWidth - collisionWidth
			*/
			collisionRange: {
				left: 235,
				right: 1685
			},
			/**
			* コメント間の横の余白
			*/
			collisionPadding: 5,
			/**
			* 同一CAと判定する投下経過時間の最大値(秒)
			*/
			sameCARange: 3600,
			/**
			* 同一CAと判定するvposの範囲(vpos)
			*/
			sameCAGap: 100,
			/**
			* レイヤーを分離する基準値
			*/
			sameCAMinScore: 10,
			/**
			* レイヤーを分ける際に同一CAとして扱う時間(範囲)
			*/
			sameCATimestampRange: 300,
			/**
			* プラグインを保持するようの変数
			*/
			plugins: [],
			/**
			* コメントをFlash版として処理する上限値
			* 初期値はHTML5版のリリース日
			*/
			flashThreshold: 1499871600,
			/**
			* Flash版のフォント変化文字
			* todo: ゴシック保護文字を探す
			*/
			flashChar: {
				gulim: "[ĦħĲĳĸĿŀŉ-ŋŦŧː˚⁴ⁿ₁-₄ℓ⅓⅔⅜-⅞↔↕∼⒜-⒵ⓐ-ⓩ▣-▩▶▷◀◁◈◐◑☎☏☜☞♠♡♣-♥♧-♩♬ㄱ-ㅮ㈀-㈜㉠-㉻㎀-㎄㎈-㎍㎐-㎛㎟㎠㎢-㏊㏏㏐㏓㏖㏘㏛-㏝가-힣豈-廊浪-璉練廓￦]",
				simsunStrong: "[ǎǐǒǔǖǘǚǜɑɡˊˋ‖‵ⅪⅫ∣∶∷≌≮≯⊕⒃-⒛┄-┋╭-╳▁-▃▅-▇▉-▋▍-▏▔▕◢-◥☉〖〗〞〡-〩ㄅ-ㄩ㈠-㈩㊣㏎㏑㏒㏕-兀嗀︰︱︳-﹄﹉-﹒﹔-﹗﹙-﹦﹨-﹫]",
				simsunWeak: "[ˉ℅℉↖-↙∏∕≈≤≥⊙⑴-⒂┍┎┑┒┕┖┙┚┞┟┡┢┦┧┩┪┭┮┱┲┵┶┹┺┽┾╀╁╃-╊═-╬▄█▌▓]",
				gothic: "[ϻﾟ・]"
			},
			/**
			* Flash版の文字変化規則を設定
			* xp -> フォント変化文字全て適用
			* vista -> 1又は2種類のみに制限
			* 参考: https://w.atwiki.jp/commentart/pages/44.html
			*/
			flashMode: "vista",
			/**
			* Flash版の上付き・下付き文字
			* super: 上付き sub: 下付き
			* todo: 対象文字を探す
			*/
			flashScriptChar: {
				super: "[ª²³¹ºʰʲʳʷʸˡ-ˣ̄ᴬ-ᵃᵅ-ᵡᶛ-ᶡᶣ-ᶿ⁰ⁱ⁴-ⁿⱽ]",
				sub: "[̠ᵢ-ᵪ₀-₎ₐ-ₜⱼ]"
			},
			/**
			* Flash版コメントの高さを計算するための定数
			*/
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
			/**
			* Flash版コメントの上空白
			*/
			flashCommentYPaddingTop: {
				default: 5,
				resized: 3
			},
			/**
			* Flash版コメントの上下補正値
			*/
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
			/**
			* 文字間の空白
			*/
			flashLetterSpacing: 1,
			/**
			* コメントの上下補正値
			*/
			flashScriptCharOffset: .12,
			/**
			* コメント描画数の上限
			* undefinedの場合は無制限
			*/
			commentLimit: void 0,
			/**
			* コメント描画上限に達した際に消す順番
			* asc: 新しい方から上限まで(ニコニコ公式同様)
			* desc: 古い方から上限まで
			*/
			hideCommentOrder: "asc",
			/**
			* 改行リサイズの行数
			*/
			lineBreakCount: {
				big: 3,
				medium: 5,
				small: 7
			},
			/**
			* 独自のコメントを追加するための拡張
			* 多分画像流したりコメントに背景つけたりできる
			* class: コメント描画クラス
			* condition: コメント描画クラスを適用する条件
			*/
			commentPlugins: [{
				class: FlashComment,
				condition: isFlashComment
			}],
			/**
			* nakaコメントの速度補正値
			*/
			nakaCommentSpeedOffset: .95,
			/**
			* \@ボタンのボタンに適用する余白
			*/
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
	var eventHandler_exports = /* @__PURE__ */ __exportAll({ EventHandler: () => EventHandler });
	const rangeEnd = (range) => {
		var _range$end;
		return (_range$end = range.end) !== null && _range$end !== void 0 ? _range$end : Infinity;
	};
	const compareRangeEnd = (a, b) => {
		const endA = rangeEnd(a);
		const endB = rangeEnd(b);
		if (endA === endB) return 0;
		return endA < endB ? -1 : 1;
	};
	const getRangeScanState = (ranges, scanCache) => {
		const cached = scanCache.get(ranges);
		if ((cached === null || cached === void 0 ? void 0 : cached.sourceLength) === ranges.length) return cached;
		const sortedByStart = [...ranges].sort((a, b) => a.start - b.start);
		const sortedByEnd = [...ranges].sort(compareRangeEnd);
		const next = {
			sourceLength: ranges.length,
			sortedByStart,
			sortedByEnd
		};
		scanCache.set(ranges, next);
		return next;
	};
	const rangeEndsAfter = (range, vpos) => range.end === void 0 || vpos < range.end;
	const upperBoundStart = (ranges, vpos) => {
		let low = 0;
		let high = ranges.length;
		while (low < high) {
			const mid = Math.floor((low + high) / 2);
			const range = ranges[mid];
			if (range && range.start <= vpos) low = mid + 1;
			else high = mid;
		}
		return low;
	};
	const upperBoundEnd = (ranges, vpos) => {
		let low = 0;
		let high = ranges.length;
		while (low < high) {
			const mid = Math.floor((low + high) / 2);
			const range = ranges[mid];
			if (range && rangeEnd(range) <= vpos) low = mid + 1;
			else high = mid;
		}
		return low;
	};
	const hasActiveRange = (ranges, vpos, scanCache) => {
		if (!Number.isFinite(vpos)) return false;
		const state = getRangeScanState(ranges, scanCache);
		return upperBoundStart(state.sortedByStart, vpos) > upperBoundEnd(state.sortedByEnd, vpos);
	};
	const getTransitionRanges = (ranges, vpos, lastVpos, scanCache) => {
		if (!Number.isFinite(vpos) || !Number.isFinite(lastVpos)) return {
			entered: [],
			exited: []
		};
		const state = getRangeScanState(ranges, scanCache);
		const entered = [];
		const exited = [];
		if (lastVpos <= vpos) {
			for (let i = upperBoundStart(state.sortedByStart, lastVpos), end = upperBoundStart(state.sortedByStart, vpos); i < end; i++) {
				const range = state.sortedByStart[i];
				if (range && rangeEndsAfter(range, vpos)) entered.push(range);
			}
			for (let i = upperBoundEnd(state.sortedByEnd, lastVpos), end = upperBoundEnd(state.sortedByEnd, vpos); i < end; i++) {
				const range = state.sortedByEnd[i];
				if (range && range.start <= lastVpos) exited.push(range);
			}
		} else {
			for (let i = upperBoundEnd(state.sortedByEnd, vpos), end = upperBoundEnd(state.sortedByEnd, lastVpos); i < end; i++) {
				const range = state.sortedByEnd[i];
				if (range && range.start <= vpos) entered.push(range);
			}
			for (let i = upperBoundStart(state.sortedByStart, vpos), end = upperBoundStart(state.sortedByStart, lastVpos); i < end; i++) {
				const range = state.sortedByStart[i];
				if (range && rangeEndsAfter(range, lastVpos)) exited.push(range);
			}
		}
		return {
			entered,
			exited
		};
	};
	var EventHandler = class {
		constructor() {
			_defineProperty(this, "handlerList", []);
			_defineProperty(this, "handlerCounts", {
				seekDisable: 0,
				seekEnable: 0,
				commentDisable: 0,
				commentEnable: 0,
				jump: 0
			});
			_defineProperty(this, "banActiveRangeScans", /* @__PURE__ */ new WeakMap());
			_defineProperty(this, "seekDisableActiveRangeScans", /* @__PURE__ */ new WeakMap());
			_defineProperty(this, "jumpActiveRangeScans", /* @__PURE__ */ new WeakMap());
		}
		register(eventName, handler) {
			this.handlerList.push({
				eventName,
				handler
			});
			this._updateCounts();
		}
		remove(eventName, handler) {
			this.handlerList = this.handlerList.filter((item) => item.eventName !== eventName || item.handler !== handler);
			this._updateCounts();
		}
		trigger(vpos, lastVpos, nicoScripts) {
			this._processCommentDisable(vpos, lastVpos, nicoScripts);
			this._processSeekDisable(vpos, lastVpos, nicoScripts);
			this._processJump(vpos, lastVpos, nicoScripts);
		}
		_updateCounts() {
			for (const key_ of Object.keys(this.handlerCounts)) {
				const key = key_;
				this.handlerCounts[key] = this.handlerList.filter((item) => item.eventName === key).length;
			}
		}
		_processCommentDisable(vpos, lastVpos, nicoScripts) {
			if (this.handlerCounts.commentDisable < 1 && this.handlerCounts.commentEnable < 1) return;
			if (nicoScripts.ban.length === 0) return;
			const wasActive = hasActiveRange(nicoScripts.ban, lastVpos, this.banActiveRangeScans);
			const active = hasActiveRange(nicoScripts.ban, vpos, this.banActiveRangeScans);
			if (!wasActive && active) this._execute("commentDisable", {
				type: "commentDisable",
				timeStamp: Date.now(),
				vpos
			});
			if (wasActive && !active) this._execute("commentEnable", {
				type: "commentEnable",
				timeStamp: Date.now(),
				vpos
			});
		}
		_processSeekDisable(vpos, lastVpos, nicoScripts) {
			if (this.handlerCounts.seekDisable < 1 && this.handlerCounts.seekEnable < 1) return;
			if (nicoScripts.seekDisable.length === 0) return;
			const wasActive = hasActiveRange(nicoScripts.seekDisable, lastVpos, this.seekDisableActiveRangeScans);
			const active = hasActiveRange(nicoScripts.seekDisable, vpos, this.seekDisableActiveRangeScans);
			if (!wasActive && active) this._execute("seekDisable", {
				type: "seekDisable",
				timeStamp: Date.now(),
				vpos
			});
			if (wasActive && !active) this._execute("seekEnable", {
				type: "seekEnable",
				timeStamp: Date.now(),
				vpos
			});
		}
		_processJump(vpos, lastVpos, nicoScripts) {
			if (this.handlerCounts.jump < 1) return;
			const { entered } = getTransitionRanges(nicoScripts.jump, vpos, lastVpos, this.jumpActiveRangeScans);
			for (const range of entered) this._execute("jump", {
				type: "jump",
				timeStamp: Date.now(),
				vpos,
				to: range.to,
				message: range.message
			});
		}
		_execute(eventName, event) {
			for (const item of this.handlerList) {
				if (eventName !== item.eventName) continue;
				item.handler(event);
			}
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
	//#region src/input/xmlDocument.ts
	const assignUserId = (userIdMap, userId) => {
		const existingUserId = userIdMap.get(userId);
		if (existingUserId !== void 0) return existingUserId;
		const nextUserId = userIdMap.size;
		userIdMap.set(userId, nextUserId);
		return nextUserId;
	};
	const XmlDocumentParser = {
		key: ["XMLDocument", "niconicome"],
		parse: (input) => {
			let isXmlDocument = false;
			if (typeof input === "object" && input !== null) try {
				isXmlDocument = typeGuard.xmlDocument(input);
			} catch (error) {
				if (!(error instanceof TypeError)) throw error;
			}
			if (isXmlDocument) return parseXMLDocument(input);
			throw new InvalidFormatError();
		}
	};
	/**
	* niconicome等が吐き出すxml形式のコメントデータを処理する
	* @param data 吐き出されたxmlをDOMParserでparseFromStringしたもの
	* @returns 変換後のデータ
	*/
	const parseXMLDocument = (data) => {
		const data_ = [];
		const userIdMap = /* @__PURE__ */ new Map();
		let index = Array.from(data.documentElement.children).length;
		for (const item of Array.from(data.documentElement.children)) {
			var _toFiniteNumberInRang, _item$textContent, _item$getAttribute2;
			if (item.nodeName !== "chat") continue;
			const rawNo = item.getAttribute("no");
			const id = rawNo === null ? index++ : (_toFiniteNumberInRang = toFiniteNumberInRange(rawNo)) !== null && _toFiniteNumberInRang !== void 0 ? _toFiniteNumberInRang : void 0;
			const vpos = toFiniteNumberInRange(item.getAttribute("vpos"), { min: Number.MIN_SAFE_INTEGER });
			const rawDate = item.getAttribute("date");
			const date = rawDate === null ? 0 : toFiniteNumberInRange(rawDate);
			const rawDateUsec = item.getAttribute("date_usec");
			const dateUsec = rawDateUsec === null ? 0 : toFiniteNumberInRange(rawDateUsec, { max: 999999 });
			if (id === void 0 || vpos === void 0 || date === void 0 || dateUsec === void 0) continue;
			const tmpParam = {
				id,
				vpos,
				content: (_item$textContent = item.textContent) !== null && _item$textContent !== void 0 ? _item$textContent : "",
				date,
				date_usec: dateUsec,
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
			tmpParam.user_id = assignUserId(userIdMap, (_item$getAttribute2 = item.getAttribute("user_id")) !== null && _item$getAttribute2 !== void 0 ? _item$getAttribute2 : "");
			data_.push(tmpParam);
		}
		return data_;
	};
	//#endregion
	//#region src/input/legacy.ts
	const LegacyParser = {
		key: ["legacy"],
		parse: (input) => {
			return fromLegacy(parse(/* @__PURE__ */ array(/* @__PURE__ */ unknown()), input));
		}
	};
	/**
	* ニコニコ公式のlegacy apiから帰ってきたデータ処理する
	* @param data legacy apiから帰ってきたデータ
	* @returns 変換後のデータ
	*/
	const fromLegacy = (data) => {
		const data_ = [];
		const userIdMap = /* @__PURE__ */ new Map();
		for (const _val of data) {
			const val = /* @__PURE__ */ safeParse(ZApiChat, typeof _val === "object" && _val !== null && "chat" in _val ? _val.chat : void 0);
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
				tmpParam.user_id = assignUserId(userIdMap, value.user_id);
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
		const comments = data.split(/\r\n|\r|\n/);
		for (let i = 0, n = comments.length; i < n; i++) {
			var _comments$i, _commentData$;
			const value = (_comments$i = comments[i]) !== null && _comments$i !== void 0 ? _comments$i : "";
			if (value.trim() === "") continue;
			const commentData = value.split(":");
			if (commentData.length < 3) continue;
			if (commentData.length > 3) for (let j = 3, n = commentData.length; j < n; j++) commentData[2] += `:${commentData[j]}`;
			const seconds = toFiniteNumberInRange(commentData[0], { max: Math.floor(Number.MAX_SAFE_INTEGER / 100) });
			if (seconds === void 0) continue;
			const tmpParam = {
				id: i,
				vpos: seconds * 100,
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
			const vpos = time2vpos(value.time);
			if (vpos === void 0) continue;
			const tmpParam = {
				id: i,
				vpos,
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
		let vpos;
		if (time) {
			if (time[1] !== void 0 && time[2] !== void 0 && time[3] !== void 0) vpos = (Number(time[1]) * 60 + Number(time[2])) * 100 + Number(time[3]) / Math.pow(10, time[3].length - 2);
			if (time[4] !== void 0 && time[5] !== void 0) vpos = (Number(time[4]) * 60 + Number(time[5])) * 100;
			if (time[6] !== void 0 && time[7] !== void 0) vpos = Number(time[6]) * 100 + Number(time[7]) / Math.pow(10, time[7].length - 2);
			if (time[8] !== void 0) vpos = Number(time[8]) * 100;
		}
		return toFiniteNumberInRange(vpos === void 0 ? void 0 : Math.floor(vpos));
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
		const userIdMap = /* @__PURE__ */ new Map();
		for (const item of data) {
			const val = item.comments;
			const forkName = item.fork;
			for (const value of val) {
				const date = date2time(value.postedAt);
				if (date === void 0) continue;
				const tmpParam = {
					id: value.no,
					vpos: Math.floor(value.vposMs / 10),
					content: value.body,
					date,
					date_usec: 0,
					owner: forkName === "owner",
					premium: value.isPremium,
					mail: value.commands,
					user_id: -1,
					layer: -1,
					is_my_post: value.isMyPost
				};
				if (tmpParam.content.startsWith("/") && tmpParam.owner) tmpParam.mail.push("invisible");
				tmpParam.user_id = assignUserId(userIdMap, value.userId);
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
	const date2time = (date) => {
		const time = Math.floor(Date.parse(date) / 1e3);
		return Number.isFinite(time) && time >= 0 ? time : void 0;
	};
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
		const userIdMap = /* @__PURE__ */ new Map();
		let index = data.packet.chat.length;
		for (const item of data.packet.chat) {
			var _toFiniteNumberInRang, _item$$$user_id;
			const rawNo = item.$.no;
			const id = rawNo === void 0 ? index++ : (_toFiniteNumberInRang = toFiniteNumberInRange(rawNo)) !== null && _toFiniteNumberInRang !== void 0 ? _toFiniteNumberInRang : void 0;
			const vpos = toFiniteNumberInRange(item.$.vpos, { min: Number.MIN_SAFE_INTEGER });
			const date = toFiniteNumberInRange(item.$.date);
			const dateUsec = toFiniteNumberInRange(item.$.date_usec, { max: 999999 });
			if (id === void 0 || vpos === void 0 || date === void 0 || dateUsec === void 0) continue;
			const tmpParam = {
				id,
				vpos,
				content: item._,
				date,
				date_usec: dateUsec,
				owner: !(item.$.owner === "0" || item.$.user_id),
				premium: item.$.premium === "1",
				mail: item.$.mail.split(/\s+/g),
				user_id: -1,
				layer: -1,
				is_my_post: false
			};
			if (tmpParam.content.startsWith("/") && tmpParam.owner) tmpParam.mail.push("invisible");
			tmpParam.user_id = assignUserId(userIdMap, (_item$$$user_id = item.$.user_id) !== null && _item$$$user_id !== void 0 ? _item$$$user_id : "");
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
		var _firstError2;
		const targetParsers = parsers.filter((parser) => parser.key.includes(type));
		if (targetParsers.length === 0) throw new InvalidFormatError();
		let firstError;
		for (const parser of targetParsers) try {
			return sort(parser.parse(data));
		} catch (error) {
			var _firstError;
			if (!(error instanceof InvalidFormatError || error instanceof ValiError)) throw error;
			(_firstError = firstError) !== null && _firstError !== void 0 || (firstError = error);
		}
		throw (_firstError2 = firstError) !== null && _firstError2 !== void 0 ? _firstError2 : new InvalidFormatError();
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
	//#region src/renderer/html5css.ts
	const MAX_HELPER_SURFACES = 8;
	const MAX_DUPLICATE_CANVAS_CLONES_PER_FRAME = 1024;
	const MAX_DUPLICATE_CANVAS_CLONE_BYTES_PER_FRAME = 512 * 1024 * 1024;
	const CANVAS_RGBA_BYTES_PER_PIXEL = 4;
	const DEFAULT_CSS_RENDER_STATE = {
		alpha: 1,
		fillStyle: "#000000",
		strokeStyle: "#000000",
		lineWidth: 1,
		font: "10px sans-serif",
		scaleX: 1,
		scaleY: 1
	};
	var HTML5CSSRenderer = class {
		constructor(root, video) {
			var _this$root$ownerDocum;
			_defineProperty(this, "rendererName", "HTML5CSSRenderer");
			_defineProperty(this, "canvas", void 0);
			_defineProperty(this, "root", void 0);
			_defineProperty(this, "layer", void 0);
			_defineProperty(this, "video", void 0);
			_defineProperty(this, "helper", void 0);
			_defineProperty(this, "helperDirty", false);
			_defineProperty(this, "helperCursor", 0);
			_defineProperty(this, "pathActive", false);
			_defineProperty(this, "textDrawnBeforeDom", false);
			_defineProperty(this, "helperSurfaces", []);
			_defineProperty(this, "videoSurface", void 0);
			_defineProperty(this, "width", 0);
			_defineProperty(this, "height", 0);
			_defineProperty(this, "state", _objectSpread2({}, DEFAULT_CSS_RENDER_STATE));
			_defineProperty(this, "stateStack", []);
			_defineProperty(this, "nodes", []);
			_defineProperty(this, "prevNodeCursor", 0);
			_defineProperty(this, "activeCanvasSet", /* @__PURE__ */ new Set());
			_defineProperty(this, "prevCanvasSet", /* @__PURE__ */ new Set());
			_defineProperty(this, "setupCanvases", /* @__PURE__ */ new WeakSet());
			_defineProperty(this, "destroyed", false);
			_defineProperty(this, "cloneMap", /* @__PURE__ */ new Map());
			_defineProperty(this, "cloneSourceMap", /* @__PURE__ */ new WeakMap());
			_defineProperty(this, "duplicateCloneBudgetMap", /* @__PURE__ */ new Map());
			_defineProperty(this, "externalCanvasCopyFrameBudget", {
				bytes: 0,
				count: 0
			});
			_defineProperty(this, "ownedCanvases", /* @__PURE__ */ new WeakSet());
			_defineProperty(this, "resizeObserver", void 0);
			_defineProperty(this, "originalRootStyle", void 0);
			_defineProperty(this, "nodeCursor", 0);
			this.root = root;
			this.video = video;
			const size = this.normalizeSize(this.getInitialSize(root));
			this.width = size.width;
			this.height = size.height;
			this.canvas = this.root.ownerDocument.createElement("canvas");
			this.canvas.width = this.width;
			this.canvas.height = this.height;
			this.canvas.style.display = "none";
			this.helper = this.prepareHelperSurface(0);
			if (this.video) {
				this.videoSurface = new CanvasRenderer(void 0, this.video);
				this.videoSurface.setSize(this.width, this.height);
			}
			this.originalRootStyle = {
				boxSizing: this.root.style.boxSizing,
				height: this.root.style.height,
				overflow: this.root.style.overflow,
				pointerEvents: this.root.style.pointerEvents,
				position: this.root.style.position,
				width: this.root.style.width
			};
			const computedStyle = (_this$root$ownerDocum = this.root.ownerDocument.defaultView) === null || _this$root$ownerDocum === void 0 ? void 0 : _this$root$ownerDocum.getComputedStyle(this.root);
			this.root.classList.add("niconicomments-html5css-renderer");
			if (!this.root.style.width && this.getNumber(computedStyle === null || computedStyle === void 0 ? void 0 : computedStyle.width) === void 0) this.root.style.width = `${this.width}px`;
			if (!this.root.style.height && this.getNumber(computedStyle === null || computedStyle === void 0 ? void 0 : computedStyle.height) === void 0) this.root.style.height = `${this.height}px`;
			this.root.style.boxSizing = "border-box";
			this.root.style.overflow = "hidden";
			this.root.style.pointerEvents = "none";
			if (this.root.style.position === "" || this.root.style.position === "static") {
				const computedPosition = computedStyle === null || computedStyle === void 0 ? void 0 : computedStyle.position;
				if (!computedPosition || computedPosition === "static") this.root.style.position = "relative";
			}
			this.layer = this.root.ownerDocument.createElement("div");
			this.layer.style.position = "absolute";
			this.layer.style.left = "0";
			this.layer.style.top = "0";
			this.layer.style.overflow = "hidden";
			this.layer.style.pointerEvents = "none";
			this.layer.style.width = `${this.width}px`;
			this.layer.style.height = `${this.height}px`;
			this.layer.style.transformOrigin = "0 0";
			this.root.appendChild(this.canvas);
			this.root.appendChild(this.layer);
			this.setupVideoCanvas();
			this.updateObjectFitContain();
			if (typeof ResizeObserver !== "undefined") {
				this.resizeObserver = new ResizeObserver((entries) => {
					var _box$inlineSize, _box$blockSize;
					const entry = entries[entries.length - 1];
					if (!entry) {
						this.updateObjectFitContain();
						return;
					}
					const box = Array.isArray(entry.contentBoxSize) ? entry.contentBoxSize[0] : entry.contentBoxSize;
					this.updateObjectFitContainWithSize((_box$inlineSize = box === null || box === void 0 ? void 0 : box.inlineSize) !== null && _box$inlineSize !== void 0 ? _box$inlineSize : entry.contentRect.width, (_box$blockSize = box === null || box === void 0 ? void 0 : box.blockSize) !== null && _box$blockSize !== void 0 ? _box$blockSize : entry.contentRect.height);
				});
				this.resizeObserver.observe(this.root);
			}
		}
		destroy() {
			var _this$resizeObserver;
			if (this.destroyed) return;
			this.destroyed = true;
			(_this$resizeObserver = this.resizeObserver) === null || _this$resizeObserver === void 0 || _this$resizeObserver.disconnect();
			for (const helper of this.helperSurfaces) {
				this.teardownSurfaceCanvas(helper);
				helper.destroy();
			}
			this.helperSurfaces.length = 0;
			this.helper = void 0;
			if (this.videoSurface) {
				this.teardownSurfaceCanvas(this.videoSurface);
				this.videoSurface.destroy();
				this.videoSurface = void 0;
			}
			this.nodes.length = 0;
			this.stateStack.length = 0;
			this.prevCanvasSet.clear();
			this.activeCanvasSet.clear();
			this.cloneMap.clear();
			this.resetDuplicateCloneAccounting();
			this.layer.remove();
			this.canvas.remove();
			this.root.classList.remove("niconicomments-html5css-renderer");
			this.root.style.boxSizing = this.originalRootStyle.boxSizing;
			this.root.style.height = this.originalRootStyle.height;
			this.root.style.overflow = this.originalRootStyle.overflow;
			this.root.style.pointerEvents = this.originalRootStyle.pointerEvents;
			this.root.style.position = this.originalRootStyle.position;
			this.root.style.width = this.originalRootStyle.width;
		}
		drawVideo(enableLegacyPip) {
			if (!this.videoSurface) return;
			this.videoSurface.clearRect(0, 0, this.width, this.height);
			this.videoSurface.drawVideo(enableLegacyPip);
			this.videoSurface.canvas.style.display = "block";
		}
		getFont() {
			return this.state.font;
		}
		getFillStyle() {
			return this.state.fillStyle;
		}
		setScale(scale, arg1) {
			this.state.scaleX *= scale;
			this.state.scaleY *= arg1 !== null && arg1 !== void 0 ? arg1 : scale;
			this.helper.setScale(scale, arg1);
		}
		fillRect(x, y, width, height) {
			let nx = x;
			let ny = y;
			let nw = width;
			let nh = height;
			if (nw < 0) {
				nx += nw;
				nw = -nw;
			}
			if (nh < 0) {
				ny += nh;
				nh = -nh;
			}
			if (this.shouldDrawOnOverflowHelper()) {
				this.helper.save();
				this.helper.setFillStyle(this.state.fillStyle);
				this.helper.setGlobalAlpha(this.state.alpha);
				this.helper.fillRect(nx, ny, nw, nh);
				this.helper.restore();
				this.helperDirty = true;
				return;
			}
			const node = this.getNode("div");
			node.style.background = this.state.fillStyle;
			node.style.border = "0";
			node.style.boxSizing = "content-box";
			this.positionNode(node, nx, ny, nw, nh);
		}
		strokeRect(x, y, width, height) {
			let nx = x;
			let ny = y;
			let nw = width;
			let nh = height;
			if (nw < 0) {
				nx += nw;
				nw = -nw;
			}
			if (nh < 0) {
				ny += nh;
				nh = -nh;
			}
			if (this.shouldDrawOnOverflowHelper()) {
				this.helper.save();
				this.helper.setStrokeStyle(this.state.strokeStyle);
				this.helper.setLineWidth(this.state.lineWidth);
				this.helper.setGlobalAlpha(this.state.alpha);
				this.helper.strokeRect(nx, ny, nw, nh);
				this.helper.restore();
				this.helperDirty = true;
				return;
			}
			const node = this.getNode("div");
			node.style.background = "transparent";
			const borderWidthX = this.state.lineWidth * this.state.scaleX;
			const borderWidthY = this.state.lineWidth * this.state.scaleY;
			const borderX = `${borderWidthX}px`;
			const borderY = `${borderWidthY}px`;
			node.style.border = "0";
			node.style.borderLeft = `${borderX} solid ${this.state.strokeStyle}`;
			node.style.borderRight = `${borderX} solid ${this.state.strokeStyle}`;
			node.style.borderTop = `${borderY} solid ${this.state.strokeStyle}`;
			node.style.borderBottom = `${borderY} solid ${this.state.strokeStyle}`;
			node.style.boxSizing = "border-box";
			this.positionNode(node, nx, ny, nw, nh, -borderWidthX / 2, -borderWidthY / 2, borderWidthX, borderWidthY);
		}
		fillText(text, x, y) {
			this.helper.save();
			this.helper.setFont(this.state.font);
			this.helper.setFillStyle(this.state.fillStyle);
			this.helper.setGlobalAlpha(this.state.alpha);
			this.helper.fillText(text, x, y);
			this.helper.restore();
			this.helperDirty = true;
			this.textDrawnBeforeDom = true;
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
			this.textDrawnBeforeDom = true;
		}
		quadraticCurveTo(cpx, cpy, x, y) {
			this.helper.quadraticCurveTo(cpx, cpy, x, y);
		}
		clearRect(_x, _y, _width, _height) {
			this.nodeCursor = 0;
			this.helperCursor = 0;
			this.pathActive = false;
			this.textDrawnBeforeDom = false;
			this.restoreFrameStartState();
			for (let i = 0; i < this.prevNodeCursor; i++) {
				const node = this.nodes[i];
				if (node) this.hideNode(node);
			}
			this.trimHelperSurfaces();
			this.resetDuplicateCloneAccounting();
			this.helper = this.prepareHelperSurface(0);
			this.helper.canvas.style.display = "none";
			if (this.videoSurface) {
				this.videoSurface.clearRect(0, 0, this.width, this.height);
				this.videoSurface.canvas.style.display = "none";
				this.layer.insertBefore(this.videoSurface.canvas, this.layer.firstChild);
			}
			this.helperDirty = false;
		}
		setFont(font) {
			this.state.font = font;
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
			const size = this.normalizeSize({
				width,
				height
			});
			this.width = size.width;
			this.height = size.height;
			this.nodeCursor = 0;
			this.prevNodeCursor = 0;
			this.pathActive = false;
			this.textDrawnBeforeDom = false;
			for (const node of this.nodes) this.hideNode(node);
			for (const canvas of this.prevCanvasSet) {
				canvas.style.display = "none";
				canvas.remove();
			}
			for (const canvas of this.activeCanvasSet) {
				canvas.style.display = "none";
				canvas.remove();
			}
			this.prevCanvasSet.clear();
			this.activeCanvasSet.clear();
			this.cloneMap.clear();
			this.resetDuplicateCloneAccounting();
			this.canvas.width = size.width;
			this.canvas.height = size.height;
			this.layer.style.width = `${size.width}px`;
			this.layer.style.height = `${size.height}px`;
			this.updateObjectFitContain();
			this.restoreFrameStartState();
			for (const helper of this.helperSurfaces) {
				this.teardownSurfaceCanvas(helper);
				helper.destroy();
			}
			this.helperSurfaces.length = 0;
			this.helperCursor = 0;
			if (this.videoSurface) {
				this.teardownSurfaceCanvas(this.videoSurface);
				this.videoSurface.setSize(size.width, size.height);
				this.setupVideoCanvas();
			}
			this.resetState();
			this.helper = this.prepareHelperSurface(0);
			this.helper.canvas.style.display = "none";
			this.helperDirty = false;
		}
		getSize() {
			return {
				width: this.width,
				height: this.height
			};
		}
		measureText(text) {
			const font = this.helper.getFont();
			this.helper.setFont(this.state.font);
			try {
				return this.helper.measureText(text);
			} finally {
				this.helper.setFont(font);
			}
		}
		beginPath() {
			this.pathActive = true;
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
		stroke() {
			if (!this.pathActive) return;
			this.helper.save();
			this.helper.setStrokeStyle(this.state.strokeStyle);
			this.helper.setLineWidth(this.state.lineWidth);
			this.helper.setGlobalAlpha(this.state.alpha);
			this.helper.stroke();
			this.helper.restore();
			this.helperDirty = true;
			this.pathActive = false;
			this.textDrawnBeforeDom = false;
		}
		save() {
			this.helper.save();
			this.stateStack.push(_objectSpread2(_objectSpread2({}, this.state), {}, { helper: this.helper }));
		}
		restore() {
			const saved = this.stateStack.pop();
			if (!saved) return;
			saved.helper.restore();
			if (saved.helper !== this.helper) this.applyHelperScale(saved.scaleX, saved.scaleY);
			this.state = this.toRenderState(saved);
		}
		getCanvas(padding = 0) {
			let inner;
			inner = new CanvasRenderer(void 0, void 0, padding, typeof WeakRef === "undefined" ? () => {
				if (inner) {
					this.invalidateImage(inner);
					this.ownedCanvases.delete(inner.canvas);
				}
			} : (() => {
				const parentRef = new WeakRef(this);
				return () => {
					if (inner) {
						const parent = parentRef.deref();
						if (parent) {
							parent.invalidateImage(inner);
							parent.ownedCanvases.delete(inner.canvas);
						}
					}
				};
			})());
			this.ownedCanvases.add(inner.canvas);
			return inner;
		}
		drawImage(image, x, y, width, height) {
			const source = image.canvas;
			if (this.shouldDrawOnOverflowHelper()) {
				this.helper.save();
				this.helper.setGlobalAlpha(this.state.alpha);
				if (width === void 0 || height === void 0) this.helper.drawImage(image, x, y);
				else this.helper.drawImage(image, x, y, width, height);
				this.helper.restore();
				this.helperDirty = true;
				return;
			}
			const rect = getDrawImageRect(image, x, y, width, height);
			const deferHelperCommit = this.pathActive;
			if (deferHelperCommit) console.warn("HTML5CSSRenderer: DOM drawing interleaved with an active path before stroke().");
			if (this.textDrawnBeforeDom) {
				console.warn("HTML5CSSRenderer: text drawn before a DOM-backed draw may render below it.");
				this.textDrawnBeforeDom = false;
			}
			if (!deferHelperCommit) this.commitHelperSurface();
			let element;
			if (!this.ownedCanvases.has(source)) {
				const copyBytes = this.getCanvasByteSize(source);
				if (!this.reserveExternalCanvasCopy(source, copyBytes)) return;
				element = this.root.ownerDocument.createElement("canvas");
				element.width = source.width;
				element.height = source.height;
				const ctx = element.getContext("2d");
				if (!ctx) {
					this.releaseExternalCanvasCopy(source, copyBytes);
					console.warn("HTML5CSSRenderer: failed to acquire 2D context for canvas copy.");
					return;
				}
				ctx.drawImage(source, 0, 0);
			} else if (this.activeCanvasSet.has(source)) {
				const cloneBytes = this.getCanvasByteSize(source);
				if (!this.reserveDuplicateClone(source, cloneBytes)) return;
				element = this.root.ownerDocument.createElement("canvas");
				element.width = source.width;
				element.height = source.height;
				const ctx = element.getContext("2d");
				if (!ctx) {
					this.releaseDuplicateClone(source, cloneBytes);
					console.warn("HTML5CSSRenderer: failed to acquire 2D context for canvas clone.");
					return;
				}
				ctx.drawImage(source, 0, 0);
				let clones = this.cloneMap.get(source);
				if (!clones) {
					clones = /* @__PURE__ */ new Set();
					this.cloneMap.set(source, clones);
				}
				clones.add(element);
				this.cloneSourceMap.set(element, source);
			} else element = source;
			if (!this.setupCanvases.has(element)) {
				element.style.position = "absolute";
				element.style.margin = "0";
				element.style.padding = "0";
				element.style.pointerEvents = "none";
				element.style.transformOrigin = "0 0";
				element.style.maxWidth = "none";
				element.style.maxHeight = "none";
				this.setupCanvases.add(element);
			}
			this.layer.appendChild(element);
			element.style.display = "block";
			element.style.opacity = String(this.state.alpha);
			this.positionNode(element, rect.x, rect.y, rect.width, rect.height);
			this.activeCanvasSet.add(element);
		}
		flush() {
			this.commitHelperSurface();
			this.keepVideoSurfaceFirst();
			for (let i = this.nodeCursor, n = this.nodes.length; i < n; i++) {
				const node = this.nodes[i];
				if (node) this.hideNode(node);
			}
			this.prevNodeCursor = this.nodeCursor;
			const staleSourceCanvases = [];
			for (const canvas of this.prevCanvasSet) if (!this.activeCanvasSet.has(canvas)) {
				canvas.style.display = "none";
				canvas.remove();
				const src = this.cloneSourceMap.get(canvas);
				if (src) {
					var _this$cloneMap$get;
					(_this$cloneMap$get = this.cloneMap.get(src)) === null || _this$cloneMap$get === void 0 || _this$cloneMap$get.delete(canvas);
				} else staleSourceCanvases.push(canvas);
			}
			for (const canvas of staleSourceCanvases) this.cloneMap.delete(canvas);
			const tmp = this.prevCanvasSet;
			this.prevCanvasSet = this.activeCanvasSet;
			this.activeCanvasSet = tmp;
			this.activeCanvasSet.clear();
			this.resetDuplicateCloneAccounting();
			this.textDrawnBeforeDom = false;
			if (this.stateStack.length > 0) console.warn("HTML5CSSRenderer: save()/restore() calls are imbalanced at flush().");
		}
		invalidateImage(image) {
			const source = image.canvas;
			const clones = this.cloneMap.get(source);
			if (clones) {
				for (const clone of clones) {
					this.prevCanvasSet.delete(clone);
					this.activeCanvasSet.delete(clone);
					clone.style.display = "none";
					clone.remove();
				}
				this.cloneMap.delete(source);
			}
			this.prevCanvasSet.delete(source);
			this.activeCanvasSet.delete(source);
			if (this.ownedCanvases.has(source)) {
				source.style.display = "none";
				source.remove();
			}
		}
		getNode(tagName) {
			const deferHelperCommit = this.pathActive;
			if (deferHelperCommit) console.warn("HTML5CSSRenderer: DOM drawing interleaved with an active path before stroke().");
			if (this.textDrawnBeforeDom) {
				console.warn("HTML5CSSRenderer: text drawn before a DOM-backed draw may render below it.");
				this.textDrawnBeforeDom = false;
			}
			if (!deferHelperCommit) this.commitHelperSurface();
			let node = this.nodes[this.nodeCursor];
			if (!node || node.tagName.toLowerCase() !== tagName) {
				node === null || node === void 0 || node.remove();
				node = this.root.ownerDocument.createElement(tagName);
				node.style.position = "absolute";
				node.style.margin = "0";
				node.style.padding = "0";
				node.style.pointerEvents = "none";
				node.style.transformOrigin = "0 0";
				node.style.maxWidth = "none";
				node.style.maxHeight = "none";
				this.nodes[this.nodeCursor] = node;
			}
			this.layer.appendChild(node);
			node.style.display = "block";
			node.style.opacity = String(this.state.alpha);
			this.nodeCursor++;
			return node;
		}
		positionNode(node, x, y, width, height, offsetX = 0, offsetY = 0, extraWidth = 0, extraHeight = 0) {
			const scaleX = this.state.scaleX;
			const scaleY = this.state.scaleY;
			node.style.left = `${x * scaleX + offsetX}px`;
			node.style.top = `${y * scaleY + offsetY}px`;
			node.style.width = `${width * scaleX + extraWidth}px`;
			node.style.height = `${height * scaleY + extraHeight}px`;
		}
		updateObjectFitContain() {
			if (this.width <= 0 || this.height <= 0 || !Number.isFinite(this.width) || !Number.isFinite(this.height)) {
				this.layer.style.transform = "translate(0px, 0px) scale(1)";
				return;
			}
			this.updateObjectFitContainWithSize(this.root.offsetWidth, this.root.offsetHeight);
		}
		updateObjectFitContainWithSize(containerWidth, containerHeight) {
			if (this.width <= 0 || this.height <= 0 || !Number.isFinite(this.width) || !Number.isFinite(this.height)) {
				this.layer.style.transform = "translate(0px, 0px) scale(1)";
				return;
			}
			const fitWidth = containerWidth > 0 ? containerWidth : this.width;
			const fitHeight = containerHeight > 0 ? containerHeight : this.height;
			const scale = Math.min(fitWidth / this.width, fitHeight / this.height);
			const offsetX = (fitWidth - this.width * scale) / 2;
			const offsetY = (fitHeight - this.height * scale) / 2;
			this.layer.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
		}
		getHelperSurface(index) {
			var _this$helperSurfaces, _this$helperSurfaces$;
			(_this$helperSurfaces$ = (_this$helperSurfaces = this.helperSurfaces)[index]) !== null && _this$helperSurfaces$ !== void 0 || (_this$helperSurfaces[index] = new CanvasRenderer(void 0, void 0));
			return this.helperSurfaces[index];
		}
		prepareHelperSurface(index) {
			const helper = this.getHelperSurface(index);
			helper.setSize(this.width, this.height);
			this.resetHelperContextDefaults(helper);
			this.setupSurfaceCanvas(helper);
			if (this.state.scaleX !== 1 || this.state.scaleY !== 1) helper.setScale(this.state.scaleX, this.state.scaleY);
			return helper;
		}
		commitHelperSurface() {
			if (!this.helperDirty) return;
			this.helper.canvas.style.display = "block";
			const isOverflowHelper = this.helperCursor + 1 >= MAX_HELPER_SURFACES;
			if (!isOverflowHelper || !this.helper.canvas.isConnected) this.layer.appendChild(this.helper.canvas);
			this.helperDirty = false;
			if (isOverflowHelper) return;
			this.helperCursor++;
			this.helper = this.prepareHelperSurface(this.helperCursor);
		}
		keepVideoSurfaceFirst() {
			if (!this.videoSurface) return;
			this.layer.insertBefore(this.videoSurface.canvas, this.layer.firstChild);
		}
		setupVideoCanvas() {
			if (!this.videoSurface) return;
			this.setupSurfaceCanvas(this.videoSurface);
			this.videoSurface.canvas.style.display = "none";
			this.layer.insertBefore(this.videoSurface.canvas, this.layer.firstChild);
		}
		setupSurfaceCanvas(surface) {
			const { style } = surface.canvas;
			style.position = "absolute";
			style.left = "0";
			style.top = "0";
			style.width = `${this.width}px`;
			style.height = `${this.height}px`;
			style.pointerEvents = "none";
			style.margin = "0";
			style.padding = "0";
			style.maxWidth = "none";
			style.maxHeight = "none";
		}
		applyHelperScale(scaleX, scaleY) {
			const currentScaleX = this.state.scaleX;
			const currentScaleY = this.state.scaleY;
			if (currentScaleX === 0 || currentScaleY === 0 || scaleX === 0 || scaleY === 0 || !Number.isFinite(currentScaleX) || !Number.isFinite(currentScaleY) || !Number.isFinite(scaleX) || !Number.isFinite(scaleY)) {
				this.recreateCurrentHelperSurface(scaleX, scaleY);
				return;
			}
			const ratioX = scaleX / this.state.scaleX;
			const ratioY = scaleY / this.state.scaleY;
			if (ratioX === 1 && ratioY === 1) return;
			if (Number.isFinite(ratioX) && Number.isFinite(ratioY)) this.helper.setScale(ratioX, ratioY);
		}
		recreateCurrentHelperSurface(scaleX, scaleY) {
			this.teardownSurfaceCanvas(this.helper);
			this.helper.destroy();
			const helper = new CanvasRenderer(void 0, void 0);
			this.helperSurfaces[this.helperCursor] = helper;
			this.helper = helper;
			helper.setSize(this.width, this.height);
			this.resetHelperContextDefaults(helper);
			this.setupSurfaceCanvas(helper);
			helper.canvas.style.display = "none";
			if (scaleX !== 0 && scaleY !== 0 && Number.isFinite(scaleX) && Number.isFinite(scaleY)) helper.setScale(scaleX, scaleY);
		}
		teardownSurfaceCanvas(surface) {
			surface.canvas.remove();
			surface.canvas.removeAttribute("style");
		}
		resetHelperContextDefaults(surface) {
			const context = surface.canvas.getContext("2d");
			if (!context) return;
			context.textAlign = "start";
			context.textBaseline = "alphabetic";
			context.lineJoin = "round";
		}
		shouldDrawOnOverflowHelper() {
			return this.helperCursor + 1 >= MAX_HELPER_SURFACES && this.helper.canvas.isConnected;
		}
		getCanvasByteSize(canvas) {
			const pixels = canvas.width * canvas.height;
			return Number.isFinite(pixels) && pixels > 0 ? pixels * CANVAS_RGBA_BYTES_PER_PIXEL : 0;
		}
		canReserveCanvasCopyBudget(budget, bytes) {
			return budget.count < MAX_DUPLICATE_CANVAS_CLONES_PER_FRAME && budget.bytes + bytes <= MAX_DUPLICATE_CANVAS_CLONE_BYTES_PER_FRAME;
		}
		incrementCanvasCopyBudget(budget, bytes) {
			budget.count++;
			budget.bytes += bytes;
		}
		decrementCanvasCopyBudget(budget, bytes) {
			budget.count = Math.max(0, budget.count - 1);
			budget.bytes = Math.max(0, budget.bytes - bytes);
		}
		reserveDuplicateClone(source, bytes) {
			var _this$duplicateCloneB;
			const budget = (_this$duplicateCloneB = this.duplicateCloneBudgetMap.get(source)) !== null && _this$duplicateCloneB !== void 0 ? _this$duplicateCloneB : {
				bytes: 0,
				count: 0
			};
			if (!this.canReserveCanvasCopyBudget(budget, bytes)) return false;
			this.incrementCanvasCopyBudget(budget, bytes);
			this.duplicateCloneBudgetMap.set(source, budget);
			return true;
		}
		reserveExternalCanvasCopy(source, bytes) {
			var _this$duplicateCloneB2;
			const sourceBudget = (_this$duplicateCloneB2 = this.duplicateCloneBudgetMap.get(source)) !== null && _this$duplicateCloneB2 !== void 0 ? _this$duplicateCloneB2 : {
				bytes: 0,
				count: 0
			};
			if (!this.canReserveCanvasCopyBudget(sourceBudget, bytes) || !this.canReserveCanvasCopyBudget(this.externalCanvasCopyFrameBudget, bytes)) return false;
			this.incrementCanvasCopyBudget(sourceBudget, bytes);
			this.incrementCanvasCopyBudget(this.externalCanvasCopyFrameBudget, bytes);
			this.duplicateCloneBudgetMap.set(source, sourceBudget);
			return true;
		}
		releaseDuplicateClone(source, bytes) {
			const budget = this.duplicateCloneBudgetMap.get(source);
			if (!budget) return;
			this.decrementCanvasCopyBudget(budget, bytes);
			if (budget.count === 0 && budget.bytes === 0) this.duplicateCloneBudgetMap.delete(source);
		}
		releaseExternalCanvasCopy(source, bytes) {
			this.releaseDuplicateClone(source, bytes);
			this.decrementCanvasCopyBudget(this.externalCanvasCopyFrameBudget, bytes);
		}
		resetDuplicateCloneAccounting() {
			this.duplicateCloneBudgetMap.clear();
			this.externalCanvasCopyFrameBudget = {
				bytes: 0,
				count: 0
			};
		}
		trimHelperSurfaces() {
			while (this.helperSurfaces.length > this.helperCursor + 1) {
				const helper = this.helperSurfaces.pop();
				if (!helper) continue;
				this.teardownSurfaceCanvas(helper);
				helper.destroy();
			}
		}
		resetState() {
			const { scaleX, scaleY, lineWidth } = this.state;
			this.stateStack.length = 0;
			this.state = _objectSpread2(_objectSpread2({}, DEFAULT_CSS_RENDER_STATE), {}, {
				scaleX,
				scaleY,
				lineWidth
			});
		}
		restoreFrameStartState() {
			const frameStartState = this.stateStack[0];
			if (!frameStartState) return;
			for (let i = this.stateStack.length - 1; i >= 0; i--) {
				var _this$stateStack$i;
				(_this$stateStack$i = this.stateStack[i]) === null || _this$stateStack$i === void 0 || _this$stateStack$i.helper.restore();
			}
			this.state = this.toRenderState(frameStartState);
			this.stateStack.length = 0;
		}
		toRenderState(saved) {
			return {
				alpha: saved.alpha,
				fillStyle: saved.fillStyle,
				strokeStyle: saved.strokeStyle,
				lineWidth: saved.lineWidth,
				font: saved.font,
				scaleX: saved.scaleX,
				scaleY: saved.scaleY
			};
		}
		normalizeSize(size) {
			return clampCanvasSize(size.width, size.height);
		}
		hideNode(node) {
			node.style.display = "none";
		}
		getInitialSize(root) {
			var _root$ownerDocument$d, _ref, _ref2, _ref3, _ref4, _ref5, _this$getNumber, _ref6, _ref7, _ref8, _ref9, _ref10, _this$getNumber2;
			const computedStyle = (_root$ownerDocument$d = root.ownerDocument.defaultView) === null || _root$ownerDocument$d === void 0 ? void 0 : _root$ownerDocument$d.getComputedStyle(root);
			const rect = root.getBoundingClientRect();
			return {
				width: (_ref = (_ref2 = (_ref3 = (_ref4 = (_ref5 = (_this$getNumber = this.getNumber(root.dataset.width)) !== null && _this$getNumber !== void 0 ? _this$getNumber : this.getNumber(root.getAttribute("width"))) !== null && _ref5 !== void 0 ? _ref5 : root instanceof HTMLCanvasElement ? root.width : void 0) !== null && _ref4 !== void 0 ? _ref4 : this.getNumber(root.style.width)) !== null && _ref3 !== void 0 ? _ref3 : this.getNumber(computedStyle === null || computedStyle === void 0 ? void 0 : computedStyle.width)) !== null && _ref2 !== void 0 ? _ref2 : this.getPositiveNumber(rect.width)) !== null && _ref !== void 0 ? _ref : 0,
				height: (_ref6 = (_ref7 = (_ref8 = (_ref9 = (_ref10 = (_this$getNumber2 = this.getNumber(root.dataset.height)) !== null && _this$getNumber2 !== void 0 ? _this$getNumber2 : this.getNumber(root.getAttribute("height"))) !== null && _ref10 !== void 0 ? _ref10 : root instanceof HTMLCanvasElement ? root.height : void 0) !== null && _ref9 !== void 0 ? _ref9 : this.getNumber(root.style.height)) !== null && _ref8 !== void 0 ? _ref8 : this.getNumber(computedStyle === null || computedStyle === void 0 ? void 0 : computedStyle.height)) !== null && _ref7 !== void 0 ? _ref7 : this.getPositiveNumber(rect.height)) !== null && _ref6 !== void 0 ? _ref6 : 0
			};
		}
		getPositiveNumber(value) {
			return Number.isFinite(value) && value > 0 ? value : void 0;
		}
		getNumber(value) {
			var _match$;
			if (!value) return void 0;
			const match = value.match(/^\s*(\d+(?:\.\d+)?)(?:px)?\s*$/);
			if (!match) return void 0;
			const number = Number.parseFloat((_match$ = match[1]) !== null && _match$ !== void 0 ? _match$ : "");
			return Number.isFinite(number) && number > 0 ? number : void 0;
		}
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
			_defineProperty(this, "redrawNeeded", false);
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
			try {
				gl.bindTexture(gl.TEXTURE_2D, tex);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, uploadSource);
			} catch (e) {
				gl.bindTexture(gl.TEXTURE_2D, null);
				gl.deleteTexture(tex);
				throw e;
			}
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
			this.redrawNeeded = true;
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
			const rect = getDrawImageRect(image, x, y, width, height);
			this.cmds.push({
				kind: 0,
				source,
				x: rect.x,
				y: rect.y,
				w: rect.width,
				h: rect.height,
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
			let flushSucceeded = false;
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
				flushSucceeded = true;
			} finally {
				gl.bindVertexArray(null);
				this.cmds.length = 0;
				this.helperDirty = false;
				this.frameCount++;
				this.redrawNeeded = !flushSucceeded;
			}
			if (this.frameCount % GC_INTERVAL_FRAMES === 0) this._gcTextures();
		}
		invalidateImage(image) {
			if (!(image === null || image === void 0 ? void 0 : image.canvas)) return;
			const entry = this.texMap.get(image.canvas);
			if (entry) {
				this._deleteTiles(entry);
				this.texMap.delete(image.canvas);
			}
		}
		needsRedraw() {
			return this.redrawNeeded;
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
		HTML5CSSRenderer: () => HTML5CSSRenderer,
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
	* @param renderer 描画対象のCanvasコンテキスト
	* @param index コメントのインデックス
	* @param ctx インスタンスコンテキスト
	* @returns プラグインまたは内臓のコメントインスタンス
	*/
	const createCommentInstance = (comment, renderer, index, ctx) => {
		for (const plugin of ctx.config.commentPlugins) if (plugin.condition(comment, ctx.config, ctx.options)) return new plugin.class(comment, renderer, index, ctx);
		return new HTML5Comment(comment, renderer, index, ctx);
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
	const TIMELINE_COMMENT_SORT = (a, b) => Number(a.owner) - Number(b.owner) || a.index - b.index;
	const isFiniteVpos = (vpos) => Number.isFinite(vpos);
	const isFinitePosition = (pos) => Number.isFinite(pos.x) && Number.isFinite(pos.y);
	const rejectInvalidCommentPosition = (comment) => {
		comment.comment.invisible = true;
		try {
			comment.invisible = true;
		} catch (_e) {}
		comment.posY = 0;
	};
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
	const areCommentsSortedByVpos = (items, previous) => {
		let previousComment = previous;
		for (const item of items) {
			if (!item) continue;
			if (previousComment && previousComment.vpos > item.vpos) return false;
			previousComment = item;
		}
		return true;
	};
	const rendererHasVideoSurface = (renderer) => "video" in renderer && renderer.video != null;
	const getRendererClear = (renderer) => {
		const clear = renderer.clear;
		return typeof clear === "function" ? clear : void 0;
	};
	const removeUndefinedConfigValues = (config) => Object.fromEntries(Object.entries(config).filter(([, value]) => value !== void 0));
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
			var _options$config;
			_defineProperty(this, "enableLegacyPiP", void 0);
			_defineProperty(this, "showCollision", void 0);
			_defineProperty(this, "showFPS", void 0);
			_defineProperty(this, "showCommentCount", void 0);
			_defineProperty(this, "lastVpos", void 0);
			_defineProperty(this, "lastEventVpos", void 0);
			_defineProperty(this, "lastCursor", void 0);
			_defineProperty(this, "lastFrameBanActive", void 0);
			_defineProperty(this, "frameDirty", void 0);
			_defineProperty(this, "_cachedSplit", null);
			_defineProperty(this, "lazyCommentOrderSortedByVpos", void 0);
			_defineProperty(this, "nextUnprocessedCommentIndex", void 0);
			_defineProperty(this, "commentArrayIndexMap", void 0);
			_defineProperty(this, "processedCommentIndex", void 0);
			_defineProperty(this, "comments", void 0);
			_defineProperty(this, "destroyed", false);
			_defineProperty(this, "renderer", void 0);
			_defineProperty(this, "collision", void 0);
			_defineProperty(this, "timeline", void 0);
			_defineProperty(this, "ctx", void 0);
			_defineProperty(this, "eventHandler", void 0);
			_defineProperty(this, "plugins", []);
			const constructorStart = performance.now();
			initConfig();
			if (!typeGuard.config.initOptions(initOptions)) throw new InvalidOptionError();
			const options = Object.assign({}, defaultOptions, initOptions);
			const config = Object.assign({}, defaultConfig, removeUndefinedConfigValues((_options$config = options.config) !== null && _options$config !== void 0 ? _options$config : {}));
			const nicoScripts = createNicoScripts();
			const imageCache = new ImageCacheContext();
			const rangeCache = new RangeCacheContext();
			this.ctx = {
				config,
				options,
				nicoScripts,
				imageCache,
				rangeCache
			};
			this.eventHandler = new EventHandler();
			let renderer = _renderer;
			if (renderer instanceof HTMLCanvasElement) renderer = createRenderer(renderer, options.video);
			else if (options.video) console.warn("options.video is ignored because renderer is not HTMLCanvasElement");
			this.renderer = renderer;
			this._log(`renderer: ${renderer.rendererName}`);
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
			this.lastEventVpos = -1;
			this.lastFrameBanActive = false;
			this.frameDirty = true;
			this.lazyCommentOrderSortedByVpos = true;
			this.nextUnprocessedCommentIndex = 0;
			this.commentArrayIndexMap = /* @__PURE__ */ new WeakMap();
			this.processedCommentIndex = -1;
			this.comments = this.preRendering(parsedData);
			this._rebuildCommentArrayIndex(this.comments);
			if (!this.ctx.options.lazy || !this.lazyCommentOrderSortedByVpos) this._advanceNextUnprocessedCommentIndex();
			this._log(`constructor complete: ${performance.now() - constructorStart}ms`);
		}
		destroy() {
			var _this$renderer$destro, _this$renderer;
			if (this.destroyed) return;
			this.destroyed = true;
			for (const comment of this.comments) try {
				var _comment$destroy;
				(_comment$destroy = comment.destroy) === null || _comment$destroy === void 0 || _comment$destroy.call(comment);
			} catch (e) {
				console.error("Failed to destroy comment", e);
			}
			this.comments = [];
			this.commentArrayIndexMap = /* @__PURE__ */ new WeakMap();
			this._clearTimeline();
			this._clearCollision();
			this.ctx.rangeCache.reset();
			for (const plugin of this.plugins) {
				try {
					var _plugin$instance$dest, _plugin$instance;
					(_plugin$instance$dest = (_plugin$instance = plugin.instance).destroy) === null || _plugin$instance$dest === void 0 || _plugin$instance$dest.call(_plugin$instance);
				} catch (e) {
					console.error("Failed to destroy plugin", e);
				}
				try {
					var _plugin$canvas$destro, _plugin$canvas;
					(_plugin$canvas$destro = (_plugin$canvas = plugin.canvas).destroy) === null || _plugin$canvas$destro === void 0 || _plugin$canvas$destro.call(_plugin$canvas);
				} catch (e) {
					console.error("Failed to destroy plugin canvas", e);
				}
			}
			this.plugins = [];
			this.ctx.imageCache.reset();
			(_this$renderer$destro = (_this$renderer = this.renderer).destroy) === null || _this$renderer$destro === void 0 || _this$renderer$destro.call(_this$renderer);
		}
		_clearTimeline() {
			for (const key of Object.keys(this.timeline)) delete this.timeline[Number(key)];
		}
		_clearCollision() {
			for (const collision of [
				this.collision.ue,
				this.collision.shita,
				this.collision.left,
				this.collision.right
			]) for (const key of Object.keys(collision)) delete collision[Number(key)];
		}
		_rebuildCommentArrayIndex(comments) {
			this.commentArrayIndexMap = /* @__PURE__ */ new WeakMap();
			for (let i = 0, n = comments.length; i < n; i++) {
				const comment = comments[i];
				if (!comment) continue;
				this.commentArrayIndexMap.set(comment, i);
			}
		}
		_advanceNextUnprocessedCommentIndex(comments = this.comments, scanBudget) {
			const scanEndIndex = scanBudget === void 0 ? comments.length : Math.min(comments.length, this.nextUnprocessedCommentIndex + scanBudget);
			while (this.nextUnprocessedCommentIndex < scanEndIndex) {
				const comment = comments[this.nextUnprocessedCommentIndex];
				if (comment && !isFiniteVpos(comment.vpos)) {
					rejectInvalidCommentPosition(comment);
					this.nextUnprocessedCommentIndex++;
					continue;
				}
				if (comment && !comment.invisible && comment.posY < 0) break;
				this.nextUnprocessedCommentIndex++;
			}
			return this.nextUnprocessedCommentIndex;
		}
		/**
		* 事前に当たり判定を考慮してコメントの描画場所を決定する
		* @param _rawData コメントデータ
		* @returns コメントのインスタンス配列
		*/
		preRendering(_rawData) {
			let rawData = _rawData;
			const preRenderingStart = performance.now();
			if (this.ctx.options.keepCA) rawData = changeCALayer(rawData, this.ctx.config);
			let instances = rawData.reduce((pv, val, index) => {
				pv.push(createCommentInstance(val, this.renderer, index, this.ctx));
				return pv;
			}, []);
			const plugins = [];
			for (const plugin of this.ctx.config.plugins) try {
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
			this.plugins = plugins;
			this.lazyCommentOrderSortedByVpos = areCommentsSortedByVpos(instances);
			if (!this.ctx.options.lazy || !this.lazyCommentOrderSortedByVpos) {
				this.getCommentPos(instances, instances.length);
				this.sortTimelineComment();
			}
			this._log(`preRendering complete: ${performance.now() - preRenderingStart}ms`);
			return instances;
		}
		/**
		* 計算された描画サイズをもとに各コメントの配置位置を決定する
		* @param data コメントデータ
		* @param end 終了インデックス
		*/
		getCommentPos(data, end, touchedTimeline, advanceBudget) {
			const getCommentPosStart = performance.now();
			const startIndex = this.processedCommentIndex + 1;
			if (startIndex >= end) return;
			for (let i = startIndex; i < end; i++) {
				const comment = data[i];
				if (!comment) continue;
				this.processedCommentIndex = i;
				if (comment.invisible || comment.posY > -1) continue;
				if (comment.loc === "naka") processMovableComment(comment, this.collision, this.timeline, false, this.ctx.config, touchedTimeline);
				else processFixedComment(comment, this.collision[comment.loc], this.timeline, false, this.ctx.config, touchedTimeline);
			}
			this.nextUnprocessedCommentIndex = Math.max(this.nextUnprocessedCommentIndex, this.processedCommentIndex + 1);
			this._advanceNextUnprocessedCommentIndex(data, advanceBudget);
			this._log(`getCommentPos complete: ${performance.now() - getCommentPosStart}ms`);
		}
		resolveLazyCommentWindow(vpos, resolutionBudget) {
			if (!this.ctx.options.lazy) return false;
			const scanStartIndex = this.nextUnprocessedCommentIndex;
			const scanEndIndex = resolutionBudget === void 0 ? this.comments.length : Math.min(this.comments.length, scanStartIndex + resolutionBudget);
			const startIndex = this._advanceNextUnprocessedCommentIndex(this.comments, resolutionBudget);
			if (startIndex >= scanEndIndex) return false;
			const resolveUntil = vpos + getLazyCommentLookahead(this.ctx.config.canvasWidth);
			let endIndex = startIndex - 1;
			for (let i = startIndex; i < scanEndIndex; i++) {
				const comment = this.comments[i];
				if (comment && !isFiniteVpos(comment.vpos)) {
					rejectInvalidCommentPosition(comment);
					continue;
				}
				if (!comment || comment.invisible || comment.posY > -1) continue;
				if (comment.vpos <= resolveUntil) endIndex = i;
				else if (this.lazyCommentOrderSortedByVpos) break;
			}
			if (endIndex < startIndex) return false;
			const touchedTimeline = /* @__PURE__ */ new Set();
			this.getCommentPos(this.comments, Math.min(endIndex + 1, scanEndIndex), touchedTimeline, resolutionBudget === void 0 ? void 0 : 0);
			this.sortTimelineComment(touchedTimeline);
			return true;
		}
		/**
		* 投稿者コメントを前に移動
		*/
		sortTimelineComment(vposes) {
			const sortCommentStart = performance.now();
			const targetVposes = vposes !== null && vposes !== void 0 ? vposes : Object.keys(this.timeline);
			for (const vpos of targetVposes) {
				const item = this.timeline[Number(vpos)];
				if (!item) continue;
				item.sort(TIMELINE_COMMENT_SORT);
			}
			this._log(`parseData complete: ${performance.now() - sortCommentStart}ms`);
		}
		/**
		* 動的にコメント追加する
		* ※すでに存在するコメントの位置はvposに関係なく更新されません
		* @param rawComments コメントデータ
		*/
		addComments(...rawComments) {
			const validComments = rawComments.reduce((pv, val) => {
				const parsedComment = /* @__PURE__ */ safeParse(ZFormattedComment, val);
				if (parsedComment.success) pv.push(parsedComment.output);
				return pv;
			}, []);
			if (validComments.length === 0) return;
			this.ctx.rangeCache.reset();
			const touchedTimeline = /* @__PURE__ */ new Set();
			const comments = validComments.reduce((pv, val, index) => {
				pv.push(createCommentInstance(val, this.renderer, this.comments.length + index, this.ctx));
				return pv;
			}, []);
			for (const plugin of this.plugins) try {
				var _plugin$instance$addC, _plugin$instance2;
				(_plugin$instance$addC = (_plugin$instance2 = plugin.instance).addComments) === null || _plugin$instance$addC === void 0 || _plugin$instance$addC.call(_plugin$instance2, comments);
			} catch (e) {
				console.error("Failed to add comments", e);
			}
			for (const comment of comments) {
				if (comment.invisible) continue;
				if (comment.loc === "naka") processMovableComment(comment, this.collision, this.timeline, false, this.ctx.config, touchedTimeline);
				else processFixedComment(comment, this.collision[comment.loc], this.timeline, false, this.ctx.config, touchedTimeline);
			}
			this.comments.push(...comments);
			this.nextUnprocessedCommentIndex = Math.min(this.nextUnprocessedCommentIndex, this.comments.length - comments.length);
			const baseOffset = this.comments.length - comments.length;
			for (let i = 0, n = comments.length; i < n; i++) {
				const comment = comments[i];
				if (!comment) continue;
				this.commentArrayIndexMap.set(comment, baseOffset + i);
			}
			if (!this.ctx.options.lazy) {
				const prePushTail = baseOffset - 1;
				if (this.processedCommentIndex < prePushTail) this.getCommentPos(this.comments, prePushTail + 1, touchedTimeline);
				this.processedCommentIndex = Math.max(this.processedCommentIndex, this.comments.length - 1);
			}
			this._advanceNextUnprocessedCommentIndex();
			this.sortTimelineComment(touchedTimeline);
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
			var _this$renderer$needsR, _this$renderer$needsR2, _this$renderer2, _this$timeline$vposIn, _this$timeline$this$l, _this$_cachedSplit;
			if (!isFiniteVpos(vpos)) return false;
			const profile = this.ctx.options.debug ? {
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
			const requiresVideoRedraw = rendererHasVideoSurface(this.renderer);
			const rendererNeedsRedraw = (_this$renderer$needsR = (_this$renderer$needsR2 = (_this$renderer2 = this.renderer).needsRedraw) === null || _this$renderer$needsR2 === void 0 ? void 0 : _this$renderer$needsR2.call(_this$renderer2)) !== null && _this$renderer$needsR !== void 0 ? _this$renderer$needsR : false;
			const cursorChanged = cursor === void 0 !== (this.lastCursor === void 0) || cursor !== void 0 && this.lastCursor !== void 0 && (cursor.x !== this.lastCursor.x || cursor.y !== this.lastCursor.y);
			this.lastCursor = cursor === void 0 ? void 0 : {
				x: cursor.x,
				y: cursor.y
			};
			const requiresDynamicFrameRedraw = requiresVideoRedraw || rendererNeedsRedraw || this.frameDirty || this.plugins.length > 0 || this.showCollision || this.showFPS || this.showCommentCount || cursorChanged;
			if (this.lastVpos === vpos && !forceRendering && !requiresDynamicFrameRedraw) return false;
			const triggerHandlerStart = profile ? performance.now() : 0;
			this.eventHandler.trigger(vposInt, this.lastEventVpos, this.ctx.nicoScripts);
			this.lastEventVpos = vposInt;
			setProfile("triggerHandler", triggerHandlerStart);
			const frameBanActive = isBanActive(vpos, this.ctx.nicoScripts, this.ctx.rangeCache);
			this.resolveLazyCommentWindow(vposInt, frameBanActive ? BAN_FRAME_POSITION_RESOLUTION_BUDGET : void 0);
			const timelineRange = (_this$timeline$vposIn = this.timeline[vposInt]) !== null && _this$timeline$vposIn !== void 0 ? _this$timeline$vposIn : EMPTY_TIMELINE;
			const lastTimelineRange = (_this$timeline$this$l = this.timeline[this.lastVposInt]) !== null && _this$timeline$this$l !== void 0 ? _this$timeline$this$l : EMPTY_TIMELINE;
			const currentHasNaka = hasNakaComment(timelineRange);
			const lastHasNaka = ((_this$_cachedSplit = this._cachedSplit) === null || _this$_cachedSplit === void 0 ? void 0 : _this$_cachedSplit.vpos) === this.lastVposInt ? this._cachedSplit.hasNaka : hasNakaComment(lastTimelineRange);
			this._cachedSplit = {
				vpos: vposInt,
				hasNaka: currentHasNaka
			};
			if (!forceRendering && !requiresDynamicFrameRedraw && !currentHasNaka && !lastHasNaka && frameBanActive === this.lastFrameBanActive) {
				if (arrayEqual(timelineRange, lastTimelineRange)) return false;
			}
			this.frameDirty = true;
			this.renderer.clearRect(0, 0, this.ctx.config.canvasWidth, this.ctx.config.canvasHeight);
			const drawVideoStart = profile ? performance.now() : 0;
			this._drawVideo();
			setProfile("drawVideo", drawVideoStart);
			const drawPluginsStart = profile ? performance.now() : 0;
			for (const plugin of this.plugins) try {
				var _plugin$instance$draw, _plugin$instance3;
				if (((_plugin$instance$draw = (_plugin$instance3 = plugin.instance).draw) === null || _plugin$instance$draw === void 0 ? void 0 : _plugin$instance$draw.call(_plugin$instance3, vpos)) !== false) this.renderer.invalidateImage(plugin.canvas);
				this.renderer.drawImage(plugin.canvas, 0, 0);
			} catch (e) {
				console.error("Failed to draw comments", e);
			}
			setProfile("drawPlugins", drawPluginsStart);
			const drawCollisionStart = profile ? performance.now() : 0;
			this._drawCollision(vposInt);
			setProfile("drawCollision", drawCollisionStart);
			const drawCommentsStart = profile ? performance.now() : 0;
			const drawnCount = this._drawComments(timelineRange, vpos, cursor, frameBanActive);
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
			this.lastVpos = vpos;
			this.lastFrameBanActive = frameBanActive;
			this.frameDirty = false;
			if (profile) {
				profile.total = performance.now() - drawCanvasStart;
				this._log(`drawCanvas profile: trigger=${profile.triggerHandler.toFixed(2)}ms, video=${profile.drawVideo.toFixed(2)}ms, plugins=${profile.drawPlugins.toFixed(2)}ms, collision=${profile.drawCollision.toFixed(2)}ms, comments=${profile.drawComments.toFixed(2)}ms, fps=${profile.drawFPS.toFixed(2)}ms, count=${profile.drawCommentCount.toFixed(2)}ms, flush=${profile.flush.toFixed(2)}ms, total=${profile.total.toFixed(2)}ms`);
			} else this._log(`drawCanvas complete: ${performance.now() - drawCanvasStart}ms`);
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
		_drawComments(timelineRange, vpos, cursor, frameBanActive) {
			const { config, nicoScripts, rangeCache } = this.ctx;
			const banActive = frameBanActive !== null && frameBanActive !== void 0 ? frameBanActive : isBanActive(vpos, nicoScripts, rangeCache);
			if (banActive) return 0;
			let startIndex = 0;
			let endIndex = timelineRange.length;
			if (config.commentLimit !== void 0) if (config.commentLimit === 0) endIndex = 0;
			else if (config.hideCommentOrder === "asc") ({startIndex, endIndex} = getSliceBounds(timelineRange.length, -config.commentLimit));
			else ({startIndex, endIndex} = getSliceBounds(timelineRange.length, 0, config.commentLimit));
			const frameActiveState = {
				banActive,
				reverseActiveOwner: isReverseActive(vpos, true, nicoScripts, rangeCache),
				reverseActiveViewer: isReverseActive(vpos, false, nicoScripts, rangeCache)
			};
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
			if (requiresFullScan && this.processedCommentIndex < this.comments.length - 1) this.getCommentPos(this.comments, this.comments.length);
			else if (requiresFullScan) this._log("_drawComments: requiresFullScan with no unprocessed comments — possible plugin side-effect");
			else if (maxCommentOffset >= 0 && this.processedCommentIndex < maxCommentOffset) this.getCommentPos(this.comments, maxCommentOffset + 1);
			const guardUnregisteredUnresolved = requiresFullScan;
			let drawnCount = 0;
			for (let i = startIndex; i < endIndex; i++) {
				const comment = timelineRange[i];
				if (!comment || comment.invisible) continue;
				if (guardUnregisteredUnresolved) {
					if (this.commentArrayIndexMap.get(comment) === void 0 && comment.posY < 0) {
						this._log("_drawComments: skip unresolved unregistered comment (possible plugin-injected entry)");
						continue;
					}
				}
				try {
					comment.draw(vpos, this.showCollision, cursor, frameActiveState);
					drawnCount += 1;
				} catch (e) {
					const message = e instanceof Error ? e.message : String(e);
					this._log(`_drawComments: failed to draw comment index=${comment.index}: ${message}`);
				}
			}
			return drawnCount;
		}
		/**
		* 当たり判定を描画する
		* @param vpos vpos
		*/
		_drawCollision(vpos) {
			const { config } = this.ctx;
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
			const { config } = this.ctx;
			if (this.showFPS) {
				this.renderer.save();
				this.renderer.setFont(parseFont("defont", 60, config));
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
			const { config } = this.ctx;
			if (this.showCommentCount) {
				this.renderer.save();
				this.renderer.setFont(parseFont("defont", 60, config));
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
			this.eventHandler.register(eventName, handler);
		}
		/**
		* イベントハンドラを削除
		* @template K
		* @param eventName イベント名
		* @param handler イベントハンドラ
		*/
		removeEventListener(eventName, handler) {
			this.eventHandler.remove(eventName, handler);
		}
		/**
		* キャンバスを消去する
		*/
		clear() {
			const clear = getRendererClear(this.renderer);
			if (clear) clear.call(this.renderer);
			else {
				const size = this.renderer.getSize();
				this.renderer.clearRect(0, 0, size.width, size.height);
			}
			this.renderer.flush();
		}
		/**
		* \@ボタンの呼び出し用
		* @param vpos 再生位置
		* @param pos カーソルの位置
		*/
		click(vpos, pos) {
			if (!isFiniteVpos(vpos) || !isFinitePosition(pos)) return;
			const _comments = this.timeline[Math.floor(vpos)];
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
		_log(msg) {
			if (this.ctx.options.debug) console.debug(msg);
		}
	};
	_NiconiComments = NiconiComments;
	_defineProperty(NiconiComments, "typeGuard", typeGuard);
	_defineProperty(NiconiComments, "default", _NiconiComments);
	_defineProperty(NiconiComments, "BAN_FRAME_POSITION_RESOLUTION_BUDGET", BAN_FRAME_POSITION_RESOLUTION_BUDGET);
	_defineProperty(NiconiComments, "FlashComment", {
		condition: isFlashComment,
		class: FlashComment
	});
	_defineProperty(NiconiComments, "internal", internal_exports);
	//#endregion
	return NiconiComments;
});
