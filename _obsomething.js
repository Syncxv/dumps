/**
 * @name BDFDB
 * @authorId 278543574059057154
 * @invite Jx3TjNS
 * @donate https://www.paypal.me/MircoWittrien
 * @patreon https://www.patreon.com/MircoWittrien
 * @website https://github.com/mwittrien/BetterDiscordAddons/tree/master/Library
 * @source https://raw.githubusercontent.com/mwittrien/BetterDiscordAddons/master/Library/0BDFDB.plugin.js
 * @updateUrl https://raw.githubusercontent.com/mwittrien/BetterDiscordAddons/master/Library/0BDFDB.plugin.js
 */

var testing = (_ => {
	const isBeta = !(window.BdApi && !Array.isArray(BdApi.settings));
	
	const config = {
		"info": {
			"name": "BDFDB",
			"author": "DevilBro",
			"version": "1.3.5",
			"description": "Give other plugins utility functions"
		},
		"rawUrl": "https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js",
		"changeLog": {
			"improved": {
				"Canary Changes": "Preparing Plugins for the changes that are already done on Discord Canary"
			}
		}
	};
	
	const DiscordObjects = {};
	const LibraryRequires = {};
	const LibraryModules = {};
	const InternalComponents = {NativeSubComponents: {}, LibraryComponents: {}};
	const Cache = {data: {}, modules: {}};
	
	var libraryInstance;
	var settings = {}, choices = {}, changeLogs = {};
	
	if (window.BDFDB_Global && window.BDFDB_Global.PluginUtils && typeof window.BDFDB_Global.PluginUtils.cleanUp == "function") {
		window.BDFDB_Global.PluginUtils.cleanUp(window.BDFDB_Global);
	}
	
	const BDFDB = {
		started: true
	};
	for (let key in config) key == "info" ? Object.assign(BDFDB, config[key]) : (BDFDB[key] = config[key]);
	
	const InternalBDFDB = Object.assign({}, BDFDB, {
		patchPriority: 0,
		defaults: {
			settings: {
				showToasts:				{value: true,		disableIfNative: true,		noteIfNative: true},
				showSupportBadges:		{value: true,		disableIfNative: false,		noteIfNative: true},
				useChromium:			{value: false,		disableIfNative: false,		noteIfNative: true}
			},
			choices: {
				toastPosition:			{value: "right",	items: "ToastPositions"}
			}
		},
	});
	
	const LibraryConstants = {
		ToastIcons: {
			info: "INFO",
			danger: "CLOSE_CIRCLE",
			success: "CHECKMARK_CIRCLE",
			warning: "WARNING"
		},
		ToastPositions: {
			center: "toastscenter",
			left: "toastsleft",
			right: "toastsright"
		}
	}
	
	const PluginStores = {
		loaded: {},
		delayedLoad: [],
		delayedStart: [],
		updateTimeout: [],
		patchQueues: {}
	};
	const Plugin = function(config) {
		return class Plugin {
			getName () {return config.info.name;}
			getAuthor () {return config.info.author;}
			getVersion () {return config.info.version;}
			getDescription () {return config.info.description;}
			load () {
				this.loaded = true;
				if (window.BDFDB_Global.loading) {
					if (!PluginStores.delayedLoad.includes(this)) PluginStores.delayedLoad.push(this);
				}
				else {
					Object.assign(this, config.info, BDFDB.ObjectUtils.exclude(config, "info"));
					BDFDB.TimeUtils.suppress(_ => {
						PluginStores.loaded[config.info.name] = this;
						BDFDB.PluginUtils.load(this);
						if (typeof this.onLoad == "function") this.onLoad();
					}, "Failed to load plugin!", config.info.name)();
				}
			}
			start () {
				if (!this.loaded) this.load();
				if (window.BDFDB_Global.loading) {
					if (!PluginStores.delayedStart.includes(this)) PluginStores.delayedStart.push(this);
				}
				else {
					if (this.started) return;
					this.started = true;
					BDFDB.TimeUtils.suppress(_ => {
						BDFDB.PluginUtils.init(this);
						if (typeof this.onStart == "function") this.onStart();
					}, "Failed to start plugin!", config.info.name)();
					delete this.stopping;
				}
			}
			stop () {
				if (this.stopping) return;
				this.stopping = true;
				BDFDB.TimeUtils.timeout(_ => {delete this.stopping;});
				
				BDFDB.TimeUtils.suppress(_ => {
					if (typeof this.onStop == "function") this.onStop();
					BDFDB.PluginUtils.clear(this);
				}, "Failed to stop plugin!", config.info.name)();

				delete this.started;
			}
		};
	};

	BDFDB.LogUtils = {};
	BDFDB.LogUtils.log = function (string, name) {
		console.log(`%c[${typeof name == "string" && name || "BDFDB"}]`, "color: #3a71c1; font-weight: 700;", (typeof string == "string" && string || "").trim());
	};
	BDFDB.LogUtils.warn = function (string, name) {
		console.warn(`%c[${typeof name == "string" && name || "BDFDB"}]`, "color: #3a71c1; font-weight: 700;", (typeof string == "string" && string || "").trim());
	};
	BDFDB.LogUtils.error = function (string, name) {
		console.error(`%c[${typeof name == "string" && name || "BDFDB"}]`, "color: #3a71c1; font-weight: 700;", "Fatal Error: " + (typeof string == "string" && string || "").trim());
	};

	BDFDB.TimeUtils = {};
	BDFDB.TimeUtils.interval = function (callback, delay, ...args) {
		if (typeof callback != "function" || typeof delay != "number" || delay < 1) return;
		else {
			let count = 0, interval = setInterval(_ => {BDFDB.TimeUtils.suppress(callback, "Interval")(...[interval, count++, args].flat());}, delay);
			return interval;
		}
	};
	BDFDB.TimeUtils.timeout = function (callback, delay, ...args) {
		delay = parseFloat(delay);
		if (typeof callback != "function") return;
		else if (isNaN(delay) || typeof delay != "number" || delay < 1) {
			let immediate = setImmediate(_ => {BDFDB.TimeUtils.suppress(callback, "Immediate")(...[immediate, args].flat());});
			return immediate;
		}
		else {
			let timeout = setTimeout(_ => {BDFDB.TimeUtils.suppress(callback, "Timeout")(...[timeout, args].flat());}, delay);
			return timeout;
		}
	};
	BDFDB.TimeUtils.clear = function (...timeObjects) {
		for (let t of timeObjects.flat(10).filter(n => n)) {
			if (typeof t == "number") {
				clearInterval(t);
				clearTimeout(t);
			}
			else if (typeof t == "object") clearImmediate(t);
		}
	};
	BDFDB.TimeUtils.suppress = function (callback, string, name) {return function (...args) {
		try {return callback(...args);}
		catch (err) {BDFDB.LogUtils.error((typeof string == "string" && string || "") + " " + err, name);}
	}};

	BDFDB.LogUtils.log("Loading library.");

	BDFDB.sameProto = function (a, b) {
		if (a != null && typeof a == "object") return a.constructor && a.constructor.prototype && typeof a.constructor.prototype.isPrototypeOf == "function" && a.constructor.prototype.isPrototypeOf(b);
		else return typeof a == typeof b;
	};
	BDFDB.equals = function (mainA, mainB, sorted) {
		let i = -1;
		if (sorted === undefined || typeof sorted !== "boolean") sorted = false;
		return equal(mainA, mainB);
		function equal(a, b) {
			i++;
			let result = true;
			if (i > 1000) result = null;
			else {
				if (typeof a !== typeof b) result = false;
				else if (typeof a === "function") result = a.toString() == b.toString();
				else if (typeof a === "undefined") result = true;
				else if (typeof a === "symbol") result = true;
				else if (typeof a === "boolean") result = a == b;
				else if (typeof a === "string") result = a == b;
				else if (typeof a === "number") {
					if (isNaN(a) || isNaN(b)) result = isNaN(a) == isNaN(b);
					else result = a == b;
				}
				else if (!a && !b) result = true;
				else if (!a || !b) result = false;
				else if (typeof a === "object") {
					let keysA = Object.getOwnPropertyNames(a);
					let keysB = Object.getOwnPropertyNames(b);
					if (keysA.length !== keysB.length) result = false;
					else for (let j = 0; result === true && j < keysA.length; j++) {
						if (sorted) result = equal(a[keysA[j]], b[keysB[j]]);
						else result = equal(a[keysA[j]], b[keysA[j]]);
					}
				}
			}
			i--;
			return result;
		}
	};

	BDFDB.ObjectUtils = {};
	BDFDB.ObjectUtils.is = function (obj) {
		return obj && !Array.isArray(obj) && !Set.prototype.isPrototypeOf(obj) && (typeof obj == "function" || typeof obj == "object");
	};
	BDFDB.ObjectUtils.get = function (nodeOrObj, valuePath) {
		if (!nodeOrObj || !valuePath) return null;
		let obj = Node.prototype.isPrototypeOf(nodeOrObj) ? BDFDB.ReactUtils.getInstance(nodeOrObj) : nodeOrObj;
		if (!BDFDB.ObjectUtils.is(obj)) return null;
		let found = obj, values = valuePath.split(".").filter(n => n);
		for (value of values) {
			if (!found) return null;
			found = found[value];
		}
		return found;
	};
	BDFDB.ObjectUtils.extract = function (obj, ...keys) {
		let newObj = {};
		if (BDFDB.ObjectUtils.is(obj)) for (let key of keys.flat(10).filter(n => n)) if (obj[key]) newObj[key] = obj[key];
		return newObj;
	};
	BDFDB.ObjectUtils.exclude = function (obj, ...keys) {
		let newObj = Object.assign({}, obj);
		BDFDB.ObjectUtils.delete(newObj, ...keys)
		return newObj;
	};
	BDFDB.ObjectUtils.delete = function (obj, ...keys) {
		if (BDFDB.ObjectUtils.is(obj)) for (let key of keys.flat(10).filter(n => n)) delete obj[key];
	};
	BDFDB.ObjectUtils.sort = function (obj, sort, except) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		let newObj = {};
		if (sort === undefined || !sort) for (let key of Object.keys(obj).sort()) newObj[key] = obj[key];
		else {
			let values = [];
			for (let key in obj) values.push(obj[key]);
			values = BDFDB.ArrayUtils.keySort(values, sort, except);
			for (let value of values) for (let key in obj) if (BDFDB.equals(value, obj[key])) {
				newObj[key] = value;
				break;
			}
		}
		return newObj;
	};
	BDFDB.ObjectUtils.reverse = function (obj, sort) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		let newObj = {};
		for (let key of (sort === undefined || !sort) ? Object.keys(obj).reverse() : Object.keys(obj).sort().reverse()) newObj[key] = obj[key];
		return newObj;
	};
	BDFDB.ObjectUtils.filter = function (obj, filter, byKey = false) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		if (typeof filter != "function") return obj;
		return Object.keys(obj).filter(key => filter(byKey ? key : obj[key])).reduce((newObj, key) => (newObj[key] = obj[key], newObj), {});
	};
	BDFDB.ObjectUtils.push = function (obj, value) {
		if (BDFDB.ObjectUtils.is(obj)) obj[Object.keys(obj).length] = value;
	};
	BDFDB.ObjectUtils.pop = function (obj, value) {
		if (BDFDB.ObjectUtils.is(obj)) {
			let keys = Object.keys(obj);
			if (!keys.length) return;
			let value = obj[keys[keys.length-1]];
			delete obj[keys[keys.length-1]];
			return value;
		}
	};
	BDFDB.ObjectUtils.map = function (obj, mapFunc) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		if (typeof mapFunc != "string" && typeof mapFunc != "function") return obj;
		let newObj = {};
		for (let key in obj) if (BDFDB.ObjectUtils.is(obj[key])) newObj[key] = typeof mapFunc == "string" ? obj[key][mapFunc] : mapFunc(obj[key], key);
		return newObj;
	};
	BDFDB.ObjectUtils.toArray = function (obj) {
		if (!BDFDB.ObjectUtils.is(obj)) return [];
		return Object.entries(obj).map(n => n[1]);
	};
	BDFDB.ObjectUtils.deepAssign = function (obj, ...objs) {
		if (!objs.length) return obj;
		let nextObj = objs.shift();
		if (BDFDB.ObjectUtils.is(obj) && BDFDB.ObjectUtils.is(nextObj)) {
			for (let key in nextObj) {
				if (BDFDB.ObjectUtils.is(nextObj[key])) {
					if (!obj[key]) Object.assign(obj, {[key]:{}});
					BDFDB.ObjectUtils.deepAssign(obj[key], nextObj[key]);
				}
				else Object.assign(obj, {[key]:nextObj[key]});
			}
		}
		return BDFDB.ObjectUtils.deepAssign(obj, ...objs);
	};
	BDFDB.ObjectUtils.isEmpty = function (obj) {
		return !BDFDB.ObjectUtils.is(obj) || Object.getOwnPropertyNames(obj).length == 0;
	};
	BDFDB.ObjectUtils.mirror = function (obj) {
		if (!BDFDB.ObjectUtils.is(obj)) return {};
		let newObj = Object.assign({}, obj);
		for (let key in newObj) if (newObj[newObj[key]] == undefined && (typeof key == "number" || typeof key == "string")) newObj[newObj[key]] = key;
		return newObj;
	};

	BDFDB.ArrayUtils = {};
	BDFDB.ArrayUtils.is = function (array) {
		return array && Array.isArray(array);
	};
	BDFDB.ArrayUtils.sum = function (array) {
		return Array.isArray(array) ? array.reduce((total, num) => total + Math.round(num), 0) : 0;
	};
	BDFDB.ArrayUtils.keySort = function (array, key, except) {
		if (!BDFDB.ArrayUtils.is(array)) return [];
		if (key == null) return array;
		if (except === undefined) except = null;
		return array.sort((x, y) => {
			let xValue = x[key], yValue = y[key];
			if (xValue !== except) return xValue < yValue ? -1 : xValue > yValue ? 1 : 0;
		});
	};
	BDFDB.ArrayUtils.numSort = function (array) {
		return array.sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
	};
	BDFDB.ArrayUtils.includes = function (array, ...values) {
		if (!BDFDB.ArrayUtils.is(array)) return null;
		if (!array.length) return false;
		let all = values.pop();
		if (typeof all != "boolean") {
			values.push(all);
			all = true;
		}
		if (!values.length) return false;
		let contained = undefined;
		for (let v of values) {
			if (contained === undefined) contained = all;
			if (all && !array.includes(v)) contained = false;
			if (!all && array.includes(v)) contained = true;
		}
		return contained;
	};
	BDFDB.ArrayUtils.remove = function (array, value, all = false) {
		if (!BDFDB.ArrayUtils.is(array)) return [];
		if (!array.includes(value)) return array;
		if (!all) array.splice(array.indexOf(value), 1);
		else while (array.indexOf(value) > -1) array.splice(array.indexOf(value), 1);
		return array;
	};
	BDFDB.ArrayUtils.getAllIndexes = function (array, value) {
		if (!BDFDB.ArrayUtils.is(array) && typeof array != "string") return [];
		var indexes = [], index = -1;
		while ((index = array.indexOf(value, index + 1)) !== -1) indexes.push(index);
		return indexes;
	};
	BDFDB.ArrayUtils.removeCopies = function (array) {
		if (!BDFDB.ArrayUtils.is(array)) return [];
		return [...new Set(array)];
	};

	BDFDB.BDUtils = {};
	BDFDB.BDUtils.getPluginsFolder = function () {
		if (window.BdApi && BdApi.Plugins.folder && typeof BdApi.Plugins.folder == "string") return BdApi.Plugins.folder;
		else if (LibraryRequires.process.env.injDir) return LibraryRequires.path.resolve(LibraryRequires.process.env.injDir, "plugins/");
		else switch (LibraryRequires.process.platform) {
			case "win32":
				return LibraryRequires.path.resolve(LibraryRequires.process.env.appdata, "BetterDiscord/plugins/");
			case "darwin":
				return LibraryRequires.path.resolve(LibraryRequires.process.env.HOME, "Library/Preferences/BetterDiscord/plugins/");
			default:
				if (LibraryRequires.process.env.XDG_CONFIG_HOME) return LibraryRequires.path.resolve(LibraryRequires.process.env.XDG_CONFIG_HOME, "BetterDiscord/plugins/");
				else return LibraryRequires.path.resolve(LibraryRequires.process.env.HOME, ".config/BetterDiscord/plugins/");
			}
	};
	BDFDB.BDUtils.getThemesFolder = function () {
		if (window.BdApi && BdApi.Themes.folder && typeof BdApi.Themes.folder == "string") return BdApi.Themes.folder;
		else if (LibraryRequires.process.env.injDir) return LibraryRequires.path.resolve(LibraryRequires.process.env.injDir, "plugins/");
		else switch (LibraryRequires.process.platform) {
			case "win32": 
				return LibraryRequires.path.resolve(LibraryRequires.process.env.appdata, "BetterDiscord/themes/");
			case "darwin": 
				return LibraryRequires.path.resolve(LibraryRequires.process.env.HOME, "Library/Preferences/BetterDiscord/themes/");
			default:
				if (LibraryRequires.process.env.XDG_CONFIG_HOME) return LibraryRequires.path.resolve(LibraryRequires.process.env.XDG_CONFIG_HOME, "BetterDiscord/themes/");
				else return LibraryRequires.path.resolve(LibraryRequires.process.env.HOME, ".config/BetterDiscord/themes/");
			}
	};
	BDFDB.BDUtils.isPluginEnabled = function (pluginName) {
		if (!window.BdApi) return null;
		else if (BdApi.Plugins && typeof BdApi.Plugins.isEnabled == "function") return BdApi.Plugins.isEnabled(pluginName);
		else if (typeof BdApi.isPluginEnabled == "function") return BdApi.isPluginEnabled(pluginName);
	};
	BDFDB.BDUtils.reloadPlugin = function (pluginName) {
		if (!window.BdApi) return;
		else if (BdApi.Plugins && typeof BdApi.Plugins.reload == "function") BdApi.Plugins.reload(pluginName);
		else if (window.pluginModule) window.pluginModule.reloadPlugin(pluginName);
	};
	BDFDB.BDUtils.enablePlugin = function (pluginName) {
		if (!window.BdApi) return;
		else if (BdApi.Plugins && typeof BdApi.Plugins.enable == "function") BdApi.Plugins.enable(pluginName);
		else if (window.pluginModule) window.pluginModule.startPlugin(pluginName);
	};
	BDFDB.BDUtils.disablePlugin = function (pluginName) {
		if (!window.BdApi) return;
		else if (BdApi.Plugins && typeof BdApi.Plugins.disable == "function") BdApi.Plugins.disable(pluginName);
		else if (window.pluginModule) window.pluginModule.stopPlugin(pluginName);
	};
	BDFDB.BDUtils.getPlugin = function (pluginName, hasToBeEnabled = false, overHead = false) {
		if (window.BdApi && !hasToBeEnabled || BDFDB.BDUtils.isPluginEnabled(pluginName)) {	
			if (BdApi.Plugins.get && typeof BdApi.Plugins.get == "function") {
				let plugin = BdApi.Plugins.get(pluginName);
				if (overHead) return plugin ? {filename: LibraryRequires.fs.existsSync(LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), `${pluginName}.plugin.js`)) ? `${pluginName}.plugin.js` : null, id: pluginName, name: pluginName, plugin: plugin} : null;
				else return plugin;
			}
			else if (window.bdplugins) overHead ? window.bdplugins[pluginName] : (window.bdplugins[pluginName] || {}).plugin;
		}
		return null;
	};
	BDFDB.BDUtils.isThemeEnabled = function (themeName) {
		if (!window.BdApi) return null;
		else if (BdApi.Themes && typeof BdApi.Themes.isEnabled == "function") return BdApi.Themes.isEnabled(themeName);
		else if (typeof BdApi.isThemeEnabled == "function") return BdApi.isThemeEnabled(themeName);
	};
	BDFDB.BDUtils.enableTheme = function (themeName) {
		if (!window.BdApi) return;
		else if (BdApi.Themes && typeof BdApi.Themes.enable == "function") BdApi.Themes.enable(themeName);
		else if (window.themeModule) window.themeModule.enableTheme(themeName);
	};
	BDFDB.BDUtils.disableTheme = function (themeName) {
		if (!window.BdApi) return;
		else if (BdApi.Themes && typeof BdApi.Themes.disable == "function") BdApi.Themes.disable(themeName);
		else if (window.themeModule) window.themeModule.disableTheme(themeName);
	};
	BDFDB.BDUtils.getTheme = function (themeName, hasToBeEnabled = false) {
		if (window.BdApi && !hasToBeEnabled || BDFDB.BDUtils.isThemeEnabled(themeName)) {
			if (BdApi.Themes && typeof BdApi.Themes.get == "function") return BdApi.Themes.get(themeName);
			else if (window.bdthemes) window.bdthemes[themeName];
		}
		return null;
	};
	BDFDB.BDUtils.settingsIds = !isBeta ? {
		automaticLoading: "fork-ps-5",
		coloredText: "bda-gs-7",
		normalizedClasses: "fork-ps-4",
		showToasts: "fork-ps-2"
	} : {
		automaticLoading: "settings.addons.autoReload",
		coloredText: "settings.appearance.coloredText",
		normalizedClasses: "settings.general.classNormalizer",
		showToasts: "settings.general.showToasts"
	};
	BDFDB.BDUtils.toggleSettings = function (key, state) {
		if (window.BdApi && typeof key == "string") {
			let path = key.split(".");
			let currentState = BDFDB.BDUtils.getSettings(key);
			if (state === true) {
				if (currentState === false) BdApi.enableSetting(...path);
			}
			else if (state === false) {
				if (currentState === true) BdApi.disableSetting(...path);
			}
			else if (currentState === true || currentState === false) BDFDB.BDUtils.toggleSettings(key, !currentState);
		}
	};
	BDFDB.BDUtils.getSettings = function (key) {
		if (!window.BdApi) return {};
		if (typeof key == "string") return BdApi.isSettingEnabled(...key.split("."));
		else return !isBeta && typeof BdApi.getBDData == "function" ? BDFDB.ObjectUtils.get(BdApi.getBDData("settings"), `${BDFDB.DiscordUtils.getBuilt()}.settings`) : (BDFDB.ArrayUtils.is(BdApi.settings) ? BdApi.settings.map(n => n.settings.map(m => m.settings.map(l => ({id: [n.id, m.id, l.id].join("."), value: l.value})))).flat(10).reduce((newObj, setting) => (newObj[setting.id] = setting.value, newObj), {}) : {});
	};
	BDFDB.BDUtils.getSettingsProperty = function (property, key) {
		if (!window.BdApi || !isBeta) return key ? "" : {};
		else {
			let settingsMap = BdApi.settings.map(n => n.settings.map(m => m.settings.map(l => ({id: [n.id, m.id, l.id].join("."), value: l[property]})))).flat(10).reduce((newObj, setting) => (newObj[setting.id] = setting.value, newObj), {});
			return key ? (settingsMap[key] != null ? settingsMap[key] : "") : "";
		}
	};
	
	
	BDFDB.PluginUtils = {};
	BDFDB.PluginUtils.buildPlugin = function (config) {
		return [Plugin(config), BDFDB];
	};
	BDFDB.PluginUtils.load = function (plugin) {
		if (!PluginStores.updateTimeout.includes(plugin.name)) {
			PluginStores.updateTimeout.push(plugin.name);
			let url = plugin.rawUrl ||`https://mwittrien.github.io/BetterDiscordAddons/Plugins/${plugin.name}/${plugin.name}.plugin.js`;

			if (!BDFDB.ObjectUtils.is(window.PluginUpdates) || !BDFDB.ObjectUtils.is(window.PluginUpdates.plugins)) window.PluginUpdates = {plugins: {}};
			window.PluginUpdates.plugins[url] = {name: plugin.name, raw: url, version: plugin.version};
			
			BDFDB.PluginUtils.checkUpdate(plugin.name, url);
			
			if (window.PluginUpdates.interval === undefined) window.PluginUpdates.interval = BDFDB.TimeUtils.interval(_ => {
				BDFDB.PluginUtils.checkAllUpdates();
			}, 1000*60*60*2);
			
			BDFDB.TimeUtils.timeout(_ => {BDFDB.ArrayUtils.remove(PluginStores.updateTimeout, plugin.name, true);}, 30000);
		}
	};
	BDFDB.PluginUtils.init = function (plugin) {
		BDFDB.PluginUtils.load(plugin);
		
		let startMsg = BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_started", "v" + plugin.version);
		BDFDB.LogUtils.log(startMsg, plugin.name);
		if (settings.showToasts && !BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.showToasts)) BDFDB.NotificationUtils.toast(`${plugin.name} ${startMsg}`, {
			disableInteractions: true,
			barColor: BDFDB.DiscordConstants.Colors.STATUS_GREEN
		});
		
		if (plugin.css) BDFDB.DOMUtils.appendLocalStyle(plugin.name, plugin.css);
		
		InternalBDFDB.patchPlugin(plugin);
		InternalBDFDB.addSpecialListeners(plugin);

		BDFDB.PluginUtils.translate(plugin);

		BDFDB.PluginUtils.checkChangeLog(plugin);
	};
	BDFDB.PluginUtils.clear = function (plugin) {
		let stopMsg = BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_stopped", "v" + plugin.version);
		BDFDB.LogUtils.log(stopMsg, plugin.name);
		if (settings.showToasts && !BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.showToasts)) BDFDB.NotificationUtils.toast(`${plugin.name} ${stopMsg}`, {
			disableInteractions: true,
			barColor: BDFDB.DiscordConstants.Colors.STATUS_RED
		});

		let url = plugin.rawUrl ||`https://mwittrien.github.io/BetterDiscordAddons/Plugins/${plugin.name}/${plugin.name}.plugin.js`;

		BDFDB.PluginUtils.cleanUp(plugin);
		
		for (let type in PluginStores.patchQueues) BDFDB.ArrayUtils.remove(PluginStores.patchQueues[type].query, plugin, true);
		
		for (let modal of document.querySelectorAll(`.${plugin.name}-modal, .${plugin.name.toLowerCase()}-modal, .${plugin.name}-settingsmodal, .${plugin.name.toLowerCase()}-settingsmodal`)) {
			let closeButton = modal.querySelector(BDFDB.dotCN.modalclose);
			if (closeButton) closeButton.click();
		}
		
		delete Cache.data[plugin.name]
		if (BDFDB.ObjectUtils.is(window.PluginUpdates) && BDFDB.ObjectUtils.is(window.PluginUpdates.plugins)) delete window.PluginUpdates.plugins[url];
	};
	BDFDB.PluginUtils.translate = function (plugin) {
		plugin.labels = {};
		if (typeof plugin.setLabelsByLanguage === "function" || typeof plugin.changeLanguageStrings === "function") {
			if (LibraryModules.LanguageStore.chosenLocale) translate();
			else BDFDB.TimeUtils.interval(interval => {
				if (LibraryModules.LanguageStore.chosenLocale) {
					BDFDB.TimeUtils.clear(interval);
					translate();
				}
			}, 100);
			function translate() {
				let language = BDFDB.LanguageUtils.getLanguage();
				if (typeof plugin.setLabelsByLanguage === "function") plugin.labels = plugin.setLabelsByLanguage(language.id);
				if (typeof plugin.changeLanguageStrings === "function") plugin.changeLanguageStrings();
				BDFDB.LogUtils.log(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_translated", language.ownlang), plugin.name);
			}
		}
	};
	BDFDB.PluginUtils.cleanUp = function (plugin) {
		BDFDB.TimeUtils.suppress(_ => {
			if (!BDFDB.ObjectUtils.is(plugin)) return;
			if (plugin == window.BDFDB_Global) {
				delete window.BDFDB_Global.loaded;
				BDFDB.TimeUtils.interval((interval, count) => {
					if (count > 60 || window.BDFDB_Global.loaded) BDFDB.TimeUtils.clear(interval);
					if (window.BDFDB_Global.loaded) for (let pluginName in BDFDB.ObjectUtils.sort(PluginStores.loaded)) BDFDB.TimeUtils.timeout(_ => {
						if (PluginStores.loaded[pluginName].started) BDFDB.BDUtils.reloadPlugin(pluginName);
					});
				}, 1000);
			}
			if (BDFDB.DOMUtils) BDFDB.DOMUtils.removeLocalStyle(plugin.name);
			if (BDFDB.ListenerUtils) BDFDB.ListenerUtils.remove(plugin);
			if (BDFDB.StoreChangeUtils) BDFDB.StoreChangeUtils.remove(plugin);
			if (BDFDB.ObserverUtils) BDFDB.ObserverUtils.disconnect(plugin);
			if (BDFDB.PatchUtils) BDFDB.PatchUtils.unpatch(plugin);
			if (BDFDB.WindowUtils) {
				BDFDB.WindowUtils.closeAll(plugin);
				BDFDB.WindowUtils.removeListener(plugin);
			}
		}, "Failed to clean up plugin!", plugin.name)();
	};
	BDFDB.PluginUtils.checkUpdate = function (pluginName, url) {
// 		if (pluginName && url && window.PluginUpdates.plugins[url]) return new Promise(callback => {
// // 			LibraryRequires.request(url, (error, response, body) => {
// // 				if (error || !window.PluginUpdates.plugins[url]) return callback(null);
// // 				let newName = (body.match(/"name"\s*:\s*"([^"]+)"/) || [])[1] || pluginName;
// // 				let newVersion = (body.match(/['"][0-9]+\.[0-9]+\.[0-9]+['"]/i) || "").toString().replace(/['"]/g, "");
// // 				if (!newVersion) return callback(null);
// // 				if (pluginName == newName && BDFDB.NumberUtils.getVersionDifference(newVersion[0], window.PluginUpdates.plugins[url].version) > 0.2) {
// // 					BDFDB.NotificationUtils.toast(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_force_updated", pluginName), {
// // 						type: "warning",
// // 						disableInteractions: true
// // 					});
// // 					BDFDB.PluginUtils.downloadUpdate(pluginName, url);
// // 					return callback(2);
// // 				}
// // 				else if (BDFDB.NumberUtils.compareVersions(newVersion[0], window.PluginUpdates.plugins[url].version)) {
// // 					window.PluginUpdates.plugins[url].outdated = true;
// // 					BDFDB.PluginUtils.showUpdateNotice(pluginName, url);
// // 					return callback(1);
// // 				}
// // 				else {
// // 					BDFDB.PluginUtils.removeUpdateNotice(pluginName);
// // 					return callback(0);
// // 				}
// // 			});
// 		});
// 		return new Promise(callback => {callback(null);});
        console.log('no updates in browser')
	};
	BDFDB.PluginUtils.checkAllUpdates = function () {
		return new Promise(callback => {
			let finished = 0, amount = 0;
			for (let url in window.PluginUpdates.plugins) {
				let plugin = window.PluginUpdates.plugins[url];
				if (plugin) BDFDB.PluginUtils.checkUpdate(plugin.name, plugin.raw).then(state => {
					finished++;
					if (state == 1) amount++;
					if (finished >= Object.keys(window.PluginUpdates.plugins).length) callback(amount);
				});
			}
		});
	};
	BDFDB.PluginUtils.showUpdateNotice = function (pluginName, url) {
		if (!pluginName || !url) return;
		let updateNotice = document.querySelector("#pluginNotice");
		if (!updateNotice) {
			let vanishObserver = new MutationObserver(changes => {
				if (!document.contains(updateNotice)) {
					if (updateNotice.querySelector("#outdatedPlugins span")) {
						let layers = document.querySelector(BDFDB.dotCN.layers) || document.querySelector(BDFDB.dotCN.appmount);
						if (layers) layers.parentElement.insertBefore(updateNotice, layers);
					}
					else vanishObserver.disconnect();
				}
				else if (document.contains(updateNotice) && !updateNotice.querySelector("#outdatedPlugins span," + BDFDB.dotCN.noticebutton)) vanishObserver.disconnect();
			});
			vanishObserver.observe(document.body, {childList: true, subtree: true});
			updateNotice = BDFDB.NotificationUtils.notice(`${BDFDB.LanguageUtils.LibraryStrings.update_notice_update}&nbsp;&nbsp;&nbsp;&nbsp;<strong id="outdatedPlugins"></strong>`, {
				id: "pluginNotice",
				type: "info",
				textClassName: BDFDB.disCN.noticeupdatetext,
				html: true,
				btn: !BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.automaticLoading) ? BDFDB.LanguageUtils.LanguageStrings.ERRORS_RELOAD : "",
				forceStyle: true,
				customIcon: `<svg height="100%" style="fill-rule: evenodd;clip-rule: evenodd;stroke-linecap: round;stroke-linejoin: round;" xmlns: xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" xml: space="preserve" width="100%" version="1.1" viewBox="0 0 2000 2000"><metadata /><defs><filter id="shadow1"><feDropShadow dx="20" dy="0" stdDeviation="20" flood-color="rgba(0,0,0,0.35)"/></filter><filter id="shadow2"><feDropShadow dx="15" dy="0" stdDeviation="20" flood-color="rgba(255,255,255,0.15)"/></filter><filter id="shadow3"><feDropShadow dx="10" dy="0" stdDeviation="20" flood-color="rgba(0,0,0,0.35)"/></filter></defs><g><path fill="#171717" filter="url(#shadow3)" d="M 1195.44+135.442 L 1195.44+135.442 L 997.6+136.442 C 1024.2+149.742+1170.34+163.542+1193.64+179.742 C 1264.34+228.842+1319.74+291.242+1358.24+365.042 C 1398.14+441.642+1419.74+530.642+1422.54+629.642 L 1422.54+630.842 L 1422.54+632.042 C 1422.54+773.142+1422.54+1228.14+1422.54+1369.14 L 1422.54+1370.34 L 1422.54+1371.54 C 1419.84+1470.54+1398.24+1559.54+1358.24+1636.14 C 1319.74+1709.94+1264.44+1772.34+1193.64+1821.44 C 1171.04+1837.14+1025.7+1850.54+1000+1863.54 L 1193.54+1864.54 C 1539.74+1866.44+1864.54+1693.34+1864.54+1296.64 L 1864.54+716.942 C 1866.44+312.442+1541.64+135.442+1195.44+135.442 Z"/><path fill="#3E82E5" filter="url(#shadow2)" d="M 1695.54+631.442 C 1685.84+278.042+1409.34+135.442+1052.94+135.442 L 361.74+136.442 L 803.74+490.442 L 1060.74+490.442 C 1335.24+490.442+1335.24+835.342+1060.74+835.342 L 1060.74+1164.84 C 1150.22+1164.84+1210.53+1201.48+1241.68+1250.87 C 1306.07+1353+1245.76+1509.64+1060.74+1509.64 L 361.74+1863.54 L 1052.94+1864.54 C 1409.24+1864.54+1685.74+1721.94+1695.54+1368.54 C 1695.54+1205.94+1651.04+1084.44+1572.64+999.942 C 1651.04+915.542+1695.54+794.042+1695.54+631.442 Z"/><path fill="#FFFFFF" filter="url(#shadow1)" d="M 1469.25+631.442 C 1459.55+278.042+1183.05+135.442+826.65+135.442 L 135.45+135.442 L 135.45+1004 C 135.45+1004+135.427+1255.21+355.626+1255.21 C 575.825+1255.21+575.848+1004+575.848+1004 L 577.45+490.442 L 834.45+490.442 C 1108.95+490.442+1108.95+835.342+834.45+835.342 L 664.65+835.342 L 664.65+1164.84 L 834.45+1164.84 C 923.932+1164.84+984.244+1201.48+1015.39+1250.87 C 1079.78+1353+1019.47+1509.64+834.45+1509.64 L 135.45+1509.64 L 135.45+1864.54 L 826.65+1864.54 C 1182.95+1864.54+1459.45+1721.94+1469.25+1368.54 C 1469.25+1205.94+1424.75+1084.44+1346.35+999.942 C 1424.75+915.542+1469.25+794.042+1469.25+631.442 Z"/></g></svg>`,
				onClose: _ => {vanishObserver.disconnect();}
			});
			updateNotice.style.setProperty("z-index", "100000", "important");
			updateNotice.style.setProperty("display", "block", "important");
			updateNotice.style.setProperty("position", "relative", "important");
			updateNotice.style.setProperty("visibility", "visible", "important");
			updateNotice.style.setProperty("opacity", "1", "important");
			let reloadButton = updateNotice.querySelector(BDFDB.dotCN.noticebutton);
			if (reloadButton) {
				BDFDB.DOMUtils.toggle(reloadButton, true);
				reloadButton.addEventListener("click", _ => {
					LibraryRequires.electron && LibraryRequires.electron.remote && LibraryRequires.electron.remote.getCurrentWindow().reload();
				});
				reloadButton.addEventListener("mouseenter", _ => {
					if (window.PluginUpdates.downloaded) BDFDB.TooltipUtils.create(reloadButton, window.PluginUpdates.downloaded.join(", "), {
						type: "bottom",
						className: "update-notice-tooltip",
						style: "max-width: 420px"
					});
				});
			}
		}
		if (updateNotice) {
			let updateNoticeList = updateNotice.querySelector("#outdatedPlugins");
			if (updateNoticeList && !updateNoticeList.querySelector(`#${pluginName}-notice`)) {
				if (updateNoticeList.querySelector("span")) updateNoticeList.appendChild(BDFDB.DOMUtils.create(`<span class="separator">, </span>`));
				let updateEntry = BDFDB.DOMUtils.create(`<span id="${pluginName}-notice">${pluginName}</span>`);
				updateEntry.addEventListener("click", _ => {
					if (!updateEntry.wasClicked) {
						updateEntry.wasClicked = true;
						BDFDB.PluginUtils.downloadUpdate(pluginName, url);
					}
				});
				updateNoticeList.appendChild(updateEntry);
				if (!updateNoticeList.hasTooltip) {
					updateNoticeList.hasTooltip = true;
					updateNotice.tooltip = BDFDB.TooltipUtils.create(updateNoticeList, BDFDB.LanguageUtils.LibraryStrings.update_notice_click, {
						type: "bottom",
						zIndex: 100001,
						delay: 500,
						onHide: _ => {updateNoticeList.hasTooltip = false;}
					});
				}
			}
		}
	};
	BDFDB.PluginUtils.removeUpdateNotice = function (pluginName, updateNotice = document.querySelector("#pluginNotice")) {
		if (!pluginName || !updateNotice) return;
		let updateNoticeList = updateNotice.querySelector("#outdatedPlugins");
		if (updateNoticeList) {
			let noticeEntry = updateNoticeList.querySelector(`#${pluginName}-notice`);
			if (noticeEntry) {
				let nextSibling = noticeEntry.nextSibling;
				let prevSibling = noticeEntry.prevSibling;
				if (nextSibling && BDFDB.DOMUtils.containsClass(nextSibling, "separator")) nextSibling.remove();
				else if (prevSibling && BDFDB.DOMUtils.containsClass(prevSibling, "separator")) prevSibling.remove();
				noticeEntry.remove();
			}
			if (!updateNoticeList.querySelector("span")) {
				let reloadButton = updateNotice.querySelector(BDFDB.dotCN.noticebutton);
				if (reloadButton) {
					updateNotice.querySelector(BDFDB.dotCN.noticeupdatetext).innerText = BDFDB.LanguageUtils.LibraryStrings.update_notice_reload;
					BDFDB.DOMUtils.toggle(reloadButton, false);
				}
				else updateNotice.querySelector(BDFDB.dotCN.noticedismiss).click();
			}
		}
	};
	BDFDB.PluginUtils.downloadUpdate = function (pluginName, url) {
		if (pluginName && url) LibraryRequires.request(url, (error, response, body) => {
			if (error) {
				let updateNotice = document.querySelector("#pluginNotice");
				if (updateNotice) BDFDB.PluginUtils.removeUpdateNotice(pluginName, updateNotice);
				BDFDB.NotificationUtils.toast(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_update_failed", pluginName), {
					type: "danger",
					disableInteractions: true
				});
			}
			else {
				let wasEnabled = BDFDB.BDUtils.isPluginEnabled(pluginName);
				let newName = (body.match(/"name"\s*:\s*"([^"]+)"/) || [])[1] || pluginName;
				let newVersion = body.match(/['"][0-9]+\.[0-9]+\.[0-9]+['"]/i).toString().replace(/['"]/g, "");
				let oldVersion = window.PluginUpdates.plugins[url].version;
				let fileName = pluginName == "BDFDB" ? "0BDFDB" : pluginName;
				let newFileName = newName == "BDFDB" ? "0BDFDB" : newName;
				LibraryRequires.fs.writeFile(LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), newFileName + ".plugin.js"), body, _ => {
					window.PluginUpdates.plugins[url].version = newVersion;
					if (fileName != newFileName) {
						url = url.replace(new RegExp(fileName, "g"), newFileName);
						LibraryRequires.fs.unlink(LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".plugin.js"), _ => {});
						let configPath = LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".config.json");
						LibraryRequires.fs.exists(configPath, exists => {
							if (exists) LibraryRequires.fs.rename(configPath, LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), newFileName + ".config.json"), _ => {});
						});
						BDFDB.TimeUtils.timeout(_ => {if (wasEnabled && !BDFDB.BDUtils.isPluginEnabled(newName)) BDFDB.BDUtils.enablePlugin(newName);}, 3000);
					}
					BDFDB.NotificationUtils.toast(BDFDB.LanguageUtils.LibraryStringsFormat("toast_plugin_updated", pluginName, "v" + oldVersion, newName, "v" + newVersion), {
						disableInteractions: true
					});
					let updateNotice = document.querySelector("#pluginNotice");
					if (updateNotice) {
						if (updateNotice.querySelector(BDFDB.dotCN.noticebutton)) {
							if (!window.PluginUpdates.downloaded) window.PluginUpdates.downloaded = [];
							if (!window.PluginUpdates.downloaded.includes(pluginName)) window.PluginUpdates.downloaded.push(pluginName);
						}
						BDFDB.PluginUtils.removeUpdateNotice(pluginName, updateNotice);
					}
				});
			}
		});
	};
	BDFDB.PluginUtils.checkChangeLog = function (plugin) {
		if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(plugin.changeLog)) return;
		if (!changeLogs[plugin.name] || BDFDB.NumberUtils.compareVersions(plugin.version, changeLogs[plugin.name])) {
			changeLogs[plugin.name] = plugin.version;
			BDFDB.DataUtils.save(changeLogs, BDFDB, "changeLogs");
			BDFDB.PluginUtils.openChangeLog(plugin);
		}
	};
	BDFDB.PluginUtils.openChangeLog = function (plugin) {
		if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(plugin.changeLog)) return;
		let changeLogHTML = "", headers = {
			added: "New Features",
			fixed: "Bug Fixes",
			improved: "Improvements",
			progress: "Progress"
		};
		for (let type in plugin.changeLog) {
			type = type.toLowerCase();
			let className = BDFDB.disCN["changelog" + type];
			if (className) {
				changeLogHTML += `<h1 class="${className} ${BDFDB.disCN.margintop20}"${changeLogHTML.indexOf("<h1") == -1 ? `style="margin-top: 0px !important;"` : ""}>${BDFDB.LanguageUtils && BDFDB.LanguageUtils.LibraryStrings ? BDFDB.LanguageUtils.LibraryStrings["changelog_" + type]  : headers[type]}</h1><ul>`;
				for (let key in plugin.changeLog[type]) changeLogHTML += `<li><strong>${key}</strong>${plugin.changeLog[type][key] ? (": " + plugin.changeLog[type][key] + ".") : ""}</li>`;
				changeLogHTML += `</ul>`
			}
		}
		if (changeLogHTML) BDFDB.ModalUtils.open(plugin, {
			header: `${plugin.name} ${BDFDB.LanguageUtils.LanguageStrings.CHANGE_LOG}`,
			subHeader: `Version ${plugin.version}`,
			className: BDFDB.disCN.modalchangelogmodal,
			contentClassName: BDFDB.disCNS.changelogcontainer + BDFDB.disCN.modalminicontent,
			footerDirection: InternalComponents.LibraryComponents.Flex.Direction.HORIZONTAL,
			children: BDFDB.ReactUtils.elementToReact(BDFDB.DOMUtils.create(changeLogHTML)),
			footerChildren: (plugin == BDFDB || plugin == libraryInstance || PluginStores.loaded[plugin.name] && PluginStores.loaded[plugin.name] == plugin && plugin.author == "DevilBro") && BDFDB.ReactUtils.createElement("div", {
				className: BDFDB.disCN.changelogfooter,
				children: [
					{href: "https://www.paypal.me/MircoWittrien", name: "PayPal", icon: "PAYPAL"},
					{href: "https://www.patreon.com/MircoWittrien", name: "Patreon", icon: "PATREON"}
				].map(data => BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Anchor, {
					className: BDFDB.disCN.changelogsociallink,
					href: data.href,
					children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
						text: data.name,
						children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
							name: InternalComponents.LibraryComponents.SvgIcon.Names[data.icon],
							width: 16,
							height: 16
						})
					})
				})).concat(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextElement, {
					size: InternalComponents.LibraryComponents.TextElement.Sizes.SIZE_12,
					children: BDFDB.LanguageUtils.LibraryStrings.donate_message
				}))
			})
		});
	};
	BDFDB.PluginUtils.addLoadingIcon = function (icon) {
		if (!Node.prototype.isPrototypeOf(icon)) return;
		let app = document.querySelector(BDFDB.dotCN.app);
		if (!app) return;
		BDFDB.DOMUtils.addClass(icon, BDFDB.disCN.loadingicon);
		let loadingIconWrapper = document.querySelector(BDFDB.dotCN.app + ">" + BDFDB.dotCN.loadingiconwrapper)
		if (!loadingIconWrapper) {
			loadingIconWrapper = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCN.loadingiconwrapper}"></div>`);
			app.appendChild(loadingIconWrapper);
			let killObserver = new MutationObserver(changes => {if (!loadingIconWrapper.firstElementChild) BDFDB.DOMUtils.remove(loadingIconWrapper);});
			killObserver.observe(loadingIconWrapper, {childList: true});
		}
		loadingIconWrapper.appendChild(icon);
	};
	BDFDB.PluginUtils.createSettingsPanel = function (addon, props) {
		addon = addon == BDFDB && InternalBDFDB || addon;
		if (!BDFDB.ObjectUtils.is(addon)) return;
		let settingsProps = props;
		if (settingsProps && !BDFDB.ObjectUtils.is(settingsProps) && (BDFDB.ReactUtils.isValidElement(settingsProps) || BDFDB.ArrayUtils.is(settingsProps))) settingsProps = {
			children: settingsProps
		};
		let settingsPanel = BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SettingsPanel, Object.assign({
			addon: addon,
			collapseStates: settingsProps && settingsProps.collapseStates
		}, settingsProps));
		if (isBeta || !document.querySelector("#bd-settingspane-container")) return settingsPanel;
		else {
			let div = document.createElement("div");
			div.props = settingsPanel.props;
			BDFDB.TimeUtils.timeout(_ => {
				BDFDB.ModalUtils.open(addon, {
					header: `${addon.name} ${BDFDB.LanguageUtils.LanguageStrings.SETTINGS}`,
					subHeader: "",
					className: BDFDB.disCN._repomodal,
					headerClassName: BDFDB.disCN._repomodalheader,
					contentClassName: BDFDB.disCN._repomodalsettings,
					footerClassName: BDFDB.disCN._repomodalfooter,
					size: "MEDIUM",
					children: settingsPanel,
					buttons: [{contents: BDFDB.LanguageUtils.LanguageStrings.DONE, color: "BRAND", close: true}]
				});
			});
			BDFDB.TimeUtils.timeout(_ => {
				let settings = document.querySelector(`${BDFDB.dotCN._reposettingsopen} #plugin-settings-${addon.name}`);
				if (settings && settings.previousElementSibling && !settings.previousElementSibling.className) settings.previousElementSibling.click();
			}, 1000);
			return div;
		}
	};
	BDFDB.PluginUtils.refreshSettingsPanel = function (plugin, settingsPanel, ...args) {
		if (BDFDB.ObjectUtils.is(plugin)) {
			if (settingsPanel && settingsPanel.props && BDFDB.ObjectUtils.is(settingsPanel.props._instance)) {
				settingsPanel.props._instance.props = Object.assign({}, settingsPanel.props._instance.props, ...args);
				BDFDB.ReactUtils.forceUpdate(settingsPanel.props._instance);
			}
			else if (typeof plugin.getSettingsPanel == "function" && Node.prototype.isPrototypeOf(settingsPanel) && settingsPanel.parentElement) {
				settingsPanel.parentElement.appendChild(plugin.getSettingsPanel(...args));
				settingsPanel.remove();
			}
		}
	};
	InternalBDFDB.addSpecialListeners = function (plugin) {
		plugin = plugin == BDFDB && InternalBDFDB || plugin;
		if (BDFDB.ObjectUtils.is(plugin)) {
			if (typeof plugin.onSwitch === "function") {
				let spacer = document.querySelector(`${BDFDB.dotCN.guildswrapper} ~ * > ${BDFDB.dotCN.chatspacer}`);
				if (spacer) {
					let noChannelObserver = new MutationObserver(changes => {changes.forEach(change => {
						if (change.target && BDFDB.DOMUtils.containsClass(change.target, BDFDB.disCN.nochannel)) plugin.onSwitch();
					});});
					BDFDB.ObserverUtils.connect(plugin, spacer.querySelector(BDFDB.dotCNC.chat + BDFDB.dotCN.nochannel), {name: "switchFixNoChannelObserver", instance: noChannelObserver}, {attributes: true});
					let spacerObserver = new MutationObserver(changes => {changes.forEach(change => {if (change.addedNodes) {change.addedNodes.forEach(node => {
						if (BDFDB.DOMUtils.containsClass(node, BDFDB.disCN.chat, BDFDB.disCN.nochannel, false)) {
							BDFDB.ObserverUtils.connect(plugin, node, {name: "switchFixNoChannelObserver", instance: noChannelObserver}, {attributes: true});
						}
					});}});});
					BDFDB.ObserverUtils.connect(plugin, spacer, {name: "switchFixSpacerObserver", instance: spacerObserver}, {childList: true});
				}
			}
			InternalBDFDB.addContextListeners(plugin);
		}
	};

	window.BDFDB_Global = Object.assign({
		started: true,
		loading: true,
		PluginUtils: {
			buildPlugin: BDFDB.PluginUtils.buildPlugin,
			cleanUp: BDFDB.PluginUtils.cleanUp
		}
	}, config, window.BDFDB_Global);

	
	const loadLibrary = tryAgain => {
		const css = `@import url(https://mwittrien.github.io/BetterDiscordAddons/Themes/_res/SupporterBadge.css);

		:root {
			--bdfdb-blurple: rgb(114, 137, 218);
		}
		
		#pluginNotice[class=" "], #pluginNotice[class=""] {
			z-index: 999;
			background: black;
			color: white;
			text-align: center;
			pointer-events: all;
		}
		#pluginNotice[class=" "] span, #pluginNotice[class=""] span {
			position: relative;
			top: 10px;
			color: white;
		}
		
		img:not([src]), img[src=""], img[src="null"] {
			opacity: 0;
		}
		
		[REPLACE_CLASS_menu] [REPLACE_CLASS_itemlayer] {
			z-index: 1003;
		}
		
		[REPLACE_CLASS_loadingiconwrapper] {
			position: absolute;
			bottom: 0;
			right: 0;
			z-index: 1000;
			animation: loadingwrapper-fade 3s infinite ease;
		}
		[REPLACE_CLASS_loadingiconwrapper] [REPLACE_CLASS_loadingicon] {
			margin: 0 5px;
		}
		@keyframes loadingwrapper-fade {
			from {opacity: 0.1;}
			50% {opacity: 0.9;}
			to {opacity: 0.1;}
		}
		
		[REPLACE_CLASS_settingspanellistwrapper] {
			margin-bottom: 8px;
		}
		[REPLACE_CLASS_settingspanellistwrapper][REPLACE_CLASS_settingspanellistwrappermini] {
			margin-bottom: 4px;
		}
		[REPLACE_CLASS_settingspanellist] {
			padding-left: 15px;
		}
		[REPLACE_CLASS_settingspanellistwrapper][REPLACE_CLASS_settingspanellistwrappermini] [REPLACE_CLASS_settingspanellist] {
			padding-left: 10px;
		}
		
		[REPLACE_CLASS_settingsrowcontainer][REPLACE_CLASS_marginreset] {
			margin-bottom: 0;
		}
		[REPLACE_CLASS_settingsrowcontainer][REPLACE_CLASS_marginbottom4] {
			margin-bottom: 4px;
		}
		[REPLACE_CLASS_settingsrowcontainer][REPLACE_CLASS_marginbottom8] {
			margin-bottom: 8px;
		}
		[REPLACE_CLASS_settingsrowcontainer][REPLACE_CLASS_marginbottom20] {
			margin-bottom: 20px;
		}
		[REPLACE_CLASS_settingsrowcontainer][REPLACE_CLASS_marginbottom40] {
			margin-bottom: 40px;
		}
		[REPLACE_CLASS_settingsrowcontainer][REPLACE_CLASS_marginbottom60] {
			margin-bottom: 60px;
		}
		[REPLACE_CLASS_flexdirectionrow] > [REPLACE_CLASS_settingsrowcontainer] + [REPLACE_CLASS_settingsrowcontainer] {
			margin-left: 8px;
		}
		[REPLACE_CLASS_settingsrowcontainer] [REPLACE_CLASS_settingsrowlabel] {
			align-items: center;
		}
		[REPLACE_CLASS_settingsrowcontainer] [REPLACE_CLASS_settingsrowcontrol] {
			margin-left: 8px;
		}
		[REPLACE_CLASS_settingsrowcontainer] [REPLACE_CLASS_settingsrowtitlemini] {
			line-height: 18px;
			font-size: 12px;
			font-weight: 400;
		}
		
		[REPLACE_CLASS_switch][REPLACE_CLASS_switchmini] {
			width: 26px;
			height: 16px;
		}
		[REPLACE_CLASS_switch][REPLACE_CLASS_switchmini] [REPLACE_CLASS_switchslider] {
			width: 16px;
			height: 14px;
			margin: 1px;
		}
		
		[REPLACE_CLASS_collapsecontainer] {
			margin-bottom: 20px;
		}
		[REPLACE_CLASS_collapsecontainermini] {
			margin-bottom: 8px;
		}
		[REPLACE_CLASS_collapsecontainerheader] {
			margin-bottom: 4px;
		}
		[REPLACE_CLASS_collapsecontainercollapsed] [REPLACE_CLASS_collapsecontainertitle] {
			margin-bottom: 0;
		}
		[REPLACE_CLASS_collapsecontainertitle] {
			display: flex;
			justify-content: space-between;
			align-items: center;
			cursor: pointer;
			order: 1;
		}
		[REPLACE_CLASS_collapsecontainertitle]:hover {
			color: var(--text-normal);
		}
		[REPLACE_CLASS_collapsecontainertitle]::before {
			content: "";
			flex: 1 1 auto;
			background-color: currentColor;
			height: 2px;
			margin: 0 10px 0 15px;
			opacity: 0.2;
			order: 2;
		}
		[REPLACE_CLASS_collapsecontainertitle]::after {
			content: "";
			-webkit-mask: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAxOS4wLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iQ2FscXVlXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSItOTUwIDUzMiAxOCAxOCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAtOTUwIDUzMiAxOCAxODsiIHhtbDpzcGFjZT0icHJlc2VydmUiPg0KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4NCgkuc3Qwe2ZpbGw6bm9uZTt9DQoJLnN0MXtmaWxsOm5vbmU7c3Ryb2tlOiNGRkZGRkY7c3Ryb2tlLXdpZHRoOjEuNTtzdHJva2UtbWl0ZXJsaW1pdDoxMDt9DQo8L3N0eWxlPg0KPHBhdGggY2xhc3M9InN0MCIgZD0iTS05MzIsNTMydjE4aC0xOHYtMThILTkzMnoiLz4NCjxwb2x5bGluZSBjbGFzcz0ic3QxIiBwb2ludHM9Ii05MzYuNiw1MzguOCAtOTQxLDU0My4yIC05NDUuNCw1MzguOCAiLz4NCjwvc3ZnPg0K) center/cover no-repeat;
			background-color: currentColor;
			width: 20px;
			height: 20px;
			order: 3;
			transition: transform .3s ease;
			transform: rotate(0);
		}
		[REPLACE_CLASS_collapsecontainercollapsed] [REPLACE_CLASS_collapsecontainertitle]::after {
			transform: rotate(90deg)
		}
		[REPLACE_CLASS_collapsecontainerinner] {
			padding-left: 15px;
		}
		
		[REPLACE_CLASS_settingsguild] {
			border-radius: 50%;
			border: 3px solid #43b581;
			box-sizing: border-box;
			cursor: pointer;
			margin: 3px;
			overflow: hidden;
		}
		[REPLACE_CLASS_settingsguilddisabled] {
			border-color: #747f8d;
			filter: grayscale(100%) brightness(50%);
		}
		
		[REPLACE_CLASS_guildslabel] {
			color: var(--text-muted);
			text-align: center;
			text-transform: uppercase;
			font-size: 10px;
			font-weight: 500;
			line-height: 1.3;
			width: 70px;
			word-wrap: normal;
			white-space: nowrap;
		}
		[REPLACE_CLASS_guildslabel]:hover {
			color: var(--header-secondary);
		}
		[REPLACE_CLASS_guildslabel]:active {
			color: var(--header-primary);
		}
		
		[REPLACE_CLASS_searchbarwrapper] {
			padding: 10px;
		}
		[REPLACE_CLASS_popout] [REPLACE_CLASS_searchbarwrapper] {
			padding: 0 0 5px 0;
			border-bottom: 1px solid var(--background-modifier-accent);
		}
		
		[REPLACE_CLASS_paginationlist] {
			height: 100%;
		}
		[REPLACE_CLASS_paginationlistpagination] {
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 16px;
			line-height: 20px;
			margin-top: 10px;
			margin-bottom: 10px;
			color: var(--text-normal);
		}
		[REPLACE_CLASS_paginationlistalphabet] {
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 16px;
			line-height: 20px;
			margin-bottom: 10px;
			color: var(--text-normal);
		}
		[REPLACE_CLASS_paginationlistalphabetchar] {
			min-width: 12px;
			text-align: center;
			margin: 0 4px;
		}
		[REPLACE_CLASS_paginationlistalphabetchar]:not([REPLACE_CLASS_paginationlistalphabetchardisabled]):hover {
			color: var(--header-primary);
		}
		[REPLACE_CLASS_paginationlistalphabetchar][REPLACE_CLASS_paginationlistalphabetchardisabled] {
			color: var(--text-muted);
		}
		[REPLACE_CLASS_paginationlistmini] [REPLACE_CLASS_paginationlistpagination] {
			font-size: 14px;
			line-height: 18px;
			margin-top: 5px;
			margin-bottom: 5px;
		}
		[REPLACE_CLASS_paginationlistmini] [REPLACE_CLASS_paginationlistalphabet] {
			font-size: 14px;
			line-height: 18px;
			margin-bottom: 5px;
		}
		[REPLACE_CLASS_paginationlistmini] [REPLACE_CLASS_paginationlistalphabetchar] {
			min-width: 10px;
			margin: 0 3px;
		}
		[REPLACE_CLASS_paginationlistmini] [REPLACE_CLASS_searchresultspaginationbutton] {
			height: 16px;
			width: 16px;
			margin: 0 6px;
		}
		[REPLACE_CLASS_paginationlistmini] [REPLACE_CLASS_searchresultspaginationicon] {
			height: 12px;
			width: 12px;
		}
		
		[REPLACE_CLASS_overflowellipsis] {
			overflow: hidden;
			text-overflow: ellipsis;
		}
		
		[REPLACE_CLASS_userpopout] [REPLACE_CLASS_userpopoutheadertext] + [REPLACE_CLASS_userinfodate],
		[REPLACE_CLASS_userprofile] [REPLACE_CLASS_userprofilenametag] + [REPLACE_CLASS_userinfodate] {
			margin-top: 8px;
		}
		[REPLACE_CLASS_userinfodate] + [REPLACE_CLASS_userpopoutcustomstatus] {
			margin-top: 4px;
		}
		[REPLACE_CLASS_userpopout] [REPLACE_CLASS_userpopoutheadernormal] [REPLACE_CLASS_userinfodate] {
			color: var(--header-secondary);
		}
		[REPLACE_CLASS_userpopout] [REPLACE_CLASS_userpopoutheader]:not([REPLACE_CLASS_userpopoutheadernormal]) [REPLACE_CLASS_userinfodate] {
			color: hsla(0,0%,100%,.6);
		}
		[REPLACE_CLASS_userprofile] [REPLACE_CLASS_userprofiletopsectionnormal] [REPLACE_CLASS_userinfodate] {
			color: var(--header-secondary);
		}
		[REPLACE_CLASS_userprofile] [class*='topSection']:not([REPLACE_CLASS_userprofiletopsectionnormal]) [REPLACE_CLASS_userinfodate] {
			color: hsla(0,0%,100%,.6);
		}
		
		[REPLACE_CLASS_avatardisabled] {
			filter: grayscale(100%) brightness(50%);
		}
		
		[REPLACE_CLASS_messagebottag] {
			top: .15rem;
		}
		
		[REPLACE_CLASS_messageusername] ~ [REPLACE_CLASS_messagebottagcompact] {
			margin-right: 0;
			margin-left: .25rem;
		}
		
		[REPLACE_CLASS_messageavatar][REPLACE_CLASS_bdfdbbadgeavatar] [REPLACE_CLASS_avatarwrapper] {
			width: inherit !important;
			height: inherit !important;
		}
		
		[REPLACE_CLASS_favbuttoncontainer] {
			display: flex;
			position: relative;
			cursor: pointer;
		}
		
		[REPLACE_CLASS_menuhint] {
			width: 42px;
			max-width: 42px;
			margin-left: 8px;
		}
		
		[REPLACE_CLASS_cursordefault] {
			cursor: default !important;
		}
		[REPLACE_CLASS_cursorpointer] {
			cursor: pointer !important;
		}
		
		[REPLACE_CLASS_slidergrabber]:active [REPLACE_CLASS_sliderbubble],
		[REPLACE_CLASS_slidergrabber]:hover [REPLACE_CLASS_sliderbubble] {
			visibility: visible;
		}
		[REPLACE_CLASS_sliderbubble] {
			background-color: var(--background-floating);
			border-radius: 3px;
			top: -32px;
			height: 22px;
			width: auto;
			padding: 0 5px;
			white-space: pre;
			transform: translateX(-50%);
			line-height: 22px;
			text-align: center;
			font-weight: 600;
			font-size: 12px;
			color: #f6f6f7;
			visibility: hidden;
		}
		[REPLACE_CLASS_sliderbubble],
		[REPLACE_CLASS_sliderbubble]:before {
			position: absolute;
			left: 50%;
			pointer-events: none;
		}
		[REPLACE_CLASS_sliderbubble]:before {
			border: 5px solid transparent;
			border-top-color: var(--background-floating);
			content: " ";
			width: 0;
			height: 0;
			margin-left: -5px;
			top: 100%;
		}
		
		[REPLACE_CLASS_selectwrapper] [REPLACE_CLASS_select] {
			flex: 1 1 auto;
		}
		[REPLACE_CLASS_selectwrapper] [class*="css-"][class*="-container"] > [class*="css-"][class*="-menu"] {
			z-index: 3;
		}
		
		[REPLACE_CLASS_hotkeywrapper] [REPLACE_CLASS_hotkeycontainer] {
			flex: 1 1 auto;
		}
		[REPLACE_CLASS_hotkeyresetbutton] {
			cursor: pointer;
			margin-left: 5px;
		}
		[REPLACE_CLASS_hotkeyresetbutton] [REPLACE_CLASS_svgicon]:hover {
			color: #f04747;
		}
		
		[REPLACE_CLASS_hovercardwrapper] {
			position: relative;
			display: flex;
			flex-direction: column;
			align-items: center;
		}
		[REPLACE_CLASS_hovercardhorizontal] {
			flex-direction: row;
		}
		[REPLACE_CLASS_hovercarddisabled] {
			opacity: 0.7;
			filter: grayscale(0.2);
		}
		[REPLACE_CLASS_settingspanel] [REPLACE_CLASS_hovercardwrapper] {
			width: calc(100% - 22px);
		}
		[REPLACE_CLASS_hovercardwrapper][REPLACE_CLASS_hovercard] {
			padding: 10px 0;
		}
		[REPLACE_CLASS_hovercardwrapper][REPLACE_CLASS_hovercard] > * {
			z-index: 1;
		}
		[REPLACE_CLASS_hovercardwrapper], [REPLACE_CLASS_hovercardinner] {
			min-height: 28px;
		}
		[REPLACE_CLASS_hovercardinner] {
			width: 100%;
			padding-right: 5px;
			display: flex;
			align-items: center;
			z-index: 1;
		}
		[REPLACE_CLASS_hovercardwrapper] [REPLACE_CLASS_hovercardbutton] {
			position: absolute;
			top: -6px;
			right: -6px;
			opacity: 0;
		}
		[REPLACE_CLASS_hovercardwrapper][REPLACE_CLASS_hovercard] [REPLACE_CLASS_hovercardbutton] {
			right: -25px;
		}
		[REPLACE_CLASS_hovercardwrapper]:hover [REPLACE_CLASS_hovercardbutton] {
			opacity: 1;
		}
		
		[REPLACE_CLASS_guildsummarycontainer] {
			display: -webkit-box;
			display: -ms-flexbox;
			display: flex;
			-webkit-box-align: center;
			-ms-flex-align: center;
			align-items: center;
		}
		[REPLACE_CLASS_guildsummarysvgicon] {
			-webkit-box-flex: 0;
			-ms-flex: 0 0 auto;
			flex: 0 0 auto;
			color: var(--text-muted);
			width: 20px;
			height: 20px;
			margin-right: 8px;
		}
		[REPLACE_CLASS_guildsummaryiconcontainer] {
			width: 24px;
			height: 24px;
		}
		[REPLACE_CLASS_guildsummaryiconcontainermasked] {
			margin-right: -4px;
			-webkit-mask: url('data:image/svg+xml; utf8, <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 1 1"><path fill="white" d="M 0 0 L 0 1 L 1 1 L 1 0.99804688 A 0.54166669 0.54166669 0 0 1 0.66601562 0.5 A 0.54166669 0.54166669 0 0 1 1 0.001953125 L 1 0 L 0 0 z"/></svg>') center/cover no-repeat;
		}
		[REPLACE_CLASS_guildsummaryclickableicon] {
			cursor: pointer;
		}
		[REPLACE_CLASS_guildsummaryicon],
		[REPLACE_CLASS_guildsummaryclickableicon],
		[REPLACE_CLASS_guildsummaryemptyguild] {
			width: 24px;
			height: 24px;
			border-radius: 50%;
		}
		[REPLACE_CLASS_guildsummaryemptyguild] {
			background: var(--background-accent);
		}
		[REPLACE_CLASS_guildsummarymoreguilds] {
			-webkit-box-sizing: border-box;
			box-sizing: border-box;
			background-color: var(--background-tertiary);
			font-size: 12px;
			line-height: 24px;
			font-weight: 500;
			text-align: center;
			color: var(--text-normal);
			height: 24px;
			min-width: 24px;
			border-radius: 12px;
			padding: 0 8px;
		}
		
		[REPLACE_CLASS_table] {
			position: relative;
			width: 100%;
		}
		[REPLACE_CLASS_table] [REPLACE_CLASS_tablespacerheader],
		[REPLACE_CLASS_table] [REPLACE_CLASS_tablestickyheader] {
			padding: 0px 12px 8px 0;
			margin-bottom: 5px;
			box-sizing: border-box;
			background-color: var(--background-primary);
			border-bottom: 1px solid var(--background-modifier-accent);
		}
		[REPLACE_CLASS_table] [REPLACE_CLASS_tablestickyheader]:first-child {
			position: absolute;
			width: 100%;
		}
		[REPLACE_CLASS_modalsub] [REPLACE_CLASS_table] [REPLACE_CLASS_tablestickyheader]:first-child {
			padding-left: 20px;
		}
		[REPLACE_CLASS_tableheadercell] {
			color: var(--interactive-normal);
			font-size: 12px;
			font-weight: 600;
			text-transform: uppercase;
		}
		[REPLACE_CLASS_tableheadercell],
		[REPLACE_CLASS_tablebodycell] {
			border-left: 1px solid var(--background-modifier-accent);
			box-sizing: border-box;
			padding: 0 12px;
		}
		[REPLACE_CLASS_tableheadercell]:first-child,
		[REPLACE_CLASS_tablebodycell]:first-child {
			border-left: none;
			padding-left: 0;
		}
		[REPLACE_CLASS_table] [REPLACE_CLASS_tablerow] {
			position: relative;
			display: flex;
			margin-bottom: 5px;
			align-items: center;
			color: var(--header-secondary);
		}
		[REPLACE_CLASS_tablebodycell] {
			font-size: 15px;
		}
		
		[REPLACE_CLASS_settingstableheaders] {
			display: flex;
			align-items: center;
			flex: 1 0 auto;
			margin-right: 10px;
			margin-left: 10px;
		}
		[REPLACE_CLASS_settingstableheaderoptions] {
			display: flex;
			align-items: center;
			justify-content: space-between;
			flex: 0 0 auto;
		}
		[REPLACE_CLASS_settingstablelist] [REPLACE_CLASS_settingstableheader] {
			min-height: 10px;
		}
		[REPLACE_CLASS_settingstablelist] [REPLACE_CLASS_settingstableheaderoption] {
			width: unset;
		}
		[REPLACE_CLASS_settingstablelist] [REPLACE_CLASS_settingstableheaderoption][REPLACE_CLASS_settingstableheadervertical] {
			width: 24px;
		}
		[REPLACE_CLASS_settingstableheadervertical] {
			position: relative;
		}
		[REPLACE_CLASS_settingstableheadervertical] > span {
			position: absolute;
			bottom: 50%;
			right: calc(50% - 4px);
			margin-bottom: -5px;
			writing-mode: vertical-rl;
		}
		[REPLACE_CLASS_settingstablecard] {
			height: 60px;
			padding: 0 10px;
			margin-bottom: 10px;
		}
		[REPLACE_CLASS_settingstablecardlabel] {
			display: flex;
			align-items: center;
			flex: 1 0 auto;
			color: var(--header-primary);
		}
		[REPLACE_CLASS_settingstablecardconfigs] {
			display: flex;
			align-items: center;
			justify-content: space-between;
			flex: 0 0 auto;
		}
		[REPLACE_CLASS_settingstablecard] [REPLACE_CLASS_settingstablecardlabel] {
			padding-right: 10px;
		}
		[REPLACE_CLASS_settingstablecard] [REPLACE_CLASS_settingstablecardlabel],
		[REPLACE_CLASS_settingstablecard] [REPLACE_CLASS_settingstablecardconfigs] {
			margin: 0;
		}
		[REPLACE_CLASS_settingstablelist] [REPLACE_CLASS_checkboxcontainer]:before {
			display: none;
		}
		
		[REPLACE_CLASS_popoutwrapper] [REPLACE_CLASS_messagespopouttabbarheader] {
			flex: 1 0 auto;
			align-items: center;
			height: unset;
			min-height: 56px;
		}
		[REPLACE_CLASS_popoutwrapper] [REPLACE_CLASS_messagespopouttabbarheader] [REPLACE_CLASS_messagespopouttabbar] {
			min-height: 32px;
		}
		
		[REPLACE_CLASS_charcounter] {
			color: var(--channels-default);
		}
		
		[REPLACE_CLASS_inputmulti] {
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
		[REPLACE_CLASS_inputmultifirst] {
			flex-grow: 1;
			padding: 0 8px;
		}
		[REPLACE_CLASS_inputmultilast]::before {
			content: "";
			position: absolute;
			border: 1px solid var(--header-primary);
			width: 1px;
			height: 30px;
			margin-top: 5px;
			opacity: .1;
		}
		[REPLACE_CLASS_inputmultilast] input {
			width: 250px;
			padding-left: 16px;
		}
		[REPLACE_CLASS_inputmultifield] {
			border: none !important;
		}
		
		[REPLACE_CLASS_inputlistitems] {
			display: flex;
			flex-direction: row;
			justify-content: flex-start;
			align-items: center;
			flex-wrap: wrap;
		}
		[REPLACE_CLASS_inputlistitem] {
			display: flex;
			justify-content: center;
			align-items: center;
		}
		[REPLACE_CLASS_inputlistitem]:not(:last-child) {
			margin-right: 4px;
		}
		[REPLACE_CLASS_inputlistdelete] {
			cursor: pointer;
			margin-left: 6px;
		}
		
		[REPLACE_CLASS_inputnumberwrapper] {
			position: relative;
		}
		[REPLACE_CLASS_inputnumberbuttons]:hover + [REPLACE_CLASS_input]:not([REPLACE_CLASS_inputfocused]):not([REPLACE_CLASS_inputerror]):not([REPLACE_CLASS_inputsuccess]):not([REPLACE_CLASS_inputdisabled]):not(:focus) {
			border-color: #040405;
		}
		[REPLACE_CLASS_inputnumberwrapperdefault] [REPLACE_CLASS_input] {
			padding-right: 25px;
		}
		[REPLACE_CLASS_inputnumberwrappermini] [REPLACE_CLASS_input] {
			padding-left: 6px;
			padding-right: 17px;
		}
		[REPLACE_CLASS_inputnumberwrapper] [REPLACE_CLASS_input]::-webkit-inner-spin-button, 
		[REPLACE_CLASS_inputnumberwrapper] [REPLACE_CLASS_input]::-webkit-outer-spin-button{
			-webkit-appearance: none !important;
		}
		[REPLACE_CLASS_inputnumberbuttons] {
			position: absolute;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: space-around;
			height: 110%;
			top: -2%;
		}
		[REPLACE_CLASS_inputnumberwrapperdefault] [REPLACE_CLASS_inputnumberbuttons] {
			right: 8px;
		}
		[REPLACE_CLASS_inputnumberwrappermini] [REPLACE_CLASS_inputnumberbuttons] {
			right: 4px;
		}
		[REPLACE_CLASS_inputnumberbutton] {
			cursor: pointer;
			border: transparent solid 5px;
			border-top-width: 2.5px;
			display: inline-block;
		}
		[REPLACE_CLASS_inputnumberbutton] {
			border-bottom-color: var(--interactive-normal);
		}
		[REPLACE_CLASS_inputnumberbutton]:hover {
			border-bottom-color: var(--interactive-active);
		}
		[REPLACE_CLASS_inputnumberbuttondown] {
			transform: rotate(180deg);
		}
		
		[REPLACE_CLASS_guildupperleftbadge] {
			top: 0;
		}
		[REPLACE_CLASS_guildlowerleftbadge] {
			bottom: 0;
		}
		[REPLACE_CLASS_guildlowerleftbadge], [REPLACE_CLASS_guildupperleftbadge] {
			pointer-events: none;
			position: absolute;
			left: 0;
		}
		
		[REPLACE_CLASS_svgiconwrapper] {
			display: flex;
			justify-content: center;
			align-items: center;
		}
		[REPLACE_CLASS_svgicon] {
			color: var(--interactive-normal);
		}
		[REPLACE_CLASS_svgicon]:hover {
			color: var(--interactive-hover);
		}
		[REPLACE_CLASS_svgicon]:active {
			color: var(--interactive-active);
		}
		
		[REPLACE_CLASS_listrowwrapper] [REPLACE_CLASS_listavatar] {
			display: flex;
			justify-content: center;
			align-items: center;
		}
		
		[REPLACE_CLASS_sidebarlist] {
			display: flex;
			flex-direction: row;
			flex: 1 1 auto;
		}
		[REPLACE_CLASS_sidebar] {
			padding: 8px;
			flex: 0 1 auto;
		}
		[REPLACE_CLASS_sidebarcontent] {
			padding: 8px 0;
			flex: 1 1 auto;
		}
		
		[REPLACE_CLASS_modalwrapper] [REPLACE_CLASS_modalclose] [REPLACE_CLASS_buttoncontents] {
			display: flex;
			justify-content: center;
			align-items: center;
		}
		[REPLACE_CLASS_modalsubinner] {
			padding-left: 16px;
			padding-right: 8px;
		}
		[REPLACE_CLASS_modalnoscroller] {
			overflow: hidden;
		}
		[REPLACE_CLASS_modalcontent][REPLACE_CLASS_modalnoscroller] {
			padding-bottom: 10px;
		}
		[REPLACE_CLASS_modaltabcontent] {
			margin-top: 10px;
		}
		[REPLACE_CLASS_listscroller] [REPLACE_CLASS_modaltabcontent] {
			margin-top: 0;
		}
		[REPLACE_CLASS_modalheaderhassibling] {
			padding-bottom: 10px;
		}
		[REPLACE_CLASS_modalheadershade],
		[REPLACE_CLASS_modalsidebar] {
			background: rgba(0, 0, 0, 0.1);
		}
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_modalheadershade],
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_modalsidebar] {
			background: rgba(0, 0, 0, 0.2);
		}
		[REPLACE_CLASS_tabbarcontainer][REPLACE_CLASS_tabbarcontainerbottom] {
			border-top: unset;
			border-bottom: 1px solid hsla(0,0%,100%,.1);
		}
		[REPLACE_CLASS_modalwrapper] [REPLACE_CLASS_tabbarcontainer] {
			background: rgba(0, 0, 0, 0.1);
			border: none;
			box-shadow: 0 2px 3px 0 rgba(0, 0, 0, 0.05);
			padding-right: 12px;
		}
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_modalwrapper] [REPLACE_CLASS_tabbarcontainer] {
			background: rgba(0, 0, 0, 0.2);
			box-shadow: 0 2px 3px 0 rgba(0, 0, 0, 0.1);
		}
		[REPLACE_CLASS_modalchangelogmodal] [REPLACE_CLASS_changelogsociallink] {
			margin-right: 12px;
		}
		
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_popoutwrapper][REPLACE_CLASS_popoutright][REPLACE_CLASS_popoutarrowalignmentmiddle]:before {
			border-right-color: #2f3136;
		}
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_popoutwrapper][REPLACE_CLASS_popoutleft][REPLACE_CLASS_popoutarrowalignmentmiddle]:before {
			border-left-color: #2f3136;
		}
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_popoutwrapper][REPLACE_CLASS_popoutbottom][REPLACE_CLASS_popoutarrowalignmentmiddle]:before,
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_popoutwrapper][REPLACE_CLASS_popoutbottom][REPLACE_CLASS_popoutarrowalignmenttop]:before,
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_popoutwrapper][REPLACE_CLASS_popoutbottomleft][REPLACE_CLASS_popoutarrowalignmentmiddle]:before,
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_popoutwrapper][REPLACE_CLASS_popoutbottomleft][REPLACE_CLASS_popoutarrowalignmenttop]:before,
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_popoutwrapper][REPLACE_CLASS_popoutbottomright][REPLACE_CLASS_popoutarrowalignmentmiddle]:before,
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_popoutwrapper][REPLACE_CLASS_popoutbottomright][REPLACE_CLASS_popoutarrowalignmenttop]:before {
			border-bottom-color: #2f3136;
		}
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_popoutwrapper][REPLACE_CLASS_popouttop]:after,
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_popoutwrapper][REPLACE_CLASS_popouttopleft]:after,
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_popoutwrapper][REPLACE_CLASS_popouttopright]:after {
			border-top-color: #2f3136;
		}
		[REPLACE_CLASS_popoutthemedpopout] {
			background-color: var(--background-secondary);
			-webkit-box-shadow: var(--elevation-stroke),var(--elevation-high);
			box-shadow: var(--elevation-stroke),var(--elevation-high);
			box-sizing: border-box;
			border-radius: 5px;
			display: -webkit-box;
			display: -ms-flexbox;
			display: flex;
			-webkit-box-orient: vertical;
			-webkit-box-direction: normal;
			-ms-flex-direction: column;
			flex-direction: column;
		}
		[REPLACE_CLASS_popoutwrapper][REPLACE_CLASS_popoutarrowalignmentmiddle] [REPLACE_CLASS_popoutthemedpopout],
		[REPLACE_CLASS_popoutwrapper][REPLACE_CLASS_popoutarrowalignmenttop] [REPLACE_CLASS_popoutthemedpopout] {
			border-color: transparent;
		}
		
		[REPLACE_CLASS__repomodal] {
			min-height: unset;
		}
		[REPLACE_CLASS__repomodalsettings] {
			padding: 0 16px 16px 16px;
		}
		
		#bd-settingspane-container .ui-form-title {
			display: inline-block;
		}
		#bd-settingspane-container [REPLACE_CLASS__repofolderbutton] {
			position: static;
			margin-bottom: 0;
			border-radius: 5px;
			display: inline-block;
			margin-left: 10px;
		}
		#bd-settingspane-container [REPLACE_CLASS__repoupdatebutton][style] {
			display: none !important;
		}
		
		[REPLACE_CLASS__repolistwrapper] [REPLACE_CLASS__repolistheader] {
			display: flex;
			flex-direction: column;
			padding-top: 60px;
			padding-right: 70px;
		}
		[REPLACE_CLASS__repolistwrapper] [REPLACE_CLASS__repolistheader] > * {
			max-width: 740px;
			min-width: 460px;
			padding-left: 40px;
			padding-right: 40px;
		}
		[REPLACE_CLASS__repolistwrapper] [REPLACE_CLASS_settingswindowtoolscontainer] {
			margin-top: -140px;
		}
		[REPLACE_CLASS__repolistwrapper] [REPLACE_CLASS_settingswindowcontentregionscroller] {
			height: calc(100% - 140px);
		}
		[REPLACE_CLASS__repolistwrapper] [REPLACE_CLASS_settingswindowcontentcolumn] {
			padding-top: 20px;
		}
		[REPLACE_CLASS__repolistwrapper] [REPLACE_CLASS__repoentry] [REPLACE_CLASS__repofooter] {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}
		[REPLACE_CLASS__repolistwrapper] [REPLACE_CLASS__repoentry] [REPLACE_CLASS__repofooter] > *:only-child {
			margin-left: auto;
		}
		[REPLACE_CLASS__repolistwrapper] [REPLACE_CLASS__repoentry] [REPLACE_CLASS__repoheadercontrols],
		[REPLACE_CLASS__repolistwrapper] [REPLACE_CLASS__repoentry] [REPLACE_CLASS__repofootercontrols] {
			display: flex;
			align-items: center;
			justify-content: center;
			flex: 0 0 auto;
		}
		[REPLACE_CLASS__repolistwrapper] [REPLACE_CLASS__repoentry] [REPLACE_CLASS__repoheadercontrols] > *,
		[REPLACE_CLASS__repolistwrapper] [REPLACE_CLASS__repoentry] [REPLACE_CLASS__repocontrols] > * {
			margin-left: 10px;
		}
		[REPLACE_CLASS__repolistwrapper] [REPLACE_CLASS__repoentry] [REPLACE_CLASS__repofootercontrols][REPLACE_CLASS__repocontrols] > * {
			margin-left: 0;
		}
		[REPLACE_CLASS__repolistwrapper] [REPLACE_CLASS__repoentry] [REPLACE_CLASS__repocontrolsbutton] {
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
		}
		[REPLACE_CLASS__repolistwrapper] [REPLACE_CLASS__repoentry] [REPLACE_CLASS__repocontrols] > [REPLACE_CLASS__repocontrolsbutton]:only-child {
			border-radius: 3px;
		}
		
		[REPLACE_CLASS_noticewrapper] {
			transition: height 0.5s ease !important;
			border-radius: 0 !important;
		}
		[REPLACE_CLASS_noticewrapper] [REPLACE_CLASS_noticeplatformicon] {
			margin-top: -7px;
		}
		[REPLACE_CLASS_noticewrapper] [REPLACE_CLASS_noticeplatformicon] svg {
			max-height: 28px;
		}
		
		.platform-osx [REPLACE_CLASS_noticewrapper] ~ * [REPLACE_CLASS_guildswrapper] {
			margin-top: 0;
		}
		.platform-osx [REPLACE_CLASS_noticewrapper] ~ * [REPLACE_CLASS_guildsscroller] {
			padding-top: 4px;
		}
		
		[REPLACE_CLASS_tooltip][REPLACE_CLASS_tooltipcustom] [REPLACE_CLASS_tooltippointer] {
			border-top-color: inherit !important;
		}
		
		[REPLACE_CLASS_tooltiprowextra]:empty {
			display: none;
		}
		
		[REPLACE_CLASS_colorpickerswatchsinglewrapper] {
			position: relative;
			z-index: 1;
		}
		[REPLACE_CLASS_colorpickerswatchsingle] {
			height: 30px;
			width: 30px;
		}
		[REPLACE_CLASS_colorpickerswatches][REPLACE_CLASS_colorpickerswatchesdisabled] {
			cursor: no-drop;
			filter: grayscale(70%) brightness(50%);
		}
		[REPLACE_CLASS_colorpickerswatch]:not([REPLACE_CLASS_colorpickerswatchnocolor]):not([REPLACE_CLASS_colorpickerswatchdefault]):not([REPLACE_CLASS_colorpickerswatchdisabled]) {
			overflow: hidden;
		}
		[REPLACE_CLASS_colorpickerswatch][REPLACE_CLASS_colorpickerswatchcustom][style*="background"] {
			border: none;
		}
		[REPLACE_CLASS_colorpickerswatch]:not([REPLACE_CLASS_colorpickerswatchdefault]):after {
			border-radius: 3px;
		}
		[REPLACE_CLASS_colorpickerswatch][REPLACE_CLASS_colorpickerswatchcustom]:not([REPLACE_CLASS_colorpickerswatchdefault]):after {
			border-radius: 5px;
		}
		[REPLACE_CLASS_colorpickerswatch]:not([REPLACE_CLASS_colorpickerswatchnocolor]):not([REPLACE_CLASS_colorpickerswatchdefault]):not([REPLACE_CLASS_colorpickerswatchdisabled]):after {
			content: "";
			background: url('data:image/svg+xml; utf8, <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect x="0" y="0" width="4" height="4" fill="black"></rect><rect x="0" y="4" width="4" height="4" fill="white"></rect><rect x="4" y="0" width="4" height="4" fill="white"></rect><rect x="4" y="4" width="4" height="4" fill="black"></rect></svg>') center repeat;
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			z-index: -1;
		}
		
		[REPLACE_CLASS_colorpickeralpha] {
			position: relative;
			height: 8px;
			margin: 16px 0 8px;
		}
		[REPLACE_CLASS_colorpickergradient] {
			position: relative;
			height: 8px;
			margin: 27px 2px 2px 2px;
		}
		[REPLACE_CLASS_colorpickeralpha] > div > div > div > div {
			height: 16px !important;
			width: 8px !important;
			margin-top: -3px !important;
			border-radius: 3px !important;
		}
		[REPLACE_CLASS_themelight] [REPLACE_CLASS_colorpickersaturation] > div > div > div > div {
			box-shadow: rgb(200, 200, 200) 0px 0px 0px 1.5px, rgba(0, 0, 0, 0.6) 0px 0px 1px 1px inset, rgba(0, 0, 0, 0.6) 0px 0px 1px 2px !important;
		}
		[REPLACE_CLASS_themelight] [REPLACE_CLASS_colorpickerhue] > div > div > div > div,
		[REPLACE_CLASS_themelight] [REPLACE_CLASS_colorpickeralpha] > div > div > div > div {
			background: rgb(200, 200, 200) !important;
			box-shadow: rgba(0, 0, 0, 1) 0px 0px 2px !important;
		}
		[REPLACE_CLASS_colorpickeralpha] > div > div,
		[REPLACE_CLASS_colorpickergradient] > div > div {
			border-radius: 3px;
		}
		[REPLACE_CLASS_colorpickeralpha] [REPLACE_CLASS_colorpickeralphacheckered],
		[REPLACE_CLASS_colorpickergradient] [REPLACE_CLASS_colorpickergradientcheckered],
		[REPLACE_CLASS_colorpickergradient] [REPLACE_CLASS_colorpickergradientcursor] > div:after {
			background: url('data:image/svg+xml; utf8, <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect x="0" y="0" width="4" height="4" fill="black"></rect><rect x="0" y="4" width="4" height="4" fill="white"></rect><rect x="4" y="0" width="4" height="4" fill="white"></rect><rect x="4" y="4" width="4" height="4" fill="black"></rect></svg>') center repeat;
		}
		[REPLACE_CLASS_colorpickergradient] [REPLACE_CLASS_colorpickergradientcursor] > div {
			height: 8px;
			width: 8px;
			margin-top: -15px;
			border: 1px solid rgb(128, 128, 128);
			border-radius: 3px;
			transform: translateX(-5px);
			transform-style: preserve-3d;
		}
		[REPLACE_CLASS_colorpickergradient] [REPLACE_CLASS_colorpickergradientcursor] > div:after {
			content: "";
			position: absolute;
			top: 0;
			right: 0;
			bottom: 0;
			left: 0;
			z-index: -1;
			border-radius: 3px;
			transform: translateZ(-1px);
		}
		[REPLACE_CLASS_colorpickergradient] [REPLACE_CLASS_colorpickergradientcursor] > div:before {
			content: "";
			position: absolute;
			border: 3px solid transparent;
			border-top-width: 5px;
			border-top-color: rgb(128, 128, 128);
			width: 0;
			height: 0;
			top: 100%;
			left: -50%;
			transform: translateX(5px);
		}
		[REPLACE_CLASS_colorpickergradient] [REPLACE_CLASS_colorpickergradientcursor][REPLACE_CLASS_colorpickergradientcursoredge] > div:before {
			border-right-width: 0;
			border-left-width: 5px;
		}
		[REPLACE_CLASS_colorpickergradient] [REPLACE_CLASS_colorpickergradientcursor][REPLACE_CLASS_colorpickergradientcursoredge] ~ [REPLACE_CLASS_colorpickergradientcursor][REPLACE_CLASS_colorpickergradientcursoredge] > div:before {
			border-right-width: 5px;
			border-left-width: 0;
		}
		[REPLACE_CLASS_themelight] [REPLACE_CLASS_colorpickergradient] [REPLACE_CLASS_colorpickergradientcursor][REPLACE_CLASS_colorpickergradientcursorselected] > div {
			border-color: rgb(55, 55, 55);
		}
		[REPLACE_CLASS_themelight] [REPLACE_CLASS_colorpickergradient] [REPLACE_CLASS_colorpickergradientcursor][REPLACE_CLASS_colorpickergradientcursorselected] > div:before {
			border-top-color: rgb(55, 55, 55);
		}
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_colorpickergradient] [REPLACE_CLASS_colorpickergradientcursor][REPLACE_CLASS_colorpickergradientcursorselected] > div {
			border-color: rgb(200, 200, 200);
		}
		[REPLACE_CLASS_themedark] [REPLACE_CLASS_colorpickergradient] [REPLACE_CLASS_colorpickergradientcursor][REPLACE_CLASS_colorpickergradientcursorselected] > div:before {
			border-top-color: rgb(200, 200, 200);
		}
		[REPLACE_CLASS_colorpickergradientbutton] {
			color: var(--interactive-normal);
			opacity: 0.6;
			margin-left: 6px;
			transition: color 200ms ease, opactity 200ms ease;
		}
		[REPLACE_CLASS_colorpickergradientbutton]:hover {
			color: var(--interactive-hover);
			opacity: 1;
		}
		[REPLACE_CLASS_colorpickergradientbutton][REPLACE_CLASS_colorpickergradientbuttonenabled],
		[REPLACE_CLASS_colorpickergradientbutton][REPLACE_CLASS_colorpickergradientbuttonenabled]:hover {
			color: var(--interactive-active);
			opacity: 1;
		}
		
		[REPLACE_CLASS_layermodallarge], [REPLACE_CLASS_modalsizelarge] {
			max-height: 95vh;
		}
		@media only screen and (max-height: 900px) {
			[REPLACE_CLASS_layermodalmedium], [REPLACE_CLASS_modalsizemedium] {
				max-height: 75vh;
			}
		}
		
		#pluginNotice .notice-message {
			white-space: pre;
		}
		#pluginNotice #outdatedPlugins span {
			-webkit-app-region: no-drag;
			color: #FFF;
			cursor: pointer;
		}
		#pluginNotice #outdatedPlugins span:hover {
			text-decoration: underline;
		}
		
		[REPLACE_CLASS_toasts] {
			position: fixed;
			display: flex;
			top: 0;
			flex-direction: column;
			align-items: center;
			justify-content: flex-end;
			pointer-events: none;
			z-index: 4000;
		}
		@keyframes toast-up {
			from {
				transform: translateY(0);
				opacity: 0;
			}
		}
		[REPLACE_CLASS_toast] {
			background-color: var(--background-floating);
			border-radius: 5px;
			box-shadow: var(--elevation-medium);
			color: var(--header-primary);
			margin-top: 10px;
			padding: 10px;
			opacity: 1;
			font-size: 14px;
			font-weight: 500;
			user-select: text;
			pointer-events: auto;
			animation: toast-up 300ms ease;
			transform: translateY(-10px);
		}
		@keyframes toast-down {
			to {
				transform: translateY(0px);
				opacity: 0;
			}
		}
		[REPLACE_CLASS_toast][REPLACE_CLASS_toastclosing] {
			animation: toast-down 200ms ease;
			animation-fill-mode: forwards;
			opacity: 1;
			transform: translateY(-10px);
		}
		[REPLACE_CLASS_toast] [REPLACE_CLASS_toastinner] {
			display: flex;
			align-items: center;
		}
		[REPLACE_CLASS_toast] [REPLACE_CLASS_toastavatar] {
			margin-right: 5px;
			width: 25px;
			height: 25px;
			flex: 0 0 auto;
			background-size: cover;
			background-position: center;
			border-radius: 50%;
		}
		[REPLACE_CLASS_toast][REPLACE_CLASS_toasticon] {
			padding-left: 30px;
			background-position: 6px 50%;
			background-size: 20px 20px;
			background-repeat: no-repeat;
		}
		[REPLACE_CLASS_toast][REPLACE_CLASS_toastcustom] {
			color: #FFF;
		}
		[REPLACE_CLASS_toast].toast-brand {
			background-color: var(--bdfdb-blurple);
			color: #FFF;
		}
		[REPLACE_CLASS_toast].toast-brand[REPLACE_CLASS_toasticon] {
			background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIHhtbDpzcGFjZT0icHJlc2VydmUiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiIHZpZXdCb3g9IjI3IDI3IDExNSAxMTUiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDkwIDkwOyI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMTEuMywxMjQuMWMwLDAtMy40LTQuMS02LjMtNy43YzEyLjYtMy41LDE3LjQtMTEuMywxNy40LTExLjMgYy00LDIuNi03LjcsNC40LTExLjEsNS42Yy00LjgsMi05LjUsMy4zLTE0LDQuMWMtOS4yLDEuNy0xNy42LDEuMy0yNC45LTAuMWMtNS41LTEtMTAuMi0yLjUtMTQuMS00LjFjLTIuMi0wLjgtNC42LTEuOS03LjEtMy4zIGMtMC4zLTAuMi0wLjYtMC4zLTAuOS0wLjVjLTAuMS0wLjEtMC4zLTAuMi0wLjQtMC4yYy0xLjctMS0yLjYtMS42LTIuNi0xLjZzNC42LDcuNiwxNi44LDExLjJjLTIuOSwzLjYtNi40LDcuOS02LjQsNy45IGMtMjEuMi0wLjYtMjkuMy0xNC41LTI5LjMtMTQuNWMwLTMwLjYsMTMuOC01NS40LDEzLjgtNTUuNGMxMy44LTEwLjMsMjYuOS0xMCwyNi45LTEwbDEsMS4xQzUyLjgsNTAuMyw0NSw1Ny45LDQ1LDU3LjkgczIuMS0xLjIsNS43LTIuN2MxMC4zLTQuNSwxOC40LTUuNywyMS44LTZjMC41LTAuMSwxLjEtMC4yLDEuNi0wLjJjNS45LTAuNywxMi41LTAuOSwxOS40LTAuMmM5LjEsMSwxOC45LDMuNywyOC45LDkuMSBjMCwwLTcuNS03LjItMjMuOS0xMi4xbDEuMy0xLjVjMCwwLDEzLjEtMC4zLDI2LjksMTBjMCwwLDEzLjgsMjQuOCwxMy44LDU1LjRDMTQwLjYsMTA5LjYsMTMyLjUsMTIzLjUsMTExLjMsMTI0LjF6IE0xMDEuNyw3OS43Yy01LjQsMC05LjgsNC43LTkuOCwxMC41YzAsNS44LDQuNCwxMC41LDkuOCwxMC41YzUuNCwwLDkuOC00LjcsOS44LTEwLjUgQzExMS41LDg0LjQsMTA3LjEsNzkuNywxMDEuNyw3OS43eiBNNjYuNyw3OS43Yy01LjQsMC05LjgsNC43LTkuOCwxMC41YzAsNS44LDQuNCwxMC41LDkuOCwxMC41YzUuNCwwLDkuOC00LjcsOS44LTEwLjUgQzc2LjUsODQuNCw3Mi4xLDc5LjcsNjYuNyw3OS43eiIvPjwvc3ZnPg==);
		}
		[REPLACE_CLASS_toast].toast-danger, 
		[REPLACE_CLASS_toast].toast-error {
			background-color: #F04747;
			color: #FFF;
		}
		[REPLACE_CLASS_toast].toast-danger[REPLACE_CLASS_toasticon],
		[REPLACE_CLASS_toast].toast-error[REPLACE_CLASS_toasticon] {
			background-image: url(data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjRkZGRkZGIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTEyIDJDNi40NyAyIDIgNi40NyAyIDEyczQuNDcgMTAgMTAgMTAgMTAtNC40NyAxMC0xMFMxNy41MyAyIDEyIDJ6bTUgMTMuNTlMMTUuNTkgMTcgMTIgMTMuNDEgOC40MSAxNyA3IDE1LjU5IDEwLjU5IDEyIDcgOC40MSA4LjQxIDcgMTIgMTAuNTkgMTUuNTkgNyAxNyA4LjQxIDEzLjQxIDEyIDE3IDE1LjU5eiIvPiAgICA8cGF0aCBkPSJNMCAwaDI0djI0SDB6IiBmaWxsPSJub25lIi8+PC9zdmc+);
		}
		[REPLACE_CLASS_toast].toast-default {
			background-color: #F26522;
			color: #FFF;
		}
		[REPLACE_CLASS_toast].toast-default[REPLACE_CLASS_toasticon] {
			padding-left: 10px;
		}
		[REPLACE_CLASS_toast].toast-facebook {
			background-color: #355089;
			color: #FFF;
		}
		[REPLACE_CLASS_toast].toast-facebook[REPLACE_CLASS_toasticon] {
			background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHg9IjBweCIgeT0iMHB4IiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiIHZpZXdCb3g9Ii01IC01IDEwMCAxMDAiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDkwIDkwOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+PGc+PHBhdGggaWQ9IkZhY2Vib29rX194MjhfYWx0X3gyOV8iIGQ9Ik05MCwxNS4wMDFDOTAsNy4xMTksODIuODg0LDAsNzUsMEgxNUM3LjExNiwwLDAsNy4xMTksMCwxNS4wMDF2NTkuOTk4ICAgQzAsODIuODgxLDcuMTE2LDkwLDE1LjAwMSw5MEg0NVY1NkgzNFY0MWgxMXYtNS44NDRDNDUsMjUuMDc3LDUyLjU2OCwxNiw2MS44NzUsMTZINzR2MTVINjEuODc1QzYwLjU0OCwzMSw1OSwzMi42MTEsNTksMzUuMDI0VjQxICAgaDE1djE1SDU5djM0aDE2YzcuODg0LDAsMTUtNy4xMTksMTUtMTUuMDAxVjE1LjAwMXoiIGZpbGw9IndoaXRlIi8+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjxnPjwvZz48Zz48L2c+PGc+PC9nPjwvc3ZnPg==);
		}
		[REPLACE_CLASS_toast].toast-info {
			background-color: #4A90E2;
			color: #FFF;
		}
		[REPLACE_CLASS_toast].toast-info[REPLACE_CLASS_toasticon] {
			background-image: url(data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjRkZGRkZGIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPiAgICA8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMSAxNWgtMnYtNmgydjZ6bTAtOGgtMlY3aDJ2MnoiLz48L3N2Zz4=);
		}
		[REPLACE_CLASS_toast].toast-premium {
			background-color: #202225;
			color: #FFF;
		}
		[REPLACE_CLASS_toast].toast-premium[REPLACE_CLASS_toasticon] {
			background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDMiIGhlaWdodD0iMjYiPiAgPHBhdGggZmlsbD0iI0ZGRiIgZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNOTYuMjgyNiA4LjYwMjc4ODI0bC0xLjIxNTUgOC4zOTAzNTI5NmMtLjI3NzUgMS45ODI2Mjc0LTIuNDY1NSAyLjkwMzMzMzMtNC40NzkgMi45MDMzMzMzLTEuODc1IDAtMy43MTU1LS45MjA3MDU5LTMuNDcyNS0yLjcyNTkyMTZsMS4yMTU1LTguNTY3NzY0NjZjLjI3NzUtMS44NzY1ODgyNCAyLjQ2NTUtMi44MzI0NzA2IDQuNDc5LTIuODMyNDcwNiAyLjAxNCAwIDMuNzUuOTU1ODgyMzYgMy40NzI1IDIuODMyNDcwNk05My43NzIxLjAwMzkyNTVsLjAwMDUtLjAwNDA3ODQ0aC0xMy4wODRjLS4zMzQgMC0uNjE4LjI1MDMxMzcyLS42NjYuNTg3Mjk0MTJsLS42MzY1IDQuNDMyMjM1M2MtLjA1OTUuNDE0NDcwNTguMjU2Ljc4NjExNzY0LjY2NjUuNzg2MTE3NjRoMi4zODk1Yy4yNCAwIC40MDQ1LjI0OTgwMzkyLjMxLjQ3NTY0NzA2LS4yOTguNzEyMTk2MDctLjUxNTUgMS40ODYwNzg0My0uNjM2IDIuMzIxNjQ3MDZsLTEuMjE1NSA4LjU2Nzc2NDY2Yy0uNzk5IDUuNzM1Mjk0MiAzLjg4OSA4LjYwMjQzMTQgOC45OTMgOC42MDI0MzE0IDUuMzQ3NSAwIDEwLjU5MDUtMi44NjcxMzcyIDExLjM4OS04LjYwMjQzMTRsMS4yMTUtOC41Njc3NjQ2NmMuNzgzLTUuNjIyMTE3NjUtMy43Mzk1LTguNDg4MjM1My04LjcyNTUtOC41OTg4NjI3NW0tNzguNTk1MjUgMTEuNzI4NjUxbC4wNjcgNC4xNTg5ODA0Yy4wMDE1LjA4NTEzNzItLjA1NS4xNjA1ODgyLS4xMzYuMTgxNDkwMmgtLjAwMDVsLTEuMzg1NS01LjAxNjQ3MDZjLS4wMDItLjAwNzY0NzEtLjAwNS0uMDE0Nzg0My0uMDA4LS4wMjI0MzE0TDkuNDE0MzUuNzcwNzcyNTNjLS4xMDYtLjI1Mjg2Mjc1LS4zNDk1LS40MTY1MDk4LS42MTk1LS40MTY1MDk4aC00Ljg3MjVjLS4zMzYgMC0uNjIwNS4yNTIzNTI5NC0uNjY3LjU5MTM3MjU0TC4wMDY4NSAyNC42MzcyNDMxYy0uMDU3LjQxMzQ1MS4yNTc1Ljc4MjAzOTMuNjY2NS43ODIwMzkzaDQuODU0Yy4zMzY1IDAgLjYyMTUtLjI1MzM3MjYuNjY3NS0uNTkyOTAybDEuMjcyLTkuNDEyNTA5OGMuMDAxNS0uMDA5MTc2NS4wMDItLjAxODM1My4wMDItLjAyNzUyOTRsLS4wNjk1LTQuODM2NTA5OC4xMzg1LS4wMzUxNzY1IDEuNDU1NSA1LjAxNjQ3MDZjLjAwMjUuMDA3MTM3Mi4wMDUuMDEzNzY0Ny4wMDc1LjAyMDkwMmw0LjAyMTUgOS40NTM4MDM5Yy4xMDY1LjI1MDgyMzUuMzQ5NS40MTM0NTEuNjE3NS40MTM0NTFoNS4yNTY1Yy4zMzYgMCAuNjIwNS0uMjUyMzUzLjY2Ny0uNTkxODgyNGwzLjI0OTUtMjMuNjkxNjA3ODRjLjA1NjUtLjQxMjk0MTE4LS4yNTgtLjc4MTUyOTQyLS42NjctLjc4MTUyOTQyaC00LjgyMDVjLS4zMzYgMC0uNjIwNS4yNTE4NDMxNC0uNjY3LjU5MDg2Mjc1bC0xLjQ4IDEwLjc1ODkwMmMtLjAwMS4wMDkxNzY0LS4wMDE1LjAxODg2MjctLjAwMTUuMDI4NTQ5bTkuMzk0IDEzLjY4NjYwMzloNC44NTVjLjMzNiAwIC42MjA1LS4yNTIzNTI5LjY2Ny0uNTkxMzcyNmwzLjI0OS0yMy42OTIxMTc2Yy4wNTY1LS40MTI5NDEyLS4yNTgtLjc4MTUyOTQ0LS42NjctLjc4MTUyOTQ0aC00Ljg1NWMtLjMzNiAwLS42MjA1LjI1MjM1Mjk0LS42NjcuNTkxMzcyNTVsLTMuMjQ5IDIzLjY5MjExNzY4Yy0uMDU2NS40MTI5NDEyLjI1OC43ODE1Mjk0LjY2Ny43ODE1Mjk0TTM2LjYyMTE1LjkwNjA3NDVsLS42MzYgNC40MzIyMzUzYy0uMDU5NS40MTQ0NzA2LjI1NTUuNzg2MTE3NjUuNjY2Ljc4NjExNzY1aDUuMDgwNWMuNDA4NSAwIC43MjMuMzY3NTY4NjMuNjY3NS43ODA1MDk4bC0yLjM5MzUgMTcuNzM0MDM5MjVjLS4wNTU1LjQxMjQzMTMuMjU4NS43OC42NjcuNzhoNC45MjU1Yy4zMzY1IDAgLjYyMS0uMjUyODYyOC42NjctLjU5MjkwMmwyLjQ0NC0xOC4xMDg3NDUxYy4wNDYtLjMzOTUyOTQuMzMwNS0uNTkyOTAxOTUuNjY3LS41OTI5MDE5NWg1LjQ2MjVjLjMzNCAwIC42MTgtLjI0OTgwMzkyLjY2Ni0uNTg3Mjk0MTJsLjYzNy00LjQzMjIzNTNjLjA1OTUtLjQxNDQ3MDU4LS4yNTU1LS43ODYxMTc2NC0uNjY2NS0uNzg2MTE3NjRoLTE4LjE4NzVjLS4zMzQ1IDAtLjYxOC4yNTAzMTM3LS42NjY1LjU4NzI5NDFNNzEuMDM4NyA5LjA5ODM2ODZjLS4xNzQgMS40NTE0MTE3Ny0xLjI4NDUgMi45MDI4MjM1Ny0zLjE5NSAyLjkwMjgyMzU3aC0yLjg2OTVjLS40MSAwLS43MjQ1LS4zNjk2MDc5LS42NjctLjc4MzA1ODlsLjYwNzUtNC4zNjE4ODIzM2MuMDQ3LS4zMzg1MDk4LjMzMTUtLjU5MDM1Mjk0LjY2Ny0uNTkwMzUyOTRoMy4wNjFjMS44NDA1IDAgMi41Njk1IDEuMzEwMTk2MDggMi4zOTYgMi44MzI0NzA2TTY5LjMzNzIuMzU0MjExNzZoLTkuMjQwNWMtLjMzNiAwLS42MjA1LjI1MjM1Mjk0LS42NjcuNTkxMzcyNTRsLTMuMjQ5IDIzLjY5MjExNzdjLS4wNTY1LjQxMjk0MTEuMjU4Ljc4MTUyOTQuNjY3Ljc4MTUyOTRoNC45MjM1Yy4zMzY1IDAgLjYyMTUtLjI1MzM3MjYuNjY3NS0uNTkyOTAybC45NTYtNy4wNzY1ODgyYy4wMjMtLjE2OTc2NDcuMTY1LS4yOTYxOTYxLjMzMzUtLjI5NjE5NjFoLjYzM2MuMTE0NSAwIC4yMjE1LjA1OTY0NzEuMjgzNS4xNTgwMzkybDQuNzAyIDcuNDkxMDU4OGMuMTI0LjE5NzI5NDIuMzM3NS4zMTY1ODgzLjU2NzUuMzE2NTg4M2g2LjA4MWMuNTQ1IDAgLjg2NDUtLjYyNTAxOTYuNTUyLTEuMDgwMjc0NWwtNC45MzQ1LTcuMTkxODA0Yy0uMTE4LS4xNzI4MjM1LS4wNTc1LS40MTI0MzEzLjEyOC0uNTA0NzA1OCAzLjE1MDUtMS41Njk2ODYzIDQuOTc5NS0zLjE3ODExNzcgNS41ODMtNy42NTAxMTc3LjY5MzUtNS44NzcwMTk2LTIuOTE3LTguNjM4MTE3NjMtNy45ODY1LTguNjM4MTE3NjMiLz48L3N2Zz4=);
			background-size: 63px 16px;
			padding-left: 73px;
		}
		[REPLACE_CLASS_toast].toast-spotify {
			background-color: #1DB954;
			color: #FFF;
		}
		[REPLACE_CLASS_toast].toast-spotify[REPLACE_CLASS_toasticon] {
			background-image: url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iQ2FwYV8xIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDUwOC41MiA1MDguNTIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDUwOC41MiA1MDguNTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iMjRweCIgaGVpZ2h0PSIyNHB4Ij4KPGc+Cgk8Zz4KCQk8Zz4KCQkJPHBhdGggZD0iTTI1NC4yNiwwQzExMy44NDUsMCwwLDExMy44NDUsMCwyNTQuMjZzMTEzLjg0NSwyNTQuMjYsMjU0LjI2LDI1NC4yNiAgICAgczI1NC4yNi0xMTMuODQ1LDI1NC4yNi0yNTQuMjZTMzk0LjY3NSwwLDI1NC4yNiwweiBNMzcxLjY5Niw0MDMuMjg4Yy0zLjE3OCw1LjgxNi05LjEyMiw5LjA1OC0xNS4yODcsOS4wNTggICAgIGMtMi44NiwwLTUuNzIxLTAuNjY3LTguNDIyLTIuMTI5Yy00MC43MTMtMjIuNDM4LTg2Ljk1Ny0zNC4yOTMtMTMzLjY3Ny0zNC4yOTNjLTI4LDAtNTUuNjUxLDQuMTYzLTgyLjEyNiwxMi4zNjMgICAgIGMtOS4yMTcsMi44Ni0xOS4wMDYtMi4yODgtMjEuODM1LTExLjUzN2MtMi44Ni05LjE4NSwyLjI4OC0yOC43LDExLjUzNy0zMS41OTJjMjkuODQ0LTkuMjQ5LDYwLjk1OS0xMy45MjEsOTIuNDU1LTEzLjkyMSAgICAgYzUyLjU2OCwwLDEwNC42NiwxMy4zNDksMTUwLjUyMiwzOC42MTZDMzczLjMxNywzNzQuNDYxLDM3Ni40LDM5NC44NjYsMzcxLjY5Niw0MDMuMjg4eiBNNDA0LjAxOSwzMDcuNTI3ICAgICBjLTMuNjIzLDcuMDI0LTEwLjc0MiwxOC4zMzgtMTguMDg0LDE4LjMzOGMtMy4yMSwwLTYuMzg4LTAuNjk5LTkuMzc2LTIuMzJjLTUwLjQ3MS0yNi4xODktMTA1LjA0MS0zOS40NzQtMTYyLjIxOC0zOS40NzQgICAgIGMtMzEuNDk2LDAtNjIuNzcsNC4xMzItOTIuOTY0LDEyLjQ1OWMtMTAuOTAxLDIuOTU2LTIyLjA4OS0zLjQwMS0yNS4wNDUtMTQuMzAyYy0yLjkyNC0xMC45MDEsMy40NjQtMjkuNDMxLDE0LjMzNC0zMi4zODYgICAgIGMzMy42ODktOS4xODUsNjguNTg3LTEzLjg1NywxMDMuNjc0LTEzLjg1N2M2Mi44OTgsMCwxMjUuNDQ1LDE1LjI1NiwxODAuOTM4LDQ0LjExNCAgICAgQzQwNS4yOSwyODUuMjQ4LDQwOS4xOTksMjk3LjUxNiw0MDQuMDE5LDMwNy41Mjd6IE00MTcuNTI2LDIzMC44MzZjLTMuNDY0LDAtNy4wMjQtMC43OTUtMTAuMzYxLTIuNDQ3ICAgICBjLTYwLjIyOC0zMC4wMzQtMTI1LjA5Ni00NS4yMjYtMTkyLjc2MS00NS4yMjZjLTM1LjI3OSwwLTcwLjQzLDQuMjkxLTEwNC41MzMsMTIuNzEzYy0xMi41MjIsMy4wODMtMjUuMTQtNC41MTMtMjguMjIzLTE3LjAwNCAgICAgYy0zLjExNS0xMi40NTksNC41MTMtMjcuNTU1LDE3LjAwNC0zMC42MzhjMzcuNzI2LTkuMzc2LDc2LjY1OS0xNC4xMTEsMTE1LjcyLTE0LjExMWM3NC45NzUsMCwxNDYuODY3LDE2Ljg3NywyMTMuNTc4LDUwLjEyMSAgICAgYzExLjUzNyw1Ljc1MywxNi4yNDEsMTkuNzM3LDEwLjQ4OCwzMS4yNDJDNDM0LjMwOCwyMjMuNjUzLDQyNi4xMDgsMjMwLjgzNiw0MTcuNTI2LDIzMC44MzZ6IiBmaWxsPSIjRkZGRkZGIi8+CgkJPC9nPgoJPC9nPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+CjxnPgo8L2c+Cjwvc3ZnPgo=);
		}
		[REPLACE_CLASS_toast].toast-streamermode {
			background-color: #593695;
			color: #FFF;
		}
		[REPLACE_CLASS_toast].toast-streamermode[REPLACE_CLASS_toasticon] {
			background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHg9IjBweCIgeT0iMHB4IiB2aWV3Qm94PSItMjUgLTI1IDU0MiA1NDIiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQ5MiA0OTI7IiB4bWw6c3BhY2U9InByZXNlcnZlIiB3aWR0aD0iNTEycHgiIGhlaWdodD0iNTEycHgiPjxwYXRoIGQ9Ik00ODguMywxNDIuNXYyMDMuMWMwLDE1LjctMTcsMjUuNS0zMC42LDE3LjdsLTg0LjYtNDguOHYxMy45YzAsNDEuOC0zMy45LDc1LjctNzUuNyw3NS43SDc1LjdDMzMuOSw0MDQuMSwwLDM3MC4yLDAsMzI4LjQgICBWMTU5LjljMC00MS44LDMzLjktNzUuNyw3NS43LTc1LjdoMjIxLjhjNDEuOCwwLDc1LjcsMzMuOSw3NS43LDc1Ljd2MTMuOWw4NC42LTQ4LjhDNDcxLjMsMTE3LDQ4OC4zLDEyNi45LDQ4OC4zLDE0Mi41eiIgZmlsbD0iI0ZGRkZGRiIvPjwvc3ZnPg==);
		}
		[REPLACE_CLASS_toast].toast-success {
			background-color: #43B581;
			color: #FFF;
		}
		[REPLACE_CLASS_toast].toast-success[REPLACE_CLASS_toasticon] {
			background-image: url(data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjRkZGRkZGIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPiAgICA8cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTIgMTVsLTUtNSAxLjQxLTEuNDFMMTAgMTQuMTdsNy41OS03LjU5TDE5IDhsLTkgOXoiLz48L3N2Zz4=);
		}
		[REPLACE_CLASS_toast].toast-warning,
		[REPLACE_CLASS_toast].toast-warn {
			background-color: #FFA600;
			color: #FFF;
		}
		[REPLACE_CLASS_toast].toast-warning[REPLACE_CLASS_toasticon],
		[REPLACE_CLASS_toast].toast-warn[REPLACE_CLASS_toasticon] {
			background-image: url(data:image/svg+xml;base64,PHN2ZyBmaWxsPSIjRkZGRkZGIiBoZWlnaHQ9IjI0IiB2aWV3Qm94PSIwIDAgMjQgMjQiIHdpZHRoPSIyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4gICAgPHBhdGggZD0iTTAgMGgyNHYyNEgweiIgZmlsbD0ibm9uZSIvPiAgICA8cGF0aCBkPSJNMSAyMWgyMkwxMiAyIDEgMjF6bTEyLTNoLTJ2LTJoMnYyem0wLTRoLTJ2LTRoMnY0eiIvPjwvc3ZnPg==);
		}`;
		const InternalData = {
			"LibraryRequires": ["child_process", "electron", "fs", "path", "process", "request"],
			"DiscordObjects": {
				"Channel": {"props": ["getRecipientId", "isManaged", "getGuildId"]},
				"Guild": {"props": ["getIconURL", "getMaxEmojiSlots", "getRole"]},
				"Invite": {"props": ["getExpiresAt", "isExpired"]},
				"Message": {"props": ["getReaction", "getAuthorName", "getChannelId"]},
				"Messages": {"props": ["jumpToMessage", "hasAfterCached", "forEach"]},
				"Relationship": {"protos": ["comparator"], "array": true},
				"Timestamp": {"props": ["add", "dayOfYear", "hasAlignedHourOffset"]},
				"User": {"props": ["hasFlag", "isLocalBot", "isClaimed"]}
			},
			"LibraryModules": {
				"AckUtils": {"props": ["localAck", "bulkAck"]},
				"ActivityUtils": {"props": ["sendActivityInvite", "updateActivity"]},
				"APIUtils": {"props": ["getAPIBaseURL"]},
				"AnalyticsUtils": {"props": ["isThrottled", "track"]},
				"AnimationUtils": {"props": ["spring", "decay"]},
				"ArrayUtils": {"props": ["isArrayLike", "zipObject"]},
				"AssetUtils": {"props": ["getAssetImage", "getAssetIds"]},
				"AutocompleteOptions": {"props": ["AUTOCOMPLETE_OPTIONS"]},
				"AutocompleteSentinels": {"props": ["CHANNEL_SENTINEL", "COMMAND_SENTINEL"]},
				"BadgeUtils": {"props": ["getBadgeCountString", "getBadgeWidthForValue"]},
				"CallUtils": {"props": ["getCalls", "isCallActive"]},
				"CategoryCollapseStore": {"props": ["getCollapsedCategories", "isCollapsed"]},
				"CategoryCollapseUtils": {"props": ["categoryCollapse", "categoryCollapseAll"]},
				"ChannelStore": {"props": ["getChannel", "getDMFromUserId"]},
				"ColorUtils": {"props": ["hex2int", "hex2rgb"]},
				"ContextMenuUtils": {"props": ["closeContextMenu", "openContextMenu"]},
				"CopyLinkUtils": {"props": ["SUPPORTS_COPY", "copy"]},
				"CurrentUserStore": {"props": ["getCurrentUser"]},
				"CurrentVoiceUtils": {"props": ["getAveragePing", "isConnected"]},
				"DirectMessageStore": {"props": ["getPrivateChannelIds"]},
				"DirectMessageUnreadStore": {"props": ["getUnreadPrivateChannelIds"]},
				"DispatchApiUtils": {"props": ["dirtyDispatch", "isDispatching"]},
				"DispatchUtils": {"props": ["ComponentDispatch"]},
				"DirectMessageUtils": {"props": ["addRecipient", "openPrivateChannel"]},
				"EmojiUtils": {"props": ["translateInlineEmojiToSurrogates", "translateSurrogatesToInlineEmoji"]},
				"EmojiStateUtils": {"props": ["getURL", "isEmojiDisabled"]},
				"FriendUtils": {"props": ["getFriendIDs", "getRelationships"]},
				"FolderStore": {"props": ["getGuildFolderById", "getFlattenedGuilds"]},
				"FolderUtils": {"props": ["isFolderExpanded", "getExpandedFolders"]},
				"GuildBoostUtils": {"props": ["getTierName", "getUserLevel"]},
				"GuildChannelStore": {"props": ["getChannels", "getDefaultChannel"]},
				"GuildEmojiStore": {"props": ["getGuildEmoji", "getDisambiguatedEmojiContext"]},
				"GuildNotificationsUtils": {"props": ["updateChannelOverrideSettings", "updateGuildNotificationSettings"]},
				"GuildSettingsSectionUtils": {"props": ["getGuildSettingsSections"]},
				"GuildSettingsUtils": {"props": ["open", "updateGuild"]},
				"GuildStore": {"props": ["getGuild", "getGuilds"]},
				"GuildUnavailableStore": {"props": ["isUnavailable", "totalUnavailableGuilds"]},
				"GuildUtils": {"props": ["transitionToGuildSync"]},
				"GuildWelcomeStore": {"props": ["hasSeen", "get"]},
				"GuildWelcomeUtils": {"props": ["welcomeScreenViewed", "resetWelcomeScreen"]},
				"HistoryUtils": {"props": ["transitionTo", "replaceWith", "getHistory"]},
				"IconUtils": {"props": ["getGuildIconURL", "getGuildBannerURL"]},
				"InviteUtils": {"props": ["acceptInvite", "createInvite"]},
				"KeyCodeUtils": {"props": ["toCombo", "keyToCode"], "assign": true},
				"KeyEvents": {"props": ["aliases", "code", "codes"]},
				"LanguageStore": {"props": ["getLanguages", "Messages"]},
				"LastChannelStore": {"props": ["getLastSelectedChannelId"]},
				"LastGuildStore": {"props": ["getLastSelectedGuildId"]},
				"LinkUtils": {"props": ["handleClick", "isLinkTrusted"]},
				"LoginUtils": {"props": ["login", "logout"]},
				"MediaDeviceUtils": {"props": ["getOutputDevices", "getInputDevices"]},
				"MediaDeviceSetUtils": {"props": ["setOutputDevice", "setInputDevice"]},
				"MemberCountUtils": {"props": ["getMemberCount", "getMemberCounts"]},
				"MemberStore": {"props": ["getMember", "getMembers"]},
				"MentionUtils": {"props": ["isRawMessageMentioned", "isMentioned"]},
				"MessageManageUtils": {"props": ["copyLink", "replyToMessage"]},
				"MessagePinUtils": {"props": ["pinMessage", "unpinMessage"]},
				"MessageReplyStore": {"props": ["getPendingReply"]},
				"MessageReplyUtils": {"props": ["createPendingReply", "deletePendingReply"]},
				"MessageStore": {"props": ["getMessage", "getMessages"]},
				"MessageUtils": {"props": ["receiveMessage", "editMessage"]},
				"ModalUtils": {"props": ["openModal", "hasModalOpen"]},
				"MutedUtils": {"props": ["isGuildOrCategoryOrChannelMuted"]},
				"NoteStore": {"props": ["getNote"]},
				"NotificationSettingsStore": {"props": ["getDesktopType", "getTTSType"]},
				"NotificationSettingsUtils": {"props": ["setDesktopType", "setTTSType"]},
				"NotificationUtils": {"props": ["makeTextChatNotification", "shouldNotify"]},
				"PlatformUtils": {"props": ["isWindows", "isLinux"]},
				"PermissionUtils": {"props": ["getChannelPermissions", "can"]},
				"PermissionRoleUtils": {"props": ["canEveryone", "can"]},
				"PreferencesContext": {"props": ["AccessibilityPreferencesContext"]},
				"QueryUtils": {"props": ["AutocompleterQuerySymbols", "AutocompleterResultTypes"]},
				"ReactionEmojiUtils": {"props": ["getReactionEmojiName", "getReactionEmojiName"]},
				"ReactionUtils": {"props": ["addReaction", "removeReaction"]},
				"RecentMentionUtils": {"props": ["deleteRecentMention", "fetchRecentMentions"]},
				"SearchPageUtils": {"props": ["searchNextPage", "searchPreviousPage"]},
				"SelectChannelUtils": {"props": ["selectChannel", "selectPrivateChannel"]},
				"SettingsUtils": {"props": ["updateRemoteSettings", "updateLocalSettings"]},
				"SimpleMarkdownParser": {"props": ["parseBlock", "parseInline", "defaultOutput"]},
				"SlateUtils": {"props": ["serialize", "deserialize"], "notProps": ["getFlag"]},
				"SlateSelectionUtils": {"props": ["serialize", "serializeSelection"]},
				"SlowmodeUtils": {"props": ["getSlowmodeCooldownGuess"]},
				"SoundStateUtils": {"props": ["isSoundDisabled", "getDisabledSounds"]},
				"SoundUtils": {"props": ["playSound", "createSound"]},
				"SpellCheckUtils": {"props": ["learnWord", "toggleSpellcheck"]},
				"SpotifyTrackUtils": {"props": ["hasConnectedAccount", "getLastPlayedTrackId"]},
				"SpotifyUtils": {"props": ["setActiveDevice", "pause"]},
				"StateStoreUtils": {"props": ["useStateFromStores", "useStateFromStoresArray"]},
				"StatusMetaUtils": {"props": ["getApplicationActivity", "getStatus"]},
				"StoreChangeUtils": {"props": ["get", "set", "clear", "remove"]},
				"StreamerModeStore": {"props": ["disableSounds", "hidePersonalInformation"]},
				"StreamUtils": {"props": ["getActiveStreamForUser", "getAllApplicationStreams"]},
				"StringUtils": {"props": ["cssValueToNumber", "upperCaseFirstChar"]},
				"TimestampUtils": {"props": ["fromTimestamp", "extractTimestamp"]},
				"UnreadGuildUtils": {"props": ["hasUnread", "getUnreadGuilds"]},
				"UnreadChannelUtils": {"props": ["getUnreadCount", "getOldestUnreadMessageId"]},
				"UploadUtils": {"props": ["upload", "instantBatchUpload"]},
				"URLParser": {"props": ["parse", "resolveObject"]},
				"UserFetchUtils": {"props": ["fetchCurrentUser", "getUser"]},
				"UserNameUtils": {"props": ["getName", "getNickname"]},
				"UserProfileUtils": {"props": ["open", "fetchProfile"]},
				"UserSettingsUtils": {"props": ["open", "updateAccount"]},
				"UserStore": {"props": ["getUser", "getUsers"]},
				"Utilities": {"props": ["flatMap", "cloneDeep"]},
				"VoiceUtils": {"props": ["getAllVoiceStates", "getVoiceStatesForChannel"]},
				"ZoomUtils": {"props": ["setZoom", "setFontSize"]}
			},
			"ModuleUtilsConfig": {
				"PatchTypes": [
					"before",
					"instead",
					"after"
				],
				"InstanceFunctions": [
					"render",
					"componentDidMount",
					"componentDidUpdate",
					"componentWillUnmount"
				],
				"PatchMap": {
					"BannedCard": "BannedUser",
					"ChannelWindow": "Channel",
					"InvitationCard": "InviteRow",
					"InviteCard": "InviteRow",
					"MemberCard": "Member",
					"PopoutContainer": "Popout",
					"QuickSwitchResult": "Result",
					"UserProfile": "UserProfileBody"
				},
				"ForceObserve": [
					"DirectMessage",
					"GuildIcon"
				],
				"MemoComponent": [
					"ChannelAutoComplete",
					"ChannelCategoryItem",
					"EmojiPicker",
					"ExpressionPicker",
					"InviteGuildName",
					"GuildFolder",
					"Messages",
					"MessageContent",
					"NowPlayingHeader"
				],
				"SubRender": [
					"GuildFolder"
				],
				"NonPrototype": [
					"ChannelAutoComplete",
					"ChannelTextAreaContainer"
				],
				"Finder": {
					"Account": {"class": "accountinfo"},
					"App": {"class": "app"},
					"AppSkeleton": {"class": "app"},
					"AppView": {"class": "appcontainer"},
					"AuthWrapper": {"class": "loginscreen"},
					"Avatar": {"props": ["AnimatedAvatar"]},
					"BannedCard": {"class": "guildsettingsbannedcard"},
					"Category": {"class": "categorycontainerdefault"},
					"ChannelAutoComplete": {"strings": ["hidePersonalInformation", "canExecuteCommands"]},
					"ChannelCall": {"class": "callcurrentcontainer"},
					"ChannelCategoryItem": {"strings": ["muted", "channel", "collapsed"]},
					"ChannelMember": {"class": "member"},
					"ChannelMembers": {"class": "members"},
					"ChannelMention": {"props": ["ChannelMention"]},
					"Channels": {"class": "guildchannels"},
					"ChannelTextAreaForm": {"class": "chatform"},
					"ChannelWindow": {"class": "chatcontent"},
					"CustomStatusModal": {"class": "emojiinputmodal"},
					"DirectMessage": {"class": "guildouter"},
					"EmojiPicker": {"strings": ["allowManagedEmojis", "EMOJI_PICKER_TAB_PANEL_ID", "diversitySelector"]},
					"FocusRing": {"props": ["FocusRingScope"]},
					"Guild": {"class": "guildouter"},
					"GuildFolder": {"class": "guildfolderwrapper", "special": [{"path": "return.memoizedProps.folderId"}, {"path": "return.memoizedProps.guildIds"}]},
					"GuildIcon": {"class": "avataricon"},
					"GuildRoleSettings": {"class": "settingswindowcontentregion"},
					"Guilds": {"class": "guildswrapper"},
					"GuildSettings": {"class": "layer"},
					"GuildSettingsBans": {"class": "guildsettingsbannedcard"},
					"GuildSettingsEmoji": {"class": "guildsettingsemojicard"},
					"GuildSettingsMembers": {"class": "guildsettingsmembercard"},
					"GuildSidebar": {"class": "guildchannels"},
					"I18nLoaderWrapper": {"class": "app"},
					"InstantInviteModal": {"class": "invitemodalwrapper"},
					"InvitationCard": {"class": "invitemodalinviterow"},
					"InviteGuildName": {"props": ["GuildName", "GuildTemplateName"]},
					"InviteCard": {"class": "guildsettingsinvitecard"},
					"MemberCard": {"class": "guildsettingsmembercard"},
					"MessageHeader": {"props": ["MessageTimestamp"]},
					"Messages": {"strings": ["group-spacing-", "canManageMessages"]},
					"MessageUsername": {"strings": ["default.username", "colorString", "compact"]},
					"ModalLayer": {"class": "layermodal"},
					"MutualGuilds": {"class": "userprofilebody"},
					"MutualFriends": {"class": "userprofilebody"},
					"Note": {"class": "usernotetextarea"},
					"PopoutContainer": {"class": "popout"},
					"Popouts": {"class": "popouts"},
					"PrivateChannelCall": {"class": "callcurrentcontainer"},
					"PrivateChannelCallParticipants": {"class": "callcurrentcontainer"},
					"PrivateChannelRecipientsInvitePopout": {"class": "searchpopoutdmaddpopout"},
					"PrivateChannelsList": {"class": "dmchannelsscroller"},
					"QuickSwitchChannelResult": {"class": "quickswitchresult"},
					"QuickSwitchGuildResult": {"class": "quickswitchresult"},
					"QuickSwitchResult": {"class": "quickswitchresult"},
					"Reaction": {"class": "messagereactionme"},
					"Reactor": {"class": "messagereactionsmodalreactor"},
					"ReactorsComponent": {"class": "messagereactionsmodalreactor"},
					"RTCConnection": {"class": "voicedetails"},
					"SearchResults": {"class": "searchresultswrap"},
					"SearchResultsInner": {"strings": ["SEARCH_HIDE_BLOCKED_MESSAGES", "totalResults", "SEARCH_PAGE_SIZE"]},
					"TypingUsers": {"class": "typing"},
					"UnavailableGuildsButton": {"props": ["UnavailableGuildsButton"]},
					"UnreadDMs": {"class": "guildsscroller"},
					"Upload": {"class": "uploadmodal"},
					"UserHook": {"class": "auditloguserhook"},
					"UserMention": {"props": ["UserMention"]},
					"UserPopout": {"class": "userpopout"},
					"UserProfile": {"class": "userprofile"},
					"UserSettingsAppearance": {"class": "usersettingsappearancepreview"},
					"V2C_ContentColumn": {"class": "settingswindowcontentcolumn", "special": [{"path": "return.stateNode.props.title", "value": ["PLUGINS", "THEMES"]}]}
				},
				"LoadedInComponents": {
					"AutocompleteChannelResult": "LibraryComponents.AutocompleteItems.Channel",
					"AutocompleteUserResult": "LibraryComponents.AutocompleteItems.User",
					"QuickSwitchChannelResult": "LibraryComponents.QuickSwitchItems.Channel",
					"QuickSwitchGroupDMResult": "LibraryComponents.QuickSwitchItems.GroupDM",
					"QuickSwitchGuildResult": "LibraryComponents.QuickSwitchItems.Guild",
					"QuickSwitchUserResult": "LibraryComponents.QuickSwitchItems.User"
				}
			},
			"NativeSubComponents": {
				"Button": {"props": ["Colors", "Hovers", "Looks"]},
				"Checkbox": {"name": "Checkbox"},
				"Clickable": {"name": "Clickable"},
				"FavButton": {"name": "GIFFavButton"},
				"KeybindRecorder": {"name": "KeybindRecorder"},
				"MenuCheckboxItem": {"name": "MenuCheckboxItem"},
				"MenuControlItem": {"name": "MenuControlItem"},
				"MenuItem": {"name": "MenuItem"},
				"PopoutContainer": {"name": "Popout"},
				"QuickSelect": {"name": "QuickSelectWrapper"},
				"RadioGroup": {"name": "RadioGroup"},
				"SearchBar": {"name": "SearchBar", "protos": ["focus"]},
				"Select": {"name": "SelectTempWrapper"},
				"Slider": {"name": "Slider"},
				"Switch": {"name": "Switch"},
				"TabBar": {"name": "TabBar"},
				"Table": {"name": "Table"},
				"TextArea": {"name": "TextArea"},
				"TextInput": {"name": "TextInput"},
				"TooltipContainer": {"name": "Tooltip"}
			},
			"LibraryComponents": {
				"Anchor": {"name": "Anchor"},
				"Animations": {"props": ["Controller", "Spring"], "assign": true},
				"AutocompleteItems": {"props": ["Generic", "User", "Command"]},
				"AutocompleteMenu": {"name": "Autocomplete"},
				"AvatarComponents": {"props": ["AnimatedAvatar"]},
				"Badges": {"props": ["IconBadge", "NumberBadge"], "assign": true},
				"CardRemoveButton": {"name": "RemoveButton"},
				"Checkmark": {"name": "Checkmark"},
				"Connectors": {"props": ["Router", "Link"], "assign": true},
				"DiscordTag": {"name": "DiscordTag"},
				"Emoji": {"strings": ["emojiName", "shouldAnimate", "jumboable"], "value": "default"},
				"EmojiButton": {"name": "EmojiButton"},
				"EmojiPicker": {"strings": ["allowManagedEmojis", "EMOJI_PICKER_TAB_PANEL_ID", "diversitySelector"]},
				"Flex": {"props": ["Wrap", "Direction", "Child"]},
				"FlowerStarIcon": {"name": "FlowerStarIcon"},
				"FocusRingScope": {"props": ["FocusRingScope"], "value": "default"},
				"FormComponents": {"props": ["FormSection", "FormText"], "assign": true},
				"GuildComponents Badge": {"name": "GuildBadge"},
				"GuildComponents BlobMask": {"name": "BlobMask"},
				"GuildComponents Icon": {"name": "GuildIconWrapper"},
				"GuildComponents Items": {"props": ["Separator", "DragPlaceholder"]},
				"GuildComponents Pill": {"strings": ["opacity:1,height:", "20:8", "default.item"]},
				"HeaderBarComponents": {"name": "HeaderBarContainer"},
				"Image": {"props": ["ImageReadyStates"]},
				"ImageModal": {"name": "ImageModal"},
				"LazyImage": {"name": "LazyImage"},
				"ListHeader": {"name": "ListSectionItem"},
				"Mask": {"name": "Mask"},
				"Menu": {"name": "Menu"},
				"MenuItems": {"props": ["MenuItem", "MenuGroup"], "assign": true},
				"MenuItems Colors": {"props": ["MenuItemColor"], "value": "MenuItemColor"},
				"MessageGroup": {"name": "ChannelMessage"},
				"MessagesPopoutComponents": {"props": ["Header", "EmptyStateBottom"]},
				"ModalComponents": {"props": ["ModalContent", "ModalFooter"], "assign": true},
				"NavItem": {"name": "NavItem"},
				"PopoutFocusLock": {"strings": ["useFocusLock", "useImperativeHandle"]},
				"PrivateChannelItems": {"props": ["DirectMessage", "GroupDM"]},
				"QuickSwitchItems": {"props": ["Channel", "GroupDM", "Header"]},
				"QuickSwitchMenu": {"name": "QuickSwitcher"},
				"Scrollers Auto": {"props": ["AdvancedScrollerThin", "AdvancedScrollerAuto"], "value": "AdvancedScrollerAuto"},
				"Scrollers None": {"props": ["AdvancedScrollerThin", "AdvancedScrollerAuto"], "value": "AdvancedScrollerNone"},
				"Scrollers Thin": {"props": ["AdvancedScrollerThin", "AdvancedScrollerAuto"], "value": "AdvancedScrollerThin"},
				"Spinner": {"name": "Spinner"},
				"TextElement": {"name": "Text"},
				"UserPopout": {"name": "UserPopout"},
				"UserSummaryItem": {"name": "UserSummaryItem"}
			},
			"SvgIcons": {
				"ARROW_DOWN": {
					"defaultProps": {
						"width": 18,
						"height": 18
					},
					"icon": "<svg name='ArrowDown' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 18 18'><path fill='%%color' d='M4 7l5 5 5-5H4z'></path></svg>"
				},
				"ARROW_UP": {
					"defaultProps": {
						"width": 18,
						"height": 18
					},
					"icon": "<svg name='ArrowUp' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 18 18'><path fill='%%color' d='M4 11l5-5 5 5H4z'></path></svg>"
				},
				"CHANGELOG": {
					"icon": "<svg name='ChangeLog' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 448 448'><g fill='%%color'><polygon points='234.667, 138.667 234.667, 245.333 325.973, 299.52 341.333, 273.6 266.667, 229.333 266.667, 138.667'></polygon><path d='M 255.893, 32 C 149.76, 32, 64, 117.973, 64, 224 H 0 l 83.093, 83.093 l 1.493, 3.093 L 170.667, 224 h -64 c 0 -82.453, 66.88 -149.333, 149.333 -149.333 S 405.333, 141.547, 405.333, 224 S 338.453, 373.333, 256, 373.333 c -41.28, 0 -78.507 -16.853 -105.493 -43.84 L 120.32, 359.68 C 154.987, 394.453, 202.88, 416, 255.893, 416 C 362.027, 416, 448, 330.027, 448, 224 S 362.027, 32, 255.893, 32 z'></path></g></svg>"
				},
				"CHECKBOX": {
					"defaultProps": {
						"background": "",
						"foreground": ""
					},
					"icon": "<svg aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><path fill-rule='evenodd' clip-rule='evenodd' d='M5.37499 3H18.625C19.9197 3 21.0056 4.08803 21 5.375V18.625C21 19.936 19.9359 21 18.625 21H5.37499C4.06518 21 3 19.936 3 18.625V5.375C3 4.06519 4.06518 3 5.37499 3Z' class='%%background' fill='%%color'></path><path d='M9.58473 14.8636L6.04944 11.4051L4.50003 12.9978L9.58473 18L19.5 8.26174L17.9656 6.64795L9.58473 14.8636Z' class='%%foreground' fill='%%color'></path></svg>"
				},
				"CHECKBOX_EMPTY": {
					"defaultProps": {
						"foreground": ""
					},
					"icon": "<svg name='CheckBoxEmpty' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><path fill-rule='evenodd' clip-rule='evenodd' d='M18.625 3H5.375C4.06519 3 3 4.06519 3 5.375V18.625C3 19.936 4.06519 21 5.375 21H18.625C19.936 21 21 19.936 21 18.625V5.375C21.0057 4.08803 19.9197 3 18.625 3ZM19 19V5H4.99999V19H19Z' class='%%foreground' fill='%%color'></path></svg>"
				},
				"CHECKMARK": {
					"defaultProps": {
						"width": 18,
						"height": 18
					},
					"icon": "<svg name='Checkmark' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 18 18'><g fill='none' fill-rule='evenodd'><polyline stroke='%%color' stroke-width='2' points='3.5 9.5 7 13 15 5'></polyline></g></svg>"
				},
				"CLOSE": {
					"defaultProps": {
						"width": 12,
						"height": 12
					},
					"icon": "<svg name='Close' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 12 12'><g fill='none' fill-rule='evenodd' aria-hidden='true'><path d='M0 0h12v12H0'></path><path fill='%%color' d='M9.5 3.205L8.795 2.5 6 5.295 3.205 2.5l-.705.705L5.295 6 2.5 8.795l.705.705L6 6.705 8.795 9.5l.705-.705L6.705 6'></path></g></svg>"
				},
				"CLOSE_CIRCLE": {
					"icon": "<svg name='CloseCircle' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 14 14'><path fill='%%color' d='M7.02799 0.333252C3.346 0.333252 0.361328 3.31792 0.361328 6.99992C0.361328 10.6819 3.346 13.6666 7.02799 13.6666C10.71 13.6666 13.6947 10.6819 13.6947 6.99992C13.6947 3.31792 10.7093 0.333252 7.02799 0.333252ZM10.166 9.19525L9.22333 10.1379L7.02799 7.94325L4.83266 10.1379L3.89 9.19525L6.08466 6.99992L3.88933 4.80459L4.832 3.86259L7.02733 6.05792L9.22266 3.86259L10.1653 4.80459L7.97066 6.99992L10.166 9.19525Z'></path></svg>"
				},
				"COG": {
					"defaultProps": {
						"width": 20,
						"height": 20
					},
					"icon": "<svg name='Cog' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><path fill='%%color' d='M19.738 10H22V14H19.739C19.498 14.931 19.1 15.798 18.565 16.564L20 18L18 20L16.565 18.564C15.797 19.099 14.932 19.498 14 19.738V22H10V19.738C9.069 19.498 8.203 19.099 7.436 18.564L6 20L4 18L5.436 16.564C4.901 15.799 4.502 14.932 4.262 14H2V10H4.262C4.502 9.068 4.9 8.202 5.436 7.436L4 6L6 4L7.436 5.436C8.202 4.9 9.068 4.502 10 4.262V2H14V4.261C14.932 4.502 15.797 4.9 16.565 5.435L18 3.999L20 5.999L18.564 7.436C19.099 8.202 19.498 9.069 19.738 10ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z'></path></svg>"
				},
				"CROWN": {
					"icon": "<svg name='Crown' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 16 16'><path fill-rule='evenodd' clip-rule='evenodd' d='M13.6572 5.42868C13.8879 5.29002 14.1806 5.30402 14.3973 5.46468C14.6133 5.62602 14.7119 5.90068 14.6473 6.16202L13.3139 11.4954C13.2393 11.7927 12.9726 12.0007 12.6666 12.0007H3.33325C3.02725 12.0007 2.76058 11.792 2.68592 11.4954L1.35258 6.16202C1.28792 5.90068 1.38658 5.62602 1.60258 5.46468C1.81992 5.30468 2.11192 5.29068 2.34325 5.42868L5.13192 7.10202L7.44592 3.63068C7.46173 3.60697 7.48377 3.5913 7.50588 3.57559C7.5192 3.56612 7.53255 3.55663 7.54458 3.54535L6.90258 2.90268C6.77325 2.77335 6.77325 2.56068 6.90258 2.43135L7.76458 1.56935C7.89392 1.44002 8.10658 1.44002 8.23592 1.56935L9.09792 2.43135C9.22725 2.56068 9.22725 2.77335 9.09792 2.90268L8.45592 3.54535C8.46794 3.55686 8.48154 3.56651 8.49516 3.57618C8.51703 3.5917 8.53897 3.60727 8.55458 3.63068L10.8686 7.10202L13.6572 5.42868ZM2.66667 12.6673H13.3333V14.0007H2.66667V12.6673Z' fill='%%color' aria-hidden='true'></path></svg>"
				},
				"DOWNLOAD": {
					"defaultProps": {
						"foreground": ""
					},
					"icon": "<svg name='Download' fill='%%color' aria-hidden='false' width='%%width' height='%%height' viewBox='-2 -2 28 28'><path class='%%foreground' fill-rule='evenodd' clip-rule='evenodd' d='M16.293 9.293L17.707 10.707L12 16.414L6.29297 10.707L7.70697 9.293L11 12.586V2H13V12.586L16.293 9.293ZM18 20V18H20V20C20 21.102 19.104 22 18 22H6C4.896 22 4 21.102 4 20V18H6V20H18Z' aria-hidden='true'></path></svg>"
				},
				"DROPPER": {
					"defaultProps": {
						"width": 16,
						"height": 16,
						"foreground": ""
					},
					"icon": "<svg width='%%width' height='%%height' viewBox='0 0 16 16'><g fill='none'><path d='M-4-4h24v24H-4z'></path><path class='%%foreground' fill='%%color' d='M14.994 1.006C13.858-.257 11.904-.3 10.72.89L8.637 2.975l-.696-.697-1.387 1.388 5.557 5.557 1.387-1.388-.697-.697 1.964-1.964c1.13-1.13 1.3-2.985.23-4.168zm-13.25 10.25c-.225.224-.408.48-.55.764L.02 14.37l1.39 1.39 2.35-1.174c.283-.14.54-.33.765-.55l4.808-4.808-2.776-2.776-4.813 4.803z'></path></g></svg>"
				},
				"FOLDER": {
					"icon": "<svg name='Folder' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><path fill='%%color' d='M20 7H12L10.553 5.106C10.214 4.428 9.521 4 8.764 4H3C2.447 4 2 4.447 2 5V19C2 20.104 2.895 21 4 21H20C21.104 21 22 20.104 22 19V9C22 7.896 21.104 7 20 7Z'></path></svg>"
				},
				"GITHUB": {
					"icon": "<svg name='Github' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><g fill='%%color'><path d='m12 .5c-6.63 0-12 5.28-12 11.792 0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.803 2.809 1.282 3.495.981.108-.763.417-1.282.76-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.235-3.164-.135-.298-.54-1.497.105-3.121 0 0 1.005-.316 3.3 1.209.96-.262 1.98-.392 3-.398 1.02.006 2.04.136 3 .398 2.28-1.525 3.285-1.209 3.285-1.209.645 1.624.24 2.823.12 3.121.765.825 1.23 1.877 1.23 3.164 0 4.53-2.805 5.527-5.475 5.817.42.354.81 1.077.81 2.182 0 1.578-.015 2.846-.015 3.229 0 .309.21.678.825.56 4.801-1.548 8.236-5.97 8.236-11.173 0-6.512-5.373-11.792-12-11.792z'></path></g></svg>"
				},
				"GRADIENT": {
					"defaultProps": {
						"width": 36,
						"height": 36
					},
					"icon": "<svg name='Gradient' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 36 36'><g fill='%%color' fill-rule='evenodd'><path d='M 5 0 h 26 c 0 0, 5 0, 5 5 v 26 c 0 0, 0 5, -5 5 h -26 c 0 0, -5 0, -5 -5 v -26 c 0 0, 0 -5, 5 -5 z M 4 4 h 20 v 28 h -20 v -28 z'></path><rect x='12' y='4' width='4' height='4'></rect><rect x='20' y='4' width='4' height='4'></rect><rect x='16' y='8' width='4' height='4'></rect><rect x='12' y='12' width='4' height='4'></rect><rect x='20' y='12' width='4' height='4'></rect><rect x='16' y='16' width='4' height='4'></rect><rect x='12' y='20' width='4' height='4'></rect><rect x='20' y='20' width='4' height='4'></rect><rect x='16' y='24' width='4' height='4'></rect><rect x='12' y='28' width='4' height='4'></rect><rect x='20' y='28' width='4' height='4'></rect></g></svg>"
				},
				"LEFT_CARET": {
					"icon": "<svg name='LeftCaret' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><g fill='none' fill-rule='evenodd'><polygon fill='%%color' fill-rule='nonzero' points='18.35 4.35 16 2 6 12 16 22 18.35 19.65 10.717 12'></polygon><polygon points='0 0 24 0 24 24 0 24'></polygon></g></svg>"
				},
				"LEFT_DOUBLE_CARET": {
					"icon": "<svg name='LeftDoubleCaret' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><g fill='none' fill-rule='evenodd'><polygon fill='%%color' fill-rule='nonzero' points='12.35 4.35 10 2 0 12 10 22 12.35 19.65 4.717 12'></polygon><polygon fill='%%color' fill-rule='nonzero' points='24.35 4.35 22 2 12 12 22 22 24.35 19.65 16.717 12'></polygon><polygon points='0 0 24 0 24 24 0 24'></polygon></g></svg>"
				},
				"LOCK_CLOSED": {
					"icon": "<svg name='LockClosed' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><path fill='%%color' d='M17 11V7C17 4.243 14.756 2 12 2C9.242 2 7 4.243 7 7V11C5.897 11 5 11.896 5 13V20C5 21.103 5.897 22 7 22H17C18.103 22 19 21.103 19 20V13C19 11.896 18.103 11 17 11ZM12 18C11.172 18 10.5 17.328 10.5 16.5C10.5 15.672 11.172 15 12 15C12.828 15 13.5 15.672 13.5 16.5C13.5 17.328 12.828 18 12 18ZM15 11H9V7C9 5.346 10.346 4 12 4C13.654 4 15 5.346 15 7V11Z'></path></svg>"
				},
				"MENU_CARET": {
					"getClassName": {
						"": ["menucaretarrow"],
						"props.open": ["menucaretopen"]
					},
					"icon": "<svg name='MenuCaret' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><g fill='none' fill-rule='evenodd' aria-hidden='true'><path fill='%%color' d='M16.59 8.59004L12 13.17L7.41 8.59004L6 10L12 16L18 10L16.59 8.59004Z'></path></g></svg>"
				},
				"MORE": {
					"icon": "<svg name='More' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><g fill='none' fill-rule='evenodd' aria-hidden='true'><path fill='%%color' d='M7 12.001C7 10.8964 6.10457 10.001 5 10.001C3.89543 10.001 3 10.8964 3 12.001C3 13.1055 3.89543 14.001 5 14.001C6.10457 14.001 7 13.1055 7 12.001ZM14 12.001C14 10.8964 13.1046 10.001 12 10.001C10.8954 10.001 10 10.8964 10 12.001C10 13.1055 10.8954 14.001 12 14.001C13.1046 14.001 14 13.1055 14 12.001ZM19 10.001C20.1046 10.001 21 10.8964 21 12.001C21 13.1055 20.1046 14.001 19 14.001C17.8954 14.001 17 13.1055 17 12.001C17 10.8964 17.8954 10.001 19 10.001Z'></path></g></svg>"
				},
				"NOVA_AT": {
					"icon": "<svg name='Nova_At' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><path fill='%%color' d='M12 2C6.486 2 2 6.486 2 12C2 17.515 6.486 22 12 22C14.039 22 15.993 21.398 17.652 20.259L16.521 18.611C15.195 19.519 13.633 20 12 20C7.589 20 4 16.411 4 12C4 7.589 7.589 4 12 4C16.411 4 20 7.589 20 12V12.782C20 14.17 19.402 15 18.4 15L18.398 15.018C18.338 15.005 18.273 15 18.209 15H18C17.437 15 16.6 14.182 16.6 13.631V12C16.6 9.464 14.537 7.4 12 7.4C9.463 7.4 7.4 9.463 7.4 12C7.4 14.537 9.463 16.6 12 16.6C13.234 16.6 14.35 16.106 15.177 15.313C15.826 16.269 16.93 17 18 17L18.002 16.981C18.064 16.994 18.129 17 18.195 17H18.4C20.552 17 22 15.306 22 12.782V12C22 6.486 17.514 2 12 2ZM12 14.599C10.566 14.599 9.4 13.433 9.4 11.999C9.4 10.565 10.566 9.399 12 9.399C13.434 9.399 14.6 10.565 14.6 11.999C14.6 13.433 13.434 14.599 12 14.599Z'></path></svg>"
				},
				"NOVA_PIN": {
					"icon": "<svg name='Nova_Pin' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><path fill='%%color' d='M22 12L12.101 2.10101L10.686 3.51401L12.101 4.92901L7.15096 9.87801V9.88001L5.73596 8.46501L4.32196 9.88001L8.56496 14.122L2.90796 19.778L4.32196 21.192L9.97896 15.536L14.222 19.778L15.636 18.364L14.222 16.95L19.171 12H19.172L20.586 13.414L22 12Z'></path></svg>"
				},
				"NOVA_TRASH": {
					"icon": "<svg name='Nova_Trash' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><g fill='%%color'><path d='M15 3.999V2H9V3.999H3V5.999H21V3.999H15Z'></path><path d='M5 6.99902V18.999C5 20.101 5.897 20.999 7 20.999H17C18.103 20.999 19 20.101 19 18.999V6.99902H5ZM11 17H9V11H11V17ZM15 17H13V11H15V17Z'></path></g></svg>"
				},
				"OPEN_EXTERNAL": {
					"icon": "<svg name='OpenExternal' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0z'></path><path fill='%%color' d='M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z'></path></svg>"
				},
				"PATREON": {
					"icon": "<svg name='Patreon' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><g fill='%%color'><path d='m 0,0.5 h 4.219 v 23 H 0 Z'></path><path d='m 15.384,0.5 c -4.767,0 -8.644,3.873 -8.644,8.633 0,4.75 3.877,8.61 8.644,8.61 C 20.138,17.743 24,13.878 24,9.133 24,4.374 20.137,0.5 15.384,0.5 Z'></path></g></svg>"
				},
				"PAYPAL": {
					"icon": "<svg name='PayPal' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 32 32'><g fill='%%color' transform='matrix(0.96,0,0,0.96,-0.14,2)'><path d='M 25.772542,2.414 C 24.280605,0.724 21.580605,0 18.126542,0 H 8.1025423 c -0.706,0 -1.306,0.51 -1.418,1.2 L 2.5106048,27.462 c -0.082,0.518 0.322,0.986 0.85,0.986 h 6.188 l 1.5540002,-9.78 -0.048,0.308 c 0.11,-0.69 0.708,-1.2 1.414,-1.2 h 2.94 c 5.778,0 10.3,-2.328 11.622,-9.062 0.04,-0.2 0.102,-0.584 0.102,-0.584 0.375937,-2.492 -0.0021,-4.182 -1.360063,-5.716 z'></path><path d='m 30.199,10.906 c -1.436,6.63 -6.018,10.138 -13.29,10.138 H 14.273 L 12.305,33.5 h 4.276 c 0.618,0 1.144,-0.446 1.24,-1.052 l 0.05,-0.264 0.984,-6.182 0.064,-0.34 c 0.096,-0.606 0.622,-1.052 1.238,-1.052 h 0.782 c 5.054,0 9.01,-2.036 10.166,-7.926 0.464,-2.364 0.24,-4.346 -0.906,-5.778 z'></path></g></svg>"
				},
				"PENCIL": {
					"defaultProps": {
						"width": 16,
						"height": 16
					},
					"icon": "<svg name='Pencil' aria-hidden='false' width='16' height='16' viewBox='0 0 24 24'><path fill='%%color' d='M20.1039 9.58997L20.8239 8.87097C22.3929 7.30197 22.3929 4.74797 20.8239 3.17797C19.2549 1.60897 16.6999 1.60897 15.1309 3.17797L14.4119 3.89797L20.1039 9.58997ZM12.9966 5.30896L4.42847 13.8795L10.1214 19.5709L18.6896 11.0003L12.9966 5.30896ZM3.24398 21.968L8.39998 20.68L3.31998 15.6L2.03098 20.756C1.94598 21.096 2.04598 21.457 2.29398 21.705C2.54198 21.953 2.90298 22.052 3.24398 21.968Z'></path></svg>"
				},
				"PIN": {
					"defaultProps": {
						"width": 16,
						"height": 16
					},
					"icon": "<svg name='Pin' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><g fill='none' fill-rule='evenodd'><path fill='%%color' d='M19 3H5V5H7V12H5V14H11V22H13V14H19V12H17V5H19V3Z'></path></g></svg>"
				},
				"QUOTE": {
					"icon": "<svg name='Quote' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><path fill='%%color' d='M19.8401 5.39392C20.1229 4.73405 19.6389 4 18.921 4H17.1231C16.7417 4 16.3935 4.21695 16.2254 4.55933L13.3297 10.4581C13.195 10.7324 13.125 11.0339 13.125 11.3394V19C13.125 19.5523 13.5727 20 14.125 20H20C20.5523 20 21 19.5523 21 19V12.875C21 12.3227 20.5523 11.875 20 11.875H17.8208C17.4618 11.875 17.2198 11.508 17.3612 11.178L19.8401 5.39392ZM9.71511 5.39392C9.99791 4.73405 9.51388 4 8.79596 4H6.99809C6.61669 4 6.2685 4.21695 6.10042 4.55933L3.20466 10.4581C3.07001 10.7324 3 11.0339 3 11.3394V19C3 19.5523 3.44772 20 4 20H9.875C10.4273 20 10.875 19.5523 10.875 19V12.875C10.875 12.3227 10.4273 11.875 9.875 11.875H7.69577C7.33681 11.875 7.0948 11.508 7.2362 11.178L9.71511 5.39392Z'></path></svg>"
				},
				"RAW_TEXT": {
					"icon": "<svg name='RawText' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><g fill='%%color'><polygon points='0,2 15,2 15,5 9,5 9,22 6,22 6,5 0,5'></polygon><polygon points='13,9 24,9 24,12 20,12 20,22 17,22 17,12 13,12'></polygon></g></svg>"
				},
				"RIGHT_CARET": {
					"icon": "<svg name='RightCaret' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><g fill='none' fill-rule='evenodd'><polygon fill='%%color' fill-rule='nonzero' points='8.47 2 6.12 4.35 13.753 12 6.12 19.65 8.47 22 18.47 12'></polygon><polygon points='0 0 24 0 24 24 0 24'></polygon></g></svg>"
				},
				"RIGHT_DOUBLE_CARET": {
					"icon": "<svg name='RightDoubleCaret' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><g fill='none' fill-rule='evenodd'><polygon fill='%%color' fill-rule='nonzero' points='2.47 2 0.12 4.35 7.753 12 0.12 19.65 2.47 22 12.47 12'></polygon><polygon fill='%%color' fill-rule='nonzero' points='14.47 2 12.12 4.35 19.753 12 12.12 19.65 14.47 22 24.47 12'></polygon><polygon points='0 0 24 0 24 24 0 24'></polygon></g></svg>"
				},
				"SEARCH": {
					"defaultProps": {
						"width": 18,
						"height": 18
					},
					"icon": "<svg name='Search' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 18 18'><g fill='none' fill-rule='evenodd' aria-hidden='true'><path fill='%%color' d='M3.60091481,7.20297313 C3.60091481,5.20983419 5.20983419,3.60091481 7.20297313,3.60091481 C9.19611206,3.60091481 10.8050314,5.20983419 10.8050314,7.20297313 C10.8050314,9.19611206 9.19611206,10.8050314 7.20297313,10.8050314 C5.20983419,10.8050314 3.60091481,9.19611206 3.60091481,7.20297313 Z M12.0057176,10.8050314 L11.3733562,10.8050314 L11.1492281,10.5889079 C11.9336764,9.67638651 12.4059463,8.49170955 12.4059463,7.20297313 C12.4059463,4.32933105 10.0766152,2 7.20297313,2 C4.32933105,2 2,4.32933105 2,7.20297313 C2,10.0766152 4.32933105,12.4059463 7.20297313,12.4059463 C8.49170955,12.4059463 9.67638651,11.9336764 10.5889079,11.1492281 L10.8050314,11.3733562 L10.8050314,12.0057176 L14.8073185,16 L16,14.8073185 L12.2102538,11.0099776 L12.0057176,10.8050314 Z'></path></g></svg>"
				},
				"SPEAKER": {
					"icon": "<svg name='Speaker' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><path fill='%%color' fill-rule='evenodd' clip-rule='evenodd' d='M11.383 3.07904C11.009 2.92504 10.579 3.01004 10.293 3.29604L6 8.00204H3C2.45 8.00204 2 8.45304 2 9.00204V15.002C2 15.552 2.45 16.002 3 16.002H6L10.293 20.71C10.579 20.996 11.009 21.082 11.383 20.927C11.757 20.772 12 20.407 12 20.002V4.00204C12 3.59904 11.757 3.23204 11.383 3.07904ZM14 5.00195V7.00195C16.757 7.00195 19 9.24595 19 12.002C19 14.759 16.757 17.002 14 17.002V19.002C17.86 19.002 21 15.863 21 12.002C21 8.14295 17.86 5.00195 14 5.00195ZM14 9.00195C15.654 9.00195 17 10.349 17 12.002C17 13.657 15.654 15.002 14 15.002V13.002C14.551 13.002 15 12.553 15 12.002C15 11.451 14.551 11.002 14 11.002V9.00195Z'></path></svg>"
				},
				"STREAM": {
					"icon": "<svg name='Stream' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><path fill='%%color' fill-rule='evenodd' clip-rule='evenodd' d='M20 3V4L23 3V7L20 6V7C20 7.553 19.552 8 19 8H15C14.448 8 14 7.553 14 7V3C14 2.447 14.448 2 15 2H19C19.552 2 20 2.447 20 3ZM18 15V10H19H20V17C20 18.104 19.103 19 18 19H11V21H15V23H5V21H9V19H2C0.897 19 0 18.104 0 17V6C0 4.897 0.897 4 2 4H12V6H2V15H7H10H13H18Z'></path></svg>"
				},
				"TRASH": {
					"icon": "<svg name='Trash' aria-hidden='false' width='%%width' height='%%height' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'></path><path fill='%%color' d='M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zm2.46-7.12l1.41-1.41L12 12.59l2.12-2.12 1.41 1.41L13.41 14l2.12 2.12-1.41 1.41L12 15.41l-2.12 2.12-1.41-1.41L10.59 14l-2.13-2.12zM15.5 4l-1-1h-5l-1 1H5v2h14V4z'></path></svg>"
				}
			},
			"CustomClassModules": {
				"BDFDB": {
					"BDFDBundefined": "BDFDB_undefined",
					"avatarDisabled": "disabled-6G33EE",
					"badge": "badge-7R_W3s",
					"badgeAvatar": "avatar-hF52Er",
					"bdRepoEntry": "entry-9JnAPs",
					"bdRepoFooterControls": "controls-p0SrvV",
					"bdRepoHeaderControls": "controls-18FQsW",
					"bdRepoListHeader": "repoHeader-2KfNvH",
					"bdRepoListWrapper": "repoList-9JnAPs",
					"cardDisabled": "cardDisabled-wnh5ZW",
					"cardHorizontal": "horizontal-0ffRsT",
					"cardInner": "inner-OP_8zd",
					"cardWrapper": "card-rT4Wbb",
					"charCounter": "counter-uAzbKp",
					"changeLogModal": "changeLogModal-ny_dHC",
					"collapseContainer": "container-fAVkOf",
					"collapseContainerCollapsed": "collapsed-2BUBZm",
					"collapseContainerHeader": "header-2s6x-5",
					"collapseContainerInner": "inner-TkGytd",
					"collapseContainerMini": "container-fAVkOf containerMini-_k6Rts",
					"collapseContainerTitle": "title-ROsJi-",
					"colorPicker": "colorPicker-h5sF8g",
					"colorPickerAlpha": "alpha-VcPGeR",
					"colorPickerAlphaCheckered": "alpha-checkered",
					"colorPickerAlphaCursor": "alpha-cursor",
					"colorPickerAlphaHorizontal": "alpha-horizontal",
					"colorPickerGradient": "gradient-TJOYTr",
					"colorPickerGradientCheckered": "gradient-checkered",
					"colorPickerGradientCursor": "gradient-cursor",
					"colorPickerGradientCursorEdge": "gradient-cursor-edge",
					"colorPickerGradientCursorSelected": "gradient-cursor-selected",
					"colorPickerGradientHorizontal": "gradient-horizontal",
					"colorPickerGradientButton": "gradientButton-eBBuwD",
					"colorPickerGradientButtonEnabled": "enabled-MypHME",
					"colorPickerSwatches": "swatches-QxZw_N",
					"colorPickerSwatchesDisabled": "disabled-2JgNxl",
					"colorPickerSwatchSelected": "selected-f5IVXN",
					"colorPickerSwatchSingle": "single-Fbb1wB",
					"colorPickerSwatchSingleWrapper": "swatch-7FsRaa",
					"confirmModal": "confirmModal-t-WDWJ",
					"dev": "dev-A7f2Rx",
					"favButtonContainer": "favbutton-8Fzu45",
					"guild": "guild-r3yAE_",
					"guildLowerLeftBadge": "lowerLeftBadge-zr4T_9",
					"guildsLabel": "label-2wRs_g",
					"guildSummaryClickableIcon": "clickableIcon-7I6aVc",
					"guildSummaryContainer": "container-5VyO4t",
					"guildSummaryEmptyGuild": "emptyGuild-Am9XfC",
					"guildSummaryIcon": "icon-r6DlKo",
					"guildSummaryIconContainer": "iconContainer-IBAtWs",
					"guildSummaryIconContainerMasked": "iconContainerMasked-G-akdf iconContainer-IBAtWs",
					"guildSummaryMoreGuilds": "moreGuilds-c5JVlC",
					"guildSummarySvgIcon": "icon-5TsFrr",
					"guildUpperLeftBadge": "upperLeftBadge-e35IpL",
					"hasBadge": "hasBadge-4rT8_u",
					"hotkeyResetButton": "resetButton-hI9Ax7",
					"hotkeyWrapper": "recorder-can0vx",
					"inputNumberButton": "button-J9muv5",
					"inputNumberButtonDown": "down-cOY7Qp button-J9muv5",
					"inputNumberButtonUp": "up-mUs_72 button-J9muv5",
					"inputNumberButtons": "buttons-our3p-",
					"inputNumberWrapper": "numberInputWrapper-j4svZS",
					"inputNumberWrapperDefault": "numberInputWrapperDefault-gRxcuK numberInputWrapper-j4svZS",
					"inputNumberWrapperMini": "numberInputWrapperMini-wtUU31 numberInputWrapper-j4svZS",
					"listRow": "listRow-7SfZww",
					"loadingIcon": "loadingIcon-cOYMPl",
					"loadingIconWrapper": "loadingIconWrapper-PsVJ9m",
					"overflowEllipsis": "ellipsis-qlo9sA",
					"paginationList": "list-PIKebU",
					"paginationListAlphabet": "alphabet-2ANo0x",
					"paginationListAlphabetChar": "alphabetChar-bq-8Go",
					"paginationListAlphabetCharDisabled": "disabled-XmhCq2",
					"paginationListContent": "listContent-aG3Fq8",
					"paginationListMini": "mini-GMiniS",
					"paginationListPagination": "pagination-ko4zZk",
					"popoutWrapper": "popout-xwjvsX",
					"quickSelectWrapper": "quickSelectWrapper-UCfTKz",
					"listInput": "listInput-11g5Sr",
					"listInputDelete": "delete-M_nPTt",
					"listInputItem": "item-wGC8aX",
					"listInputItems": "items-D9PGwH",
					"menuColorCustom": "colorCustom-44asd2",
					"menuItemHint": "hint-BK71lM",
					"modalHeaderShade": "shade-h6F4sT",
					"modalHeaderHasSibling": "hasSiblings-fRyjyl",
					"modalNoScroller": "noScroller-YgPpF3",
					"modalSidebar": "sidebar-_0OpfR",
					"modalTabContent": "tabContent-nZ-1U5",
					"modalTabContentOpen": "open-yICTYu",
					"modalSubInner": "inner-t84Frz",
					"modalWrapper": "modal-6GHvdM",
					"multiInput": "multiInput-Ft9zQo",
					"multiInputField": "multiInputField-GfMBpr",
					"multiInputFirst": "multiInputFirst-5rMj_O",
					"multiInputLast": "multiInputLast-HWxgTr",
					"multiInputWrapper": "multiInputWrapper-g6Srtv",
					"noticeWrapper": "noticeWrapper-8z511t",
					"searchBarWrapper": "searchBarWrapper-1GpKvB",
					"selectWrapper": "selectWrapper-yPjeij",
					"settingsGuild": "guild-J3Egt5",
					"settingsGuildDisabled": "disabled-b2o83O",
					"settingsPanel": "settingsPanel-w2ySNR",
					"settingsPanelList": "settingsList-eZjkXj",
					"settingsPanelListWrapper": "wrapper-kRsR33",
					"settingsPanelListWrapperMini": "mini-2Iug3W",
					"settingsRow": "settingsRow-o9Ft44",
					"settingsTableCard": "settingsTableCard-628t52",
					"settingsTableCardConfigs": "settingsTableCardConfigs-w5X9-Z",
					"settingsTableCardLabel": "settingsTableCardLabel-MElgIg",
					"settingsTableHeaderOptions": "headerOptions-8F_5Ss",
					"settingsTableHeaders": "settingsTableHeaders-WKzw9_",
					"settingsTableHeaderVertical": "headerVertical-4MNxqk",
					"settingsTableList": "settingsTableList-f6sW2y",
					"sidebar": "sidebar-frSZx3",
					"sidebarContent": "content-1SbgDG",
					"sidebarList": "list-VCoBc2",
					"sliderBubble": "bubble-3we2di",
					"switchMini": "mini-6F2SSa",
					"supporter": "supporter-Z3FfwL",
					"supporterCustom": "customSupporter-thxL4U",
					"svgIcon": "icon-GhnIRB",
					"svgIconWrapper": "iconWrapper-g20jFn",
					"tabBarContainerBottom": "bottom-b8sdfs",
					"table": "table-moqjM0",
					"tableBodyCell": "bodyCell-dQam9V",
					"tableHeaderCell": "headerCell-T6Fo3K",
					"textScroller": "textScroller-dc9_kz",
					"themedPopout": "themedPopout-1TrfdI",
					"tooltipCustom": "tooltipCustom-hH39_Z",
					"tooltipRowExtra": "extraRow-6F2Dss",
					"userInfoDate": "date-YN6TCS"
				},
				"BDrepo": {
					"bdAddonCard": "bd-addon-card",
					"bdAddonModal": "bd-addon-modal",
					"bdAddonModalFooter": "bd-addon-modal-footer",
					"bdAddonModalHeader": "bd-addon-modal-header",
					"bdAddonModalSettings": "bd-addon-modal-settings",
					"bdButton": "bd-button",
					"bdButtonDanger": "bd-button-danger",
					"bdControls": "bd-controls",
					"bdControlsButton": "bd-addon-button",
					"bdaAuthor": "bd-author author bda-author",
					"bdaDescription": "bd-scroller bd-description bd-addon-description bda-description scroller",
					"bdaDescriptionWrap": "bd-scroller-wrap bd-description-wrap bda-description-wrap scroller-wrap fade",
					"bdaFooter": "bd-footer bd-card-footer bda-footer",
					"bdaHeader": "bd-addon-header bda-header",
					"bdaHeaderTitle": "bd-title bd-card-title bda-header-title",
					"bdaLink": "bd-link bda-link",
					"bdaLinks": "bd-links bd-addon-links bda-links",
					"bdaName": "bd-name name bda-name",
					"bdaSettingsButton": "bd-button bda-settings-button",
					"bdaSlist": "bda-slist bd-addon-list",
					"bdaVersion": "bd-version version bda-version",
					"bdGuild": "bd-guild",
					"bdGuildAnimatable": "bd-animatable",
					"bdGuildAudio": "bd-audio",
					"bdGuildSelected": "bd-selected",
					"bdGuildSeparator": "bd-guild-separator",
					"bdGuildUnread": "bd-unread",
					"bdGuildVideo": "bd-video",
					"bdIcon": "bd-icon",
					"bdMeta": "bd-meta",
					"bdPillSelected": "bd-selected",
					"bdPillUnread": "bd-unread",
					"bdPfbtn": "bd-pfbtn",
					"bdSwitch": "bd-switch",
					"bdSwitchChecked": "bd-switch-checked",
					"bdSwitchInner": "bd-checkbox",
					"bdUpdatebtn": "bd-updatebtn",
					"settings": "plugin-settings",
					"settingsOpen": "settings-open",
					"settingsClosed": "settings-closed",
					"switch": "ui-switch",
					"switchCheckbox": "ui-switch-checkbox",
					"switchChecked": "checked",
					"switchItem": "ui-switch-item",
					"switchWrapper": "ui-switch-wrapper"
				},
				"BadgesEverywhere": {
					"badge": "badge-7CsdQq",
					"badges": "badges-XRnWAp",
					"badgesChat": "badgesChat-f_cbR8",
					"badgesInner": "inner-dA0J42",
					"badgesList": "badgesList-Aw_p52",
					"badgesPopout": "badgesPopout-srZ8EX",
					"badgesSettings": "badgesSettings-ychoGn",
					"indicator": "indicator-cY1-b4",
					"indicatorInner": "indicatorInner-08W8Jl",
					"mini": "mini-g-JPgX",
					"size17": "size17-2GsONg",
					"size21": "size21-Y634b3",
					"size22": "size22-AJj9xV",
					"size24": "size24-NlR6be"
				},
				"BetterFriendList": {
					"mutualGuilds": "mutualGuilds-s7F2aa",
					"nameCell": "nameCell-7F4sRs",
					"title": "title-3aDrFs"
				},
				"BetterNsfwTag": {
					"nsfwTag": "nsfwTag-666omg"
				},
				"ChatFilter": {
					"blocked": "blocked-jUhayi",
					"blockedStamp": "blockedStamp-ijVeNn",
					"censored": "censored-UYfeYg",
					"censoredStamp": "censoredStamp-fb2cYb"
				},
				"CharCounter": {
					"charCounter": "charCounter-7fw40k",
					"chatCounter": "chatCounter-XOMPsh",
					"counterAdded": "charCounterAdded-zz9O4t",
					"customStatusCounter": "customStatusCounter-G8FrsT",
					"editCounter": "editCounter-pNT1Xe",
					"nickCounter": "nickCounter-tJrO_4",
					"popoutNoteCounter": "popoutNoteCounter-62U4Rh",
					"profileNoteCounter": "profileNoteCounter-p0fWA_",
					"uploadCounter": "uploadCounter-iEGQQk"
				},
				"CreationDate": {
					"date": "creationDate-CJwdKT"
				},
				"DisplayLargeMessages": {
					"injectButton": "injectButton-8eKqGu",
					"injectButtonWrapper": "injectButtonWrapper-U462Rh",
					"popoutButton": "popoutButton-a26sRh",
					"popoutButtonWrapper": "popoutButtonWrapper-p90FFs",
					"previewMessage": "previewMessage-lM55Sw"
				},
				"DisplayServersAsChannels": {
					"badge": "badge-fxFrUP",
					"name": "name-z5133D",
					"styled": "styledGuildsAsChannels-DNHtg_"
				},
				"EmojiStatistics": {
					"amountCell": "amountCell-g_W6Rx",
					"iconCell": "iconCell--wniOu",
					"nameCell": "nameCell-xyXENZ",
					"statisticsButton": "statisticsButton-nW2KoM"
				},
				"FriendNotifications": {
					"friendsOnline": "friendsOnline-2JkivW",
					"logAvatar": "avatar-GgGssS",
					"logContent": "content-_3_FFs",
					"logTime": "time-00Fs44",
					"timeLogModal": "timeLogModal-9s4Rts",
					"typeLabel": "label-9FgsSa"
				},
				"GoogleTranslateOption": {
					"reverseButton": "reverseButton-5S47qV",
					"translateButton": "translateButton-DhP9x8",
					"translated": "translated-5YO8i3",
					"translating": "translating-Yi-YxC"
				},
				"ImageUtilities": {
					"details": "details-9dkFPc",
					"detailsAdded": "detailsAdded-fHiJlm",
					"detailsLabel": "label-mrlccN",
					"detailsWrapper": "detailsWrapper-TE1mu5",
					"gallery": "gallery-JViwKR",
					"imageDetails": "imageDetails-1t6Zms",
					"lens": "zoomLens-uOK8xV",
					"lensBackdrop": "lensBackdrop-yEm7Om",
					"next": "next-SHEZrz",
					"operations": "operations-3V47CY",
					"previous": "previous-xsNq6B",
					"sibling": "sibling-6vI7Pu",
					"switchIcon": "switchIcon-QY6cR4"
				},
				"JoinedAtDate": {
					"date": "joinedAtDate-IawR02"
				},
				"LastMessageDate": {
					"date": "lastMessageDate-ocEw13"
				},
				"OldTitleBar": {
					"oldTitleBarEnabled": "oldTitleBarEnabled-D8ppJQ",
					"settingsToolbar": "settingsToolbar-wu4yfQ",
					"toolbar": "toolbar-hRzFw-"
				},
				"OwnerTag": {
					"adminIcon": "admin-Kv1Hp_",
					"managementIcon": "management-3fF_o8",
					"ownerIcon": "owner-FfFh3B-"
				},
				"PinDMs": {
					"dragPreview": "dragPreview-nXiByA",
					"dmChannelPinned": "pinned-0lM4wD",
					"dmChannelPlaceholder": "placeholder-7bhR5s",
					"pinnedChannelsHeaderAmount": "headerAmount-_-7GrS",
					"pinnedChannelsHeaderArrow": "pinnedChannelsHeaderArrow-44rrTz",
					"pinnedChannelsHeaderCollapsed": "collapsed-3w_-ff",
					"pinnedChannelsHeaderColored": "colored-oIzG5s",
					"pinnedChannelsHeaderContainer": "pinnedChannelsHeaderContainer-89Gjv4",
					"recentPinned": "pinned-jHvFrr",
					"recentPlaceholder": "placeholder-Uff-gH",
					"unpinButton": "unpinButton-z3-UVO",
					"unpinIcon": "unpinIcon-79ZnEr"
				},
				"ReadAllNotificationsButton": {
					"button": "button-Jt-tIg",
					"frame": "frame-oXWS21",
					"innerFrame": "innerFrame-8Hg64E"
				},
				"ServerCounter": {
					"serverCount": "serverCount-FsTTs1"
				},
				"ServerDetails": {
					"details": "details-08FrsT",
					"icon": "icon-hSL42R",
					"tooltip": "detailsTooltip-G9hSSa"
				},
				"ServerFolders": {
					"dragPreview": "dragPreview-nXiByA",
					"guildPlaceholder": "placeholder-7bhR5s",
					"folderContent": "content-Pph8t6",
					"folderContentClosed": "closed-j55_T-",
					"folderContentIsOpen": "folderContentIsOpen-zz6FgW",
					"iconSwatch": "iconSwatch-_78Ghj",
					"iconSwatchInner": "iconInner-aOY-qk",
					"iconSwatchPreview": "preview-Bbg_24",
					"iconSwatchSelected": "selected-P5oePO"
				},
				"SpellCheck": {
					"error": "error-k9z2IV",
					"overlay": "spellCheckOverlay-cNSap5"
				},
				"ShowHiddenChannels": {
					"accessModal": "accessModal-w5HjsV"
				},
				"SpotifyControls": {
					"bar": "bar-g2ZMIm",
					"barGabber": "grabber-7sd5f5",
					"barFill": "barFill-Dhkah7",
					"barText": "barText-lmqc5O",
					"buttonActive": "active-6TsW-_",
					"container": "container-6sXIoE",
					"containerInner": "inner-WRV6k5",
					"containerMaximized": "maximized-vv2Wr0",
					"containerWithTimeline": "withTimeline-824fT_",
					"cover": "cover-SwJ-ck",
					"coverMaximizer": "maximizer-RVu85p",
					"coverWrapper": "coverWrapper-YAplwJ",
					"details": "details-ntX2k5",
					"interpret": "interpret-F93iqP",
					"settingsIcon": "icon-F4SSra",
					"settingsLabel": "label-3f00Sr",
					"song": "song-tIdBpF",
					"timeline": "timeline-UWmgAx",
					"volumeSlider": "volumeSlider-sR5g00"
				},
				"TimedLightDarkMode": {
					"dateGrabber": "dateGrabber-QrRkIX",
					"timerGrabber": "timerGrabber-zpRAIk",
					"timerSettings": "timerSettings-wkvEfF"
				},
				"TopRolesEverywhere": {
					"badgeStyle": "badgeStyle-tFiEQ8",
					"chatTag": "chatTag-Y-5TDc",
					"memberTag": "memberTag-QVWzGc",
					"roleStyle": "roleStyle-jQ7KI2",
					"tag": "tag-wWVHyf"
				},
				"NotFound": {
					"_": "",
					"badgeWrapper": "wrapper-232cHJ",
					"channelPanelTitle": "title-eS5yk3",
					"emoji": "emoji",
					"highlight": "highlight",
					"hoverCardButton": "button-2CgfFz",
					"loginScreen": "wrapper-3Q5DdO",
					"mention": "mention",
					"mentionInteractive": "interactive",
					"mentionWrapper": "wrapper-3WhCwL",
					"messagesLoadingWrapper": "wrapper-3vR61M",
					"messagesWelcomeChannelButtonContainer": "buttonContainer-2GVjL_",
					"nameContainerNameContainer": "container-2ax-kl",
					"hueCursor": "hue-cursor",
					"hueHorizontal": "hue-horizontal",
					"hueVertical": "hue-vertical",
					"saturationBlack": "saturation-black",
					"saturationColor": "saturation-color",
					"saturationCursor": "saturation-cursor",
					"saturationWhite": "saturation-white",
					"splashBackground": "splashBackground-1FRCko",
					"stopAnimations": "stop-animations",
					"subtext": "subtext-3CDbHg",
					"themeDark": "theme-dark",
					"themeLight": "theme-light",
					"themeUndefined": "theme-undefined",
					"voiceDraggable": "draggable-1KoBzC"
				},
				"ColorPicker": {
					"colorPickerCustom": "colorPickerCustom-2CWBn2",
					"colorPickerDropper": "colorPickerDropper-3c2mIf",
					"colorPickerDropperFg": "colorPickerDropperFg-3jYKWI",
					"colorPickerRow": "colorPickerRow-1LgLnl",
					"colorPickerSwatch": "colorPickerSwatch-5GX3Ve",
					"custom": "custom-2SJn4n",
					"customColorPickerInput": "customColorPickerInput-14pB0r",
					"default": "default-cS_caM",
					"disabled": "disabled-1C4eHl",
					"input": "input-GfazGc",
					"noColor": "noColor-1pdBDm"
				},
				"ColorPickerInner": {
					"hue": "hue-13HAGb",
					"saturation": "saturation-1FDvtn",
					"wrapper": "wrapper-2AQieU"
				},
				"Toast": {
					"avatar": "toast-avatar",
					"closing": "closing",
					"custom": "toast-custom",
					"icon": "icon",
					"inner": "toast-inner",
					"toast": "toast",
					"toasts": "toasts"
				}
			},
			"DiscordClassModules": {
				"AccountDetails": {"props": ["usernameContainer", "container"]},
				"AccountDetailsButtons": {"props": ["button", "enabled", "disabled"]},
				"Anchor": {"props": ["anchor", "anchorUnderlineOnHover"]},
				"AnimationContainer": {"props": ["animatorLeft", "didRender"]},
				"AppBase": {"props": ["container", "base"]},
				"AppInner": {"props": ["app", "layers"]},
				"AppMount": {"props": ["appMount"]},
				"ApplicationStore": {"props": ["applicationStore", "navigation"]},
				"AppOuter": {"props": ["app"], "length": 1},
				"AuditLog": {"props": ["auditLog"]},
				"AuthBox": {"props": ["authBox"]},
				"Autocomplete": {"props": ["autocomplete", "autocompleteRow"]},
				"Avatar": {"props": ["avatar", "mask", "wrapper"]},
				"AvatarIcon": {"props": ["iconActiveLarge", "iconActiveMedium"]},
				"Backdrop": {"props": ["backdrop", "backdropWithLayer"]},
				"Badge": {"props": ["numberBadge", "textBadge", "iconBadge"]},
				"BotTag": {"props": ["botTag", "botTagInvert"]},
				"Button": {"props": ["colorBlack", "button"]},
				"CallCurrent": {"props": ["wrapper", "fullScreen"]},
				"CallDetails": {"props": ["container", "hotspot"]},
				"CallIncoming": {"props": ["wrapper", "mainChannelInfo"]},
				"Card": {"props": ["card", "cardBrand"]},
				"CardStatus": {"props": ["reset", "error", "card"]},
				"Category": {"props": ["wrapper", "children", "muted"]},
				"CategoryArrow": {"props": ["arrow", "open"]},
				"CategoryContainer": {"props": ["addButtonIcon", "containerDefault"]},
				"ChangeLog": {"props": ["added", "fixed", "improved", "progress"]},
				"Channel": {"props": ["wrapper", "content", "modeSelected"]},
				"ChannelContainer": {"props": ["actionIcon", "containerDefault"]},
				"ChannelLimit": {"props": ["users", "total", "wrapper"]},
				"ChannelTextArea": {"props": ["textArea", "buttons"]},
				"ChannelTextAreaAttachButton": {"props": ["attachButton", "attachWrapper"]},
				"ChannelTextAreaButton": {"props": ["buttonWrapper", "active"]},
				"ChannelTextAreaCharCounter": {"props": ["characterCount", "error"]},
				"ChannelTextAreaSlate": {"props": ["slateContainer", "placeholder"]},
				"ChatWindow": {"props": ["chat", "channelTextArea"]},
				"Checkbox": {"props": ["checkboxWrapper", "round"]},
				"CtaVerification": {"props": ["attendeeCTA", "verificationNotice"]},
				"Cursor": {"props": ["cursorDefault", "userSelectNone"]},
				"CustomStatusIcon": {"props": ["textRuler", "emoji", "icon"]},
				"DmAddPopout": {"props": ["popout", "searchBarComponent"]},
				"DmAddPopoutItems": {"props": ["friendSelected", "friendWrapper"]},
				"DownloadLink": {"props": ["downloadLink"]},
				"Embed": {"props": ["embed", "embedAuthorIcon"]},
				"EmbedActions": {"props": ["iconPlay", "iconWrapperActive"]},
				"Emoji": {"props": ["emoji"], "length": 1},
				"EmojiButton": {"props": ["emojiButton", "sprite"]},
				"EmojiInput": {"props": ["inputContainer", "emojiButton"]},
				"EmojiPicker": {"props": ["emojiPicker", "inspector"]},
				"EmojiPickerDiversitySelector": {"props": ["diversityEmojiItemImage", "diversitySelectorPopout"]},
				"EmojiPickerItem": {"props": ["emojiSpriteImage"]},
				"EmojiPickerInspector": {"props": ["inspector", "graphicPrimary"]},
				"EmojiPickerInspectorEmoji": {"props": ["emoji", "glyphEmoji"]},
				"ErrorScreen": {"props": ["wrapper", "flexWrapper", "note"]},
				"ExpressionPicker": {"props": ["contentWrapper", "navButton", "navList"]},
				"File": {"props": ["downloadButton", "fileNameLink"]},
				"Flex": {"props": ["alignBaseline", "alignCenter"]},
				"FlexChild": {"props": ["flexChild", "flex"]},
				"FlowerStar": {"props": ["flowerStarContainer", "flowerStar"]},
				"FormText": {"props": ["description", "modeDefault"]},
				"Game": {"props": ["game", "gameName"]},
				"GameIcon": {"props": ["gameIcon", "small", "xsmall"]},
				"GameLibraryTable": {"props": ["stickyHeader", "emptyStateText"]},
				"GifFavoriteButton": {"props": ["gifFavoriteButton", "showPulse"]},
				"GoLiveDetails": {"props": ["panel", "gameWrapper"]},
				"Guild": {"props": ["wrapper", "lowerBadge", "svg"]},
				"GuildChannels": {"props": ["positionedContainer", "unreadBar"]},
				"GuildChannelsWrapper": {"props": ["subscribeTooltipWrapper", "container"]},
				"GuildDiscovery": {"props": ["pageWrapper", "guildList"]},
				"GuildDm": {"props": ["pill"], "length": 1},
				"GuildEdges": {"props": ["wrapper", "edge", "autoPointerEvents"]},
				"GuildFolder": {"props": ["folder", "expandedFolderIconWrapper"]},
				"GuildHeader": {"props": ["header", "name", "bannerImage"]},
				"GuildHeaderButton": {"props": ["button", "open"]},
				"GuildIcon": {"props": ["acronym", "selected", "wrapper"]},
				"GuildInvite": {"props": ["wrapper", "guildIconJoined"]},
				"GuildSettingsBanned": {"props": ["bannedUser", "bannedUserAvatar"]},
				"GuildSettingsEmoji": {"props": ["emojiRow", "emojiAliasPlaceholder"]},
				"GuildSettingsInvite": {"props": ["countdownColumn", "inviteSettingsInviteRow"]},
				"GuildSettingsMember": {"props": ["member", "membersFilterPopout"]},
				"GuildSettingsRoles": {"props": ["buttonWrapper", "addRoleIcon"]},
				"GuildServer": {"props": ["blobContainer", "pill"]},
				"GuildsItems": {"props": ["guildSeparator", "guildsError"]},
				"GuildsWrapper": {"props": ["scroller", "unreadMentionsBar", "wrapper"]},
				"HeaderBar": {"props": ["container", "children", "toolbar"]},
				"HeaderBarExtras": {"props": ["headerBarLoggedOut", "search"]},
				"HeaderBarSearch": {"props": ["search", "searchBar", "open"]},
				"HeaderBarTopic": {"props": ["topic", "expandable", "content"]},
				"HomeIcon": {"props": ["homeIcon"]},
				"HotKeyRecorder": {"props": ["editIcon", "recording"]},
				"HoverCard": {"props": ["card", "active"]},
				"IconDirection": {"props": ["directionDown", "directionUp"]},
				"ImageModal": {"props": ["image", "modal"], "length": 4, "smaller": true},
				"ImageWrapper": {"props": ["clickable", "imageWrapperBackground"]},
				"Input": {"props": ["inputMini", "inputDefault"]},
				"InviteModal": {"props": ["inviteRow", "modal"]},
				"Item": {"props": ["item", "side", "header"]},
				"ItemRole": {"props": ["role", "dragged"]},
				"ItemLayerContainer": {"props": ["layer", "layerContainer"]},
				"LayerModal": {"props": ["root", "small", "medium"]},
				"Layers": {"props": ["layer", "layers"]},
				"LiveTag": {"props": ["liveLarge", "live"]},
				"LoadingScreen": {"props": ["container", "problemsText", "problems"]},
				"Margins": {"props": ["marginBottom4", "marginCenterHorz"]},
				"Menu": {"props": ["menu", "styleFlexible", "item"]},
				"MenuCaret": {"props": ["arrow", "open"]},
				"MenuReactButton": {"props": ["wrapper", "icon", "focused"]},
				"MenuSlider": {"props": ["slider", "sliderContainer"]},
				"Member": {"props": ["member", "ownerIcon"]},
				"MembersWrapper": {"props": ["membersWrap", "membersGroup"]},
				"Message": {"props": ["message", "mentioned"]},
				"MessageAccessory": {"props": ["embedWrapper", "gifFavoriteButton"]},
				"MessageBlocked": {"props": ["blockedMessageText", "expanded"]},
				"MessageBody": {"props": ["markupRtl", "edited"]},
				"MessageDivider": {"props": ["isUnread", "divider"]},
				"MessageElements": {"props": ["messageGroupBlockedBtn", "dividerRed"]},
				"MessageFile": {"props": ["cancelButton", "filenameLinkWrapper"]},
				"MessageLocalBot": {"props": ["ephemeralMessage", "icon"]},
				"MessageMarkup": {"props": ["markup"]},
				"MessagePopout": {"props": ["message", "spacing"]},
				"MessageOperations": {"props": ["operations"], "length": 1},
				"MessageReactions": {"props": ["reactions", "reactionMe"]},
				"MessageReactionsModal": {"props": ["reactor", "reactionSelected"]},
				"MessageReply": {"props": ["container", "text", "closeButton"]},
				"MessagesPopout": {"props": ["messagesPopoutWrap", "jumpButton"]},
				"MessagesPopoutButtons": {"props": ["secondary", "tertiary", "button"]},
				"MessagesPopoutTabBar": {"props": ["header", "tabBar", "active"]},
				"MessagesLoading": {"props": ["attachment", "blob", "cozy"]},
				"MessagesWelcome": {"props": ["emptyChannelIcon", "description", "header"]},
				"MessagesWelcomeButton": {"props": ["button", "buttonIcon"], "length": 2},
				"MessagesWrap": {"props": ["messagesWrapper", "messageGroupBlocked"]},
				"MessageSystem": {"props": ["container", "actionAnchor"]},
				"MessageToolbar": {"props": ["container", "icon", "isHeader"]},
				"MessageToolbarItems": {"props": ["wrapper", "button", "separator"]},
				"Modal": {"props": ["modal", "sizeLarge"]},
				"ModalDivider": {"props": ["divider"], "length": 1},
				"ModalItems": {"props": ["guildName", "checkboxContainer"]},
				"ModalMiniContent": {"props": ["modal", "content"], "length": 2},
				"ModalWrap": {"props": ["modal", "inner"], "length": 2},
				"NameContainer": {"props": ["nameAndDecorators", "name"]},
				"NameTag": {"props": ["bot", "nameTag"]},
				"NitroStore": {"props": ["applicationStore", "marketingHeader"]},
				"NoteTextarea": {"props": ["textarea"], "length": 1},
				"Notice": {"props": ["notice", "platformIcon"]},
				"NoticePlatform": {"props": ["iconAndroid", "textLink"]},
				"PeopleItem": {"props": ["peopleListItem", "active"]},
				"PeopleItemInfo": {"props": ["listItemContents", "actions"], "length": 2},
				"Peoples": {"props": ["peopleColumn", "tabBar"]},
				"PictureInPicture": {"props": ["pictureInPicture", "pictureInPictureWindow"]},
				"PillWrapper": {"props": ["item", "wrapper"], "length": 2},
				"PrivateChannel": {"props": ["channel", "closeButton"]},
				"PrivateChannelList": {"props": ["privateChannels", "searchBar"]},
				"PrivateChannelListScroller": {"props": ["privateChannelsHeaderContainer", "headerText"]},
				"Popout": {"props": ["popout", "arrowAlignmentTop"]},
				"PopoutActivity": {"props": ["ellipsis", "activityActivityFeed"]},
				"QuickMessage": {"props": ["input"], "length": 1},
				"QuickSelect": {"props": ["quickSelectArrow", "selected"]},
				"QuickSwitch": {"props": ["resultFocused", "guildIconContainer"]},
				"QuickSwitchWrap": {"props": ["container", "miscContainer"]},
				"RadioGroup": {"props": ["radioBar", "item"]},
				"Reactions": {"props": ["reactionBtn", "reaction"]},
				"RecentMentions": {"props": ["recentMentionsPopout"]},
				"RecentMentionsHeader": {"props": ["channelName", "channelHeader", "dmIcon"]},
				"Role": {"props": ["roleCircle", "roleName", "roleRemoveIcon"]},
				"Scrollbar": {"props": ["scrollbar", "scrollbarGhost"]},
				"Scroller": {"props": ["scrollerBase", "none", "fade"]},
				"SearchBar": {"props": ["clear", "container", "pointer"]},
				"SearchPopout": {"props": ["datePicker", "searchResultChannelIconBackground"]},
				"SearchPopoutWrap": {"props": ["container", "queryContainer"]},
				"SearchResults": {"props": ["noResults", "searchResultsWrap"]},
				"SearchResultsElements": {"props": ["resultsBlocked", "channelSeparator"]},
				"SearchResultsPagination": {"props": ["paginationButton", "pagination"]},
				"SearchResultsMessage": {"props": ["after", "messageGroupCozy"]},
				"Select": {"props": ["select", "error", "errorMessage"]},
				"SettingsCloseButton": {"props": ["closeButton", "keybind"]},
				"SettingsItems": {"props": ["labelRow", "note"]},
				"SettingsTable": {"props": ["headerOption", "headerName"]},
				"SettingsWindow": {"props": ["contentRegion", "standardSidebarView"]},
				"SettingsWindowScroller": {"props": ["sidebarScrollable", "content", "scroller"]},
				"Slider": {"props": ["slider", "grabber"]},
				"Spoiler": {"props": ["spoilerContainer", "hidden"]},
				"SpoilerEmbed": {"props": ["hiddenSpoilers", "spoiler"]},
				"Switch": {"props": ["container", "slider", "input"]},
				"Table": {"props": ["stickyHeader", "sortIcon"]},
				"Text": {"props": ["defaultColor", "defaultMarginh1"]},
				"TextColor": {"props": ["colorStandard", "colorMuted", "colorError"]},
				"TextColor2": {"props": ["muted", "wrapper", "base"]},
				"TextSize": {"props": ["size10", "size14", "size20"]},
				"TextStyle": {"props": ["strikethrough", "underline", "bold"]},
				"Tip": {"props": ["pro", "inline"]},
				"TitleBar": {"props": ["titleBar", "wordmark"]},
				"Tooltip": {"props": ["tooltip", "tooltipTop"]},
				"TooltipGuild": {"props": ["rowIcon", "rowGuildName"]},
				"Typing": {"props": ["cooldownWrapper", "typing"]},
				"UnreadBar": {"props": ["active", "bar", "unread"]},
				"UploadModal": {"props": ["uploadModal", "bgScale"]},
				"UserBadges": {"props": ["profileBadgeStaff", "profileBadgePremium"]},
				"UserInfo": {"props": ["userInfo", "discordTag"]},
				"UserPopout": {"props": ["userPopout", "headerPlaying"]},
				"UserProfile": {"props": ["topSectionNormal", "tabBarContainer"]},
				"UserSettingsAppearancePreview": {"props": ["preview", "firstMessage"]},
				"UserSummaryItem": {"props": ["avatarContainerMasked", "container"]},
				"Video": {"props": ["video", "fullScreen"]},
				"VoiceChannel": {"props": ["avatarSpeaking", "voiceUser"]},
				"VoiceChannelLimit": {"props": ["total", "users", "wrapper"]},
				"VoiceChannelList": {"props": ["list", "collapsed"]},
				"VoiceDetails": {"props": ["container", "customStatusContainer"]},
				"VoiceDetailsPing": {"props": ["rtcConnectionQualityBad", "rtcConnectionQualityFine"]},
				"WebhookCard": {"props": ["pulseBorder", "copyButton"]}
			},
			"DiscordClasses": {
				"_bdguild": ["BDrepo", "bdGuild"],
				"_bdguildanimatable": ["BDrepo", "bdGuildAnimatable"],
				"_bdguildaudio": ["BDrepo", "bdGuildAudio"],
				"_bdguildselected": ["BDrepo", "bdGuildSelected"],
				"_bdguildseparator": ["BDrepo", "bdGuildSeparator"],
				"_bdguildunread": ["BDrepo", "bdGuildUnread"],
				"_bdguildvideo": ["BDrepo", "bdGuildVideo"],
				"_bdpillselected": ["BDrepo", "bdPillSelected"],
				"_bdpillunread": ["BDrepo", "bdPillUnread"],
				"_badgeseverywherebadge": ["BadgesEverywhere", "badge"],
				"_badgeseverywherebadges": ["BadgesEverywhere", "badges"],
				"_badgeseverywherebadgeschat": ["BadgesEverywhere", "badgesChat"],
				"_badgeseverywherebadgesinner": ["BadgesEverywhere", "badgesInner"],
				"_badgeseverywherebadgeslist": ["BadgesEverywhere", "badgesList"],
				"_badgeseverywherebadgespopout": ["BadgesEverywhere", "badgesPopout"],
				"_badgeseverywherebadgessettings": ["BadgesEverywhere", "badgesSettings"],
				"_badgeseverywhereindicator": ["BadgesEverywhere", "indicator"],
				"_badgeseverywhereindicatorinner": ["BadgesEverywhere", "indicatorInner"],
				"_badgeseverywheremini": ["BadgesEverywhere", "mini"],
				"_badgeseverywheresize17": ["BadgesEverywhere", "size17"],
				"_badgeseverywheresize21": ["BadgesEverywhere", "size21"],
				"_badgeseverywheresize22": ["BadgesEverywhere", "size22"],
				"_badgeseverywheresize24": ["BadgesEverywhere", "size24"],
				"_betterfriendlistmutualguilds": ["BetterFriendList", "mutualGuilds"],
				"_betterfriendlistnamecell": ["BetterFriendList", "nameCell"],
				"_betterfriendlisttitle": ["BetterFriendList", "title"],
				"_betternsfwtagtag": ["BetterNsfwTag", "nsfwTag"],
				"_chatfilterblocked": ["ChatFilter", "blocked"],
				"_chatfilterblockedstamp": ["ChatFilter", "blockedStamp"],
				"_chatfiltercensored": ["ChatFilter", "censored"],
				"_chatfiltercensoredstamp": ["ChatFilter", "censoredStamp"],
				"_charcountercounter": ["CharCounter", "charCounter"],
				"_charcounterchatcounter": ["CharCounter", "chatCounter"],
				"_charcountercounteradded": ["CharCounter", "counterAdded"],
				"_charcountercustomstatuscounter": ["CharCounter", "customStatusCounter"],
				"_charcountereditcounter": ["CharCounter", "editCounter"],
				"_charcounternickcounter": ["CharCounter", "nickCounter"],
				"_charcounterpopoutnotecounter": ["CharCounter", "popoutNoteCounter"],
				"_charcounterprofilenotecounter": ["CharCounter", "profileNoteCounter"],
				"_charcounteruploadcounter": ["CharCounter", "uploadCounter"],
				"_creationdatedate": ["CreationDate", "date"],
				"_displaylargemessagesinjectbutton": ["DisplayLargeMessages", "injectButton"],
				"_displaylargemessagesinjectbuttonwrapper": ["DisplayLargeMessages", "injectButtonWrapper"],
				"_displaylargemessagespopoutbutton": ["DisplayLargeMessages", "popoutButton"],
				"_displaylargemessagespopoutbuttonwrapper": ["DisplayLargeMessages", "popoutButtonWrapper"],
				"_displaylargemessagespreviewmessage": ["DisplayLargeMessages", "previewMessage"],
				"_displayserversaschannelsbadge": ["DisplayServersAsChannels", "badge"],
				"_displayserversaschannelsname": ["DisplayServersAsChannels", "name"],
				"_displayserversaschannelsstyled": ["DisplayServersAsChannels", "styled"],
				"_emojistatisticsstatisticsbutton": ["EmojiStatistics", "statisticsButton"],
				"_emojistatisticsamountcell": ["EmojiStatistics", "amountCell"],
				"_emojistatisticsiconcell": ["EmojiStatistics", "iconCell"],
				"_emojistatisticsnamecell": ["EmojiStatistics", "nameCell"],
				"_friendnotificationslogavatar": ["FriendNotifications", "logAvatar"],
				"_friendnotificationslogcontent": ["FriendNotifications", "logContent"],
				"_friendnotificationslogtime": ["FriendNotifications", "logTime"],
				"_friendnotificationsfriendsonline": ["FriendNotifications", "friendsOnline"],
				"_friendnotificationstimelogmodal": ["FriendNotifications", "timeLogModal"],
				"_friendnotificationstypelabel": ["FriendNotifications", "typeLabel"],
				"_imageutilitiesdetails": ["ImageUtilities", "details"],
				"_imageutilitiesdetailsadded": ["ImageUtilities", "detailsAdded"],
				"_imageutilitiesdetailslabel": ["ImageUtilities", "detailsLabel"],
				"_imageutilitiesdetailswrapper": ["ImageUtilities", "detailsWrapper"],
				"_imageutilitiesgallery": ["ImageUtilities", "gallery"],
				"_imageutilitiesimagedetails": ["ImageUtilities", "imageDetails"],
				"_imageutilitieslense": ["ImageUtilities", "lens"],
				"_imageutilitieslensebackdrop": ["ImageUtilities", "lensBackdrop"],
				"_imageutilitiesnext": ["ImageUtilities", "next"],
				"_imageutilitiesoperations": ["ImageUtilities", "operations"],
				"_imageutilitiesprevious": ["ImageUtilities", "previous"],
				"_imageutilitiessibling": ["ImageUtilities", "sibling"],
				"_imageutilitiesswitchicon": ["ImageUtilities", "switchIcon"],
				"_joinedatdatedate": ["JoinedAtDate", "date"],
				"_lastmessagedatedate": ["LastMessageDate", "date"],
				"_googletranslateoptionreversebutton": ["GoogleTranslateOption", "reverseButton"],
				"_googletranslateoptiontranslatebutton": ["GoogleTranslateOption", "translateButton"],
				"_googletranslateoptiontranslated": ["GoogleTranslateOption", "translated"],
				"_googletranslateoptiontranslating": ["GoogleTranslateOption", "translating"],
				"_oldtitlebarenabled": ["OldTitleBar", "oldTitleBarEnabled"],
				"_oldtitlebarsettingstoolbar": ["OldTitleBar", "settingsToolbar"],
				"_oldtitlebartoolbar": ["OldTitleBar", "toolbar"],
				"_ownertagadminicon": ["OwnerTag", "adminIcon"],
				"_ownertagmanagementicon": ["OwnerTag", "managementIcon"],
				"_ownertagownericon": ["OwnerTag", "ownerIcon"],
				"_pindmsdragpreview": ["PinDMs", "dragPreview"],
				"_pindmsdmchannelpinned": ["PinDMs", "dmChannelPinned"],
				"_pindmsdmchannelplaceholder": ["PinDMs", "dmChannelPlaceholder"],
				"_pindmspinnedchannelsheaderamount": ["PinDMs", "pinnedChannelsHeaderAmount"],
				"_pindmspinnedchannelsheaderarrow": ["PinDMs", "pinnedChannelsHeaderArrow"],
				"_pindmspinnedchannelsheadercollapsed": ["PinDMs", "pinnedChannelsHeaderCollapsed"],
				"_pindmspinnedchannelsheadercolored": ["PinDMs", "pinnedChannelsHeaderColored"],
				"_pindmspinnedchannelsheadercontainer": ["PinDMs", "pinnedChannelsHeaderContainer"],
				"_pindmsrecentpinned": ["PinDMs", "recentPinned"],
				"_pindmsrecentplaceholder": ["PinDMs", "recentPlaceholder"],
				"_pindmsunpinbutton": ["PinDMs", "unpinButton"],
				"_pindmsunpinicon": ["PinDMs", "unpinIcon"],
				"_readallnotificationsbuttonbutton": ["ReadAllNotificationsButton", "button"],
				"_readallnotificationsbuttonframe": ["ReadAllNotificationsButton", "frame"],
				"_readallnotificationsbuttoninner": ["ReadAllNotificationsButton", "innerFrame"],
				"_servercounterservercount": ["ServerCounter", "serverCount"],
				"_serverdetailsdetails": ["ServerDetails", "details"],
				"_serverdetailsicon": ["ServerDetails", "icon"],
				"_serverdetailstooltip": ["ServerDetails", "tooltip"],
				"_serverfoldersdragpreview": ["ServerFolders", "dragPreview"],
				"_serverfoldersfoldercontent": ["ServerFolders", "folderContent"],
				"_serverfoldersfoldercontentclosed": ["ServerFolders", "folderContentClosed"],
				"_serverfoldersfoldercontentisopen": ["ServerFolders", "folderContentIsOpen"],
				"_serverfoldersguildplaceholder": ["ServerFolders", "guildPlaceholder"],
				"_serverfoldersiconswatch": ["ServerFolders", "iconSwatch"],
				"_serverfoldersiconswatchinner": ["ServerFolders", "iconSwatchInner"],
				"_serverfoldersiconswatchpreview": ["ServerFolders", "iconSwatchPreview"],
				"_serverfoldersiconswatchselected": ["ServerFolders", "iconSwatchSelected"],
				"_showhiddenchannelsaccessmodal": ["ShowHiddenChannels", "accessModal"],
				"_spellcheckerror": ["SpellCheck", "error"],
				"_spellcheckoverlay": ["SpellCheck", "overlay"],
				"_spotifycontrolsbar": ["SpotifyControls", "bar"],
				"_spotifycontrolsbarfill": ["SpotifyControls", "barFill"],
				"_spotifycontrolsbargrabber": ["SpotifyControls", "barGabber"],
				"_spotifycontrolsbartext": ["SpotifyControls", "barText"],
				"_spotifycontrolsbuttonactive": ["SpotifyControls", "buttonActive"],
				"_spotifycontrolscontainer": ["SpotifyControls", "container"],
				"_spotifycontrolscontainerinner": ["SpotifyControls", "containerInner"],
				"_spotifycontrolscontainermaximized": ["SpotifyControls", "containerMaximized"],
				"_spotifycontrolscontainerwithtimeline": ["SpotifyControls", "containerWithTimeline"],
				"_spotifycontrolscover": ["SpotifyControls", "cover"],
				"_spotifycontrolscovermaximizer": ["SpotifyControls", "coverMaximizer"],
				"_spotifycontrolscoverwrapper": ["SpotifyControls", "coverWrapper"],
				"_spotifycontrolsdetails": ["SpotifyControls", "details"],
				"_spotifycontrolsinterpret": ["SpotifyControls", "interpret"],
				"_spotifycontrolssettingsicon": ["SpotifyControls", "settingsIcon"],
				"_spotifycontrolssettingslabel": ["SpotifyControls", "settingsLabel"],
				"_spotifycontrolssong": ["SpotifyControls", "song"],
				"_spotifycontrolstimeline": ["SpotifyControls", "timeline"],
				"_spotifycontrolsvolumeslider": ["SpotifyControls", "volumeSlider"],
				"_timedlightdarkmodedategrabber": ["TimedLightDarkMode", "dateGrabber"],
				"_timedlightdarkmodetimergrabber": ["TimedLightDarkMode", "timerGrabber"],
				"_timedlightdarkmodetimersettings": ["TimedLightDarkMode", "timerSettings"],
				"_toproleseverywherebadgestyle": ["TopRolesEverywhere", "badgeStyle"],
				"_toproleseverywherechattag": ["TopRolesEverywhere", "chatTag"],
				"_toproleseverywheremembertag": ["TopRolesEverywhere", "memberTag"],
				"_toproleseverywhererolestyle": ["TopRolesEverywhere", "roleStyle"],
				"_toproleseverywheretag": ["TopRolesEverywhere", "tag"],
				"_repoauthor": ["BDrepo", "bdaAuthor"],
				"_repobutton": ["BDrepo", "bdButton"],
				"_repobuttondanger": ["BDrepo", "bdButtonDanger"],
				"_repocard": ["BDrepo", "bdAddonCard"],
				"_repocheckbox": ["BDrepo", "switchCheckbox"],
				"_repocheckboxchecked": ["BDrepo", "switchChecked"],
				"_repocheckboxinner": ["BDrepo", "switch"],
				"_repocheckboxitem": ["BDrepo", "switchItem"],
				"_repocheckboxwrap": ["BDrepo", "switchWrapper"],
				"_repocontrols": ["BDrepo", "bdControls"],
				"_repocontrolsbutton": ["BDrepo", "bdControlsButton"],
				"_repodescription": ["BDrepo", "bdaDescription"],
				"_repodescriptionwrap": ["BDrepo", "bdaDescriptionWrap"],
				"_repoentry": ["BDFDB", "bdRepoEntry"],
				"_repofolderbutton": ["BDrepo", "bdPfbtn"],
				"_repofooter": ["BDrepo", "bdaFooter"],
				"_repofootercontrols": ["BDFDB", "bdRepoFooterControls"],
				"_repoheader": ["BDrepo", "bdaHeader"],
				"_repoheadercontrols": ["BDFDB", "bdRepoHeaderControls"],
				"_repoheadertitle": ["BDrepo", "bdaHeaderTitle"],
				"_repoicon": ["BDrepo", "bdIcon"],
				"_repolist": ["BDrepo", "bdaSlist"],
				"_repolistheader": ["BDFDB", "bdRepoListHeader"],
				"_repolistwrapper": ["BDFDB", "bdRepoListWrapper"],
				"_repolink": ["BDrepo", "bdaLink"],
				"_repolinks": ["BDrepo", "bdaLinks"],
				"_repometa": ["BDrepo", "bdMeta"],
				"_repomodal": ["BDrepo", "bdAddonModal"],
				"_repomodalfooter": ["BDrepo", "bdAddonModalFooter"],
				"_repomodalheader": ["BDrepo", "bdAddonModalHeader"],
				"_repomodalsettings": ["BDrepo", "bdAddonModalSettings"],
				"_reponame": ["BDrepo", "bdaName"],
				"_reposettings": ["BDrepo", "settings"],
				"_reposettingsbutton": ["BDrepo", "bdaSettingsButton"],
				"_reposettingsopen": ["BDrepo", "settingsOpen"],
				"_reposettingsclosed": ["BDrepo", "settingsClosed"],
				"_reposwitch": ["BDrepo", "bdSwitch"],
				"_reposwitchchecked": ["BDrepo", "bdSwitchChecked"],
				"_reposwitchinner": ["BDrepo", "bdSwitchInner"],
				"_repoupdatebutton": ["BDrepo", "bdUpdatebtn"],
				"_repoversion": ["BDrepo", "bdaVersion"],
				"accountinfo": ["AccountDetails", "container"],
				"accountinfoavatar": ["AccountDetails", "avatar"],
				"accountinfoavatarwrapper": ["AccountDetails", "avatarWrapper"],
				"accountinfobutton": ["AccountDetailsButtons", "button"],
				"accountinfobuttondisabled": ["AccountDetailsButtons", "disabled"],
				"accountinfobuttonenabled": ["AccountDetailsButtons", "enabled"],
				"accountinfodetails": ["AccountDetails", "usernameContainer"],
				"accountinfonametag": ["AccountDetails", "nameTag"],
				"anchor": ["Anchor", "anchor"],
				"anchorunderlineonhover": ["Anchor", "anchorUnderlineOnHover"],
				"animationcontainerbottom": ["AnimationContainer", "animatorBottom"],
				"animationcontainerleft": ["AnimationContainer", "animatorLeft"],
				"animationcontainerright": ["AnimationContainer", "animatorRight"],
				"animationcontainertop": ["AnimationContainer", "animatorTop"],
				"animationcontainerrender": ["AnimationContainer", "didRender"],
				"animationcontainerscale": ["AnimationContainer", "scale"],
				"animationcontainertranslate": ["AnimationContainer", "translate"],
				"app": ["AppOuter", "app"],
				"appcontainer": ["AppBase", "container"],
				"appmount": ["AppMount", "appMount"],
				"applayers": ["AppInner", "layers"],
				"applicationstore": ["ApplicationStore", "applicationStore"],
				"appold": ["AppInner", "app"],
				"auditlog": ["AuditLog", "auditLog"],
				"auditlogoverflowellipsis": ["AuditLog", "overflowEllipsis"],
				"auditloguserhook": ["AuditLog", "userHook"],
				"authbox": ["AuthBox", "authBox"],
				"autocomplete": ["Autocomplete", "autocomplete"],
				"autocompletecontent": ["Autocomplete", "content"],
				"autocompletecontenttitle": ["Autocomplete", "contentTitle"],
				"autocompletedescription": ["Autocomplete", "description"],
				"autocompletedescriptiondiscriminator": ["Autocomplete", "descriptionDiscriminator"],
				"autocompletedescriptionusername": ["Autocomplete", "descriptionUsername"],
				"autocompleteicon": ["Autocomplete", "icon"],
				"autocompleteiconforeground": ["Autocomplete", "iconForeground"],
				"autocompleteinner": ["Autocomplete", "autocompleteInner"],
				"autocompleterow": ["Autocomplete", "autocompleteRow"],
				"autocompleterowhorizontal": ["Autocomplete", "autocompleteRowHorizontal"],
				"autocompleterowvertical": ["Autocomplete", "autocompleteRowVertical"],
				"autocompleteselectable": ["Autocomplete", "selectable"],
				"autocompleteselected": ["Autocomplete", "selected"],
				"avatar": ["Avatar", "avatar"],
				"avatarcursordefault": ["Avatar", "cursorDefault"],
				"avatardisabled": ["BDFDB", "avatarDisabled"],
				"avataricon": ["AvatarIcon", "icon"],
				"avatariconactivelarge": ["AvatarIcon", "iconActiveLarge"],
				"avatariconactivemedium": ["AvatarIcon", "iconActiveMedium"],
				"avatariconactivemini": ["AvatarIcon", "iconActiveMini"],
				"avatariconactivesmall": ["AvatarIcon", "iconActiveSmall"],
				"avatariconactivexlarge": ["AvatarIcon", "iconActiveXLarge"],
				"avatariconinactive": ["AvatarIcon", "iconInactive"],
				"avatariconsizelarge": ["AvatarIcon", "iconSizeLarge"],
				"avatariconsizemedium": ["AvatarIcon", "iconSizeMedium"],
				"avatariconsizemini": ["AvatarIcon", "iconSizeMini"],
				"avatariconsizesmol": ["AvatarIcon", "iconSizeSmol"],
				"avatariconsizesmall": ["AvatarIcon", "iconSizeSmall"],
				"avatariconsizexlarge": ["AvatarIcon", "iconSizeXLarge"],
				"avatarmask": ["Avatar", "mask"],
				"avatarnoicon": ["AvatarIcon", "noIcon"],
				"avatarpointer": ["Avatar", "pointer"],
				"avatarpointerevents": ["Avatar", "pointerEvents"],
				"avatarwrapper": ["Avatar", "wrapper"],
				"backdrop": ["Backdrop", "backdrop"],
				"backdropwithlayer": ["Backdrop", "backdropWithLayer"],
				"badgebase": ["Badge", "base"],
				"badgeicon": ["Badge", "icon"],
				"badgeiconbadge": ["Badge", "iconBadge"],
				"badgenumberbadge": ["Badge", "numberBadge"],
				"badgetextbadge": ["Badge", "textBadge"],
				"badgewrapper": ["NotFound", "badgeWrapper"],
				"bdfdbbadge": ["BDFDB", "badge"],
				"bdfdbbadgeavatar": ["BDFDB", "badgeAvatar"],
				"bdfdbdev": ["BDFDB", "dev"],
				"bdfdbhasbadge": ["BDFDB", "hasBadge"],
				"bdfdbsupporter": ["BDFDB", "supporter"],
				"bdfdbsupportercustom": ["BDFDB", "supporterCustom"],
				"bold": ["TextStyle", "bold"],
				"bottag": ["BotTag", "botTag"],
				"bottaginvert": ["BotTag", "botTagInvert"],
				"bottagmember": ["Member", "botTag"],
				"bottagnametag": ["NameTag", "bot"],
				"bottagpx": ["BotTag", "px"],
				"bottagregular": ["BotTag", "botTagRegular"],
				"bottagrem": ["BotTag", "rem"],
				"bottagtext": ["BotTag", "botText"],
				"bottagverified": ["BotTag", "botTagVerified"],
				"button": ["Button", "button"],
				"buttoncolorblack": ["Button", "colorBlack"],
				"buttoncolorbrand": ["Button", "colorBrand"],
				"buttoncolorgreen": ["Button", "colorGreen"],
				"buttoncolorgrey": ["Button", "colorGrey"],
				"buttoncolorlink": ["Button", "colorLink"],
				"buttoncolorprimary": ["Button", "colorPrimary"],
				"buttoncolorred": ["Button", "colorRed"],
				"buttoncolortransparent": ["Button", "colorTransparent"],
				"buttoncolorwhite": ["Button", "colorWhite"],
				"buttoncoloryellow": ["Button", "colorYellow"],
				"buttoncontents": ["Button", "contents"],
				"buttondisabledoverlay": ["Button", "disabledButtonOverlay"],
				"buttondisabledwrapper": ["Button", "disabledButtonWrapper"],
				"buttonfullwidth": ["Button", "fullWidth"],
				"buttongrow": ["Button", "grow"],
				"buttonhashover": ["Button", "hasHover"],
				"buttonhoverblack": ["Button", "hoverBlack"],
				"buttonhoverbrand": ["Button", "hoverBrand"],
				"buttonhovergreen": ["Button", "hoverGreen"],
				"buttonhovergrey": ["Button", "hoverGrey"],
				"buttonhoverlink": ["Button", "hoverLink"],
				"buttonhoverprimary": ["Button", "hoverPrimary"],
				"buttonhoverred": ["Button", "hoverRed"],
				"buttonhovertransparent": ["Button", "hoverTransparent"],
				"buttonhoverwhite": ["Button", "hoverWhite"],
				"buttonhoveryellow": ["Button", "hoverYellow"],
				"buttonlookblank": ["Button", "lookBlank"],
				"buttonlookfilled": ["Button", "lookFilled"],
				"buttonlookghost": ["Button", "lookGhost"],
				"buttonlookinverted": ["Button", "lookInverted"],
				"buttonlooklink": ["Button", "lookLink"],
				"buttonlookoutlined": ["Button", "lookOutlined"],
				"buttonsizeicon": ["Button", "sizeIcon"],
				"buttonsizelarge": ["Button", "sizeLarge"],
				"buttonsizemax": ["Button", "sizeMax"],
				"buttonsizemedium": ["Button", "sizeMedium"],
				"buttonsizemin": ["Button", "sizeMin"],
				"buttonsizesmall": ["Button", "sizeSmall"],
				"buttonsizexlarge": ["Button", "sizeXlarge"],
				"buttonspinner": ["Button", "spinner"],
				"buttonspinneritem": ["Button", "spinnerItem"],
				"buttonsubmitting": ["Button", "submitting"],
				"callcurrentcontainer": ["CallCurrent", "wrapper"],
				"callcurrentdetails": ["CallDetails", "container"],
				"callcurrentvideo": ["Video", "video"],
				"callincomingicon": ["CallIncoming", "icon"],
				"callincomingroot": ["CallIncoming", "root"],
				"callincomingtitle": ["CallIncoming", "title"],
				"callincomingwrapper": ["CallIncoming", "wrapper"],
				"card": ["Card", "card"],
				"cardbrand": ["Card", "cardBrand"],
				"cardbrandoutline": ["Card", "cardBrandOutline"],
				"carddanger": ["Card", "cardDanger"],
				"carddangeroutline": ["Card", "cardDangerOutline"],
				"carderror": ["CardStatus", "error"],
				"cardprimary": ["Card", "cardPrimary"],
				"cardprimaryeditable": ["Card", "cardPrimaryEditable"],
				"cardprimaryoutline": ["Card", "cardPrimaryOutline"],
				"cardprimaryoutlineeditable": ["Card", "cardPrimaryOutlineEditable"],
				"cardreset": ["CardStatus", "reset"],
				"cardsuccess": ["Card", "cardSuccess"],
				"cardsuccessoutline": ["Card", "cardSuccessOutline"],
				"cardwarning": ["Card", "cardWarning"],
				"cardwarningoutline": ["Card", "cardWarningOutline"],
				"categoryarrow": ["CategoryArrow", "arrow"],
				"categoryarrowopen": ["CategoryArrow", "open"],
				"categoryaddbutton": ["CategoryContainer", "addButton"],
				"categoryaddbuttonicon": ["CategoryContainer", "addButtonIcon"],
				"categorychildren": ["Category", "children"],
				"categoryclickable": ["Category", "clickable"],
				"categorycollapsed": ["Category", "collapsed"],
				"categorycontainerdefault": ["CategoryContainer", "containerDefault"],
				"categoryforcevisible": ["CategoryContainer", "forceVisible"],
				"categoryicon": ["Category", "icon"],
				"categoryiconvisibility": ["CategoryContainer", "iconVisibility"],
				"categorymaincontent": ["Category", "mainContent"],
				"categorymuted": ["Category", "muted"],
				"categoryname": ["Category", "name"],
				"categorywrapper": ["Category", "wrapper"],
				"changelogadded": ["ChangeLog", "added"],
				"changelogcontainer": ["ChangeLog", "container"],
				"changelogfixed": ["ChangeLog", "fixed"],
				"changelogfooter": ["ChangeLog", "footer"],
				"changelogimproved": ["ChangeLog", "improved"],
				"changelogprogress": ["ChangeLog", "progress"],
				"changelogsociallink": ["ChangeLog", "socialLink"],
				"changelogtitle": ["ChangeLog", "title"],
				"channelactionicon": ["ChannelContainer", "actionIcon"],
				"channelchildicon": ["ChannelContainer", "iconItem"],
				"channelchildiconbase": ["ChannelContainer", "iconBase"],
				"channelchildren": ["Channel", "children"],
				"channelcontainerdefault": ["ChannelContainer", "containerDefault"],
				"channelcontent": ["Channel", "content"],
				"channeldisabled": ["ChannelContainer", "disabled"],
				"channelheaderchannelname": ["ChatWindow", "channelName"],
				"channelheaderchildren": ["HeaderBar", "children"],
				"channelheaderdivider": ["HeaderBar", "divider"],
				"channelheaderheaderbar": ["HeaderBar", "container"],
				"channelheaderheaderbarthemed": ["HeaderBar", "themed"],
				"channelheaderheaderbartitle": ["HeaderBar", "title"],
				"channelheadericon": ["HeaderBar", "icon"],
				"channelheadericonbadge": ["HeaderBar", "iconBadge"],
				"channelheadericonclickable": ["HeaderBar", "clickable"],
				"channelheadericonselected": ["HeaderBar", "selected"],
				"channelheadericonwrapper": ["HeaderBar", "iconWrapper"],
				"channelheadertitle": ["ChatWindow", "title"],
				"channelheadertitlewrapper": ["ChatWindow", "titleWrapper"],
				"channelheadersearch": ["HeaderBarExtras", "search"],
				"channelheadersearchbar": ["HeaderBarSearch", "searchBar"],
				"channelheadersearchicon": ["HeaderBarSearch", "icon"],
				"channelheadersearchinner": ["HeaderBarSearch", "search"],
				"channelheadertoolbar": ["HeaderBar", "toolbar"],
				"channelheadertoolbar2": ["HeaderBarExtras", "toolbar"],
				"channelheadertopic": ["HeaderBarTopic", "topic"],
				"channelheadertopicexpandable": ["HeaderBarTopic", "expandable"],
				"channelicon": ["Channel", "icon"],
				"channeliconitem": ["ChannelContainer", "iconItem"],
				"channeliconvisibility": ["ChannelContainer", "iconVisibility"],
				"channelmaincontent": ["Channel", "mainContent"],
				"channelmentionsbadge": ["ChannelContainer", "mentionsBadge"],
				"channelmodeconnected": ["Channel", "modeConnected"],
				"channelmodelocked": ["Channel", "modeLocked"],
				"channelmodemuted": ["Channel", "modeMuted"],
				"channelmodeselected": ["Channel", "modeSelected"],
				"channelmodeunread": ["Channel", "modeUnread"],
				"channelname": ["Channel", "name"],
				"channelpanel": ["AppBase", "activityPanel"],
				"channelpaneltitle": ["NotFound", "channelPanelTitle"],
				"channelpanels": ["AppBase", "panels"],
				"channels": ["AppBase", "sidebar"],
				"channelselected": ["ChannelContainer", "selected"],
				"channelsscroller": ["GuildChannels", "scroller"],
				"channelsunreadbar": ["GuildChannels", "unreadBar"],
				"channelsunreadbarcontainer": ["GuildChannels", "positionedContainer"],
				"channelsunreadbarbottom": ["GuildChannels", "unreadBottom"],
				"channelsunreadbarunread": ["GuildChannels", "unread"],
				"channelsunreadbartop": ["GuildChannels", "unreadTop"],
				"channelunread": ["Channel", "unread"],
				"channeluserlimit": ["ChannelLimit", "wrapper"],
				"channeluserlimitcontainer": ["ChannelContainer", "userLimit"],
				"channeluserlimittotal": ["ChannelLimit", "total"],
				"channeluserlimitusers": ["ChannelLimit", "users"],
				"channelwrapper": ["Channel", "wrapper"],
				"charcounter": ["BDFDB", "charCounter"],
				"chat": ["ChatWindow", "chat"],
				"chatbase": ["AppBase", "base"],
				"chatcontent": ["ChatWindow", "chatContent"],
				"chatform": ["ChatWindow", "form"],
				"chatinner": ["ChatWindow", "content"],
				"chatspacer": ["AppBase", "content"],
				"checkbox": ["Checkbox", "checkbox"],
				"checkboxbox": ["Checkbox", "box"],
				"checkboxchecked": ["Checkbox", "checked"],
				"checkboxcontainer": ["ModalItems", "checkboxContainer"],
				"checkboxinput": ["Checkbox", "input"],
				"checkboxinputdefault": ["Checkbox", "inputDefault"],
				"checkboxinputdisabled": ["Checkbox", "inputDisabled"],
				"checkboxinputreadonly": ["Checkbox", "inputReadonly"],
				"checkboxlabel": ["Checkbox", "label"],
				"checkboxlabelclickable": ["Checkbox", "labelClickable"],
				"checkboxlabeldisabled": ["Checkbox", "labelDisabled"],
				"checkboxlabelforward": ["Checkbox", "labelForward"],
				"checkboxlabelreversed": ["Checkbox", "labelReversed"],
				"checkboxround": ["Checkbox", "round"],
				"checkboxwrapper": ["Checkbox", "checkboxWrapper"],
				"checkboxwrapperdisabled": ["Checkbox", "checkboxWrapperDisabled"],
				"collapsecontainer": ["BDFDB", "collapseContainer"],
				"collapsecontainercollapsed": ["BDFDB", "collapseContainerCollapsed"],
				"collapsecontainerheader": ["BDFDB", "collapseContainerHeader"],
				"collapsecontainerinner": ["BDFDB", "collapseContainerInner"],
				"collapsecontainermini": ["BDFDB", "collapseContainerMini"],
				"collapsecontainertitle": ["BDFDB", "collapseContainerTitle"],
				"colorbase": ["TextColor2", "base"],
				"colorbrand": ["TextColor", "colorBrand"],
				"colorerror": ["TextColor", "colorError"],
				"colormuted": ["TextColor", "colorMuted"],
				"colorgreen": ["TextColor", "colorStatusGreen"],
				"colorpicker": ["ColorPicker", "colorPickerCustom"],
				"colorpickeralpha": ["BDFDB", "colorPickerAlpha"],
				"colorpickeralphacheckered": ["BDFDB", "colorPickerAlphaCheckered"],
				"colorpickeralphacursor": ["BDFDB", "colorPickerAlphaCursor"],
				"colorpickeralphahorizontal": ["BDFDB", "colorPickerAlphaHorizontal"],
				"colorpickergradient": ["BDFDB", "colorPickerGradient"],
				"colorpickergradientbutton": ["BDFDB", "colorPickerGradientButton"],
				"colorpickergradientbuttonenabled": ["BDFDB", "colorPickerGradientButtonEnabled"],
				"colorpickergradientcheckered": ["BDFDB", "colorPickerGradientCheckered"],
				"colorpickergradientcursor": ["BDFDB", "colorPickerGradientCursor"],
				"colorpickergradientcursoredge": ["BDFDB", "colorPickerGradientCursorEdge"],
				"colorpickergradientcursorselected": ["BDFDB", "colorPickerGradientCursorSelected"],
				"colorpickergradienthorizontal": ["BDFDB", "colorPickerGradientHorizontal"],
				"colorpickerhexinput": ["ColorPicker", "customColorPickerInput"],
				"colorpickerhue": ["ColorPickerInner", "hue"],
				"colorpickerhuecursor": ["NotFound", "hueCursor"],
				"colorpickerhuehorizontal": ["NotFound", "hueHorizontal"],
				"colorpickerhuevertical": ["NotFound", "hueVertical"],
				"colorpickerinner": ["ColorPickerInner", "wrapper"],
				"colorpickerrow": ["ColorPicker", "colorPickerRow"],
				"colorpickersaturation": ["ColorPickerInner", "saturation"],
				"colorpickersaturationblack": ["NotFound", "saturationBlack"],
				"colorpickersaturationcolor": ["NotFound", "saturationColor"],
				"colorpickersaturationcursor": ["NotFound", "saturationCursor"],
				"colorpickersaturationwhite": ["NotFound", "saturationWhite"],
				"colorpickerswatch": ["ColorPicker", "colorPickerSwatch"],
				"colorpickerswatches": ["BDFDB", "colorPickerSwatches"],
				"colorpickerswatchesdisabled": ["BDFDB", "colorPickerSwatchesDisabled"],
				"colorpickerswatchcustom": ["ColorPicker", "custom"],
				"colorpickerswatchdefault": ["ColorPicker", "default"],
				"colorpickerswatchdisabled": ["ColorPicker", "disabled"],
				"colorpickerswatchdropper": ["ColorPicker", "colorPickerDropper"],
				"colorpickerswatchdropperfg": ["ColorPicker", "colorPickerDropperFg"],
				"colorpickerswatchnocolor": ["ColorPicker", "noColor"],
				"colorpickerswatchselected": ["BDFDB", "colorPickerSwatchSelected"],
				"colorpickerswatchsingle": ["BDFDB", "colorPickerSwatchSingle"],
				"colorpickerswatchsinglewrapper": ["BDFDB", "colorPickerSwatchSingleWrapper"],
				"colorpickerwrapper": ["BDFDB", "colorPicker"],
				"colorprimary": ["TextColor", "colorHeaderPrimary"],
				"colorred": ["TextColor", "colorStatusRed"],
				"colorsecondary": ["TextColor", "colorHeaderSecondary"],
				"colorselectable": ["TextColor", "selectable"],
				"colorstandard": ["TextColor", "colorStandard"],
				"coloryellow": ["TextColor", "colorStatusYellow"],
				"cursordefault": ["Cursor", "cursorDefault"],
				"cursorpointer": ["Cursor", "cursorPointer"],
				"customstatusemoji": ["CustomStatusIcon", "emoji"],
				"customstatusicon": ["CustomStatusIcon", "icon"],
				"defaultcolor": ["Text", "defaultColor"],
				"description": ["FormText", "description"],
				"directiondown": ["IconDirection", "directionDown"],
				"directionleft": ["IconDirection", "directionLeft"],
				"directionright": ["IconDirection", "directionRight"],
				"directionup": ["IconDirection", "directionUp"],
				"directiontransition": ["IconDirection", "transition"],
				"discriminator": ["NameTag", "discriminator"],
				"divider": ["ModalDivider", "divider"],
				"dividerdefault": ["SettingsItems", "dividerDefault"],
				"dmchannel": ["PrivateChannel", "channel"],
				"dmchannelactivity": ["PrivateChannel", "activity"],
				"dmchannelactivityemoji": ["PrivateChannel", "activityEmoji"],
				"dmchannelactivitytext": ["PrivateChannel", "activityText"],
				"dmchannelclose": ["PrivateChannel", "closeButton"],
				"dmchannelheadercontainer": ["PrivateChannelListScroller", "privateChannelsHeaderContainer"],
				"dmchannelheadertext": ["PrivateChannelListScroller", "headerText"],
				"dmchannels": ["PrivateChannelList", "privateChannels"],
				"dmchannelsempty": ["PrivateChannelListScroller", "empty"],
				"dmchannelsscroller": ["PrivateChannelListScroller", "scroller"],
				"dmpill": ["GuildDm", "pill"],
				"downloadlink": ["DownloadLink", "downloadLink"],
				"ellipsis": ["PopoutActivity", "ellipsis"],
				"embed": ["Embed", "embed"],
				"embedauthor": ["Embed", "embedAuthor"],
				"embedauthoricon": ["Embed", "embedAuthorIcon"],
				"embedauthorname": ["Embed", "embedAuthorName"],
				"embedauthornamelink": ["Embed", "embedAuthorNameLink"],
				"embedcentercontent": ["Embed", "centerContent"],
				"embeddescription": ["Embed", "embedDescription"],
				"embedfield": ["Embed", "embedField"],
				"embedfieldname": ["Embed", "embedFieldName"],
				"embedfields": ["Embed", "embedFields"],
				"embedfieldvalue": ["Embed", "embedFieldValue"],
				"embedfooter": ["Embed", "embedFooter"],
				"embedfootericon": ["Embed", "embedFooterIcon"],
				"embedfooterseparator": ["Embed", "embedFooterSeparator"],
				"embedfootertext": ["Embed", "embedFooterText"],
				"embedfull": ["Embed", "embedFull"],
				"embedgiftag": ["Embed", "embedGIFTag"],
				"embedgrid": ["Embed", "grid"],
				"embedhasthumbnail": ["Embed", "hasThumbnail"],
				"embedhiddenspoiler": ["Embed", "hiddenSpoiler"],
				"embediframe": ["Embed", "embedIframe"],
				"embedimage": ["Embed", "embedImage"],
				"embedlink": ["Embed", "embedLink"],
				"embedmargin": ["Embed", "embedMargin"],
				"embedmedia": ["Embed", "embedMedia"],
				"embedprovider": ["Embed", "embedProvider"],
				"embedspoilerattachment": ["Embed", "spoilerAttachment"],
				"embedspoilerembed": ["Embed", "spoilerEmbed"],
				"embedspotify": ["Embed", "embedSpotify"],
				"embedthumbnail": ["Embed", "embedThumbnail"],
				"embedtitle": ["Embed", "embedTitle"],
				"embedtitlelink": ["Embed", "embedTitleLink"],
				"embedvideo": ["Embed", "embedVideo"],
				"embedvideoaction": ["Embed", "embedVideoAction"],
				"embedvideoactions": ["Embed", "embedVideoActions"],
				"embedvideoimagecomponent": ["Embed", "embedVideoImageComponent"],
				"embedvideoimagecomponentinner": ["Embed", "embedVideoImageComponentInner"],
				"embedwrapper": ["MessageAccessory", "embedWrapper"],
				"emoji": ["Emoji", "emoji"],
				"emojiold": ["NotFound", "emoji"],
				"emojibutton": ["EmojiButton", "emojiButton"],
				"emojibuttonhovered": ["EmojiButton", "emojiButtonHovered"],
				"emojibuttonnormal": ["EmojiButton", "emojiButtonNormal"],
				"emojibuttonsprite": ["EmojiButton", "sprite"],
				"emojiinput": ["EmojiInput", "input"],
				"emojiinputbutton": ["EmojiInput", "emojiButton"],
				"emojiinputbuttoncontainer": ["EmojiInput", "emojiButtonContainer"],
				"emojiinputclearbutton": ["EmojiInput", "clearButton"],
				"emojiinputclearicon": ["EmojiInput", "clearIcon"],
				"emojiinputcontainer": ["EmojiInput", "inputContainer"],
				"emojiinputmodal": ["EmojiInput", "modalRoot"],
				"emojipickerbutton": ["Reactions", "reactionBtn"],
				"emojipicker": ["EmojiPicker", "emojiPicker"],
				"emojipickerdiversityemojiitem": ["EmojiPickerDiversitySelector", "diversityEmojiItem"],
				"emojipickerdiversityemojiitemimage": ["EmojiPickerDiversitySelector", "diversityEmojiItemImage"],
				"emojipickerdiversityselector": ["EmojiPickerDiversitySelector", "diversitySelector"],
				"emojipickerdiversityselectorpopout": ["EmojiPickerDiversitySelector", "diversitySelectorPopout"],
				"emojipickerdiversityselectorwrapper": ["EmojiPicker", "diversitySelector"],
				"emojipickeremojispriteimage": ["EmojiPickerItem", "emojiSpriteImage"],
				"emojipickerheader": ["EmojiPicker", "header"],
				"emojipickerinspector": ["EmojiPickerInspector", "inspector"],
				"emojipickerinspectoremoji": ["EmojiPickerInspectorEmoji", "emoji"],
				"errorscreen": ["ErrorScreen", "wrapper"],
				"expressionpicker": ["ExpressionPicker", "contentWrapper"],
				"expressionpickernav": ["ExpressionPicker", "nav"],
				"expressionpickernavbutton": ["ExpressionPicker", "navButton"],
				"expressionpickernavbuttonactive": ["ExpressionPicker", "navButtonActive"],
				"expressionpickernavitem": ["ExpressionPicker", "navItem"],
				"expressionpickernavlist": ["ExpressionPicker", "navList"],
				"favbuttoncontainer": ["BDFDB", "favButtonContainer"],
				"fileattachment": ["File", "attachment"],
				"fileattachmentinner": ["File", "attachmentInner"],
				"filecancelbutton": ["File", "cancelButton"],
				"filedownloadbutton": ["File", "downloadButton"],
				"filename": ["File", "filename"],
				"filenamelink": ["File", "fileNameLink"],
				"filenamelinkwrapper": ["File", "filenameLinkWrapper"],
				"filenamewrapper": ["File", "filenameWrapper"],
				"flex": ["FlexChild", "flex"],
				"flex2": ["Flex", "flex"],
				"flexalignbaseline": ["Flex", "alignBaseline"],
				"flexaligncenter": ["Flex", "alignCenter"],
				"flexalignend": ["Flex", "alignEnd"],
				"flexalignstart": ["Flex", "alignStart"],
				"flexalignstretch": ["Flex", "alignStretch"],
				"flexcenter": ["Flex", "flexCenter"],
				"flexchild": ["FlexChild", "flexChild"],
				"flexdirectioncolumn": ["Flex", "directionColumn"],
				"flexdirectionrow": ["Flex", "directionRow"],
				"flexdirectionrowreverse": ["Flex", "directionRowReverse"],
				"flexhorizontal": ["FlexChild", "horizontal"],
				"flexhorizontalreverse": ["FlexChild", "horizontalReverse"],
				"flexjustifycenter": ["Flex", "justifyCenter"],
				"flexjustifyend": ["Flex", "justifyEnd"],
				"flexjustifystart": ["Flex", "justifyStart"],
				"flexmarginreset": ["FlexChild", "flexMarginReset"],
				"flexnowrap": ["Flex", "noWrap"],
				"flexspacer": ["Flex", "spacer"],
				"flexvertical": ["Flex", "vertical"],
				"flexwrap": ["Flex", "wrap"],
				"flexwrapreverse": ["Flex", "wrapReverse"],
				"flowerstar": ["FlowerStar", "flowerStar"],
				"flowerstarchild": ["FlowerStar", "childContainer"],
				"flowerstarcontainer": ["FlowerStar", "flowerStarContainer"],
				"formtext": ["FormText", "formText"],
				"game": ["Game", "game"],
				"gameicon": ["GameIcon", "gameIcon"],
				"gameiconlarge": ["GameIcon", "large"],
				"gameiconmedium": ["GameIcon", "medium"],
				"gameiconsmall": ["GameIcon", "small"],
				"gameiconxsmall": ["GameIcon", "xsmall"],
				"gamelibrarytable": ["GameLibraryTable", "table"],
				"gamelibrarytableheader": ["GameLibraryTable", "header"],
				"gamelibrarytableheadercell": ["GameLibraryTable", "headerCell"],
				"gamelibrarytableheadercellsorted": ["GameLibraryTable", "headerCellSorted"],
				"gamelibrarytablerow": ["GameLibraryTable", "row"],
				"gamelibrarytablerowwrapper": ["GameLibraryTable", "rowWrapper"],
				"gamelibrarytablestickyheader": ["GameLibraryTable", "stickyHeader"],
				"gamename": ["Game", "gameName"],
				"gamenameinput": ["Game", "gameNameInput"],
				"giffavoritebutton": ["MessageAccessory", "gifFavoriteButton"],
				"giffavoritecolor": ["GifFavoriteButton", "gifFavoriteButton"],
				"giffavoriteicon": ["GifFavoriteButton", "icon"],
				"giffavoriteshowpulse": ["GifFavoriteButton", "showPulse"],
				"giffavoritesize": ["GifFavoriteButton", "size"],
				"giffavoriteselected": ["GifFavoriteButton", "selected"],
				"goliveactions": ["GoLiveDetails", "actions"],
				"golivebody": ["GoLiveDetails", "body"],
				"goliveclickablegamewrapper": ["GoLiveDetails", "clickableGameWrapper"],
				"golivegameicon": ["GoLiveDetails", "gameIcon"],
				"golivegamename": ["GoLiveDetails", "gameName"],
				"golivegamewrapper": ["GoLiveDetails", "gameWrapper"],
				"goliveinfo": ["GoLiveDetails", "info"],
				"golivepanel": ["GoLiveDetails", "panel"],
				"guild": ["BDFDB", "guild"],
				"guildbuttoncontainer": ["GuildsItems", "circleButtonMask"],
				"guildbuttoninner": ["GuildsItems", "circleIconButton"],
				"guildbuttonicon": ["GuildsItems", "circleIcon"],
				"guildbuttonpill": ["GuildsItems", "pill"],
				"guildbuttonselected": ["GuildsItems", "selected"],
				"guildchannels": ["GuildChannelsWrapper", "container"],
				"guildcontainer": ["GuildServer", "blobContainer"],
				"guilddiscovery": ["GuildDiscovery", "pageWrapper"],
				"guildedge": ["GuildEdges", "edge"],
				"guildedgehalf": ["GuildEdges", "half"],
				"guildedgehigher": ["GuildEdges", "higher"],
				"guildedgemiddle": ["GuildEdges", "middle"],
				"guildedgewrapper": ["GuildEdges", "wrapper"],
				"guildserror": ["GuildsItems", "guildsError"],
				"guildserrorinner": ["GuildsItems", "errorInner"],
				"guildfolder": ["GuildFolder", "folder"],
				"guildfolderexpandedbackground": ["GuildFolder", "expandedFolderBackground"],
				"guildfolderexpandedbackgroundcollapsed": ["GuildFolder", "collapsed"],
				"guildfolderexpandedbackgroundhover": ["GuildFolder", "hover"],
				"guildfolderguildicon": ["GuildFolder", "guildIcon"],
				"guildfoldericonwrapper": ["GuildFolder", "folderIconWrapper"],
				"guildfoldericonwrapperclosed": ["GuildFolder", "closedFolderIconWrapper"],
				"guildfoldericonwrapperexpanded": ["GuildFolder", "expandedFolderIconWrapper"],
				"guildfolderwrapper": ["GuildFolder", "wrapper"],
				"guildheader": ["GuildHeader", "container"],
				"guildheaderbannerimage": ["GuildHeader", "bannerImage"],
				"guildheaderbannerimagecontainer": ["GuildHeader", "animatedContainer"],
				"guildheaderbannervisible": ["GuildHeader", "bannerVisible"],
				"guildheaderbutton": ["GuildHeaderButton", "button"],
				"guildheaderbuttonopen": ["GuildHeaderButton", "open"],
				"guildheaderclickable": ["GuildHeader", "clickable"],
				"guildheaderhasbanner": ["GuildHeader", "hasBanner"],
				"guildheadericoncontainer": ["GuildHeader", "guildIconContainer"],
				"guildheadericonbgtiernone": ["GuildHeader", "iconBackgroundTierNone"],
				"guildheadericonbgtierone": ["GuildHeader", "iconBackgroundTierOne"],
				"guildheadericonbgtierthree": ["GuildHeader", "iconBackgroundTierThree"],
				"guildheadericonbgtiertwo": ["GuildHeader", "iconBackgroundTierTwo"],
				"guildheadericonpremiumgem": ["GuildHeader", "premiumGuildIconGem"],
				"guildheadericontiernone": ["GuildHeader", "iconTierNone"],
				"guildheadericontierone": ["GuildHeader", "iconTierOne"],
				"guildheadericontierthree": ["GuildHeader", "iconTierThree"],
				"guildheadericontiertwo": ["GuildHeader", "iconTierTwo"],
				"guildheaderheader": ["GuildHeader", "header"],
				"guildheadername": ["GuildHeader", "name"],
				"guildicon": ["GuildIcon", "icon"],
				"guildiconacronym": ["GuildIcon", "acronym"],
				"guildiconbadge": ["GuildsItems", "iconBadge"],
				"guildiconchildwrapper": ["GuildIcon", "childWrapper"],
				"guildiconselected": ["GuildIcon", "selected"],
				"guildiconwrapper": ["GuildIcon", "wrapper"],
				"guildinner": ["Guild", "wrapper"],
				"guildinnerwrapper": ["GuildsItems", "listItemWrapper"],
				"guildlowerbadge": ["Guild", "lowerBadge"],
				"guildlowerleftbadge": ["BDFDB", "guildLowerLeftBadge"],
				"guildouter": ["GuildsItems", "listItem"],
				"guildpill": ["GuildServer", "pill"],
				"guildpillitem": ["PillWrapper", "item"],
				"guildpillwrapper": ["PillWrapper", "wrapper"],
				"guildplaceholder": ["GuildsItems", "dragInner"],
				"guildplaceholdermask": ["GuildsItems", "placeholderMask"],
				"guilds": ["AppBase", "guilds"],
				"guildseparator": ["GuildsItems", "guildSeparator"],
				"guildserror": ["GuildsItems", "guildsError"],
				"guildsettingsbannedcard": ["GuildSettingsBanned", "bannedUser"],
				"guildsettingsbanneddiscrim": ["GuildSettingsBanned", "discrim"],
				"guildsettingsbannedusername": ["GuildSettingsBanned", "username"],
				"guildsettingsemojicard": ["GuildSettingsEmoji", "emojiRow"],
				"guildsettingsinvitecard": ["GuildSettingsInvite", "inviteSettingsInviteRow"],
				"guildsettingsinvitechannelname": ["GuildSettingsInvite", "channelName"],
				"guildsettingsinviteusername": ["GuildSettingsInvite", "username"],
				"guildsettingsmembercard": ["GuildSettingsMember", "member"],
				"guildsettingsmembername": ["GuildSettingsMember", "name"],
				"guildsettingsmembernametag": ["GuildSettingsMember", "nameTag"],
				"guildsettingsrolesbuttonwrapper": ["GuildSettingsRoles", "buttonWrapper"],
				"guildslabel": ["BDFDB", "guildsLabel"],
				"guildsscroller": ["GuildsWrapper", "scroller"],
				"guildstree": ["GuildsWrapper", "tree"],
				"guildsummaryclickableicon": ["BDFDB", "guildSummaryClickableIcon"],
				"guildsummarycontainer": ["BDFDB", "guildSummaryContainer"],
				"guildsummaryemptyguild": ["BDFDB", "guildSummaryEmptyGuild"],
				"guildsummaryicon": ["BDFDB", "guildSummaryIcon"],
				"guildsummaryiconcontainer": ["BDFDB", "guildSummaryIconContainer"],
				"guildsummaryiconcontainermasked": ["BDFDB", "guildSummaryIconContainerMasked"],
				"guildsummarymoreguilds": ["BDFDB", "guildSummaryMoreGuilds"],
				"guildsummarysvgicon": ["BDFDB", "guildSummarySvgIcon"],
				"guildsvg": ["Guild", "svg"],
				"guildswrapper": ["GuildsWrapper", "wrapper"],
				"guildswrapperunreadmentionsbar": ["GuildsWrapper", "unreadMentionsBar"],
				"guildswrapperunreadmentionsbarbottom": ["GuildsWrapper", "unreadMentionsIndicatorBottom"],
				"guildswrapperunreadmentionsbartop": ["GuildsWrapper", "unreadMentionsIndicatorTop"],
				"guildtutorialcontainer": ["GuildsItems", "tutorialContainer"],
				"guildupperbadge": ["Guild", "upperBadge"],
				"guildupperleftbadge": ["BDFDB", "guildUpperLeftBadge"],
				"h1": ["Text", "h1"],
				"h1defaultmargin": ["Text", "defaultMarginh1"],
				"h2": ["Text", "h2"],
				"h2defaultmargin": ["Text", "defaultMarginh2"],
				"h3": ["Text", "h3"],
				"h3defaultmargin": ["Text", "defaultMarginh3"],
				"h4": ["Text", "h4"],
				"h4defaultmargin": ["Text", "defaultMarginh4"],
				"h5": ["Text", "h5"],
				"h5defaultmargin": ["Text", "defaultMarginh5"],
				"headertitle": ["Text", "title"],
				"height12": ["UserPopout", "height12"],
				"highlight": ["NotFound", "highlight"],
				"homebuttonicon": ["HomeIcon", "homeIcon"],
				"homebuttonpill": ["HomeIcon", "pill"],
				"hotkeybutton": ["HotKeyRecorder", "button"],
				"hotkeycontainer": ["HotKeyRecorder", "container"],
				"hotkeydisabled": ["HotKeyRecorder", "disabled"],
				"hotkeyediticon": ["HotKeyRecorder", "editIcon"],
				"hotkeyhasvalue": ["HotKeyRecorder", "hasValue"],
				"hotkeyinput": ["HotKeyRecorder", "input"],
				"hotkeyinput2": ["HotKeyRecorder", "input"],
				"hotkeylayout": ["HotKeyRecorder", "layout"],
				"hotkeylayout2": ["HotKeyRecorder", "layout"],
				"hotkeyrecording": ["HotKeyRecorder", "recording"],
				"hotkeyresetbutton": ["BDFDB", "hotkeyResetButton"],
				"hotkeyshadowpulse": ["HotKeyRecorder", "shadowPulse"],
				"hotkeytext": ["HotKeyRecorder", "text"],
				"hotkeywrapper": ["BDFDB", "hotkeyWrapper"],
				"hovercard": ["HoverCard", "card"],
				"hovercardbutton": ["NotFound", "hoverCardButton"],
				"hovercarddisabled": ["BDFDB", "cardDisabled"],
				"hovercardhorizontal": ["BDFDB", "cardHorizontal"],
				"hovercardinner": ["BDFDB", "cardInner"],
				"hovercardwrapper": ["BDFDB", "cardWrapper"],
				"icon": ["EmbedActions", "icon"],
				"iconactionswrapper": ["EmbedActions", "wrapper"],
				"iconexternal": ["EmbedActions", "iconExternal"],
				"iconexternalmargins": ["EmbedActions", "iconExternalMargins"],
				"iconplay": ["EmbedActions", "iconPlay"],
				"iconwrapper": ["EmbedActions", "iconWrapper"],
				"iconwrapperactive": ["EmbedActions", "iconWrapperActive"],
				"imageaccessory": ["ImageWrapper", "imageAccessory"],
				"imageclickable": ["ImageWrapper", "clickable"],
				"imageerror": ["ImageWrapper", "imageError"],
				"imageplaceholder": ["ImageWrapper", "imagePlaceholder"],
				"imageplaceholderoverlay": ["ImageWrapper", "imagePlaceholderOverlay"],
				"imagemodal": ["ImageModal", "modal"],
				"imagemodalimage": ["ImageModal", "image"],
				"imagewrapper": ["ImageWrapper", "imageWrapper"],
				"imagewrapperbackground": ["ImageWrapper", "imageWrapperBackground"],
				"imagewrapperinner": ["ImageWrapper", "imageWrapperInner"],
				"imagezoom": ["ImageWrapper", "imageZoom"],
				"itemlayer": ["ItemLayerContainer", "layer"],
				"itemlayercontainer": ["ItemLayerContainer", "layerContainer"],
				"itemlayerdisabledpointerevents": ["ItemLayerContainer", "disabledPointerEvents"],
				"input": ["Input", "input"],
				"inputdefault": ["Input", "inputDefault"],
				"inputdisabled": ["Input", "disabled"],
				"inputeditable": ["Input", "editable"],
				"inputerror": ["Input", "error"],
				"inputfocused": ["Input", "focused"],
				"inputlist": ["BDFDB", "listInput"],
				"inputlistdelete": ["BDFDB", "listInputDelete"],
				"inputlistitem": ["BDFDB", "listInputItem"],
				"inputlistitems": ["BDFDB", "listInputItems"],
				"inputmini": ["Input", "inputMini"],
				"inputmulti": ["BDFDB", "multiInput"],
				"inputmultifield": ["BDFDB", "multiInputField"],
				"inputmultifirst": ["BDFDB", "multiInputFirst"],
				"inputmultilast": ["BDFDB", "multiInputLast"],
				"inputmultiwrapper": ["BDFDB", "multiInputWrapper"],
				"inputnumberbutton": ["BDFDB", "inputNumberButton"],
				"inputnumberbuttondown": ["BDFDB", "inputNumberButtonDown"],
				"inputnumberbuttonup": ["BDFDB", "inputNumberButtonUp"],
				"inputnumberbuttons": ["BDFDB", "inputNumberButtons"],
				"inputnumberwrapper": ["BDFDB", "inputNumberWrapper"],
				"inputnumberwrapperdefault": ["BDFDB", "inputNumberWrapperDefault"],
				"inputnumberwrappermini": ["BDFDB", "inputNumberWrapperMini"],
				"inputprefix": ["Input", "inputPrefix"],
				"inputsuccess": ["Input", "success"],
				"inputwrapper": ["Input", "inputWrapper"],
				"invite": ["GuildInvite", "wrapper"],
				"invitebutton": ["GuildInvite", "button"],
				"invitebuttonfornonmember": ["GuildInvite", "buttonForNonMember"],
				"invitebuttonresolving": ["GuildInvite", "invite-button-resolving"],
				"invitebuttonsize": ["GuildInvite", "buttonSize"],
				"invitechannel": ["GuildInvite", "channel"],
				"invitechannelicon": ["GuildInvite", "channelIcon"],
				"invitechannelname": ["GuildInvite", "channelName"],
				"invitecontent": ["GuildInvite", "content"],
				"invitecount": ["GuildInvite", "count"],
				"invitecursordefault": ["GuildInvite", "cursorDefault"],
				"invitedestination": ["GuildInvite", "inviteDestination"],
				"invitedestinationexpired": ["GuildInvite", "inviteDestinationExpired"],
				"invitedestinationjoined": ["GuildInvite", "inviteDestinationJoined"],
				"inviteguildbadge": ["GuildInvite", "guildBadge"],
				"inviteguilddetail": ["GuildInvite", "guildDetail"],
				"inviteguildicon": ["GuildInvite", "guildIcon"],
				"inviteguildiconexpired": ["GuildInvite", "guildIconExpired"],
				"inviteguildiconimage": ["GuildInvite", "guildIconImage"],
				"inviteguildiconimagejoined": ["GuildInvite", "guildIconImageJoined"],
				"inviteguildiconjoined": ["GuildInvite", "guildIconJoined"],
				"inviteguildinfo": ["GuildInvite", "guildInfo"],
				"inviteguildname": ["GuildInvite", "guildName"],
				"inviteguildnamewrapper": ["GuildInvite", "guildNameWrapper"],
				"inviteheader": ["GuildInvite", "header"],
				"invitemodal": ["InviteModal", "modal"],
				"invitemodalinviterow": ["InviteModal", "inviteRow"],
				"invitemodalinviterowname": ["InviteModal", "inviteRowName"],
				"invitemodalwrapper": ["InviteModal", "wrapper"],
				"invitesplash": ["GuildInvite", "inviteSplash"],
				"invitesplashimage": ["GuildInvite", "inviteSplashImage"],
				"invitesplashimageloaded": ["GuildInvite", "inviteSplashImageLoaded"],
				"inviteresolving": ["GuildInvite", "resolving"],
				"inviteresolvingbackground": ["GuildInvite", "resolvingBackground"],
				"invitestatus": ["GuildInvite", "status"],
				"invitestatuscounts": ["GuildInvite", "statusCounts"],
				"invitestatusoffline": ["GuildInvite", "statusOffline"],
				"invitestatusonline": ["GuildInvite", "statusOnline"],
				"inviteuserselectnone": ["GuildInvite", "userSelectNone"],
				"italics": ["TextStyle", "italics"],
				"layermodal": ["LayerModal", "root"],
				"layermodallarge": ["LayerModal", "large"],
				"layermodalmedium": ["LayerModal", "medium"],
				"layermodalsmall": ["LayerModal", "small"],
				"layer": ["Layers", "layer"],
				"layerbase": ["Layers", "baseLayer"],
				"layers": ["Layers", "layers"],
				"layersbg": ["Layers", "bg"],
				"listavatar": ["UserProfile", "listAvatar"],
				"listdiscriminator": ["UserProfile", "listDiscriminator"],
				"listname": ["UserProfile", "listName"],
				"listrow": ["UserProfile", "listRow"],
				"listrowcontent": ["UserProfile", "listRowContent"],
				"listrowwrapper": ["BDFDB", "listRow"],
				"listscroller": ["UserProfile", "listScroller"],
				"livetag": ["LiveTag", "live"],
				"livetaggrey": ["LiveTag", "grey"],
				"livetaglarge": ["LiveTag", "liveLarge"],
				"livetagsmall": ["LiveTag", "liveSmall"],
				"loadingicon": ["BDFDB", "loadingIcon"],
				"loadingiconwrapper": ["BDFDB", "loadingIconWrapper"],
				"loadingscreen": ["LoadingScreen", "container"],
				"loginscreen": ["NotFound", "loginScreen"],
				"marginbottom4": ["Margins", "marginBottom4"],
				"marginbottom8": ["Margins", "marginBottom8"],
				"marginbottom20": ["Margins", "marginBottom20"],
				"marginbottom40": ["Margins", "marginBottom40"],
				"marginbottom60": ["Margins", "marginBottom60"],
				"margincenterhorz": ["Margins", "marginCenterHorz"],
				"marginleft4": ["Autocomplete", "marginLeft4"],
				"marginleft8": ["Autocomplete", "marginLeft8"],
				"marginreset": ["Margins", "marginReset"],
				"margintop4": ["Margins", "marginTop4"],
				"margintop8": ["Margins", "marginTop8"],
				"margintop20": ["Margins", "marginTop20"],
				"margintop40": ["Margins", "marginTop40"],
				"margintop60": ["Margins", "marginTop60"],
				"member": ["Member", "member"],
				"memberactivity": ["Member", "activity"],
				"membericon": ["Member", "icon"],
				"memberoffline": ["Member", "offline"],
				"memberownericon": ["Member", "ownerIcon"],
				"memberpremiumicon": ["Member", "premiumIcon"],
				"members": ["MembersWrapper", "members"],
				"membersgroup": ["MembersWrapper", "membersGroup"],
				"memberswrap": ["MembersWrapper", "membersWrap"],
				"memberusername": ["Member", "roleColor"],
				"mention": ["NotFound", "mention"],
				"mentioninteractive": ["NotFound", "mentionInteractive"],
				"mentionwrapper": ["NotFound", "mentionWrapper"],
				"menu": ["Menu", "menu"],
				"menucaret": ["Menu", "caret"],
				"menucaretarrow": ["MenuCaret", "arrow"],
				"menucaretopen": ["MenuCaret", "open"],
				"menucheck": ["Menu", "check"],
				"menucheckbox": ["Menu", "checkbox"],
				"menucolorbrand": ["Menu", "colorBrand"],
				"menucolorcustom": ["BDFDB", "menuColorCustom"],
				"menucolordanger": ["Menu", "colorDanger"],
				"menucolordefault": ["Menu", "colorDefault"],
				"menucolorpremium": ["Menu", "colorPremium"],
				"menucustomitem": ["Menu", "customItem"],
				"menudisabled": ["Menu", "disabled"],
				"menufocused": ["Menu", "focused"],
				"menuhideinteraction": ["Menu", "hideInteraction"],
				"menuhint": ["BDFDB", "menuItemHint"],
				"menuhintcontainer": ["Menu", "hintContainer"],
				"menuicon": ["Menu", "icon"],
				"menuiconcontainer": ["Menu", "iconContainer"],
				"menuimage": ["Menu", "image"],
				"menuimagecontainer": ["Menu", "imageContainer"],
				"menuitem": ["Menu", "item"],
				"menulabel": ["Menu", "label"],
				"menulabelcontainer": ["Menu", "labelContainer"],
				"menureactbutton": ["MenuReactButton", "button"],
				"menureactbuttonfocused": ["MenuReactButton", "focused"],
				"menureactbuttonicon": ["MenuReactButton", "icon"],
				"menureactbuttons": ["MenuReactButton", "wrapper"],
				"menuscroller": ["Menu", "scroller"],
				"menuseparator": ["Menu", "separator"],
				"menuslider": ["MenuSlider", "slider"],
				"menuslidercontainer": ["MenuSlider", "sliderContainer"],
				"menustylefixed": ["Menu", "styleFixed"],
				"menustyleflexible": ["Menu", "styleFlexible"],
				"menusubmenu": ["Menu", "submenu"],
				"menusubmenucontainer": ["Menu", "submenuContainer"],
				"menusubtext": ["Menu", "subtext"],
				"message": ["Message", "message"],
				"messageaccessory": ["MessageAccessory", "container"],
				"messageavatar": ["MessageBody", "avatar"],
				"messageavatarclickable": ["MessageBody", "clickable"],
				"messagebackgroundflash": ["Message", "backgroundFlash"],
				"messagebarbase": ["MessageElements", "barBase"],
				"messagebarbuttonalt": ["MessageElements", "barButtonAlt"],
				"messagebarbuttonbase": ["MessageElements", "barButtonBase"],
				"messagebarbuttonicon": ["MessageElements", "barButtonIcon"],
				"messagebarbuttonmain": ["MessageElements", "barButtonMain"],
				"messagebarhasmore": ["MessageElements", "hasMore"],
				"messagebarjumptopresentbar": ["MessageElements", "jumpToPresentBar"],
				"messagebarloadingmore": ["MessageElements", "loadingMore"],
				"messagebarnewmessagesbar": ["MessageElements", "newMessagesBar"],
				"messagebarspan": ["MessageElements", "span"],
				"messagebarspinner": ["MessageElements", "spinner"],
				"messagebarspinneritem": ["MessageElements", "spinnerItem"],
				"messagebeforegroup": ["Message", "beforeGroup"],
				"messageblockedaction": ["MessageBlocked", "blockedAction"],
				"messageblockedcontainer": ["MessageBlocked", "container"],
				"messageblockedexpanded": ["MessageBlocked", "expanded"],
				"messageblockedicon": ["MessageBlocked", "blockedIcon"],
				"messageblockedsystemmessage": ["MessageBlocked", "blockedSystemMessage"],
				"messageblockedtext": ["MessageBlocked", "blockedMessageText"],
				"messageblockquotecontainer": ["MessageMarkup", "blockquoteContainer"],
				"messageblockquotedivider": ["MessageMarkup", "blockquoteDivider"],
				"messagebottag": ["MessageBody", "botTag"],
				"messagebottagcompact": ["MessageBody", "botTagCompact"],
				"messagebottagcozy": ["MessageBody", "botTagCozy"],
				"messagebuttoncontainer": ["MessageBody", "buttonContainer"],
				"messagebuttons": ["Message", "buttons"],
				"messagechanneltextarea": ["Message", "channelTextArea"],
				"messagecompact": ["MessageBody", "compact"],
				"messagecontents": ["MessageBody", "contents"],
				"messagecozy": ["MessageBody", "cozy"],
				"messagecozymessage": ["Message", "cozyMessage"],
				"messagedisableinteraction": ["Message", "disableInteraction"],
				"messagedivider": ["Message", "divider"],
				"messagedividerhascontent": ["Message", "hasContent"],
				"messageedited": ["MessageBody", "edited"],
				"messagegroupstart": ["Message", "groupStart"],
				"messagegroupblocked": ["MessageElements", "messageGroupBlocked"],
				"messagegroupblockedbtn": ["MessageElements", "messageGroupBlockedBtn"],
				"messagegroupblockedrevealed": ["MessageElements", "revealed"],
				"messageheader": ["MessageBody", "header"],
				"messageheadertext": ["MessageBody", "headerText"],
				"messagelocalbot": ["Message", "ephemeral"],
				"messagelocalboticon": ["MessageLocalBot", "icon"],
				"messagelocalbotoperations": ["MessageLocalBot", "ephemeralMessage"],
				"messagemarkup": ["MessageMarkup", "markup"],
				"messagemarkupcompact": ["MessageBody", "compact"],
				"messagemarkupcontent": ["MessageBody", "messageContent"],
				"messagemarkupcozy": ["MessageBody", "cozy"],
				"messagemarkupisfailed": ["MessageBody", "isFailed"],
				"messagemarkupissending": ["MessageBody", "isSending"],
				"messagemarkuprtl": ["MessageBody", "markupRtl"],
				"messagementioned": ["Message", "mentioned"],
				"messagepopout": ["MessagePopout", "message"],
				"messageoperations": ["MessageOperations", "operations"],
				"messagereaction": ["MessageReactions", "reaction"],
				"messagereactionme": ["MessageReactions", "reactionMe"],
				"messagereactions": ["MessageReactions", "reactions"],
				"messagereactionsmodalemoji": ["MessageReactionsModal", "emoji"],
				"messagereactionsmodalname": ["MessageReactionsModal", "name"],
				"messagereactionsmodalnickname": ["MessageReactionsModal", "nickname"],
				"messagereactionsmodalreactor": ["MessageReactionsModal", "reactor"],
				"messagereactionsmodalusername": ["MessageReactionsModal", "username"],
				"messagerepliedmessage": ["MessageBody", "repliedMessage"],
				"messagereply": ["MessageReply", "container"],
				"messagereplyname": ["MessageReply", "name"],
				"messagereplytext": ["MessageReply", "text"],
				"messageselected": ["Message", "selected"],
				"messages": ["MessagesWrap", "messages"],
				"messagesdivider": ["MessagesWrap", "divider"],
				"messagesloadingavatar": ["MessagesLoading", "avatar"],
				"messagesloadingcompact": ["MessagesLoading", "compact"],
				"messagesloadingcozy": ["MessagesLoading", "cozy"],
				"messagesloadingmessage": ["MessagesLoading", "wrapper"],
				"messagesloadingwrapper": ["NotFound", "messagesLoadingWrapper"],
				"messagespopout": ["MessagesPopout", "messagesPopout"],
				"messagespopoutactionbuttons": ["MessagesPopout", "actionButtons"],
				"messagespopoutbody": ["MessagesPopout", "body"],
				"messagespopoutbottom": ["MessagesPopout", "bottom"],
				"messagespopoutbutton": ["MessagesPopoutButtons", "button"],
				"messagespopoutbuttonsecondary": ["MessagesPopoutButtons", "secondary"],
				"messagespopoutbuttontertiary": ["MessagesPopoutButtons", "tertiary"],
				"messagespopoutchannelname": ["MessagesPopout", "channelName"],
				"messagespopoutchannelseparator": ["MessagesPopout", "channelSeparator"],
				"messagespopoutclosebutton": ["MessagesPopout", "closeIcon"],
				"messagespopoutemptyplaceholder": ["MessagesPopout", "emptyPlaceholder"],
				"messagespopoutfooter": ["MessagesPopout", "footer"],
				"messagespopoutguildname": ["MessagesPopout", "guildName"],
				"messagespopoutgroupcozy": ["MessagesPopout", "messageGroupCozy"],
				"messagespopoutgroupwrapper": ["MessagesPopout", "messageGroupWrapper"],
				"messagespopouthasmore": ["MessagesPopout", "hasMore"],
				"messagespopouthasmorebutton": ["MessagesPopout", "hasMoreButton"],
				"messagespopoutheader": ["MessagesPopout", "header"],
				"messagespopoutimage": ["MessagesPopout", "image"],
				"messagespopoutjumpbutton": ["MessagesPopout", "jumpButton"],
				"messagespopoutloading": ["MessagesPopout", "loading"],
				"messagespopoutloadingmore": ["MessagesPopout", "loadingMore"],
				"messagespopoutloadingplaceholder": ["MessagesPopout", "loadingPlaceholder"],
				"messagespopoutscrollingfooterwrap": ["MessagesPopout", "scrollingFooterWrap"],
				"messagespopoutspinner": ["MessagesPopout", "spinner"],
				"messagespopouttabbar": ["MessagesPopoutTabBar", "tabBar"],
				"messagespopouttabbarheader": ["MessagesPopoutTabBar", "header"],
				"messagespopouttabbartab": ["MessagesPopoutTabBar", "tab"],
				"messagespopouttabbartabactive": ["MessagesPopoutTabBar", "active"],
				"messagespopouttitle": ["MessagesPopout", "title"],
				"messagespopoutvisible": ["MessagesPopout", "visible"],
				"messagespopoutwrap": ["MessagesPopout", "messagesPopoutWrap"],
				"messagesscroller": ["MessagesWrap", "scroller"],
				"messagesscrollercontent": ["MessagesWrap", "scrollerContent"],
				"messagesscrollerinner": ["MessagesWrap", "scrollerInner"],
				"messagesscrollerwrapper": ["MessagesWrap", "scrollerWrap"],
				"messageswelcome": ["MessagesWelcome", "container"],
				"messageswelcomebutton": ["MessagesWelcomeButton", "button"],
				"messageswelcomebuttoncontainer": ["NotFound", "messagesWelcomeChannelButtonContainer"],
				"messageswelcomebuttonicon": ["MessagesWelcomeButton", "buttonIcon"],
				"messageswelcomedescription": ["MessagesWelcome", "description"],
				"messageswelcomeemptychannelicon": ["MessagesWelcome", "emptyChannelIcon"],
				"messageswelcomeheader": ["MessagesWelcome", "header"],
				"messageswelcomelocked": ["MessagesWelcome", "locked"],
				"messageswrapper": ["MessagesWrap", "messagesWrapper"],
				"messagesystem": ["Message", "systemMessage"],
				"messagesystemaccessories": ["MessageBody", "systemMessageAccessories"],
				"messagesystemcontainer": ["MessageSystem", "container"],
				"messagesystemcontent": ["MessageSystem", "content"],
				"messagesystemicon": ["MessageSystem", "icon"],
				"messagesystemiconcontainer": ["MessageSystem", "iconContainer"],
				"messagesystemiconsize": ["MessageSystem", "iconSize"],
				"messagetimedivider": ["MessageDivider", "divider"],
				"messagetimedividercontent": ["MessageDivider", "content"],
				"messagetimedividerhascontent": ["MessageDivider", "hasContent"],
				"messagetimedividerisunread": ["MessageDivider", "isUnread"],
				"messagetimedividerunreadpill": ["MessageDivider", "unreadPill"],
				"messagetimedividerunreadpillcap": ["MessageDivider", "unreadPillCap"],
				"messagetimedividerunreadpillcapstroke": ["MessageDivider", "unreadPillCapStroke"],
				"messagetimestampasiancompact": ["MessageBody", "asianCompactTimeStamp"],
				"messagetimestamp": ["MessageBody", "timestamp"],
				"messagetimestampalt": ["MessageBody", "alt"],
				"messagetimestamplatin12compact": ["MessageBody", "latin12CompactTimeStamp"],
				"messagetimestamplatin24compact": ["MessageBody", "latin24CompactTimeStamp"],
				"messagetimestampseparator": ["MessageBody", "separator"],
				"messagetimestampsystem": ["MessageSystem", "timestamp"],
				"messagetimestamptooltip": ["MessageBody", "timestampTooltip"],
				"messagetimestampvisibleonhover": ["MessageBody", "timestampVisibleOnHover"],
				"messagetoolbar": ["MessageToolbar", "container"],
				"messagetoolbarbutton": ["MessageToolbarItems", "button"],
				"messagetoolbarbuttondisabled": ["MessageToolbarItems", "disabled"],
				"messagetoolbarbuttonselected": ["MessageToolbarItems", "selected"],
				"messagetoolbaricon": ["MessageToolbar", "icon"],
				"messagetoolbarinner": ["MessageToolbarItems", "wrapper"],
				"messagetoolbarisheader": ["MessageToolbar", "isHeader"],
				"messagetoolbarseparator": ["MessageToolbarItems", "separator"],
				"messageuploadcancel": ["MessageFile", "cancelButton"],
				"messageusername": ["MessageBody", "username"],
				"messagewrapper": ["MessageBody", "wrapper"],
				"messagezalgo": ["MessageBody", "zalgo"],
				"modal": ["ModalWrap", "modal"],
				"modalclose": ["LayerModal", "close"],
				"modalchangelogmodal": ["BDFDB", "changeLogModal"],
				"modalconfirmmodal": ["BDFDB", "confirmModal"],
				"modalcontent": ["LayerModal", "content"],
				"modalfooter": ["LayerModal", "footer"],
				"modalguildname": ["ModalItems", "guildName"],
				"modalheader": ["LayerModal", "header"],
				"modalheaderhassibling": ["BDFDB", "modalHeaderHasSibling"],
				"modalheadershade": ["BDFDB", "modalHeaderShade"],
				"modalinner": ["ModalWrap", "inner"],
				"modalmini": ["ModalMiniContent", "modal"],
				"modalminicontent": ["ModalMiniContent", "content"],
				"modalminitext": ["HeaderBarTopic", "content"],
				"modalnoscroller": ["BDFDB", "modalNoScroller"],
				"modalseparator": ["LayerModal", "separator"],
				"modalsidebar": ["BDFDB", "modalSidebar"],
				"modalsizelarge": ["Modal", "sizeLarge"],
				"modalsizemedium": ["Modal", "sizeMedium"],
				"modalsizesmall": ["Modal", "sizeSmall"],
				"modalsub": ["Modal", "modal"],
				"modalsubinner": ["BDFDB", "modalSubInner"],
				"modaltabcontent": ["BDFDB", "modalTabContent"],
				"modaltabcontentopen": ["BDFDB", "modalTabContentOpen"],
				"modalwrapper": ["BDFDB", "modalWrapper"],
				"modedefault": ["FormText", "modeDefault"],
				"modedisabled": ["FormText", "modeDisabled"],
				"modeselectable": ["FormText", "modeSelectable"],
				"namecontainer": ["NameContainer", "container"],
				"namecontaineravatar": ["NameContainer", "avatar"],
				"namecontainerchildren": ["NameContainer", "children"],
				"namecontainerclickable": ["NameContainer", "clickable"],
				"namecontainercontent": ["NameContainer", "content"],
				"namecontainerlayout": ["NameContainer", "layout"],
				"namecontainername": ["NameContainer", "name"],
				"namecontainernamecontainer": ["NotFound", "nameContainerNameContainer"],
				"namecontainernamewrapper": ["NameContainer", "nameAndDecorators"],
				"namecontainerselected": ["NameContainer", "selected"],
				"namecontainersubtext": ["NameContainer", "subText"],
				"nametag": ["NameTag", "nameTag"],
				"nitrostore": ["NitroStore", "applicationStore"],
				"nochannel": ["ChatWindow", "noChannel"],
				"notice": ["Notice", "notice"],
				"noticebrand": ["Notice", "colorBrand"],
				"noticebutton": ["Notice", "button"],
				"noticecustom": ["Notice", "colorCustom"],
				"noticedanger": ["Notice", "colorDanger"],
				"noticedark": ["Notice", "colorDark"],
				"noticedefault": ["Notice", "colorDefault"],
				"noticedownload": ["Notice", "colorDownload"],
				"noticedismiss": ["Notice", "closeButton"],
				"noticeicon": ["NoticePlatform", "icon"],
				"noticeiconandroid": ["NoticePlatform", "iconAndroid"],
				"noticeiconapple": ["NoticePlatform", "iconApple"],
				"noticeiconwindows": ["NoticePlatform", "iconWindows"],
				"noticeinfo": ["Notice", "colorInfo"],
				"noticeneutral": ["Notice", "colorNeutral"],
				"noticenotification": ["Notice", "colorNotification"],
				"noticeplatformicon": ["NoticePlatform", "platformIcon"],
				"noticepremium": ["Notice", "colorPremium"],
				"noticepremiumaction": ["NoticePlatform", "premiumAction"],
				"noticepremiumicon": ["NoticePlatform", "premiumIcon"],
				"noticepremiumlogo": ["NoticePlatform", "premiumLogo"],
				"noticepremiumtext": ["NoticePlatform", "premiumText"],
				"noticepremiumtier1": ["Notice", "colorPremiumTier1"],
				"noticepremiumtier2": ["Notice", "colorPremiumTier2"],
				"noticespotify": ["Notice", "colorSpotify"],
				"noticestreamer": ["Notice", "colorStreamerMode"],
				"noticesuccess": ["Notice", "colorSuccess"],
				"noticetextlink": ["NoticePlatform", "textLink"],
				"noticewrapper": ["BDFDB", "noticeWrapper"],
				"overflowellipsis": ["BDFDB", "overflowEllipsis"],
				"paginationlist": ["BDFDB", "paginationList"],
				"paginationlistalphabet": ["BDFDB", "paginationListAlphabet"],
				"paginationlistalphabetchar": ["BDFDB", "paginationListAlphabetChar"],
				"paginationlistalphabetchardisabled": ["BDFDB", "paginationListAlphabetCharDisabled"],
				"paginationlistcontent": ["BDFDB", "paginationListContent"],
				"paginationlistmini": ["BDFDB", "paginationListMini"],
				"paginationlistpagination": ["BDFDB", "paginationListPagination"],
				"peopleactions": ["PeopleItemInfo", "actions"],
				"peopleinner": ["PeopleItemInfo", "listItemContents"],
				"peoples": ["Peoples", "container"],
				"peoplesbadge": ["Peoples", "badge"],
				"peoplesnowplayingcolumn": ["Peoples", "nowPlayingColumn"],
				"peoplespeoplecolumn": ["Peoples", "peopleColumn"],
				"peoplestabbar": ["Peoples", "tabBar"],
				"peoplewrapper": ["PeopleItem", "peopleListItem"],
				"pictureinpicture": ["PictureInPicture", "pictureInPicture"],
				"pictureinpicturewindow": ["PictureInPicture", "pictureInPictureWindow"],
				"popout": ["Popout", "popout"],
				"popoutarrowalignmentmiddle": ["Popout", "arrowAlignmentMiddle"],
				"popoutarrowalignmenttop": ["Popout", "arrowAlignmentTop"],
				"popoutbottom": ["Popout", "popoutBottom"],
				"popoutbottomleft": ["Popout", "popoutBottomLeft"],
				"popoutbottomright": ["Popout", "popoutBottomRight"],
				"popoutinvert": ["Popout", "popoutInvert"],
				"popoutleft": ["Popout", "popoutLeft"],
				"popoutnoarrow": ["Popout", "noArrow"],
				"popoutnoshadow": ["Popout", "noShadow"],
				"popoutright": ["Popout", "popoutRight"],
				"popouts": ["Popout", "popouts"],
				"popoutthemedpopout": ["BDFDB", "themedPopout"],
				"popouttop": ["Popout", "popoutTop"],
				"popouttopleft": ["Popout", "popoutTopLeft"],
				"popouttopright": ["Popout", "popoutTopRight"],
				"popoutwrapper": ["BDFDB", "popoutWrapper"],
				"quickmessage": ["QuickMessage", "input"],
				"quickselect": ["QuickSelect", "quickSelect"],
				"quickselectarrow": ["QuickSelect", "quickSelectArrow"],
				"quickselectclick": ["QuickSelect", "quickSelectClick"],
				"quickselectlabel": ["QuickSelect", "quickSelectLabel"],
				"quickselectvalue": ["QuickSelect", "quickSelectValue"],
				"quickselectwrapper": ["BDFDB", "quickSelectWrapper"],
				"quickswitcher": ["QuickSwitchWrap", "quickswitcher"],
				"quickswitchresult": ["QuickSwitch", "result"],
				"quickswitchresultfocused": ["QuickSwitch", "resultFocused"],
				"quickswitchresultguildicon": ["QuickSwitch", "guildIcon"],
				"quickswitchresulticon": ["QuickSwitch", "icon"],
				"quickswitchresulticoncontainer": ["QuickSwitch", "iconContainer"],
				"quickswitchresultmatch": ["QuickSwitch", "match"],
				"quickswitchresultmisccontainer": ["QuickSwitchWrap", "miscContainer"],
				"quickswitchresultname": ["QuickSwitch", "name"],
				"quickswitchresultnote": ["QuickSwitch", "note"],
				"quickswitchresultusername": ["QuickSwitch", "username"],
				"radiogroup": ["RadioGroup", "item"],
				"radiogroupinner": ["RadioGroup", "radioBar"],
				"recentmentionschannelname": ["RecentMentionsHeader", "channelName"],
				"recentmentionsclosebutton": ["RecentMentions", "closeButton"],
				"recentmentionsdmicon": ["RecentMentionsHeader", "dmIcon"],
				"recentmentionsguildicon": ["RecentMentionsHeader", "guildIcon"],
				"recentmentionsguildname": ["RecentMentionsHeader", "guildName"],
				"recentmentionsjumpbutton": ["RecentMentions", "jumpButton"],
				"recentmentionspopout": ["RecentMentions", "recentMentionsPopout"],
				"scrollbar": ["Scrollbar", "scrollbar"],
				"scrollbardefault": ["Scrollbar", "scrollbarDefault"],
				"scrollbarghost": ["Scrollbar", "scrollbarGhost"],
				"scrollbarghosthairline": ["Scrollbar", "scrollbarGhostHairline"],
				"scroller": ["Scroller", "scrollerBase"],
				"scrollerauto": ["Scroller", "auto"],
				"scrollercontent": ["Scroller", "content"],
				"scrollerdisablescrollanchor": ["Scroller", "disableScrollAnchor"],
				"scrollerfade": ["Scroller", "fade"],
				"scrollernone": ["Scroller", "none"],
				"scrollerscrolling": ["Scroller", "scrolling"],
				"scrollerthin": ["Scroller", "thin"],
				"searchbar": ["SearchBar", "container"],
				"searchbarclear": ["SearchBar", "clear"],
				"searchbarclose": ["SearchBar", "close"],
				"searchbaricon": ["SearchBar", "icon"],
				"searchbariconlayout": ["SearchBar", "iconLayout"],
				"searchbariconwrap": ["SearchBar", "iconContainer"],
				"searchbarinner": ["SearchBar", "inner"],
				"searchbarinput": ["SearchBar", "input"],
				"searchbarlarge": ["SearchBar", "large"],
				"searchbarmedium": ["SearchBar", "medium"],
				"searchbarsmall": ["SearchBar", "small"],
				"searchbartag": ["SearchBar", "tag"],
				"searchbarvisible": ["SearchBar", "visible"],
				"searchbarwrapper": ["BDFDB", "searchBarWrapper"],
				"searchpopout": ["SearchPopoutWrap", "container"],
				"searchpopoutanswer": ["SearchPopout", "answer"],
				"searchpopoutdatepicker": ["SearchPopout", "datePicker"],
				"searchpopoutdatepickerhint": ["SearchPopout", "datePickerHint"],
				"searchpopoutdmaddpopout": ["DmAddPopout", "popout"],
				"searchpopoutddmadddiscordtag": ["DmAddPopoutItems", "discordTag"],
				"searchpopoutddmaddfriend": ["DmAddPopoutItems", "friend"],
				"searchpopoutddmaddfriendwrapper": ["DmAddPopoutItems", "friendWrapper"],
				"searchpopoutddmaddnickname": ["DmAddPopoutItems", "nickname"],
				"searchpopoutdisplayavatar": ["SearchPopout", "displayAvatar"],
				"searchpopoutdisplayusername": ["SearchPopout", "displayUsername"],
				"searchpopoutdisplayednick": ["SearchPopout", "displayedNick"],
				"searchpopoutfilter": ["SearchPopout", "filter"],
				"searchpopoutheader": ["SearchPopout", "header"],
				"searchpopouthint": ["SearchPopout", "hint"],
				"searchpopouthintvalue": ["SearchPopout", "hintValue"],
				"searchpopoutlinksource": ["SearchPopout", "linkSource"],
				"searchpopoutnontext": ["SearchPopout", "nonText"],
				"searchpopoutoption": ["SearchPopout", "option"],
				"searchpopoutplusicon": ["SearchPopout", "plusIcon"],
				"searchpopoutresultchannel": ["SearchPopout", "resultChannel"],
				"searchpopoutresultsgroup": ["SearchPopout", "resultsGroup"],
				"searchpopoutsearchclearhistory": ["SearchPopout", "searchClearHistory"],
				"searchpopoutsearchlearnmore": ["SearchPopout", "searchLearnMore"],
				"searchpopoutsearchoption": ["SearchPopout", "searchOption"],
				"searchpopoutsearchresultchannelcategory": ["SearchPopout", "searchResultChannelCategory"],
				"searchpopoutsearchresultchannelicon": ["SearchPopout", "searchResultChannelIcon"],
				"searchpopoutsearchresultchanneliconbackground": ["SearchPopout", "searchResultChannelIconBackground"],
				"searchpopoutselected": ["SearchPopout", "selected"],
				"searchpopoutuser": ["SearchPopout", "user"],
				"searchresultsafter": ["SearchResultsMessage", "after"],
				"searchresultsalt": ["SearchResults", "alt"],
				"searchresultsbefore": ["SearchResultsMessage", "before"],
				"searchresultschannelname": ["SearchResultsElements", "channelName"],
				"searchresultschannelSeparator": ["SearchResultsElements", "channelSeparator"],
				"searchresultsexpanded": ["SearchResultsMessage", "expanded"],
				"searchresultsgroupcozy": ["SearchResultsMessage", "messageGroupCozy"],
				"searchresultshit": ["SearchResultsMessage", "hit"],
				"searchresultspagination": ["SearchResultsPagination", "pagination"],
				"searchresultspaginationbutton": ["SearchResultsPagination", "paginationButton"],
				"searchresultspaginationdisabled": ["SearchResultsPagination", "disabled"],
				"searchresultspaginationicon": ["SearchResultsPagination", "icon"],
				"searchresultssibling": ["SearchResultsMessage", "sibling"],
				"searchresultswrap": ["SearchResults", "searchResultsWrap"],
				"select": ["Select", "select"],
				"selectwrapper": ["BDFDB", "selectWrapper"],
				"settingsclosebutton": ["SettingsCloseButton", "closeButton"],
				"settingsclosebuttoncontainer": ["SettingsCloseButton", "container"],
				"settingsguild": ["BDFDB", "settingsGuild"],
				"settingsguilddisabled": ["BDFDB", "settingsGuildDisabled"],
				"settingsheader": ["Item", "header"],
				"settingsitem": ["Item", "item"],
				"settingsitemdragged": ["ItemRole", "dragged"],
				"settingsitemdlock": ["ItemRole", "lock"],
				"settingsitemrole": ["ItemRole", "role"],
				"settingsitemroleinner": ["ItemRole", "roleInner"],
				"settingsitemselected": ["Item", "selected"],
				"settingsitemthemed": ["Item", "themed"],
				"settingspanel": ["BDFDB", "settingsPanel"],
				"settingspanellist": ["BDFDB", "settingsPanelList"],
				"settingspanellistwrapper": ["BDFDB", "settingsPanelListWrapper"],
				"settingspanellistwrappermini": ["BDFDB", "settingsPanelListWrapperMini"],
				"settingsrow": ["SettingsItems", "container"],
				"settingsrowcontainer": ["BDFDB", "settingsRow"],
				"settingsrowcontrol": ["SettingsItems", "control"],
				"settingsrowdisabled": ["SettingsItems", "disabled"],
				"settingsrowlabel": ["SettingsItems", "labelRow"],
				"settingsrownote": ["SettingsItems", "note"],
				"settingsrowtitle": ["SettingsItems", "title"],
				"settingsrowtitledefault": ["SettingsItems", "titleDefault"],
				"settingsrowtitlemini": ["SettingsItems", "titleMini"],
				"settingsseparator": ["Item", "separator"],
				"settingstableheader": ["SettingsTable", "header"],
				"settingstableheadername": ["SettingsTable", "headerName"],
				"settingstableheaderoption": ["SettingsTable", "headerOption"],
				"settingstableheaderoptions": ["BDFDB", "settingsTableHeaderOptions"],
				"settingstableheaders": ["BDFDB", "settingsTableHeaders"],
				"settingstableheadervertical": ["BDFDB", "settingsTableHeaderVertical"],
				"settingstablecard": ["BDFDB", "settingsTableCard"],
				"settingstablecardconfigs": ["BDFDB", "settingsTableCardConfigs"],
				"settingstablecardlabel": ["BDFDB", "settingsTableCardLabel"],
				"settingstablelist": ["BDFDB", "settingsTableList"],
				"settingswindowcontentcolumn": ["SettingsWindow", "contentColumn"],
				"settingswindowcontentregion": ["SettingsWindow", "contentRegion"],
				"settingswindowcontentregionscroller": ["SettingsWindow", "contentRegionScroller"],
				"settingswindowsidebarregion": ["SettingsWindow", "sidebarRegion"],
				"settingswindowsidebarregionscroller": ["SettingsWindow", "sidebarRegionScroller"],
				"settingswindowstandardsidebarview": ["SettingsWindow", "standardSidebarView"],
				"settingswindowsubsidebarcontent": ["SettingsWindowScroller", "content"],
				"settingswindowsubsidebarscroller": ["SettingsWindowScroller", "scroller"],
				"settingswindowtoolscontainer": ["SettingsWindow", "toolsContainer"],
				"sidebar": ["BDFDB", "sidebar"],
				"sidebarcontent": ["BDFDB", "sidebarContent"],
				"sidebarlist": ["BDFDB", "sidebarList"],
				"size10": ["TextSize", "size10"],
				"size12": ["TextSize", "size12"],
				"size14": ["TextSize", "size14"],
				"size16": ["TextSize", "size16"],
				"size20": ["TextSize", "size20"],
				"size24": ["TextSize", "size24"],
				"size32": ["TextSize", "size32"],
				"slider": ["Slider", "slider"],
				"sliderbar": ["Slider", "bar"],
				"sliderbarfill": ["Slider", "barFill"],
				"sliderbubble": ["BDFDB", "sliderBubble"],
				"sliderdisabled": ["Slider", "disabled"],
				"slidergrabber": ["Slider", "grabber"],
				"sliderinput": ["Slider", "input"],
				"slidermark": ["Slider", "mark"],
				"slidermarkdash": ["Slider", "markDash"],
				"slidermarkdashsimple": ["Slider", "markDashSimple"],
				"slidermarkvalue": ["Slider", "markValue"],
				"slidermini": ["Slider", "mini"],
				"slidertrack": ["Slider", "track"],
				"spoilercontainer": ["Spoiler", "spoilerContainer"],
				"spoilerembed": ["SpoilerEmbed", "spoiler"],
				"spoilerembedhidden": ["SpoilerEmbed", "hiddenSpoilers"],
				"spoilerembedinline": ["SpoilerEmbed", "inline"],
				"spoilerhidden": ["Spoiler", "hidden"],
				"spoilertext": ["Spoiler", "spoilerText"],
				"spoilerwarning": ["Spoiler", "spoilerWarning"],
				"splashbackground": ["NotFound", "splashBackground"],
				"strikethrough": ["TextStyle", "strikethrough"],
				"status": ["Avatar", "status"],
				"stopanimations": ["NotFound", "stopAnimations"],
				"subtext": ["NotFound", "subtext"],
				"svgicon": ["BDFDB", "svgIcon"],
				"svgiconwrapper": ["BDFDB", "svgIconWrapper"],
				"switch": ["Switch", "container"],
				"switchinner": ["Switch", "input"],
				"switchmini": ["BDFDB", "switchMini"],
				"switchslider": ["Switch", "slider"],
				"tabbar": ["UserProfile", "tabBar"],
				"tabbarcontainer": ["UserProfile", "tabBarContainer"],
				"tabbarcontainerbottom": ["BDFDB", "tabBarContainerBottom"],
				"tabbaritem": ["UserProfile", "tabBarItem"],
				"tabbartop": ["Item", "top"],
				"table": ["BDFDB", "table"],
				"tablebodycell": ["BDFDB", "tableBodyCell"],
				"tableheadercell": ["BDFDB", "tableHeaderCell"],
				"tableheadercellclickable": ["Table", "clickable"],
				"tableheadercellcontent": ["Table", "headerCellContent"],
				"tableheadercellsorted": ["Table", "headerCellSorted"],
				"tableheadercellwrapper": ["Table", "headerCell"],
				"tableheadersorticon": ["Table", "sortIcon"],
				"tablerow": ["Table", "row"],
				"tablespacerheader": ["Table", "spacerHeader"],
				"tablestickyheader": ["Table", "stickyHeader"],
				"textarea": ["ChannelTextArea", "textArea"],
				"textareaattachbutton": ["ChannelTextAreaAttachButton", "attachButton"],
				"textareaattachbuttoninner": ["ChannelTextAreaAttachButton", "attachButtonInner"],
				"textareaattachbuttonplus": ["ChannelTextAreaAttachButton", "attachButtonPlus"],
				"textareaattachwrapper": ["ChannelTextAreaAttachButton", "attachWrapper"],
				"textareabutton": ["ChannelTextAreaButton", "button"],
				"textareabuttonactive": ["ChannelTextAreaButton", "active"],
				"textareabuttonpulse": ["ChannelTextAreaButton", "pulseButton"],
				"textareabuttonwrapper": ["ChannelTextAreaButton", "buttonWrapper"],
				"textareacharcounter": ["ChannelTextAreaCharCounter", "characterCount"],
				"textareacharcountererror": ["ChannelTextAreaCharCounter", "error"],
				"textareadisabled": ["ChannelTextArea", "textAreaDisabled"],
				"textareafontsize12padding": ["ChannelTextArea", "fontSize12Padding"],
				"textareafontsize14padding": ["ChannelTextArea", "fontSize14Padding"],
				"textareafontsize15padding": ["ChannelTextArea", "fontSize15Padding"],
				"textareafontsize16padding": ["ChannelTextArea", "fontSize16Padding"],
				"textareafontsize18padding": ["ChannelTextArea", "fontSize18Padding"],
				"textareafontsize20padding": ["ChannelTextArea", "fontSize20Padding"],
				"textareafontsize24padding": ["ChannelTextArea", "fontSize24Padding"],
				"textareaicon": ["ChannelTextAreaButton", "icon"],
				"textareaiconpulse": ["ChannelTextAreaButton", "pulseIcon"],
				"textareainner": ["ChannelTextArea", "inner"],
				"textareainnerdisabled": ["ChannelTextArea", "innerDisabled"],
				"textareapickerbutton": ["ChannelTextArea", "button"],
				"textareapickerbuttoncontainer": ["ChannelTextArea", "buttonContainer"],
				"textareapickerbuttons": ["ChannelTextArea", "buttons"],
				"textareascrollablecontainer": ["ChannelTextArea", "scrollableContainer"],
				"textareaslate": ["ChannelTextArea", "textAreaSlate"],
				"textareaslatemarkup": ["ChannelTextAreaSlate", "slateTextArea"],
				"textareaslatecontainer": ["ChannelTextAreaSlate", "slateContainer"],
				"textareaslateplaceholder": ["ChannelTextAreaSlate", "placeholder"],
				"textareauploadinput": ["ChannelTextAreaAttachButton", "uploadInput"],
				"textareawebkit": ["ChannelTextArea", "webkit"],
				"textareawrapall": ["ChannelTextArea", "channelTextArea"],
				"textareawrapchat": ["ChatWindow", "channelTextArea"],
				"textareawrapdisabled": ["ChannelTextArea", "channelTextAreaDisabled"],
				"textrow": ["PopoutActivity", "textRow"],
				"textscroller": ["BDFDB", "textScroller"],
				"themedark": ["NotFound", "themeDark"],
				"themelight": ["NotFound", "themeLight"],
				"themeundefined": ["NotFound", "themeUndefined"],
				"tip": ["Tip", "tip"],
				"tipblock": ["Tip", "block"],
				"tippro": ["Tip", "pro"],
				"tipinline": ["Tip", "inline"],
				"titlebar": ["TitleBar", "titleBar"],
				"titlebarmac": ["TitleBar", "typeMacOS"],
				"titlebarmacbutton": ["TitleBar", "macButton"],
				"titlebarmacbuttonclose": ["TitleBar", "macButtonClose"],
				"titlebarmacbuttonmin": ["TitleBar", "macButtonMinimize"],
				"titlebarmacbuttonmax": ["TitleBar", "macButtonMaximize"],
				"titlebarmacbuttons": ["TitleBar", "macButtons"],
				"titlebarmacwithframe": ["TitleBar", "typeMacOSWithFrame"],
				"titlebarwinbutton": ["TitleBar", "winButton"],
				"titlebarwinbuttonclose": ["TitleBar", "winButtonClose"],
				"titlebarwinbuttonminmax": ["TitleBar", "winButtonMinMax"],
				"titlebarwindows": ["TitleBar", "typeWindows"],
				"titlebarwithframe": ["TitleBar", "withFrame"],
				"titlebarwordmark": ["TitleBar", "wordmark"],
				"titlebarwordmarkmac": ["TitleBar", "wordmarkMacOS"],
				"titlebarwordmarkwindows": ["TitleBar", "wordmarkWindows"],
				"titlesize10": ["UserPopout", "size10"],
				"titlesize12": ["UserPopout", "size12"],
				"titlesize14": ["UserPopout", "size14"],
				"titlesize16": ["UserPopout", "size16"],
				"toast": ["Toast", "toast"],
				"toastavatar": ["Toast", "avatar"],
				"toastclosing": ["Toast", "closing"],
				"toastcustom": ["Toast", "custom"],
				"toasticon": ["Toast", "icon"],
				"toastinner": ["Toast", "inner"],
				"toasts": ["Toast", "toasts"],
				"tooltip": ["Tooltip", "tooltip"],
				"tooltipactivityicon": ["TooltipGuild", "activityIcon"],
				"tooltipblack": ["Tooltip", "tooltipBlack"],
				"tooltipbottom": ["Tooltip", "tooltipBottom"],
				"tooltipbrand": ["Tooltip", "tooltipBrand"],
				"tooltipcontent": ["Tooltip", "tooltipContent"],
				"tooltipcontentallowoverflow": ["Tooltip", "tooltipContentAllowOverflow"],
				"tooltipcustom": ["BDFDB", "tooltipCustom"],
				"tooltipgreen": ["Tooltip", "tooltipGreen"],
				"tooltipgrey": ["Tooltip", "tooltipGrey"],
				"tooltipguildnametext": ["TooltipGuild", "guildNameText"],
				"tooltipguildnametextlimitedsize": ["TooltipGuild", "guildNameTextLimitedSize"],
				"tooltipleft": ["Tooltip", "tooltipLeft"],
				"tooltiplistitem": ["GuildsItems", "listItemTooltip"],
				"tooltippointer": ["Tooltip", "tooltipPointer"],
				"tooltipred": ["Tooltip", "tooltipRed"],
				"tooltipright": ["Tooltip", "tooltipRight"],
				"tooltiprow": ["TooltipGuild", "row"],
				"tooltiprowextra": ["BDFDB", "tooltipRowExtra"],
				"tooltiprowguildname": ["TooltipGuild", "rowGuildName"],
				"tooltiprowicon": ["TooltipGuild", "rowIcon"],
				"tooltiptop": ["Tooltip", "tooltipTop"],
				"tooltipyellow": ["Tooltip", "tooltipYellow"],
				"typing": ["Typing", "typing"],
				"typingcooldownwrapper": ["Typing", "cooldownWrapper"],
				"typingtext": ["Typing", "text"],
				"underline": ["TextStyle", "underline"],
				"unreadbar": ["UnreadBar", "bar"],
				"unreadbaractive": ["UnreadBar", "active"],
				"unreadbarcontainer": ["UnreadBar", "container"],
				"unreadbaricon": ["UnreadBar", "icon"],
				"unreadbarmention": ["UnreadBar", "mention"],
				"unreadbartext": ["UnreadBar", "text"],
				"unreadbarunread": ["UnreadBar", "unread"],
				"uploadmodal": ["UploadModal", "uploadModal"],
				"userbadges": ["UserBadges", "container"],
				"userbadgescolored": ["UserBadges", "colored"],
				"userinfo": ["UserInfo", "userInfo"],
				"userinfoavatar": ["UserInfo", "avatar"],
				"userinfodate": ["BDFDB", "userInfoDate"],
				"userinfodiscordtag": ["UserInfo", "discordTag"],
				"userinfodiscriminator": ["UserInfo", "discriminator"],
				"userinfohovered": ["UserInfo", "hovered"],
				"userinfosubtext": ["UserInfo", "subtext"],
				"userinfotext": ["UserInfo", "text"],
				"userinfousername": ["UserInfo", "username"],
				"userpopout": ["UserPopout", "userPopout"],
				"userpopoutavatarhint": ["UserPopout", "avatarHint"],
				"userpopoutavatarhintinner": ["UserPopout", "avatarHintInner"],
				"userpopoutavatarwrapper": ["UserPopout", "avatarWrapper"],
				"userpopoutavatarwrappernormal": ["UserPopout", "avatarWrapperNormal"],
				"userpopoutbody": ["UserPopout", "body"],
				"userpopoutbodyinnerwrapper": ["UserPopout", "bodyInnerWrapper"],
				"userpopoutbodytitle": ["UserPopout", "bodyTitle"],
				"userpopoutcustomstatus": ["UserPopout", "customStatus"],
				"userpopoutcustomstatusemoji": ["UserPopout", "customStatusEmoji"],
				"userpopoutcustomstatussoloemoji": ["UserPopout", "customStatusSoloEmoji"],
				"userpopoutcustomstatustext": ["UserPopout", "customStatusText"],
				"userpopoutendbodysection": ["UserPopout", "endBodySection"],
				"userpopoutfooter": ["UserPopout", "footer"],
				"userpopoutheader": ["UserPopout", "header"],
				"userpopoutheaderbottagwithnickname": ["UserPopout", "headerBotTagWithNickname"],
				"userpopoutheadernamewrapper": ["UserPopout", "headerNameWrapper"],
				"userpopoutheadernickname": ["UserPopout", "headerName"],
				"userpopoutheadernormal": ["UserPopout", "headerNormal"],
				"userpopoutheaderplaying": ["UserPopout", "headerPlaying"],
				"userpopoutheaderspotify": ["UserPopout", "headerSpotify"],
				"userpopoutheaderstreaming": ["UserPopout", "headerStreaming"],
				"userpopoutheadertag": ["UserPopout", "headerTag"],
				"userpopoutheadertagnonickname": ["UserPopout", "headerTagNoNickname"],
				"userpopoutheadertagusernamenonickname": ["UserPopout", "headerTagUsernameNoNickname"],
				"userpopoutheadertagwithnickname": ["UserPopout", "headerTagWithNickname"],
				"userpopoutheadertext": ["UserPopout", "headerText"],
				"userpopoutheadertop": ["UserPopout", "headerTop"],
				"userpopoutprotip": ["UserPopout", "protip"],
				"userpopoutrole": ["Role", "role"],
				"userpopoutrolecircle": ["Role", "roleCircle"],
				"userpopoutrolelist": ["UserPopout", "rolesList"],
				"userpopoutrolename": ["Role", "roleName"],
				"userpopoutroles": ["Role", "root"],
				"userprofile": ["UserProfile", "root"],
				"userprofilebody": ["UserProfile", "body"],
				"userprofilebottag": ["UserProfile", "botTag"],
				"userprofilecustomstatus": ["UserProfile", "customStatusText"],
				"userprofilecustomstatusemoji": ["UserProfile", "customStatusEmoji"],
				"userprofileheader": ["UserProfile", "header"],
				"userprofileheaderfill": ["UserProfile", "headerFill"],
				"userprofileheaderinfo": ["UserProfile", "headerInfo"],
				"userprofilelistavatar": ["UserProfile", "listAvatar"],
				"userprofilelistguildavatarwithouticon": ["UserProfile", "guildAvatarWithoutIcon"],
				"userprofilenametag": ["UserProfile", "nameTag"],
				"userprofiletopsectionnormal": ["UserProfile", "topSectionNormal"],
				"userprofiletopsectionplaying": ["UserProfile", "topSectionPlaying"],
				"userprofiletopsectionspotify": ["UserProfile", "topSectionSpotify"],
				"userprofiletopsectionstreaming": ["UserProfile", "topSectionStreaming"],
				"userprofiletopsectionxbox": ["UserProfile", "topSectionXbox"],
				"userprofileusername": ["UserProfile", "username"],
				"username": ["NameTag", "username"],
				"usernotepopout": ["UserPopout", "note"],
				"usernoteprofile": ["UserProfile", "note"],
				"usernotetextarea": ["NoteTextarea", "textarea"],
				"usersettingsappearancepreview": ["UserSettingsAppearancePreview", "preview"],
				"usersettingsappearancepreviewcompact": ["UserSettingsAppearancePreview", "compactPreview"],
				"usersettingsappearancepreviewfirst": ["UserSettingsAppearancePreview", "firstMessage"],
				"usersummaryavatar": ["UserSummaryItem", "avatar"],
				"usersummaryavatarcontainer": ["UserSummaryItem", "avatarContainer"],
				"usersummaryavatarcontainermasked": ["UserSummaryItem", "avatarContainerMasked"],
				"usersummaryclickableavatar": ["UserSummaryItem", "clickableAvatar"],
				"usersummarycontainer": ["UserSummaryItem", "container"],
				"usersummaryemptyuser": ["UserSummaryItem", "emptyUser"],
				"usersummaryicon": ["UserSummaryItem", "icon"],
				"usersummarymoreUsers": ["UserSummaryItem", "moreUsers"],
				"voiceavatar": ["VoiceChannel", "avatar"],
				"voiceavatarcontainer": ["VoiceChannel", "avatarContainer"],
				"voiceavatarlarge": ["VoiceChannel", "avatarLarge"],
				"voiceavatarsmall": ["VoiceChannel", "avatarSmall"],
				"voiceavatarspeaking": ["VoiceChannel", "avatarSpeaking"],
				"voiceclickable": ["VoiceChannel", "clickable"],
				"voicecontent": ["VoiceChannel", "content"],
				"voicedetails": ["VoiceDetails", "container"],
				"voicedetailsactionbuttons": ["VoiceDetails", "actionButtons"],
				"voicedetailsbutton": ["VoiceDetails", "button"],
				"voicedetailsbuttonactive": ["VoiceDetails", "buttonActive"],
				"voicedetailsbuttoncolor": ["VoiceDetails", "buttonColor"],
				"voicedetailsbuttonicon": ["VoiceDetails", "buttonIcon"],
				"voicedetailsbuttonwithtext": ["VoiceDetails", "withText"],
				"voicedetailschannel": ["VoiceDetails", "channel"],
				"voicedetailscustomstatuscontainer": ["VoiceDetails", "customStatusContainer"],
				"voicedetailshotspot": ["VoiceDetails", "hotspot"],
				"voicedetailsinner": ["VoiceDetails", "inner"],
				"voicedetailslabelwrapper": ["VoiceDetailsPing", "labelWrapper"],
				"voicedetailsping": ["VoiceDetailsPing", "ping"],
				"voicedetailspingforeground": ["VoiceDetailsPing", "pingForeground"],
				"voicedetailsqualityaverage": ["VoiceDetailsPing", "rtcConnectionQualityAverage"],
				"voicedetailsqualitybad": ["VoiceDetailsPing", "rtcConnectionQualityBad"],
				"voicedetailsqualityfine": ["VoiceDetailsPing", "rtcConnectionQualityFine"],
				"voicedetailsstatus": ["VoiceDetailsPing", "rtcConnectionStatus"],
				"voicedetailsstatusconnected": ["VoiceDetailsPing", "rtcConnectionStatusConnected"],
				"voicedetailsstatusconnecting": ["VoiceDetailsPing", "rtcConnectionStatusConnecting"],
				"voicedetailsstatuserror": ["VoiceDetailsPing", "rtcConnectionStatusError"],
				"voicedetailsstatuswithpopout": ["VoiceDetails", "statusWithPopout"],
				"voicedraggable": ["NotFound", "voiceDraggable"],
				"voiceflipped": ["VoiceChannel", "flipped"],
				"voiceicon": ["VoiceChannel", "icon"],
				"voiceicons": ["VoiceChannel", "icons"],
				"voiceiconspacing": ["VoiceChannel", "iconSpacing"],
				"voicelimit": ["VoiceChannelLimit", "wrapper"],
				"voicelimittotal": ["VoiceChannelLimit", "total"],
				"voicelimitusers": ["VoiceChannelLimit", "users"],
				"voicelist": ["VoiceChannel", "list"],
				"voicelist2": ["VoiceChannelList", "list"],
				"voicelistcollapsed": ["VoiceChannel", "listCollapse"],
				"voicelistcollapsed2": ["VoiceChannelList", "collapsed"],
				"voicelistdefault": ["VoiceChannel", "listDefault"],
				"voiceliveicon": ["VoiceChannel", "liveIcon"],
				"voicename": ["VoiceChannel", "username"],
				"voicenamefont": ["VoiceChannel", "usernameFont"],
				"voicenamespeaking": ["VoiceChannel", "usernameSpeaking"],
				"voiceselected": ["VoiceChannel", "selected"],
				"voiceuser": ["VoiceChannel", "voiceUser"],
				"voiceuserlarge": ["VoiceChannel", "userLarge"],
				"voiceusersmall": ["VoiceChannel", "userSmall"],
				"webhookcard": ["WebhookCard", "card"],
				"webhookcardbody": ["WebhookCard", "body"],
				"webhookcardcopybutton": ["WebhookCard", "copyButton"],
				"webhookcardheader": ["WebhookCard", "header"]
			},
			"myId": "278543574059057154",
			"myGuildId": "410787888507256842",
			"Languages": {
				"$discord": 	{"name":"Discord (English))",			"id":"en",		"ownlang":"English"},
				"af":			{"name":"Afrikaans",					"id":"af",		"ownlang":"Afrikaans"},
				"sq":			{"name":"Albanian",						"id":"sq",		"ownlang":"Shqiptar"},
				"am":			{"name":"Amharic",						"id":"am",		"ownlang":"አማርኛ"},
				"ar":			{"name":"Arabic",						"id":"ar",		"ownlang":"اللغة العربية"},
				"hy":			{"name":"Armenian",						"id":"hy",		"ownlang":"Հայերեն"},
				"az":			{"name":"Azerbaijani",					"id":"az",		"ownlang":"آذربایجان دیلی"},
				"ba":			{"name":"Bashkir",						"id":"ba",		"ownlang":"Башҡорт"},
				"eu":			{"name":"Basque",						"id":"eu",		"ownlang":"Euskara"},
				"be":			{"name":"Belarusian",					"id":"be",		"ownlang":"Беларуская"},
				"bn":			{"name":"Bengali",						"id":"bn",		"ownlang":"বাংলা"},
				"bs":			{"name":"Bosnian",						"id":"bs",		"ownlang":"Босански"},
				"bg":			{"name":"Bulgarian",					"id":"bg",		"ownlang":"български",					"discord":true},
				"my":			{"name":"Burmese",						"id":"my",		"ownlang":"မြန်မာစာ"},
				"ca":			{"name":"Catalan",						"id":"ca",		"ownlang":"Català"},
				"ceb":			{"name":"Cebuano",						"id":"ceb",		"ownlang":"Bisaya"},
				"ny":			{"name":"Chichewa",						"id":"ny",		"ownlang":"Nyanja"},
				"zh":			{"name":"Chinese",						"id":"zh",		"ownlang":"中文",						"discord":true},
				"zh-HK":		{"name":"Chinese (Hong Kong)",			"id":"zh-HK",	"ownlang":"香港中文"},
				"zh-CN":		{"name":"Chinese (Simplified)",			"id":"zh-CN",	"ownlang":"简体中文"},
				"zh-TW":		{"name":"Chinese (Traditional)",		"id":"zh-TW",	"ownlang":"繁體中文",					"discord":true},
				"co":			{"name":"Corsican",						"id":"co",		"ownlang":"Corsu"},
				"hr":			{"name":"Croatian",						"id":"hr",		"ownlang":"Hrvatski",					"discord":true},
				"cs":			{"name":"Czech",						"id":"cs",		"ownlang":"Čeština"},
				"da":			{"name":"Danish",						"id":"da",		"ownlang":"Dansk",						"discord":true},
				"nl":			{"name":"Dutch",						"id":"nl",		"ownlang":"Nederlands",					"discord":true},
				"en":			{"name":"English",						"id":"en",		"ownlang":"English"},
				"en-GB":		{"name":"English (UK)",					"id":"en-GB",	"ownlang":"English (UK)",				"discord":true},
				"en-US":		{"name":"English (US)",					"id":"en-US",	"ownlang":"English (US)",				"discord":true},
				"eo":			{"name":"Esperanto",					"id":"eo",		"ownlang":"Esperanto"},
				"et":			{"name":"Estonian",						"id":"et",		"ownlang":"Eesti"},
				"fil":			{"name":"Filipino",						"id":"fil",		"ownlang":"Wikang Filipino"},
				"fi":			{"name":"Finnish",						"id":"fi",		"ownlang":"Suomi",						"discord":true},
				"fr":			{"name":"French",						"id":"fr",		"ownlang":"Français",					"discord":true},
				"fr-CA":		{"name":"French (Canadian)",			"id":"fr-CA",	"ownlang":"Français Canadien"},
				"fy":			{"name":"Frisian",						"id":"fy",		"ownlang":"Frysk"},
				"gl":			{"name":"Galician",						"id":"gl",		"ownlang":"Galego"},
				"ka":			{"name":"Georgian",						"id":"ka",		"ownlang":"ქართული"},
				"de":			{"name":"German",						"id":"de",		"ownlang":"Deutsch",					"discord":true},
				"de-AT":		{"name":"German (Austria)",				"id":"de-AT",	"ownlang":"Österreichisch Deutsch"},
				"de-CH":		{"name":"German (Switzerland)",			"id":"de-CH",	"ownlang":"Schweizerdeutsch"},
				"el":			{"name":"Greek",						"id":"el",		"ownlang":"Ελληνικά",					"discord":true},
				"gu":			{"name":"Gujarati",						"id":"gu",		"ownlang":"ગુજરાતી"},
				"ht":			{"name":"Haitian Creole",				"id":"ht",		"ownlang":"Kreyòl Ayisyen"},
				"ha":			{"name":"Hausa",						"id":"ha",		"ownlang":"حَوْسَ"},
				"haw":			{"name":"Hawaiian",						"id":"haw",		"ownlang":"ʻŌlelo Hawaiʻi"},
				"he":			{"name":"Hebrew",						"id":"he",		"ownlang":"עברית"},
				"iw":			{"name":"Hebrew (Israel)",				"id":"iw",		"ownlang":"עברית"},
				"hi":			{"name":"Hindi",						"id":"hi",		"ownlang":"हिन्दी"},
				"hmn":			{"name":"Hmong",						"id":"hmn",		"ownlang":"lol Hmongb"},
				"hu":			{"name":"Hungarian",					"id":"hu",		"ownlang":"Magyar",						"discord":true},
				"is":			{"name":"Icelandic",					"id":"is",		"ownlang":"Íslenska"},
				"ig":			{"name":"Igbo",							"id":"ig",		"ownlang":"Asụsụ Igbo"},
				"id":			{"name":"Indonesian",					"id":"id",		"ownlang":"Bahasa Indonesia"},
				"ga":			{"name":"Irish",						"id":"ga",		"ownlang":"Gaeilge"},
				"it":			{"name":"Italian",						"id":"it",		"ownlang":"Italiano",					"discord":true},
				"ja":			{"name":"Japanese",						"id":"ja",		"ownlang":"日本語",						"discord":true},
				"jv":			{"name":"Javanese",						"id":"jv",		"ownlang":"ꦧꦱꦗꦮ"},
				"jw":			{"name":"Javanese (Javanese)",			"id":"jw",		"ownlang":"ꦧꦱꦗꦮ"},
				"kn":			{"name":"Kannada",						"id":"kn",		"ownlang":"ಕನ್ನಡ"},
				"kk":			{"name":"Kazakh",						"id":"kk",		"ownlang":"Қазақ Tілі"},
				"km":			{"name":"Khmer",						"id":"km",		"ownlang":"ភាសាខ្មែរ"},
				"rw":			{"name":"Kinyarwanda",					"id":"rw",		"ownlang":"Ikinyarwanda"},
				"ko":			{"name":"Korean",						"id":"ko",		"ownlang":"한국어",						"discord":true},
				"ku":			{"name":"Kurdish",						"id":"ku",		"ownlang":"کوردی"},
				"ky":			{"name":"Kyrgyz",						"id":"ky",		"ownlang":"кыргызча"},
				"lo":			{"name":"Lao",							"id":"lo",		"ownlang":"ພາສາລາວ"},
				"la":			{"name":"Latin",						"id":"la",		"ownlang":"Latina"},
				"lv":			{"name":"Latvian",						"id":"lv",		"ownlang":"Latviešu"},
				"lt":			{"name":"Lithuanian",					"id":"lt",		"ownlang":"Lietuvių",					"discord":true},
				"lb":			{"name":"Luxembourgish",				"id":"lb",		"ownlang":"Lëtzebuergesch"},
				"mk":			{"name":"Macedonian",					"id":"mk",		"ownlang":"Mакедонски"},
				"mg":			{"name":"Malagasy",						"id":"mg",		"ownlang":"Malagasy"},
				"ms":			{"name":"Malay",						"id":"ms",		"ownlang":"بهاس ملايو"},
				"ml":			{"name":"Malayalam",					"id":"ml",		"ownlang":"മലയാളം"},
				"mt":			{"name":"Maltese",						"id":"mt",		"ownlang":"Malti"},
				"mi":			{"name":"Maori",						"id":"mi",		"ownlang":"te Reo Māori"},
				"mr":			{"name":"Marathi",						"id":"mr",		"ownlang":"मराठी"},
				"mhr":			{"name":"Mari",							"id":"mhr",		"ownlang":"марий йылме"},
				"mn":			{"name":"Mongolian",					"id":"mn",		"ownlang":"Монгол Хэл"},
				"my":			{"name":"Myanmar (Burmese)",			"id":"my",		"ownlang":"မြန်မာл Хэл"},
				"ne":			{"name":"Nepali",						"id":"ne",		"ownlang":"नेपाली"},
				"no":			{"name":"Norwegian",					"id":"no",		"ownlang":"Norsk",						"discord":true},
				"or":			{"name":"Odia",							"id":"or",		"ownlang":"ଓଡ଼ିଆ"},
				"pap":			{"name":"Papiamento",					"id":"pap",		"ownlang":"Papiamentu"},
				"ps":			{"name":"Pashto",						"id":"ps",		"ownlang":"پښتو"},
				"fa":			{"name":"Persian",						"id":"fa",		"ownlang":"فارسی"},
				"pl":			{"name":"Polish",						"id":"pl",		"ownlang":"Polski",						"discord":true},
				"pt":			{"name":"Portuguese",					"id":"pt",		"ownlang":"Português"},
				"pt-BR":		{"name":"Portuguese (Brazil)",			"id":"pt-BR",	"ownlang":"Português do Brasil",		"discord":true},
				"pt-PT":		{"name":"Portuguese (Portugal)",		"id":"pt-PT",	"ownlang":"Português do Portugal"},
				"pa":			{"name":"Punjabi",						"id":"pa",		"ownlang":"पंजाबी"},
				"ro":			{"name":"Romanian",						"id":"ro",		"ownlang":"Română",						"discord":true},
				"ru":			{"name":"Russian",						"id":"ru",		"ownlang":"Pусский",					"discord":true},
				"sm":			{"name":"Samoan",						"id":"sm",		"ownlang":"Gagana Sāmoa"},
				"gd":			{"name":"Scottish Gaelic",				"id":"gd",		"ownlang":"Gàidhlig"},
				"sr":			{"name":"Serbian",						"id":"sr",		"ownlang":"Српски"},
				"st":			{"name":"Sesotho",						"id":"st",		"ownlang":"Sesotho"},
				"sn":			{"name":"Shona",						"id":"sn",		"ownlang":"Shona"},
				"sd":			{"name":"Sindhi",						"id":"sd",		"ownlang":"سنڌي"},
				"si":			{"name":"Sinhala",						"id":"si",		"ownlang":"සිංහල"},
				"sk":			{"name":"Slovak",						"id":"sk",		"ownlang":"Slovenčina"},
				"sl":			{"name":"Slovenian",					"id":"sl",		"ownlang":"Slovenščina"},
				"so":			{"name":"Somali",						"id":"so",		"ownlang":"Soomaali"},
				"es":			{"name":"Spanish",						"id":"es",		"ownlang":"Español",					"discord":true},
				"es-419":		{"name":"Spanish (Latin America)",		"id":"es-419",	"ownlang":"Español latinoamericano"},
				"su":			{"name":"Sundanese",					"id":"su",		"ownlang":"Basa Sunda"},
				"sw":			{"name":"Swahili",						"id":"sw",		"ownlang":"Kiswahili"},
				"sv":			{"name":"Swedish",						"id":"sv",		"ownlang":"Svenska",					"discord":true},
				"tl":			{"name":"Tagalog",						"id":"tl",		"ownlang":"Wikang Tagalog"},
				"tg":			{"name":"Tajik",						"id":"tg",		"ownlang":"тоҷикӣ"},
				"ta":			{"name":"Tamil",						"id":"ta",		"ownlang":"தமிழ்"},
				"tt":			{"name":"Tatar",						"id":"tt",		"ownlang":"татарча"},
				"te":			{"name":"Telugu",						"id":"te",		"ownlang":"తెలుగు"},
				"th":			{"name":"Thai",							"id":"th",		"ownlang":"ภาษาไทย",						"discord":true},
				"tr":			{"name":"Turkish",						"id":"tr",		"ownlang":"Türkçe",						"discord":true},
				"tk":			{"name":"Turkmen",						"id":"tk",		"ownlang":"Türkmençe"},
				"udm":			{"name":"Udmurt",						"id":"udm",		"ownlang":"удмурт кыл"},
				"uk":			{"name":"Ukrainian",					"id":"uk",		"ownlang":"Yкраїнський",				"discord":true},
				"ur":			{"name":"Urdu",							"id":"ur",		"ownlang":"اُردُو"},
				"ug":			{"name":"Uyghur",						"id":"ug",		"ownlang":"ئۇيغۇر تىلى"},
				"uz":			{"name":"Uzbek",						"id":"uz",		"ownlang":"اوزبیک"},
				"vi":			{"name":"Vietnamese",					"id":"vi",		"ownlang":"Tiếng Việt Nam",				"discord":true},
				"cy":			{"name":"Welsh",						"id":"cy",		"ownlang":"Cymraeg"},
				"xh":			{"name":"Xhosa",						"id":"xh",		"ownlang":"Xhosa"},
				"yi":			{"name":"Yiddish",						"id":"yi",		"ownlang":"ייִדיש ייִדיש‬"},
				"yo":			{"name":"Yoruba",						"id":"yo",		"ownlang":"Èdè Yorùbá"},
				"zu":			{"name":"Zulu",							"id":"zu",		"ownlang":"Zulu"}
			},
			"LibraryStrings": {
				"bg": {
					"add_to": "Добавяне към {{var0}}",
					"ascending": "Възходящ",
					"changelog_added": "Нови функции",
					"changelog_fixed": "Отстраняване на неизправности",
					"changelog_improved": "Подобрения",
					"changelog_progress": "Напредък",
					"confirm": "Сигурен ли си?",
					"descending": "Низходящ",
					"developer": "Разработчик",
					"donate_message": "Подкрепете ме за повече актуализации!",
					"file_navigator_text": "Преглед на файл",
					"first": "Първо",
					"gradient": "Градиент",
					"last": "Последно",
					"order": "Последователност",
					"server": "Сървър",
					"settings_showSupportBadges_description": "Показва малки значки за потребители, които поддържат моя Patreon",
					"settings_showToasts_description": "Показва тостове за стартиране и спиране на приставката",
					"settings_showToasts_note": "Деактивирайте общата настройка „ {{var0}} “ на BD, преди да ги деактивирате",
					"sort_by": "Сортиране по",
					"toast_plugin_force_updated": "{{var0}} се актуализира автоматично, тъй като версията ви беше много остаряла",
					"toast_plugin_started": "{{var0}} започна",
					"toast_plugin_stopped": "{{var0}} спря",
					"toast_plugin_translated": "преведено на {{var0}}",
					"toast_plugin_update_failed": "Актуализацията за {{var0}} не може да бъде изтеглена",
					"toast_plugin_updated": "{{var0}} {{var1}} е заменено с {{var2}} {{var3}}",
					"update_check": "Провери за актуализации",
					"update_check_complete": "Проверката за актуализация на приставката завърши",
					"update_check_complete_outdated": "Проверката на актуализацията на приставката завърши - {{var0}} остаряла!",
					"update_check_info": "Търси само актуализации на приставки, които поддържат проверката на актуализацията. Щракнете с десния бутон за списък с поддържани приставки. (Изброени ≠ остарели)",
					"update_check_inprocess": "Извършва се проверка на актуализацията на приставката",
					"update_notice_click": "Щракнете за актуализация!",
					"update_notice_reload": "Презаредете, за да завършите актуализацията",
					"update_notice_update": "Следните приставки трябва да бъдат актуализирани: "
				},
				"da": {
					"add_to": "Føj til {{var0}}",
					"ascending": "Stigende",
					"changelog_added": "Nye funktioner",
					"changelog_fixed": "Fejlfinding",
					"changelog_improved": "Forbedringer",
					"changelog_progress": "Fremskridt",
					"confirm": "Er du sikker?",
					"descending": "Aftagende",
					"developer": "Udvikler",
					"donate_message": "Støt mig for flere opdateringer!",
					"file_navigator_text": "Gennemse fil",
					"first": "Først",
					"gradient": "Gradient",
					"last": "Sidst",
					"order": "Sekvens",
					"server": "Server",
					"settings_showSupportBadges_description": "Viser små badges til brugere, der understøtter min Patreon",
					"settings_showToasts_description": "Viser plugin start og stop toasts",
					"settings_showToasts_note": "Deaktiver den generelle indstilling '{{var0}}' for BD'er, inden du deaktiverer dem",
					"sort_by": "Sorter efter",
					"toast_plugin_force_updated": "{{var0}} blev automatisk opdateret, fordi din version var meget forældet",
					"toast_plugin_started": "{{var0}} er startet",
					"toast_plugin_stopped": "{{var0}} er stoppet",
					"toast_plugin_translated": "oversat til {{var0}}",
					"toast_plugin_update_failed": "Opdatering til {{var0}} kan ikke downloades",
					"toast_plugin_updated": "{{var0}} {{var1}} er blevet erstattet af {{var2}} {{var3}}",
					"update_check": "Søg efter opdateringer",
					"update_check_complete": "Kontrol af plugin-opdatering afsluttet",
					"update_check_complete_outdated": "Kontrollen af ​​plugin-opdatering afsluttet - {{var0}} forældet!",
					"update_check_info": "Søger kun efter opdateringer af plugins, der understøtter opdateringskontrollen. Højreklik for en liste over understøttede plugins. (Opført ≠ forældet)",
					"update_check_inprocess": "Plugin-opdateringskontrol udføres",
					"update_notice_click": "Klik for at opdatere!",
					"update_notice_reload": "Genindlæs for at fuldføre opdateringen",
					"update_notice_update": "Følgende plugins skal opdateres: "
				},
				"de": {
					"add_to": "Zu {{var0}} hinzufügen",
					"ascending": "Aufsteigend",
					"changelog_added": "Neue Features",
					"changelog_fixed": "Fehlerbehebung",
					"changelog_improved": "Verbesserungen",
					"changelog_progress": "Fortschritt",
					"confirm": "Bist du sicher?",
					"descending": "Absteigend",
					"developer": "Entwickler",
					"donate_message": "Unterstütze mich, um weitere Updates zu erhalten!",
					"file_navigator_text": "Datei durchsuchen",
					"first": "Zuerst",
					"gradient": "Gradient",
					"last": "Zuletzt",
					"order": "Reihenfolge",
					"server": "Server",
					"settings_showSupportBadges_description": "Zeigt kleine Abzeichen für Benutzer, die meinen Patreon unterstützen",
					"settings_showToasts_description": "Zeigt Plugin Start und Stopp Toasts",
					"settings_showToasts_note": "Deaktiviere die allgemeine BD Einstellung '{{var0}}', bevor du diese deaktivierst",
					"sort_by": "Sortieren nach",
					"toast_plugin_force_updated": "{{var0}} wurde automatisch aktualisiert, da deine Version stark veraltet war",
					"toast_plugin_started": "{{var0}} wurde gestartet",
					"toast_plugin_stopped": "{{var0}} wurde gestoppt",
					"toast_plugin_translated": "übersetzt nach {{var0}}",
					"toast_plugin_update_failed": "Update für {{var0}} kann nicht heruntergeladen werden",
					"toast_plugin_updated": "{{var0}} {{var1}} wurde durch {{var2}} {{var3}} ersetzt",
					"update_check": "Auf Updates prüfen",
					"update_check_complete": "Plugin Update Check abgeschlossen",
					"update_check_complete_outdated": "Plugin Update Check abgeschlossen - {{var0}} veraltet!",
					"update_check_info": "Sucht nur nach Updates von Plugins, die die Update-Prüfung unterstützen. Klick mit der rechten Maustaste, um eine Liste der unterstützten Plugins anzuzeigen. (Gelistet ≠ veraltet)",
					"update_check_inprocess": "Plugin Update Check wird durchgeführt",
					"update_notice_click": "Zum Aktualisieren klicken!",
					"update_notice_reload": "Neu laden, um die Aktualisierung abzuschließen",
					"update_notice_update": "Die folgenden Plugins müssen aktualisiert werden: "
				},
				"el": {
					"add_to": "Προσθήκη στο {{var0}}",
					"ascending": "Ανερχόμενος",
					"changelog_added": "Νέα χαρακτηριστικά",
					"changelog_fixed": "Αντιμετώπιση προβλημάτων",
					"changelog_improved": "Βελτιώσεις",
					"changelog_progress": "Πρόοδος",
					"confirm": "Είσαι σίγουρος?",
					"descending": "Φθίνων",
					"developer": "Προγραμματιστής",
					"donate_message": "Υποστηρίξτε με για περισσότερες ενημερώσεις!",
					"file_navigator_text": "Αναζήτηση αρχείου",
					"first": "Πρώτα",
					"gradient": "Βαθμίδα",
					"last": "Τελευταίος",
					"order": "Αλληλουχία",
					"server": "Υπηρέτης",
					"settings_showSupportBadges_description": "Εμφανίζει μικρά σήματα για χρήστες που υποστηρίζουν το Patreon μου",
					"settings_showToasts_description": "Δείχνει τις προσθήκες έναρξης και διακοπής τοστ",
					"settings_showToasts_note": "Απενεργοποιήστε τη γενική ρύθμιση '{{var0}}' των BD πριν απενεργοποιήσετε",
					"sort_by": "Ταξινόμηση κατά",
					"toast_plugin_force_updated": "Το {{var0}} ενημερώθηκε αυτόματα επειδή η έκδοσή σας ήταν πολύ παλιά",
					"toast_plugin_started": "Το {{var0}} έχει ξεκινήσει",
					"toast_plugin_stopped": "Το {{var0}} έχει σταματήσει",
					"toast_plugin_translated": "μεταφράστηκε σε {{var0}}",
					"toast_plugin_update_failed": "Δεν είναι δυνατή η λήψη της ενημέρωσης για το {{var0}}",
					"toast_plugin_updated": "Το {{var0}} {{var1}} αντικαταστάθηκε από το {{var2}} {{var3}}",
					"update_check": "Ελεγχος για ενημερώσεις",
					"update_check_complete": "Ο έλεγχος ενημέρωσης προσθήκης ολοκληρώθηκε",
					"update_check_complete_outdated": "Ο έλεγχος ενημέρωσης προσθηκών ολοκληρώθηκε - {{var0}} δεν είναι ενημερωμένος!",
					"update_check_info": "Αναζήτηση μόνο για ενημερώσεις προσθηκών που υποστηρίζουν τον έλεγχο ενημέρωσης. Κάντε δεξί κλικ για μια λίστα υποστηριζόμενων προσθηκών. (Καταχωρισμένο ≠ ξεπερασμένο)",
					"update_check_inprocess": "Πραγματοποιείται έλεγχος ενημέρωσης προσθηκών",
					"update_notice_click": "Κάντε κλικ για ενημέρωση!",
					"update_notice_reload": "Επαναλάβετε τη φόρτωση για να ολοκληρώσετε την ενημέρωση",
					"update_notice_update": "Οι ακόλουθες προσθήκες πρέπει να ενημερωθούν: "
				},
				"es": {
					"add_to": "Agregar a {{var0}}",
					"ascending": "Ascendente",
					"changelog_added": "Nuevas características",
					"changelog_fixed": "Solución de problemas",
					"changelog_improved": "Mejoras",
					"changelog_progress": "Progreso",
					"confirm": "¿Estás seguro?",
					"descending": "Descendiendo",
					"developer": "Desarrollador",
					"donate_message": "¡Apóyanme para obtener más actualizaciones!",
					"file_navigator_text": "Buscar Archivo",
					"first": "Primero",
					"gradient": "Degradado",
					"last": "Último",
					"order": "Secuencia",
					"server": "Servidor",
					"settings_showSupportBadges_description": "Muestra pequeñas insignias para los usuarios que apoyan mi Patreon",
					"settings_showToasts_description": "Muestra el inicio y la parada del complemento.",
					"settings_showToasts_note": "Desactive la configuración general '{{var0}}' de los BD antes de desactivarlos",
					"sort_by": "Ordenar por",
					"toast_plugin_force_updated": "{{var0}} se actualizó automáticamente porque su versión estaba muy desactualizada",
					"toast_plugin_started": "{{var0}} ha comenzado",
					"toast_plugin_stopped": "{{var0}} se detuvo",
					"toast_plugin_translated": "traducido a {{var0}}",
					"toast_plugin_update_failed": "No se puede descargar la actualización para {{var0}}",
					"toast_plugin_updated": "{{var0}} {{var1}} ha sido reemplazado por {{var2}} {{var3}}",
					"update_check": "Buscar actualizaciones",
					"update_check_complete": "Comprobación de actualización del complemento completada",
					"update_check_complete_outdated": "Verificación de actualización del complemento completada: {{var0}} desactualizada.",
					"update_check_info": "Solo busca actualizaciones de complementos que admitan la comprobación de actualizaciones. Haga clic derecho para obtener una lista de complementos compatibles. (Listado ≠ obsoleto)",
					"update_check_inprocess": "Se lleva a cabo la verificación de actualización del complemento",
					"update_notice_click": "¡Haz clic para actualizar!",
					"update_notice_reload": "Recargar para completar la actualización",
					"update_notice_update": "Los siguientes complementos deben actualizarse: "
				},
				"fi": {
					"add_to": "Lisää {{var0}}",
					"ascending": "Nouseva",
					"changelog_added": "Uudet ominaisuudet",
					"changelog_fixed": "Ongelmien karttoittaminen",
					"changelog_improved": "Parannuksia",
					"changelog_progress": "Edistystä",
					"confirm": "Oletko varma?",
					"descending": "Laskeva",
					"developer": "Kehittäjä",
					"donate_message": "Tue minua lisää päivityksiä varten!",
					"file_navigator_text": "Selaa tiedostoa",
					"first": "Ensimmäinen",
					"gradient": "Kaltevuus",
					"last": "Kestää",
					"order": "Järjestys",
					"server": "Palvelin",
					"settings_showSupportBadges_description": "Näyttää pienet merkit käyttäjille, jotka tukevat Patreoniani",
					"settings_showToasts_description": "Näyttää laajennuksen aloitus- ja lopetusleivokset",
					"settings_showToasts_note": "Poista BD-levyjen yleinen asetus {{var0}} ennen niiden poistamista käytöstä",
					"sort_by": "Järjestä",
					"toast_plugin_force_updated": "{{var0}} päivitettiin automaattisesti, koska versiosi oli vanhentunut",
					"toast_plugin_started": "{{var0}} on alkanut",
					"toast_plugin_stopped": "{{var0}} on pysähtynyt",
					"toast_plugin_translated": "käännetty kielelle {{var0}}",
					"toast_plugin_update_failed": "Verkkotunnuksen {{var0}} päivitystä ei voi ladata",
					"toast_plugin_updated": "{{var0}} {{var1}} on korvattu sanalla {{var2}} {{var3}}",
					"update_check": "Tarkista päivitykset",
					"update_check_complete": "Laajennuksen päivityksen tarkistus valmis",
					"update_check_complete_outdated": "Laajennuksen päivityksen tarkistus suoritettu - {{var0}} vanhentunut!",
					"update_check_info": "Hakee vain päivitystarkistusta tukevien laajennusten päivityksiä. Napsauta hiiren kakkospainikkeella luetteloa tuetuista laajennuksista. (Listattu ≠ vanhentunut)",
					"update_check_inprocess": "Laajennuksen päivitys tarkistetaan",
					"update_notice_click": "Napsauta päivittääksesi!",
					"update_notice_reload": "Lataa päivitys loppuun",
					"update_notice_update": "Seuraavat laajennukset on päivitettävä: "
				},
				"fr": {
					"add_to": "Ajouter à {{var0}}",
					"ascending": "Ascendant",
					"changelog_added": "Nouvelles fonctionnalités",
					"changelog_fixed": "Dépannage",
					"changelog_improved": "Améliorations",
					"changelog_progress": "Le progrès",
					"confirm": "Êtes-vous sûr?",
					"descending": "Descendant",
					"developer": "Développeur",
					"donate_message": "Soutenez-moi pour plus de mises à jour!",
					"file_navigator_text": "Parcourir le fichier",
					"first": "Première",
					"gradient": "Pente",
					"last": "Dernier",
					"order": "Séquence",
					"server": "Serveur",
					"settings_showSupportBadges_description": "Affiche de petits badges pour les utilisateurs qui soutiennent mon Patreon",
					"settings_showToasts_description": "Affiche les toasts de démarrage et d'arrêt du plugin",
					"settings_showToasts_note": "Désactivez le paramètre général '{{var0}}' des BD avant de les désactiver",
					"sort_by": "Trier par",
					"toast_plugin_force_updated": "{{var0}} a été automatiquement mis à jour car votre version était très obsolète",
					"toast_plugin_started": "{{var0}} a commencé",
					"toast_plugin_stopped": "{{var0}} s'est arrêté",
					"toast_plugin_translated": "traduit en {{var0}}",
					"toast_plugin_update_failed": "La mise à jour pour {{var0}} ne peut pas être téléchargée",
					"toast_plugin_updated": "{{var0}} {{var1}} a été remplacé par {{var2}} {{var3}}",
					"update_check": "Rechercher des mises à jour",
					"update_check_complete": "Vérification de la mise à jour du plug-in terminée",
					"update_check_complete_outdated": "Vérification de la mise à jour du plug-in terminée - {{var0}} obsolète!",
					"update_check_info": "Recherche uniquement les mises à jour des plugins prenant en charge la vérification des mises à jour. Cliquez avec le bouton droit pour une liste des plugins pris en charge. (Listé ≠ obsolète)",
					"update_check_inprocess": "La vérification de la mise à jour du plugin est effectuée",
					"update_notice_click": "Cliquez pour mettre à jour!",
					"update_notice_reload": "Recharger pour terminer la mise à jour",
					"update_notice_update": "Les plugins suivants doivent être mis à jour: "
				},
				"hr": {
					"add_to": "Dodaj u {{var0}}",
					"ascending": "Uzlazni",
					"changelog_added": "Nove značajke",
					"changelog_fixed": "Rješavanje problema",
					"changelog_improved": "Poboljšanja",
					"changelog_progress": "Napredak",
					"confirm": "Jesi li siguran?",
					"descending": "Silazni",
					"developer": "Programer",
					"donate_message": "Podržite me za još novosti!",
					"file_navigator_text": "Pregledaj datoteku",
					"first": "Prvi",
					"gradient": "Gradijent",
					"last": "Posljednji",
					"order": "Slijed",
					"server": "Poslužitelju",
					"settings_showSupportBadges_description": "Prikazuje male značke za korisnike koji podržavaju moj Patreon",
					"settings_showToasts_description": "Prikazuje tost za pokretanje i zaustavljanje dodatka",
					"settings_showToasts_note": "Onemogućite opću postavku '{{var0}}' BD-ova prije nego što ih onemogućite",
					"sort_by": "Poredati po",
					"toast_plugin_force_updated": "{{var0}} je automatski ažuriran jer je vaša verzija bila vrlo zastarjela",
					"toast_plugin_started": "{{var0}} je započeo",
					"toast_plugin_stopped": "{{var0}} je zaustavljen",
					"toast_plugin_translated": "prevedeno na {{var0}}",
					"toast_plugin_update_failed": "Ažuriranje za {{var0}} nije moguće preuzeti",
					"toast_plugin_updated": "{{var0}} {{var1}} zamijenjen je s {{var2}} {{var3}}",
					"update_check": "Provjerite ima li ažuriranja",
					"update_check_complete": "Provjera ažuriranja dodatka dovršena",
					"update_check_complete_outdated": "Provjera ažuriranja dodatka dovršena - {{var0}} zastarjelo!",
					"update_check_info": "Traži samo ažuriranja dodataka koji podržavaju provjeru ažuriranja. Desni klik za popis podržanih dodataka. (Navedeno ≠ zastarjelo)",
					"update_check_inprocess": "Provodi se provjera ažuriranja dodatka",
					"update_notice_click": "Kliknite za ažuriranje!",
					"update_notice_reload": "Ponovo učitajte da biste dovršili ažuriranje",
					"update_notice_update": "Treba ažurirati sljedeće dodatke: "
				},
				"hu": {
					"add_to": "Hozzáadás a következőhöz: {{var0}}",
					"ascending": "Növekvő",
					"changelog_added": "Új funkciók",
					"changelog_fixed": "Hibaelhárítás",
					"changelog_improved": "Fejlesztések",
					"changelog_progress": "Előrehalad",
					"confirm": "Biztos vagy ebben?",
					"descending": "Csökkenő",
					"developer": "Fejlesztő",
					"donate_message": "Támogasson további frissítésekért!",
					"file_navigator_text": "Tallózás a fájlban",
					"first": "Első",
					"gradient": "Gradiens",
					"last": "Utolsó",
					"order": "Sorrend",
					"server": "Szerver",
					"settings_showSupportBadges_description": "Apró jelvényeket mutat azoknak a felhasználóknak, akik támogatják a Patreon-t",
					"settings_showToasts_description": "Mutatja a plugin start és stop pirítósokat",
					"settings_showToasts_note": "Mielőtt letiltaná őket, tiltsa le a BD-k „ {{var0}} ” általános beállítását",
					"sort_by": "Sorrend",
					"toast_plugin_force_updated": "A (z) {{var0}} automatikusan frissült, mert a verziója nagyon elavult",
					"toast_plugin_started": "A (z) {{var0}} elindult",
					"toast_plugin_stopped": "A (z) {{var0}} leállt",
					"toast_plugin_translated": "lefordítva {{var0}} nyelvre",
					"toast_plugin_update_failed": "A (z) {{var0}} frissítése nem tölthető le",
					"toast_plugin_updated": "A (z) {{var0}} {{var1}} helyébe a következő lépett: {{var2}} {{var3}}",
					"update_check": "Frissítések keresése",
					"update_check_complete": "A beépülő modul frissítésének ellenőrzése befejeződött",
					"update_check_complete_outdated": "A beépülő modul frissítésének ellenőrzése befejeződött - {{var0}} elavult!",
					"update_check_info": "Csak a frissítések ellenőrzését támogató bővítmények frissítéseire keres. Kattintson a jobb gombbal a támogatott bővítmények listájához. (Felsorolt ​​≠ elavult)",
					"update_check_inprocess": "A bővítmény frissítésének ellenőrzése megtörtént",
					"update_notice_click": "Kattintson a frissítéshez!",
					"update_notice_reload": "Töltse be újra a frissítés befejezéséhez",
					"update_notice_update": "A következő bővítményeket frissíteni kell: "
				},
				"it": {
					"add_to": "Aggiungi a {{var0}}",
					"ascending": "Ascendente",
					"changelog_added": "Nuove caratteristiche",
					"changelog_fixed": "Risoluzione dei problemi",
					"changelog_improved": "Miglioramenti",
					"changelog_progress": "Progresso",
					"confirm": "Sei sicuro?",
					"descending": "Discendente",
					"developer": "Sviluppatore",
					"donate_message": "Supportami per ulteriori aggiornamenti!",
					"file_navigator_text": "Sfoglia file",
					"first": "Primo",
					"gradient": "Pendenza",
					"last": "Scorso",
					"order": "Sequenza",
					"server": "Server",
					"settings_showSupportBadges_description": "Mostra piccoli badge per gli utenti che supportano il mio Patreon",
					"settings_showToasts_description": "Mostra l'avvio e l'arresto del plugin",
					"settings_showToasts_note": "Disabilita l'impostazione generale '{{var0}}' dei BD prima di disabilitarli",
					"sort_by": "Ordina per",
					"toast_plugin_force_updated": "{{var0}} è stato aggiornato automaticamente perché la tua versione era molto obsoleta",
					"toast_plugin_started": "{{var0}} è iniziato",
					"toast_plugin_stopped": "{{var0}} si è fermato",
					"toast_plugin_translated": "tradotto in {{var0}}",
					"toast_plugin_update_failed": "Impossibile scaricare l'aggiornamento per {{var0}}",
					"toast_plugin_updated": "{{var0}} {{var1}} è stato sostituito da {{var2}} {{var3}}",
					"update_check": "Controlla gli aggiornamenti",
					"update_check_complete": "Controllo dell'aggiornamento del plug-in completato",
					"update_check_complete_outdated": "Controllo aggiornamento plug-in completato - {{var0}} non aggiornato!",
					"update_check_info": "Cerca solo gli aggiornamenti dei plugin che supportano il controllo degli aggiornamenti. Fare clic con il tasto destro per un elenco dei plugin supportati. (Elencato ≠ obsoleto)",
					"update_check_inprocess": "Viene eseguito il controllo dell'aggiornamento del plugin",
					"update_notice_click": "Fare clic per aggiornare!",
					"update_notice_reload": "Ricarica per completare l'aggiornamento",
					"update_notice_update": "I seguenti plugin devono essere aggiornati: "
				},
				"ja": {
					"add_to": "{{var0}} に追加",
					"ascending": "上昇",
					"changelog_added": "新機能",
					"changelog_fixed": "トラブルシューティング",
					"changelog_improved": "改善点",
					"changelog_progress": "進捗",
					"confirm": "本気ですか？",
					"descending": "降順",
					"developer": "開発者",
					"donate_message": "より多くのアップデートのために私をサポートしてください！",
					"file_navigator_text": "ファイルを参照",
					"first": "最初",
					"gradient": "勾配",
					"last": "最終",
					"order": "シーケンス",
					"server": "サーバ",
					"settings_showSupportBadges_description": "私のパトレオンをサポートするユーザーに小さなバッジを表示します",
					"settings_showToasts_description": "プラグインの開始と停止のトーストを表示します",
					"settings_showToasts_note": "BDを無効にする前に、BDの一般設定「 {{var0}} 」を無効にしてください",
					"sort_by": "並び替え",
					"toast_plugin_force_updated": "バージョンが非常に古くなったため、 {{var0}} は自動的に更新されました",
					"toast_plugin_started": "{{var0}} が開始されました",
					"toast_plugin_stopped": "{{var0}} が停止しました",
					"toast_plugin_translated": "{{var0}} に変換",
					"toast_plugin_update_failed": "{{var0}} の更新をダウンロードできません",
					"toast_plugin_updated": "{{var0}} {{var1}}は{{var2}} {{var3}}に置き換えられました",
					"update_check": "アップデートを確認する",
					"update_check_complete": "プラグインの更新チェックが完了しました",
					"update_check_complete_outdated": "プラグインの更新チェックが完了しました- {{var0}} が古くなっています！",
					"update_check_info": "更新チェックをサポートするプラグインの更新のみを検索します。サポートされているプラ​​グインのリストを右クリックします。 （リストされている≠廃止）",
					"update_check_inprocess": "プラグイン更新チェックが実行されます",
					"update_notice_click": "クリックして更新してください！",
					"update_notice_reload": "リロードして更新を完了します",
					"update_notice_update": "次のプラグインを更新する必要があります。"
				},
				"ko": {
					"add_to": "{{var0}} 에 추가",
					"ascending": "오름차순",
					"changelog_added": "새로운 기능",
					"changelog_fixed": "문제 해결",
					"changelog_improved": "개량",
					"changelog_progress": "진행",
					"confirm": "확실해?",
					"descending": "내림차순",
					"developer": "개발자",
					"donate_message": "더 많은 업데이트를 위해 저를 지원하십시오!",
					"file_navigator_text": "파일 찾아보기",
					"first": "먼저",
					"gradient": "구배",
					"last": "마지막",
					"order": "순서",
					"server": "섬기는 사람",
					"settings_showSupportBadges_description": "내 Patreon을 지원하는 사용자에게 작은 배지를 표시합니다.",
					"settings_showToasts_description": "플러그인 시작 및 중지 알림 표시",
					"settings_showToasts_note": "BD를 비활성화하기 전에 BD의 일반 설정 '{{var0}}'을 비활성화하십시오.",
					"sort_by": "정렬 기준",
					"toast_plugin_force_updated": "버전이 매우 오래되어 {{var0}} 이 자동으로 업데이트되었습니다.",
					"toast_plugin_started": "{{var0}} 이 시작되었습니다.",
					"toast_plugin_stopped": "{{var0}} 이 중지되었습니다.",
					"toast_plugin_translated": "{{var0}} 로 번역됨",
					"toast_plugin_update_failed": "{{var0}} 에 대한 업데이트를 다운로드 할 수 없습니다.",
					"toast_plugin_updated": "{{var0}} {{var1}}이 {{var2}} {{var3}}로 대체되었습니다.",
					"update_check": "업데이트 확인",
					"update_check_complete": "플러그인 업데이트 확인 완료",
					"update_check_complete_outdated": "플러그인 업데이트 확인 완료- {{var0}} 이 (가) 오래되었습니다!",
					"update_check_info": "업데이트 확인을 지원하는 플러그인의 업데이트 만 검색합니다. 지원되는 플러그인 목록을 보려면 마우스 오른쪽 버튼을 클릭하십시오. (나열된 ≠ 구식)",
					"update_check_inprocess": "플러그인 업데이트 확인이 수행됩니다.",
					"update_notice_click": "업데이트하려면 클릭하세요!",
					"update_notice_reload": "업데이트를 완료하려면 새로 고침하세요.",
					"update_notice_update": "다음 플러그인을 업데이트해야합니다."
				},
				"lt": {
					"add_to": "Pridėti prie {{var0}}",
					"ascending": "Kylanti",
					"changelog_added": "Naujos savybės",
					"changelog_fixed": "Problemų sprendimas",
					"changelog_improved": "Patobulinimai",
					"changelog_progress": "Progresas",
					"confirm": "Ar tu tuo tikras?",
					"descending": "Mažėjantis",
					"developer": "Programuotojas",
					"donate_message": "Palaikykite mane, kad gautumėte daugiau naujinių!",
					"file_navigator_text": "Naršyti failą",
					"first": "Pirmas",
					"gradient": "Gradientas",
					"last": "Paskutinis",
					"order": "Seka",
					"server": "Serverio",
					"settings_showSupportBadges_description": "Rodo mažus ženklelius vartotojams, palaikantiems mano „Patreon“",
					"settings_showToasts_description": "Parodo įskiepių paleidimo ir sustabdymo tostus",
					"settings_showToasts_note": "Prieš išjungdami, išjunkite bendrą BD nustatymą „ {{var0}} “",
					"sort_by": "Rūšiuoti pagal",
					"toast_plugin_force_updated": "„ {{var0}} “ buvo automatiškai atnaujinta, nes jūsų versija buvo labai pasenusi",
					"toast_plugin_started": "„ {{var0}} “ prasidėjo",
					"toast_plugin_stopped": "„ {{var0}} “ sustabdyta",
					"toast_plugin_translated": "išversta į {{var0}}",
					"toast_plugin_update_failed": "Negalima atsisiųsti {{var0}} naujinio",
					"toast_plugin_updated": "{{var0}} {{var1}} pakeista į {{var2}} {{var3}}",
					"update_check": "Tikrinti, ar yra atnaujinimų",
					"update_check_complete": "Įskiepio atnaujinimo patikrinimas baigtas",
					"update_check_complete_outdated": "Papildinio atnaujinimo patikra baigta - {{var0}} pasenęs!",
					"update_check_info": "Ieškoma tik papildinių, palaikančių naujinių patikrinimą, naujinių. Dešiniuoju pelės mygtuku spustelėkite palaikomų papildinių sąrašą. (Išvardyti ≠ pasenę)",
					"update_check_inprocess": "Atliekamas papildinio atnaujinimo patikrinimas",
					"update_notice_click": "Spustelėkite norėdami atnaujinti!",
					"update_notice_reload": "Įkelkite iš naujo, kad užbaigtumėte atnaujinimą",
					"update_notice_update": "Reikia atnaujinti šiuos papildinius: "
				},
				"nl": {
					"add_to": "Toevoegen aan {{var0}}",
					"ascending": "Oplopend",
					"changelog_added": "Nieuwe features",
					"changelog_fixed": "Probleemoplossen",
					"changelog_improved": "Verbeteringen",
					"changelog_progress": "Vooruitgang",
					"confirm": "Weet je zeker dat?",
					"descending": "Aflopend",
					"developer": "Ontwikkelaar",
					"donate_message": "Steun mij voor meer updates!",
					"file_navigator_text": "Bestand zoeken",
					"first": "Eerste",
					"gradient": "Verloop",
					"last": "Laatste",
					"order": "Volgorde",
					"server": "Server",
					"settings_showSupportBadges_description": "Toont kleine badges voor gebruikers die mijn Patreon ondersteunen",
					"settings_showToasts_description": "Toont plugin start en stop toasts",
					"settings_showToasts_note": "Schakel de algemene instelling '{{var0}}' van BD's uit voordat u ze uitschakelt",
					"sort_by": "Sorteer op",
					"toast_plugin_force_updated": "{{var0}} is automatisch bijgewerkt omdat uw versie erg verouderd was",
					"toast_plugin_started": "{{var0}} is gestart",
					"toast_plugin_stopped": "{{var0}} is gestopt",
					"toast_plugin_translated": "vertaald naar {{var0}}",
					"toast_plugin_update_failed": "Update voor {{var0}} kan niet worden gedownload",
					"toast_plugin_updated": "{{var0}} {{var1}} is vervangen door {{var2}} {{var3}}",
					"update_check": "Controleer op updates",
					"update_check_complete": "Controle op update van plug-in voltooid",
					"update_check_complete_outdated": "Controle van update van plug-in voltooid - {{var0}} verouderd!",
					"update_check_info": "Zoekt alleen naar updates van plug-ins die de updatecontrole ondersteunen. Klik met de rechtermuisknop voor een lijst met ondersteunde plug-ins. (Vermeld ≠ verouderd)",
					"update_check_inprocess": "De update van de plug-in wordt uitgevoerd",
					"update_notice_click": "Klik om te updaten!",
					"update_notice_reload": "Laad opnieuw om de update te voltooien",
					"update_notice_update": "De volgende plug-ins moeten worden bijgewerkt: "
				},
				"no": {
					"add_to": "Legg til i {{var0}}",
					"ascending": "Stigende",
					"changelog_added": "Nye funksjoner",
					"changelog_fixed": "Feilsøking",
					"changelog_improved": "Forbedringer",
					"changelog_progress": "Framgang",
					"confirm": "Er du sikker?",
					"descending": "Fallende",
					"developer": "Utvikler",
					"donate_message": "Støtt meg for flere oppdateringer!",
					"file_navigator_text": "Bla gjennom filen",
					"first": "Først",
					"gradient": "Gradient",
					"last": "Siste",
					"order": "Sekvens",
					"server": "Server",
					"settings_showSupportBadges_description": "Viser små merker for brukere som støtter min Patreon",
					"settings_showToasts_description": "Viser plugin-start og stopp toasts",
					"settings_showToasts_note": "Deaktiver den generelle innstillingen '{{var0}}' for BD-er før du deaktiverer dem",
					"sort_by": "Sorter etter",
					"toast_plugin_force_updated": "{{var0}} ble automatisk oppdatert fordi versjonen din var veldig utdatert",
					"toast_plugin_started": "{{var0}} har startet",
					"toast_plugin_stopped": "{{var0}} har stoppet",
					"toast_plugin_translated": "oversatt til {{var0}}",
					"toast_plugin_update_failed": "Oppdatering for {{var0}} kan ikke lastes ned",
					"toast_plugin_updated": "{{var0}} {{var1}} er erstattet av {{var2}} {{var3}}",
					"update_check": "Se etter oppdateringer",
					"update_check_complete": "Sjekk plugin-oppdatering fullført",
					"update_check_complete_outdated": "Sjekk plugin-oppdatering fullført - {{var0}} utdatert!",
					"update_check_info": "Søker bare etter oppdateringer av plugins som støtter oppdateringskontrollen. Høyreklikk for en liste over støttede plugins. (Oppført ≠ foreldet)",
					"update_check_inprocess": "Kontrollen av programvareoppdatering utføres",
					"update_notice_click": "Klikk for å oppdatere!",
					"update_notice_reload": "Last inn for å fullføre oppdateringen",
					"update_notice_update": "Følgende plugins må oppdateres: "
				},
				"pl": {
					"add_to": "Dodaj do {{var0}}",
					"ascending": "Rosnąco",
					"changelog_added": "Nowe funkcje",
					"changelog_fixed": "Rozwiązywanie problemów",
					"changelog_improved": "Improvements",
					"changelog_progress": "Postęp",
					"confirm": "Jesteś pewny?",
					"descending": "Malejąco",
					"developer": "Deweloper",
					"donate_message": "Wesprzyj mnie, aby uzyskać więcej aktualizacji!",
					"file_navigator_text": "Przeglądać plik",
					"first": "Pierwszy",
					"gradient": "Gradient",
					"last": "Ostatni, ubiegły, zeszły",
					"order": "Sekwencja",
					"server": "Serwer",
					"settings_showSupportBadges_description": "Pokazuje małe odznaki dla użytkowników, którzy wspierają mój Patreon",
					"settings_showToasts_description": "Pokazuje toasty uruchamiające i zatrzymujące wtyczkę",
					"settings_showToasts_note": "Wyłącz ogólne ustawienie „ {{var0}} ” dysków BD przed ich wyłączeniem",
					"sort_by": "Sortuj według",
					"toast_plugin_force_updated": "{{var0}} został automatycznie zaktualizowany, ponieważ Twoja wersja była bardzo nieaktualna",
					"toast_plugin_started": "Rozpoczęto {{var0}}",
					"toast_plugin_stopped": "{{var0}} został zatrzymany",
					"toast_plugin_translated": "przetłumaczone na {{var0}}",
					"toast_plugin_update_failed": "Nie można pobrać aktualizacji dla {{var0}}",
					"toast_plugin_updated": "{{var0}} {{var1}} został zastąpiony przez {{var2}} {{var3}}",
					"update_check": "Sprawdź aktualizacje",
					"update_check_complete": "Sprawdzanie aktualizacji wtyczki zakończone",
					"update_check_complete_outdated": "Sprawdzanie aktualizacji wtyczki zakończone - {{var0}} nieaktualne!",
					"update_check_info": "Wyszukuje tylko aktualizacje wtyczek, które obsługują sprawdzanie aktualizacji. Kliknij prawym przyciskiem myszy, aby wyświetlić listę obsługiwanych wtyczek. (Wystawione ≠ nieaktualne)",
					"update_check_inprocess": "Wykonywane jest sprawdzenie aktualizacji wtyczki",
					"update_notice_click": "Kliknij, aby zaktualizować!",
					"update_notice_reload": "Załaduj ponownie, aby zakończyć aktualizację",
					"update_notice_update": "Należy zaktualizować następujące wtyczki: "
				},
				"pt-BR": {
					"add_to": "Adicionar a {{var0}}",
					"ascending": "Ascendente",
					"changelog_added": "Novas características",
					"changelog_fixed": "Solução de problemas",
					"changelog_improved": "Melhorias",
					"changelog_progress": "Progresso",
					"confirm": "Você tem certeza?",
					"descending": "Descendente",
					"developer": "Desenvolvedor",
					"donate_message": "Apoie-me para mais atualizações!",
					"file_navigator_text": "Procurar arquivo",
					"first": "Primeiro",
					"gradient": "Gradiente",
					"last": "Último",
					"order": "Seqüência",
					"server": "Servidor",
					"settings_showSupportBadges_description": "Mostra pequenos emblemas para usuários que apóiam meu Patreon",
					"settings_showToasts_description": "Mostra o início e o fim do plugin do brinde",
					"settings_showToasts_note": "Desative a configuração geral '{{var0}}' de BDs antes de desativá-los",
					"sort_by": "Ordenar por",
					"toast_plugin_force_updated": "{{var0}} foi atualizado automaticamente porque sua versão estava muito desatualizada",
					"toast_plugin_started": "{{var0}} começou",
					"toast_plugin_stopped": "{{var0}} parou",
					"toast_plugin_translated": "traduzido para {{var0}}",
					"toast_plugin_update_failed": "A atualização para {{var0}} não pode ser baixada",
					"toast_plugin_updated": "{{var0}} {{var1}} foi substituído por {{var2}} {{var3}}",
					"update_check": "Verifique se há atualizações",
					"update_check_complete": "Verificação de atualização do plug-in concluída",
					"update_check_complete_outdated": "Verificação de atualização do plug-in concluída - {{var0}} desatualizado!",
					"update_check_info": "Procura apenas atualizações de plug-ins que suportam a verificação de atualização. Clique com o botão direito para obter uma lista de plug-ins suportados. (Listado ≠ obsoleto)",
					"update_check_inprocess": "A verificação de atualização do plug-in é realizada",
					"update_notice_click": "Clique para atualizar!",
					"update_notice_reload": "Recarregue para completar a atualização",
					"update_notice_update": "Os seguintes plug-ins precisam ser atualizados: "
				},
				"ro": {
					"add_to": "Adăugați la {{var0}}",
					"ascending": "Ascendent",
					"changelog_added": "Functii noi",
					"changelog_fixed": "Depanare",
					"changelog_improved": "Îmbunătățiri",
					"changelog_progress": "Progres",
					"confirm": "Esti sigur?",
					"descending": "Descendentă",
					"developer": "Dezvoltator",
					"donate_message": "Sprijină-mă pentru mai multe actualizări!",
					"file_navigator_text": "Răsfoiți fișierul",
					"first": "Primul",
					"gradient": "Gradient",
					"last": "Ultimul",
					"order": "Secvenţă",
					"server": "Server",
					"settings_showSupportBadges_description": "Afișează insigne mici pentru utilizatorii care acceptă Patreon",
					"settings_showToasts_description": "Afișează pornirea și oprirea toastelor pluginului",
					"settings_showToasts_note": "Dezactivați setarea generală „ {{var0}} ” a BD-urilor înainte de a le dezactiva",
					"sort_by": "Filtrează după",
					"toast_plugin_force_updated": "{{var0}} a fost actualizat automat deoarece versiunea dvs. a fost foarte depășită",
					"toast_plugin_started": "{{var0}} a început",
					"toast_plugin_stopped": "{{var0}} s-a oprit",
					"toast_plugin_translated": "tradus în {{var0}}",
					"toast_plugin_update_failed": "Actualizarea pentru {{var0}} nu poate fi descărcată",
					"toast_plugin_updated": "{{var0}} {{var1}} a fost înlocuit cu {{var2}} {{var3}}",
					"update_check": "Verifică pentru actualizări",
					"update_check_complete": "Verificarea actualizării pluginului s-a finalizat",
					"update_check_complete_outdated": "Verificarea actualizării pluginului s-a finalizat - {{var0}} nu este actualizată!",
					"update_check_info": "Căutați numai actualizări ale pluginurilor care acceptă verificarea actualizărilor. Faceți clic dreapta pentru o listă a pluginurilor acceptate. (Listat ≠ învechit)",
					"update_check_inprocess": "Verificarea actualizării pluginului este efectuată",
					"update_notice_click": "Faceți clic pentru a actualiza!",
					"update_notice_reload": "Reîncărcați pentru a finaliza actualizarea",
					"update_notice_update": "Următoarele pluginuri trebuie actualizate: "
				},
				"ru": {
					"add_to": "Добавить в {{var0}}",
					"ascending": "Восходящий",
					"changelog_added": "Новые возможности",
					"changelog_fixed": "Поиск проблемы",
					"changelog_improved": "Улучшения",
					"changelog_progress": "Прогресс",
					"confirm": "Ты уверен?",
					"descending": "По убыванию",
					"developer": "Разработчик",
					"donate_message": "Поддержите меня, чтобы получать больше обновлений!",
					"file_navigator_text": "Просмотреть файл",
					"first": "Первый",
					"gradient": "Градиент",
					"last": "Последний",
					"order": "Последовательность",
					"server": "Сервер",
					"settings_showSupportBadges_description": "Показывает маленькие значки для пользователей, которые поддерживают мой Patreon",
					"settings_showToasts_description": "Показывает запуск и остановку всплывающих окон",
					"settings_showToasts_note": "Отключите общую настройку '{{var0}}' BD перед их отключением",
					"sort_by": "Сортировать по",
					"toast_plugin_force_updated": "{{var0}} был обновлен автоматически, поскольку ваша версия очень устарела",
					"toast_plugin_started": "{{var0}} началось",
					"toast_plugin_stopped": "{{var0}} остановлен",
					"toast_plugin_translated": "переведено на {{var0}}",
					"toast_plugin_update_failed": "Обновление для {{var0}} не может быть загружено",
					"toast_plugin_updated": "{{var0}} {{var1}} был заменен на {{var2}} {{var3}}",
					"update_check": "Проверить обновления",
					"update_check_complete": "Проверка обновлений плагина завершена",
					"update_check_complete_outdated": "Проверка обновлений плагина завершена - {{var0}} устарело!",
					"update_check_info": "Выполняет поиск только обновлений плагинов, поддерживающих проверку обновлений. Щелкните правой кнопкой мыши, чтобы просмотреть список поддерживаемых плагинов. (В списке ≠ устарело)",
					"update_check_inprocess": "Выполняется проверка обновлений плагина",
					"update_notice_click": "Нажмите, чтобы обновить!",
					"update_notice_reload": "Перезагрузите, чтобы завершить обновление",
					"update_notice_update": "Необходимо обновить следующие плагины: "
				},
				"sv": {
					"add_to": "Lägg till i {{var0}}",
					"ascending": "Stigande",
					"changelog_added": "Nya egenskaper",
					"changelog_fixed": "Felsökning",
					"changelog_improved": "Förbättringar",
					"changelog_progress": "Framsteg",
					"confirm": "Är du säker?",
					"descending": "Nedåtgående",
					"developer": "Utvecklaren",
					"donate_message": "Stöd mig för fler uppdateringar!",
					"file_navigator_text": "Bläddra i filen",
					"first": "Först",
					"gradient": "Lutning",
					"last": "Sista",
					"order": "Sekvens",
					"server": "Server",
					"settings_showSupportBadges_description": "Visar små märken för användare som stöder min Patreon",
					"settings_showToasts_description": "Visar plugin start och stopp toasts",
					"settings_showToasts_note": "Inaktivera den allmänna inställningen '{{var0}}' för BD-skivor innan du inaktiverar dem",
					"sort_by": "Sortera efter",
					"toast_plugin_force_updated": "{{var0}} uppdaterades automatiskt eftersom din version var mycket föråldrad",
					"toast_plugin_started": "{{var0}} har startat",
					"toast_plugin_stopped": "{{var0}} har slutat",
					"toast_plugin_translated": "översatt till {{var0}}",
					"toast_plugin_update_failed": "Uppdatering för {{var0}} kan inte laddas ner",
					"toast_plugin_updated": "{{var0}} {{var1}} har ersatts med {{var2}} {{var3}}",
					"update_check": "Sök efter uppdateringar",
					"update_check_complete": "Kontrollen av plugin-uppdateringen slutförd",
					"update_check_complete_outdated": "Kontrollen av plugin-uppdateringen slutförd - {{var0}} inaktuell!",
					"update_check_info": "Söker bara efter uppdateringar av plugins som stöder uppdateringskontrollen. Högerklicka för en lista över plugins som stöds. (Listad ≠ föråldrad)",
					"update_check_inprocess": "Kontroll av plugin-uppdatering utförs",
					"update_notice_click": "Klicka för att uppdatera!",
					"update_notice_reload": "Ladda om för att slutföra uppdateringen",
					"update_notice_update": "Följande plugins måste uppdateras: "
				},
				"th": {
					"add_to": "เพิ่มใน {{var0}}",
					"ascending": "จากน้อยไปมาก",
					"changelog_added": "คุณสมบัติใหม่",
					"changelog_fixed": "การแก้ไขปัญหา",
					"changelog_improved": "การปรับปรุง",
					"changelog_progress": "ความคืบหน้า",
					"confirm": "คุณแน่ใจไหม?",
					"descending": "จากมากไปน้อย",
					"developer": "ผู้พัฒนา",
					"donate_message": "สนับสนุนฉันสำหรับการอัปเดตเพิ่มเติม!",
					"file_navigator_text": "เรียกดูไฟล์",
					"first": "อันดับแรก",
					"gradient": "ไล่ระดับสี",
					"last": "ล่าสุด",
					"order": "ลำดับ",
					"server": "เซิร์ฟเวอร์",
					"settings_showSupportBadges_description": "แสดงป้ายขนาดเล็กสำหรับผู้ใช้ที่สนับสนุน Patreon ของฉัน",
					"settings_showToasts_description": "แสดงปลั๊กอินเริ่มและหยุดขนมปังปิ้ง",
					"settings_showToasts_note": "ปิดการใช้งานการตั้งค่าทั่วไป '{{var0}}' ของ BD ก่อนปิดใช้งาน",
					"sort_by": "จัดเรียงตาม",
					"toast_plugin_force_updated": "{{var0}} ได้รับการอัปเดตโดยอัตโนมัติเนื่องจากเวอร์ชันของคุณล้าสมัยมาก",
					"toast_plugin_started": "{{var0}} เริ่มแล้ว",
					"toast_plugin_stopped": "{{var0}} หยุดทำงาน",
					"toast_plugin_translated": "แปลเป็น {{var0}}",
					"toast_plugin_update_failed": "ไม่สามารถดาวน์โหลดการอัปเดตสำหรับ {{var0}}",
					"toast_plugin_updated": "{{var0}} {{var1}} ถูกแทนที่ด้วย {{var2}} {{var3}}",
					"update_check": "ตรวจสอบสำหรับการอัพเดต",
					"update_check_complete": "การตรวจสอบการอัปเดตปลั๊กอินเสร็จสมบูรณ์",
					"update_check_complete_outdated": "การตรวจสอบการอัปเดตปลั๊กอินเสร็จสมบูรณ์ - {{var0}} ล้าสมัย!",
					"update_check_info": "ค้นหาเฉพาะการอัปเดตของปลั๊กอินที่รองรับการตรวจสอบการอัปเดต คลิกขวาเพื่อดูรายการปลั๊กอินที่รองรับ (จดทะเบียน≠ล้าสมัย)",
					"update_check_inprocess": "ดำเนินการตรวจสอบการอัปเดตปลั๊กอิน",
					"update_notice_click": "คลิกเพื่ออัพเดท!",
					"update_notice_reload": "โหลดซ้ำเพื่ออัปเดตให้เสร็จสมบูรณ์",
					"update_notice_update": "จำเป็นต้องอัปเดตปลั๊กอินต่อไปนี้: "
				},
				"tr": {
					"add_to": "{{var0}} ekle",
					"ascending": "Artan",
					"changelog_added": "Yeni özellikler",
					"changelog_fixed": "Sorun giderme",
					"changelog_improved": "İyileştirmeler",
					"changelog_progress": "Ilerleme",
					"confirm": "Emin misiniz?",
					"descending": "Azalan",
					"developer": "Geliştirici",
					"donate_message": "Daha fazla güncelleme için beni destekleyin!",
					"file_navigator_text": "Dosyaya Gözat",
					"first": "İlk",
					"gradient": "Gradyan",
					"last": "Son",
					"order": "Sıra",
					"server": "Sunucu",
					"settings_showSupportBadges_description": "Patreon'umu destekleyen kullanıcılar için küçük rozetler gösterir",
					"settings_showToasts_description": "Eklenti başlangıç ​​ve bitiş tostlarını gösterir",
					"settings_showToasts_note": "Devre dışı bırakmadan önce BD'lerin genel ayarını '{{var0}}' devre dışı bırakın",
					"sort_by": "Göre sırala",
					"toast_plugin_force_updated": "Sürümünüz çok eski olduğu için {{var0}} otomatik olarak güncellendi",
					"toast_plugin_started": "{{var0}} başladı",
					"toast_plugin_stopped": "{{var0}} durdu",
					"toast_plugin_translated": "{{var0}} diline çevrildi",
					"toast_plugin_update_failed": "{{var0}} için güncelleme indirilemiyor",
					"toast_plugin_updated": "{{var0}} {{var1}}, {{var2}} {{var3}} ile değiştirildi",
					"update_check": "Güncellemeleri kontrol et",
					"update_check_complete": "Eklenti güncelleme kontrolü tamamlandı",
					"update_check_complete_outdated": "Eklenti güncelleme kontrolü tamamlandı - {{var0}} güncel değil!",
					"update_check_info": "Yalnızca güncelleme kontrolünü destekleyen eklenti güncellemelerini arar. Desteklenen eklentilerin listesi için sağ tıklayın. (Listelenmiş ≠ eski)",
					"update_check_inprocess": "Eklenti güncelleme kontrolü yapıldı",
					"update_notice_click": "Güncellemek için tıklayın!",
					"update_notice_reload": "Güncellemeyi tamamlamak için yeniden yükleyin",
					"update_notice_update": "Aşağıdaki eklentilerin güncellenmesi gerekiyor: "
				},
				"uk": {
					"add_to": "Додати до {{var0}}",
					"ascending": "Висхідний",
					"changelog_added": "Нові можливості",
					"changelog_fixed": "Вирішення проблем",
					"changelog_improved": "Покращення",
					"changelog_progress": "Прогрес",
					"confirm": "Ти впевнений?",
					"descending": "За спаданням",
					"developer": "Розробник",
					"donate_message": "Підтримайте мене, щоб отримати більше оновлень!",
					"file_navigator_text": "Переглянути файл",
					"first": "Спочатку",
					"gradient": "Градієнт",
					"last": "Останній",
					"order": "Послідовність",
					"server": "Сервер",
					"settings_showSupportBadges_description": "Показує невеликі значки для користувачів, які підтримують мій Patreon",
					"settings_showToasts_description": "Показує тости запуску та зупинки плагіна",
					"settings_showToasts_note": "Вимкніть загальне налаштування '{{var0}}' BD, перш ніж їх вимикати",
					"sort_by": "Сортувати за",
					"toast_plugin_force_updated": "{{var0}} було автоматично оновлено, оскільки ваша версія була дуже застарілою",
					"toast_plugin_started": "{{var0}} розпочато",
					"toast_plugin_stopped": "{{var0}} зупинено",
					"toast_plugin_translated": "перекладено на {{var0}}",
					"toast_plugin_update_failed": "Не вдається завантажити оновлення для {{var0}}",
					"toast_plugin_updated": "{{var0}} {{var1}} замінено на {{var2}} {{var3}}",
					"update_check": "Перевірити наявність оновлень",
					"update_check_complete": "Завершено перевірку оновлення плагіна",
					"update_check_complete_outdated": "Завершено перевірку оновлення плагіна - {{var0}} застаріло!",
					"update_check_info": "Шукає лише оновлення плагінів, які підтримують перевірку оновлення. Клацніть правою кнопкою миші, щоб переглянути список підтримуваних плагінів. (Перераховано ≠ застаріло)",
					"update_check_inprocess": "Проводиться перевірка оновлення плагіна",
					"update_notice_click": "Натисніть, щоб оновити!",
					"update_notice_reload": "Перезавантажте, щоб завершити оновлення",
					"update_notice_update": "Потрібно оновити такі плагіни: "
				},
				"vi": {
					"add_to": "Thêm vào {{var0}}",
					"ascending": "Tăng dần",
					"changelog_added": "Các tính năng mới",
					"changelog_fixed": "Xử lý sự cố",
					"changelog_improved": "Cải tiến",
					"changelog_progress": "Phát triển",
					"confirm": "Bạn có chắc không?",
					"descending": "Giảm dần",
					"developer": "Người phát triển",
					"donate_message": "Hỗ trợ tôi để cập nhật thêm!",
					"file_navigator_text": "Chọn thư mục",
					"first": "Đầu tiên",
					"gradient": "Dốc",
					"last": "Cuối cùng",
					"order": "Sự nối tiếp",
					"server": "Người phục vụ",
					"settings_showSupportBadges_description": "Hiển thị các huy hiệu nhỏ cho những người dùng ủng hộ Patreon của tôi",
					"settings_showToasts_description": "Hiển thị plugin bắt đầu và dừng nâng cốc",
					"settings_showToasts_note": "Tắt cài đặt chung '{{var0}}' của BD trước khi tắt chúng",
					"sort_by": "Sắp xếp theo",
					"toast_plugin_force_updated": "{{var0}} đã được cập nhật tự động vì phiên bản của bạn đã rất lỗi thời",
					
