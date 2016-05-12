(function(global) {
	"use strict";

	var define, require, use,
		slice = Array.prototype.slice;
	Number.prototype.map = function(istart, istop, ostart, ostop) {
		return ostart + (ostop - ostart) * ((this - istart) / (istop - istart));
	};
	Number.prototype.limit = function(min, max) {
		return Math.min(max, Math.max(min, this));
	};
	Number.prototype.round = function(precision) {
		precision = Math.pow(10, precision || 0);
		return Math.round(this * precision) / precision;
	};
	Number.prototype.floor = function() {
		return Math.floor(this);
	};
	Number.prototype.ceil = function() {
		return Math.ceil(this);
	};
	Number.prototype.toInt = function() {
		return (this | 0);
	};
	Number.prototype.toRad = function() {
		return (this / 180) * Math.PI;
	};
	Number.prototype.toDeg = function() {
		return (this * 180) / Math.PI;
	};
	Array.prototype.erase = function(item) {
		for (var i = this.length; i--;) {
			if (this[i] === item) {
				this.splice(i, 1);
			}
		}
		return this;
	};
	Array.prototype.random = function() {
		return this[Math.floor(Math.random() * this.length)];
	};
	Function.prototype.bind = Function.prototype.bind || function(oThis) {
		if (typeof this !== "function") {
			throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
		}
		var aArgs = Array.prototype.slice.call(arguments, 1),
			fToBind = this,
			fNOP = function() {},
			fBound = function() {
				return fToBind.apply((this instanceof fNOP && oThis ? this : oThis), aArgs.concat(Array.prototype.slice.call(arguments)));
			};
		fNOP.prototype = this.prototype;
		fBound.prototype = new fNOP();
		return fBound;
	};

	var initializing = false,
		fnTest = /xyz/.test(function() {
			xyz;
		}) ? /\bparent\b/ : /.*/,
		lastClassId = 0;
	global.GameEngine = {
		basePath: 'modules',
		modules: {},
		moduleCount: 0,
		resources: [],
		ready: false,
		callbacks: [],
		loadModuleUri:{},
		ua: {},
		nocache: '',
		debug: true,
		$: function(selector) {
			return selector.charAt(0) == '#' ? document.getElementById(selector.substr(1)) : document.getElementsByTagName(selector);
		},
		$new: function(name) {
			return document.createElement(name);
		},
		log: function(msg) {
			global.console && console.log(msg);
		},
		copy: function(object) {
			if (!object || typeof(object) != 'object' || object instanceof HTMLElement || object instanceof GameEngine.Class) {
				return object;
			} else if (object instanceof Array) {
				var c = [];
				for (var i = 0, l = object.length; i < l; i++) {
					c[i] = GameEngine.copy(object[i]);
				}
				return c;
			} else {
				var c = {};
				for (var i in object) {
					c[i] = GameEngine.copy(object[i]);
				}
				return c;
			}
		},
		merge: function(original, extended) {
			for (var key in extended) {
				var ext = extended[key];
				if (typeof(ext) != 'object' || ext instanceof HTMLElement || ext instanceof GameEngine.Class || ext === null) {
					original[key] = ext;
				} else {
					if (!original[key] || typeof(original[key]) != 'object') {
						original[key] = (ext instanceof Array) ? [] : {};
					}
					GameEngine.merge(original[key], ext);
				}
			}
			return original;
		},
		isType: function(type, obj) {
			return Object.prototype.toString.call(obj) === "[object " + type + "]"
		},
		ksort: function(obj) {
			if (!obj || typeof(obj) != 'object') {
				return [];
			}
			var keys = [],
				values = [];
			for (var i in obj) {
				keys.push(i);
			}
			keys.sort();
			for (var i = 0; i < keys.length; i++) {
				values.push(obj[keys[i]]);
			}
			return values;
		},
		setVendorAttribute: function(el, attr, val) {
			var uc = attr.charAt(0).toUpperCase() + attr.substr(1);
			el[attr] = el['ms' + uc] = el['moz' + uc] = el['webkit' + uc] = el['o' + uc] = val;
		},
		getVendorAttribute: function(el, attr) {
			var uc = attr.charAt(0).toUpperCase() + attr.substr(1);
			return el[attr] || el['ms' + uc] || el['moz' + uc] || el['webkit' + uc] || el['o' + uc];
		},
		normalizeVendorAttribute: function(el, attr) {
			var prefixedVal = GameEngine.getVendorAttribute(el, attr);
			if (!el[attr] && prefixedVal) {
				el[attr] = prefixedVal;
			}
		},
		getImagePixels: function(image, x, y, width, height) {
			var canvas = GameEngine.$new('canvas');
			canvas.width = image.width;
			canvas.height = image.height;
			var ctx = canvas.getContext('2d');
			GameEngine.System.SCALE.CRISP(canvas, ctx);
			var ratio = GameEngine.getVendorAttribute(ctx, 'backingStorePixelRatio') || 1;
			GameEngine.normalizeVendorAttribute(ctx, 'getImageDataHD');
			var realWidth = image.width / ratio,
				realHeight = image.height / ratio;
			canvas.width = Math.ceil(realWidth);
			canvas.height = Math.ceil(realHeight);
			ctx.drawImage(image, 0, 0, realWidth, realHeight);
			return (ratio === 1) ? ctx.getImageData(x, y, width, height) : ctx.getImageDataHD(x, y, width, height);
		},
		addResource: function(resource){
			GameEngine.resources.push(resource);
		},
		_boot: function() {
			if (document.location.href.match(/\?nocache/)) {
				GameEngine.setNocache(true);
			}
			GameEngine.ua.pixelRatio = window.devicePixelRatio || 1;
			GameEngine.ua.viewport = {
				width: window.innerWidth,
				height: window.innerHeight
			};
			GameEngine.ua.screen = {
				width: window.screen.availWidth * GameEngine.ua.pixelRatio,
				height: window.screen.availHeight * GameEngine.ua.pixelRatio
			};
			GameEngine.ua.iPhone = /iPhone/i.test(navigator.userAgent);
			GameEngine.ua.iPhone4 = (GameEngine.ua.iPhone && GameEngine.ua.pixelRatio == 2);
			GameEngine.ua.iPad = /iPad/i.test(navigator.userAgent);
			GameEngine.ua.android = /android/i.test(navigator.userAgent);
			GameEngine.ua.winPhone = /Windows Phone/i.test(navigator.userAgent);
			GameEngine.ua.iOS = GameEngine.ua.iPhone || GameEngine.ua.iPad;
			GameEngine.ua.mobile = GameEngine.ua.iOS || GameEngine.ua.android || GameEngine.ua.winPhone || /mobile/i.test(navigator.userAgent);
			GameEngine.ua.touchDevice = (('ontouchstart' in window) || (window.navigator.msMaxTouchPoints));
		}
	};

	var execModule = function() {
		var inits = GameEngine.callbacks || [];
		for (var i = 0; i < inits.length; i++) {
			if (inits[i] && checkDeps(inits[i].dependencies)) {
				var cb = inits[i].factory;
				var deps = inits[i].dependencies;
				var mods = [];
				var allDeps = [];
				var m;
				for (var j = 0; j < deps.length; j++) {
					var m = require(deps[j]);
					allDeps.push(m.dependencies);
					mods.push(m);
				}
				inits[i] = null;
				cb.apply(null, mods);
				GameEngine.debug && GameEngine.log('run callback ');
			}
		}
	};

	use = function(deps, factory) {
		if(arguments.length === 1){
			deps = [];
			factory = deps;
		}
		var _deps = getDeps(factory.toString());
		deps = GameEngine.isType('Array', deps) ? deps : deps ? [deps] : [];
		deps = GameEngine.merge(deps, _deps);
		var m = new Module('__init__');
		m.dependencies = deps;
		m.factory = factory;
		m.exports = null;
		GameEngine.callbacks.push(m);
		GameEngine.emit('module_ready')
	};

	define = function(id, deps, factory) {
		if (!id || typeof id != 'string') {
			return;
		}
		if (GameEngine.modules[id] && GameEngine.modules[id].factory) {
			GameEngine.emit('module_exist', id);
			return 1;
		}
		if (arguments.length === 2) {
			factory = deps;
			deps = null;
		}
		deps = GameEngine.isType('Array', deps) ? deps : deps ? [deps] : [];
		var m = new Module(id);
		var _deps = getDeps(factory.toString());
		deps = GameEngine.merge(deps, _deps);
		m.factory = factory;
		m.dependencies = deps;
		GameEngine.moduleCount++;
		GameEngine.modules[id] = m;
		GameEngine.emit('module_define', id);
	};

	require = function(id) {
		var m = GameEngine.modules[id];
		if (!m) {
			GameEngine.emit('module_error', id);
			return null;
		}
		if (m.exports) {
			return m.exports;
		}
		var factory = m.factory;
		var r = GameEngine.isType('Function', factory) ? factory(require, m.exports = {}, m) : factory;
		m.exports = r === void 0 ? m.exports : r;
		return m.exports;
	};

	function Module(id) {
		this.id = id;
		this.dependencies = [];
		this.exports = null;
	}

	function getDeps(code) {
		var commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
		var cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g;
		var ret = [];
		code.replace(commentRegExp, "").replace(cjsRequireRegExp, function(match, dep) {
			dep && ret.push(dep);
		})
		return ret;
	}

	function checkDeps(deps) {
		var list = {},
			flag = true;
		for (var i = 0; i < deps.length; i++) list[deps[i]] = 1;
		getDesps(deps, list);
		for (var i in list) {
			if (!GameEngine.loadModuleUri[i]) {
				loadModule(i);
				flag = false;
			}
			if(!GameEngine.modules[i]){
				flag = false;
			}
		}
		return flag;

		function getDesps(deps, list) {
			for (var i = 0; i < deps.length; i++) {
				if (!list[deps[i]]) {
					list[deps[i]] = 1;
				}
				if (GameEngine.modules[deps[i]] && list[deps[i]] != 2) {
					list[deps[i]] = 2;
					getDesps(GameEngine.modules[deps[i]].dependencies, list);
				}
			}
		}
	}

	function loadModule(id) {
		var m = GameEngine.modules[id];
		if (m) {
			GameEngine.emit('module_ready', id);
			return;
		}
		var url = GameEngine.basePath + '/' + id;
		url = url.replace(/\/\//g, '/') + '.js';
		GameEngine.loadModuleUri[id] = 1;
		var head = document.getElementsByTagName("head")[0] || document.documentElement;
		var baseElement = head.getElementsByTagName("base")[0];
		var node = document.createElement("script");
		node.charset = "utf-8";
		node.async = true;
		node.src = url;
		var handler = function() {
			GameEngine.emit('module_ready', id);
		};
		handler.uri = url;
		node.onload = handler;
		node.onerror = function(){
			GameEngine.emit('module_error', id);
		}
		head.appendChild(node);
		GameEngine.debug && GameEngine.log('load file ' + url);
	}

	function _domReady() {
		if(GameEngine.ready) return;
		if (!document.body) {
			return setTimeout(domReady, 13);
		}
		GameEngine.ready = true;
		GameEngine.on('module_ready', function(id) {
			GameEngine.debug && GameEngine.log('module ' + id + ' readyed.')
			execModule();
		});
		GameEngine.on('module_error', function(id) {
			GameEngine.debug && GameEngine.log('load module ' + id + ' error!');
		});
		GameEngine.on('module_define', function(id){
			GameEngine.debug && GameEngine.log('define module '+id);
		});
		GameEngine.on('module_exist', function(id){
			GameEngine.debug && GameEngine.log('module '+id+' is exist.');
		});
		execModule();
	}

	function domReady() {
		if (GameEngine.ready) return;
		if (document.readyState === 'complete') {
			_domReady();
		} else {
			document.addEventListener('DOMContentLoaded', domReady, false);
			window.addEventListener('load', domReady, false);
		}
	}

	var EventBase = {
		on: function(name, fn) {
			if (!this._events) {
				this._events = {}
			}
			var cbs = this._events[name] || (this._events[name] = []);
			GameEngine.isType('Function', fn) && cbs.push(fn);
		},
		off: function(name, fn) {
			if (name) {
				if (fn && GameEngine.isType('Function', fn)) {
					for (var i = this._events[name].length - 1; i >= 0; i--) {
						if (fn === this._events[name][i]) {
							this._events[name].splice(i, 1);
						}
					}
				}
			} else {
				this._events[name] = [];
			}
			return this;
		},
		emit: function(name) {
			if (!this._events || !this._events[name] || !this._events[name].length) {
				return;
			}
			for (var i = 0, l = this._events[name].length; i < l; i++) {
				this._events[name][i].apply(this, slice.call(arguments, 1));
			}
		}
	};

	function inject(prop) {
		var proto = this.prototype;
		var parent = {};
		for (var name in prop) {
			if (typeof(prop[name]) == "function" && typeof(proto[name]) == "function" && fnTest.test(prop[name])) {
				parent[name] = proto[name];
				proto[name] = (function(name, fn) {
					return function() {
						var tmp = this.parent;
						this.parent = parent[name];
						var ret = fn.apply(this, arguments);
						this.parent = tmp;
						return ret;
					};
				})(name, prop[name]);
			} else {
				proto[name] = prop[name];
			}
		}
	}

	global.GameEngine.Class = function() {};
	global.GameEngine.Class.extend = function(prop) {
		var parent = this.prototype;
		initializing = true;
		var prototype = new this();
		initializing = false;
		for (var name in prop) {
			if (typeof(prop[name]) == "function" && typeof(parent[name]) == "function" && fnTest.test(prop[name])) {
				prototype[name] = (function(name, fn) {
					return function() {
						var tmp = this.parent;
						this.parent = parent[name];
						var ret = fn.apply(this, arguments);
						this.parent = tmp;
						return ret;
					};
				})(name, prop[name]);
			} else {
				prototype[name] = prop[name];
			}
		}

		function Class() {
			if (!initializing) {
				if (this.staticInstantiate) {
					var obj = this.staticInstantiate.apply(this, arguments);
					if (obj) {
						return obj;
					}
				}
				for (var p in this) {
					if (typeof(this[p]) == 'object') {
						this[p] = GameEngine.copy(this[p]);
					}
				}
				if (this.init) {
					this.init.apply(this, arguments);
				}
			}
			return this;
		}
		Class.prototype = prototype;
		Class.prototype.constructor = Class;
		Class.extend = global.GameEngine.Class.extend;
		Class.inject = inject;
		Class.classId = prototype.classId = ++lastClassId;
		return Class;
	};

	GameEngine.normalizeVendorAttribute(window, 'requestAnimationFrame');
	if (window.requestAnimationFrame) {
		var next = 1,
			anims = {};
		window.GameEngine.setAnimation = function(callback, element) {
			var current = next++;
			anims[current] = true;
			var animate = function() {
				if (!anims[current]) {
					return;
				}
				window.requestAnimationFrame(animate, element);
				callback();
			};
			window.requestAnimationFrame(animate, element);
			return current;
		};
		window.GameEngine.clearAnimation = function(id) {
			delete anims[id];
		};
	} else {
		window.GameEngine.setAnimation = function(callback, element) {
			return window.setInterval(callback, 1000 / 60);
		};
		window.GameEngine.clearAnimation = function(id) {
			window.clearInterval(id);
		};
	}

	global.define = define;
	global.require = require;
	global.use = use;

	global.GameEngine.EventBase = EventBase;
	global.GameEngine.merge(GameEngine, EventBase);
	domReady();
}(this));