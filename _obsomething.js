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
					"toast_plugin_started": "{{var0}} đã bắt đầu",
					"toast_plugin_stopped": "{{var0}} đã dừng",
					"toast_plugin_translated": "đã dịch sang {{var0}}",
					"toast_plugin_update_failed": "Không thể tải xuống bản cập nhật cho {{var0}}",
					"toast_plugin_updated": "{{var0}} {{var1}} đã được thay thế bằng {{var2}} {{var3}}",
					"update_check": "Kiểm tra cập nhật",
					"update_check_complete": "Đã hoàn tất kiểm tra cập nhật plugin",
					"update_check_complete_outdated": "Đã hoàn tất kiểm tra cập nhật plugin - {{var0}} đã lỗi thời!",
					"update_check_info": "Chỉ tìm kiếm các bản cập nhật của các plugin hỗ trợ kiểm tra bản cập nhật. Nhấp chuột phải để xem danh sách các plugin được hỗ trợ. (Đã liệt kê ≠ lỗi thời)",
					"update_check_inprocess": "Kiểm tra cập nhật plugin được thực hiện",
					"update_notice_click": "Bấm để cập nhật!",
					"update_notice_reload": "Tải lại để hoàn tất cập nhật",
					"update_notice_update": "Các plugin sau cần được cập nhật: "
				},
				"zh": {
					"add_to": "添加到 {{var0}}",
					"ascending": "上升",
					"changelog_added": "新的功能",
					"changelog_fixed": "故障排除",
					"changelog_improved": "改进之处",
					"changelog_progress": "进展",
					"confirm": "你确定吗？",
					"descending": "降序",
					"developer": "开发商",
					"donate_message": "支持我更多更新！",
					"file_navigator_text": "浏览文件",
					"first": "第一",
					"gradient": "梯度",
					"last": "持续",
					"order": "顺序",
					"server": "服务器",
					"settings_showSupportBadges_description": "为支持我的 Patreon 的用户显示小徽章",
					"settings_showToasts_description": "显示插件开始和停止烤面包",
					"settings_showToasts_note": "禁用 BD 的常规设置 '{{var0}}' 之前将其禁用",
					"sort_by": "排序方式",
					"toast_plugin_force_updated": "{{var0}} 已自动更新，因为您的版本已过时",
					"toast_plugin_started": "{{var0}} 已开始",
					"toast_plugin_stopped": "{{var0}} 已停止",
					"toast_plugin_translated": "转换为 {{var0}}",
					"toast_plugin_update_failed": "无法下载 {{var0}} 的更新",
					"toast_plugin_updated": "{{var0}} {{var1}} 已替换为 {{var2}} {{var3}}",
					"update_check": "检查更新",
					"update_check_complete": "插件更新检查完成",
					"update_check_complete_outdated": "插件更新检查已完成 - {{var0}} 已过期！",
					"update_check_info": "仅搜索支持更新检查的插件的更新。右键单击以获取支持的插件列表。 （列出≠作废）",
					"update_check_inprocess": "进行插件更新检查",
					"update_notice_click": "点击更新！",
					"update_notice_reload": "重新加载以完成更新",
					"update_notice_update": "以下插件需要更新： "
				},
				"zh-TW": {
					"add_to": "添加到 {{var0}}",
					"ascending": "上升",
					"changelog_added": "新的功能",
					"changelog_fixed": "故障排除",
					"changelog_improved": "改進之處",
					"changelog_progress": "進展",
					"confirm": "你確定嗎？",
					"descending": "降序",
					"developer": "開發商",
					"donate_message": "支持我更多更新！",
					"file_navigator_text": "瀏覽文件",
					"first": "第一",
					"gradient": "梯度",
					"last": "持續",
					"order": "順序",
					"server": "服務器",
					"settings_showSupportBadges_description": "為支持我的 Patreon 的用戶顯示小徽章",
					"settings_showToasts_description": "顯示插件開始和停止烤麵包",
					"settings_showToasts_note": "禁用 BD 的常規設置 '{{var0}}' 之前將其禁用",
					"sort_by": "排序方式",
					"toast_plugin_force_updated": "{{var0}} 已自動更新，因為您的版本已過時",
					"toast_plugin_started": "{{var0}} 已開始",
					"toast_plugin_stopped": "{{var0}} 已停止",
					"toast_plugin_translated": "轉換為 {{var0}}",
					"toast_plugin_update_failed": "無法下載 {{var0}} 的更新",
					"toast_plugin_updated": "{{var0}} {{var1}} 已替換為 {{var2}} {{var3}}",
					"update_check": "檢查更新",
					"update_check_complete": "插件更新檢查完成",
					"update_check_complete_outdated": "插件更新檢查已完成 - {{var0}} 已過期！",
					"update_check_info": "僅搜索支持更新檢查的插件的更新。右鍵單擊以獲取支持的插件列表。 （列出≠作廢）",
					"update_check_inprocess": "進行插件更新檢查",
					"update_notice_click": "點擊更新！",
					"update_notice_reload": "重新加載以完成更新",
					"update_notice_update": "以下插件需要更新： "
				},
				"default": {
					"add_to": "Add to {{var0}}",
					"ascending": "Ascending",
					"changelog_added": "New Features",
					"changelog_fixed": "Bug Fixes",
					"changelog_improved": "Improvements",
					"changelog_progress": "Progress",
					"confirm": "Are you sure?",
					"descending": "Descending",
					"developer": "Developer",
					"donate_message": "Support me to receive further Updates!",
					"file_navigator_text": "Browse File",
					"first": "First",
					"gradient": "Gradient",
					"last": "Last",
					"order": "Order",
					"server": "Server",
					"settings_showSupportBadges_description": "Shows small Badges for users who support my Patreon",
					"settings_showToasts_description": "Shows Plugin start and stop Toasts",
					"settings_showToasts_note": "Disable BDs general '{{var0}}' setting before disabling this",
					"sort_by": "Sort by",
					"toast_plugin_force_updated": "{{var0}} was automatically updated because your version is heavily outdated",
					"toast_plugin_started": "{{var0}} has been started",
					"toast_plugin_stopped": "{{var0}} has been stopped",
					"toast_plugin_translated": "translated to {{var0}}",
					"toast_plugin_update_failed": "Update for {{var0}} cannot be downloaded",
					"toast_plugin_updated": "{{var0}} {{var1}} has been replaced by {{var2}} {{var3}}",
					"update_check": "Check for Updates",
					"update_check_complete": "Plugin Update Check completed",
					"update_check_complete_outdated": "Plugin Update Check completed - {{var0}} outdated!",
					"update_check_info": "Only searches for updates of Plugins that support the Update Check. Right click for a list of supported Plugins. (Listed ≠ Outdated)",
					"update_check_inprocess": "Plugin Update Check is progress",
					"update_notice_click": "Click to update!",
					"update_notice_reload": "Reload to complete the Update",
					"update_notice_update": "The following Plugins need to be updated: "
				}
			},
			"BDFDB_Patrons": {
				"159762323907543040": {"active": true,		"t3": false,	"custom": false,	"id": "STRIX (A1C)"},
				"363785301195358221": {"active": true,		"t3": false,	"custom": false,	"id": "TRENT (KABEL)"},
				"106938698938978304": {"active": false,		"t3": false,	"custom": false,	"id": "GABRIEL"},
				"174868361040232448": {"active": true,		"t3": false,	"custom": false,	"id": "GIBBU (Ian)"},
				"443943393660239872": {"active": true,		"t3": true,		"custom": false,	"id": "SARGE (PaSh)"},
				"620397524494057513": {"active": true,		"t3": true,		"custom": false,	"id": "FUSL"},
				"562008872467038230": {"active": false,		"t3": true,		"custom": true,		"id": "BEAUDEN"}
			}
		}
			
				BDFDB.ObserverUtils = {};
				BDFDB.ObserverUtils.connect = function (plugin, eleOrSelec, observer, config = {childList: true}) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !eleOrSelec || !observer) return;
					if (BDFDB.ObjectUtils.isEmpty(plugin.observers)) plugin.observers = {};
					if (!BDFDB.ArrayUtils.is(plugin.observers[observer.name])) plugin.observers[observer.name] = [];
					if (!observer.multi) for (let subinstance of plugin.observers[observer.name]) subinstance.disconnect();
					if (observer.instance) plugin.observers[observer.name].push(observer.instance);
					let instance = plugin.observers[observer.name][plugin.observers[observer.name].length - 1];
					if (instance) {
						let node = Node.prototype.isPrototypeOf(eleOrSelec) ? eleOrSelec : typeof eleOrSelec === "string" ? document.querySelector(eleOrSelec) : null;
						if (node) instance.observe(node, config);
					}
				};
				BDFDB.ObserverUtils.disconnect = function (plugin, observer) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (BDFDB.ObjectUtils.is(plugin) && !BDFDB.ObjectUtils.isEmpty(plugin.observers)) {
						let observername = typeof observer == "string" ? observer : (BDFDB.ObjectUtils.is(observer) ? observer.name : null);
						if (!observername) {
							for (let observer in plugin.observers) for (let instance of plugin.observers[observer]) instance.disconnect();
							delete plugin.observers;
						}
						else if (!BDFDB.ArrayUtils.is(plugin.observers[observername])) {
							for (let instance of plugin.observers[observername]) instance.disconnect();
							delete plugin.observers[observername];
						}
					}
				};

				BDFDB.StoreChangeUtils = {};
				BDFDB.StoreChangeUtils.add = function (plugin, store, callback) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(store) || typeof store.addChangeListener != "function" ||  typeof callback != "function") return;
					BDFDB.StoreChangeUtils.remove(plugin, store, callback);
					if (!BDFDB.ArrayUtils.is(plugin.changeListeners)) plugin.changeListeners = [];
					plugin.changeListeners.push({store, callback});
					store.addChangeListener(callback);
				};
				BDFDB.StoreChangeUtils.remove = function (plugin, store, callback) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.changeListeners)) return;
					if (!store) {
						while (plugin.changeListeners.length) {
							let listener = plugin.changeListeners.pop();
							listener.store.removeChangeListener(listener.callback);
						}
					}
					else if (BDFDB.ObjectUtils.is(store) && typeof store.addChangeListener == "function") {
						if (!callback) {
							for (let listener of plugin.changeListeners) {
								let removedListeners = [];
								if (listener.store == store) {
									listener.store.removeChangeListener(listener.callback);
									removedListeners.push(listener);
								}
								if (removedListeners.length) plugin.changeListeners = plugin.changeListeners.filter(listener => !removedListeners.includes(listener));
							}
						}
						else if (typeof callback == "function") {
							store.removeChangeListener(callback);
							plugin.changeListeners = plugin.changeListeners.filter(listener => listener.store == store && listener.callback == callback);
						}
					}
				};

				var pressedKeys = [], mousePosition;
				BDFDB.ListenerUtils = {};
				BDFDB.ListenerUtils.isPressed = function (key) {
					return pressedKeys.includes(key);
				};
				BDFDB.ListenerUtils.getPosition = function (key) {
					return mousePosition;
				};
				BDFDB.ListenerUtils.add = function (plugin, ele, actions, selectorOrCallback, callbackOrNothing) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || (!Node.prototype.isPrototypeOf(ele) && ele !== window) || !actions) return;
					let callbackIs4th = typeof selectorOrCallback == "function";
					let selector = callbackIs4th ? undefined : selectorOrCallback;
					let callback = callbackIs4th ? selectorOrCallback : callbackOrNothing;
					if (typeof callback != "function") return;
					BDFDB.ListenerUtils.remove(plugin, ele, actions, selector);
					for (let action of actions.split(" ")) {
						action = action.split(".");
						let eventName = action.shift().toLowerCase();
						if (!eventName) return;
						let origEventName = eventName;
						eventName = eventName == "mouseenter" || eventName == "mouseleave" ? "mouseover" : eventName;
						let namespace = (action.join(".") || "") + plugin.name;
						if (!BDFDB.ArrayUtils.is(plugin.eventListeners)) plugin.eventListeners = [];
						let eventCallback = null;
						if (selector) {
							if (origEventName == "mouseenter" || origEventName == "mouseleave") {
								eventCallback = e => {
									for (let child of e.path) if (typeof child.matches == "function" && child.matches(selector) && !child[namespace + "BDFDB" + origEventName]) {
										child[namespace + "BDFDB" + origEventName] = true;
										if (origEventName == "mouseenter") callback(BDFDB.ListenerUtils.copyEvent(e, child));
										let mouseOut = e2 => {
											if (e2.target.contains(child) || e2.target == child || !child.contains(e2.target)) {
												if (origEventName == "mouseleave") callback(BDFDB.ListenerUtils.copyEvent(e, child));
												delete child[namespace + "BDFDB" + origEventName];
												document.removeEventListener("mouseout", mouseOut);
											}
										};
										document.addEventListener("mouseout", mouseOut);
										break;
									}
								};
							}
							else {
								eventCallback = e => {
									for (let child of e.path) if (typeof child.matches == "function" && child.matches(selector)) {
										callback(BDFDB.ListenerUtils.copyEvent(e, child));
										break;
									}
								};
							}
						}
						else eventCallback = e => {callback(BDFDB.ListenerUtils.copyEvent(e, ele));};

						plugin.eventListeners.push({ele, eventName, origEventName, namespace, selector, eventCallback});
						ele.addEventListener(eventName, eventCallback, true);
					}
				};
				BDFDB.ListenerUtils.remove = function (plugin, ele, actions = "", selector) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.eventListeners)) return;
					if (!ele) {
						while (plugin.eventListeners.length) {
							let listener = plugin.eventListeners.pop();
							listener.ele.removeEventListener(listener.eventName, listener.eventCallback, true);
						}
					}
					else if (Node.prototype.isPrototypeOf(ele) || ele === window) {
						for (let action of actions.split(" ")) {
							action = action.split(".");
							let eventName = action.shift().toLowerCase();
							let namespace = (action.join(".") || "") + plugin.name;
							for (let listener of plugin.eventListeners) {
								let removedListeners = [];
								if (listener.ele == ele && (!eventName || listener.origEventName == eventName) && listener.namespace == namespace && (selector === undefined || listener.selector == selector)) {
									listener.ele.removeEventListener(listener.eventName, listener.eventCallback, true);
									removedListeners.push(listener);
								}
								if (removedListeners.length) plugin.eventListeners = plugin.eventListeners.filter(listener => !removedListeners.includes(listener));
							}
						}
					}
				};
				BDFDB.ListenerUtils.multiAdd = function (node, actions, callback) {
					if (!Node.prototype.isPrototypeOf(node) || !actions || typeof callback != "function") return;
					for (let action of actions.trim().split(" ").filter(n => n)) node.addEventListener(action, callback, true);
				};
				BDFDB.ListenerUtils.multiRemove = function (node, actions, callback) {
					if (!Node.prototype.isPrototypeOf(node) || !actions || typeof callback != "function") return;
					for (let action of actions.trim().split(" ").filter(n => n)) node.removeEventListener(action, callback, true);
				};
				BDFDB.ListenerUtils.addToChildren = function (node, actions, selector, callback) {
					if (!Node.prototype.isPrototypeOf(node) || !actions || !selector || !selector.trim() || typeof callback != "function") return;
					for (let action of actions.trim().split(" ").filter(n => n)) {
						let eventCallback = callback;
						if (action == "mouseenter" || action == "mouseleave") eventCallback = e => {if (e.target.matches(selector)) callback(e);};
						node.querySelectorAll(selector.trim()).forEach(child => {child.addEventListener(action, eventCallback, true);});
					}
				};
				BDFDB.ListenerUtils.copyEvent = function (e, ele) {
					if (!e || !e.constructor || !e.type) return e;
					let eCopy = new e.constructor(e.type, e);
					Object.defineProperty(eCopy, "originalEvent", {value: e});
					Object.defineProperty(eCopy, "which", {value: e.which});
					Object.defineProperty(eCopy, "keyCode", {value: e.keyCode});
					Object.defineProperty(eCopy, "path", {value: e.path});
					Object.defineProperty(eCopy, "relatedTarget", {value: e.relatedTarget});
					Object.defineProperty(eCopy, "srcElement", {value: e.srcElement});
					Object.defineProperty(eCopy, "target", {value: e.target});
					Object.defineProperty(eCopy, "toElement", {value: e.toElement});
					if (ele) Object.defineProperty(eCopy, "currentTarget", {value: ele});
					return eCopy;
				};
				BDFDB.ListenerUtils.stopEvent = function (e) {
					if (BDFDB.ObjectUtils.is(e)) {
						if (typeof e.preventDefault == "function") e.preventDefault();
						if (typeof e.stopPropagation == "function") e.stopPropagation();
						if (typeof e.stopImmediatePropagation == "function") e.stopImmediatePropagation();
						if (BDFDB.ObjectUtils.is(e.originalEvent)) {
							if (typeof e.originalEvent.preventDefault == "function") e.originalEvent.preventDefault();
							if (typeof e.originalEvent.stopPropagation == "function") e.originalEvent.stopPropagation();
							if (typeof e.originalEvent.stopImmediatePropagation == "function") e.originalEvent.stopImmediatePropagation();
						}
					}
				};
			
				var NotificationBars = [], DesktopNotificationQueue = {queue: [], running: false};
				BDFDB.NotificationUtils = {};
				BDFDB.NotificationUtils.toast = function (text, options = {}) {
					let toasts = document.querySelector(".toasts, .bd-toasts");
					if (!toasts) {
						let channels = document.querySelector(BDFDB.dotCN.channels + " + div");
						let channelRects = channels ? BDFDB.DOMUtils.getRects(channels) : null;
						let members = channels ? channels.querySelector(BDFDB.dotCN.memberswrap) : null;
						let left = channelRects ? channelRects.left : 310;
						let width = channelRects ? (members ? channelRects.width - BDFDB.DOMUtils.getRects(members).width : channelRects.width) : window.outerWidth - 0;
						let form = channels ? channels.querySelector("form") : null;
						let bottom = form ? BDFDB.DOMUtils.getRects(form).height : 80;
						toasts = BDFDB.DOMUtils.create(`<div class="toasts bd-toasts" style="width: ${width}px; left: ${left}px; bottom: ${bottom}px;"></div>`);
						(document.querySelector(BDFDB.dotCN.app) || document.body).appendChild(toasts);
					}
					const {type = "", icon = true, timeout = 3000, html = false, selector = "", nopointer = false, color = ""} = options;
					let toast = BDFDB.DOMUtils.create(`<div class="toast bd-toast">${html === true ? text : BDFDB.StringUtils.htmlEscape(text)}</div>`);
					if (type) {
						BDFDB.DOMUtils.addClass(toast, "toast-" + type);
						if (icon) BDFDB.DOMUtils.addClass(toast, "icon");
					}
					else if (color) {
						let rgbColor = BDFDB.ColorUtils.convert(color, "RGB");
						if (rgbColor) {
							toast.style.setProperty("background-color", rgbColor);
							BDFDB.DOMUtils.addClass(toast, "toast-custom");
						}
					}
					BDFDB.DOMUtils.addClass(toast, selector);
					toasts.appendChild(toast);
					toast.close = _ => {
						if (document.contains(toast)) {
							BDFDB.DOMUtils.addClass(toast, "closing");
							toast.style.setProperty("pointer-events", "none", "important");
							BDFDB.TimeUtils.timeout(_ => {
								toast.remove();
								if (!toasts.querySelectorAll(".toast, .bd-toast").length) toasts.remove();
							}, 3000);
						}
					};
					if (nopointer) toast.style.setProperty("pointer-events", "none", "important");
					else toast.addEventListener("click", toast.close);
					BDFDB.TimeUtils.timeout(_ => {toast.close();}, timeout > 0 ? timeout : 600000);
					return toast;
				};
				BDFDB.NotificationUtils.desktop = function (parsedcontent, parsedoptions = {}) {
					const queue = _ => {
						DesktopNotificationQueue.queue.push({parsedcontent, parsedoptions});
						runqueue();
					};
					const runqueue = _ => {
						if (!DesktopNotificationQueue.running) {
							let notification = DesktopNotificationQueue.queue.shift();
							if (notification) notify(notification.parsedcontent, notification.parsedoptions);
						}
					};
					const notify = (content, options) => {
						DesktopNotificationQueue.running = true;
						let muted = options.silent;
						options.silent = options.silent || options.sound ? true : false;
						let notification = new Notification(content, options);
						let audio = new Audio();
						let timeout = BDFDB.TimeUtils.timeout(_ => {close();}, options.timeout ? options.timeout : 3000);
						if (typeof options.click == "function") notification.onclick = _ => {
							BDFDB.TimeUtils.clear(timeout);
							close();
							options.click();
						};
						if (!muted && options.sound) {
							audio.src = options.sound;
							audio.play();
						}
						const close = _ => {
							audio.pause();
							notification.close();
							DesktopNotificationQueue.running = false;
							BDFDB.TimeUtils.timeout(_ => {runqueue();}, 1000);
						};
					};
					if (!("Notification" in window)) {}
					else if (Notification.permission === "granted") queue();
					else if (Notification.permission !== "denied") Notification.requestPermission(function (response) {if (response === "granted") queue();});
				};
				BDFDB.NotificationUtils.notice = function (text, options = {}) {
					if (!text) return;
					let layers = document.querySelector(BDFDB.dotCN.layers) || document.querySelector(BDFDB.dotCN.appmount);
					if (!layers) return;
					let id = BDFDB.NumberUtils.generateId(NotificationBars);
					let notice = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCNS.notice + BDFDB.disCN.noticewrapper}" notice-id="${id}"><div class="${BDFDB.disCN.noticedismiss}" style="width: 36px !important; height: 36px !important; position: absolute !important; top: 0 !important; right: 0 !important; left: unset !important;"></div><span class="notice-message"></span></div>`);
					layers.parentElement.insertBefore(notice, layers);
					let noticeMessage = notice.querySelector(".notice-message");
					if (options.platform) for (let platform of options.platform.split(" ")) if (DiscordClasses["noticeicon" + platform]) {
						let icon = BDFDB.DOMUtils.create(`<i class="${BDFDB.disCN["noticeicon" + platform]}"></i>`);
						BDFDB.DOMUtils.addClass(icon, BDFDB.disCN.noticeplatformicon);
						BDFDB.DOMUtils.removeClass(icon, BDFDB.disCN.noticeicon);
						notice.insertBefore(icon, noticeMessage);
					}
					if (options.customicon) {
						let iconinner = BDFDB.DOMUtils.create(options.customicon)
						let icon = BDFDB.DOMUtils.create(`<i></i>`);
						if (iconinner.tagName == "span" && !iconinner.firstElementChild) icon.style.setProperty("background", `url(${options.customicon}) center/cover no-repeat`);
						else icon.appendChild(iconinner);
						BDFDB.DOMUtils.addClass(icon, BDFDB.disCN.noticeplatformicon);
						BDFDB.DOMUtils.removeClass(icon, BDFDB.disCN.noticeicon);
						notice.insertBefore(icon, noticeMessage);
					}
					if (options.btn || options.button) notice.appendChild(BDFDB.DOMUtils.create(`<button class="${BDFDB.disCN.noticebutton}">${options.btn || options.button}</button>`));
					if (options.id) notice.id = options.id.split(" ").join("");
					if (options.selector) BDFDB.DOMUtils.addClass(notice, options.selector);
					if (options.css) BDFDB.DOMUtils.appendLocalStyle("BDFDBcustomNotificationBar" + id, options.css);
					if (options.style) notice.style = options.style;
					if (options.html === true) noticeMessage.innerHTML = text;
					else {
						let link = document.createElement("a");
						let newText = [];
						for (let word of text.split(" ")) {
							let encodedWord = BDFDB.StringUtils.htmlEscape(word);
							link.href = word;
							newText.push(link.host && link.host !== window.location.host ? `<label class="${BDFDB.disCN.noticetextlink}">${encodedWord}</label>` : encodedWord);
						}
						noticeMessage.innerHTML = newText.join(" ");
					}
					let type = null;
					if (options.type && !document.querySelector(BDFDB.dotCNS.chatbase + BDFDB.dotCN.noticestreamer)) {
						if (type = BDFDB.disCN["notice" + options.type]) BDFDB.DOMUtils.addClass(notice, type);
						if (options.type == "premium") {
							let noticeButton = notice.querySelector(BDFDB.dotCN.noticebutton);
							if (noticeButton) BDFDB.DOMUtils.addClass(noticeButton, BDFDB.disCN.noticepremiumaction);
							BDFDB.DOMUtils.addClass(noticeMessage, BDFDB.disCN.noticepremiumtext);
							notice.insertBefore(BDFDB.DOMUtils.create(`<i class="${BDFDB.disCN.noticepremiumlogo}"></i>`), noticeMessage);
						}
					}
					if (!type) {
						let comp = BDFDB.ColorUtils.convert(options.color, "RGBCOMP");
						if (comp) {
							let fontColor = comp[0] > 180 && comp[1] > 180 && comp[2] > 180 ? "#000" : "#FFF";
							let backgroundcolor = BDFDB.ColorUtils.convert(comp, "HEX");
							let filter = comp[0] > 180 && comp[1] > 180 && comp[2] > 180 ? "brightness(0%)" : "brightness(100%)";
							BDFDB.DOMUtils.appendLocalStyle("BDFDBcustomNotificationBarColorCorrection" + id, `${BDFDB.dotCN.noticewrapper}[notice-id="${id}"]{background-color: ${backgroundcolor} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] .notice-message {color: ${fontColor} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] ${BDFDB.dotCN.noticebutton} {color: ${fontColor} !important;border-color: ${BDFDB.ColorUtils.setAlpha(fontColor, 0.25, "RGBA")} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] ${BDFDB.dotCN.noticebutton}:hover {color: ${backgroundcolor} !important;background-color: ${fontColor} !important;}${BDFDB.dotCN.noticewrapper}[notice-id="${id}"] ${BDFDB.dotCN.noticedismiss} {filter: ${filter} !important;}`);
						}
						else BDFDB.DOMUtils.addClass(notice, BDFDB.disCN.noticedefault);
					}
					notice.style.setProperty("height", "36px", "important");
					notice.style.setProperty("min-width", "70vw", "important");
					notice.style.setProperty("left", "unset", "important");
					notice.style.setProperty("right", "unset", "important");
					let sideMargin = ((BDFDB.DOMUtils.getWidth(document.body.firstElementChild) - BDFDB.DOMUtils.getWidth(notice))/2);
					notice.style.setProperty("left", `${sideMargin}px`, "important");
					notice.style.setProperty("right", `${sideMargin}px`, "important");
					notice.style.setProperty("min-width", "unset", "important");
					notice.style.setProperty("width", "unset", "important");
					notice.style.setProperty("max-width", `calc(100vw - ${sideMargin*2}px)`, "important");
					notice.querySelector(BDFDB.dotCN.noticedismiss).addEventListener("click", _ => {
						notice.style.setProperty("overflow", "hidden", "important");
						notice.style.setProperty("height", "0px", "important");
						if (notice.tooltip && typeof notice.tooltip.removeTooltip == "function") notice.tooltip.removeTooltip();
						BDFDB.TimeUtils.timeout(_ => {
							if (typeof options.onClose == "function") options.onClose();
							BDFDB.ArrayUtils.remove(NotificationBars, id);
							BDFDB.DOMUtils.removeLocalStyle("BDFDBcustomNotificationBar" + id);
							BDFDB.DOMUtils.removeLocalStyle("BDFDBcustomNotificationBarColorCorrection" + id);
							BDFDB.DOMUtils.remove(notice);
						}, 500);
					});
					return notice;
				};
				BDFDB.NotificationUtils.alert = function (header, body) {
					if (typeof header == "string" && typeof header == "string" && window.BdApi && typeof BdApi.alert == "function") BdApi.alert(header, body);
				};

				var Tooltips = [];
				BDFDB.TooltipUtils = {};
				BDFDB.TooltipUtils.create = function (anker, text, options = {}) {
					let itemLayerContainer = document.querySelector(BDFDB.dotCN.appmount +  " > " + BDFDB.dotCN.itemlayercontainer);
					if (!itemLayerContainer || !Node.prototype.isPrototypeOf(anker) || !document.contains(anker)) return null;
					text = typeof text == "function" ? text() : text;
					if (typeof text != "string" && !BDFDB.ReactUtils.isValidElement(text) && !BDFDB.ObjectUtils.is(options.guild)) return null;
					let id = BDFDB.NumberUtils.generateId(Tooltips);
					let zIndexed = typeof options.zIndex == "number";
					let itemLayer = BDFDB.DOMUtils.create(`<div class="${BDFDB.disCNS.itemlayer + BDFDB.disCN.itemlayerdisabledpointerevents}"><div class="${BDFDB.disCN.tooltip}" tooltip-id="${id}"><div class="${BDFDB.disCN.tooltippointer}"></div><div class="${BDFDB.disCN.tooltipcontent}"></div></div></div>`);
					if (zIndexed) {
						let itemLayerContainerClone = itemLayerContainer.cloneNode();
						itemLayerContainerClone.style.setProperty("z-index", options.zIndex || 1002, "important");
						itemLayerContainer.parentElement.insertBefore(itemLayerContainerClone, itemLayerContainer.nextElementSibling);
						itemLayerContainer = itemLayerContainerClone;
					}
					itemLayerContainer.appendChild(itemLayer);
					
					let tooltip = itemLayer.firstElementChild;
					let tooltipContent = itemLayer.querySelector(BDFDB.dotCN.tooltipcontent);
					let tooltipPointer = itemLayer.querySelector(BDFDB.dotCN.tooltippointer);
					
					if (options.id) tooltip.id = options.id.split(" ").join("");
					
					if (typeof options.type != "string" || !BDFDB.disCN["tooltip" + options.type.toLowerCase()]) options.type = "top";
					let type = options.type.toLowerCase();
					BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN["tooltip" + type], options.className, options.selector);
					
					let fontColorIsGradient = false, customBackgroundColor = false, style = "";
					if (options.style) style += options.style;
					if (options.fontColor) {
						fontColorIsGradient = BDFDB.ObjectUtils.is(options.fontColor);
						if (!fontColorIsGradient) style = (style ? (style + " ") : "") + `color: ${BDFDB.ColorUtils.convert(options.fontColor, "RGBA")} !important;`
					}
					if (options.backgroundColor) {
						customBackgroundColor = true;
						let backgroundColorIsGradient = BDFDB.ObjectUtils.is(options.backgroundColor);
						let backgroundColor = !backgroundColorIsGradient ? BDFDB.ColorUtils.convert(options.backgroundColor, "RGBA") : BDFDB.ColorUtils.createGradient(options.backgroundColor);
						style = (style ? (style + " ") : "") + `background: ${backgroundColor} !important; border-color: ${backgroundColorIsGradient ? BDFDB.ColorUtils.convert(options.backgroundColor[type == "left" ? 100 : 0], "RGBA") : backgroundColor} !important;`;
					}
					if (style) tooltip.style = style;
					if (zIndexed) {
						itemLayer.style.setProperty("z-index", options.zIndex || 1002, "important");
						tooltip.style.setProperty("z-index", options.zIndex || 1002, "important");
						tooltipContent.style.setProperty("z-index", options.zIndex || 1002, "important");
					}
					if (typeof options.width == "number" && options.width > 196) {
						tooltip.style.setProperty("width", `${options.width}px`, "important");
						tooltip.style.setProperty("max-width", `${options.width}px`, "important");
					}
					if (typeof options.maxWidth == "number" && options.maxWidth > 196) {
						tooltip.style.setProperty("max-width", `${options.maxWidth}px`, "important");
					}
					if (customBackgroundColor) BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN.tooltipcustom);
					else if (options.color && BDFDB.disCN["tooltip" + options.color.toLowerCase()]) BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN["tooltip" + options.color.toLowerCase()]);
					else BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN.tooltipblack);
					
					if (options.list || BDFDB.ObjectUtils.is(options.guild)) BDFDB.DOMUtils.addClass(tooltip, BDFDB.disCN.tooltiplistitem);

					let mouseMove = e => {
						let parent = e.target.parentElement.querySelector(":hover");
						if (parent && anker != parent && !anker.contains(parent)) itemLayer.removeTooltip();
					};
					let mouseLeave = e => {itemLayer.removeTooltip();};
					if (!options.perssist) {
						document.addEventListener("mousemove", mouseMove);
						document.addEventListener("mouseleave", mouseLeave);
					}
					
					let observer = new MutationObserver(changes => changes.forEach(change => {
						let nodes = Array.from(change.removedNodes);
						if (nodes.indexOf(itemLayer) > -1 || nodes.indexOf(anker) > -1 || nodes.some(n => n.contains(anker))) itemLayer.removeTooltip();
					}));
					observer.observe(document.body, {subtree: true, childList: true});
					
					(tooltip.setText = itemLayer.setText = newText => {
						if (BDFDB.ObjectUtils.is(options.guild)) {
							let streamOwnerIds = LibraryModules.StreamUtils.getAllApplicationStreams().filter(app => app.guildId === options.guild.id).map(app => app.ownerId) || [];
							let streamOwners = streamOwnerIds.map(ownerId => LibraryModules.UserStore.getUser(ownerId)).filter(n => n);
							let connectedUsers = Object.keys(LibraryModules.VoiceUtils.getVoiceStates(options.guild.id)).map(userId => !streamOwnerIds.includes(userId) && BDFDB.LibraryModules.UserStore.getUser(userId)).filter(n => n);
							let tooltipText = options.guild.toString();
							if (fontColorIsGradient) tooltipText = `<span style="pointer-events: none; -webkit-background-clip: text !important; color: transparent !important; background-image: ${BDFDB.ColorUtils.createGradient(options.fontColor)} !important;">${BDFDB.StringUtils.htmlEscape(tooltipText)}</span>`;
							BDFDB.ReactUtils.render(BDFDB.ReactUtils.createElement(BDFDB.ReactUtils.Fragment, {
								children: [
									BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltiprow, BDFDB.disCN.tooltiprowguildname),
										children: [
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.GuildComponents.Badge, {
												guild: options.guild,
												size: LibraryModules.StringUtils.cssValueToNumber(DiscordClassModules.TooltipGuild.iconSize),
												className: BDFDB.disCN.tooltiprowicon
											}),
											BDFDB.ReactUtils.createElement("span", {
												className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltipguildnametext, (connectedUsers.length || streamOwners.length) && BDFDB.disCN.tooltipguildnametextlimitedsize),
												children: fontColorIsGradient || options.html ? BDFDB.ReactUtils.elementToReact(BDFDB.DOMUtils.create(tooltipText)) : tooltipText
											}),
										]
									}),
									newText && BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tooltiprow, BDFDB.disCN.tooltiprowextra),
										children: newText
									}),
									connectedUsers.length && BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN.tooltiprow,
										children: [
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
												name: InternalComponents.LibraryComponents.SvgIcon.Names.SPEAKER,
												className: BDFDB.disCN.tooltipactivityicon
											}),
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.UserSummaryItem, {
												users: connectedUsers,
												max: 6
											})
										]
									}),
									streamOwners.length && BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN.tooltiprow,
										children: [
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
												name: InternalComponents.LibraryComponents.SvgIcon.Names.STREAM,
												className: BDFDB.disCN.tooltipactivityicon
											}),
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.UserSummaryItem, {
												users: streamOwners,
												max: 6
											})
										]
									})
								].filter(n => n)
							}), tooltipContent);
						}
						else {
							if (fontColorIsGradient) tooltipContent.innerHTML = `<span style="pointer-events: none; -webkit-background-clip: text !important; color: transparent !important; background-image: ${BDFDB.ColorUtils.createGradient(options.fontColor)} !important;">${BDFDB.StringUtils.htmlEscape(newText)}</span>`;
							else if (options.html === true) tooltipContent.innerHTML = newText;
							else tooltipContent.innerText = newText;
						}
					})(text);
					(tooltip.removeTooltip = itemLayer.removeTooltip = _ => {
						document.removeEventListener("mousemove", mouseMove);
						document.removeEventListener("mouseleave", mouseLeave);
						BDFDB.DOMUtils.remove(itemLayer);
						BDFDB.ArrayUtils.remove(Tooltips, id);
						observer.disconnect();
						if (zIndexed) BDFDB.DOMUtils.remove(itemLayerContainer);
						if (typeof options.onHide == "function") options.onHide(itemLayer, anker);
					});
					(tooltip.update = itemLayer.update = newText => {
						if (newText) tooltip.setText(newText);
						let left, top;
						const tRects = BDFDB.DOMUtils.getRects(anker);
						const iRects = BDFDB.DOMUtils.getRects(itemLayer);
						const aRects = BDFDB.DOMUtils.getRects(document.querySelector(BDFDB.dotCN.appmount));
						const positionOffsets = {height: 10, width: 10};
						const offset = typeof options.offset == "number" ? options.offset : 0;
						switch (type) {
							case "top":
								top = tRects.top - iRects.height - positionOffsets.height + 2 - offset;
								left = tRects.left + (tRects.width - iRects.width) / 2;
								break;
							case "bottom":
								top = tRects.top + tRects.height + positionOffsets.height - 2 + offset;
								left = tRects.left + (tRects.width - iRects.width) / 2;
								break;
							case "left":
								top = tRects.top + (tRects.height - iRects.height) / 2;
								left = tRects.left - iRects.width - positionOffsets.width + 2 - offset;
								break;
							case "right":
								top = tRects.top + (tRects.height - iRects.height) / 2;
								left = tRects.left + tRects.width + positionOffsets.width - 2 + offset;
								break;
							}
							
						itemLayer.style.setProperty("top", `${top}px`, "important");
						itemLayer.style.setProperty("left", `${left}px`, "important");
						
						tooltipPointer.style.removeProperty("margin-left");
						tooltipPointer.style.removeProperty("margin-top");
						if (type == "top" || type == "bottom") {
							if (left < 0) {
								itemLayer.style.setProperty("left", "5px", "important");
								tooltipPointer.style.setProperty("margin-left", `${left - 10}px`, "important");
							}
							else {
								const rightMargin = aRects.width - (left + iRects.width);
								if (rightMargin < 0) {
									itemLayer.style.setProperty("left", `${aRects.width - iRects.width - 5}px`, "important");
									tooltipPointer.style.setProperty("margin-left", `${-1*rightMargin}px`, "important");
								}
							}
						}
						else if (type == "left" || type == "right") {
							if (top < 0) {
								const bRects = BDFDB.DOMUtils.getRects(document.querySelector(BDFDB.dotCN.titlebar));
								const barCorrection = (bRects.width || 0) >= Math.round(75 * window.outerWidth / aRects.width) ? (bRects.height + 5) : 0;
								itemLayer.style.setProperty("top", `${5 + barCorrection}px`, "important");
								tooltipPointer.style.setProperty("margin-top", `${top - 10 - barCorrection}px`, "important");
							}
							else {
								const bottomMargin = aRects.height - (top + iRects.height);
								if (bottomMargin < 0) {
									itemLayer.style.setProperty("top", `${aRects.height - iRects.height - 5}px`, "important");
									tooltipPointer.style.setProperty("margin-top", `${-1*bottomMargin}px`, "important");
								}
							}
						}
					})();
					
					if (options.delay) {
						BDFDB.DOMUtils.toggle(itemLayer);
						BDFDB.TimeUtils.timeout(_ => {
							BDFDB.DOMUtils.toggle(itemLayer);
							if (typeof options.onShow == "function") options.onShow(itemLayer, anker);
						}, options.delay);
					}
					else {
						if (typeof options.onShow == "function") options.onShow(itemLayer, anker);
					}
					return itemLayer;
				};
				
				InternalBDFDB.findModule = function (type, cachestring, filter, getExport) {
					if (!BDFDB.ObjectUtils.is(Cache.modules[type])) Cache.modules[type] = {module: {}, export: {}};
					if (getExport && Cache.modules[type].export[cachestring]) return Cache.modules[type].export[cachestring];
					else if (!getExport && Cache.modules[type].module[cachestring]) return Cache.modules[type].module[cachestring];
					else {
						let m = BDFDB.ModuleUtils.find(filter, getExport);
						if (m) {
							if (getExport) Cache.modules[type].export[cachestring] = m;
							else Cache.modules[type].module[cachestring] = m;
							return m;
						}
						else BDFDB.LogUtils.warn(`${cachestring} [${type}] not found in WebModules`);
					}
				};
				InternalBDFDB.getWebModuleReq = function () {
					if (!InternalBDFDB.getWebModuleReq.req) {
						const id = "BDFDB-WebModules";
						const req = window.webpackJsonp.push([[], {[id]: (module, exports, req) => module.exports = req}, [[id]]]);
						delete req.m[id];
						delete req.c[id];
						InternalBDFDB.getWebModuleReq.req = req;
					}
					return InternalBDFDB.getWebModuleReq.req;
				};
				BDFDB.ModuleUtils = {};
				BDFDB.ModuleUtils.find = BDV2.WebpackModules.find
				BDFDB.ModuleUtils.findByProperties = function (...properties) {
					properties = properties.flat(10);
					let getExport = properties.pop();
					if (typeof getExport != "boolean") {
						properties.push(getExport);
						getExport = true;
					}
					return InternalBDFDB.findModule("prop", JSON.stringify(properties), m => properties.every(prop => m[prop] !== undefined), getExport);
				};
				BDFDB.ModuleUtils.findByName = function (name, getExport) {
					return InternalBDFDB.findModule("name", JSON.stringify(name), m => m.displayName === name || m.render && m.render.displayName === name, typeof getExport != "boolean" ? true : getExport);
				};
				BDFDB.ModuleUtils.findByString = function (...strings) {
					strings = strings.flat(10);
					let getExport = strings.pop();
					if (typeof getExport != "boolean") {
						strings.push(getExport);
						getExport = true;
					}
					return InternalBDFDB.findModule("string", JSON.stringify(strings), m => strings.every(string => typeof m == "function" && (m.toString().indexOf(string) > -1 || typeof m.__originalMethod == "function" && m.__originalMethod.toString().indexOf(string) > -1 || typeof m.__originalFunction == "function" && m.__originalFunction.toString().indexOf(string) > -1) || BDFDB.ObjectUtils.is(m) && typeof m.type == "function" && m.type.toString().indexOf(string) > -1), getExport);
				};
				BDFDB.ModuleUtils.findByPrototypes = BdApi.findModuleByProps
				
				InternalBDFDB.forceInitiateProcess = function (pluginDataObjs, instance, type) {
					pluginDataObjs = [pluginDataObjs].flat(10).filter(n => n);
					if (pluginDataObjs.length && instance && type) {
						let forceRender = false;
						for (let pluginData of pluginDataObjs) {
							let plugin = pluginData.plugin == BDFDB && InternalBDFDB || pluginData.plugin, methodNames = [];
							for (let patchType in plugin.patchedModules) {
								if (plugin.patchedModules[patchType][type]) methodNames.push(plugin.patchedModules[patchType][type]);
							}
							methodNames = BDFDB.ArrayUtils.removeCopies(methodNames).flat(10).filter(n => n);
							if (methodNames.includes("componentDidMount")) InternalBDFDB.initiateProcess(plugin, type, {
								instance: instance,
								methodname: "componentDidMount",
								patchtypes: pluginData.patchTypes[type]
							});
							if (methodNames.includes("render")) forceRender = true;
							else if (!forceRender && methodNames.includes("componentDidUpdate")) InternalBDFDB.initiateProcess(plugin, type, {
								instance: instance,
								methodname: "componentDidUpdate",
								patchtypes: pluginData.patchTypes[type]
							});
						}
						if (forceRender) BDFDB.ReactUtils.forceUpdate(instance);
					}
				};
				InternalBDFDB.initiateProcess = function (plugin, type, e) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (BDFDB.ObjectUtils.is(plugin) && !plugin.stopping && e.instance) {
						type = LibraryModules.StringUtils.upperCaseFirstChar(type.split(" _ _ ")[1] || type).replace(/[^A-z0-9]|_/g, "");
						if (typeof plugin[`process${type}`] == "function") {
							if (typeof e.methodname == "string" && (e.methodname.indexOf("componentDid") == 0 || e.methodname.indexOf("componentWill") == 0)) {
								e.node = BDFDB.ReactUtils.findDOMNode(e.instance);
								if (e.node) return plugin[`process${type}`](e);
								else BDFDB.TimeUtils.timeout(_ => {
									e.node = BDFDB.ReactUtils.findDOMNode(e.instance);
									if (e.node) return plugin[`process${type}`](e);
								});
							}
							else if (e.returnvalue || e.patchtypes.includes("before")) return plugin[`process${type}`](e);
						}
					}
				};
				InternalBDFDB.patchObserverData = {observer: null, data: {}};
				InternalBDFDB.patchPlugin = function (plugin) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(plugin.patchedModules)) return;
					BDFDB.PatchUtils.unpatch(plugin);
					let patchedModules = {};
					for (let patchType in plugin.patchedModules) for (let type in plugin.patchedModules[patchType]) {
						if (!patchedModules[type]) patchedModules[type] = {};
						patchedModules[type][patchType] = plugin.patchedModules[patchType][type];
					}
					for (let type in patchedModules) {
						let pluginData = {plugin: plugin, patchTypes: patchedModules[type]};
						let unmappedType = type.split(" _ _ ")[1] || type;
						
						let config = {
							classNames: [InternalData.ModuleUtilsConfig.Finder[unmappedType] && InternalData.ModuleUtilsConfig.Finder[unmappedType].class].flat(10).filter(n => DiscordClasses[n]),
							stringFind: InternalData.ModuleUtilsConfig.Finder[unmappedType] && InternalData.ModuleUtilsConfig.Finder[unmappedType].strings,
							propertyFind: InternalData.ModuleUtilsConfig.Finder[unmappedType] && InternalData.ModuleUtilsConfig.Finder[unmappedType].props,
							specialFilter: InternalData.ModuleUtilsConfig.Finder[unmappedType] && InternalData.ModuleUtilsConfig.Finder[unmappedType].special && InternalBDFDB.createFilter(InternalData.ModuleUtilsConfig.Finder[unmappedType].special),
							memoComponent: InternalData.ModuleUtilsConfig.MemoComponent.includes(unmappedType),
							subRender: InternalData.ModuleUtilsConfig.SubRender.includes(unmappedType),
							forceObserve: InternalData.ModuleUtilsConfig.ForceObserve.includes(unmappedType),
							nonRender: BDFDB.ObjectUtils.toArray(pluginData.patchTypes).flat(10).filter(n => n && !InternalData.ModuleUtilsConfig.InstanceFunctions.includes(n)).length > 0,
							mapped: InternalData.ModuleUtilsConfig.PatchMap[type]
						};
						config.ignoreCheck = !!(config.codeFind || config.propertyFind || config.specialFilter || config.nonRender || config.memoComponent);
						config.nonPrototype = InternalData.ModuleUtilsConfig.NonPrototype.includes(unmappedType) || !!(config.codeFind || config.propertyFind || config.nonRender);
						
						let component = InternalData.ModuleUtilsConfig.LoadedInComponents[type] && BDFDB.ObjectUtils.get(InternalComponents, InternalData.ModuleUtilsConfig.LoadedInComponents[type]);
						if (component) InternalBDFDB.patchInstance(pluginData, config.nonRender ? (BDFDB.ModuleUtils.find(m => m == component, false) || {}).exports : component, type, config);
						else {
							let mappedType = config.mapped ? config.mapped + " _ _ " + type : type;
							let name = mappedType.split(" _ _ ")[0];
							if (config.mapped) {
								for (let patchType in plugin.patchedModules) if (plugin.patchedModules[patchType][type]) {
									plugin.patchedModules[patchType][mappedType] = plugin.patchedModules[patchType][type];
									delete plugin.patchedModules[patchType][type];
								}
							}
							if (config.classNames.length) InternalBDFDB.checkForInstance(pluginData, mappedType, config);
							else if (config.stringFind) {
								let exports = (BDFDB.ModuleUtils.findByString(config.stringFind, false) || {}).exports;
								InternalBDFDB.patchInstance(pluginData, exports && config.memoComponent ? exports.default : exports, mappedType, config);
							}
							else if (config.propertyFind) {
								let exports = (BDFDB.ModuleUtils.findByProperties(config.propertyFind, false) || {}).exports;
								InternalBDFDB.patchInstance(pluginData, exports && config.memoComponent ? exports.default : exports, mappedType, config);
							}
							else if (config.nonRender) {
								let exports = (BDFDB.ModuleUtils.findByName(name, false) || {}).exports;
								InternalBDFDB.patchInstance(pluginData, exports && config.memoComponent ? exports.default : exports, mappedType, config);
							}
							else InternalBDFDB.patchInstance(pluginData, BDFDB.ModuleUtils.findByName(name), mappedType, config);
						}
					}
				};
				InternalBDFDB.patchInstance = function (pluginDataObjs, instance, type, config) {
					pluginDataObjs = [pluginDataObjs].flat(10).filter(n => n);
					if (pluginDataObjs.length && instance) {
						let name = type.split(" _ _ ")[0];
						instance = instance[BDFDB.ReactUtils.instanceKey] && instance[BDFDB.ReactUtils.instanceKey].type ? instance[BDFDB.ReactUtils.instanceKey].type : instance;
						instance = config.ignoreCheck || BDFDB.ReactUtils.isCorrectInstance(instance, name) || InternalData.ModuleUtilsConfig.LoadedInComponents[type] ? instance : (BDFDB.ReactUtils.findConstructor(instance, name) || BDFDB.ReactUtils.findConstructor(instance, name, {up: true}));
						if (instance) {
							instance = instance[BDFDB.ReactUtils.instanceKey] && instance[BDFDB.ReactUtils.instanceKey].type ? instance[BDFDB.ReactUtils.instanceKey].type : instance;
							let toBePatched = config.nonPrototype ? instance : instance.prototype;
							toBePatched = config.subRender && toBePatched ? toBePatched.type : toBePatched;
							for (let pluginData of pluginDataObjs) for (let patchType in pluginData.patchTypes) {
								let patchMethods = {};
								patchMethods[patchType] = e => {
									return InternalBDFDB.initiateProcess(pluginData.plugin, type, {
										instance: e.thisObject && window != e.thisObject ? e.thisObject : {props: e.methodArguments[0]},
										returnvalue: e.returnValue,
										methodname: e.originalMethodName,
										patchtypes: [patchType]
									});
								};
								BDFDB.PatchUtils.patch(pluginData.plugin, toBePatched, config.subRender ? "render" : pluginData.patchTypes[patchType], patchMethods);
							}
						}
					}
				};
				InternalBDFDB.createFilter = function (config) {
					return ins => ins && config.every(prop => {
						let value = BDFDB.ObjectUtils.get(ins, prop.path);
						return value && (!prop.value || [prop.value].flat(10).filter(n => typeof n == "string").some(n => value.toUpperCase().indexOf(n.toUpperCase()) == 0));
					}) && ins.return.type;
				};
				InternalBDFDB.checkEle = function (pluginDataObjs, ele, type, config) {
					pluginDataObjs = [pluginDataObjs].flat(10).filter(n => n);
					let unmappedType = type.split(" _ _ ")[1] || type;
					let ins = BDFDB.ReactUtils.getInstance(ele);
					if (typeof config.specialFilter == "function") {
						let component = config.specialFilter(ins);
						if (component) {
							if (config.nonRender) {
								let exports = (BDFDB.ModuleUtils.find(m => m == component, false) || {}).exports;
								InternalBDFDB.patchInstance(pluginDataObjs, exports && config.memoComponent ? exports.default : exports, type, config);
							}
							else InternalBDFDB.patchInstance(pluginDataObjs, component, type, config);
							BDFDB.PatchUtils.forceAllUpdates(pluginDataObjs.map(n => n.plugin), type);
							return true;
						}
					}
					else if (InternalBDFDB.isCorrectPatchInstance(ins, type)) {
						InternalBDFDB.patchInstance(pluginDataObjs, ins, type, config);
						BDFDB.PatchUtils.forceAllUpdates(pluginDataObjs.map(n => n.plugin), type);
						return true;
					}
					return false;
				};
				InternalBDFDB.checkForInstance = function (pluginData, type, config) {
					const app = document.querySelector(BDFDB.dotCN.app), bdSettings = document.querySelector("#bd-settingspane-container .scroller");
					let instanceFound = false;
					if (!config.forceObserve) {
						if (app) {
							let appIns = BDFDB.ReactUtils.findConstructor(app, type, {unlimited: true}) || BDFDB.ReactUtils.findConstructor(app, type, {unlimited: true, up: true});
							if (appIns && (instanceFound = true)) InternalBDFDB.patchInstance(pluginData, appIns, type, config);
						}
						if (!instanceFound && bdSettings) {
							let bdSettingsIns = BDFDB.ReactUtils.findConstructor(bdSettings, type, {unlimited: true});
							if (bdSettingsIns && (instanceFound = true)) InternalBDFDB.patchInstance(pluginData, bdSettingsIns, type, config);
						}
					}
					if (!instanceFound) {
						let elementFound = false, classes = config.classNames.map(n => BDFDB.disCN[n]), selector = config.classNames.map(n => BDFDB.dotCN[n]).join(", ");
						for (let ele of document.querySelectorAll(selector)) {
							elementFound = InternalBDFDB.checkEle(pluginData, ele, type, config);
							if (elementFound) break;
						}
						if (!elementFound) {
							if (!InternalBDFDB.patchObserverData.observer) {
								let appMount = document.querySelector(BDFDB.dotCN.appmount);
								if (appMount) {
									InternalBDFDB.patchObserverData.observer = new MutationObserver(cs => {cs.forEach(c => {c.addedNodes.forEach(n => {
										if (!n || !n.tagName) return;
										for (let type in InternalBDFDB.patchObserverData.data) if (!InternalBDFDB.patchObserverData.data[type].found) {
											let ele = null;
											if ((ele = BDFDB.DOMUtils.containsClass(n, ...InternalBDFDB.patchObserverData.data[type].classes) ? n : n.querySelector(InternalBDFDB.patchObserverData.data[type].selector)) != null) {
												InternalBDFDB.patchObserverData.data[type].found = InternalBDFDB.checkEle(InternalBDFDB.patchObserverData.data[type].plugins, ele, type, InternalBDFDB.patchObserverData.data[type].config);
												if (InternalBDFDB.patchObserverData.data[type].found) {
													delete InternalBDFDB.patchObserverData.data[type];
													if (BDFDB.ObjectUtils.isEmpty(InternalBDFDB.patchObserverData.data)) {
														InternalBDFDB.patchObserverData.observer.disconnect();
														InternalBDFDB.patchObserverData.observer = null;
													}
												}
											}
										}
									});});});
									InternalBDFDB.patchObserverData.observer.observe(appMount, {childList: true, subtree: true});
								}
							}
							if (!InternalBDFDB.patchObserverData.data[type]) InternalBDFDB.patchObserverData.data[type] = {selector, classes, found: false, config, plugins: []};
							InternalBDFDB.patchObserverData.data[type].plugins.push(pluginData);
						}
					}
				};
				
				InternalBDFDB.isCorrectPatchInstance = function (instance, name) {
					if (!instance) return false;
					instance = instance[BDFDB.ReactUtils.instanceKey] && instance[BDFDB.ReactUtils.instanceKey].type ? instance[BDFDB.ReactUtils.instanceKey].type : instance;
					instance = BDFDB.ReactUtils.isCorrectInstance(instance, name) ? instance : (BDFDB.ReactUtils.findConstructor(instance, name) || BDFDB.ReactUtils.findConstructor(instance, name, {up: true}));
					return !!instance;
				};
				
				BDFDB.PatchUtils = {};
				BDFDB.PatchUtils.isPatched = function (plugin, module, methodName) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!plugin || !BDFDB.ObjectUtils.is(module) || !module.BDFDB_patches || !methodName) return false;
					const pluginId = (typeof plugin === "string" ? plugin : plugin.name).toLowerCase();
					return pluginId && module[methodName] && module[methodName].__is_BDFDB_patched && module.BDFDB_patches[methodName] && BDFDB.ObjectUtils.toArray(module.BDFDB_patches[methodName]).some(patchObj => BDFDB.ObjectUtils.toArray(patchObj).some(priorityObj => Object.keys(priorityObj).includes(pluginId)));
				};
				BDFDB.PatchUtils.patch = function (plugin, module, methodNames, patchMethods, config = {}) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!plugin || !BDFDB.ObjectUtils.is(module) || !methodNames || !BDFDB.ObjectUtils.is(patchMethods)) return null;
					patchMethods = BDFDB.ObjectUtils.filter(patchMethods, type => InternalData.ModuleUtilsConfig.PatchTypes.includes(type), true);
					if (BDFDB.ObjectUtils.isEmpty(patchMethods)) return null;
					const pluginName = typeof plugin === "string" ? plugin : plugin.name;
					const pluginId = pluginName.toLowerCase();
					const patchPriority = BDFDB.ObjectUtils.is(plugin) && !isNaN(plugin.patchPriority) ? (plugin.patchPriority < 0 ? 0 : (plugin.patchPriority > 10 ? 10 : Math.round(plugin.patchPriority))) : 5;
					if (!BDFDB.ObjectUtils.is(module.BDFDB_patches)) module.BDFDB_patches = {};
					methodNames = [methodNames].flat(10).filter(n => n);
					let cancel = _ => {BDFDB.PatchUtils.unpatch(plugin, module, methodNames);};
					for (let methodName of methodNames) if (module[methodName] == null || typeof module[methodName] == "function") {
						if (!module.BDFDB_patches[methodName] || config.force && (!module[methodName] || !module[methodName].__is_BDFDB_patched)) {
							if (!module.BDFDB_patches[methodName]) {
								module.BDFDB_patches[methodName] = {};
								for (let type of InternalData.ModuleUtilsConfig.PatchTypes) module.BDFDB_patches[methodName][type] = {};
							}
							if (!module[methodName]) module[methodName] = (_ => {});
							const originalMethod = module[methodName];
							module.BDFDB_patches[methodName].originalMethod = originalMethod;
							module[methodName] = function () {
								let callInstead = false, stopCall = false;
								const data = {
									thisObject: this,
									methodArguments: arguments,
									originalMethod: originalMethod,
									originalMethodName: methodName,
									callOriginalMethod: _ => {if (!stopCall) data.returnValue = data.originalMethod.apply(data.thisObject, data.methodArguments)},
									callOriginalMethodAfterwards: _ => {callInstead = true;},
									stopOriginalMethodCall: _ => {stopCall = true;}
								};
								if (module.BDFDB_patches && module.BDFDB_patches[methodName]) {
									for (let priority in module.BDFDB_patches[methodName].before) for (let id in BDFDB.ObjectUtils.sort(module.BDFDB_patches[methodName].before[priority])) {
										BDFDB.TimeUtils.suppress(module.BDFDB_patches[methodName].before[priority][id], `"before" callback of ${methodName} in ${module.constructor ? (module.constructor.displayName || module.constructor.name) : "module"}`, module.BDFDB_patches[methodName].before[priority][id].pluginName)(data);
									}
									
									if (!module.BDFDB_patches || !module.BDFDB_patches[methodName]) return methodName == "render" && data.returnValue === undefined ? null : data.returnValue;
									let hasInsteadPatches = BDFDB.ObjectUtils.toArray(module.BDFDB_patches[methodName].instead).some(priorityObj => !BDFDB.ObjectUtils.isEmpty(priorityObj));
									if (hasInsteadPatches) for (let priority in module.BDFDB_patches[methodName].instead) for (let id in BDFDB.ObjectUtils.sort(module.BDFDB_patches[methodName].instead[priority])) {
										let tempReturn = BDFDB.TimeUtils.suppress(module.BDFDB_patches[methodName].instead[priority][id], `"instead" callback of ${methodName} in ${module.constructor ? (module.constructor.displayName || module.constructor.name) : "module"}`, module.BDFDB_patches[methodName].instead[priority][id].pluginName)(data);
										if (tempReturn !== undefined) data.returnValue = tempReturn;
									}
									if ((!hasInsteadPatches || callInstead) && !stopCall) BDFDB.TimeUtils.suppress(data.callOriginalMethod, `originalMethod of ${methodName} in ${module.constructor ? (module.constructor.displayName || module.constructor.name) : "module"}`)();
									
									if (!module.BDFDB_patches || !module.BDFDB_patches[methodName]) return methodName == "render" && data.returnValue === undefined ? null : data.returnValue;
									for (let priority in module.BDFDB_patches[methodName].after) for (let id in BDFDB.ObjectUtils.sort(module.BDFDB_patches[methodName].after[priority])) {
										let tempReturn = BDFDB.TimeUtils.suppress(module.BDFDB_patches[methodName].after[priority][id], `"after" callback of ${methodName} in ${module.constructor ? (module.constructor.displayName || module.constructor.name) : "module"}`, module.BDFDB_patches[methodName].after[priority][id].pluginName)(data);
										if (tempReturn !== undefined) data.returnValue = tempReturn;
									}
								}
								else BDFDB.TimeUtils.suppress(data.callOriginalMethod, `originalMethod of ${methodName} in ${module.constructor ? module.constructor.displayName || module.constructor.name : "module"}`)();
								callInstead = false, stopCall = false;
								return methodName == "render" && data.returnValue === undefined ? null : data.returnValue;
							};
							for (let key of Object.keys(originalMethod)) module[methodName][key] = originalMethod[key];
							if (!module[methodName].__originalFunction) {
								let realOriginalMethod = originalMethod.__originalMethod || originalMethod.__originalFunction || originalMethod;
								if (typeof realOriginalMethod == "function") {
									module[methodName].__originalFunction = realOriginalMethod;
									module[methodName].toString = _ => realOriginalMethod.toString();
								}
							}
							module[methodName].__is_BDFDB_patched = true;
						}
						for (let type in patchMethods) if (typeof patchMethods[type] == "function") {
							if (!BDFDB.ObjectUtils.is(module.BDFDB_patches[methodName][type][patchPriority])) module.BDFDB_patches[methodName][type][patchPriority] = {};
							module.BDFDB_patches[methodName][type][patchPriority][pluginId] = (...args) => {
								if (config.once || !plugin.started) cancel();
								return patchMethods[type](...args);
							};
							module.BDFDB_patches[methodName][type][patchPriority][pluginId].pluginName = pluginName;
						}
					}
					if (BDFDB.ObjectUtils.is(plugin) && !config.once && !config.noCache) {
						if (!BDFDB.ArrayUtils.is(plugin.patchCancels)) plugin.patchCancels = [];
						plugin.patchCancels.push(cancel);
					}
					return cancel;
				};
				BDFDB.PatchUtils.unpatch = function (plugin, module, methodNames) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!module && !methodNames) {
						if (BDFDB.ObjectUtils.is(plugin) && BDFDB.ArrayUtils.is(plugin.patchCancels)) while (plugin.patchCancels.length) (plugin.patchCancels.pop())();
					}
					else {
						if (!BDFDB.ObjectUtils.is(module) || !module.BDFDB_patches) return;
						const pluginId = !plugin ? null : (typeof plugin === "string" ? plugin : plugin.name).toLowerCase();
						if (methodNames) {
							for (let methodName of [methodNames].flat(10).filter(n => n)) if (module[methodName] && module.BDFDB_patches[methodName]) unpatch(methodName, pluginId);
						}
						else for (let patchedMethod of module.BDFDB_patches) unpatch(patchedMethod, pluginId);
					}
					function unpatch (funcName, pluginId) {
						for (let type of InternalData.ModuleUtilsConfig.PatchTypes) {
							if (pluginId) for (let priority in module.BDFDB_patches[funcName][type]) {
								delete module.BDFDB_patches[funcName][type][priority][pluginId];
								if (BDFDB.ObjectUtils.isEmpty(module.BDFDB_patches[funcName][type][priority])) delete module.BDFDB_patches[funcName][type][priority];
							}
							else delete module.BDFDB_patches[funcName][type];
						}
						if (BDFDB.ObjectUtils.isEmpty(BDFDB.ObjectUtils.filter(module.BDFDB_patches[funcName], key => InternalData.ModuleUtilsConfig.PatchTypes.includes(key) && !BDFDB.ObjectUtils.isEmpty(module.BDFDB_patches[funcName][key]), true))) {
							module[funcName] = module.BDFDB_patches[funcName].originalMethod;
							delete module.BDFDB_patches[funcName];
							if (BDFDB.ObjectUtils.isEmpty(module.BDFDB_patches)) delete module.BDFDB_patches;
						}
					}
				};
				BDFDB.PatchUtils.forceAllUpdates = function (plugins, selectedTypes) {
					plugins = [plugins].flat(10).map(n => n == BDFDB && InternalBDFDB || n).filter(n => BDFDB.ObjectUtils.is(n.patchedModules));
					if (plugins.length) {
						const app = document.querySelector(BDFDB.dotCN.app);
						const bdSettings = document.querySelector("#bd-settingspane-container > *");
						if (app) {
							selectedTypes = [selectedTypes].flat(10).filter(n => n).map(type => type && InternalData.ModuleUtilsConfig.PatchMap[type] ? InternalData.ModuleUtilsConfig.PatchMap[type] + " _ _ " + type : type);
							let updateData = {};
							for (let plugin of plugins) {
								updateData[plugin.name] = {
									filteredModules: [],
									specialModules: [],
									specialModuleTypes: [],
									patchTypes: {}
								};
								for (let patchType in plugin.patchedModules) for (let type in plugin.patchedModules[patchType]) {
									let methodNames = [plugin.patchedModules[patchType][type]].flat(10).filter(n => n);
									if (BDFDB.ArrayUtils.includes(methodNames, "componentDidMount", "componentDidUpdate", "render", false) && (!selectedTypes.length || selectedTypes.includes(type))) {
										let unmappedType = type.split(" _ _ ")[1] || type;
										let selector = [InternalData.ModuleUtilsConfig.Finder[unmappedType]].flat(10).filter(n => DiscordClasses[n]).map(n => BDFDB.dotCN[n]).join(", ");
										let specialFilter = InternalData.ModuleUtilsConfig.Finder[unmappedType] && InternalData.ModuleUtilsConfig.Finder[unmappedType].special && InternalBDFDB.createFilter(InternalData.ModuleUtilsConfig.Finder[unmappedType].special);
										if (selector && typeof specialFilter == "function") {
											for (let ele of document.querySelectorAll(selector)) {
												let constro = specialFilter(BDFDB.ReactUtils.getInstance(ele));
												if (constro) {
													updateData[plugin.name].specialModules.push([type, constro]);
													updateData[plugin.name].specialModuleTypes.push(type);
													break;
												}
											}
										}
										else updateData[plugin.name].filteredModules.push(type);
										let name = type.split(" _ _ ")[0];
										if (!updateData[plugin.name].patchTypes[name]) updateData[plugin.name].patchTypes[name] = [];
										updateData[plugin.name].patchTypes[name].push(patchType);
									}
								}
							}
							let updateDataArray = BDFDB.ObjectUtils.toArray(updateData);
							if (BDFDB.ArrayUtils.sum(updateDataArray.map(n => n.filteredModules.length + n.specialModules.length))) {
								try {
									let filteredModules = BDFDB.ArrayUtils.removeCopies(updateDataArray.map(n => n.filteredModules).flat(10));
									let specialModules = BDFDB.ArrayUtils.removeCopies(updateDataArray.map(n => n.specialModules).flat(10));
									const appInsDown = BDFDB.ReactUtils.findOwner(app, {name: filteredModules, type: specialModules, all: true, group: true, unlimited: true});
									const appInsUp = BDFDB.ReactUtils.findOwner(app, {name: filteredModules, type: specialModules, all: true, group: true, unlimited: true, up: true});
									for (let type in appInsDown) {
										let filteredPlugins = plugins.filter(n => updateData[n.name].filteredModules.includes(type) || updateData[n.name].specialModuleTypes.includes(type)).map(n => ({plugin: n, patchTypes: updateData[n.name].patchTypes}));
										for (let ins of appInsDown[type]) InternalBDFDB.forceInitiateProcess(filteredPlugins, ins, type);
									}
									for (let type in appInsUp) {
										let filteredPlugins = plugins.filter(n => updateData[n.name].filteredModules.includes(type) || updateData[n.name].specialModuleTypes.includes(type)).map(n => ({plugin: n, patchTypes: updateData[n.name].patchTypes}));
										for (let ins of appInsUp[type]) InternalBDFDB.forceInitiateProcess(filteredPlugins, ins, type);
									}
									if (bdSettings) {
										const bdSettingsIns = BDFDB.ReactUtils.findOwner(bdSettings, {name: filteredModules, type: specialModules, all: true, unlimited: true});
										if (bdSettingsIns.length) {
											const bdSettingsWrap = BDFDB.ReactUtils.findOwner(BDFDB.ReactUtils.getInstance(document.querySelector("#bd-settingspane-container > *")), {props: "onChange", up: true});
											if (bdSettingsWrap && bdSettingsWrap.props && typeof bdSettingsWrap.props.onChange == "function") bdSettingsWrap.props.onChange(bdSettingsWrap.props.type);
										}
									}
								}
								catch (err) {BDFDB.LogUtils.error("Could not force update components! " + err, plugins.map(n => n.name).join(", "));}
							}
						}
					}
				};

				BDFDB.DiscordConstants = BDFDB.ModuleUtils.findByProperties("Permissions", "ActivityTypes");
			
				for (let name in InternalData.DiscordObjects) {
					if (InternalData.DiscordObjects[name].props) DiscordObjects[name] = BDFDB.ModuleUtils.findByPrototypes(InternalData.DiscordObjects[name].props);
					else if (InternalData.DiscordObjects[name].protos) DiscordObjects[name] = BDFDB.ModuleUtils.find(m => m.prototype && InternalData.DiscordObjects[name].protos.every(proto => m.prototype[proto] && (!InternalData.DiscordObjects[name].array || Array.isArray(m.prototype[proto]))));
				}
				BDFDB.DiscordObjects = Object.assign({}, DiscordObjects);
				
				for (let name of InternalData.LibraryRequires) {
					try {LibraryRequires[name] = require(name);} catch (err) {}
				}
				BDFDB.LibraryRequires = Object.assign({}, LibraryRequires);
				
				for (let name in InternalData.LibraryModules) {
					if (InternalData.LibraryModules[name].props) {
						if (InternalData.LibraryModules[name].nonProps) LibraryModules[name] = BDFDB.ModuleUtils.find(m => InternalData.LibraryModules[name].props.every(prop => typeof m[prop] == "function") && InternalData.LibraryModules[name].nonProps.every(prop => typeof m[prop] != "function"));
						else LibraryModules[name] = BDFDB.ModuleUtils.findByProperties(InternalData.LibraryModules[name].props);
					}
				}
				if (LibraryModules.KeyCodeUtils) LibraryModules.KeyCodeUtils.getString = function (keyArray) {
					return LibraryModules.KeyCodeUtils.toString([keyArray].flat(10).filter(n => n).map(keycode => [BDFDB.DiscordConstants.KeyboardDeviceTypes.KEYBOARD_KEY, keycode, BDFDB.DiscordConstants.KeyboardEnvs.BROWSER]), true);
				};
				BDFDB.LibraryModules = Object.assign({}, LibraryModules);
				
				LibraryModules.React = BDFDB.ModuleUtils.findByProperties("createElement", "cloneElement");
				LibraryModules.ReactDOM = BDFDB.ModuleUtils.findByProperties("render", "findDOMNode");
				
				BDFDB.ReactUtils = Object.assign({}, LibraryModules.React, LibraryModules.ReactDOM);
				BDFDB.ReactUtils.childrenToArray = function (parent) {
					if (parent && parent.props && parent.props.children && !BDFDB.ArrayUtils.is(parent.props.children)) {
						var child = parent.props.children;
						parent.props.children = [];
						parent.props.children.push(child);
					}
					return parent.props.children;
				}
				BDFDB.ReactUtils.createElement = function (component, props = {}, errorWrap = false) {
					if (component && component.defaultProps) for (let key in component.defaultProps) if (props[key] == null) props[key] = component.defaultProps[key];
					try {
						let child = LibraryModules.React.createElement(component || "div", props) || null;
						if (errorWrap) return LibraryModules.React.createElement(InternalComponents.ErrorBoundary, {}, child) || null;
						else return child;
					}
					catch (err) {BDFDB.LogUtils.error("Could not create react element! " + err);}
					return null;
				};
				BDFDB.ReactUtils.objectToReact = function (obj) {
					if (!obj) return null;
					else if (typeof obj == "string") return obj;
					else if (BDFDB.ObjectUtils.is(obj)) return BDFDB.ReactUtils.createElement(obj.type || obj.props && obj.props.href && "a" || "div", !obj.props ?  {} : Object.assign({}, obj.props, {
						children: obj.props.children ? BDFDB.ReactUtils.objectToReact(obj.props.children) : null
					}));
					else if (BDFDB.ArrayUtils.is(obj)) return obj.map(n => BDFDB.ReactUtils.objectToReact(n));
					else return null;
				};
				BDFDB.ReactUtils.markdownParse = function (str) {
					if (!BDFDB.ReactUtils.markdownParse.parser || !BDFDB.ReactUtils.markdownParse.render) {
						BDFDB.ReactUtils.markdownParse.parser = LibraryModules.SimpleMarkdownParser.parserFor(LibraryModules.SimpleMarkdownParser.defaultRules);
						BDFDB.ReactUtils.markdownParse.render = LibraryModules.SimpleMarkdownParser.reactFor(LibraryModules.SimpleMarkdownParser.ruleOutput(LibraryModules.SimpleMarkdownParser.defaultRules, "react"));
					}
					return BDFDB.ReactUtils.markdownParse.render(BDFDB.ReactUtils.markdownParse.parser(str, {inline: true}));
				};
				BDFDB.ReactUtils.elementToReact = function (node, ref) {
					if (BDFDB.ReactUtils.isValidElement(node)) return node;
					else if (!Node.prototype.isPrototypeOf(node)) return null;
					else if (node.nodeType == Node.TEXT_NODE) return node.nodeValue;
					let attributes = {}, importantStyles = [];
					if (typeof ref == "function") attributes.ref = ref;
					for (let attr of node.attributes) attributes[attr.name] = attr.value;
					if (node.attributes.style) attributes.style = BDFDB.ObjectUtils.filter(node.style, n => node.style[n] && isNaN(parseInt(n)), true);
					attributes.children = [];
					if (node.style && node.style.cssText) for (let propStr of node.style.cssText.split(";")) if (propStr.endsWith("!important")) {
						let key = propStr.split(":")[0];
						let camelprop = key.replace(/-([a-z]?)/g, (m, g) => g.toUpperCase());
						if (attributes.style[camelprop] != null) importantStyles.push(key);
					}
					for (let child of node.childNodes) attributes.children.push(BDFDB.ReactUtils.elementToReact(child));
					attributes.className = BDFDB.DOMUtils.formatClassName(attributes.className, attributes.class);
					delete attributes.class;
					let reactEle = BDFDB.ReactUtils.createElement(node.tagName, attributes);
					BDFDB.ReactUtils.forceStyle(reactEle, importantStyles);
					return reactEle;
				};
				BDFDB.ReactUtils.forceStyle = function (reactEle, styles) {
					if (!BDFDB.ReactUtils.isValidElement(reactEle) || !BDFDB.ObjectUtils.is(reactEle.props.style) || !BDFDB.ArrayUtils.is(styles) || !styles.length) return null;
					let ref = reactEle.ref;
					reactEle.ref = instance => {
						if (typeof ref == "function") ref(instance);
						let node = BDFDB.ReactUtils.findDOMNode(instance);
						if (Node.prototype.isPrototypeOf(node)) for (let key of styles) {
							let propValue = reactEle.props.style[key.replace(/-([a-z]?)/g, (m, g) => g.toUpperCase())];
							if (propValue != null) node.style.setProperty(key, propValue, "important");
						}
					};
					return reactEle;
				};
				BDFDB.ReactUtils.findChild = function (nodeOrInstance, config) {
					if (!nodeOrInstance || !BDFDB.ObjectUtils.is(config) || !config.name && !config.key && !config.props && !config.filter) return config.all ? [] : null;
					let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
					if (!BDFDB.ObjectUtils.is(instance) && !BDFDB.ArrayUtils.is(instance)) return null;
					config.name = config.name && [config.name].flat().filter(n => n);
					config.key = config.key && [config.key].flat().filter(n => n);
					config.props = config.props && [config.props].flat().filter(n => n);
					config.filter = typeof config.filter == "function" && config.filter;
					let depth = -1;
					let start = performance.now();
					let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
					let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
					
					let foundChildren = [];
					let singleChild = getChild(instance);
					if (config.all) {
						for (let i in foundChildren) delete foundChildren[i].BDFDBreactSearch;
						return foundChildren;
					}
					else return singleChild;
					
					function getChild (children) {
						let result = null;
						if (!children || depth >= maxDepth || performance.now() - start >= maxTime) return result;
						if (!BDFDB.ArrayUtils.is(children)) {
							if (check(children)) {
								if (config.all === undefined || !config.all) result = children;
								else if (config.all) {
									if (!children.BDFDBreactSearch) {
										children.BDFDBreactSearch = true;
										foundChildren.push(children);
									}
								}
							}
							else if (children.props && children.props.children) {
								depth++;
								result = getChild(children.props.children);
								depth--;
							}
						}
						else {
							for (let child of children) if (child) {
								if (BDFDB.ArrayUtils.is(child)) result = getChild(child);
								else if (check(child)) {
									if (config.all === undefined || !config.all) result = child;
									else if (config.all) {
										if (!child.BDFDBreactSearch) {
											child.BDFDBreactSearch = true;
											foundChildren.push(child);
										}
									}
								}
								else if (child.props && child.props.children) {
									depth++;
									result = getChild(child.props.children);
									depth--;
								}
								if (result) break;
							}
						}
						return result;
					}
					function check (instance) {
						if (!instance) return false;
						let props = instance.stateNode ? instance.stateNode.props : instance.props;
						return instance.type && config.name && config.name.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name)) || config.key && config.key.some(key => instance.key == key) || props && config.props && config.props[config.someProps ? "some" : "every"](prop => BDFDB.ArrayUtils.is(prop) ? (BDFDB.ArrayUtils.is(prop[1]) ? prop[1].some(checkValue => propCheck(props, prop[0], checkValue)) : propCheck(props, prop[0], prop[1])) : props[prop] !== undefined) || config.filter && config.filter(instance);
					}
					function propCheck (props, key, value) {
						return key != null && props[key] != null && value != null && (key == "className" ? (" " + props[key] + " ").indexOf(" " + value + " ") > -1 : BDFDB.equals(props[key], value));
					}
				};
				BDFDB.ReactUtils.setChild = function (parent, stringOrChild) {
					if (!BDFDB.ReactUtils.isValidElement(parent) || (!BDFDB.ReactUtils.isValidElement(stringOrChild) && typeof stringOrChild != "string" && !BDFDB.ArrayUtils.is(stringOrChild))) return;
					let set = false;
					checkParent(parent);
					function checkParent(child) {
						if (set) return;
						if (!BDFDB.ArrayUtils.is(child)) checkChild(child);
						else for (let subChild of child) checkChild(subChild);
					}
					function checkChild(child) {
						if (!BDFDB.ReactUtils.isValidElement(child)) return;
						if (BDFDB.ReactUtils.isValidElement(child.props.children)) checkParent(child.props.children);
						else if (BDFDB.ArrayUtils.is(child.props.children)) {
							if (child.props.children.every(c => !c || typeof c == "string")) {
								set = true;
								child.props.children = [stringOrChild].flat(10);
							}
							else checkParent(child.props.children);
						}
						else {
							set = true;
							child.props.children = stringOrChild;
						}
					}
				};
				BDFDB.ReactUtils.findConstructor = function (nodeOrInstance, types, config = {}) {
					if (!BDFDB.ObjectUtils.is(config)) return null;
					if (!nodeOrInstance || !types) return config.all ? (config.group ? {} : []) : null;
					let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
					if (!BDFDB.ObjectUtils.is(instance)) return config.all ? (config.group ? {} : []) : null;
					types = types && [types].flat(10).filter(n => typeof n == "string");
					if (!types.length) return config.all ? (config.group ? {} : []) : null;;
					let depth = -1;
					let start = performance.now();
					let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
					let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
					let whitelist = config.up ? {
						return: true,
						sibling: true,
						default: true
					} : {
						child: true,
						sibling: true,
						default: true
					};
					whitelist[BDFDB.ReactUtils.instanceKey] = true;
					
					let foundConstructors = config.group ? {} : [];
					let singleConstructor = getConstructor(instance);
					if (config.all) {
						for (let i in foundConstructors) {
							if (config.group) for (let j in foundConstructors[i]) delete foundConstructors[i][j].BDFDBreactSearch;
							else delete foundConstructors[i].BDFDBreactSearch;
						}
						return foundConstructors;
					}
					else return singleConstructor;

					function getConstructor (instance) {
						depth++;
						let result = undefined;
						if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
							if (instance.type && types.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name.split(" _ _ ")[0]))) {
								if (config.all === undefined || !config.all) result = instance.type;
								else if (config.all) {
									if (!instance.type.BDFDBreactSearch) {
										instance.type.BDFDBreactSearch = true;
										if (config.group) {
											if (instance.type && (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name)) {
												let group = config.name.find(name => (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name || instance.type) == name.split(" _ _ ")[0]) || "Default";
												if (!BDFDB.ArrayUtils.is(foundConstructors[group])) foundConstructors[group] = [];
												foundConstructors[group].push(instance.stateNode);
											}
										}
										else foundConstructors.push(instance.type);
									}
								}
							}
							if (result === undefined) {
								let keys = Object.getOwnPropertyNames(instance);
								for (let i = 0; result === undefined && i < keys.length; i++) {
									let key = keys[i];
									if (key && whitelist[key] && (typeof instance[key] === "object" || typeof instance[key] === "function")) result = getConstructor(instance[key]);
								}
							}
						}
						depth--;
						return result;
					}
				};
				BDFDB.ReactUtils.findDOMNode = function (instance) {
					if (Node.prototype.isPrototypeOf(instance)) return instance;
					if (!instance || !instance.updater || typeof instance.updater.isMounted !== "function" || !instance.updater.isMounted(instance)) return null;
					let node = LibraryModules.ReactDOM.findDOMNode(instance) || BDFDB.ObjectUtils.get(instance, "child.stateNode");
					return Node.prototype.isPrototypeOf(node) ? node : null;
				};
				BDFDB.ReactUtils.findOwner = function (nodeOrInstance, config) {
					if (!BDFDB.ObjectUtils.is(config)) return null;
					if (!nodeOrInstance || !config.name && !config.type && !config.key && !config.props && !config.filter) return config.all ? (config.group ? {} : []) : null;
					let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
					if (!BDFDB.ObjectUtils.is(instance)) return config.all ? (config.group ? {} : []) : null;
					config.name = config.name && [config.name].flat().filter(n => n);
					config.type = config.type && [config.type].flat().filter(n => n);
					config.key = config.key && [config.key].flat().filter(n => n);
					config.props = config.props && [config.props].flat().filter(n => n);
					config.filter = typeof config.filter == "function" && config.filter;
					let depth = -1;
					let start = performance.now();
					let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
					let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
					let whitelist = config.up ? {
						return: true,
						sibling: true,
						default: true
					} : {
						child: true,
						sibling: true,
						default: true
					};
					whitelist[BDFDB.ReactUtils.instanceKey] = true;
					
					let foundInstances = config.group ? {} : [];
					let singleInstance = getOwner(instance);
					if (config.all) {
						for (let i in foundInstances) {
							if (config.group) for (let j in foundInstances[i]) delete foundInstances[i][j].BDFDBreactSearch;
							else delete foundInstances[i].BDFDBreactSearch;
						}
						return foundInstances;
					}
					else return singleInstance;

					function getOwner (instance) {
						depth++;
						let result = undefined;
						if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
							let props = instance.stateNode ? instance.stateNode.props : instance.props;
							if (instance.stateNode && !Node.prototype.isPrototypeOf(instance.stateNode) && (instance.type && config.name && config.name.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name.split(" _ _ ")[0])) || instance.type && config.type && config.type.some(type => BDFDB.ArrayUtils.is(type) ? instance.type === type[1] : instance.type === type) || instance.key && config.key && config.key.some(key => instance.key == key) || props && config.props && config.props.every(prop => BDFDB.ArrayUtils.is(prop) ? (BDFDB.ArrayUtils.is(prop[1]) ? prop[1].some(checkValue => BDFDB.equals(props[prop[0]], checkValue)) : BDFDB.equals(props[prop[0]], prop[1])) : props[prop] !== undefined)) || config.filter && config.filter(instance)) {
								if (config.all === undefined || !config.all) result = instance.stateNode;
								else if (config.all) {
									if (!instance.stateNode.BDFDBreactSearch) {
										instance.stateNode.BDFDBreactSearch = true;
										if (config.group) {
											if (config.name && instance.type && (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name || instance.type)) {
												let group = config.name.find(name => (instance.type.render && instance.type.render.displayName || instance.type.displayName || instance.type.name || instance.type) == name.split(" _ _ ")[0]) || "Default";
												if (!BDFDB.ArrayUtils.is(foundInstances[group])) foundInstances[group] = [];
												foundInstances[group].push(instance.stateNode);
											}
											else if (config.type && instance.type) {
												let group = [config.type.find(t => BDFDB.ArrayUtils.is(t) && instance.type === t[1])].flat(10)[0] || "Default";
												if (!BDFDB.ArrayUtils.is(foundInstances[group])) foundInstances[group] = [];
												foundInstances[group].push(instance.stateNode);
											}
										}
										else foundInstances.push(instance.stateNode);
									}
								}
							}
							if (result === undefined) {
								let keys = Object.getOwnPropertyNames(instance);
								for (let i = 0; result === undefined && i < keys.length; i++) {
									let key = keys[i];
									if (key && whitelist[key] && (typeof instance[key] === "object" || typeof instance[key] === "function")) result = getOwner(instance[key]);
								}
							}
						}
						depth--;
						return result;
					}
				};
				BDFDB.ReactUtils.findParent = function (nodeOrInstance, config) {
					if (!nodeOrInstance || !BDFDB.ObjectUtils.is(config) || !config.name && !config.key && !config.props && !config.filter) return [null, -1];
					let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
					if (!BDFDB.ObjectUtils.is(instance) && !BDFDB.ArrayUtils.is(instance) || instance.props && typeof instance.props.children == "function") return [null, -1];
					config.name = config.name && [config.name].flat().filter(n => n);
					config.key = config.key && [config.key].flat().filter(n => n);
					config.props = config.props && [config.props].flat().filter(n => n);
					config.filter = typeof config.filter == "function" && config.filter;
					let parent = firstArray = instance;
					while (!BDFDB.ArrayUtils.is(firstArray) && firstArray.props && firstArray.props.children) firstArray = firstArray.props.children;
					if (!BDFDB.ArrayUtils.is(firstArray)) {
						if (parent && parent.props) {
							parent.props.children = [parent.props.children];
							firstArray = parent.props.children;
						}
						else firstArray = [];
					}
					return getParent(instance);
					function getParent (children) {
						let result = [firstArray, -1];
						if (!children) return result;
						if (!BDFDB.ArrayUtils.is(children)) {
							if (check(children)) result = found(children);
							else if (children.props && children.props.children) {
								parent = children;
								result = getParent(children.props.children);
							}
						}
						else {
							for (let i = 0; result[1] == -1 && i < children.length; i++) if (children[i]) {
								if (BDFDB.ArrayUtils.is(children[i])) {
									parent = children;
									result = getParent(children[i]);
								}
								else if (check(children[i])) {
									parent = children;
									result = found(children[i]);
								}
								else if (children[i].props && children[i].props.children) {
									parent = children[i];
									result = getParent(children[i].props.children);
								}
							}
						}
						return result;
					}
					function found (child) {
						if (BDFDB.ArrayUtils.is(parent)) return [parent, parent.indexOf(child)];
						else {
							parent.props.children = [];
							parent.props.children.push(child);
							return [parent.props.children, 0];
						}
					}
					function check (instance) {
						if (!instance) return false;
						let props = instance.stateNode ? instance.stateNode.props : instance.props;
						return instance.type && config.name && config.name.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name)) || config.key && config.key.some(key => instance.key == key) || props && config.props && config.props[config.someProps ? "some" : "every"](prop => BDFDB.ArrayUtils.is(prop) ? (BDFDB.ArrayUtils.is(prop[1]) ? prop[1].some(checkValue => propCheck(props, prop[0], checkValue)) : propCheck(props, prop[0], prop[1])) : props[prop] !== undefined) || config.filter && config.filter(instance);
					}
					function propCheck (props, key, value) {
						return key != null && props[key] != null && value != null && (key == "className" ? (" " + props[key] + " ").indexOf(" " + value + " ") > -1 : BDFDB.equals(props[key], value));
					}
				};
				BDFDB.ReactUtils.findProps = function (nodeOrInstance, config) {
					if (!BDFDB.ObjectUtils.is(config)) return null;
					if (!nodeOrInstance || !config.name && !config.key) return null;
					let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
					if (!BDFDB.ObjectUtils.is(instance)) return null;
					config.name = config.name && [config.name].flat().filter(n => n);
					config.key = config.key && [config.key].flat().filter(n => n);
					let depth = -1;
					let start = performance.now();
					let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
					let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
					let whitelist = config.up ? {
						return: true,
						sibling: true,
						default: true
					} : {
						child: true,
						sibling: true,
						default: true
					};
					whitelist[BDFDB.ReactUtils.instanceKey] = true;
					return findProps(instance);

					function findProps (instance) {
						depth++;
						let result = undefined;
						if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
							if (instance.memoizedProps && (instance.type && config.name && config.name.some(name => BDFDB.ReactUtils.isCorrectInstance(instance, name.split(" _ _ ")[0])) || config.key && config.key.some(key => instance.key == key))) result = instance.memoizedProps;
							if (result === undefined) {
								let keys = Object.getOwnPropertyNames(instance);
								for (let i = 0; result === undefined && i < keys.length; i++) {
									let key = keys[i];
									if (key && whitelist[key] && (typeof instance[key] === "object" || typeof instance[key] === "function")) result = findProps(instance[key]);
								}
							}
						}
						depth--;
						return result;
					}
				};
				BDFDB.ReactUtils.findValue = function (nodeOrInstance, searchKey, config = {}) {
					if (!BDFDB.ObjectUtils.is(config)) return null;
					if (!nodeOrInstance || typeof searchKey != "string") return config.all ? [] : null;
					let instance = Node.prototype.isPrototypeOf(nodeOrInstance) ? BDFDB.ReactUtils.getInstance(nodeOrInstance) : nodeOrInstance;
					if (!BDFDB.ObjectUtils.is(instance)) return config.all ? [] : null;
					instance = instance[BDFDB.ReactUtils.instanceKey] || instance;
					let depth = -1;
					let start = performance.now();
					let maxDepth = config.unlimited ? 999999999 : (config.depth === undefined ? 30 : config.depth);
					let maxTime = config.unlimited ? 999999999 : (config.time === undefined ? 150 : config.time);
					let whitelist = {
						props: true,
						state: true,
						stateNode: true,
						updater: true,
						prototype: true,
						type: true,
						children: config.up ? false : true,
						memoizedProps: true,
						memoizedState: true,
						child: config.up ? false : true,
						return: config.up ? true : false,
						sibling: config.up ? false : true
					};
					let blacklist = {
						contextSection: true
					};
					if (BDFDB.ObjectUtils.is(config.whitelist)) Object.assign(whitelist, config.whiteList);
					if (BDFDB.ObjectUtils.is(config.blacklist)) Object.assign(blacklist, config.blacklist);
					let foundKeys = [];
					let singleKey = getKey(instance);
					if (config.all) return foundKeys;
					else return singleKey;
					function getKey(instance) {
						depth++;
						let result = undefined;
						if (instance && !Node.prototype.isPrototypeOf(instance) && !BDFDB.ReactUtils.getInstance(instance) && depth < maxDepth && performance.now() - start < maxTime) {
							let keys = Object.getOwnPropertyNames(instance);
							for (let i = 0; result === undefined && i < keys.length; i++) {
								let key = keys[i];
								if (key && !blacklist[key]) {
									let value = instance[key];
									if (searchKey === key && (config.value === undefined || BDFDB.equals(config.value, value))) {
										if (config.all === undefined || !config.all) result = value;
										else if (config.all) {
											if (config.noCopies === undefined || !config.noCopies) foundKeys.push(value);
											else if (config.noCopies) {
												let copy = false;
												for (let foundKey of foundKeys) if (BDFDB.equals(value, foundKey)) {
													copy = true;
													break;
												}
												if (!copy) foundKeys.push(value);
											}
										}
									}
									else if ((typeof value === "object" || typeof value === "function") && (whitelist[key] || key[0] == "." || !isNaN(key[0]))) result = getKey(value);
								}
							}
						}
						depth--;
						return result;
					}
				};
				BDFDB.ReactUtils.forceUpdate = function (...instances) {
					for (let ins of instances.flat(10).filter(n => n)) if (ins.updater && typeof ins.updater.isMounted == "function" && ins.updater.isMounted(ins)) ins.forceUpdate();
				};
				BDFDB.ReactUtils.getInstance = function (node) {
					if (!BDFDB.ObjectUtils.is(node)) return null;
					return node[Object.keys(node).find(key => key.startsWith("__reactInternalInstance") || key.startsWith("__reactFiber"))];
				};
				BDFDB.ReactUtils.isCorrectInstance = function (instance, name) {
					return instance && ((instance.type && (instance.type.render && instance.type.render.displayName === name || instance.type.displayName === name || instance.type.name === name || instance.type === name)) || instance.render && (instance.render.displayName === name || instance.render.name === name) || instance.displayName == name || instance.name === name);
				};
				BDFDB.ReactUtils.render = function (component, node) {
					if (!BDFDB.ReactUtils.isValidElement(component) || !Node.prototype.isPrototypeOf(node)) return;
					try {
						LibraryModules.ReactDOM.render(component, node);
						let observer = new MutationObserver(changes => changes.forEach(change => {
							let nodes = Array.from(change.removedNodes);
							if (nodes.indexOf(node) > -1 || nodes.some(n => n.contains(node))) {
								observer.disconnect();
								BDFDB.ReactUtils.unmountComponentAtNode(node);
							}
						}));
						observer.observe(document.body, {subtree: true, childList: true});
					}
					catch (err) {BDFDB.LogUtils.error("Could not render react element! " + err);}
				};

				let MessageRerenderTimeout;
				BDFDB.MessageUtils = {};
				BDFDB.MessageUtils.rerenderAll = function (instant) {
					BDFDB.TimeUtils.clear(MessageRerenderTimeout);
					MessageRerenderTimeout = BDFDB.TimeUtils.timeout(_ => {
						let channel = BDFDB.LibraryModules.ChannelStore.getChannel(BDFDB.LibraryModules.LastChannelStore.getChannelId());
						if (channel) {
							if (BDFDB.DMUtils.isDMChannel(channel)) BDFDB.DMUtils.markAsRead(channel);
							else BDFDB.ChannelUtils.markAsRead(channel);
						}
						let LayerProviderIns = BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.messageswrapper), {name: "LayerProvider", unlimited: true, up: true});
						let LayerProviderPrototype = BDFDB.ObjectUtils.get(LayerProviderIns, `${BDFDB.ReactUtils.instanceKey}.type.prototype`);
						if (LayerProviderIns && LayerProviderPrototype) {
							BDFDB.PatchUtils.patch(BDFDB, LayerProviderPrototype, "render", {after: e => {
								e.returnValue.props.children = [];
							}}, {once: true});
							BDFDB.ReactUtils.forceUpdate(LayerProviderIns);
						}
					}, instant ? 0 : 1000);
				};
				BDFDB.MessageUtils.openMenu = function (message, e = mousePosition, slim = false) {
					if (!message) return;
					let channel = LibraryModules.ChannelStore.getChannel(message.channel_id);
					if (channel) LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
						return BDFDB.ReactUtils.createElement((BDFDB.ModuleUtils.findByName(slim ? "MessageSearchResultContextMenu" : "MessageContextMenu", false) || {exports: {}}).exports.default, Object.assign({}, e, {
							message: message,
							channel: channel
						}));
					});
				};
					
				BDFDB.UserUtils = {};
				BDFDB.UserUtils.is = function (user) {
					return user && user instanceof BDFDB.DiscordObjects.User;
				};
				var myDataUser = LibraryModules.CurrentUserStore && LibraryModules.CurrentUserStore.getCurrentUser();
				BDFDB.UserUtils.me = new Proxy(myDataUser || {}, {
					get: function (list, item) {
						return (myDataUser = LibraryModules.CurrentUserStore.getCurrentUser()) && myDataUser[item];
					}
				});
				BDFDB.UserUtils.getStatus = function (id = BDFDB.UserUtils.me.id) {
					id = typeof id == "number" ? id.toFixed() : id;
					let activity = BDFDB.UserUtils.getActivity(id);
					return activity && activity.type == BDFDB.DiscordConstants.ActivityTypes.STREAMING ? "streaming" : LibraryModules.StatusMetaUtils.getStatus(id);
				};
				BDFDB.UserUtils.getStatusColor = function (status, useColor) {
					status = typeof status == "string" ? status.toLowerCase() : null;
					switch (status) {
						case "online": return BDFDB.DiscordConstants.Colors.STATUS_GREEN;
						case "mobile": return BDFDB.DiscordConstants.Colors.STATUS_GREEN;
						case "idle": return BDFDB.DiscordConstants.Colors.STATUS_YELLOW;
						case "dnd": return BDFDB.DiscordConstants.Colors.STATUS_RED;
						case "playing": return useColor ? BDFDB.DiscordConstants.Colors.BRAND : "var(--bdfdb-blurple)";
						case "listening": return BDFDB.DiscordConstants.Colors.SPOTIFY;
						case "streaming": return BDFDB.DiscordConstants.Colors.TWITCH;
						default: return BDFDB.DiscordConstants.Colors.STATUS_GREY;
					}
				};
				BDFDB.UserUtils.getActivity = function (id = BDFDB.UserUtils.me.id) {
					for (let activity of LibraryModules.StatusMetaUtils.getActivities(id)) if (activity.type != BDFDB.DiscordConstants.ActivityTypes.CUSTOM_STATUS) return activity;
					return null;
				};
				BDFDB.UserUtils.getAvatar = function (id = BDFDB.UserUtils.me.id) {
					let user = LibraryModules.UserStore.getUser(typeof id == "number" ? id.toFixed() : id);
					if (!user) return window.location.origin + "/assets/322c936a8c8be1b803cd94861bdfa868.png";
					else return ((user.avatar ? "" : window.location.origin) + LibraryModules.IconUtils.getUserAvatarURL(user)).split("?")[0];
				};
				BDFDB.UserUtils.can = function (permission, id = BDFDB.UserUtils.me.id, channelId = LibraryModules.LastChannelStore.getChannelId()) {
					if (!BDFDB.DiscordConstants.Permissions[permission]) BDFDB.LogUtils.warn(permission + " not found in Permissions");
					else {
						let channel = LibraryModules.ChannelStore.getChannel(channelId);
						if (channel) return LibraryModules.PermissionRoleUtils.can(BDFDB.DiscordConstants.Permissions[permission], id, channel);
					}
					return false;
				};
				BDFDB.UserUtils.openMenu = function (id, guildId, e = mousePosition) {
					if (!id || !guildId) return;
					let user = LibraryModules.UserStore.getUser(id);
					if (user) LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
						return BDFDB.ReactUtils.createElement((BDFDB.ModuleUtils.findByName("GuildChannelUserContextMenu", false) || {exports: {}}).exports.default, Object.assign({}, e, {
							user: user,
							guildId: guildId
						}));
					});
				};

				let GuildsRerenderTimeout;
				BDFDB.GuildUtils = {};
				BDFDB.GuildUtils.is = function (guild) {
					if (!BDFDB.ObjectUtils.is(guild)) return false;
					let keys = Object.keys(guild);
					return guild instanceof BDFDB.DiscordObjects.Guild || Object.keys(new BDFDB.DiscordObjects.Guild({})).every(key => keys.indexOf(key) > -1);
				};
				BDFDB.GuildUtils.getIcon = function (id) {
					let guild = LibraryModules.GuildStore.getGuild(typeof id == "number" ? id.toFixed() : id);
					if (!guild || !guild.icon) return null;
					return LibraryModules.IconUtils.getGuildIconURL(guild).split("?")[0];
				};
				BDFDB.GuildUtils.getBanner = function (id) {
					let guild = LibraryModules.GuildStore.getGuild(typeof id == "number" ? id.toFixed() : id);
					if (!guild || !guild.banner) return null;
					return LibraryModules.IconUtils.getGuildBannerURL(guild).split("?")[0];
				};
				BDFDB.GuildUtils.getFolder = function (id) {
					return BDFDB.LibraryModules.FolderStore.guildFolders.filter(n => n.folderId).find(n => n.guildIds.includes(id));
				};
				BDFDB.GuildUtils.getId = function (div) {
					if (!Node.prototype.isPrototypeOf(div) || !BDFDB.ReactUtils.getInstance(div)) return;
					let guilddiv = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildouter, div);
					if (!guilddiv) return;
					let iconWrap = guilddiv.querySelector(BDFDB.dotCN.guildiconwrapper);
					let id = iconWrap && iconWrap.href ? iconWrap.href.split("/").slice(-2)[0] : null;
					return id && !isNaN(parseInt(id)) ? id.toString() : null;
				};
				BDFDB.GuildUtils.getData = function (eleOrInfoOrId) {
					if (!eleOrInfoOrId) return null;
					let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
					id = typeof id == "number" ? id.toFixed() : id;
					for (let info of BDFDB.GuildUtils.getAll()) if (info && info.id == id) return info;
					return null;
				};
				BDFDB.GuildUtils.getAll = function () {
					let found = [], objs = [];
					for (let ins of BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.guilds), {name: ["Guild","GuildIcon"], all: true, unlimited: true})) {
						if (ins.props && ins.props.guild) objs.push(Object.assign(new ins.props.guild.constructor(ins.props.guild), {div: ins.handleContextMenu && BDFDB.ReactUtils.findDOMNode(ins), instance: ins}));
					}
					for (let id of BDFDB.LibraryModules.FolderStore.getFlattenedGuildIds()) {
						let foundobj = null;
						for (let obj of objs) if (obj.id == id) {
							foundobj = obj
							break;
						}
						if (foundobj) found.push(foundobj);
						else {
							let guild = BDFDB.LibraryModules.GuildStore.getGuild(id);
							if (guild) found.push(Object.assign(new guild.constructor(guild), {div: null, instance: null}))
						}
					}
					return found;
				};
				BDFDB.GuildUtils.getUnread = function (servers) {
					let found = [];
					for (let eleOrInfoOrId of servers === undefined || !BDFDB.ArrayUtils.is(servers) ? BDFDB.GuildUtils.getAll() : servers) {
						if (!eleOrInfoOrId) return null;
						let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
						id = typeof id == "number" ? id.toFixed() : id;
						if (id && (LibraryModules.UnreadGuildUtils.hasUnread(id) || LibraryModules.UnreadGuildUtils.getMentionCount(id) > 0)) found.push(eleOrInfoOrId);
					}
					return found;
				};
				BDFDB.GuildUtils.getPinged = function (servers) {
					let found = [];
					for (let eleOrInfoOrId of servers === undefined || !BDFDB.ArrayUtils.is(servers) ? BDFDB.GuildUtils.getAll() : servers) {
						if (!eleOrInfoOrId) return null;
						let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
						id = typeof id == "number" ? id.toFixed() : id;
						if (id && LibraryModules.UnreadGuildUtils.getMentionCount(id) > 0) found.push(eleOrInfoOrId);
					}
					return found;
				};
				BDFDB.GuildUtils.getMuted = function (servers) {
					let found = [];
					for (let eleOrInfoOrId of servers === undefined || !BDFDB.ArrayUtils.is(servers) ? BDFDB.GuildUtils.getAll() : servers) {
						if (!eleOrInfoOrId) return null;
						let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
						id = typeof id == "number" ? id.toFixed() : id;
						if (id && LibraryModules.MutedUtils.isGuildOrCategoryOrChannelMuted(id)) found.push(eleOrInfoOrId);
					}
					return found;
				};
				BDFDB.GuildUtils.getSelected = function () {
					let info = LibraryModules.GuildStore.getGuild(LibraryModules.LastGuildStore.getGuildId());
					if (info) return BDFDB.GuildUtils.getData(info.id) || Object.assign(new info.constructor(info), {div: null, instance: null});
					else return null;
				};
				BDFDB.GuildUtils.openMenu = function (eleOrInfoOrId, e = mousePosition) {
					if (!eleOrInfoOrId) return;
					let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.GuildUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
					let guild = LibraryModules.GuildStore.getGuild(id);
					if (guild) LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
						return BDFDB.ReactUtils.createElement((BDFDB.ModuleUtils.findByName("GuildContextMenu", false) || {exports: {}}).exports.default, Object.assign({}, e, {
							guild: guild
						}));
					});
				};
				BDFDB.GuildUtils.markAsRead = function (guilds) {
					if (!guilds) return;
					let unreadChannels = [];
					for (let guild of [guilds].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						let id = Node.prototype.isPrototypeOf(guild) ? BDFDB.GuildUtils.getId(guild) : (guild && typeof guild == "object" ? guild.id : guild);
						let channels = id && LibraryModules.GuildChannelStore.getChannels(id);
						if (channels) for (let type in channels) if (BDFDB.ArrayUtils.is(channels[type])) for (let channelObj of channels[type]) unreadChannels.push(channelObj.channel.id);
					}
					if (unreadChannels.length) BDFDB.ChannelUtils.markAsRead(unreadChannels);
				};
				BDFDB.GuildUtils.rerenderAll = function (instant) {
					BDFDB.TimeUtils.clear(GuildsRerenderTimeout);
					GuildsRerenderTimeout = BDFDB.TimeUtils.timeout(_ => {
						let GuildsIns = BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.app), {name: "Guilds", unlimited: true});
						let GuildsPrototype = BDFDB.ObjectUtils.get(GuildsIns, `${BDFDB.ReactUtils.instanceKey}.type.prototype`);
						if (GuildsIns && GuildsPrototype) {
							let injectPlaceholder = returnValue => {
								let [children, index] = BDFDB.ReactUtils.findParent(returnValue, {name: "ConnectedUnreadDMs"});
								if (index > -1) children.splice(index + 1, 0, BDFDB.ReactUtils.createElement("div", {}));
								BDFDB.ReactUtils.forceUpdate(GuildsIns);
							};
							BDFDB.PatchUtils.patch(BDFDB, GuildsPrototype, "render", {after: e => {
								if (typeof e.returnValue.props.children == "function") {
									let childrenRender = e.returnValue.props.children;
									e.returnValue.props.children = (...args) => {
										let children = childrenRender(...args);
										injectPlaceholder(children);
										return children;
									};
								}
								else injectPlaceholder(e.returnValue);
							}}, {once: true});
							BDFDB.ReactUtils.forceUpdate(GuildsIns);
						}
					}, instant ? 0 : 1000);
				};

				BDFDB.FolderUtils = {};
				BDFDB.FolderUtils.getId = function (div) {
					if (!Node.prototype.isPrototypeOf(div) || !BDFDB.ReactUtils.getInstance(div)) return;
					div = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildfolderwrapper, div);
					if (!div) return;
					return BDFDB.ReactUtils.findValue(div, "folderId", {up: true});
				};
				BDFDB.FolderUtils.getDefaultName = function (folderId) {
					let folder = BDFDB.LibraryModules.FolderStore.getGuildFolderById(folderId);
					if (!folder) return "";
					let rest = 2 * BDFDB.DiscordConstants.MAX_GUILD_FOLDER_NAME_LENGTH;
					let names = [], allNames = folder.guildIds.map(guildId => (BDFDB.LibraryModules.GuildStore.getGuild(guildId) || {}).name).filter(n => n);
					for (let name of allNames) if (name.length < rest || names.length === 0) {
						names.push(name);
						rest -= name.length;
					}
					return names.join(", ") + (names.length < allNames.length ? ", ..." : "");
				};
				BDFDB.FolderUtils.getDiv = function (eleOrInfoOrId) {
					if (!eleOrInfoOrId) return null;
					let info = BDFDB.FolderUtils.getData(eleOrInfoOrId);
					return info ? info.div : null;
				};
				BDFDB.FolderUtils.getData = function (eleOrInfoOrId) {
					if (!eleOrInfoOrId) return null;
					let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.FolderUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
					id = typeof id == "number" ? id.toFixed() : id;
					for (let info of BDFDB.FolderUtils.getAll()) if (info && info.folderId == id) return info;
					return null;
				};
				BDFDB.FolderUtils.getAll = function () {
					let found = [];
					for (let ins of BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.guildswrapper), {name: "GuildFolder", all: true, unlimited: true})) {
						if (ins.props && ins.props.folderId) found.push(Object.assign({}, ins.props, {div: BDFDB.ReactUtils.findDOMNode(ins), instance: ins}));
					}
					return found;
				};

				let ChannelsRerenderTimeout;
				BDFDB.ChannelUtils = {};
				BDFDB.ChannelUtils.is = function (channel) {
					if (!BDFDB.ObjectUtils.is(channel)) return false;
					let keys = Object.keys(channel);
					return channel instanceof BDFDB.DiscordObjects.Channel || Object.keys(new BDFDB.DiscordObjects.Channel({})).every(key => keys.indexOf(key) > -1);
				};
				BDFDB.ChannelUtils.isTextChannel = function (channelOrId) {
					let channel = typeof channelOrId == "string" ? LibraryModules.ChannelStore.getChannel(channelOrId) : channelOrId;
					return BDFDB.ObjectUtils.is(channel) && (channel.type == BDFDB.DiscordConstants.ChannelTypes.GUILD_TEXT || channel.type == BDFDB.DiscordConstants.ChannelTypes.GUILD_STORE || channel.type == BDFDB.DiscordConstants.ChannelTypes.GUILD_ANNOUNCEMENT);
				};
				BDFDB.ChannelUtils.getId = function (div) {
					if (!Node.prototype.isPrototypeOf(div) || !BDFDB.ReactUtils.getInstance(div)) return;
					div = BDFDB.DOMUtils.getParent(BDFDB.dotCNC.categorycontainerdefault + BDFDB.dotCNC.channelcontainerdefault + BDFDB.dotCN.dmchannel, div);
					if (!div) return;
					let info = BDFDB.ReactUtils.findValue(div, "channel");
					return info ? info.id.toString() : null;
				};
				BDFDB.ChannelUtils.getDiv = function (eleOrInfoOrId) {
					if (!eleOrInfoOrId) return null;
					let info = BDFDB.ChannelUtils.getData(eleOrInfoOrId);
					return info ? info.div : null;
				};
				BDFDB.ChannelUtils.getData = function (eleOrInfoOrId) {
					if (!eleOrInfoOrId) return null;
					let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.ChannelUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
					id = typeof id == "number" ? id.toFixed() : id;
					for (let info of BDFDB.ChannelUtils.getAll()) if (info && info.id == id) return info;
					return null;
				};
				BDFDB.ChannelUtils.getName = function (id, addPrefix) {
					let channel = BDFDB.LibraryModules.ChannelStore.getChannel(id);
					if (!channel) return "";
					switch (channel.type) {
						case BDFDB.DiscordConstants.ChannelTypes.DM:
							let user = channel.recipients.map(BDFDB.LibraryModules.UserStore.getUser).filter(n => n)[0];
							return (addPrefix && "@" || "") + (user && user.toString() || "");
						case BDFDB.DiscordConstants.ChannelTypes.GROUP_DM:
							if (channel.name) return channel.name;
							let users = channel.recipients.map(BDFDB.LibraryModules.UserStore.getUser).filter(n => n);
							return users.length > 0 ? users.map(user => user.toString).join(", ") : BDFDB.LanguageUtils.LanguageStrings.UNNAMED;
						case BDFDB.DiscordConstants.ChannelTypes.GUILD_ANNOUNCEMENT:
						case BDFDB.DiscordConstants.ChannelTypes.GUILD_TEXT:
							return (addPrefix && "#" || "") + channel.name;
						default:
							return channel.name
					}
				};
				BDFDB.ChannelUtils.getAll = function () {
					let found = [];
					for (let ins of BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.channels), {name: ["ChannelCategoryItem", "ChannelItem", "PrivateChannel"], all: true, unlimited: true})) if (ins.props && !ins.props.ispin && ins.props.channel && ins[BDFDB.ReactUtils.instanceKey] && ins[BDFDB.ReactUtils.instanceKey].return) {
						let div = BDFDB.ReactUtils.findDOMNode(ins);
						div = div && BDFDB.DOMUtils.containsClass(div.parentElement, BDFDB.disCN.categorycontainerdefault, BDFDB.disCN.channelcontainerdefault, false) ? div.parentElement : div;
						found.push(Object.assign(new ins.props.channel.constructor(ins.props.channel), {div, instance: ins}));
					}
					return found;
				};
				BDFDB.ChannelUtils.getSelected = function () {
					let info = LibraryModules.ChannelStore.getChannel(LibraryModules.LastChannelStore.getChannelId());
					if (info) return BDFDB.ChannelUtils.getData(info.id) || Object.assign(new info.constructor(info), {div: null, instance: null});
					else return null;
				};
				BDFDB.ChannelUtils.markAsRead = function (channels) {
					if (!channels) return;
					let unreadChannels = [];
					for (let channel of [channels].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						let id = Node.prototype.isPrototypeOf(channel) ? BDFDB.ChannelUtils.getId(channel) : (channel && typeof channel == "object" ? channel.id : channel);
						if (id && BDFDB.ChannelUtils.isTextChannel(id)) unreadChannels.push({
							channelId: id,
							messageId: LibraryModules.UnreadChannelUtils.lastMessageId(id)
						});
					}
					if (unreadChannels.length) LibraryModules.AckUtils.bulkAck(unreadChannels);
				};
				BDFDB.ChannelUtils.rerenderAll = function (instant) {
					BDFDB.TimeUtils.clear(ChannelsRerenderTimeout);
					ChannelsRerenderTimeout = BDFDB.TimeUtils.timeout(_ => {
						let ChannelsIns = BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.guildchannels), {name: "Channels", unlimited: true});
						let ChannelsPrototype = BDFDB.ObjectUtils.get(ChannelsIns, `${BDFDB.ReactUtils.instanceKey}.type.prototype`);
						if (ChannelsIns && ChannelsPrototype) {
							BDFDB.PatchUtils.patch(BDFDB, ChannelsPrototype, "render", {after: e => {
								e.returnValue.props.children = typeof e.returnValue.props.children == "function" ? (_ => {return null;}) : [];
								BDFDB.ReactUtils.forceUpdate(ChannelsIns);
							}}, {once: true});
							BDFDB.ReactUtils.forceUpdate(ChannelsIns);
						}
					}, instant ? 0 : 1000);
				};
				
				BDFDB.DMUtils = {};
				BDFDB.DMUtils.isDMChannel = function (channelOrId) {
					let channel = typeof channelOrId == "string" ? LibraryModules.ChannelStore.getChannel(channelOrId) : channelOrId;
					return BDFDB.ObjectUtils.is(channel) && (channel.type == BDFDB.DiscordConstants.ChannelTypes.DM || channel.type == BDFDB.DiscordConstants.ChannelTypes.GROUP_DM);
				};
				BDFDB.DMUtils.getIcon = function (id) {
					let channel = LibraryModules.ChannelStore.getChannel(id = typeof id == "number" ? id.toFixed() : id);
					if (!channel) return null;
					if (!channel.icon) return channel.type == 1 ? BDFDB.UserUtils.getAvatar(channel.recipients[0]) : (channel.type == 3 ? window.location.origin + LibraryModules.IconUtils.getChannelIconURL(channel).split("?")[0] : null);
					return LibraryModules.IconUtils.getChannelIconURL(channel).split("?")[0];
				};
				BDFDB.DMUtils.getId = function (div) {
					if (!Node.prototype.isPrototypeOf(div) || !BDFDB.ReactUtils.getInstance(div)) return;
					let dmdiv = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildouter, div);
					if (!dmdiv) return;
					let iconWrap = dmdiv.querySelector(BDFDB.dotCN.guildiconwrapper);
					let id = iconWrap && iconWrap.href ? iconWrap.href.split("/").slice(-1)[0] : null;
					return id && !isNaN(parseInt(id)) ? id.toString() : null;
				};
				BDFDB.DMUtils.getDiv = function (eleOrInfoOrId) {
					if (!eleOrInfoOrId) return null;
					if (Node.prototype.isPrototypeOf(eleOrInfoOrId)) {
						var div = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildouter, eleOrInfoOrId);
						return div ? div.parentElement : div;
					}
					else {
						let id = typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId;
						if (id) {
							var div = BDFDB.DOMUtils.getParent(BDFDB.dotCN.guildouter, document.querySelector(`${BDFDB.dotCNS.guilds + BDFDB.dotCN.dmpill + " + * " + BDFDB.dotCN.guildiconwrapper}[href*="/channels/@me/${id}"]`));
							return div && BDFDB? div.parentElement : div;
						}
					}
					return null;
				};
				BDFDB.DMUtils.getData = function (eleOrInfoOrId) {
					if (!eleOrInfoOrId) return null;
					let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.BDFDB.DMUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
					id = typeof id == "number" ? id.toFixed() : id;
					for (let info of BDFDB.DMUtils.getAll()) if (info && info.id == id) return info;
					return null;
				};
				BDFDB.DMUtils.getAll = function () {
					let found = [];
					for (let ins of BDFDB.ReactUtils.findOwner(document.querySelector(BDFDB.dotCN.guilds), {name: "DirectMessage", all: true, unlimited: true})) {
						if (ins.props && ins.props.channel) found.push(Object.assign(new ins.props.channel.constructor(ins.props.channel), {div: BDFDB.ReactUtils.findDOMNode(ins), instance: ins}));
					}
					return found;
				};
				BDFDB.DMUtils.openMenu = function (eleOrInfoOrId, e = mousePosition) {
					if (!eleOrInfoOrId) return;
					let id = Node.prototype.isPrototypeOf(eleOrInfoOrId) ? BDFDB.ChannelUtils.getId(eleOrInfoOrId) : (typeof eleOrInfoOrId == "object" ? eleOrInfoOrId.id : eleOrInfoOrId);
					let channel = LibraryModules.ChannelStore.getChannel(id);
					if (channel) {
						if (channel.isMultiUserDM()) LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
							return BDFDB.ReactUtils.createElement((BDFDB.ModuleUtils.findByName("GroupDMContextMenu", false) || {exports: {}}).exports.default, Object.assign({}, e, {
								channel: channel,
								selected: channel.id == LibraryModules.LastChannelStore.getChannelId()
							}));
						});
						else LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
							return BDFDB.ReactUtils.createElement((BDFDB.ModuleUtils.findByName("DMUserContextMenu", false) || {exports: {}}).exports.default, Object.assign({}, e, {
								user: LibraryModules.UserStore.getUser(channel.recipients[0]),
								channel: channel,
								selected: channel.id == LibraryModules.LastChannelStore.getChannelId()
							}));
						});
					}
				};
				BDFDB.DMUtils.markAsRead = function (dms) {
					if (!dms) return;
					let unreadChannels = [];
					for (let dm of [dms].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						let id = Node.prototype.isPrototypeOf(dm) ? BDFDB.BDFDB.DMUtils.getId(dm) : (dm && typeof dm == "object" ? dm.id : dm);
						if (id) unreadChannels.push(id);
					}
					for (let i in unreadChannels) BDFDB.TimeUtils.timeout(_ => {LibraryModules.AckUtils.ack(unreadChannels[i]);}, i * 1000);
				};

				InternalBDFDB.writeConfig = function (path, config) {
					try {LibraryRequires.fs.writeFileSync(path, JSON.stringify(config, null, "	"));}
					catch (err) {}
				};
				InternalBDFDB.readConfig = function (path) {
					try {return JSON.parse(LibraryRequires.fs.readFileSync(path));}
					catch (err) {return {};}
				};
				
				BDFDB.DataUtils = {};
				BDFDB.DataUtils.save = function (data, plugin, key, id) {
				console.log('NO SAVING NIGGA')
				// 	plugin = plugin == BDFDB && InternalBDFDB || plugin;
				// 	let pluginName = typeof plugin === "string" ? plugin : plugin.name;
				// 	let fileName = pluginName == "BDFDB" ? "0BDFDB" : pluginName;
				// 	let configPath = LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".config.json");
					
				// 	let config = Cache.data[pluginName] !== undefined ? Cache.data[pluginName] : (InternalBDFDB.readConfig(configPath) || {});
					
				// 	if (key === undefined) config = BDFDB.ObjectUtils.is(data) ? BDFDB.ObjectUtils.sort(data) : data;
				// 	else {
				// 		if (id === undefined) config[key] = BDFDB.ObjectUtils.is(data) ? BDFDB.ObjectUtils.sort(data) : data;
				// 		else {
				// 			if (!BDFDB.ObjectUtils.is(config[key])) config[key] = {};
				// 			config[key][id] = BDFDB.ObjectUtils.is(data) ? BDFDB.ObjectUtils.sort(data) : data;
				// 		}
				// 	}
					
				// 	let configIsObject = BDFDB.ObjectUtils.is(config);
				// 	if (key !== undefined && configIsObject && BDFDB.ObjectUtils.is(config[key]) && BDFDB.ObjectUtils.isEmpty(config[key])) delete config[key];
				// 	if (BDFDB.ObjectUtils.isEmpty(config)) {
				// 		delete Cache.data[pluginName];
				// 		if (LibraryRequires.fs.existsSync(configPath)) LibraryRequires.fs.unlinkSync(configPath);
				// 	}
				// 	else {
				// 		if (configIsObject) config = BDFDB.ObjectUtils.sort(config);
				// 		Cache.data[pluginName] = configIsObject ? BDFDB.ObjectUtils.deepAssign({}, config) : config;
				// 		InternalBDFDB.writeConfig(configPath, config);
				// 	}
				// };

				// BDFDB.DataUtils.load = function (plugin, key, id) {
				// 	plugin = plugin == BDFDB && InternalBDFDB || plugin;
				// 	let pluginName = typeof plugin === "string" ? plugin : plugin.name;
				// 	let fileName = pluginName == "BDFDB" ? "0BDFDB" : pluginName;
				// 	let configPath = LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".config.json");
					
				// 	let config = Cache.data[pluginName] !== undefined ? Cache.data[pluginName] : (InternalBDFDB.readConfig(configPath) || {});
				// 	let configIsObject = BDFDB.ObjectUtils.is(config);
				// 	Cache.data[pluginName] = configIsObject ? BDFDB.ObjectUtils.deepAssign({}, config) : config;
					
				// 	if (key === undefined) return config;
				// 	else {
				// 		let keydata = configIsObject ? (BDFDB.ObjectUtils.is(config[key]) || config[key] == undefined ? BDFDB.ObjectUtils.deepAssign({}, config[key]) : config[key]) : null;
				// 		if (id === undefined) return keydata;
				// 		else return !BDFDB.ObjectUtils.is(keydata) || keydata[id] === undefined ? null : keydata[id];
				// 	}
				};
				BDFDB.DataUtils.remove = function (plugin, key, id) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					let pluginName = typeof plugin === "string" ? plugin : plugin.name;
					let fileName = pluginName == "BDFDB" ? "0BDFDB" : pluginName;
					let configPath = LibraryRequires.path.join(BDFDB.BDUtils.getPluginsFolder(), fileName + ".config.json");
					
					let config = Cache.data[pluginName] !== undefined ? Cache.data[pluginName] : (InternalBDFDB.readConfig(configPath) || {});
					let configIsObject = BDFDB.ObjectUtils.is(config);
					
					if (key === undefined || !configIsObject) config = {};
					else {
						if (id === undefined) delete config[key];
						else if (BDFDB.ObjectUtils.is(config[key])) delete config[key][id];
					}
					
					if (BDFDB.ObjectUtils.is(config[key]) && BDFDB.ObjectUtils.isEmpty(config[key])) delete config[key];
					if (BDFDB.ObjectUtils.isEmpty(config)) {
						delete Cache.data[pluginName];
						if (LibraryRequires.fs.existsSync(configPath)) LibraryRequires.fs.unlinkSync(configPath);
					}
					else {
						if (configIsObject) config = BDFDB.ObjectUtils.sort(config);
						Cache.data[pluginName] = configIsObject ? BDFDB.ObjectUtils.deepAssign({}, config) : config;
						InternalBDFDB.writeConfig(configPath, config);
					}
				};
				BDFDB.DataUtils.get = function (plugin, key, id) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					plugin = typeof plugin == "string" ? BDFDB.BDUtils.getPlugin(plugin) : plugin;
					if (!BDFDB.ObjectUtils.is(plugin)) return id === undefined ? {} : null;
					let defaults = plugin.defaults;
					if (!BDFDB.ObjectUtils.is(defaults) || !defaults[key]) return id === undefined ? {} : null;
					let oldC = BDFDB.DataUtils.load(plugin, key), newC = {}, update = false;
					for (let k in defaults[key]) {
						let isObj = BDFDB.ObjectUtils.is(defaults[key][k].value);
						if (oldC[k] == null || isObj && (!BDFDB.ObjectUtils.is(oldC[k]) || Object.keys(defaults[key][k].value).some(n => defaults[key][k].value[n] != null && !BDFDB.sameProto(defaults[key][k].value[n], oldC[k][n])))) {
							newC[k] = isObj ? BDFDB.ObjectUtils.deepAssign({}, defaults[key][k].value) : defaults[key][k].value;
							update = true;
						}
						else newC[k] = oldC[k];
					}
					if (update) BDFDB.DataUtils.save(newC, plugin, key);
					
					if (id === undefined) return newC;
					else return newC[id] === undefined ? null : newC[id];
				};
				
				BDFDB.ColorUtils = {};
				BDFDB.ColorUtils.convert = function (color, conv, type) {
					if (BDFDB.ObjectUtils.is(color)) {
						var newColor = {};
						for (let pos in color) newColor[pos] = BDFDB.ColorUtils.convert(color[pos], conv, type);
						return newColor;
					}
					else {
						conv = conv === undefined || !conv ? conv = "RGBCOMP" : conv.toUpperCase();
						type = type === undefined || !type || !["RGB", "RGBA", "RGBCOMP", "HSL", "HSLA", "HSLCOMP", "HEX", "HEXA", "INT"].includes(type.toUpperCase()) ? BDFDB.ColorUtils.getType(color) : type.toUpperCase();
						if (conv == "RGBCOMP") {
							switch (type) {
								case "RGBCOMP":
									if (color.length == 3) return processRGB(color);
									else if (color.length == 4) {
										let a = processA(color.pop());
										return processRGB(color).concat(a);
									}
									break;
								case "RGB":
									return processRGB(color.replace(/\s/g, "").slice(4, -1).split(","));
								case "RGBA":
									let comp = color.replace(/\s/g, "").slice(5, -1).split(",");
									let a = processA(comp.pop());
									return processRGB(comp).concat(a);
								case "HSLCOMP":
									if (color.length == 3) return BDFDB.ColorUtils.convert(`hsl(${processHSL(color).join(",")})`, "RGBCOMP");
									else if (color.length == 4) {
										let a = processA(color.pop());
										return BDFDB.ColorUtils.convert(`hsl(${processHSL(color).join(",")})`, "RGBCOMP").concat(a);
									}
									break;
								case "HSL":
									var hslcomp = processHSL(color.replace(/\s/g, "").slice(4, -1).split(","));
									var r, g, b, m, c, x, p, q;
									var h = hslcomp[0] / 360, l = parseInt(hslcomp[1]) / 100, s = parseInt(hslcomp[2]) / 100; m = Math.floor(h * 6); c = h * 6 - m; x = s * (1 - l); p = s * (1 - c * l); q = s * (1 - (1 - c) * l);
									switch (m % 6) {
										case 0: r = s, g = q, b = x; break;
										case 1: r = p, g = s, b = x; break;
										case 2: r = x, g = s, b = q; break;
										case 3: r = x, g = p, b = s; break;
										case 4: r = q, g = x, b = s; break;
										case 5: r = s, g = x, b = p; break;
									}
									return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
								case "HSLA":
									var hslcomp = color.replace(/\s/g, "").slice(5, -1).split(",");
									return BDFDB.ColorUtils.convert(`hsl(${hslcomp.slice(0, 3).join(",")})`, "RGBCOMP").concat(processA(hslcomp.pop()));
								case "HEX":
									var hex = /^#([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$|^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
									return [parseInt(hex[1] + hex[1] || hex[4], 16).toString(), parseInt(hex[2] + hex[2] || hex[5], 16).toString(), parseInt(hex[3] + hex[3] || hex[6], 16).toString()];
								case "HEXA":
									var hex = /^#([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})([a-f\d]{1})$|^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
									return [parseInt(hex[1] + hex[1] || hex[5], 16).toString(), parseInt(hex[2] + hex[2] || hex[6], 16).toString(), parseInt(hex[3] + hex[3] || hex[7], 16).toString(), Math.floor(BDFDB.NumberUtils.mapRange([0, 255], [0, 100], parseInt(hex[4] + hex[4] || hex[8], 16).toString()))/100];
								case "INT":
									color = processINT(color);
									return [(color >> 16 & 255).toString(), (color >> 8 & 255).toString(), (color & 255).toString()];
								default:
									return null;
							}
						}
						else {
							if (conv && type && conv.indexOf("HSL") == 0 && type.indexOf("HSL") == 0) {
								if (type == "HSLCOMP") {
									switch (conv) {
										case "HSLCOMP":
											if (color.length == 3) return processHSL(color);
											else if (color.length == 4) {
												var a = processA(color.pop());
												return processHSL(color).concat(a);
											}
											break;
										case "HSL":
											return `hsl(${processHSL(color.slice(0, 3)).join(",")})`;
										case "HSLA":
											color = color.slice(0, 4);
											var a = color.length == 4 ? processA(color.pop()) : 1;
											return `hsla(${processHSL(color).concat(a).join(",")})`;
									}
								}
								else return BDFDB.ColorUtils.convert(color.replace(/\s/g, "").slice(color.toLowerCase().indexOf("hsla") == 0 ? 5 : 4, -1).split(","), conv, "HSLCOMP");
							}
							else {
								let rgbcomp = type == "RGBCOMP" ? color : BDFDB.ColorUtils.convert(color, "RGBCOMP", type);
								if (rgbcomp) switch (conv) {
									case "RGB":
										return `rgb(${processRGB(rgbcomp.slice(0, 3)).join(",")})`;
									case "RGBA":
										rgbcomp = rgbcomp.slice(0, 4);
										var a = rgbcomp.length == 4 ? processA(rgbcomp.pop()) : 1;
										return `rgba(${processRGB(rgbcomp).concat(a).join(",")})`;
									case "HSLCOMP":
										var a = rgbcomp.length == 4 ? processA(rgbcomp.pop()) : null;
										var hslcomp = processHSL(BDFDB.ColorUtils.convert(rgbcomp, "HSL").replace(/\s/g, "").split(","));
										return a != null ? hslcomp.concat(a) : hslcomp;
									case "HSL":
										var r = processC(rgbcomp[0]), g = processC(rgbcomp[1]), b = processC(rgbcomp[2]);
										var max = Math.max(r, g, b), min = Math.min(r, g, b), dif = max - min, h, l = max === 0 ? 0 : dif / max, s = max / 255;
										switch (max) {
											case min: h = 0; break;
											case r: h = g - b + dif * (g < b ? 6 : 0); h /= 6 * dif; break;
											case g: h = b - r + dif * 2; h /= 6 * dif; break;
											case b: h = r - g + dif * 4; h /= 6 * dif; break;
										}
										return `hsl(${processHSL([Math.round(h * 360), l * 100, s * 100]).join(",")})`;
									case "HSLA":
										var a = rgbcomp.length == 4 ? processA(rgbcomp.pop()) : 1;
										return `hsla(${BDFDB.ColorUtils.convert(rgbcomp, "HSL").slice(4, -1).split(",").concat(a).join(",")})`;
									case "HEX":
										return ("#" + (0x1000000 + (rgbcomp[2] | rgbcomp[1] << 8 | rgbcomp[0] << 16)).toString(16).slice(1)).toUpperCase();
									case "HEXA":
										return ("#" + (0x1000000 + (rgbcomp[2] | rgbcomp[1] << 8 | rgbcomp[0] << 16)).toString(16).slice(1) + (0x100 + Math.round(BDFDB.NumberUtils.mapRange([0, 100], [0, 255], processA(rgbcomp[3]) * 100))).toString(16).slice(1)).toUpperCase();
									case "INT":
										return processINT(rgbcomp[2] | rgbcomp[1] << 8 | rgbcomp[0] << 16);
									default:
										return null;
								}
							}
						}
					}
					return null;
					function processC(c) {if (c == null) {return 255;} else {c = parseInt(c.toString().replace(/[^0-9\-]/g, ""));return isNaN(c) || c > 255 ? 255 : c < 0 ? 0 : c;}};
					function processRGB(comp) {return comp.map(c => {return processC(c);});};
					function processA(a) {if (a == null) {return 1;} else {a = a.toString();a = (a.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(a.replace(/[^0-9\.\-]/g, ""));return isNaN(a) || a > 1 ? 1 : a < 0 ? 0 : a;}};
					function processSL(sl) {if (sl == null) {return "100%";} else {sl = parseFloat(sl.toString().replace(/[^0-9\.\-]/g, ""));return (isNaN(sl) || sl > 100 ? 100 : sl < 0 ? 0 : sl) + "%";}};
					function processHSL(comp) {let h = parseFloat(comp.shift().toString().replace(/[^0-9\.\-]/g, ""));h = isNaN(h) || h > 360 ? 360 : h < 0 ? 0 : h;return [h].concat(comp.map(sl => {return processSL(sl);}));};
					function processINT(c) {if (c == null) {return 16777215;} else {c = parseInt(c.toString().replace(/[^0-9]/g, ""));return isNaN(c) || c > 16777215 ? 16777215 : c < 0 ? 0 : c;}};
				};
				BDFDB.ColorUtils.setAlpha = function (color, a, conv) {
					if (BDFDB.ObjectUtils.is(color)) {
						var newcolor = {};
						for (let pos in color) newcolor[pos] = BDFDB.ColorUtils.setAlpha(color[pos], a, conv);
						return newcolor;
					}
					else {
						var comp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
						if (comp) {
							a = a.toString();
							a = (a.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(a.replace(/[^0-9\.\-]/g, ""));
							a = isNaN(a) || a > 1 ? 1 : a < 0 ? 0 : a;
							comp[3] = a;
							conv = (conv || BDFDB.ColorUtils.getType(color)).toUpperCase();
							conv = conv == "RGB" || conv == "HSL" || conv == "HEX" ? conv + "A" : conv;
							return BDFDB.ColorUtils.convert(comp, conv);
						}
					}
					return null;
				};
				BDFDB.ColorUtils.getAlpha = function (color) {
					var comp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
					if (comp) {
						if (comp.length == 3) return 1;
						else if (comp.length == 4) {
							let a = comp[3].toString();
							a = (a.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(a.replace(/[^0-9\.\-]/g, ""));
							return isNaN(a) || a > 1 ? 1 : a < 0 ? 0 : a;
						}
					}
					return null;
				};
				BDFDB.ColorUtils.change = function (color, value, conv) {
					value = parseFloat(value);
					if (color != null && typeof value == "number" && !isNaN(value)) {
						if (BDFDB.ObjectUtils.is(color)) {
							var newcolor = {};
							for (let pos in color) newcolor[pos] = BDFDB.ColorUtils.change(color[pos], value, conv);
							return newcolor;
						}
						else {
							var comp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
							if (comp) {
								if (parseInt(value) !== value) {
									value = value.toString();
									value = (value.indexOf("%") > -1 ? 0.01 : 1) * parseFloat(value.replace(/[^0-9\.\-]/g, ""));
									value = isNaN(value) ? 0 : value;
									return BDFDB.ColorUtils.convert([Math.round(comp[0] * (1 + value)), Math.round(comp[1] * (1 + value)), Math.round(comp[2] * (1 + value))], conv || BDFDB.ColorUtils.getType(color));
								}
								else return BDFDB.ColorUtils.convert([Math.round(comp[0] + value), Math.round(comp[1] + value), Math.round(comp[2] + value)], conv || BDFDB.ColorUtils.getType(color));
							}
						}
					}
					return null;
				};
				BDFDB.ColorUtils.invert = function (color, conv) {
					if (BDFDB.ObjectUtils.is(color)) {
						var newcolor = {};
						for (let pos in color) newcolor[pos] = BDFDB.ColorUtils.invert(color[pos], conv);
						return newcolor;
					}
					else {
						var comp = BDFDB.ColorUtils.convert(color, "RGBCOMP");
						if (comp) return BDFDB.ColorUtils.convert([255 - comp[0], 255 - comp[1], 255 - comp[2]], conv || BDFDB.ColorUtils.getType(color));
					}
					return null;
				};
				BDFDB.ColorUtils.compare = function (color1, color2) {
					if (color1 && color2) {
						color1 = BDFDB.ColorUtils.convert(color1, "RGBA");
						color2 = BDFDB.ColorUtils.convert(color2, "RGBA");
						if (color1 && color2) return BDFDB.equals(color1, color2);
					}
					return null;
				};
				BDFDB.ColorUtils.isBright = function (color, compare = 160) {
					color = BDFDB.ColorUtils.convert(color, "RGBCOMP");
					if (!color) return false;
					return parseInt(compare) < Math.sqrt(0.299 * color[0]**2 + 0.587 * color[1]**2 + 0.144 * color[2]**2);
				};
				BDFDB.ColorUtils.getType = function (color) {
					if (color != null) {
						if (typeof color === "object" && (color.length == 3 || color.length == 4)) {
							if (isRGB(color)) return "RGBCOMP";
							else if (isHSL(color)) return "HSLCOMP";
						}
						else if (typeof color === "string") {
							if (/^#[a-f\d]{3}$|^#[a-f\d]{6}$/i.test(color)) return "HEX";
							else if (/^#[a-f\d]{4}$|^#[a-f\d]{8}$/i.test(color)) return "HEXA";
							else {
								color = color.toUpperCase();
								var comp = color.replace(/[^0-9\.\-\,\%]/g, "").split(",");
								if (color.indexOf("RGB(") == 0 && comp.length == 3 && isRGB(comp)) return "RGB";
								else if (color.indexOf("RGBA(") == 0 && comp.length == 4 && isRGB(comp)) return "RGBA";
								else if (color.indexOf("HSL(") == 0 && comp.length == 3 && isHSL(comp)) return "HSL";
								else if (color.indexOf("HSLA(") == 0 && comp.length == 4 && isHSL(comp)) return "HSLA";
							}
						}
						else if (typeof color === "number" && parseInt(color) == color && color > -1 && color < 16777216) return "INT";
					}
					return null;
					function isRGB(comp) {return comp.slice(0, 3).every(rgb => rgb.toString().indexOf("%") == -1 && parseFloat(rgb) == parseInt(rgb));};
					function isHSL(comp) {return comp.slice(1, 3).every(hsl => hsl.toString().indexOf("%") == hsl.length - 1);};
				};
				BDFDB.ColorUtils.createGradient = function (colorObj, direction = "to right") {
					let gradientString = "linear-gradient(" + direction;
					for (let pos of Object.keys(colorObj).sort()) {
						let color = BDFDB.ColorUtils.convert(colorObj[pos], "RGBA");
						gradientString += color ? `, ${color} ${pos*100}%` : ''
					}
					return gradientString += ")";
				};
				BDFDB.ColorUtils.getSwatchColor = function (container, number) {
					if (!Node.prototype.isPrototypeOf(container)) return;
					let swatches = container.querySelector(`${BDFDB.dotCN.colorpickerswatches}[number="${number}"], ${BDFDB.dotCN.colorpickerswatch}[number="${number}"]`);
					if (!swatches) return null;
					return BDFDB.ColorUtils.convert(BDFDB.ReactUtils.findValue(BDFDB.ReactUtils.getInstance(swatches), "selectedColor", {up: true, blacklist: {"props":true}}));
				};

				BDFDB.DOMUtils = {};
				BDFDB.DOMUtils.getSelection = function () {
					let selection = document.getSelection();
					return selection && selection.anchorNode ? selection.getRangeAt(0).toString() : "";
				};
				BDFDB.DOMUtils.addClass = function (eles, ...classes) {
					if (!eles || !classes) return;
					for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						if (Node.prototype.isPrototypeOf(ele)) add(ele);
						else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) add(e);
						else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) add(n);
					}
					function add(node) {
						if (node && node.classList) for (let cla of classes) for (let cl of [cla].flat(10).filter(n => n)) if (typeof cl == "string") for (let c of cl.split(" ")) if (c) node.classList.add(c);
					}
				};
				BDFDB.DOMUtils.removeClass = function (eles, ...classes) {
					if (!eles || !classes) return;
					for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						if (Node.prototype.isPrototypeOf(ele)) remove(ele);
						else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) remove(e);
						else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) remove(n);
					}
					function remove(node) {
						if (node && node.classList) for (let cla of classes) for (let cl of [cla].flat(10).filter(n => n)) if (typeof cl == "string") for (let c of cl.split(" ")) if (c) node.classList.remove(c);
					}
				};
				BDFDB.DOMUtils.toggleClass = function (eles, ...classes) {
					if (!eles || !classes) return;
					var force = classes.pop();
					if (typeof force != "boolean") {
						classes.push(force);
						force = undefined;
					}
					if (!classes.length) return;
					for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						if (Node.prototype.isPrototypeOf(ele)) toggle(ele);
						else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) toggle(e);
						else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) toggle(n);
					}
					function toggle(node) {
						if (node && node.classList) for (let cla of classes) for (let cl of [cla].flat(10).filter(n => n)) if (typeof cl == "string") for (let c of cl.split(" ")) if (c) node.classList.toggle(c, force);
					}
				};
				BDFDB.DOMUtils.containsClass = function (eles, ...classes) {
					if (!eles || !classes) return;
					let all = classes.pop();
					if (typeof all != "boolean") {
						classes.push(all);
						all = true;
					}
					if (!classes.length) return;
					let contained = undefined;
					for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						if (Node.prototype.isPrototypeOf(ele)) contains(ele);
						else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) contains(e);
						else if (typeof ele == "string") for (let c of ele.split(",")) if (c && (c = c.trim())) for (let n of document.querySelectorAll(c)) contains(n);
					}
					return contained;
					function contains(node) {
						if (node && node.classList) for (let cla of classes) if (typeof cla == "string") for (let c of cla.split(" ")) if (c) {
							if (contained === undefined) contained = all;
							if (all && !node.classList.contains(c)) contained = false;
							if (!all && node.classList.contains(c)) contained = true;
						}
					}
				};
				BDFDB.DOMUtils.replaceClass = function (eles, oldclass, newclass) {
					if (!eles || typeof oldclass != "string" || typeof newclass != "string") return;
					for (let ele of [eles].map(n => NodeList.prototype.isPrototypeOf(n) ? Array.from(n) : n).flat(10).filter(n => n)) {
						if (Node.prototype.isPrototypeOf(ele)) replace(ele);
						else if (NodeList.prototype.isPrototypeOf(ele)) for (let e of ele) replace(e);
						else if (typeof ele == "string") for (let e of ele.split(",")) if (e && (e = e.trim())) for (let n of document.querySelectorAll(e)) replace(n);
					}
					function replace(node) {
						if (node && node.tagName && node.className) node.className = node.className.replace(new RegExp(oldclass, "g"), newclass).trim();
					}
				};
				BDFDB.DOMUtils.formatClassName = function (...classes) {
					return BDFDB.ArrayUtils.removeCopies(classes.flat(10).filter(n => n).join(" ").split(" ")).join(" ").trim();
				};
				BDFDB.DOMUtils.removeClassFromDOM = function (...classes) {
					for (let c of classes.flat(10).filter(n => n)) if (typeof c == "string") for (let a of c.split(",")) if (a && (a = a.replace(/\.|\s/g, ""))) BDFDB.DOMUtils.removeClass(document.querySelectorAll("." + a), a);
				};
				BDFDB.DOMUtils.show = function (...eles) {
					BDFDB.DOMUtils.toggle(...eles, true);
				};
				BDFDB.DOMUtils.hide = function (...eles) {
					BDFDB.DOMUtils.toggle(...eles, false);
				};
				BDFDB.DOMUtils.toggle = function (...eles) {
					if (!eles) return;
					let force = eles.pop();
					if (typeof force != "boolean") {
						eles.push(force);
						force = undefined;
					}
					if (!eles.length) return;
					for (let ele of eles.flat(10).filter(n => n)) {
						if (Node.prototype.isPrototypeOf(ele)) toggle(ele);
						else if (NodeList.prototype.isPrototypeOf(ele)) for (let node of ele) toggle(node);
						else if (typeof ele == "string") for (let c of ele.split(",")) if (c && (c = c.trim())) for (let node of document.querySelectorAll(c)) toggle(node);
					}
					function toggle(node) {
						if (!node || !Node.prototype.isPrototypeOf(node)) return;
						let hidden = force === undefined ? !BDFDB.DOMUtils.isHidden(node) : !force;
						if (hidden) {
							let display = node.style.getPropertyValue("display");
							if (display && display != "none") node.BDFDBhideDisplayState = {
								display: display,
								important: (` ${node.style.cssText} `.split(` display: ${display}`)[1] || "").trim().indexOf("!important") == 0
							};
							node.style.setProperty("display", "none", "important");
						}
						else {
							if (node.BDFDBhideDisplayState) {
								node.style.setProperty("display", node.BDFDBhideDisplayState.display, node.BDFDBhideDisplayState.important ? "important" : "");
								delete node.BDFDBhideDisplayState;
							}
							else node.style.removeProperty("display");
						}
					}
				};
				BDFDB.DOMUtils.isHidden = function (node) {
					if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) return getComputedStyle(node, null).getPropertyValue("display") == "none";
				};
				BDFDB.DOMUtils.remove = function (...eles) {
					for (let ele of eles.flat(10).filter(n => n)) {
						if (Node.prototype.isPrototypeOf(ele)) ele.remove();
						else if (NodeList.prototype.isPrototypeOf(ele)) {
							let nodes = Array.from(ele);
							while (nodes.length) nodes.shift().remove();
						}
						else if (typeof ele == "string") for (let c of ele.split(",")) if (c && (c = c.trim())) {
							let nodes = Array.from(document.querySelectorAll(c));
							while (nodes.length) nodes.shift().remove();
						}
					}
				};
				BDFDB.DOMUtils.create = function (html) {
					if (typeof html != "string" || !html.trim()) return null;
					let template = document.createElement("template");
					try {template.innerHTML = html.replace(/(?<!pre)>[\t\r\n]+<(?!pre)/g, "><");}
					catch (err) {template.innerHTML = html.replace(/>[\t\r\n]+<(?!pre)/g, "><");}
					if (template.content.childNodes.length == 1) return template.content.firstElementChild || template.content.firstChild;
					else {
						let wrapper = document.createElement("span");
						let nodes = Array.from(template.content.childNodes);
						while (nodes.length) wrapper.appendChild(nodes.shift());
						return wrapper;
					}
				};
				BDFDB.DOMUtils.getParent = function (listOrSelector, node) {
					let parent = null;
					if (Node.prototype.isPrototypeOf(node) && listOrSelector) {
						let list = NodeList.prototype.isPrototypeOf(listOrSelector) ? listOrSelector : typeof listOrSelector == "string" ? document.querySelectorAll(listOrSelector) : null;
						if (list) for (let listNode of list) if (listNode.contains(node)) {
							parent = listNode;
							break;
						}
					}
					return parent;
				};
				BDFDB.DOMUtils.setText = function (node, stringOrNode) {
					if (!node || !Node.prototype.isPrototypeOf(node)) return;
					let textnode = node.nodeType == Node.TEXT_NODE ? node : null;
					if (!textnode) for (let child of node.childNodes) if (child.nodeType == Node.TEXT_NODE || BDFDB.DOMUtils.containsClass(child, "BDFDB-textnode")) {
						textnode = child;
						break;
					}
					if (textnode) {
						if (Node.prototype.isPrototypeOf(stringOrNode) && stringOrNode.nodeType != Node.TEXT_NODE) {
							BDFDB.DOMUtils.addClass(stringOrNode, "BDFDB-textnode");
							node.replaceChild(stringOrNode, textnode);
						}
						else if (Node.prototype.isPrototypeOf(textnode) && textnode.nodeType != Node.TEXT_NODE) node.replaceChild(document.createTextNode(stringOrNode), textnode);
						else textnode.textContent = stringOrNode;
					}
					else node.appendChild(Node.prototype.isPrototypeOf(stringOrNode) ? stringOrNode : document.createTextNode(stringOrNode));
				};
				BDFDB.DOMUtils.getText = function (node) {
					if (!node || !Node.prototype.isPrototypeOf(node)) return;
					for (let child of node.childNodes) if (child.nodeType == Node.TEXT_NODE) return child.textContent;
				};
				BDFDB.DOMUtils.getRects = function (node) {
					let rects = {};
					if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
						let hideNode = node;
						while (hideNode) {
							let hidden = BDFDB.DOMUtils.isHidden(hideNode);
							if (hidden) {
								BDFDB.DOMUtils.toggle(hideNode, true);
								hideNode.BDFDBgetRectsHidden = true;
							}
							hideNode = hideNode.parentElement;
						}
						rects = node.getBoundingClientRect();
						hideNode = node;
						while (hideNode) {
							if (hideNode.BDFDBgetRectsHidden) {
								BDFDB.DOMUtils.toggle(hideNode, false);
								delete hideNode.BDFDBgetRectsHidden;
							}
							hideNode = hideNode.parentElement;
						}
					}
					return rects;
				};
				BDFDB.DOMUtils.getHeight = function (node) {
					if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
						let rects = BDFDB.DOMUtils.getRects(node);
						let style = getComputedStyle(node);
						return rects.height + parseInt(style.marginTop) + parseInt(style.marginBottom);
					}
					return 0;
				};
				BDFDB.DOMUtils.getInnerHeight = function (node) {
					if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
						let rects = BDFDB.DOMUtils.getRects(node);
						let style = getComputedStyle(node);
						return rects.height - parseInt(style.paddingTop) - parseInt(style.paddingBottom);
					}
					return 0;
				};
				BDFDB.DOMUtils.getWidth = function (node) {
					if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
						let rects = BDFDB.DOMUtils.getRects(node);
						let style = getComputedStyle(node);
						return rects.width + parseInt(style.marginLeft) + parseInt(style.marginRight);
					}
					return 0;
				};
				BDFDB.DOMUtils.getInnerWidth = function (node) {
					if (Node.prototype.isPrototypeOf(node) && node.nodeType != Node.TEXT_NODE) {
						let rects = BDFDB.DOMUtils.getRects(node);
						let style = getComputedStyle(node);
						return rects.width - parseInt(style.paddingLeft) - parseInt(style.paddingRight);
					}
					return 0;
				};
				BDFDB.DOMUtils.appendWebScript = function (url, container) {
					if (typeof url != "string") return;
					if (!container && !document.head.querySelector("bd-head bd-scripts")) document.head.appendChild(BDFDB.DOMUtils.create(`<bd-head><bd-scripts></bd-scripts></bd-head>`));
					container = container || document.head.querySelector("bd-head bd-scripts") || document.head;
					container = Node.prototype.isPrototypeOf(container) ? container : document.head;
					BDFDB.DOMUtils.removeWebScript(url, container);
					let script = document.createElement("script");
					script.src = url;
					container.appendChild(script);
				};
				BDFDB.DOMUtils.removeWebScript = function (url, container) {
					if (typeof url != "string") return;
					container = container || document.head.querySelector("bd-head bd-scripts") || document.head;
					container = Node.prototype.isPrototypeOf(container) ? container : document.head;
					BDFDB.DOMUtils.remove(container.querySelectorAll(`script[src="${url}"]`));
				};
				BDFDB.DOMUtils.appendWebStyle = function (url, container) {
					if (typeof url != "string") return;
					if (!container && !document.head.querySelector("bd-head bd-styles")) document.head.appendChild(BDFDB.DOMUtils.create(`<bd-head><bd-styles></bd-styles></bd-head>`));
					container = container || document.head.querySelector("bd-head bd-styles") || document.head;
					container = Node.prototype.isPrototypeOf(container) ? container : document.head;
					BDFDB.DOMUtils.removeWebStyle(url, container);
					container.appendChild(BDFDB.DOMUtils.create(`<link type="text/css" rel="Stylesheet" href="${url}"></link>`));
				};
				BDFDB.DOMUtils.removeWebStyle = function (url, container) {
					if (typeof url != "string") return;
					container = container || document.head.querySelector("bd-head bd-styles") || document.head;
					container = Node.prototype.isPrototypeOf(container) ? container : document.head;
					BDFDB.DOMUtils.remove(container.querySelectorAll(`link[href="${url}"]`));
				};
				BDFDB.DOMUtils.appendLocalStyle = function (id, css, container) {
					if (typeof id != "string" || typeof css != "string") return;
					if (!container && !document.head.querySelector("bd-head bd-styles")) document.head.appendChild(BDFDB.DOMUtils.create(`<bd-head><bd-styles></bd-styles></bd-head>`));
					container = container || document.head.querySelector("bd-head bd-styles") || document.head;
					container = Node.prototype.isPrototypeOf(container) ? container : document.head;
					BDFDB.DOMUtils.removeLocalStyle(id, container);
					container.appendChild(BDFDB.DOMUtils.create(`<style id="${id}CSS">${css.replace(/\t|\r|\n/g,"")}</style>`));
				};
				BDFDB.DOMUtils.removeLocalStyle = function (id, container) {
					if (typeof id != "string") return;
					container = container || document.head.querySelector("bd-head bd-styles") || document.head;
					container = Node.prototype.isPrototypeOf(container) ? container : document.head;
					BDFDB.DOMUtils.remove(container.querySelectorAll(`style[id="${id}CSS"]`));
				};
				
				BDFDB.ModalUtils = {};
				BDFDB.ModalUtils.open = function (plugin, config) {
					if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ObjectUtils.is(config)) return;
					let modal, modalInstance, modalProps, cancels = [], closeModal = _ => {
						if (BDFDB.ObjectUtils.is(modalProps) && typeof modalProps.onClose == "function") modalProps.onClose();
					};
					let titleChildren = [], headerChildren = [], contentChildren = [], footerChildren = [];
					if (typeof config.text == "string") {
						contentChildren.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextElement, {
							children: config.text
						}));
					}
					if (config.children) {
						let tabBarItems = [];
						for (let child of [config.children].flat(10).filter(n => n)) if (LibraryModules.React.isValidElement(child)) {
							if (child.type == InternalComponents.LibraryComponents.ModalComponents.ModalTabContent) {
								if (!tabBarItems.length) child.props.open = true;
								else delete child.props.open;
								tabBarItems.push({value: child.props.tab});
							}
							contentChildren.push(child);
						}
						if (tabBarItems.length) headerChildren.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.disCN.tabbarcontainer,
							align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
							children: [
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TabBar, {
									className: BDFDB.disCN.tabbar,
									itemClassName: BDFDB.disCN.tabbaritem,
									type: InternalComponents.LibraryComponents.TabBar.Types.TOP,
									items: tabBarItems,
									onItemSelect: (value, instance) => {
										let tabContentInstances = BDFDB.ReactUtils.findOwner(modal, {name: "BDFDB_ModalTabContent", all: true, unlimited: true});
										for (let ins of tabContentInstances) {
											if (ins.props.tab == value) ins.props.open = true;
											else delete ins.props.open;
										}
										BDFDB.ReactUtils.forceUpdate(tabContentInstances);
									}
								}),
								config.tabBarChildren
							].flat(10).filter(n => n)
						}));
					}
					if (BDFDB.ArrayUtils.is(config.buttons)) for (let button of config.buttons) {
						let contents = typeof button.contents == "string" && button.contents;
						if (contents) {
							let color = typeof button.color == "string" && InternalComponents.LibraryComponents.Button.Colors[button.color.toUpperCase()];
							let look = typeof button.look == "string" && InternalComponents.LibraryComponents.Button.Looks[button.look.toUpperCase()];
							let click = typeof button.click == "function" ? button.click : (typeof button.onClick == "function" ? button.onClick : _ => {});
							
							if (button.cancel) cancels.push(click);
							
							footerChildren.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Button, BDFDB.ObjectUtils.exclude(Object.assign({}, button, {
								look: look || (color ? InternalComponents.LibraryComponents.Button.Looks.FILLED : InternalComponents.LibraryComponents.Button.Looks.LINK),
								color: color || InternalComponents.LibraryComponents.Button.Colors.PRIMARY,
								onClick: _ => {
									if (button.close) closeModal();
									if (!(button.close && button.cancel)) click(modal, modalInstance);
								},
								children: contents
							}), "click", "close", "cancel", "contents")));
						}
					}
					contentChildren = contentChildren.concat(config.contentChildren).filter(n => n && (typeof n == "string" || BDFDB.ReactUtils.isValidElement(n)));
					titleChildren = titleChildren.concat(config.titleChildren).filter(n => n && (typeof n == "string" || BDFDB.ReactUtils.isValidElement(n)));
					headerChildren = headerChildren.concat(config.headerChildren).filter(n => n && (typeof n == "string" || BDFDB.ReactUtils.isValidElement(n)));
					footerChildren = footerChildren.concat(config.footerChildren).filter(n => n && (typeof n == "string" || BDFDB.ReactUtils.isValidElement(n)));
					if (contentChildren.length) {
						if (typeof config.onClose != "function") config.onClose = _ => {};
						if (typeof config.onOpen != "function") config.onOpen = _ => {};
						
						let name = plugin.name || (typeof plugin.getName == "function" ? plugin.getName() : null);
						name = typeof name == "string" ? name : null;
						let oldTransitionState = 0;
						LibraryModules.ModalUtils.openModal(props => {
							modalProps = props;
							return BDFDB.ReactUtils.createElement(class BDFDB_Modal extends LibraryModules.React.Component {
								render() {
									return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalRoot, {
										className: BDFDB.DOMUtils.formatClassName(name && `${name}-modal`, BDFDB.disCN.modalwrapper, config.className),
										size: typeof config.size == "string" && InternalComponents.LibraryComponents.ModalComponents.ModalSize[config.size.toUpperCase()] || InternalComponents.LibraryComponents.ModalComponents.ModalSize.SMALL,
										transitionState: props.transitionState,
										children: [
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalHeader, {
												className: BDFDB.DOMUtils.formatClassName(config.headerClassName, config.shade && BDFDB.disCN.modalheadershade, headerChildren.length && BDFDB.disCN.modalheaderhassibling),
												separator: config.headerSeparator || false,
												children: [
													BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
														children: [
															BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormTitle, {
																tag: InternalComponents.LibraryComponents.FormComponents.FormTitle.Tags.H4,
																children: config.header
															}),
															BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextElement, {
																size: InternalComponents.LibraryComponents.TextElement.Sizes.SIZE_12,
																children: typeof config.subheader == "string" || BDFDB.ReactUtils.isValidElement(config.subheader) ? config.subheader : (name || "")
															})
														]
													}),
													titleChildren,
													BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalCloseButton, {
														onClick: closeModal
													})
												].flat(10).filter(n => n)
											}),
											headerChildren.length ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
												grow: 0,
												shrink: 0,
												children: headerChildren
											}) : null,
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalContent, {
												className: config.contentClassName,
												scroller: config.scroller,
												direction: config.direction,
												content: config.content,
												children: contentChildren
											}),
											footerChildren.length ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ModalComponents.ModalFooter, {
												className: config.footerClassName,
												direction: config.footerDirection,
												children: footerChildren
											}) : null
										]
									});
								}
								componentDidMount() {
									modalInstance = this;
									modal = BDFDB.ReactUtils.findDOMNode(this);
									modal = modal && modal.parentElement ? modal.parentElement.querySelector(BDFDB.dotCN.modalwrapper) : null;
									if (modal && props.transitionState == 1 && props.transitionState > oldTransitionState) config.onOpen(modal, this);
									oldTransitionState = props.transitionState;
								}
								componentWillUnmount() {
									if (modal && props.transitionState == 3) {
										for (let cancel of cancels) cancel(modal);
										config.onClose(modal, this);
									}
								}
							}, props, true);
						}, {
							onCloseRequest: closeModal
						});
					}
				};
				BDFDB.ModalUtils.confirm = function (plugin, text, callback) {
					if (!BDFDB.ObjectUtils.is(plugin) || typeof text != "string") return;
					BDFDB.ModalUtils.open(plugin, {text, header: "Are you sure?", className: BDFDB.disCN.modalconfirmmodal, scroller: false, buttons: [
						{contents: BDFDB.LanguageUtils.LanguageStrings.OKAY, close: true, color: "RED", click: typeof callback == "function" ? callback : _ => {}},
						{contents: BDFDB.LanguageUtils.LanguageStrings.CANCEL, close: true}
					]});
				};
			
				const RealMenuItems = BDFDB.ModuleUtils.findByProperties("MenuItem", "MenuGroup");
				BDFDB.ContextMenuUtils = {};
				BDFDB.ContextMenuUtils.open = function (plugin, e, children) {
					LibraryModules.ContextMenuUtils.openContextMenu(e, function (e) {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Menu, {
							navId: "bdfdb-context",
							onClose: BDFDB.LibraryModules.ContextMenuUtils.closeContextMenu,
							children: children
						}, true);
					});
				};
				BDFDB.ContextMenuUtils.close = function (nodeOrInstance) {
					if (!BDFDB.ObjectUtils.is(nodeOrInstance)) return;
					let instance = BDFDB.ReactUtils.findOwner(nodeOrInstance, {props: "closeContextMenu", up: true});
					if (BDFDB.ObjectUtils.is(instance) && instance.props && typeof instance.props.closeContextMenu == "function") instance.props.closeContextMenu();
					else BDFDB.LibraryModules.ContextMenuUtils.closeContextMenu();
				};
				BDFDB.ContextMenuUtils.createItem = function (component, props = {}) {
					if (!component) return null;
					else {
						if (props.persisting || BDFDB.ObjectUtils.is(props.popoutProps) || (typeof props.color == "string" && !DiscordClasses[`menu${props.color.toLowerCase()}`])) component = InternalComponents.MenuItem;
						if (BDFDB.ObjectUtils.toArray(RealMenuItems).some(c => c == component)) return BDFDB.ReactUtils.createElement(component, props);
						else return BDFDB.ReactUtils.createElement(RealMenuItems.MenuItem, {
							id: props.id,
							disabled: props.disabled,
							render: menuItemProps => {
								if (!props.state) props.state = BDFDB.ObjectUtils.extract(props, "checked", "value");
								return BDFDB.ReactUtils.createElement(InternalComponents.CustomMenuItemWrapper, {
									disabled: props.disabled,
									childProps: Object.assign({}, props, menuItemProps, {color: props.color}),
									children: component
								}, true);
							}
						});
					}
				};
				BDFDB.ContextMenuUtils.createItemId = function (...strings) {
					return strings.map(s => typeof s == "number" ? s.toString() : s).filter(s => typeof s == "string").map(s => s.toLowerCase().replace(/\s/, "-")).join("-");
				};
				BDFDB.ContextMenuUtils.findItem = function (returnvalue, config) {
					if (!returnvalue || !BDFDB.ObjectUtils.is(config) || !config.label && !config.id) return [null, -1];
					config.label = config.label && [config.label].flat().filter(n => n);
					config.id = config.id && [config.id].flat().filter(n => n);
					let contextMenu = BDFDB.ReactUtils.findChild(returnvalue, {props: "navId"});
					if (contextMenu) {
						for (let i in contextMenu.props.children) {
							if (contextMenu.props.children[i] && contextMenu.props.children[i].type == RealMenuItems.MenuGroup) {
								if (BDFDB.ArrayUtils.is(contextMenu.props.children[i].props.children)) {
									for (let j in contextMenu.props.children[i].props.children) if (check(contextMenu.props.children[i].props.children[j])) {
										if (config.group) return [contextMenu.props.children, parseInt(i)];
										else return [contextMenu.props.children[i].props.children, parseInt(j)];
									}
								}
								else if (contextMenu.props.children[i] && contextMenu.props.children[i].props) {
									if (check(contextMenu.props.children[i].props.children)) {
										if (config.group) return [contextMenu.props.children, parseInt(i)];
										else {
											contextMenu.props.children[i].props.children = [contextMenu.props.children[i].props.children];
											return [contextMenu.props.children[i].props.children, 0];
										}
									}
									else if (contextMenu.props.children[i].props.children && contextMenu.props.children[i].props.children.props && BDFDB.ArrayUtils.is(contextMenu.props.children[i].props.children.props.children)) {
										for (let j in contextMenu.props.children[i].props.children.props.children) if (check(contextMenu.props.children[i].props.children.props.children[j])) {
											if (config.group) return [contextMenu.props.children, parseInt(i)];
											else return [contextMenu.props.children[i].props.children.props.children, parseInt(j)];
										}
									}
								}
							}
							else if (check(contextMenu.props.children[i])) return [contextMenu.props.children, parseInt(i)];
						}
						return [contextMenu.props.children, -1];
					}
					return [null, -1];
					function check (child) {
						if (!child) return false;
						let props = child.stateNode ? child.stateNode.props : child.props;
						if (!props) return false;
						return config.id && config.id.some(key => props.id == key) || config.label && config.label.some(key => props.label == key);
					}
				};

				BDFDB.StringUtils = {};
				BDFDB.StringUtils.htmlEscape = function (string) {
					let ele = document.createElement("div");
					ele.innerText = string;
					return ele.innerHTML;
				};
				BDFDB.StringUtils.regEscape = function (string) {
					return typeof string == "string" && string.replace(/([\-\/\\\^\$\*\+\?\.\(\)\|\[\]\{\}])/g, "\\$1");
				};
				BDFDB.StringUtils.insertNRST = function (string) {
					return typeof string == "string" && string.replace(/\\r/g, "\r").replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\s/g, " ");
				};
				BDFDB.StringUtils.highlight = function (string, searchstring, prefix = `<span class="${BDFDB.disCN.highlight}">`, suffix = `</span>`) {
					if (typeof string != "string" || !searchstring || searchstring.length < 1) return string;
					let offset = 0, original = string;
					BDFDB.ArrayUtils.getAllIndexes(string.toUpperCase(), searchstring.toUpperCase()).forEach(index => {
						let d1 = offset * (prefix.length + suffix.length);
						index = index + d1;
						let d2 = index + searchstring.length;
						let d3 = [-1].concat(BDFDB.ArrayUtils.getAllIndexes(string.substring(0, index), "<"));
						let d4 = [-1].concat(BDFDB.ArrayUtils.getAllIndexes(string.substring(0, index), ">"));
						if (d3[d3.length - 1] > d4[d4.length - 1]) return;
						string = string.substring(0, index) + prefix + string.substring(index, d2) + suffix + string.substring(d2);
						offset++;
					});
					return string || original;
				};
				BDFDB.StringUtils.findMatchCaseless = function (match, string, any) {
					if (typeof match != "string" || typeof string != "string" || !match || !string) return "";
					match = BDFDB.StringUtils.regEscape(match);
					let exec = (new RegExp(any ? `([\\n\\r\\s]+${match})|(^${match})` : `([\\n\\r\\s]+${match}[\\n\\r\\s]+)|([\\n\\r\\s]+${match}$)|(^${match}[\\n\\r\\s]+)|(^${match}$)`, "i")).exec(string);
					return exec && typeof exec[0] == "string" && exec[0].replace(/[\n\r\s]/g, "") || "";
				};
				BDFDB.StringUtils.extractSelection = function (original, selection) {
					if (typeof original != "string") return "";
					if (typeof selection != "string") return original;
					let s = [], f = [], wrong = 0, canceled = false, done = false;
					for (let i of BDFDB.ArrayUtils.getAllIndexes(original, selection[0])) if (!done) {
						while (i <= original.length && !done) {
							let subSelection = selection.slice(s.filter(n => n != undefined).length);
							if (!subSelection && s.length - 20 <= selection.length) done = true;
							else for (let j in subSelection) if (!done && !canceled) {
								if (original[i] == subSelection[j]) {
									s[i] = subSelection[j];
									f[i] = subSelection[j];
									wrong = 0;
									if (i == original.length) done = true;
								}
								else {
									s[i] = null;
									f[i] = original[i];
									wrong++;
									if (wrong > 4) {
										s = [], f = [], wrong = 0, canceled = true;
										break;
									}
								}
								break;
							}
							canceled = false;
							i++;
						}
					}
					if (s.filter(n => n).length) {
						let reverseS = [].concat(s).reverse(), i = 0, j = 0;
						for (let k in s) {
							if (s[k] == null) i = parseInt(k) + 1;
							else break;
						}
						for (let k in reverseS) {
							if (reverseS[k] == null) j = parseInt(k) + 1;
							else break;
						}
						return f.slice(i, f.length - j).join("");
					}
					else return original;
				};
				
				BDFDB.SlateUtils = {};
				BDFDB.SlateUtils.isRichValue = function (richValue) {
					return BDFDB.ObjectUtils.is(richValue) && LibraryModules.SlateUtils.deserialize("").constructor.prototype.isPrototypeOf(richValue);
				};
				BDFDB.SlateUtils.copyRichValue = function (string, richValue) {
					let newRichValue = LibraryModules.SlateUtils.deserialize(string);
					if (BDFDB.SlateUtils.isRichValue(richValue) && richValue._map && richValue._map._root && BDFDB.ArrayUtils.is(richValue._map._root.entries)) {
						for (let i in richValue._map._root.entries) if (richValue._map._root.entries[i][0] == "selection") {
							newRichValue._map._root.entries[i] = richValue._map._root.entries[i];
							break;
						}
					}
					return newRichValue;
				};
				BDFDB.SlateUtils.hasOpenPlainTextCodeBlock = function (editor) {
					let richValue = BDFDB.ObjectUtils.get(editor, "props.richValue");
					if (!BDFDB.SlateUtils.isRichValue(richValue)) return false;
					let codeMatches = BDFDB.LibraryModules.SlateSelectionUtils.serializeSelection(richValue.document, {
						start: {
							key: richValue.document.getFirstText().key,
							offset: 0
						},
						end: richValue.selection.start
					}, "raw").match(/```/g);
					return codeMatches && codeMatches.length && codeMatches.length % 2 != 0;
				};
				BDFDB.SlateUtils.getCurrentWord = function (editor) {
					let richValue = BDFDB.ObjectUtils.get(editor, "props.richValue");
					if (!BDFDB.SlateUtils.isRichValue(richValue) || !richValue.selection.isCollapsed || BDFDB.SlateUtils.hasOpenPlainTextCodeBlock(editor) || richValue.document.text.trim().length == 0) return {word: null, isAtStart: false};
					if (editor.props.useSlate) {
						if (richValue.document.text.startsWith("/giphy ") || richValue.document.text.startsWith("/tenor ")) {
							let node = richValue.document.getNode(richValue.selection.start.key);
							if (node) return {
								word: node.text.substring(0, richValue.selection.start.offset),
								isAtStart: true
							}
						}
						let node = richValue.document.getNode(richValue.selection.start.key);
						if (node == null) return {
							word: null,
							isAtStart: false
						};
						let word = "", atStart = false;
						let offset = richValue.selection.start.offset;
						let block = richValue.document.getClosestBlock(node.key);
						while (true) {
							if (--offset < 0) {
								if ((node = block.getPreviousNode(node.key) == null)) {
									atStart = true;
									break;
								}
								if (node.object!== "text") break;
								offset = node.text.length - 1;
							}
							if (node.object !== "text") break;
							let prefix = node.text[offset];
							if (/(\t|\s)/.test(prefix)) break;
							word = prefix + word;
						}
						return {
							word: !word ? null : word,
							isAtStart: atStart && block.type == "line" && richValue.document.nodes.get(0) === block
						};
					}
					else {
						let textarea = BDFDB.ReactUtils.findDOMNode(editor.ref.current);
						if (!Node.prototype.isPrototypeOf(textarea) || textarea.tagName != "TEXTAREA" || !textarea.value.length || /\s/.test(textarea.value.slice(textarea.selectionStart, textarea.selectionEnd))) return {
							word: null,
							isAtStart: true
						};
						else {
							if (textarea.selectionEnd == textarea.value.length) {
								let words = textarea.value.split(/\s/).reverse();
								return {
									word: !words[0] ? null : words[0],
									isAtStart: words.length > 1
								};
							}
							else {
								let chars = textarea.value.split(""), word = "", currentWord = "", isCurrentWord = false, isAtStart = true;
								for (let i in chars) {
									if (i == textarea.selectionStart) isCurrentWord = true;
									if (/\s/.test(chars[i])) {
										word = "";
										isAtStart = currentWord.length > 0 && isAtStart || false;
										isCurrentWord = false;
									}
									else {
										word += chars[i];
										if (isCurrentWord) currentWord = word;
									}
								}
								return {
									word: !currentWord ? null : currentWord,
									isAtStart: isAtStart
								};
							}
						}
					}
				};
				
				BDFDB.NumberUtils = {};
				BDFDB.NumberUtils.formatBytes = function (bytes, sigDigits) {
					bytes = parseInt(bytes);
					if (isNaN(bytes) || bytes < 0) return "0 Bytes";
					if (bytes == 1) return "1 Byte";
					let size = Math.floor(Math.log(bytes) / Math.log(1024));
					return parseFloat((bytes / Math.pow(1024, size)).toFixed(sigDigits < 1 ? 0 : sigDigits > 20 ? 20 : sigDigits || 2)) + " " + ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"][size];
				};
				BDFDB.NumberUtils.mapRange = function (from, to, value) {
					if (parseFloat(value) < parseFloat(from[0])) return parseFloat(to[0]);
					else if (parseFloat(value) > parseFloat(from[1])) return parseFloat(to[1]);
					else return parseFloat(to[0]) + (parseFloat(value) - parseFloat(from[0])) * (parseFloat(to[1]) - parseFloat(to[0])) / (parseFloat(from[1]) - parseFloat(from[0]));
				};
				BDFDB.NumberUtils.generateId = function (array) {
					array = BDFDB.ArrayUtils.is(array) ? array : [];
					let id = Math.floor(Math.random() * 10000000000000000);
					if (array.includes(id)) return BDFDB.NumberUtils.generateId(array);
					else {
						array.push(id);
						return id;
					}
				};
				BDFDB.NumberUtils.compareVersions = function (newV, oldV) {
					if (!newV || !oldV) return true;
					newV = newV.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
					oldV = oldV.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
					let length = Math.max(newV.length, oldV.length);
					if (!length) return true;
					if (newV.length > oldV.length) {
						let tempArray = new Array(newV.length - oldV.length);
						for (let i = 0; i < tempArray.length; i++) tempArray[i] = 0;
						oldV = tempArray.concat(oldV);
					}
					else if (newV.length < oldV.length) {
						let tempArray = new Array(oldV.length - newV.length);
						for (let i = 0; i < tempArray.length; i++) tempArray[i] = 0;
						newV = tempArray.concat(newV);
					}
					for (let i = 0; i < length; i++) for (let iOutdated = false, j = 0; j <= i; j++) {
						if (j == i && newV[j] < oldV[j]) return false;
						if (j < i) iOutdated = newV[j] == oldV[j];
						if ((j == 0 || iOutdated) && j == i && newV[j] > oldV[j]) return true;
					}
					return false;
				};
				BDFDB.NumberUtils.getVersionDifference = function (newV, oldV) {
					if (!newV || !oldV) return false;
					newV = newV.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
					oldV = oldV.toString().replace(/["'`]/g, "").split(/,|\./g).map(n => parseInt(n)).filter(n => (n || n == 0) && !isNaN(n));
					let length = Math.max(newV.length, oldV.length);
					if (!length) return false;
					if (newV.length > oldV.length) {
						let tempArray = new Array(newV.length - oldV.length);
						for (let i = 0; i < tempArray.length; i++) tempArray[i] = 0;
						oldV = tempArray.concat(oldV);
					}
					else if (newV.length < oldV.length) {
						let tempArray = new Array(oldV.length - newV.length);
						for (let i = 0; i < tempArray.length; i++) tempArray[i] = 0;
						newV = tempArray.concat(newV);
					}
					let oldvValue = 0, newValue = 0;
					for (let i in oldV.reverse()) oldvValue += (oldV[i] * (10 ** i));
					for (let i in newV.reverse()) newValue += (newV[i] * (10 ** i));
					return (newValue - oldvValue) / (10 ** (length-1));
				};

				BDFDB.DiscordUtils = {};
				BDFDB.DiscordUtils.openLink = function (url, inbuilt, minimized) {
					if (!inbuilt) window.open(url, "_blank");
					else {
						let browserWindow = new LibraryRequires.electron.remote.BrowserWindow({
							frame: true,
							resizeable: true,
							show: true,
							darkTheme: BDFDB.DiscordUtils.getTheme() == BDFDB.disCN.themedark,
							webPreferences: {
								nodeIntegration: false,
								nodeIntegrationInWorker: false
							}
						});
						browserWindow.setMenu(null);
						browserWindow.loadURL(url);
						if (minimized) browserWindow.minimize(null);
					}
				};
				BDFDB.DiscordUtils.getFolder = function () {
					var built = BDFDB.DiscordUtils.getBuilt();
					built = "discord" + (built == "stable" ? "" : built);
					return LibraryRequires.path.resolve(LibraryRequires.electron.remote.app.getPath("appData"), built, BDFDB.DiscordUtils.getVersion());
				};
				BDFDB.DiscordUtils.getBuilt = function () {
					if (BDFDB.DiscordUtils.getBuilt.built) return BDFDB.DiscordUtils.getBuilt.built;
					else {
						var built = null;
						try {built = require(LibraryRequires.electron.remote.app.getAppPath() + "/build_info.json").releaseChannel.toLowerCase();} 
						catch (err) {
							try {built = require(LibraryRequires.electron.remote.app.getAppPath().replace("\app.asar", "") + "/build_info.json").releaseChannel.toLowerCase();} 
							catch (err) {
								var version = BDFDB.DiscordUtils.getVersion();
								if (version) {
									version = version.split(".");
									if (version.length == 3 && !isNaN(version = parseInt(version[2]))) built = version > 300 ? "stable" : da > 200 ? "canary" : "ptb";
									else built = "stable";
								}
								else built = "stable";
							}
						}
						BDFDB.DiscordUtils.getBuilt.built = built;
						return built;
					}
				};
				BDFDB.DiscordUtils.getVersion = function () {
					if (BDFDB.DiscordUtils.getBuilt.version) return BDFDB.DiscordUtils.getBuilt.version;
					else {
						let version = null;
						try {version = LibraryRequires.electron.remote.app.getVersion();}
						catch (err) {version = "";}
						BDFDB.DiscordUtils.getBuilt.version = version;
						return version;
					}
				};
				BDFDB.DiscordUtils.isDevModeEnabled = function () {
					return (LibraryModules.StoreChangeUtils.get("UserSettingsStore") || {}).developerMode;
				};
				BDFDB.DiscordUtils.getTheme = function () {
					return (LibraryModules.StoreChangeUtils.get("UserSettingsStore") || {}).theme != "dark" ? BDFDB.disCN.themelight : BDFDB.disCN.themedark;
				};
				BDFDB.DiscordUtils.getMode = function () {
					return (LibraryModules.StoreChangeUtils.get("UserSettingsStore") || {}).message_display_compact ? "compact" : "cozy";
				};
				BDFDB.DiscordUtils.getZoomFactor = function () {
					let aRects = BDFDB.DOMUtils.getRects(document.querySelector(BDFDB.dotCN.appmount));
					let widthZoom = Math.round(100 * window.outerWidth / aRects.width);
					let heightZoom = Math.round(100 * window.outerHeight / aRects.height);
					return widthZoom < heightZoom ? widthZoom : heightZoom;
				};
				BDFDB.DiscordUtils.getFontScale = function () {
					return parseInt(document.firstElementChild.style.fontSize.replace("%", ""));
				};
				BDFDB.DiscordUtils.shake = function () {
					BDFDB.ReactUtils.getInstance(document.querySelector(BDFDB.dotCN.appold)).return.stateNode.shake();
				};

				BDFDB.WindowUtils = {};
				BDFDB.WindowUtils.open = function (plugin, url, options = {}) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !url) return;
					if (!BDFDB.ArrayUtils.is(plugin.browserWindows)) plugin.browserWindows = [];
					let config = Object.assign({
						show: false,
						webPreferences: {
							nodeIntegration: true,
							nodeIntegrationInWorker: true
						}
					}, options);
					let browserWindow = new LibraryRequires.electron.remote.BrowserWindow(BDFDB.ObjectUtils.exclude(config, "showOnReady", "onLoad"));
					
					if (!config.show && config.showOnReady) browserWindow.once("ready-to-show", browserWindow.show);
					if (config.devTools) browserWindow.openDevTools();
					if (typeof config.onLoad == "function") browserWindow.webContents.on("did-finish-load", (...args) => {config.onLoad(...args);});
					if (typeof config.onClose == "function") browserWindow.once("closed", (...args) => {config.onClose(...args);});
					
					if (typeof browserWindow.removeMenu == "function") browserWindow.removeMenu();
					else browserWindow.setMenu(null);
					browserWindow.loadURL(url);
					browserWindow.executeJavaScriptSafe = js => {if (!browserWindow.isDestroyed()) browserWindow.webContents.executeJavaScript(`(_ => {${js}})();`);};
					plugin.browserWindows.push(browserWindow);
					return browserWindow;
				};
				BDFDB.WindowUtils.close = function (browserWindow) {
					if (BDFDB.ObjectUtils.is(browserWindow) && !browserWindow.isDestroyed() && browserWindow.isClosable()) browserWindow.close();
				};
				BDFDB.WindowUtils.closeAll = function (plugin) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.browserWindows)) return;
					while (plugin.browserWindows.length) BDFDB.WindowUtils.close(plugin.browserWindows.pop());
				};
				BDFDB.WindowUtils.addListener = function (plugin, actions, callback) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !actions || typeof callback != "function") return;
					BDFDB.WindowUtils.removeListener(plugin, actions);
					for (let action of actions.split(" ")) {
						action = action.split(".");
						let eventName = action.shift();
						if (!eventName) return;
						let namespace = (action.join(".") || "") + plugin.name;
						if (!BDFDB.ArrayUtils.is(plugin.ipcListeners)) plugin.ipcListeners = [];

						plugin.ipcListeners.push({eventName, namespace, callback});
						LibraryRequires.electron.ipcRenderer.on(eventName, callback);
					}
				};
				BDFDB.WindowUtils.removeListener = function (plugin, actions = "") {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (!BDFDB.ObjectUtils.is(plugin) || !BDFDB.ArrayUtils.is(plugin.ipcListeners)) return;
					if (actions) {
						for (let action of actions.split(" ")) {
							action = action.split(".");
							let eventName = action.shift();
							let namespace = (action.join(".") || "") + plugin.name;
							for (let listener of plugin.ipcListeners) {
								let removedListeners = [];
								if (listener.eventName == eventName && listener.namespace == namespace) {
									LibraryRequires.electron.ipcRenderer.off(listener.eventName, listener.callback);
									removedListeners.push(listener);
								}
								if (removedListeners.length) plugin.ipcListeners = plugin.ipcListeners.filter(listener => {return removedListeners.indexOf(listener) < 0;});
							}
						}
					}
					else {
						for (let listener of plugin.ipcListeners) LibraryRequires.electron.ipcRenderer.off(listener.eventName, listener.callback);
						plugin.ipcListeners = [];
					}
				};
				
				const DiscordClassModules = Object.assign({}, InternalData.CustomClassModules);
				for (let name in InternalData.DiscordClassModules) {
					if (InternalData.DiscordClassModules[name].length) DiscordClassModules[name] = BDFDB.ModuleUtils.find(m => InternalData.DiscordClassModules[name].props.every(prop => typeof m[prop] == "string") && (InternalData.DiscordClassModules[name].smaller ? Object.keys(m).length < InternalData.DiscordClassModules[name].length : Object.keys(m).length == InternalData.DiscordClassModules[name].length));
					else DiscordClassModules[name] = BDFDB.ModuleUtils.findByProperties(InternalData.DiscordClassModules[name].props);
				}
				BDFDB.DiscordClassModules = Object.assign({}, DiscordClassModules);
				
				const DiscordClasses = Object.assign({}, InternalData.DiscordClasses);
				BDFDB.DiscordClasses = Object.assign({}, DiscordClasses);
				InternalBDFDB.getDiscordClass = function (item, selector) {
					let className = fallbackClassName = DiscordClassModules.BDFDB.BDFDBundefined + "-" + InternalBDFDB.generateClassId();
					if (DiscordClasses[item] === undefined) {
						BDFDB.LogUtils.warn(item + " not found in DiscordClasses");
						return className;
					} 
					else if (!BDFDB.ArrayUtils.is(DiscordClasses[item]) || DiscordClasses[item].length != 2) {
						BDFDB.LogUtils.warn(item + " is not an Array of Length 2 in DiscordClasses");
						return className;
					}
					else if (DiscordClassModules[DiscordClasses[item][0]] === undefined) {
						BDFDB.LogUtils.warn(DiscordClasses[item][0] + " not found in DiscordClassModules");
						return className;
					}
					else if ([DiscordClasses[item][1]].flat().every(prop => DiscordClassModules[DiscordClasses[item][0]][prop] === undefined)) {
						BDFDB.LogUtils.warn(DiscordClasses[item][1] + " not found in " + DiscordClasses[item][0] + " in DiscordClassModules");
						return className;
					}
					else {
						for (let prop of [DiscordClasses[item][1]].flat()) {
							className = DiscordClassModules[DiscordClasses[item][0]][prop];
							if (className) break;
							else className = fallbackClassName;
						}
						if (selector) {
							className = className.split(" ").filter(n => n.indexOf("da-") != 0).join(selector ? "." : " ");
							className = className || fallbackClassName;
						}
						else {
							if (BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds.normalizedClasses)) className = className.split(" ").filter(n => n.indexOf("da-") != 0).map(n => n.replace(/^([A-z0-9]+?)-([A-z0-9_-]{6})$/g, "$1-$2 da-$1")).join(" ");
						}
						return BDFDB.ArrayUtils.removeCopies(className.split(" ")).join(" ") || fallbackClassName;
					}
				};
				const generationChars = "0123456789ABCDEFGHIJKMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_".split("");
				InternalBDFDB.generateClassId = function () {
					let id = "";
					while (id.length < 6) id += generationChars[Math.floor(Math.random() * generationChars.length)];
					return id;
				};
				BDFDB.disCN = new Proxy(DiscordClasses, {
					get: function (list, item) {
						return InternalBDFDB.getDiscordClass(item, false).replace("#", "");
					}
				});
				BDFDB.disCNS = new Proxy(DiscordClasses, {
					get: function (list, item) {
						return InternalBDFDB.getDiscordClass(item, false).replace("#", "") + " ";
					}
				});
				BDFDB.disCNC = new Proxy(DiscordClasses, {
					get: function (list, item) {
						return InternalBDFDB.getDiscordClass(item, false).replace("#", "") + ",";
					}
				});
				BDFDB.dotCN = new Proxy(DiscordClasses, {
					get: function (list, item) {
						let className = InternalBDFDB.getDiscordClass(item, true);
						return (className.indexOf("#") == 0 ? "" : ".") + className;
					}
				});
				BDFDB.dotCNS = new Proxy(DiscordClasses, {
					get: function (list, item) {
						let className = InternalBDFDB.getDiscordClass(item, true);
						return (className.indexOf("#") == 0 ? "" : ".") + className + " ";
					}
				});
				BDFDB.dotCNC = new Proxy(DiscordClasses, {
					get: function (list, item) {
						let className = InternalBDFDB.getDiscordClass(item, true);
						return (className.indexOf("#") == 0 ? "" : ".") + className + ",";
					}
				});
				BDFDB.notCN = new Proxy(DiscordClasses, {
					get: function (list, item) {
						return `:not(.${InternalBDFDB.getDiscordClass(item, true).split(".")[0]})`;
					}
				});
				BDFDB.notCNS = new Proxy(DiscordClasses, {
					get: function (list, item) {
						return `:not(.${InternalBDFDB.getDiscordClass(item, true).split(".")[0]}) `;
					}
				});
				BDFDB.notCNC = new Proxy(DiscordClasses, {
					get: function (list, item) {
						return `:not(.${InternalBDFDB.getDiscordClass(item, true).split(".")[0]}),`;
					}
				});
			
				const LanguageStrings = LibraryModules.LanguageStore && LibraryModules.LanguageStore._proxyContext ? Object.assign({}, LibraryModules.LanguageStore._proxyContext.defaultMessages) : {};
				const LibraryStrings = Object.assign({}, InternalData.LibraryStrings);
				BDFDB.LanguageUtils = {};
				BDFDB.LanguageUtils.languages = Object.assign({}, InternalData.Languages);
				BDFDB.LanguageUtils.getLanguage = function () {
					let lang = LibraryModules.LanguageStore.chosenLocale || "en";
					if (lang == "en-GB" || lang == "en-US") lang = "en";
					let langIds = lang.split("-");
					let langId = langIds[0];
					let langId2 = langIds[1] || "";
					lang = langId2 && langId.toUpperCase() !== langId2.toUpperCase() ? langId + "-" + langId2 : langId;
					return BDFDB.LanguageUtils.languages[lang] || BDFDB.LanguageUtils.languages[langId] || BDFDB.LanguageUtils.languages["en"];
				};
				BDFDB.LanguageUtils.LanguageStrings = new Proxy(LanguageStrings, {
					get: function (list, item) {
						let stringObj = LibraryModules.LanguageStore.Messages[item];
						if (!stringObj) BDFDB.LogUtils.warn(item + " not found in BDFDB.LanguageUtils.LanguageStrings");
						else {
							if (stringObj && typeof stringObj == "object" && typeof stringObj.format == "function") return BDFDB.LanguageUtils.LanguageStringsFormat(item);
							else return stringObj;
						}
						return "";
					}
				});
				BDFDB.LanguageUtils.LanguageStringsCheck = new Proxy(LanguageStrings, {
					get: function (list, item) {
						return !!LibraryModules.LanguageStore.Messages[item];
					}
				});
				let parseLanguageStringObj = obj => {
					let string = "";
					if (typeof obj == "string") string += obj;
					else if (BDFDB.ObjectUtils.is(obj)) {
						if (obj.props) string += parseLanguageStringObj(obj.props);
						else if (obj.type) {
							let text = obj.content || obj.children && obj.children[0] && obj.children[0].toString() || "";
							if (text) {
								if (obj.type == "text" || obj.content) string = parseLanguageStringObj(text);
								else string += `<${obj.type}>${parseLanguageStringObj(text)}</${obj.type}>`;
							}
						}
					}
					else if (BDFDB.ArrayUtils.is(obj)) for (let ele of obj) string += parseLanguageStringObj(ele);
					return string;
				};
				BDFDB.LanguageUtils.LanguageStringsFormat = function (item, ...values) {
					if (item) {
						let stringObj = LibraryModules.LanguageStore.Messages[item];
						if (stringObj && typeof stringObj == "object" && typeof stringObj.format == "function") {
							let i = 0, returnvalue, formatVars = {};
							while (!returnvalue && i < 10) {
								i++;
								try {returnvalue = stringObj.format(formatVars, false);}
								catch (err) {
									returnvalue = null;
									let value = values.shift();
									formatVars[err.toString().split("for: ")[1]] = value != null ? (value === 0 ? "0" : value) : "undefined";
								}
							}
							if (returnvalue) return parseLanguageStringObj(returnvalue);
							else {
								BDFDB.LogUtils.warn(item + " failed to format string in BDFDB.LanguageUtils.LanguageStrings");
								return "";
							}
						}
						else return BDFDB.LanguageUtils.LanguageStrings[item];
					}
					else BDFDB.LogUtils.warn(item + " enter a valid key to format the string in BDFDB.LanguageUtils.LanguageStrings");
					return "";
				};
				BDFDB.LanguageUtils.LibraryStrings = new Proxy(LibraryStrings.default || {}, {
					get: function (list, item) {
						let languageId = BDFDB.LanguageUtils.getLanguage().id;
						if (LibraryStrings[languageId] && LibraryStrings[languageId][item]) return LibraryStrings[languageId][item];
						else if (LibraryStrings.default[item]) return LibraryStrings.default[item];
						else BDFDB.LogUtils.warn(item + " not found in BDFDB.LanguageUtils.LibraryStrings");
						return "";
					}
				});
				BDFDB.LanguageUtils.LibraryStringsCheck = new Proxy(LanguageStrings, {
					get: function (list, item) {
						return !!LibraryStrings.default[item];
					}
				});
				BDFDB.LanguageUtils.LibraryStringsFormat = function (item, ...values) {
					if (item && values.length) {
						let languageId = BDFDB.LanguageUtils.getLanguage().id, string = null;
						if (LibraryStrings[languageId] && LibraryStrings[languageId][item]) string = LibraryStrings[languageId][item];
						else if (LibraryStrings.default[item]) string = LibraryStrings.default[item];
						if (string) {
							for (let i = 0; i < values.length; i++) if (typeof values[i] == "string") string = string.replace(new RegExp(`{{var${i}}}`, "g"), values[i]);
							return string;
						}
						else BDFDB.LogUtils.warn(item + " not found in BDFDB.LanguageUtils.LibraryStrings");
					}
					else BDFDB.LogUtils.warn(item + " enter a valid key and at least one value to format the string in BDFDB.LanguageUtils.LibraryStrings");
					return "";
				};
				BDFDB.TimeUtils.interval(interval => {
					if (LibraryModules.LanguageStore.chosenLocale) {
						BDFDB.TimeUtils.clear(interval);
						let language = BDFDB.LanguageUtils.getLanguage();
						if (language) BDFDB.LanguageUtils.languages.$discord = Object.assign({}, language, {name: `Discord (${language.name})`});
					}
				}, 100);
				
				const reactInitialized = LibraryModules.React && LibraryModules.React.Component;
				InternalBDFDB.setDefaultProps = function (component, defaultProps) {
					if (BDFDB.ObjectUtils.is(component)) component.defaultProps = Object.assign({}, component.defaultProps, defaultProps);
				};
				let openedItem;
				InternalComponents.MenuItem = reactInitialized && class BDFDB_MenuItem extends LibraryModules.React.Component {
					constructor(props) {
						super(props);
						this.state = {hovered: false};
					}
					componentWillUnmount() {
						if (openedItem == this.props.id) openedItem = null;
					}
					render() {
						let color = (typeof this.props.color == "string" ? this.props.color : InternalComponents.LibraryComponents.MenuItems.Colors.DEFAULT).toLowerCase();
						let isCustomColor = false;
						if (color) {
							if (DiscordClasses[`menu${color}`]) color = color;
							else if (BDFDB.ColorUtils.getType(color)) {
								isCustomColor = true;
								color = BDFDB.ColorUtils.convert(color, "RGBA");
							}
							else color = (InternalComponents.LibraryComponents.MenuItems.Colors.DEFAULT || "").toLowerCase();
						}
						let renderPopout, onClose, hasPopout = BDFDB.ObjectUtils.is(this.props.popoutProps);
						if (hasPopout) {
							renderPopout = instance => {
								openedItem = this.props.id;
								return typeof this.props.popoutProps.renderPopout == "function" && this.props.popoutProps.renderPopout(instance);
							};
							onClose = instance => {
								openedItem = null;
								typeof this.props.popoutProps.onClose == "function" && this.props.popoutProps.onClose(instance);
							};
						}
						let focused = !openedItem ? this.props.isFocused : openedItem == this.props.id;
						let themeDark = BDFDB.DiscordUtils.getTheme() == BDFDB.disCN.themedark;
						let item = BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, Object.assign({
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.menuitem, BDFDB.disCN.menulabelcontainer, color && (isCustomColor ? BDFDB.disCN.menucolorcustom : BDFDB.disCN[`menu${color}`]), this.props.disabled && BDFDB.disCN.menudisabled, focused && BDFDB.disCN.menufocused),
							style: {
								color: isCustomColor ? ((focused || this.state.hovered) ? (BDFDB.ColorUtils.isBright(color) ? "#000000" : "#ffffff") : color) : (this.state.hovered ? "#ffffff" : null),
								background: isCustomColor && (focused || this.state.hovered) && color
							},
							onClick: this.props.disabled ? null : e => {
								if (!this.props.action) return false;
								!this.props.persisting && !hasPopout && this.props.onClose();
								this.props.action(e, this);
							},
							onMouseEnter: this.props.disabled ? null : e => {
								this.setState({hovered: true});
							},
							onMouseLeave: this.props.disabled ? null : e => {
								this.setState({hovered: false});
							},
							"aria-disabled": this.props.disabled,
							children: [
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.menulabel,
									children: [
										typeof this.props.label == "function" ? this.props.label(this) : this.props.label,
										this.props.subtext && BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.menusubtext,
											children: typeof this.props.subtext == "function" ? this.props.subtext(this) : this.props.subtext
										})
									].filter(n => n)
								}),
								this.props.hint && BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.menuhintcontainer,
									children: typeof this.props.hint == "function" ? this.props.hint(this) : this.props.hint
								}),
								this.props.icon && BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.menuiconcontainer,
									children: BDFDB.ReactUtils.createElement(this.props.icon, {
										className: BDFDB.disCN.menuicon,
									})
								}),
								this.props.imageUrl && BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.menuimagecontainer,
									children: BDFDB.ReactUtils.createElement("img", {
										className: BDFDB.disCN.menuimage,
										src: typeof this.props.imageUrl == "function" ? this.props.imageUrl(this) : this.props.imageUrl,
										alt: ""
									})
								})
							].filter(n => n)
						}, this.props.menuItemProps, {isFocused: focused}));
						return hasPopout ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.PopoutContainer, Object.assign({}, this.props.popoutProps, {
							children: item,
							renderPopout: renderPopout,
							onClose: onClose
						})) : item;
					}
				};
				InternalComponents.CustomMenuItemWrapper = reactInitialized && class BDFDB_CustomMenuItemWrapper extends LibraryModules.React.Component {
					constructor(props) {
						super(props);
						this.state = {hovered: false};
					}
					render() {
						return BDFDB.ReactUtils.createElement("div", {
							onMouseEnter: e => {
								this.setState({hovered: true});
							},
							onMouseLeave: e => {
								this.setState({hovered: false});
							},
							children: BDFDB.ReactUtils.createElement(this.props.children, Object.assign({}, this.props.childProps, {isFocused: this.state.hovered && !this.props.disabled}))
						});
					}
				};
				InternalComponents.ErrorBoundary = reactInitialized && class BDFDB_ErrorBoundary extends LibraryModules.React.PureComponent {
					constructor(props) {
						super(props);
						this.state = {hasError: false};
					}
					static getDerivedStateFromError(error) {
						return {hasError: true};
					}
					componentDidCatch(error, info) {
						BDFDB.LogUtils.error("Could not create react element! " + error);
					}
					render() {
						if (this.state.hasError) return LibraryModules.React.createElement("span", {
							style: {
								background: BDFDB.DiscordConstants && BDFDB.DiscordConstants.Colors && BDFDB.DiscordConstants.Colors.PRIMARY_DARK,
								borderRadius: 5,
								color: BDFDB.DiscordConstants && BDFDB.DiscordConstants.Colors && BDFDB.DiscordConstants.Colors.STATUS_RED,
								fontSize: 12,
								fontWeight: 600,
								padding: 6,
								textAlign: "center",
								verticalAlign: "center"
							},
							children: "React Component Error"
						});
						return this.props.children;
					}
				};
				
				for (let name in InternalData.NativeSubComponents) {
					if (InternalData.NativeSubComponents[name].name) {
						if (InternalData.NativeSubComponents[name].protos) InternalComponents.NativeSubComponents[name] = BDFDB.ModuleUtils.find(m => m && m.displayName == InternalData.NativeSubComponents[name].name && m.prototype && InternalData.NativeSubComponents[name].protos.every(proto => m.prototype[proto]));
						else InternalComponents.NativeSubComponents[name] = BDFDB.ModuleUtils.findByName(InternalData.NativeSubComponents[name].name);
					}
					else if (InternalData.NativeSubComponents[name].props) InternalComponents.NativeSubComponents[name] = BDFDB.ModuleUtils.findByProperties(InternalData.NativeSubComponents[name].props);
				}
				
				for (let name in InternalData.LibraryComponents) {
					let module;
					if (InternalData.LibraryComponents[name].name) module = BDFDB.ModuleUtils.findByName(InternalData.LibraryComponents[name].name);
					else if (InternalData.LibraryComponents[name].strings) module = BDFDB.ModuleUtils.findByString(InternalData.LibraryComponents[name].strings);
					else if (InternalData.LibraryComponents[name].props) module = BDFDB.ModuleUtils.findByProperties(InternalData.LibraryComponents[name].props);
					let child = name, parent = child.split(" "), components = InternalComponents.LibraryComponents;
					if (parent.length > 1) {
						child = parent[1], parent = parent[0];
						if (!InternalComponents.LibraryComponents[parent]) InternalComponents.LibraryComponents[parent] = {};
						components = InternalComponents.LibraryComponents[parent];
					}
					if (InternalData.LibraryComponents[name].value) module = (module || {})[InternalData.LibraryComponents[name].value];
					if (InternalData.LibraryComponents[name].assign) components[child] = Object.assign({}, module);
					else components[child] = module;
				}
				
				InternalComponents.LibraryComponents.AddonCard = reactInitialized && class BDFDB_AddonCard extends LibraryModules.React.Component {
					render() {
						if (!BDFDB.ObjectUtils.is(this.props.data)) return null;
						let controls = [].concat(this.props.controls).flat(10).filter(n => n);
						let links = [].concat(this.props.links).flat(10).filter(n => n);
						let buttons = [].concat(this.props.buttons).flat(10).filter(n => n);
						let meta = [
							!isBeta && " v",
							BDFDB.ReactUtils.createElement("span", {
								className: BDFDB.disCN._repoversion,
								children: isBeta ? `v${this.props.data.version}` : this.props.data.version
							}),
							" by ",
							BDFDB.ReactUtils.createElement("span", {
								className: BDFDB.disCN._repoauthor,
								children: this.props.data.author
							})
						].filter(n => n);
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN._repoentry, this.props.className, BDFDB.disCN._repocard, BDFDB.disCN._reposettingsclosed, BDFDB.disCN._repocheckboxitem),
							children: [
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN._repoheader,
									style: {overflow: "visible"},
									children: [
										isBeta && this.props.icon,
										BDFDB.ReactUtils.createElement("span", {
											className: BDFDB.disCN._repoheadertitle,
											children: [
												BDFDB.ReactUtils.createElement("span", {
													className: BDFDB.disCN._reponame,
													children: this.props.data.name
												}),
												isBeta ? BDFDB.ReactUtils.createElement("div", {
													className: BDFDB.disCN._repometa,
													children: meta
												}) : meta
											]
										}),
										controls.length && BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN._repoheadercontrols,
											children: controls
										})
									]
								}),
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN._repodescriptionwrap,
									children: BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN._repodescription,
										children: this.props.data.description && BDFDB.ReactUtils.markdownParse(this.props.data.description)
									})
								}),
								(links.length || buttons.length) && BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN._repofooter,
									children: [
										links.length && BDFDB.ReactUtils.createElement("span", {
											className: BDFDB.disCN._repolinks,
											children: links.map((data, i) => {
												if (!BDFDB.ObjectUtils.is(data)) return;
												let link = BDFDB.ReactUtils.createElement("a", {
													className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN._repolink, typeof data.label == "string" && BDFDB.disCN._repolink + "-" + data.label.toLowerCase().replace(/\s/g, "")),
													href: data.href,
													children: data.icon || data.label
												});
												if (!isBeta) return [
													i > 0 && " | ",
													link
												];
												else {
													let button = BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN._repocontrolsbutton,
														children: link,
														onClick: e => {
															if (typeof data.onClick == "function") {
																BDFDB.ListenerUtils.stopEvent(e);
																data.onClick();
															}
														}
													});
													return typeof data.label == "string" ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
														text: data.label,
														children: button
													}) : button;
												}
											}).flat(10).filter(n => n)
										}),
										buttons.length && BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN._repofootercontrols, isBeta && BDFDB.disCN._repocontrols),
											children: buttons
										})
									].flat(10).filter(n => n)
								})
							].filter(n => n)
						});
					}
				};
				
				InternalComponents.LibraryComponents.BadgeAnimationContainer = reactInitialized && class BDFDB_BadgeAnimationContainer extends LibraryModules.React.Component {
					componentDidMount() {BDFDB.ReactUtils.forceUpdate(this);}
					componentWillAppear(e) {if (typeof e == "function") e();}
					componentWillEnter(e) {if (typeof e == "function") e();}
					componentWillLeave(e) {if (typeof e == "function") this.timeoutId = setTimeout(e, 300);}
					componentWillUnmount() {clearTimeout(this.timeoutId)}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.div, {
							className: this.props.className,
							style: this.props.animatedStyle,
							children: this.props.children
						});
					}
				};
				
				InternalComponents.LibraryComponents.Badges = Object.assign({}, BDFDB.ModuleUtils.findByProperties("IconBadge", "NumberBadge"));
				InternalComponents.LibraryComponents.Badges.IconBadge = reactInitialized && class BDFDB_IconBadge extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.badgeiconbadge, this.props.className),
							style: Object.assign({
								backgroundColor: this.props.disableColor ? null : (this.props.color || BDFDB.DiscordConstants.Colors.STATUS_RED)
							}, this.props.style),
							children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
								className: BDFDB.disCN.badgeicon,
								name: this.props.icon
							})
						});
					}
				};
				
				InternalComponents.LibraryComponents.BotTag = reactInitialized && class BDFDB_BotTag extends LibraryModules.React.Component {
					handleClick(e) {if (typeof this.props.onClick == "function") this.props.onClick(e, this);}
					handleContextMenu(e) {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);}
					handleMouseEnter(e) {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);}
					handleMouseLeave(e) {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);}
					render() {
						return BDFDB.ReactUtils.createElement("span", {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, this.props.invertColor ? BDFDB.disCN.bottaginvert : BDFDB.disCN.bottagregular, this.props.useRemSizes ? BDFDB.disCN.bottagrem : BDFDB.disCN.bottagpx),
							style: this.props.style,
							onClick: this.handleClick.bind(this),
							onContextMenu: this.handleContextMenu.bind(this),
							onMouseEnter: this.handleMouseEnter.bind(this),
							onMouseLeave: this.handleMouseLeave.bind(this),
							children: BDFDB.ReactUtils.createElement("span", {
								className: BDFDB.disCN.bottagtext,
								children: this.props.tag || BDFDB.LanguageUtils.LanguageStrings.BOT_TAG_BOT
							})
						});
					}
				};
				
				InternalComponents.LibraryComponents.Button = reactInitialized && class BDFDB_Button extends LibraryModules.React.Component {
					handleClick(e) {if (typeof this.props.onClick == "function") this.props.onClick(e, this);}
					handleContextMenu(e) {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);}
					handleMouseDown(e) {if (typeof this.props.onMouseDown == "function") this.props.onMouseDown(e, this);}
					handleMouseUp(e) {if (typeof this.props.onMouseUp == "function") this.props.onMouseUp(e, this);}
					handleMouseEnter(e) {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);}
					handleMouseLeave(e) {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);}
					render() {
						let processingAndListening = (this.props.disabled || this.props.submitting) && (null != this.props.onMouseEnter || null != this.props.onMouseLeave);
						let props = BDFDB.ObjectUtils.exclude(this.props, "look", "color", "hover", "size", "fullWidth", "grow", "disabled", "submitting", "type", "style", "wrapperClassName", "className", "innerClassName", "onClick", "onContextMenu", "onMouseDown", "onMouseUp", "onMouseEnter", "onMouseLeave", "children", "rel");
						let button = BDFDB.ReactUtils.createElement("button", Object.assign({}, !this.props.disabled && !this.props.submitting && props, {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.button, this.props.look != null ? this.props.look : InternalComponents.LibraryComponents.Button.Looks.FILLED, this.props.color != null ? this.props.color : InternalComponents.LibraryComponents.Button.Colors.BRAND, this.props.hover, this.props.size != null ? this.props.size : InternalComponents.LibraryComponents.Button.Sizes.MEDIUM, processingAndListening && this.props.wrapperClassName, this.props.fullWidth && BDFDB.disCN.buttonfullwidth, (this.props.grow === undefined || this.props.grow) && BDFDB.disCN.buttongrow, this.props.hover && this.props.hover !== InternalComponents.LibraryComponents.Button.Hovers.DEFAULT && BDFDB.disCN.buttonhashover, this.props.submitting && BDFDB.disCN.buttonsubmitting),
							onClick: (this.props.disabled || this.props.submitting) ? e => {return e.preventDefault();} : this.handleClick.bind(this),
							onContextMenu: (this.props.disabled || this.props.submitting) ? e => {return e.preventDefault();} : this.handleContextMenu.bind(this),
							onMouseUp: !this.props.disabled && this.handleMouseDown.bind(this),
							onMouseDown: !this.props.disabled && this.handleMouseUp.bind(this),
							onMouseEnter: this.handleMouseEnter.bind(this),
							onMouseLeave: this.handleMouseLeave.bind(this),
							type: !this.props.type ? "button" : this.props.type,
							disabled: this.props.disabled,
							style: this.props.style,
							rel: this.props.rel,
							children: [
								this.props.submitting && !this.props.disabled ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Spinner, {
									type: InternalComponents.LibraryComponents.Spinner.Type.PULSING_ELLIPSIS,
									className: BDFDB.disCN.buttonspinner,
									itemClassName: BDFDB.disCN.buttonspinneritem
								}) : null,
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.buttoncontents, this.props.innerClassName),
									children: this.props.children
								})
							]
						}));
						return !processingAndListening ? button : BDFDB.ReactUtils.createElement("span", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.buttondisabledwrapper, this.props.wrapperClassName, this.props.size != null ? this.props.size : InternalComponents.LibraryComponents.Button.Sizes.MEDIUM, this.props.fullWidth && BDFDB.disCN.buttonfullwidth, (this.props.grow === undefined || this.props.grow) && BDFDB.disCN.buttongrow),
							children: [
								button,
								BDFDB.ReactUtils.createElement("span", {
									onMouseEnter: this.handleMouseEnter.bind(this),
									onMouseLeave: this.handleMouseLeave.bind(this),
									className: BDFDB.disCN.buttondisabledoverlay
								})
							]
						});
					}
				};
				
				InternalComponents.LibraryComponents.Card = reactInitialized && class BDFDB_Card extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement("div", BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.hovercardwrapper, this.props.horizontal && BDFDB.disCN.hovercardhorizontal, this.props.backdrop && BDFDB.disCN.hovercard, this.props.className),
							onMouseEnter: e => {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);},
							onMouseLeave: e => {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);},
							onClick: e => {if (typeof this.props.onClick == "function") this.props.onClick(e, this);},
							onContextMenu: e => {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);},
							children: [
								!this.props.noRemove ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.CardRemoveButton, {
									onClick: e => {
										if (typeof this.props.onRemove == "function") this.props.onRemove(e, this);
										BDFDB.ListenerUtils.stopEvent(e);
									}
								}) : null,
								typeof this.props.children == "string" ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextElement, {
									className: BDFDB.disCN.hovercardinner,
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextScroller, {children: this.props.children})
								}) : this.props.children
							].flat(10).filter(n => n)
						}), "backdrop", "horizontal", "noRemove"));
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.Card, {backdrop: true, noRemove: false});
				
				InternalComponents.LibraryComponents.ChannelTextAreaButton = reactInitialized && class BDFDB_ChannelTextAreaButton extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Button, {
							look: InternalComponents.LibraryComponents.Button.Looks.BLANK,
							size: InternalComponents.LibraryComponents.Button.Sizes.NONE,
							"aria-label": this.props.label,
							tabIndex: this.props.tabIndex,
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.textareabuttonwrapper, this.props.isActive && BDFDB.disCN.textareabuttonactive),
							innerClassName: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.textareabutton, this.props.className, this.props.pulse && BDFDB.disCN.textareaattachbuttonplus),
							onClick: this.props.onClick,
							onContextMenu: this.props.onContextMenu,
							onMouseEnter: this.props.onMouseEnter,
							onMouseLeave: this.props.onMouseLeave,
							children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
								name: this.props.iconName,
								iconSVG: this.props.iconSVG,
								className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.textareaicon, this.props.iconClassName, this.props.pulse && BDFDB.disCN.textareaiconpulse),
								nativeClass: this.props.nativeClass
							})
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.ChannelTextAreaButton, {tabIndex: 0});
				
				InternalComponents.LibraryComponents.CharCounter = reactInitialized && class BDFDB_CharCounter extends LibraryModules.React.Component {
					getCounterString() {
						let input = this.refElement || {}, string = "";
						if (BDFDB.DOMUtils.containsClass(this.refElement, BDFDB.disCN.textarea)) {
							let instance = BDFDB.ReactUtils.findOwner(input, {name: "ChannelEditorContainer", up: true});
							if (instance) string = instance.props.textValue;
							else string = input.value || input.textContent || "";
						}
						else string = input.value || input.textContent || "";
						let start = input.selectionStart || 0, end = input.selectionEnd || 0, selectlength = end - start, selection = BDFDB.DOMUtils.getSelection();
						let select = !selectlength && !selection ? 0 : (selectlength || selection.length);
						select = !select ? 0 : (select > string.length ? (end || start ? string.length - (string.length - end - start) : string.length) : select);
						let children = [
							typeof this.props.renderPrefix == "function" && this.props.renderPrefix(string.length),
							`${string.length}${!this.props.max ? "" : "/" + this.props.max}${!select ? "" : " (" + select + ")"}`,
							typeof this.props.renderSuffix == "function" && this.props.renderSuffix(string.length)
						].filter(n => n);
						if (typeof this.props.onChange == "function") this.props.onChange(this);
						return children.length == 1 ? children[0] : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
							children: children
						});
					}
					updateCounter() {
						if (!this.refElement) return;
						BDFDB.TimeUtils.clear(this.updateTimeout);
						this.updateTimeout = BDFDB.TimeUtils.timeout(this.forceUpdateCounter.bind(this), 100);
					}
					forceUpdateCounter() {
						if (!this.refElement) return;
						this.props.children = this.getCounterString();
						BDFDB.ReactUtils.forceUpdate(this);
					}
					handleSelection() {
						if (!this.refElement) return;
						let mouseMove = _ => {
							BDFDB.TimeUtils.timeout(this.forceUpdateCounter.bind(this), 10);
						};
						let mouseUp = _ => {
							document.removeEventListener("mousemove", mouseMove);
							document.removeEventListener("mouseup", mouseUp);
							if (this.refElement.selectionEnd - this.refElement.selectionStart) BDFDB.TimeUtils.timeout(_ => {
								document.addEventListener("click", click);
							});
						};
						let click = _ => {
							BDFDB.TimeUtils.timeout(this.forceUpdateCounter.bind(this), 100);
							document.removeEventListener("mousemove", mouseMove);
							document.removeEventListener("mouseup", mouseUp);
							document.removeEventListener("click", click);
						};
						document.addEventListener("mousemove", mouseMove);
						document.addEventListener("mouseup", mouseUp);
					}
					componentDidMount() {
						if (this.props.refClass) {
							let node = BDFDB.ReactUtils.findDOMNode(this);
							if (node && node.parentElement) {
								this.refElement = node.parentElement.querySelector(this.props.refClass);
								if (this.refElement) {
									if (!this._updateCounter) this._updateCounter = _ => {
										if (!document.contains(node)) BDFDB.ListenerUtils.multiRemove(this.refElement, "keydown click change", this._updateCounter);
										else this.updateCounter();
									};
									if (!this._handleSelection) this._handleSelection = _ => {
										if (!document.contains(node)) BDFDB.ListenerUtils.multiRemove(this.refElement, "mousedown", this._handleSelection);
										else this.handleSelection();
									};
									BDFDB.ListenerUtils.multiRemove(this.refElement, "mousedown", this._handleSelection);
									BDFDB.ListenerUtils.multiAdd(this.refElement, "mousedown", this._handleSelection);
									if (this.refElement.tagName == "INPUT" || this.refElement.tagName == "TEXTAREA") {
										BDFDB.ListenerUtils.multiRemove(this.refElement, "keydown click change", this._updateCounter);
										BDFDB.ListenerUtils.multiAdd(this.refElement, "keydown click change", this._updateCounter);
									}
									else {
										if (!this._mutationObserver) this._mutationObserver = new MutationObserver(changes => {
											if (!document.contains(node)) this._mutationObserver.disconnect();
											else this.updateCounter();
										});
										else this._mutationObserver.disconnect();
										this._mutationObserver.observe(this.refElement, {childList: true, subtree: true});
									}
									this.updateCounter();
								}
								else BDFDB.LogUtils.warn("could not find referenceElement for BDFDB_CharCounter");
							}
						}
						else BDFDB.LogUtils.warn("refClass can not be undefined for BDFDB_CharCounter");
					}
					render() {
						let string = this.getCounterString();
						BDFDB.TimeUtils.timeout(_ => {if (string != this.getCounterString()) BDFDB.ReactUtils.forceUpdate(this);});
						return BDFDB.ReactUtils.createElement("div", BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.charcounter, this.props.className),
							children: string
						}), "parsing", "max", "refClass", "renderPrefix", "renderSuffix"));
					}
				};
				
				InternalComponents.LibraryComponents.Checkbox = reactInitialized && class BDFDB_Checkbox extends LibraryModules.React.Component {
					handleChange() {
						this.props.value = !this.props.value;
						if (typeof this.props.onChange == "function") this.props.onChange(this.props.value, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.Checkbox, Object.assign({}, this.props, {onChange: this.handleChange.bind(this)}));
					}
				};
				
				InternalComponents.LibraryComponents.Clickable = reactInitialized && class BDFDB_Clickable extends LibraryModules.React.Component {
					handleClick(e) {if (typeof this.props.onClick == "function") this.props.onClick(e, this);}
					handleContextMenu(e) {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);}
					handleMouseDown(e) {if (typeof this.props.onMouseDown == "function") this.props.onMouseDown(e, this);}
					handleMouseUp(e) {if (typeof this.props.onMouseUp == "function") this.props.onMouseUp(e, this);}
					handleMouseEnter(e) {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);}
					handleMouseLeave(e) {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.Clickable, Object.assign({}, this.props, {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, (this.props.className || "").toLowerCase().indexOf("disabled") == -1 && BDFDB.disCN.cursorpointer),
							onClick: this.handleClick.bind(this),
							onContextMenu: this.handleContextMenu.bind(this),
							onMouseUp: this.handleMouseDown.bind(this),
							onMouseDown: !this.props.disabled && this.handleMouseUp.bind(this),
							onMouseEnter: this.handleMouseEnter.bind(this),
							onMouseLeave: this.handleMouseLeave.bind(this)
						}));
					}
				};
				
				InternalComponents.LibraryComponents.CollapseContainer = reactInitialized && class BDFDB_CollapseContainer extends LibraryModules.React.Component {
					render() {
						if (!BDFDB.ObjectUtils.is(this.props.collapseStates)) this.props.collapseStates = {};
						this.props.collapsed = this.props.collapsed && (this.props.collapseStates[this.props.title] || this.props.collapseStates[this.props.title] == undefined);
						this.props.collapseStates[this.props.title] = this.props.collapsed;
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(this.props.collapsed && BDFDB.disCN.collapsecontainercollapsed, this.props.mini ? BDFDB.disCN.collapsecontainermini : BDFDB.disCN.collapsecontainer, this.props.className),
							id: this.props.id,
							children: [
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
									className: BDFDB.disCN.collapsecontainerheader,
									align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
									onClick: e => {
										this.props.collapsed = !this.props.collapsed;
										this.props.collapseStates[this.props.title] = this.props.collapsed;
										if (typeof this.props.onClick == "function") this.props.onClick(this.props.collapsed, this);
										BDFDB.ReactUtils.forceUpdate(this);
									},
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormTitle, {
										tag: InternalComponents.LibraryComponents.FormComponents.FormTitle.Tags.H5,
										className: BDFDB.disCN.collapsecontainertitle,
										children: this.props.title
									})
								}),
								!this.props.collapsed ? BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.collapsecontainerinner,
									children: this.props.children
								}) : null
							]
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.CollapseContainer, {collapsed: true, mini: true});
				
				InternalComponents.LibraryComponents.ColorPicker = reactInitialized && class BDFDB_ColorPicker extends LibraryModules.React.Component {
					constructor(props) {
						super(props);
						if (!this.state) this.state = {};
						this.state.isGradient = props.gradient && props.color && BDFDB.ObjectUtils.is(props.color);
						this.state.gradientBarEnabled = this.state.isGradient;
						this.state.draggingAlphaCursor = false;
						this.state.draggingGradientCursor = false;
						this.state.selectedGradientCursor = 0;
					}
					handleColorChange(color) {
						let changed = false;
						if (color != null) {
							changed = !BDFDB.equals(this.state.isGradient ? this.props.color[this.state.selectedGradientCursor] : this.props.color, color);
							if (this.state.isGradient) this.props.color[this.state.selectedGradientCursor] = color;
							else this.props.color = color;
						}
						else changed = true;
						if (changed) {
							if (typeof this.props.onColorChange == "function") this.props.onColorChange(this.props.color);
							BDFDB.ReactUtils.forceUpdate(this);
						}
					}
					componentDidMount() {
						this.domElementRef = {current: BDFDB.DOMUtils.getParent(BDFDB.dotCN.itemlayer, BDFDB.ReactUtils.findDOMNode(this))};
						let popoutContainerInstance = BDFDB.ReactUtils.findOwner(this.domElementRef.current, {name: "BDFDB_PopoutContainer", up: true, unlimited: true});
						if (popoutContainerInstance) {
							let mousedown = event => {
								if (!this.domElementRef.current || !document.contains(this.domElementRef.current)) document.removeEventListener("mousedown", mousedown);
								else if (!this.domElementRef.current.contains(event.target)) {
									let mouseUp = event => {
										if (!this.domElementRef.current || !document.contains(this.domElementRef.current)) {
											document.removeEventListener("mousedown", mousedown);
											document.removeEventListener("mouseup", mouseUp);
										}
										else if (!this.domElementRef.current.contains(event.target)) {
											document.removeEventListener("mousedown", mousedown);
											document.removeEventListener("mouseup", mouseUp);
											popoutContainerInstance.handleClick(event);
										}
									};
									document.addEventListener("mouseup", mouseUp);
								}
							};
							document.addEventListener("mousedown", mousedown);
						}
					}
					render() {
						if (this.state.isGradient) this.props.color = Object.assign({}, this.props.color);
						
						let hslFormat = this.props.alpha ? "HSLA" : "HSL";
						let hexRegex = this.props.alpha ? /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i : /^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
						
						let selectedColor = BDFDB.ColorUtils.convert(this.state.isGradient ? this.props.color[this.state.selectedGradientCursor] : this.props.color, hslFormat) || BDFDB.ColorUtils.convert("#000000FF", hslFormat);
						let currentGradient = (this.state.isGradient ? Object.entries(this.props.color, hslFormat) : [[0, selectedColor], [1, selectedColor]]);
						
						let [h, s, l] = BDFDB.ColorUtils.convert(selectedColor, "HSLCOMP");
						let a = BDFDB.ColorUtils.getAlpha(selectedColor);
						a = a == null ? 1 : a;
						
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.PopoutFocusLock, {
							className: BDFDB.disCNS.colorpickerwrapper + BDFDB.disCN.colorpicker,
							children: [
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.colorpickerinner,
									children: [
										BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.colorpickersaturation,
											children: BDFDB.ReactUtils.createElement("div", {
												className: BDFDB.disCN.colorpickersaturationcolor,
												style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0, cursor: "crosshair", backgroundColor: BDFDB.ColorUtils.convert([h, "100%", "100%"], "RGB")},
												onClick: event => {
													let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickersaturationcolor, event.target));
													let newS = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 100], event.clientX) + "%";
													let newL = BDFDB.NumberUtils.mapRange([rects.top, rects.top + rects.height], [100, 0], event.clientY) + "%";
													this.handleColorChange(BDFDB.ColorUtils.convert([h, newS, newL, a], hslFormat));
												},
												onMouseDown: event => {
													let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickersaturationcolor, event.target));
													
													let mouseUp = _ => {
														document.removeEventListener("mouseup", mouseUp);
														document.removeEventListener("mousemove", mouseMove);
													};
													let mouseMove = event2 => {
														let newS = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 100], event2.clientX) + "%";
														let newL = BDFDB.NumberUtils.mapRange([rects.top, rects.top + rects.height], [100, 0], event2.clientY) + "%";
														this.handleColorChange(BDFDB.ColorUtils.convert([h, newS, newL, a], hslFormat));
													};
													document.addEventListener("mouseup", mouseUp);
													document.addEventListener("mousemove", mouseMove);
												},
												children: [
													BDFDB.ReactUtils.createElement("style", {
														children: `${BDFDB.dotCN.colorpickersaturationwhite} {background: -webkit-linear-gradient(to right, #fff, rgba(255,255,255,0));background: linear-gradient(to right, #fff, rgba(255,255,255,0));}${BDFDB.dotCN.colorpickersaturationblack} {background: -webkit-linear-gradient(to top, #000, rgba(0,0,0,0));background: linear-gradient(to top, #000, rgba(0,0,0,0));}`
													}),
													BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN.colorpickersaturationwhite,
														style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
														children: [
															BDFDB.ReactUtils.createElement("div", {
																className: BDFDB.disCN.colorpickersaturationblack,
																style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0}
															}),
															BDFDB.ReactUtils.createElement("div", {
																className: BDFDB.disCN.colorpickersaturationcursor,
																style: {position: "absolute", cursor: "crosshair", left: s, top: `${BDFDB.NumberUtils.mapRange([0, 100], [100, 0], parseFloat(l))}%`},
																children: BDFDB.ReactUtils.createElement("div", {
																	style: {width: 4, height: 4, boxShadow: "rgb(255, 255, 255) 0px 0px 0px 1.5px, rgba(0, 0, 0, 0.3) 0px 0px 1px 1px inset, rgba(0, 0, 0, 0.4) 0px 0px 1px 2px", borderRadius: "50%", transform: "translate(-2px, -2px)"}
																})
															})
														]
													})
												]
											})
										}),
										BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.colorpickerhue,
											children: BDFDB.ReactUtils.createElement("div", {
												style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
												children: BDFDB.ReactUtils.createElement("div", {
													className: BDFDB.disCN.colorpickerhuehorizontal,
													style: {padding: "0px 2px", position: "relative", height: "100%"},
													onClick: event => {
														let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickerhuehorizontal, event.target));
														let newH = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 360], event.clientX);
														this.handleColorChange(BDFDB.ColorUtils.convert([newH, s, l, a], hslFormat));
													},
													onMouseDown: event => {
														let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickerhuehorizontal, event.target));
														
														let mouseUp = _ => {
															document.removeEventListener("mouseup", mouseUp);
															document.removeEventListener("mousemove", mouseMove);
														};
														let mouseMove = event2 => {
															let newH = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 360], event2.clientX);
															this.handleColorChange(BDFDB.ColorUtils.convert([newH, s, l, a], hslFormat));
														};
														document.addEventListener("mouseup", mouseUp);
														document.addEventListener("mousemove", mouseMove);
													},
													children: [
														BDFDB.ReactUtils.createElement("style", {
															children: `${BDFDB.dotCN.colorpickerhuehorizontal} {background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);background: -webkit-linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);}${BDFDB.dotCN.colorpickerhuevertical} {background: linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);background: -webkit-linear-gradient(to top, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);}`
														}),
														BDFDB.ReactUtils.createElement("div", {
															className: BDFDB.disCN.colorpickerhuecursor,
															style: {position: "absolute", cursor: "ew-resize", left: `${BDFDB.NumberUtils.mapRange([0, 360], [0, 100], h)}%`},
															children: BDFDB.ReactUtils.createElement("div", {
																style: {marginTop: 1, width: 4, borderRadius: 1, height: 8, boxShadow: "rgba(0, 0, 0, 0.6) 0px 0px 2px", background: "rgb(255, 255, 255)", transform: "translateX(-2px)"}
															})
														})
													]
												})
											})
										}),
										this.props.alpha && BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.colorpickeralpha,
											children: [
												BDFDB.ReactUtils.createElement("div", {
													style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
													children: BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN.colorpickeralphacheckered,
														style: {padding: "0px 2px", position: "relative", height: "100%"}
													})
												}),
												BDFDB.ReactUtils.createElement("div", {
													style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
													children: BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN.colorpickeralphahorizontal,
														style: {padding: "0px 2px", position: "relative", height: "100%", background: `linear-gradient(to right, ${BDFDB.ColorUtils.setAlpha([h, s, l], 0, "RGBA")}, ${BDFDB.ColorUtils.setAlpha([h, s, l], 1, "RGBA")}`},
														onClick: event => {
															let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickeralphahorizontal, event.target));
															let newA = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 1], event.clientX);
															this.handleColorChange(BDFDB.ColorUtils.setAlpha(selectedColor, newA, hslFormat));
														},
														onMouseDown: event => {
															let rects = BDFDB.DOMUtils.getRects(BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickeralphahorizontal, event.target));
															
															let mouseUp = _ => {
																document.removeEventListener("mouseup", mouseUp);
																document.removeEventListener("mousemove", mouseMove);
																this.state.draggingAlphaCursor = false;
																BDFDB.ReactUtils.forceUpdate(this);
															};
															let mouseMove = event2 => {
																this.state.draggingAlphaCursor = true;
																let newA = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0, 1], event2.clientX);
																this.handleColorChange(BDFDB.ColorUtils.setAlpha(selectedColor, newA, hslFormat));
															};
															document.addEventListener("mouseup", mouseUp);
															document.addEventListener("mousemove", mouseMove);
														},
														children: BDFDB.ReactUtils.createElement("div", {
															className: BDFDB.disCN.colorpickeralphacursor,
															style: {position: "absolute", cursor: "ew-resize", left: `${a * 100}%`},
															children: [
																BDFDB.ReactUtils.createElement("div", {
																	style: {marginTop: 1, width: 4, borderRadius: 1, height: 8, boxShadow: "rgba(0, 0, 0, 0.6) 0px 0px 2px", background: "rgb(255, 255, 255)", transform: "translateX(-2px)"}
																}),
																this.state.draggingAlphaCursor && BDFDB.ReactUtils.createElement("span", {
																	className: BDFDB.disCN.sliderbubble,
																	style: {opacity: 1, visibility: "visible", left: 2},
																	children: `${Math.floor(a * 100)}%`
																})
															].filter(n => n)
														})
													})
												})
											]
										}),
										this.state.gradientBarEnabled && BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.colorpickergradient,
											children: [
												BDFDB.ReactUtils.createElement("div", {
													style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
													children: BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN.colorpickergradientcheckered,
														style: {padding: "0px 2px", position: "relative", height: "100%"}
													})
												}),
												BDFDB.ReactUtils.createElement("div", {
													style: {position: "absolute", top: 0, right: 0, bottom: 0, left: 0},
													children: BDFDB.ReactUtils.createElement("div", {
														className: BDFDB.disCN.colorpickergradienthorizontal,
														style: {padding: "0px 2px", position: "relative", cursor: "copy", height: "100%", background: BDFDB.ColorUtils.createGradient(currentGradient.reduce((colorObj, posAndColor) => (colorObj[posAndColor[0]] = posAndColor[1], colorObj), {}))},
														onClick: event => {
															let rects = BDFDB.DOMUtils.getRects(event.target);
															let pos = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0.01, 0.99], event.clientX);
															if (Object.keys(this.props.color).indexOf(pos) == -1) {
																this.props.color[pos] = BDFDB.ColorUtils.convert("#000000FF", hslFormat);
																this.state.selectedGradientCursor = pos;
																this.handleColorChange();
															}
														},
														children: currentGradient.map(posAndColor => BDFDB.ReactUtils.createElement("div", {
															className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.colorpickergradientcursor, (posAndColor[0] == 0 || posAndColor[0] == 1) && BDFDB.disCNS.colorpickergradientcursoredge, this.state.selectedGradientCursor == posAndColor[0] && BDFDB.disCN.colorpickergradientcursorselected),
															style: {position: "absolute", cursor: "pointer", left: `${posAndColor[0] * 100}%`},
															onMouseDown: posAndColor[0] == 0 || posAndColor[0] == 1 ? _ => {} : event => {
																event = event.nativeEvent || event;
																let mouseMove = event2 => {
																	if (Math.sqrt((event.pageX - event2.pageX)**2) > 10) {
																		document.removeEventListener("mousemove", mouseMove);
																		document.removeEventListener("mouseup", mouseUp);
																		
																		this.state.draggingGradientCursor = true;
																		let cursor = BDFDB.DOMUtils.getParent(BDFDB.dotCN.colorpickergradientcursor, event.target);
																		let rects = BDFDB.DOMUtils.getRects(cursor.parentElement);
																		
																		let releasing = _ => {
																			document.removeEventListener("mousemove", dragging);
																			document.removeEventListener("mouseup", releasing);
																			BDFDB.TimeUtils.timeout(_ => {this.state.draggingGradientCursor = false;});
																		};
																		let dragging = event3 => {
																			let pos = BDFDB.NumberUtils.mapRange([rects.left, rects.left + rects.width], [0.01, 0.99], event3.clientX);
																			if (Object.keys(this.props.color).indexOf(pos) == -1) {
																				delete this.props.color[posAndColor[0]];
																				posAndColor[0] = pos;
																				this.props.color[pos] = posAndColor[1];
																				this.state.selectedGradientCursor = pos;
																				this.handleColorChange();
																			}
																		};
																		document.addEventListener("mousemove", dragging);
																		document.addEventListener("mouseup", releasing);
																	}
																};
																let mouseUp = _ => {
																	document.removeEventListener("mousemove", mouseMove);
																	document.removeEventListener("mouseup", mouseUp);
																};
																document.addEventListener("mousemove", mouseMove);
																document.addEventListener("mouseup", mouseUp);
															},
															onClick: event => {
																BDFDB.ListenerUtils.stopEvent(event);
																if (!this.state.draggingGradientCursor) {
																	this.state.selectedGradientCursor = posAndColor[0];
																	BDFDB.ReactUtils.forceUpdate(this);
																}
															},
															onContextMenu: posAndColor[0] == 0 || posAndColor[0] == 1 ? _ => {} : event => {
																BDFDB.ListenerUtils.stopEvent(event);
																delete this.props.color[posAndColor[0]];
																this.state.selectedGradientCursor = 0;
																this.handleColorChange();
															},
															children: BDFDB.ReactUtils.createElement("div", {
																style: {background: BDFDB.ColorUtils.convert(posAndColor[1], "RGBA")}
															})
														}))
													})
												})
											]
										})
									].filter(n => n)
								}),
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextInput, {
									className: BDFDB.disCNS.colorpickerhexinput + BDFDB.disCN.margintop8,
									maxLength: this.props.alpha ? 9 : 7,
									valuePrefix: "#",
									value: BDFDB.ColorUtils.convert(selectedColor, this.props.alpha ? "HEXA" : "HEX"),
									autoFocus: true,
									onChange: value => {
										if (hexRegex.test(value)) this.handleColorChange(value);
									},
									inputChildren: this.props.gradient && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
										text: "Gradient",
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
											className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.colorpickergradientbutton, this.state.gradientBarEnabled && BDFDB.disCN.colorpickergradientbuttonenabled),
											children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
												nativeClass: true,
												width: 28,
												height: 28,
												name: InternalComponents.LibraryComponents.SvgIcon.Names.GRADIENT
											}),
											onClick: _ => {
												this.state.gradientBarEnabled = !this.state.gradientBarEnabled;
												if (this.state.gradientBarEnabled && !this.state.isGradient) this.props.color = {0: selectedColor, 1: selectedColor};
												else if (!this.state.gradientBarEnabled && this.state.isGradient) this.props.color = selectedColor;
												this.state.isGradient = this.props.color && BDFDB.ObjectUtils.is(this.props.color);
												this.handleColorChange();
											}
										})
									})
								}),
								BDFDB.ReactUtils.createElement("div", {
									className: "move-corners",
									children: [{top: 0, left: 0}, {top: 0, right: 0}, {bottom: 0, right: 0}, {bottom: 0, left: 0}].map(pos => BDFDB.ReactUtils.createElement("div", {
										className: "move-corner",
										onMouseDown: e => {
											if (!this.domElementRef.current) return;
											let rects = BDFDB.DOMUtils.getRects(this.domElementRef.current);
											let left = rects.left, top = rects.top;
											let oldX = e.pageX, oldY = e.pageY;
											let mouseUp = _ => {
												document.removeEventListener("mouseup", mouseUp);
												document.removeEventListener("mousemove", mouseMove);
											};
											let mouseMove = e2 => {
												left = left - (oldX - e2.pageX), top = top - (oldY - e2.pageY);
												oldX = e2.pageX, oldY = e2.pageY;
												this.domElementRef.current.style.setProperty("left", `${left}px`, "important");
												this.domElementRef.current.style.setProperty("top", `${top}px`, "important");
											};
											document.addEventListener("mouseup", mouseUp);
											document.addEventListener("mousemove", mouseMove);
										},
										style: Object.assign({}, pos, {width: 10, height: 10, cursor: "move", position: "absolute"})
									}))
								})
							]
						});
					}
				};
				
				InternalComponents.LibraryComponents.ColorSwatches = reactInitialized && class BDFDB_ColorSwatches extends LibraryModules.React.Component {
					constructor(props) {
						super(props);
						
						props.selectedColor = BDFDB.ObjectUtils.is(props.color) ? props.color : BDFDB.ColorUtils.convert(props.color, "RGBA");
						props.colors = (BDFDB.ArrayUtils.is(props.colors) ? props.colors : [null, 5433630, 3066993, 1752220, 3447003, 3429595, 8789737, 10181046, 15277667, 15286558, 15158332, 15105570, 15844367, 13094093, 7372936, 6513507, 16777215, 3910932, 2067276, 1146986, 2123412, 2111892, 7148717, 7419530, 11342935, 11345940, 10038562, 11027200, 12745742, 9936031, 6121581, 2894892]).map(c => BDFDB.ColorUtils.convert(c, "RGBA"));
						props.colorRows = props.colors.length ? [props.colors.slice(0, parseInt(props.colors.length/2)), props.colors.slice(parseInt(props.colors.length/2))] : [];
						props.customColor = props.selectedColor != null ? (props.colors.indexOf(props.selectedColor) > -1 ? null : props.selectedColor) : null;
						props.customSelected = !!props.customColor;
						props.pickerConfig = BDFDB.ObjectUtils.is(props.pickerConfig) ? props.pickerConfig : {gradient: true, alpha: true};
						this.state = props;
						
						var swatches = this;
						this.ColorSwatch = class BDFDB_ColorSwatch extends LibraryModules.React.Component {
							render() {
								let useWhite = !BDFDB.ColorUtils.isBright(this.props.color);
								let swatch = BDFDB.ReactUtils.createElement("button", {
									type: "button",
									className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.colorpickerswatch, this.props.isSingle && BDFDB.disCN.colorpickerswatchsingle, this.props.isDisabled && BDFDB.disCN.colorpickerswatchdisabled, this.props.isSelected && BDFDB.disCN.colorpickerswatchselected, this.props.isCustom && BDFDB.disCN.colorpickerswatchcustom, this.props.color == null && BDFDB.disCN.colorpickerswatchnocolor),
									number: this.props.number,
									disabled: this.props.isDisabled,
									onClick: _ => {
										if (!this.props.isSelected) {
											let color = this.props.isCustom && this.props.color == null ? "rgba(0, 0, 0, 1)" : this.props.color;
											if (typeof swatches.props.onColorChange == "function") swatches.props.onColorChange(BDFDB.ColorUtils.convert(color, "RGBA"));
											swatches.setState({
												selectedColor: color,
												customColor: this.props.isCustom ? color : swatches.state.customColor,
												customSelected: this.props.isCustom
											});
										}
									},
									style: Object.assign({}, this.props.style, {
										background: BDFDB.ObjectUtils.is(this.props.color) ? BDFDB.ColorUtils.createGradient(this.props.color) : BDFDB.ColorUtils.convert(this.props.color, "RGBA")
									}),
									children: [
										this.props.isCustom || this.props.isSingle ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											className: BDFDB.disCN.colorpickerswatchdropper,
											foreground: BDFDB.disCN.colorpickerswatchdropperfg,
											name: InternalComponents.LibraryComponents.SvgIcon.Names.DROPPER,
											width: this.props.isCustom ? 14 : 10,
											height: this.props.isCustom ? 14 : 10,
											color: useWhite ? BDFDB.DiscordConstants.Colors.WHITE : BDFDB.DiscordConstants.Colors.BLACK
										}) : null,
										this.props.isSelected && !this.props.isSingle ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											name: InternalComponents.LibraryComponents.SvgIcon.Names.CHECKMARK,
											width: this.props.isCustom ? 32 : 16,
											height: this.props.isCustom ? 24 : 16,
											color: useWhite ? BDFDB.DiscordConstants.Colors.WHITE : BDFDB.DiscordConstants.Colors.BLACK
										}) : null
									]
								});
								if (this.props.isCustom || this.props.isSingle || this.props.color == null) swatch = BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
									text: this.props.isCustom || this.props.isSingle ? BDFDB.LanguageUtils.LanguageStrings.CUSTOM_COLOR : BDFDB.LanguageUtils.LanguageStrings.DEFAULT,
									tooltipConfig: {type: this.props.isSingle ? "top" : "bottom"},
									children: swatch
								});
								if (this.props.isCustom || this.props.isSingle) swatch = BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.PopoutContainer, {
									children: swatch,
									wrap: false,
									popoutClassName: BDFDB.disCNS.colorpickerwrapper + BDFDB.disCN.colorpicker,
									animation: InternalComponents.LibraryComponents.PopoutContainer.Animation.TRANSLATE,
									position: InternalComponents.LibraryComponents.PopoutContainer.Positions.BOTTOM,
									align: InternalComponents.LibraryComponents.PopoutContainer.Align.CENTER,
									renderPopout: _ => {
										return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ColorPicker, Object.assign({
											color: this.props.color,
											onColorChange: color => {
												if (typeof swatches.props.onColorChange == "function") swatches.props.onColorChange(BDFDB.ColorUtils.convert(color, "RGBA"))
												this.props.color = color;
												swatches.setState({
													selectedColor: color,
													customColor: color,
													customSelected: true
												});
											}
										}, props.pickerConfig), true);
									}
								});
								return swatch;
							}
						}
					}
					renderRow(colors) {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.disCN.colorpickerrow,
							wrap: InternalComponents.LibraryComponents.Flex.Wrap.WRAP,
							children: colors.map(color => {
								return BDFDB.ReactUtils.createElement(this.ColorSwatch, {
									color: color,
									isCustom: false,
									isSelected: !this.state.customSelected && color === this.state.selectedColor,
									isDisabled: this.state.disabled
								})
							})
						});
					}
					render() {
						let customSwatch = BDFDB.ReactUtils.createElement(this.ColorSwatch, {
							number: !this.state.colors.length ? (this.props.number != null ? this.props.number : 0) : null,
							color: this.state.customColor,
							isSingle: !this.state.colors.length,
							isCustom: this.state.colors.length,
							isSelected: this.state.customSelected,
							isDisabled: this.state.disabled,
							style: {margin: 0}
						});
						return !this.state.colors.length ? BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.colorpickerswatchsinglewrapper,
							children: customSwatch
						}) : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.colorpickerswatches, this.state.disabled && BDFDB.disCN.colorpickerswatchesdisabled),
							number: this.props.number != null ? this.props.number : 0,
							children: [
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
									className: BDFDB.disCN.marginreset,
									shrink: 0,
									grow: 0,
									children: customSwatch
								}),
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
									direction: InternalComponents.LibraryComponents.Flex.Direction.VERTICAL,
									className: BDFDB.disCN.flexmarginreset,
									grow: 1,
									children: [
										this.renderRow(this.state.colorRows[0]),
										this.renderRow(this.state.colorRows[1])
									]
								}) 
							]
						});
					}
				};
				
				InternalComponents.LibraryComponents.EmojiPickerButton = reactInitialized && class BDFDB_EmojiPickerButton extends LibraryModules.React.Component {
					handleEmojiChange(emoji) {
						if (emoji != null) {
							this.props.emoji = emoji.id ? {
								id: emoji.id,
								name: emoji.name,
								animated: emoji.animated
							} : {
								id: null,
								name: emoji.optionallyDiverseSequence,
								animated: false
							};
							if (typeof this.props.onSelect == "function") this.props.onSelect(this.props.emoji, this);
							BDFDB.ReactUtils.forceUpdate(this);
						}
					}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.PopoutContainer, {
							children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.EmojiButton, {
								className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.emojiinputbutton),
								renderButtonContents: this.props.emoji ? _ => BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Emoji, {
									className: BDFDB.disCN.emoji,
									emojiId: this.props.emoji.id,
									emojiName: this.props.emoji.name
								}) : null
							}),
							wrap: false,
							animation: InternalComponents.LibraryComponents.PopoutContainer.Animation.NONE,
							position: InternalComponents.LibraryComponents.PopoutContainer.Positions.TOP,
							align: InternalComponents.LibraryComponents.PopoutContainer.Align.LEFT,
							renderPopout: instance => {
								return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.EmojiPicker, {
									closePopout: instance.close,
									onSelectEmoji: this.handleEmojiChange.bind(this),
									allowManagedEmojis: this.props.allowManagedEmojis
								});
							}
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.EmojiPickerButton, {allowManagedEmojis: false});
				
				InternalComponents.LibraryComponents.FavButton = reactInitialized && class BDFDB_FavButton extends LibraryModules.React.Component {
					handleClick() {
						this.props.isFavorite = !this.props.isFavorite;
						if (typeof this.props.onClick == "function") this.props.onClick(this.props.isFavorite, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.favbuttoncontainer, this.props.className),
							children: BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.FavButton, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {onClick: this.handleClick.bind(this)}), "className"))
						});
					}
				};
				
				InternalComponents.LibraryComponents.FileButton = reactInitialized && class BDFDB_FileButton extends LibraryModules.React.Component {
					componentDidMount() {
						if (this.props.searchFolders) {
							let node = BDFDB.ReactUtils.findDOMNode(this);
							if (node && (node = node.querySelector("input[type='file']")) != null) {
								node.setAttribute("directory", "");
								node.setAttribute("webkitdirectory", "");
							}
						}
					}
					render() {
						let filter = this.props.filter && [this.props.filter].flat(10).filter(n => typeof n == "string") || [];
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Button, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							onClick: e => {e.currentTarget.querySelector("input").click();},
							children: [
								BDFDB.LanguageUtils.LibraryStrings.file_navigator_text,
								BDFDB.ReactUtils.createElement("input", {
									type: "file",
									accept: filter.length && (filter.join("/*,") + "/*"),
									style: {display: "none"},
									onChange: e => {
										let file = e.currentTarget.files[0];
										if (this.refInput && file && (!filter.length || filter.some(n => file.type.indexOf(n) == 0))) {
											this.refInput.props.value = this.props.searchFolders ? file.path.split(file.name).slice(0, -1).join(file.name) : `${this.props.mode == "url" ? "url('" : ""}${(this.props.useFilePath) ? file.path : `data: ${file.type};base64,${BDFDB.LibraryRequires.fs.readFileSync(file.path).toString("base64")}`}${this.props.mode ? "')" : ""}`;
											BDFDB.ReactUtils.forceUpdate(this.refInput);
											this.refInput.handleChange(this.refInput.props.value);
										}
									}
								})
							]
						}), "filter", "mode", "useFilePath", "searchFolders"));
					}
				};
				
				InternalComponents.LibraryComponents.FormComponents.FormItem = reactInitialized && class BDFDB_FormItem extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement("div", {
							className: this.props.className,
							style: this.props.style,
							children: [
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
									align: InternalComponents.LibraryComponents.Flex.Align.BASELINE,
									children: [
										this.props.title != null || this.props.error != null ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
											wrap: true,
											children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormTitle, {
												tag: this.props.tag || InternalComponents.LibraryComponents.FormComponents.FormTitle.Tags.H5,
												disabled: this.props.disabled,
												required: this.props.required,
												error: this.props.error,
												className: this.props.titleClassName,
												children: this.props.title
											})
										}) : null
									].concat([this.props.titlechildren].flat(10)).filter(n => n)
								}),
							].concat(this.props.children)
						});
					}
				};
				
				InternalComponents.LibraryComponents.GuildComponents = Object.assign({}, InternalComponents.LibraryComponents.GuildComponents);
				
				InternalComponents.LibraryComponents.GuildComponents.Guild = reactInitialized && class BDFDB_Guild extends LibraryModules.React.Component {
					constructor(props) {
						super(props);
						this.state = {hovered: false};
					}
					handleMouseEnter(e) {
						if (!this.props.sorting) this.setState({hovered: true});
						if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);
					}
					handleMouseLeave(e) {
						if (!this.props.sorting) this.setState({hovered: false});
						if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);
					}
					handleMouseDown(e) {
						if (!this.props.unavailable && this.props.guild && this.props.selectedChannelId) LibraryModules.DirectMessageUtils.preload(this.props.guild.id, this.props.selectedChannelId);
						if (e.button == 0 && typeof this.props.onMouseDown == "function") this.props.onMouseDown(e, this);
					}
					handleMouseUp(e) {
						if (e.button == 0 && typeof this.props.onMouseUp == "function") this.props.onMouseUp(e, this);
					}
					handleClick(e) {
						if (typeof this.props.onClick == "function") this.props.onClick(e, this);
					}
					handleContextMenu(e) {
						if (this.props.menu) BDFDB.GuildUtils.openMenu(this.props.guild, e);
						if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);
					}
					setRef(e) {
						if (typeof this.props.setRef == "function") this.props.setRef(this.props.guild.id, e)
					}
					componentDidMount() {
						let node = BDFDB.ReactUtils.findDOMNode(this);
						if (node) for (let child of node.querySelectorAll("a")) child.setAttribute("draggable", false);
					}
					render() {
						if (!this.props.guild) return null;
						let currentVoiceChannel = LibraryModules.ChannelStore.getChannel(LibraryModules.CurrentVoiceUtils.getChannelId());
						let hasVideo = currentVoiceChannel && LibraryModules.VoiceUtils.hasVideo(currentVoiceChannel);
						this.props.guildId = this.props.guild.id;
						this.props.selectedChannelId = LibraryModules.LastChannelStore.getChannelId(this.props.guild.id);
						this.props.selected = this.props.state ? LibraryModules.LastGuildStore.getGuildId() == this.props.guild.id : false;
						this.props.unread = this.props.state ? LibraryModules.UnreadGuildUtils.hasUnread(this.props.guild.id) : false;
						this.props.badge = this.props.state ? LibraryModules.UnreadGuildUtils.getMentionCount(this.props.guild.id) : 0;
						this.props.audio = this.props.state ? currentVoiceChannel && currentVoiceChannel.guild_id == this.props.guild.id && !hasVideo : false;
						this.props.video = this.props.state ? currentVoiceChannel && currentVoiceChannel.guild_id == this.props.guild.id && hasVideo : false;
						this.props.screenshare = this.props.state ? !!LibraryModules.StreamUtils.getAllApplicationStreams().filter(stream => stream.guildId == this.props.guild.id)[0] : false;
						this.props.isCurrentUserInThisGuildVoice = this.props.state ? LibraryModules.CurrentVoiceUtils.getGuildId() == this.props.guild.id : false;
						this.props.animatable = this.props.state ? LibraryModules.IconUtils.hasAnimatedGuildIcon(this.props.guild) : false;
						this.props.unavailable = this.props.state ? LibraryModules.GuildUnavailableStore.unavailableGuilds.includes(this.props.guild.id) : false;
						let isDraggedGuild = this.props.draggingGuildId === this.props.guild.id;
						let guild = isDraggedGuild ? BDFDB.ReactUtils.createElement("div", {
							children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.GuildComponents.Items.DragPlaceholder, {})
						}) : BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.guildcontainer,
							children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.GuildComponents.BlobMask, {
								selected: this.state.isDropHovering || this.props.selected || this.state.hovered,
								upperBadge: this.props.unavailable ? InternalComponents.LibraryComponents.GuildComponents.Items.renderUnavailableBadge() : InternalComponents.LibraryComponents.GuildComponents.Items.renderIconBadge(this.props.audio, this.props.video, this.props.screenshare, this.props.isCurrentUserInThisGuildVoice),
								lowerBadge: this.props.badge > 0 ? InternalComponents.LibraryComponents.GuildComponents.Items.renderMentionBadge(this.props.badge) : null,
								lowerBadgeWidth: InternalComponents.LibraryComponents.Badges.getBadgeWidthForValue(this.props.badge),
								children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.NavItem, {
									to: {
										pathname: BDFDB.DiscordConstants.Routes.CHANNEL(this.props.guild.id, this.props.selectedChannelId),
										state: {
											analyticsSource: {
												page: BDFDB.DiscordConstants.AnalyticsPages.GUILD_CHANNEL,
												section: BDFDB.DiscordConstants.AnalyticsSections.CHANNEL_LIST,
												object: BDFDB.DiscordConstants.AnalyticsObjects.CHANNEL
											}
										}
									},
									name: this.props.guild.name,
									onMouseEnter: this.handleMouseEnter.bind(this),
									onMouseLeave: this.handleMouseLeave.bind(this),
									onMouseDown: this.handleMouseDown.bind(this),
									onMouseUp: this.handleMouseUp.bind(this),
									onClick: this.handleClick.bind(this),
									onContextMenu: this.handleContextMenu.bind(this),
									icon: this.props.guild.getIconURL(this.state.hovered && this.props.animatable ? "gif" : "png"),
									selected: this.props.selected || this.state.hovered
								})
							})
						});
							
						if (this.props.draggable && typeof this.props.connectDragSource == "function") guild = this.props.connectDragSource(guild);
						
						let children = [
							this.props.list || this.props.pill ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.GuildComponents.Pill, {
								hovered: !isDraggedGuild && this.state.hovered,
								selected: !isDraggedGuild && this.props.selected,
								unread: !isDraggedGuild && this.props.unread,
								className: BDFDB.disCN.guildpill
							}) : null,
							!this.props.tooltip ? guild : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
								tooltipConfig: Object.assign({type: "right"}, this.props.tooltipConfig, {guild: this.props.list && this.props.guild}),
								children: guild
							})
						].filter(n => n);
						return this.props.list ? BDFDB.ReactUtils.createElement("div", {
							ref: null != this.props.setRef ? this.props.setRef : null,
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.guildouter, BDFDB.disCN._bdguild, this.props.unread && BDFDB.disCN._bdguildunread, this.props.selected && BDFDB.disCN._bdguildselected, this.props.unread && BDFDB.disCN._bdguildunread, this.props.audio && BDFDB.disCN._bdguildaudio, this.props.video && BDFDB.disCN._bdguildvideo),
							children: BDFDB.ReactUtils.createElement(BDFDB.ReactUtils.Fragment, {
								children: children
							})
						}) : BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.guild, this.props.className),
							children: children
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.GuildComponents.Guild, {menu: true, tooltip: true, list: false, state: false, draggable: false, sorting: false});
				
				InternalComponents.LibraryComponents.GuildSummaryItem = reactInitialized && class BDFDB_GuildSummaryItem extends LibraryModules.React.Component {
					defaultRenderGuild(guild, isLast) {
						if (!guild) return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.guildsummaryemptyguild
						});
						let icon = BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.GuildComponents.Icon, {
							className: BDFDB.disCN.guildsummaryicon,
							guild: guild,
							showTooltip: this.props.showTooltip,
							tooltipPosition: "top",
							size: InternalComponents.LibraryComponents.GuildComponents.Icon.Sizes.SMALLER
						});
						return this.props.switchOnClick ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
							className: BDFDB.disCN.guildsummaryclickableicon,
							onClick: _ => {LibraryModules.SelectChannelUtils.selectChannel(guild.id, LibraryModules.LastChannelStore.getChannelId(guild.id));},
							key: guild.id,
							tabIndex: -1,
							children: icon
						}) : icon;
					}
					renderGuilds() {
						let elements = [];
						let renderGuild = typeof this.props.renderGuild != "function" ? this.defaultRenderGuild : this.props.renderGuild;
						let loaded = 0, max = this.props.guilds.length === this.props.max ? this.props.guilds.length : this.props.max - 1;
						while (loaded < max && loaded < this.props.guilds.length) {
							let isLast = loaded === this.props.guilds.length - 1;
							let guild = renderGuild.apply(this, [this.props.guilds[loaded], isLast]);
							elements.push(BDFDB.ReactUtils.createElement("div", {
								className: isLast ? BDFDB.disCN.guildsummaryiconcontainer : BDFDB.disCN.guildsummaryiconcontainermasked,
								children: guild
							}));
							loaded++;
						}
						if (loaded < this.props.guilds.length) {
							let rest = Math.min(this.props.guilds.length - loaded, 99);
							elements.push(BDFDB.ReactUtils.createElement(LibraryModules.React.Fragment, {
								key: "more-guilds",
								children: this.props.renderMoreGuilds("+" + rest, rest, this.props.guilds.slice(loaded), this.props)
							}));
						}
						return elements;
					}
					renderIcon() {
						return this.props.renderIcon ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
							name: InternalComponents.LibraryComponents.SvgIcon.Names.WHATISTHIS,
							className: BDFDB.disCN.guildsummarysvgicon
						}) : null;
					}
					render() {
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.guildsummarycontainer),
							ref: this.props._ref,
							children: [
								this.renderIcon.apply(this),
								this.renderGuilds.apply(this)
							].flat(10).filter(n => n)
						});
					}
				}
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.GuildSummaryItem, {max: 10, renderMoreGuilds: (count, amount, restGuilds, props) => {
					let icon = BDFDB.ReactUtils.createElement("div", {className: BDFDB.disCN.guildsummarymoreguilds, children: count});
					return props.showTooltip ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
						text: restGuilds.map(guild => guild.name).join(", "),
						children: icon
					}) : icon;
				}, renderIcon: false});
				
				InternalComponents.LibraryComponents.KeybindRecorder = reactInitialized && class BDFDB_KeybindRecorder extends LibraryModules.React.Component {
					handleChange(arrays) {
						if (typeof this.props.onChange == "function") this.props.onChange(arrays.map(platformkey => LibraryModules.KeyEvents.codes[BDFDB.LibraryModules.KeyCodeUtils.codeToKey(platformkey)] || platformkey[1]), this);
					}
					handleReset() {
						this.props.defaultValue = [];
						let recorder = BDFDB.ReactUtils.findOwner(this, {name: "KeybindRecorder"});
						if (recorder) recorder.setState({codes: []});
						if (typeof this.props.onChange == "function") this.props.onChange([], this);
						if (typeof this.props.onReset == "function") this.props.onReset(this);
					}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.disCN.hotkeywrapper,
							direction: InternalComponents.LibraryComponents.Flex.Direction.HORIZONTAL,
							align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
							children: [
								BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.KeybindRecorder, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
									defaultValue: [this.props.defaultValue].flat(10).filter(n => n).map(keycode => [BDFDB.DiscordConstants.KeyboardDeviceTypes.KEYBOARD_KEY, keycode, BDFDB.DiscordConstants.KeyboardEnvs.BROWSER]),
									onChange: this.handleChange.bind(this)
								}), "reset", "onReset")),
								this.props.reset || this.props.onReset ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
									text: BDFDB.LanguageUtils.LanguageStrings.REMOVE_KEYBIND,
									tooltipConfig: {type: "top"},
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
										className: BDFDB.disCN.hotkeyresetbutton,
										onClick: this.handleReset.bind(this),
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											iconSVG: `<svg height="20" width="20" viewBox="0 0 20 20"><path fill="currentColor" d="M 14.348 14.849 c -0.469 0.469 -1.229 0.469 -1.697 0 l -2.651 -3.030 -2.651 3.029 c -0.469 0.469 -1.229 0.469 -1.697 0 -0.469 -0.469 -0.469 -1.229 0 -1.697l2.758 -3.15 -2.759 -3.152 c -0.469 -0.469 -0.469 -1.228 0 -1.697 s 1.228 -0.469 1.697 0 l 2.652 3.031 2.651 -3.031 c 0.469 -0.469 1.228 -0.469 1.697 0 s 0.469 1.229 0 1.697l -2.758 3.152 2.758 3.15 c 0.469 0.469 0.469 1.229 0 1.698 z"></path></svg>`,
										})
									})
								}) : null
							].filter(n => n)
						});
					}
				};
				
				InternalComponents.LibraryComponents.ListRow = reactInitialized && class BDFDB_ListRow extends LibraryModules.React.Component {
					render () {
						return BDFDB.ReactUtils.createElement("div", BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.listrowwrapper, this.props.className, BDFDB.disCN.listrow),
							children: [
								this.props.prefix,
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.listrowcontent,
									style: {flex: "1 1 auto"},
									children: [
										BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.listname, this.props.labelClassName),
											style: {flex: "1 1 auto"},
											children: this.props.label
										}),
										typeof this.props.note == "string" ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormText, {
											type: InternalComponents.LibraryComponents.FormComponents.FormText.Types.DESCRIPTION,
											children: this.props.note
										}) : null
									].filter(n => n)
								}),
								this.props.suffix
							].filter(n => n)
						}), "label", "note", "suffix", "prefix", "labelClassName"));
					}
				};
				
				InternalComponents.LibraryComponents.MemberRole = reactInitialized && class BDFDB_MemberRole extends LibraryModules.React.Component {
					handleClick(e) {if (typeof this.props.onClick == "function") this.props.onClick(e, this);}
					handleContextMenu(e) {if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);}
					render() {
						let color = BDFDB.ColorUtils.convert(this.props.role.colorString || BDFDB.DiscordConstants.Colors.PRIMARY_DARK_300, "RGB");
						return BDFDB.ReactUtils.createElement("li", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.userpopoutrole, this.props.className),
							style: {borderColor: BDFDB.ColorUtils.setAlpha(color, 0.6)},
							onClick: this.handleClick.bind(this),
							onContextMenu: this.handleContextMenu.bind(this),
							children: [
								!this.props.noCircle ? BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.userpopoutrolecircle,
									style: {backgroundColor: color}
								}) : null,
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.userpopoutrolename,
									children: this.props.role.name
								})
							].filter(n => n)
						});
					}
				};
				
				InternalComponents.LibraryComponents.MenuItems.MenuCheckboxItem = reactInitialized && class BDFDB_MenuCheckboxItem extends LibraryModules.React.Component {
					handleClick() {
						if (this.props.state) {
							this.props.state.checked = !this.props.state.checked;
							if (typeof this.props.action == "function") this.props.action(this.props.state.checked, this);
						}
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.MenuCheckboxItem, Object.assign({}, this.props, {
							checked: this.props.state && this.props.state.checked,
							action: this.handleClick.bind(this)
						}));
					}
				};
				
				InternalComponents.LibraryComponents.MenuItems.MenuHint = reactInitialized && class BDFDB_MenuHint extends LibraryModules.React.Component {
					render() {
						return !this.props.hint ? null : BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.menuhint,
							children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextScroller, {
								children: this.props.hint
							})
						});
					}
				};
				
				InternalComponents.LibraryComponents.MenuItems.MenuIcon = reactInitialized && class BDFDB_MenuIcon extends LibraryModules.React.Component {
					render() {
						let isString = typeof this.props.icon == "string";
						return !this.props.icon ? null : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
							className: BDFDB.disCN.menuicon,
							nativeClass: true,
							iconSVG: isString ? this.props.icon : null,
							name: !isString ? this.props.icon : null
						});
					}
				};
				
				InternalComponents.LibraryComponents.MenuItems.MenuSliderItem = reactInitialized && class BDFDB_MenuSliderItem extends LibraryModules.React.Component {
					handleValueChange(value) {
						if (this.props.state) {
							this.props.state.value = Math.round(BDFDB.NumberUtils.mapRange([0, 100], [this.props.minValue, this.props.maxValue], value) * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
							if (typeof this.props.onValueChange == "function") this.props.onValueChange(this.props.state.value, this);
						}
						BDFDB.ReactUtils.forceUpdate(this);
					}
					handleValueRender(value) {
						let newValue = Math.round(BDFDB.NumberUtils.mapRange([0, 100], [this.props.minValue, this.props.maxValue], value) * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
						if (typeof this.props.onValueRender == "function") {
							let tempReturn = this.props.onValueRender(newValue, this);
							if (tempReturn != undefined) newValue = tempReturn;
						}
						return newValue;
					}
					render() {
						let value = this.props.state && this.props.state.value || 0;
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.MenuControlItem, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							label: typeof this.props.renderLabel == "function" ? this.props.renderLabel(Math.round(value * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits)) : this.props.label,
							control: (menuItemProps, ref) => {
								return BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.menuslidercontainer,
									children: BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.Slider, Object.assign({}, menuItemProps, {
										ref: ref,
										className: BDFDB.disCN.menuslider,
										mini: true,
										initialValue: Math.round(BDFDB.NumberUtils.mapRange([this.props.minValue, this.props.maxValue], [0, 100], value) * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits),
										onValueChange: this.handleValueChange.bind(this),
										onValueRender: this.handleValueRender.bind(this)
									}))
								});
							}
						}), "digits", "renderLabel"));
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.MenuItems.MenuSliderItem, {minValue: 0, maxValue: 100, digits: 0});
				
				InternalComponents.LibraryComponents.ModalComponents.ModalContent = reactInitialized && class BDFDB_ModalContent extends LibraryModules.React.Component {
					render() {
						return this.props.scroller ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Scrollers.Thin, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.modalcontent, this.props.className),
							ref: this.props.scrollerRef,
							children: this.props.children
						}) : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.DOMUtils.formatClassName(this.props.content && BDFDB.disCN.modalcontent, BDFDB.disCN.modalnoscroller, this.props.className),
							direction: this.props.direction || InternalComponents.LibraryComponents.Flex.Direction.VERTICAL,
							align: InternalComponents.LibraryComponents.Flex.Align.STRETCH,
							children: this.props.children
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.ModalComponents.ModalContent, {scroller: true, content: true});
				
				InternalComponents.LibraryComponents.ModalComponents.ModalTabContent = reactInitialized && class BDFDB_ModalTabContent extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.forceStyle(BDFDB.ReactUtils.createElement(this.props.scroller ? InternalComponents.LibraryComponents.Scrollers.Thin : "div", Object.assign(BDFDB.ObjectUtils.exclude(this.props, "scroller", "open", "render"), {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.modaltabcontent, this.props.open && BDFDB.disCN.modaltabcontentopen, this.props.className),
							style: Object.assign({}, this.props.style, {
								display: this.props.open ? null : "none"
							}),
							children: !this.props.open && !this.props.render ? null : this.props.children
						})), ["display"]);
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.ModalComponents.ModalTabContent, {tab: "unnamed", render: true});
				
				InternalComponents.LibraryComponents.ModalComponents.ModalFooter = reactInitialized && class BDFDB_ModalFooter extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.modalfooter, this.props.className),
							direction: this.props.direction || InternalComponents.LibraryComponents.Flex.Direction.HORIZONTAL_REVERSE,
							align: InternalComponents.LibraryComponents.Flex.Align.STRETCH,
							grow: 0,
							shrink: 0,
							children: this.props.children
						});
					}
				};
				
				InternalComponents.LibraryComponents.MultiInput = reactInitialized && class BDFDB_MultiInput extends LibraryModules.React.Component {
					constructor(props) {
						super(props);
						this.state = {focused: false};
					}
					render() {
						if (this.props.children && this.props.children.props) this.props.children.props.className = BDFDB.DOMUtils.formatClassName(this.props.children.props.className, BDFDB.disCN.inputmultifield);
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.inputwrapper, BDFDB.disCN.inputmultiwrapper),
							children: BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.input, BDFDB.disCN.inputmulti, this.state.focused && BDFDB.disCN.inputfocused),
								children: [
									BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.DOMUtils.formatClassName(this.props.innerClassName, BDFDB.disCN.inputwrapper, BDFDB.disCN.inputmultifirst),
										children: this.props.children
									}),
									BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextInput, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
										className: BDFDB.disCN.inputmultilast,
										inputClassName: BDFDB.disCN.inputmultifield,
										onFocus: e => {this.setState({focused: true})},
										onBlur: e => {this.setState({focused: false})}
									}), "children", "innerClassName"))
								]
							})
						});
					}
				};
				
				InternalComponents.LibraryComponents.ListInput = reactInitialized && class BDFDB_ListInput extends LibraryModules.React.Component {
					handleChange() {
						if (typeof this.props.onChange) this.props.onChange(this.props.items, this);
					}
					render() {
						if (!BDFDB.ArrayUtils.is(this.props.items)) this.props.items = [];
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.MultiInput, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							className: BDFDB.disCN.inputlist,
							innerClassName: BDFDB.disCN.inputlistitems,
							onKeyDown: e => {
								if (e.which == 13 && e.target.value && e.target.value.trim()) {
									let value = e.target.value.trim();
									this.props.value = "";
									if (!this.props.items.includes(value)) {
										this.props.items.push(value);
										BDFDB.ReactUtils.forceUpdate(this);
										this.handleChange.apply(this, []);
									}
								}
							},
							children: this.props.items.map(item => BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Badges.TextBadge, {
								className: BDFDB.disCN.inputlistitem,
								color: "var(--bdfdb-blurple)",
								style: {borderRadius: "3px"},
								text: [
									item,
									BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
										className: BDFDB.disCN.inputlistdelete,
										name: InternalComponents.LibraryComponents.SvgIcon.Names.CLOSE,
										onClick: _ => {
											BDFDB.ArrayUtils.remove(this.props.items, item);
											BDFDB.ReactUtils.forceUpdate(this);
											this.handleChange.apply(this, []);
										}
									})
								]
							}))
						}), "items"));
					}
				};
				
				InternalComponents.LibraryComponents.PaginatedList = reactInitialized && class BDFDB_PaginatedList extends LibraryModules.React.Component {
					constructor(props) {
						super(props);
						this.state = {
							offset: props.offset
						};
					}
					jump(offset) {
						if (offset > -1 && offset < Math.ceil(this.props.items.length/this.props.amount) && this.state.offset != offset) {
							this.state.offset = offset;
							if (typeof this.props.onJump == "function") this.props.onJump(offset, this);
							BDFDB.ReactUtils.forceUpdate(this);
						}
					}
					renderPagination() {
						let maxOffset = Math.ceil(this.props.items.length/this.props.amount) - 1;
						return this.props.items.length > this.props.amount && BDFDB.ReactUtils.createElement("nav", {
							className: BDFDB.disCN.paginationlistpagination,
							children: [
								this.props.first && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
									text: BDFDB.LanguageUtils.LibraryStrings.first,
									"aria-label": BDFDB.LanguageUtils.LibraryStrings.first,
									tooltipConfig: {zIndex: 3001},
									onClick: _ => {if (this.state.offset > 0) this.jump(0);},
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.searchresultspaginationbutton, this.state.offset <= 0 && BDFDB.disCN.searchresultspaginationdisabled),
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											className: BDFDB.disCN.searchresultspaginationicon,
											name: InternalComponents.LibraryComponents.SvgIcon.Names.LEFT_DOUBLE_CARET
										})
									})
								}),
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
									text: BDFDB.LanguageUtils.LanguageStrings.PAGINATION_PREVIOUS,
									"aria-label": BDFDB.LanguageUtils.LanguageStrings.PAGINATION_PREVIOUS,
									tooltipConfig: {zIndex: 3001},
									onClick: _ => {
										if (this.state.offset > 0) this.jump(this.state.offset - 1);
									},
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.searchresultspaginationbutton, this.state.offset <= 0 && BDFDB.disCN.searchresultspaginationdisabled),
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											className: BDFDB.disCN.searchresultspaginationicon,
											name: InternalComponents.LibraryComponents.SvgIcon.Names.LEFT_CARET
										})
									})
								}),
								BDFDB.LanguageUtils.LanguageStringsFormat("PAGINATION_PAGE_OF", this.state.offset + 1, maxOffset + 1),
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
									text: BDFDB.LanguageUtils.LanguageStrings.PAGINATION_NEXT,
									"aria-label": BDFDB.LanguageUtils.LanguageStrings.PAGINATION_NEXT,
									tooltipConfig: {zIndex: 3001},
									onClick: _ => {if (this.state.offset < maxOffset) this.jump(this.state.offset + 1);},
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.searchresultspaginationbutton, this.state.offset >= maxOffset && BDFDB.disCN.searchresultspaginationdisabled),
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											className: BDFDB.disCN.searchresultspaginationicon,
											name: InternalComponents.LibraryComponents.SvgIcon.Names.RIGHT_CARET
										})
									})
								}),
								this.props.last && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
									text: BDFDB.LanguageUtils.LibraryStrings.last,
									"aria-label": BDFDB.LanguageUtils.LibraryStrings.last,
									tooltipConfig: {zIndex: 3001},
									onClick: _ => {if (this.state.offset < maxOffset) this.jump(maxOffset);},
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.searchresultspaginationbutton, this.state.offset >= maxOffset && BDFDB.disCN.searchresultspaginationdisabled),
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											className: BDFDB.disCN.searchresultspaginationicon,
											name: InternalComponents.LibraryComponents.SvgIcon.Names.RIGHT_DOUBLE_CARET
										})
									})
								}),
								this.props.jump && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextInput, {
									key: "pagination-list-jumpinput",
									type: "number",
									size: InternalComponents.LibraryComponents.TextInput.Sizes.MINI,
									value: this.state.offset + 1,
									min: 1,
									max: maxOffset + 1,
									onKeyDown: (event, instance) => {if (event.which == 13) this.jump(isNaN(parseInt(instance.props.value)) ? -1 : instance.props.value - 1);}
								}),
								this.props.jump && BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
									text: BDFDB.LanguageUtils.LanguageStrings.JUMP,
									"aria-label": BDFDB.LanguageUtils.LanguageStrings.JUMP,
									tooltipConfig: {zIndex: 3001},
									onClick: (event, instance) => {
										let jumpInput = BDFDB.ReactUtils.findOwner(BDFDB.ObjectUtils.get(instance, `${BDFDB.ReactUtils.instanceKey}.return`), {key: "pagination-list-jumpinput"});
										if (jumpInput) this.jump(isNaN(parseInt(jumpInput.props.value)) ? -1 : jumpInput.props.value - 1);
									},
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
										className: BDFDB.disCN.searchresultspaginationbutton,
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
											className: BDFDB.disCN.searchresultspaginationicon,
											style: {transform: "rotate(90deg"},
											name: InternalComponents.LibraryComponents.SvgIcon.Names.RIGHT_CARET
										})
									})
								})
							].filter(n => n)
						});
					}
					render() {
						let items = [], alphabet = {};
						if (BDFDB.ArrayUtils.is(this.props.items) && this.props.items.length) {
							if (!this.props.alphabetKey) items = this.props.items;
							else {
								let unsortedItems = [].concat(this.props.items);
								for (let key of ["0-9", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"]) {
									let numbers = key == "0-9", alphaItems = [];
									for (let item of unsortedItems) if (item && item[this.props.alphabetKey] && (numbers && !isNaN(parseInt(item[this.props.alphabetKey][0])) || item[this.props.alphabetKey].toUpperCase().indexOf(key) == 0)) alphaItems.push(item);
									for (let sortedItem of alphaItems) BDFDB.ArrayUtils.remove(unsortedItems, sortedItem);
									alphabet[key] = {items: BDFDB.ArrayUtils.keySort(alphaItems, this.props.alphabetKey), disabled: !alphaItems.length};
								}
								alphabet["?!"] = {items: BDFDB.ArrayUtils.keySort(unsortedItems, this.props.alphabetKey), disabled: !unsortedItems.length};
								for (let key in alphabet) items.push(alphabet[key].items);
								items = items.flat(10);
							}
						}
						return typeof this.props.renderItem != "function" || !items.length ? null : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Scrollers.Thin, {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.paginationlist, this.props.mini, BDFDB.disCN.paginationlistmini),
							fade: this.props.fade,
							children: [
								this.renderPagination(),
								items.length > this.props.amount && this.props.alphabetKey && BDFDB.ReactUtils.createElement("nav", {
									className: BDFDB.disCN.paginationlistalphabet,
									children: Object.keys(alphabet).map(key => BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Clickable, {
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.paginationlistalphabetchar, alphabet[key].disabled &&BDFDB.disCN.paginationlistalphabetchardisabled),
										onClick: _ => {if (!alphabet[key].disabled) this.jump(Math.floor(items.indexOf(alphabet[key].items[0])/this.props.amount));},
										children: key
									}))
								}),
								this.props.header,
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.paginationlistcontent,
									children: items.slice(this.state.offset * this.props.amount, (this.state.offset + 1) * this.props.amount).map((data, i) => {return this.props.renderItem(data, i);}).flat(10).filter(n => n)
								}),
								this.props.copyToBottom && this.renderPagination()
							].flat(10).filter(n => n)
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.PaginatedList, {amount: 50, offset: 0, jump: true, first: true, last: true, copyToBottom: false, fade: true});
				
				InternalComponents.LibraryComponents.Popout = reactInitialized && class BDFDB_Popout extends LibraryModules.React.Component {
					componentWillUnmount() {
						delete this.props.containerInstance.popout;
						if (typeof this.props.onClose == "function") this.props.onClose(this.props.containerInstance, this);
					}
					render() {
						let pos = typeof this.props.position == "string" ? this.props.position.toLowerCase() : null;
						let positionClass = pos && DiscordClasses["popout" + pos] ? BDFDB.disCN["popout" + pos] : BDFDB.disCN.popouttop;
						let arrowClass = !this.props.arrow ? BDFDB.disCN.popoutnoarrow : (pos && pos.indexOf("top") > -1 && pos != "top" ? BDFDB.disCN.popoutarrowalignmenttop : BDFDB.disCN.popoutarrowalignmentmiddle);
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.PopoutFocusLock, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.popoutwrapper, BDFDB.disCN.popout, positionClass, this.props.invert && pos && pos != "bottom" && BDFDB.disCN.popoutinvert, arrowClass, !this.props.shadow && BDFDB.disCN.popoutnoshadow),
							id: this.props.id,
							onClick: e => {e.stopPropagation();},
							style: Object.assign({}, this.props.style, {
								position: this.props.isChild ? "relative" : "absolute"
							}),
							children: BDFDB.ReactUtils.createElement("div", {
								className: BDFDB.DOMUtils.formatClassName(this.props.className, this.props.themed && BDFDB.disCN.popoutthemedpopout),
								style: BDFDB.ObjectUtils.extract(this.props, "padding", "height", "maxHeight", "minHeight", "width", "maxWidth", "minWidth"),
								children: this.props.children
							})
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.Popout, {themed: true});
				
				InternalComponents.LibraryComponents.PopoutContainer = reactInitialized && class BDFDB_PopoutContainer extends LibraryModules.React.Component {
					handleRender(e) {
						let children = typeof this.props.renderPopout == "function" ? this.props.renderPopout(this) : null;
						return this.context.popout = !children ? null : (!this.props.wrap ? children : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Popout, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							className: this.props.popoutClassName,
							containerInstance: this,
							isChild: true,
							position: e.position,
							style: this.props.popoutStyle,
							onClose: typeof this.props.onClose == "function" ? this.props.onClose.bind(this) : _ => {},
							children: children
						}), "popoutStyle", "popoutClassName")));
					}
					componentDidMount() {
						let basePopout = BDFDB.ReactUtils.findOwner(this, {name: "BasePopout"});
						if (!basePopout || !basePopout.handleClick) return;
						basePopout.isBDFDBpopout = true;
						this.handleClick = e => {return basePopout.handleClick(BDFDB.ObjectUtils.is(e) ? e : (new MouseEvent({})));};
						this.close = basePopout.close;
						this.domElementRef = basePopout.domElementRef;
					}
					render() {
						let child = (BDFDB.ArrayUtils.is(this.props.children) ? this.props.children[0] : this.props.children) || BDFDB.ReactUtils.createElement("div", {style: {height: "100%", width: "100%"}});
						child.props.className = BDFDB.DOMUtils.formatClassName(child.props.className, this.props.className);
						let childClick = child.props.onClick, childContextMenu = child.props.onContextMenu;
						child.props.onClick = (e, childThis) => {
							if (!this.domElementRef.current || this.domElementRef.current.contains(e.target)) {
								if ((this.props.openOnClick || this.props.openOnClick === undefined) && typeof this.handleClick == "function") this.handleClick(e);
								if (typeof this.props.onClick == "function") this.props.onClick(e, this);
								if (typeof childClick == "function") childClick(e, childThis);
							}
							else e.stopPropagation();
						};
						child.props.onContextMenu = (e, childThis) => {
							if (!this.domElementRef.current || this.domElementRef.current.contains(e.target)) {
								if (this.props.openOnContextMenu && typeof this.handleClick == "function") this.handleClick(e);
								if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);
								if (typeof childContextMenu == "function") childContextMenu(e, childThis);
							}
							else e.stopPropagation();
						};
						return BDFDB.ReactUtils.createElement(LibraryModules.React.Fragment, {
							children: BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.PopoutContainer, Object.assign({}, this.props, {
								children: _ => {return child;},
								renderPopout: this.handleRender.bind(this)
							}))
						});
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.PopoutContainer, {wrap: true});
				
				InternalComponents.LibraryComponents.QuickSelect = reactInitialized && class BDFDB_QuickSelect extends LibraryModules.React.Component {
					handleChange(option) {
						this.props.value = option;
						if (typeof this.props.onChange == "function") this.props.onChange(option.value || option.key, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						let options = (BDFDB.ArrayUtils.is(this.props.options) ? this.props.options : [{}]).filter(n => n);
						let selectedOption = BDFDB.ObjectUtils.is(this.props.value) ? this.props.value : (options[0] || {});
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.quickselectwrapper),
							children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
								className: BDFDB.disCN.quickselect,
								align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
								children: [
									BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN.quickselectlabel,
										children: this.props.label
									}),
									BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
										align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
										className: BDFDB.disCN.quickselectclick,
										onClick: event => {
											LibraryModules.ContextMenuUtils.openContextMenu(event, _ => {
												return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Menu, {
													navId: "bdfdb-quickselect",
													onClose: BDFDB.LibraryModules.ContextMenuUtils.closeContextMenu,
													className: this.props.popoutClassName,
													children: BDFDB.ContextMenuUtils.createItem(InternalComponents.LibraryComponents.MenuItems.MenuGroup, {
														children: options.map((option, i) => {
															let selected = option.value && option.value === selectedOption.value || option.key && option.key === selectedOption.key;
															return BDFDB.ContextMenuUtils.createItem(InternalComponents.LibraryComponents.MenuItems.MenuItem, {
																label: option.label,
																id: BDFDB.ContextMenuUtils.createItemId("option", option.key || option.value || i),
																action: selected ? null : event2 => {
																	this.handleChange.bind(this)(option)
																}
															});
														})
													})
												});
											});
										},
										children: [
											BDFDB.ReactUtils.createElement("div", {
												className: BDFDB.disCN.quickselectvalue,
												children: typeof this.props.renderValue == "function" ? this.props.renderValue(this.props.value) : this.props.value.label
											}),
											BDFDB.ReactUtils.createElement("div", {
												className: BDFDB.disCN.quickselectarrow
											})
										]
									})
								]
							})
						});
					}
				};
				
				InternalComponents.LibraryComponents.RadioGroup = reactInitialized && class BDFDB_RadioGroup extends LibraryModules.React.Component {
					handleChange(value) {
						this.props.value = value.value;
						if (typeof this.props.onChange == "function") this.props.onChange(value, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.RadioGroup, Object.assign({}, this.props, {
							onChange: this.handleChange.bind(this)
						}));
					}
				};
				
				InternalComponents.LibraryComponents.SearchBar = reactInitialized && class BDFDB_SearchBar extends LibraryModules.React.Component {
					handleChange(query) {
						this.props.query = query;
						if (typeof this.props.onChange == "function") this.props.onChange(query, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					handleClear() {
						this.props.query = "";
						if (this.props.changeOnClear && typeof this.props.onChange == "function") this.props.onChange("", this);
						if (typeof this.props.onClear == "function") this.props.onClear(this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						let props = Object.assign({}, this.props, {
							onChange: this.handleChange.bind(this),
							onClear: this.handleClear.bind(this)
						});
						if (typeof props.query != "string") props.query = "";
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.SearchBar, props);
					}
				};
				
				let NativeSubSelectExport = (BDFDB.ModuleUtils.find(m => m == InternalComponents.NativeSubComponents.Select, false) || {exports: {}}).exports;
				InternalComponents.LibraryComponents.Select = reactInitialized && class BDFDB_Select extends LibraryModules.React.Component {
					handleChange(value) {
						this.props.value = value.value || value;
						if (typeof this.props.onChange == "function") this.props.onChange(value, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						let lightTheme = BDFDB.DiscordUtils.getTheme() == BDFDB.disCN.themelight;
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: BDFDB.disCN.selectwrapper,
							direction: InternalComponents.LibraryComponents.Flex.Direction.HORIZONTAL,
							align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
							children: BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.Select, Object.assign({}, this.props, {
								lightThemeColorOverrides: NativeSubSelectExport[lightTheme ? "LIGHT_THEME_COLORS" : "DARK_THEME_COLORS"],
								darkThemeColorOverrides: NativeSubSelectExport[lightTheme ? "LIGHT_THEME_COLORS" : "DARK_THEME_COLORS"],
								onChange: this.handleChange.bind(this)
							}))
						});
					}
				};
				
				InternalComponents.LibraryComponents.SettingsGuildList = reactInitialized && class BDFDB_SettingsGuildList extends LibraryModules.React.Component {
					render() {
						this.props.disabled = BDFDB.ArrayUtils.is(this.props.disabled) ? this.props.disabled : [];
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
							className: this.props.className,
							wrap: InternalComponents.LibraryComponents.Flex.Wrap.WRAP,
							children: [this.props.includeDMs && {name: "Direct Messages", acronym: "DMs", id: BDFDB.DiscordConstants.ME, getIconURL: _ => {}}].concat(BDFDB.LibraryModules.FolderStore.getFlattenedGuilds()).filter(n => n).map(guild => BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
								text: guild.name,
								children: BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.DOMUtils.formatClassName(this.props.guildClassName, BDFDB.disCN.settingsguild, this.props.disabled.includes(guild.id) && BDFDB.disCN.settingsguilddisabled),
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.GuildComponents.Icon, {
										guild: guild,
										size: this.props.size || InternalComponents.LibraryComponents.GuildComponents.Icon.Sizes.MEDIUM
									}),
									onClick: e => {
										let isDisabled = this.props.disabled.includes(guild.id);
										if (isDisabled) BDFDB.ArrayUtils.remove(this.props.disabled, guild.id, true);
										else this.props.disabled.push(guild.id);
										if (typeof this.props.onClick == "function") this.props.onClick(this.props.disabled, this);
										BDFDB.ReactUtils.forceUpdate(this);
									}
								})
							}))
						});
					}
				};
				
				InternalComponents.LibraryComponents.SettingsPanel = reactInitialized && class BDFDB_SettingsPanel extends LibraryModules.React.Component {
					componentDidMount() {
						this.props._instance = this;
						let node = BDFDB.ReactUtils.findDOMNode(this);
						if (node) this.props._node = node;
					}
					componentWillUnmount() {
						if (BDFDB.ObjectUtils.is(this.props.addon) && typeof this.props.addon.onSettingsClosed == "function") this.props.addon.onSettingsClosed();
					}
					render() {						
						let panelItems = [
							typeof this.props.children == "function" ? (_ => {
								return this.props.children(this.props.collapseStates);
							})() : this.props.children
						].flat(10).filter(n => n);
						
						return BDFDB.ReactUtils.createElement("div", {
							key: this.props.addon && this.props.addon.name && `${this.props.addon.name}-settingsPanel`,
							id: this.props.addon && this.props.addon.name && `${this.props.addon.name}-settings`,
							className: BDFDB.disCN.settingspanel,
							children: panelItems
						});
					}
				};
				
				InternalComponents.LibraryComponents.SettingsPanelList = InternalComponents.LibraryComponents.SettingsPanelInner = reactInitialized && class BDFDB_SettingsPanelInner extends LibraryModules.React.Component {
					render() {
						return this.props.children ? BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.settingspanellistwrapper, this.props.mini && BDFDB.disCN.settingspanellistwrappermini),
							children: [
								this.props.dividerTop ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormDivider, {
									className: this.props.mini ? BDFDB.disCN.marginbottom4 : BDFDB.disCN.marginbottom8
								}) : null,
								typeof this.props.title == "string" ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormTitle, {
									className: BDFDB.disCN.marginbottom4,
									tag: InternalComponents.LibraryComponents.FormComponents.FormTitle.Tags.H3,
									children: this.props.title
								}) : null,
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.settingspanellist,
									children: this.props.children
								}),
								this.props.dividerBottom ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormDivider, {
									className: this.props.mini ? BDFDB.disCN.margintop4 : BDFDB.disCN.margintop8
								}) : null
							]
						}) : null;
					}
				};
				
				InternalComponents.LibraryComponents.SettingsItem = reactInitialized && class BDFDB_SettingsItem extends LibraryModules.React.Component {
					handleChange(value) {
						if (typeof this.props.onChange == "function") this.props.onChange(value, this);
					}
					render() {
						if (typeof this.props.type != "string" || !["BUTTON", "SELECT", "SLIDER", "SWITCH", "TEXTINPUT"].includes(this.props.type.toUpperCase())) return null;
						let childComponent = InternalComponents.LibraryComponents[this.props.type];
						if (!childComponent) return null;
						if (this.props.mini && childComponent.Sizes) this.props.size = childComponent.Sizes.MINI || childComponent.Sizes.MIN;
						let label = this.props.label ? (this.props.tag ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormTitle, {
							className: BDFDB.DOMUtils.formatClassName(this.props.labelClassName, BDFDB.disCN.marginreset),
							tag: this.props.tag,
							children: this.props.label
						}) : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SettingsLabel, {
							className: BDFDB.DOMUtils.formatClassName(this.props.labelClassName),
							mini: this.props.mini,
							label: this.props.label
						})) : null;
						let margin = this.props.margin != null ? this.props.margin : (this.props.mini ? 0 : 8);
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.settingsrow, BDFDB.disCN.settingsrowcontainer, this.props.disabled && BDFDB.disCN.settingsrowdisabled, margin != null && (BDFDB.DiscordClasses[`marginbottom${margin}`] && BDFDB.disCN[`marginbottom${margin}`] || margin == 0 && BDFDB.disCN.marginreset)),
							id: this.props.id,
							children: [
								this.props.dividerTop ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormDivider, {
									className: this.props.mini ? BDFDB.disCN.marginbottom4 : BDFDB.disCN.marginbottom8
								}) : null,
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.settingsrowlabel,
									children: [
										label && !this.props.basis ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
											grow: 1,
											shrink: 1,
											wrap: true,
											children: label
										}) : label,
										this.props.labelchildren,
										BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
											className: BDFDB.disCNS.settingsrowcontrol + BDFDB.disCN.flexchild,
											grow: 0,
											shrink: this.props.basis ? 0 : 1,
											basis: this.props.basis,
											wrap: true,
											children: BDFDB.ReactUtils.createElement(childComponent, BDFDB.ObjectUtils.exclude(Object.assign(BDFDB.ObjectUtils.exclude(this.props, "className", "id", "type"), this.props.childProps, {
												onChange: this.handleChange.bind(this),
												onValueChange: this.handleChange.bind(this)
											}), "basis", "margin", "dividerBottom", "dividerTop", "label", "labelClassName", "labelchildren", "tag", "mini", "note", "childProps"))
										})
									].flat(10).filter(n => n)
								}),
								typeof this.props.note == "string" ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
									className: BDFDB.disCN.settingsrownote,
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormText, {
										disabled: this.props.disabled,
										type: InternalComponents.LibraryComponents.FormComponents.FormText.Types.DESCRIPTION,
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextScroller, {speed: 2, children: this.props.note})
									})
								}) : null,
								this.props.dividerBottom ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FormComponents.FormDivider, {
									className: this.props.mini ? BDFDB.disCN.margintop4 : BDFDB.disCN.margintop8
								}) : null
							]
						});
					}
				};
				
				InternalComponents.LibraryComponents.SettingsLabel = reactInitialized && class BDFDB_SettingsLabel extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextScroller, {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.settingsrowtitle, this.props.mini ? BDFDB.disCN.settingsrowtitlemini : BDFDB.disCN.settingsrowtitledefault, BDFDB.disCN.cursordefault),
							speed: 2,
							children: this.props.label
						});
					}	
				};
				
				InternalComponents.LibraryComponents.SettingsList = reactInitialized && class BDFDB_SettingsList extends LibraryModules.React.Component {
					componentDidMount() {
						this.checkList();
					}
					componentDidUpdate() {
						this.checkList();
					}
					checkList() {
						let list = BDFDB.ReactUtils.findDOMNode(this);
						if (list && !this.props.configWidth) {
							let headers = Array.from(list.querySelectorAll(BDFDB.dotCN.settingstableheader));
							headers.shift();
							if (BDFDB.DOMUtils.getRects(headers[0]).width == 0) BDFDB.TimeUtils.timeout(_ => {this.resizeList(headers);});
							else this.resizeList(headers);
						}
					}
					resizeList(headers) {
						let configWidth = 0, biggestWidth = 0;
						if (!configWidth) {
							for (let header of headers) {
								header.style = "";
								let width = BDFDB.DOMUtils.getRects(header).width;
								configWidth = width > configWidth ? width : configWidth;
							}
							configWidth += 4;
							biggestWidth = configWidth;
						}
						if (headers.length * configWidth > 300) {
							this.props.vertical = true;
							configWidth = parseInt(290 / headers.length);
						}
						else if (configWidth < 36) {
							configWidth = 36;
							biggestWidth = configWidth;
						}
						this.props.configWidth = configWidth;
						this.props.biggestWidth = biggestWidth;
						BDFDB.ReactUtils.forceUpdate(this);
					}
					renderHeaderOption(props) {
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(props.className, BDFDB.disCN.colorbase, BDFDB.disCN.size10, props.clickable && BDFDB.disCN.cursorpointer),
							onClick: _ => {if (typeof this.props.onHeaderClick == "function") this.props.onHeaderClick(props.label, this);},
							onContextMenu: _ => {if (typeof this.props.onHeaderContextMenu == "function") this.props.onHeaderContextMenu(props.label, this);},
							children: BDFDB.ReactUtils.createElement("span", {
								children: props.label
							})
						});
					}
					renderItem(props) {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Card, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							className: BDFDB.DOMUtils.formatClassName([this.props.cardClassName, props.className].filter(n => n).join(" ").indexOf(BDFDB.disCN.card) == -1 && BDFDB.disCN.cardprimaryoutline, BDFDB.disCN.settingstablecard, this.props.cardClassName, props.className),
							cardId: props.key,
							backdrop: false,
							horizontal: true,
							style: Object.assign({}, this.props.cardStyle, props.style),
							children: [
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.settingstablecardlabel,
									children: this.props.renderLabel(props)
								}),
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.settingstablecardconfigs,
									style: {
										width: props.wrapperWidth || null,
										minWidth: props.wrapperWidth || null,
										maxWidth: props.wrapperWidth || null
									},
									children: this.props.settings.map(setting => BDFDB.ReactUtils.createElement("div", {
										className: BDFDB.disCN.checkboxcontainer,
										children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Checkbox, {
											disabled: props.disabled,
											cardId: props.key,
											settingId: setting,
											shape: InternalComponents.LibraryComponents.Checkbox.Shapes.ROUND,
											type: InternalComponents.LibraryComponents.Checkbox.Types.INVERTED,
											value: props[setting],
											onChange: this.props.onCheckboxChange
										})
									})).flat(10).filter(n => n)
								})
							]
						}), "title", "data", "settings", "renderLabel", "cardClassName", "cardStyle", "onCheckboxChange", "maxWidth", "fullWidth", "biggestWidth", "pagination"));
					}
					render() {
						this.props.settings = BDFDB.ArrayUtils.is(this.props.settings) ? this.props.settings : [];
						this.props.renderLabel = typeof this.props.renderLabel == "function" ? this.props.renderLabel : data => data.label;
						this.props.data = (BDFDB.ArrayUtils.is(this.props.data) ? this.props.data : [{}]).filter(n => n);
						
						let wrapperWidth = this.props.configWidth && this.props.configWidth * this.props.settings.length;
						let isHeaderClickable = typeof this.props.onHeaderClick == "function" || typeof this.props.onHeaderContextMenu == "function";
						let usePagination = BDFDB.ObjectUtils.is(this.props.pagination);
						
						let header = BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.disCN.settingstableheaders,
							style: this.props.vertical && this.props.biggestWidth ? {
								marginTop: this.props.biggestWidth - 15 || 0
							} : {},
							children: [
								this.renderHeaderOption({
									className: BDFDB.disCN.settingstableheadername,
									clickable: this.props.title && isHeaderClickable,
									label: this.props.title || ""
								}),
								BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.settingstableheaderoptions,
									style: {
										width: wrapperWidth || null,
										minWidth: wrapperWidth || null,
										maxWidth: wrapperWidth || null
									},
									children: this.props.settings.map(setting => this.renderHeaderOption({
										className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.settingstableheaderoption, this.props.vertical && BDFDB.disCN.settingstableheadervertical),
										clickable: isHeaderClickable,
										label: setting
									}))
								})
							]
						});
						return !this.props.data.length ? null : BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.settingstablelist, this.props.className),
							children: [
								!usePagination && header,
								!usePagination ? this.props.data.map(data => this.renderItem(Object.assign({}, data, {wrapperWidth}))) : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.PaginatedList, Object.assign({}, this.props.pagination, {
									header: header,
									items: this.props.data,
									renderItem: data => this.renderItem(Object.assign({}, data, {wrapperWidth})),
									onJump: (offset, instance) => {
										this.props.pagination.offset = offset;
										if (typeof this.props.pagination.onJump == "function") this.props.pagination.onJump(offset, this, instance);
									}
								}))
							].filter(n => n)
						});
					}
				};
				
				InternalComponents.LibraryComponents.SettingsSaveItem = reactInitialized && class BDFDB_SettingsSaveItem extends LibraryModules.React.Component {
					saveSettings(value) {
						if (!BDFDB.ArrayUtils.is(this.props.keys) || !BDFDB.ObjectUtils.is(this.props.plugin)) return;
						let keys = this.props.keys.filter(n => n);
						let option = keys.shift();
						if (BDFDB.ObjectUtils.is(this.props.plugin) && option) {
							let data = BDFDB.DataUtils.load(this.props.plugin, option);
							let newData = "";
							for (let key of keys) newData += `{"${key}":`;
							value = value != null && value.value != null ? value.value : value;
							let isString = typeof value == "string";
							let marker = isString ? `"` : ``;
							newData += (marker + (isString ? value.replace(/\\/g, "\\\\") : value) + marker) + "}".repeat(keys.length);
							newData = JSON.parse(newData);
							BDFDB.DataUtils.save(BDFDB.ObjectUtils.is(newData) ? BDFDB.ObjectUtils.deepAssign({}, data, newData) : newData, this.props.plugin, option);
							this.props.plugin.SettingsUpdated = true;
						}
						if (typeof this.props.onChange == "function") this.props.onChange(value, this);
					}
					render() {
						if (typeof this.props.type != "string" || !["SELECT", "SLIDER", "SWITCH", "TEXTINPUT"].includes(this.props.type.toUpperCase())) return null;
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SettingsItem, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							onChange: this.saveSettings.bind(this)
						}), "keys", "key", "plugin"));
					}
				};
				
				InternalComponents.LibraryComponents.SidebarList = reactInitialized && class BDFDB_SidebarList extends LibraryModules.React.Component {
					handleItemSelect(item) {
						this.props.selectedItem = item;
						if (typeof this.props.onItemSelect == "function") this.props.onItemSelect(item, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						let items = (BDFDB.ArrayUtils.is(this.props.items) ? this.props.items : [{}]).filter(n => n);
						let selectedItem = this.props.selectedItem || (items[0] || {}).value;
						let selectedElements = (items.find(n => n.value == selectedItem) || {}).elements;
						let renderElement = typeof this.props.renderElement == "function" ? this.props.renderElement : (_ => {});
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(this.props.className, BDFDB.disCN.sidebarlist),
							children: [
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Scrollers.Thin, {
									className: BDFDB.DOMUtils.formatClassName(this.props.sidebarClassName, BDFDB.disCN.sidebar),
									fade: true,
									children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TabBar, {
										itemClassName: this.props.itemClassName,
										type: InternalComponents.LibraryComponents.TabBar.Types.SIDE,
										items: items,
										selectedItem: selectedItem,
										renderItem: this.props.renderItem,
										onItemSelect: this.handleItemSelect.bind(this)
									})
								}),
								BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Scrollers.Thin, {
									className: BDFDB.DOMUtils.formatClassName(this.props.contentClassName, BDFDB.disCN.sidebarcontent),
									fade: true,
									children: [selectedElements].flat(10).filter(n => n).map(data => renderElement(data))
								})
							]
						});
					}
				};
				
				InternalComponents.LibraryComponents.Slider = reactInitialized && class BDFDB_Slider extends LibraryModules.React.Component {
					handleMarkerRender(marker) {
						let newMarker = BDFDB.NumberUtils.mapRange([0, 100], this.props.edges, marker);
						if (typeof this.props.digits == "number") newMarker = Math.round(newMarker * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
						return newMarker;
					}
					handleValueChange(value) {
						let newValue = BDFDB.NumberUtils.mapRange([0, 100], this.props.edges, value);
						if (typeof this.props.digits == "number") newValue = Math.round(newValue * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
						this.props.defaultValue = this.props.value = newValue;
						if (typeof this.props.onValueChange == "function") this.props.onValueChange(newValue, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					handleValueRender(value) {
						let newValue = BDFDB.NumberUtils.mapRange([0, 100], this.props.edges, value);
						if (typeof this.props.digits == "number") newValue = Math.round(newValue * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
						if (typeof this.props.onValueRender == "function") {
							let tempReturn = this.props.onValueRender(newValue, this);
							if (tempReturn != undefined) newValue = tempReturn;
						}
						return newValue;
					}
					render() {
						let value = this.props.value || this.props.defaultValue || 0;
						if (!BDFDB.ArrayUtils.is(this.props.edges) || this.props.edges.length != 2) this.props.edges = [this.props.min || this.props.minValue || 0, this.props.max || this.props.maxValue || 100];
						this.props.minValue = 0;
						this.props.maxValue = 100;
						let defaultValue = BDFDB.NumberUtils.mapRange(this.props.edges, [0, 100], value);
						if (typeof this.props.digits == "number") defaultValue = Math.round(defaultValue * Math.pow(10, this.props.digits)) / Math.pow(10, this.props.digits);
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.Slider, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							initialValue: defaultValue,
							markers: typeof this.props.markerAmount == "number" ? Array.from(Array(this.props.markerAmount).keys()).map((_, i) => i * (this.props.maxValue - this.props.minValue)/10) : undefined,
							onMarkerRender: this.handleMarkerRender.bind(this),
							onValueChange: this.handleValueChange.bind(this),
							onValueRender: this.handleValueRender.bind(this)
						}), "digits", "edges", "max", "min", "markerAmount"));
					}
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.Slider, {hideBubble: false});
				
				InternalComponents.LibraryComponents.SvgIcon = reactInitialized && class BDFDB_Icon extends LibraryModules.React.Component {
					render() {
						if (BDFDB.ObjectUtils.is(this.props.name)) {
							let calcClassName = [];
							if (BDFDB.ObjectUtils.is(this.props.name.getClassName)) for (let path in this.props.name.getClassName) {
								if (!path || BDFDB.ObjectUtils.get(this, path)) calcClassName.push(BDFDB.disCN[this.props.name.getClassName[path]]);
							}
							if (calcClassName.length || this.props.className) this.props.nativeClass = true;
							this.props.iconSVG = this.props.name.icon;
							let props = Object.assign({
								width: 24,
								height: 24,
								color: "currentColor"
							}, this.props.name.defaultProps, this.props, {
								className: BDFDB.DOMUtils.formatClassName(calcClassName, this.props.className)
							});
							for (let key in props) this.props.iconSVG = this.props.iconSVG.replace(new RegExp(`%%${key}`, "g"), props[key]);
						}
						if (this.props.iconSVG) {
							let icon = BDFDB.ReactUtils.elementToReact(BDFDB.DOMUtils.create(this.props.iconSVG));
							if (BDFDB.ReactUtils.isValidElement(icon)) {
								icon.props.className = BDFDB.DOMUtils.formatClassName(!this.props.nativeClass && BDFDB.disCN.svgicon, icon.props.className, this.props.className);
								icon.props.style = Object.assign({}, icon.props.style, this.props.style);
								icon.props = Object.assign({}, BDFDB.ObjectUtils.extract(this.props, "onClick", "onContextMenu", "onMouseDown", "onMouseUp", "onMouseEnter", "onMouseLeave"), icon.props);
								return icon;
							}
						}
						return null;
					}
				};
				InternalComponents.LibraryComponents.SvgIcon.Names = InternalData.SvgIcons || {};
				
				const SwitchIconPaths = {
					a: {
						TOP: "M5.13231 6.72963L6.7233 5.13864L14.855 13.2704L13.264 14.8614L5.13231 6.72963Z",
						BOTTOM: "M13.2704 5.13864L14.8614 6.72963L6.72963 14.8614L5.13864 13.2704L13.2704 5.13864Z"
					},
					b: {
						TOP: "M6.56666 11.0013L6.56666 8.96683L13.5667 8.96683L13.5667 11.0013L6.56666 11.0013Z",
						BOTTOM: "M13.5582 8.96683L13.5582 11.0013L6.56192 11.0013L6.56192 8.96683L13.5582 8.96683Z"
					},
					c: {
						TOP: "M7.89561 14.8538L6.30462 13.2629L14.3099 5.25755L15.9009 6.84854L7.89561 14.8538Z",
						BOTTOM: "M4.08643 11.0903L5.67742 9.49929L9.4485 13.2704L7.85751 14.8614L4.08643 11.0903Z"
					}
				};
				const SwitchInner = function(props) {
					let reducedMotion = BDFDB.ReactUtils.useContext(LibraryModules.PreferencesContext.AccessibilityPreferencesContext).reducedMotion;
					let ref = BDFDB.ReactUtils.useRef(null);
					let state = BDFDB.ReactUtils.useState(false);
					let animation = InternalComponents.LibraryComponents.Animations.useSpring({
						config: {
							mass: 1,
							tension: 250
						},
						opacity: props.disabled ? .3 : 1,
						state: state[0] ? (props.value ? .7 : .3) : (props.value ? 1 : 0)
					});
					let fill = animation.state.to({
						output: [props.uncheckedColor, props.checkedColor]
					});
					let mini = props.size == InternalComponents.LibraryComponents.Switch.Sizes.MINI;
					
					return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.div, {
						className: BDFDB.DOMUtils.formatClassName(props.className, BDFDB.disCN.switch, mini && BDFDB.disCN.switchmini),
						onMouseDown: _ => {
							return !props.disabled && state[1](true);
						},
						onMouseUp: _ => {
							return state[1](false);
						},
						onMouseLeave: _ => {
							return state[1](false);
						},
						style: {
							opacity: animation.opacity,
							backgroundColor: animation.state.to({
								output: [props.uncheckedColor, props.checkedColor]
							})
						},
						tabIndex: -1,
						children: [
							BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.svg, {
								className: BDFDB.disCN.switchslider,
								viewBox: "0 0 28 20",
								preserveAspectRatio: "xMinYMid meet",
								style: {
									left: animation.state.to({
										range: [0, .3, .7, 1],
										output: mini ? [-1, 2, 6, 9] : [-3, 1, 8, 12]
									})
								},
								children: [
									BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.rect, {
										fill: "white",
										x: animation.state.to({
											range: [0, .3, .7, 1],
											output: [4, 0, 0, 4]
										}),
										y: animation.state.to({
											range: [0, .3, .7, 1],
											output: [0, 1, 1, 0]
										}),
										height: animation.state.to({
											range: [0, .3, .7, 1],
											output: [20, 18, 18, 20]
										}),
										width: animation.state.to({
											range: [0, .3, .7, 1],
											output: [20, 28, 28, 20]
										}),
										rx: "10"
									}),
									BDFDB.ReactUtils.createElement("svg", {
										viewBox: "0 0 20 20",
										fill: "none",
										children: [
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.path, {
												fill: fill,
												d: animation.state.to({
													range: [0, .3, .7, 1],
													output: reducedMotion.enabled ? [SwitchIconPaths.a.TOP, SwitchIconPaths.a.TOP, SwitchIconPaths.c.TOP, SwitchIconPaths.c.TOP] : [SwitchIconPaths.a.TOP, SwitchIconPaths.b.TOP, SwitchIconPaths.b.TOP, SwitchIconPaths.c.TOP]
												})
											}),
											BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.path, {
												fill: fill,
												d: animation.state.to({
													range: [0, .3, .7, 1],
													output: reducedMotion.enabled ? [SwitchIconPaths.a.BOTTOM, SwitchIconPaths.a.BOTTOM, SwitchIconPaths.c.BOTTOM, SwitchIconPaths.c.BOTTOM] : [SwitchIconPaths.a.BOTTOM, SwitchIconPaths.b.BOTTOM, SwitchIconPaths.b.BOTTOM, SwitchIconPaths.c.BOTTOM]
												})
											})
										]
									})
								]
							}),
							BDFDB.ReactUtils.createElement("input", BDFDB.ObjectUtils.exclude(Object.assign({}, props, {
								id: props.id,
								type: "checkbox",
								ref: ref,
								className: BDFDB.DOMUtils.formatClassName(props.inputClassName, BDFDB.disCN.switchinner),
								tabIndex: props.disabled ? -1 : 0,
								onKeyDown: e => {
									if (!props.disabled && !e.repeat && (e.key == " " || e.key == "Enter")) state[1](true);
								},
								onKeyUp: e => {
									if (!props.disabled && !e.repeat) {
										state[1](false);
										if (e.key == "Enter" && ref.current) ref.current.click();
									}
								},
								onChange: e => {
									state[1](false);
									if (typeof props.onChange == "function") props.onChange(e.currentTarget.checked, e);
								},
								checked: props.value,
								disabled: props.disabled
							}), "uncheckedColor", "checkedColor", "size", "value"))
						]
					});
				};
				InternalComponents.LibraryComponents.Switch = reactInitialized && class BDFDB_Switch extends LibraryModules.React.Component {
					handleChange() {
						this.props.value = !this.props.value;
						if (typeof this.props.onChange == "function") this.props.onChange(this.props.value, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						return BDFDB.ReactUtils.createElement(SwitchInner, Object.assign({}, this.props, {
							onChange: this.handleChange.bind(this)
						}));
					}
				};
				InternalComponents.LibraryComponents.Switch.Sizes = {
					DEFAULT: "default",
					MINI: "mini",
				};
				InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.Switch, {
					size: InternalComponents.LibraryComponents.Switch.Sizes.DEFAULT,
					uncheckedColor: BDFDB.DiscordConstants.Colors.PRIMARY_DARK_400,
					checkedColor: BDFDB.DiscordConstants.Colors.BRAND
				});
				
				InternalComponents.LibraryComponents.TabBar = reactInitialized && class BDFDB_TabBar extends LibraryModules.React.Component {
					handleItemSelect(item) {
						this.props.selectedItem = item;
						if (typeof this.props.onItemSelect == "function") this.props.onItemSelect(item, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					render() {
						let items = (BDFDB.ArrayUtils.is(this.props.items) ? this.props.items : [{}]).filter(n => n);
						let selectedItem = this.props.selectedItem || (items[0] || {}).value;
						let renderItem = typeof this.props.renderItem == "function" ? this.props.renderItem : (data => data.label || data.value);
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.TabBar, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							selectedItem: selectedItem,
							onItemSelect: this.handleItemSelect.bind(this),
							children: items.map(data => BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TabBar.Item, {
								className: BDFDB.DOMUtils.formatClassName(this.props.itemClassName, selectedItem == data.value && this.props.itemSelectedClassName),
								itemType: this.props.type,
								id: data.value,
								children: renderItem(data),
								"aria-label": data.label || data.value
							}))
						}), "itemClassName", "items", "renderItem"));
					}
				};
				
				InternalComponents.LibraryComponents.Table = reactInitialized && class BDFDB_Table extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.Table, Object.assign({}, this.props, {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.table, this.props.className),
							headerCellClassName: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tableheadercell, this.props.headerCellClassName),
							sortedHeaderCellClassName: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tableheadercellsorted, this.props.sortedHeaderCellClassName),
							bodyCellClassName: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.tablebodycell, this.props.bodyCellClassName),
							onSort: (sortKey, sortDirection) => {
								this.props.sortDirection = this.props.sortKey != sortKey && sortDirection == InternalComponents.LibraryComponents.Table.SortDirection.ASCENDING && this.props.columns.filter(n => n.key == sortKey)[0].reverse ? InternalComponents.LibraryComponents.Table.SortDirection.DESCENDING : sortDirection;
								this.props.sortKey = sortKey;
								this.props.data = BDFDB.ArrayUtils.keySort(this.props.data, this.props.sortKey);
								if (this.props.sortDirection == InternalComponents.LibraryComponents.Table.SortDirection.DESCENDING) this.props.data.reverse();
								if (typeof this.props.onSort == "function") this.props.onSort(this.props.sortKey, this.props.sortDirection);
								BDFDB.ReactUtils.forceUpdate(this);
							}
						}));
					}
				};
				
				InternalComponents.LibraryComponents.TextArea = reactInitialized && class BDFDB_TextArea extends LibraryModules.React.Component {
					handleChange(e) {
						this.props.value = e;
						if (typeof this.props.onChange == "function") this.props.onChange(e, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					handleBlur(e) {if (typeof this.props.onBlur == "function") this.props.onBlur(e, this);}
					handleFocus(e) {if (typeof this.props.onFocus == "function") this.props.onFocus(e, this);}
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.NativeSubComponents.TextArea, Object.assign({}, this.props, {
							onChange: this.handleChange.bind(this),
							onBlur: this.handleBlur.bind(this),
							onFocus: this.handleFocus.bind(this)
						}));
					}
				};
				
				InternalComponents.LibraryComponents.TextGradientElement = reactInitialized && class BDFDB_TextGradientElement extends LibraryModules.React.Component {
					render() {
						if (this.props.gradient && this.props.children) return BDFDB.ReactUtils.createElement("span", {
							children: this.props.children,
							ref: instance => {
								let ele = BDFDB.ReactUtils.findDOMNode(instance);
								if (ele) {
									ele.style.setProperty("background-image", this.props.gradient, "important");
									ele.style.setProperty("color", "transparent", "important");
									ele.style.setProperty("-webkit-background-clip", "text", "important");
								}
							}
						});
						return this.props.children || null;
					}
				};
				
				InternalComponents.LibraryComponents.TextInput = reactInitialized && class BDFDB_TextInput extends LibraryModules.React.Component {
					handleChange(e) {
						let value = e = BDFDB.ObjectUtils.is(e) ? e.currentTarget.value : e;
						this.props.value = this.props.valuePrefix && !value.startsWith(this.props.valuePrefix) ? (this.props.valuePrefix + value) : value;
						if (typeof this.props.onChange == "function") this.props.onChange(this.props.value, this);
						BDFDB.ReactUtils.forceUpdate(this);
					}
					handleInput(e) {if (typeof this.props.onInput == "function") this.props.onInput(BDFDB.ObjectUtils.is(e) ? e.currentTarget.value : e, this);}
					handleKeyDown(e) {if (typeof this.props.onKeyDown == "function") this.props.onKeyDown(e, this);}
					handleBlur(e) {if (typeof this.props.onBlur == "function") this.props.onBlur(e, this);}
					handleFocus(e) {if (typeof this.props.onFocus == "function") this.props.onFocus(e, this);}
					handleMouseEnter(e) {if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);}
					handleMouseLeave(e) {if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);}
					handleNumberButton(ins, value) {
						BDFDB.TimeUtils.clear(ins.pressedTimeout);
						ins.pressedTimeout = BDFDB.TimeUtils.timeout(_ => {
							delete this.props.focused;
							BDFDB.ReactUtils.forceUpdate(this);
						}, 1000);
						this.props.focused = true;
						this.handleChange.bind(this)(value);
						this.handleInput.bind(this)(value);
					}
					componentDidMount() {
						if (this.props.type == "file") {
							let navigatorInstance = BDFDB.ReactUtils.findOwner(this, {name: "BDFDB_FileButton"});
							if (navigatorInstance) navigatorInstance.refInput = this;
						}
						let input = BDFDB.ReactUtils.findDOMNode(this);
						if (!input) return;
						input = input.querySelector("input") || input;
						if (input && !input.patched) {
							input.addEventListener("keydown", e => {
								this.handleKeyDown.bind(this)(e);
								e.stopImmediatePropagation();
							});
							input.patched = true;
						}
					}
					render() {
						let inputChildren = [
							BDFDB.ReactUtils.createElement("input", BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
								className: BDFDB.DOMUtils.formatClassName(this.props.size && InternalComponents.LibraryComponents.TextInput.Sizes[this.props.size.toUpperCase()] && BDFDB.disCN["input" + this.props.size.toLowerCase()] || BDFDB.disCN.inputdefault, this.props.inputClassName, this.props.focused && BDFDB.disCN.inputfocused, this.props.error || this.props.errorMessage ? BDFDB.disCN.inputerror : (this.props.success && BDFDB.disCN.inputsuccess), this.props.disabled && BDFDB.disCN.inputdisabled, this.props.editable && BDFDB.disCN.inputeditable),
								type: this.props.type == "color" || this.props.type == "file" ? "text" : this.props.type,
								onChange: this.handleChange.bind(this),
								onInput: this.handleInput.bind(this),
								onKeyDown: this.handleKeyDown.bind(this),
								onBlur: this.handleBlur.bind(this),
								onFocus: this.handleFocus.bind(this),
								onMouseEnter: this.handleMouseEnter.bind(this),
								onMouseLeave: this.handleMouseLeave.bind(this),
								maxLength: this.props.type == "file" ? false : this.props.maxLength,
								style: this.props.width ? {width: `${this.props.width}px`} : {},
								ref: this.props.inputRef
							}), "errorMessage", "focused", "error", "success", "inputClassName", "inputChildren", "valuePrefix", "inputPrefix", "size", "editable", "inputRef", "style", "mode", "noAlpha", "filter", "useFilePath", "searchFolders")),
							this.props.inputChildren,
							this.props.type == "color" ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {
								wrap: true,
								children: BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.ColorSwatches, {
									colors: [],
									color: this.props.value && this.props.mode == "comp" ? BDFDB.ColorUtils.convert(this.props.value.split(","), "RGB") : this.props.value,
									onColorChange: color => {
										this.handleChange(!color ? "" : (this.props.mode == "comp" ? BDFDB.ColorUtils.convert(color, "RGBCOMP").slice(0, 3).join(",") : (this.props.noAlpha ? BDFDB.ColorUtils.convert(color, "RGB") : color)));
									},
									pickerConfig: {gradient: false, alpha: this.props.mode != "comp" && !this.props.noAlpha}
								})
							}) : null,
							this.props.type == "file" ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.FileButton, {
								filter: this.props.filter,
								mode: this.props.mode,
								useFilePath: this.props.useFilePath,
								searchFolders: this.props.searchFolders
							}) : null
						].flat(10).filter(n => n);
						
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.inputwrapper, this.props.type == "number" && (this.props.size && InternalComponents.LibraryComponents.TextInput.Sizes[this.props.size.toUpperCase()] && BDFDB.disCN["inputnumberwrapper" + this.props.size.toLowerCase()] || BDFDB.disCN.inputnumberwrapperdefault), this.props.className),
							style: this.props.style,
							children: [
								this.props.inputPrefix ? BDFDB.ReactUtils.createElement("span", {
									className: BDFDB.disCN.inputprefix
								}) : null,
								this.props.type == "number" ? BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.inputnumberbuttons,
									children: [
										BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.inputnumberbuttonup,
											onClick: e => {
												let min = parseInt(this.props.min);
												let max = parseInt(this.props.max);
												let newV = parseInt(this.props.value) + 1 || min || 0;
												if (isNaN(max) || !isNaN(max) && newV <= max) this.handleNumberButton.bind(this)(e._targetInst, isNaN(min) || !isNaN(min) && newV >= min ? newV : min);
											}
										}),
										BDFDB.ReactUtils.createElement("div", {
											className: BDFDB.disCN.inputnumberbuttondown,
											onClick: e => {
												let min = parseInt(this.props.min);
												let max = parseInt(this.props.max);
												let newV = parseInt(this.props.value) - 1 || min || 0;
												if (isNaN(min) || !isNaN(min) && newV >= min) this.handleNumberButton.bind(this)(e._targetInst, isNaN(max) || !isNaN(max) && newV <= max ? newV : max);
											}
										})
									]
								}) : null,
								inputChildren.length == 1 ? inputChildren[0] : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex, {
									align: InternalComponents.LibraryComponents.Flex.Align.CENTER,
									children: inputChildren.map((child, i) => i != 0 ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Flex.Child, {shrink: 0, children: child}) : child)
								}),
								this.props.errorMessage ? BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TextElement, {
									className: BDFDB.disCN.carderror,
									size: InternalComponents.LibraryComponents.TextElement.Sizes.SIZE_12,
									color: InternalComponents.LibraryComponents.TextElement.Colors.STATUS_RED,
									children: this.props.errorMessage
								}) : null
							].filter(n => n)
						});
					}
				};
				
				InternalComponents.LibraryComponents.TextScroller = reactInitialized && class BDFDB_TextScroller extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement("div", {
							className: BDFDB.DOMUtils.formatClassName(BDFDB.disCN.textscroller, this.props.className),
							style: Object.assign({}, this.props.style, {
								position: "relative",
								display: "block",
								overflow: "hidden"
							}),
							ref: instance => {
								let ele = BDFDB.ReactUtils.findDOMNode(instance);
								if (ele && ele.parentElement) {
									let maxWidth = BDFDB.DOMUtils.getInnerWidth(ele.parentElement);
									if (maxWidth > 50) ele.style.setProperty("max-width", `${maxWidth}px`);
									BDFDB.TimeUtils.timeout(_ => {
										if (document.contains(ele.parentElement)) BDFDB.ReactUtils.forceUpdate(this);
									}, 3000);
									let Animation = new LibraryModules.AnimationUtils.Value(0);
									Animation
										.interpolate({inputRange: [0, 1], outputRange: [0, (BDFDB.DOMUtils.getRects(ele.firstElementChild).width - BDFDB.DOMUtils.getRects(ele).width) * -1]})
										.addListener(v => {ele.firstElementChild.style.setProperty("left", `${v.value}px`, "important");});
									this.scroll = p => {
										let w = p + parseFloat(ele.firstElementChild.style.getPropertyValue("left")) / (BDFDB.DOMUtils.getRects(ele.firstElementChild).width - BDFDB.DOMUtils.getRects(ele).width);
										w = isNaN(w) || !isFinite(w) ? p : w;
										w *= BDFDB.DOMUtils.getRects(ele.firstElementChild).width / (BDFDB.DOMUtils.getRects(ele).width * 2);
										LibraryModules.AnimationUtils.parallel([LibraryModules.AnimationUtils.timing(Animation, {toValue: p, duration: Math.sqrt(w**2) * 4000 / (parseInt(this.props.speed) || 1)})]).start();
									}
								}
							},
							onClick: e => {
								if (typeof this.props.onClick == "function") this.props.onClick(e, this);
							},
							onMouseEnter: e => {
								if (BDFDB.DOMUtils.getRects(e.currentTarget).width < BDFDB.DOMUtils.getRects(e.currentTarget.firstElementChild).width) {
									this.scrolling = true;
									e.currentTarget.firstElementChild.style.setProperty("display", "block", "important");
									this.scroll(1);
								}
							},
							onMouseLeave: e => {
								if (this.scrolling) {
									delete this.scrolling;
									e.currentTarget.firstElementChild.style.setProperty("display", "inline", "important");
									this.scroll(0);
								}
							},
							children: BDFDB.ReactUtils.createElement("div", {
								style: {
									left: "0",
									position: "relative",
									display: "inline",
									whiteSpace: "nowrap"
								},
								children: this.props.children
							})
						});
					}
				};
				InternalComponents.LibraryComponents.TooltipContainer = reactInitialized && class BDFDB_TooltipContainer extends LibraryModules.React.Component {
					updateTooltip(text) {
						if (this.tooltip) this.tooltip.update(text);
					}
					render() {
						let child = (BDFDB.ArrayUtils.is(this.props.children) ? this.props.children[0] : this.props.children) || BDFDB.ReactUtils.createElement("div", {});
						child.props.className = BDFDB.DOMUtils.formatClassName(child.props.className, this.props.className);
						let childProps = Object.assign({}, child.props);
						let shown = false;
						child.props.onMouseEnter = (e, childThis) => {
							if (!shown && !e.currentTarget.BDFDBtooltipShown) {
								e.currentTarget.BDFDBtooltipShown = shown = true;
								this.tooltip = BDFDB.TooltipUtils.create(e.currentTarget, typeof this.props.text == "function" ? this.props.text(this) : this.props.text, Object.assign({
									delay: this.props.delay
								}, this.props.tooltipConfig, {
									onHide: (tooltip, anker) => {
										delete anker.BDFDBtooltipShown;
										shown = false;
										if (this.props.tooltipConfig && typeof this.props.tooltipConfig.onHide == "function") this.props.onHide(tooltip, anker);
									}
								}));
								if (typeof this.props.onMouseEnter == "function") this.props.onMouseEnter(e, this);
								if (typeof childProps.onMouseEnter == "function") childProps.onMouseEnter(e, childThis);
							}
						};
						child.props.onMouseLeave = (e, childThis) => {
							if (typeof this.props.onMouseLeave == "function") this.props.onMouseLeave(e, this);
							if (typeof childProps.onMouseLeave == "function") childProps.onMouseLeave(e, childThis);
						};
						child.props.onClick = (e, childThis) => {
							if (typeof this.props.onClick == "function") this.props.onClick(e, this);
							if (typeof childProps.onClick == "function") childProps.onClick(e, childThis);
						};
						child.props.onContextMenu = (e, childThis) => {
							if (typeof this.props.onContextMenu == "function") this.props.onContextMenu(e, this);
							if (typeof childProps.onContextMenu == "function") childProps.onContextMenu(e, childThis);
						};
						return BDFDB.ReactUtils.createElement(LibraryModules.React.Fragment, {
							children: child
						});
					}
				};
				
				InternalComponents.LibraryComponents.UserPopoutContainer = reactInitialized && class BDFDB_UserPopoutContainer extends LibraryModules.React.Component {
					render() {
						return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.PopoutContainer, BDFDB.ObjectUtils.exclude(Object.assign({}, this.props, {
							wrap: false,
							renderPopout: instance => {
								return BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.UserPopout, {
									userId: this.props.userId,
									guildId: this.props.guildId,
									channelId: this.props.channelId
								});
							}
						}), "userId", "guildId", "channelId"));
					}
				};
				
				for (let type in InternalComponents.NativeSubComponents) if (InternalComponents.LibraryComponents[type]) for (let key in InternalComponents.NativeSubComponents[type]) if (key != "displayName" && key != "name" && (typeof InternalComponents.NativeSubComponents[type][key] != "function" || key.charAt(0) == key.charAt(0).toUpperCase())) {
					if (key == "defaultProps") InternalComponents.LibraryComponents[type][key] = Object.assign({}, InternalComponents.LibraryComponents[type][key], InternalComponents.NativeSubComponents[type][key]);
					else InternalComponents.LibraryComponents[type][key] = InternalComponents.NativeSubComponents[type][key];
				}
				BDFDB.LibraryComponents = Object.assign({}, InternalComponents.LibraryComponents);
				
				InternalBDFDB.createCustomControl = function (data) {
					let controlButton = BDFDB.DOMUtils.create(`<${isBeta ? "button" : "div"} class="${BDFDB.DOMUtils.formatClassName(isBeta && BDFDB.disCN._repobutton, BDFDB.disCN._repocontrolsbutton)}"></${isBeta ? "button" : "div"}>`);
					BDFDB.ReactUtils.render(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SvgIcon, {
						className: !isBeta && BDFDB.disCN._repoicon,
						nativeClass: true,
						name: data.svgName,
						width: data.size,
						height: data.size
					}), controlButton);
					controlButton.addEventListener("click", _ => {if (typeof data.onClick == "function") data.onClick();});
					if (data.tooltipText) controlButton.addEventListener("mouseenter", _ => {BDFDB.TooltipUtils.create(controlButton, data.tooltipText);});
					return controlButton;
				};
				InternalBDFDB.appendCustomControls = function (card) {
					let checkbox = card.querySelector(BDFDB.dotCN._reposwitch);
					if (!checkbox) return;
					let props = BDFDB.ObjectUtils.get(BDFDB.ReactUtils.getInstance(card), "return.stateNode.props");
					let plugin = props && props.addon && (props.addon.plugin || props.addon.instance);
					if (plugin && !props.hasCustomControls && (plugin == libraryInstance || plugin.name && plugin.name && PluginStores.loaded[plugin.name] && PluginStores.loaded[plugin.name] == plugin)) {
						props.hasCustomControls = true;
						let url = plugin.rawUrl ||`https://mwittrien.github.io/BetterDiscordAddons/Plugins/${plugin.name}/${plugin.name}.plugin.js`;
						let controls = [];
						let footerControls = card.querySelector("." + BDFDB.disCN._repofooter.split(" ")[0] + " " + BDFDB.dotCN._repocontrols);
						if (plugin.changeLog) controls.push(InternalBDFDB.createCustomControl({
							tooltipText: BDFDB.LanguageUtils.LanguageStrings.CHANGE_LOG,
							svgName: InternalComponents.LibraryComponents.SvgIcon.Names.CHANGELOG,
							size: isBeta ? "19" : "24",
							onClick: _ => {BDFDB.PluginUtils.openChangeLog(plugin);}
						}));
						if (window.PluginUpdates && window.PluginUpdates.plugins && window.PluginUpdates.plugins[url] && window.PluginUpdates.plugins[url].outdated) controls.push(InternalBDFDB.createCustomControl({
							tooltipText: BDFDB.LanguageUtils.LanguageStrings.UPDATE_MANUALLY,
							svgName: InternalComponents.LibraryComponents.SvgIcon.Names.DOWNLOAD,
							size: isBeta ? "20" : "24",
							onClick: _ => {console.log('node')}
						}));
						if (footerControls) for (let control of controls) footerControls.insertBefore(control, footerControls.firstElementChild);
						else for (let control of controls) checkbox.parentElement.insertBefore(control, checkbox.parentElement.firstElementChild);
					}
				};
				const cardObserver = (new MutationObserver(changes => {changes.forEach(change => {if (change.addedNodes) {change.addedNodes.forEach(node => {
					if (BDFDB.DOMUtils.containsClass(node, BDFDB.disCN._repocard)) InternalBDFDB.appendCustomControls(node);
					if (node.nodeType != Node.TEXT_NODE) for (let child of node.querySelectorAll(BDFDB.dotCN._repocard)) InternalBDFDB.appendCustomControls(child);
				});}});}));
				BDFDB.ObserverUtils.connect(BDFDB, document.querySelector(`${BDFDB.dotCN.layer}[aria-label="${BDFDB.DiscordConstants.Layers.USER_SETTINGS}"]`), {name: "cardObserver", instance: cardObserver}, {childList: true, subtree: true});
				BDFDB.ObserverUtils.connect(BDFDB, BDFDB.dotCN.applayers, {name: "appLayerObserver", instance: (new MutationObserver(changes => {changes.forEach(change => {if (change.addedNodes) {change.addedNodes.forEach(node => {
					if (node.nodeType != Node.TEXT_NODE && node.getAttribute("aria-label") == BDFDB.DiscordConstants.Layers.USER_SETTINGS) BDFDB.ObserverUtils.connect(BDFDB, node, {name: "cardObserver", instance: cardObserver}, {childList: true, subtree: true});
				});}});}))}, {childList: true});
				for (let child of document.querySelectorAll(BDFDB.dotCN._repocard)) InternalBDFDB.appendCustomControls(child);

				const keyDownTimeouts = {};
				BDFDB.ListenerUtils.add(BDFDB, document, "keydown.BDFDBPressedKeys", e => {
					if (!pressedKeys.includes(e.which)) {
						BDFDB.TimeUtils.clear(keyDownTimeouts[e.which]);
						pressedKeys.push(e.which);
						keyDownTimeouts[e.which] = BDFDB.TimeUtils.timeout(_ => {
							BDFDB.ArrayUtils.remove(pressedKeys, e.which, true);
						}, 60000);
					}
				});
				BDFDB.ListenerUtils.add(BDFDB, document, "keyup.BDFDBPressedKeys", e => {
					BDFDB.TimeUtils.clear(keyDownTimeouts[e.which]);
					BDFDB.ArrayUtils.remove(pressedKeys, e.which, true);
				});
				BDFDB.ListenerUtils.add(BDFDB, document, "mousedown.BDFDBMousePosition", e => {
					mousePosition = e;
				});
				BDFDB.ListenerUtils.add(BDFDB, window, "focus.BDFDBPressedKeysReset", e => {
					pressedKeys = [];
				});
				
				InternalBDFDB.patchedModules = {
					before: {
						MessageContent: "type"
					},
					after: {
						DiscordTag: "default",
						Mention: "default",
						Message: "default",
						MessageHeader: "default",
						MemberListItem: ["componentDidMount", "componentDidUpdate"],
						PrivateChannel: ["componentDidMount", "componentDidUpdate"],
						UserPopout: ["componentDidMount", "componentDidUpdate"],
						UserProfile: ["componentDidMount", "componentDidUpdate"],
						V2C_ContentColumn: "render"
					}
				};
				
				InternalBDFDB.processV2CContentColumn = function (e) {
					if (window.PluginUpdates && window.PluginUpdates.plugins && typeof e.instance.props.title == "string" && e.instance.props.title.toUpperCase().indexOf("PLUGINS") == 0) {
						let [children, index] = BDFDB.ReactUtils.findParent(e.returnvalue, {key: "folder-button"});
						if (index > -1) children.splice(index + 1, 0, BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
							text: "Only checks for updates of plugins, which support the updatecheck. Rightclick for a list of supported plugins. (Listed ≠ Outdated)",
							tooltipConfig: {
								type: "bottom",
								maxWidth: 420
							},
							onContextMenu: (event, instance) => {
								instance.updateTooltip(BDFDB.ObjectUtils.toArray(window.PluginUpdates.plugins).map(p => p.name).filter(n => n).sort().join(", "));
							},
							children: BDFDB.ReactUtils.createElement("button", {
								className: `${BDFDB.disCNS._repobutton + BDFDB.disCN._repofolderbutton} bd-updatebtn`,
								onClick: _ => {
									let toast = BDFDB.NotificationUtils.toast("Plugin update check in progress", {type: "info", timeout: 0});
									BDFDB.PluginUtils.checkAllUpdates().then(outdated => {
										toast.close();
										if (outdated > 0) BDFDB.NotificationUtils.toast(`Plugin update check complete - ${outdated} outdated!`, {type: "error"});
										else BDFDB.NotificationUtils.toast(`Plugin update check complete`, {type: "success"});
									});
								},
								children: "Check for Updates"
							})
						}));
					}
				};
				
				let MessageHeaderExport = BDFDB.ModuleUtils.findByProperties("MessageTimestamp", false);
				InternalBDFDB.processMessage = function (e) {
					if (MessageHeaderExport && BDFDB.ObjectUtils.get(e, "instance.props.childrenHeader.type.type.name") && BDFDB.ObjectUtils.get(e, "instance.props.childrenHeader.props.message")) {
						e.instance.props.childrenHeader.type = MessageHeaderExport.exports.default;
					}
					if (e.returnvalue && e.returnvalue.props && e.returnvalue.props.children && e.returnvalue.props.children.props) {
						let message;
						for (let key in e.instance.props) {
							let data = BDFDB.ObjectUtils.get(e.instance.props[key], "props.message");
							if (data) {
								message = data;
								break;
							}
						}
						if (message) e.returnvalue.props.children.props["user_by_BDFDB"] = message.author.id;
					}
				};

				const BDFDB_Patrons = Object.assign({}, InternalData.BDFDB_Patrons);
				InternalBDFDB._processAvatarRender = function (user, avatar) {
					if (BDFDB.ReactUtils.isValidElement(avatar) && BDFDB.ObjectUtils.is(user) && (avatar.props.className || "").indexOf(BDFDB.disCN.bdfdbbadgeavatar) == -1) {
						avatar.props["user_by_BDFDB"] = user.id;
						let role = "", className = BDFDB.DOMUtils.formatClassName((avatar.props.className || "").replace(BDFDB.disCN.avatar, "")), addBadge = settings.showSupportBadges, customBadge = false;
						if (BDFDB_Patrons[user.id] && BDFDB_Patrons[user.id].active) {
							role = BDFDB_Patrons[user.id].t3 ? "BDFDB Patron Level 2" : "BDFDB Patron";
							customBadge = addBadge && BDFDB_Patrons[user.id].t3 && BDFDB_Patrons[user.id].custom;
							className = BDFDB.DOMUtils.formatClassName(className, addBadge && BDFDB.disCN.bdfdbhasbadge, BDFDB.disCN.bdfdbbadgeavatar, BDFDB.disCN.bdfdbsupporter, customBadge && BDFDB.disCN.bdfdbsupportercustom);
						}
						if (user.id == InternalData.myId) {
							addBadge = true;
							role = "Theme Developer";
							className = BDFDB.DOMUtils.formatClassName(className, BDFDB.disCN.bdfdbhasbadge, BDFDB.disCN.bdfdbbadgeavatar, BDFDB.disCN.bdfdbdev);
						}
						if (role) {
							delete avatar.props["user_by_BDFDB"];
							if (avatar.type == "img") avatar = BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.AvatarComponents.default, Object.assign({}, avatar.props, {
								size: InternalComponents.LibraryComponents.AvatarComponents.Sizes.SIZE_40
							}));
							delete avatar.props.className;
							avatar = BDFDB.ReactUtils.createElement("div", {
								className: className,
								style: {borderRadius: 0, overflow: "visible"},
								"custombadge_id": customBadge ? user.id : null,
								"user_by_BDFDB": user.id,
								children: [avatar]
							});
							if (addBadge) avatar.props.children.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.TooltipContainer, {
								text: role,
								children: BDFDB.ReactUtils.createElement("div", {
									className: BDFDB.disCN.bdfdbbadge
								})
							}));
							return avatar;
						}
					}
				};
				InternalBDFDB._processAvatarMount = function (user, avatar, wrapper) {
					if (Node.prototype.isPrototypeOf(avatar) && BDFDB.ObjectUtils.is(user) && (avatar.className || "").indexOf(BDFDB.disCN.bdfdbbadgeavatar) == -1) {
						if (wrapper) wrapper.setAttribute("user_by_BDFDB", user.id);
						avatar.setAttribute("user_by_BDFDB", user.id);
						let role = "", addBadge = settings.showSupportBadges, customBadge = false;
						if (BDFDB_Patrons[user.id] && BDFDB_Patrons[user.id].active) {
							role = BDFDB_Patrons[user.id].t3 ? "BDFDB Patron Level 2" : "BDFDB Patron";
							customBadge = addBadge && BDFDB_Patrons[user.id].t3 && BDFDB_Patrons[user.id].custom;
							avatar.className = BDFDB.DOMUtils.formatClassName(avatar.className, addBadge && BDFDB.disCN.bdfdbhasbadge, BDFDB.disCN.bdfdbbadgeavatar, BDFDB.disCN.bdfdbsupporter, customBadge && BDFDB.disCN.bdfdbsupportercustom);
						}
						else if (user.id == InternalData.myId) {
							addBadge = true;
							role = "Theme Developer";
							avatar.className = BDFDB.DOMUtils.formatClassName(avatar.className, addBadge && BDFDB.disCN.bdfdbhasbadge, BDFDB.disCN.bdfdbbadgeavatar, BDFDB.disCN.bdfdbdev);
						}
						if (role && !avatar.querySelector(BDFDB.dotCN.bdfdbbadge)) {
							if (addBadge) {
								if (customBadge) avatar.setAttribute("custombadge_id", user.id);
								let badge = document.createElement("div");
								badge.className = BDFDB.disCN.bdfdbbadge;
								badge.addEventListener("mouseenter", _ => {BDFDB.TooltipUtils.create(badge, role, {position: "top"});});
								avatar.style.setProperty("position", "relative");
								avatar.style.setProperty("overflow", "visible");
								avatar.style.setProperty("border-radius", 0);
								avatar.appendChild(badge);
							}
						}
					}
				};
				InternalBDFDB.processMessageHeader = function (e) {
					if (e.instance.props.message && e.instance.props.message.author) {
						let avatarWrapper = BDFDB.ObjectUtils.get(e, "returnvalue.props.children.0");
						if (avatarWrapper && avatarWrapper.props && typeof avatarWrapper.props.children == "function") {
							let renderChildren = avatarWrapper.props.children;
							avatarWrapper.props.children = (...args) => {
								let renderedChildren = renderChildren(...args);
								return InternalBDFDB._processAvatarRender(e.instance.props.message.author, renderedChildren) || renderedChildren;
							};
						}
						else if (avatarWrapper && avatarWrapper.type == "img") e.returnvalue.props.children[0] = InternalBDFDB._processAvatarRender(e.instance.props.message.author, avatarWrapper) || avatarWrapper;
					}
				};
				InternalBDFDB.processMemberListItem = function (e) {
					InternalBDFDB._processAvatarMount(e.instance.props.user, e.node.querySelector(BDFDB.dotCN.avatarwrapper));
				};
				InternalBDFDB.processPrivateChannel = function (e) {
					InternalBDFDB._processAvatarMount(e.instance.props.user, e.node.querySelector(BDFDB.dotCN.avatarwrapper));
				};
				InternalBDFDB.processUserPopout = function (e) {
					InternalBDFDB._processAvatarMount(e.instance.props.user, e.node.querySelector(BDFDB.dotCN.userpopoutavatarwrapper), e.node);
				};
				InternalBDFDB.processUserProfile = function (e) {
					InternalBDFDB._processAvatarMount(e.instance.props.user, e.node.querySelector(BDFDB.dotCN.avatarwrapper), e.node);
				};
				InternalBDFDB.processDiscordTag = function (e) {
					if (e.instance && e.instance.props && e.returnvalue && e.instance.props.user) e.returnvalue.props.user = e.instance.props.user;
				};
				InternalBDFDB.processMessageContent = function (e) {
					if (BDFDB.ArrayUtils.is(e.instance.props.content)) for (let ele of e.instance.props.content) InternalBDFDB._processMessageContentEle(ele, e.instance.props.message);
				};
				InternalBDFDB._processMessageContentEle = function (ele, message) {
					if (BDFDB.ReactUtils.isValidElement(ele)) {
						if (typeof ele.props.render == "function" && BDFDB.ObjectUtils.get(ele, "props.children.type.displayName") == "Mention") {
							let userId = BDFDB.ObjectUtils.get(ele.props.render(), "props.userId");
							if (userId && !ele.props.children.props.userId) ele.props.children.props.userId = userId;
							if (message && message.mentioned) ele.props.children.props.mentioned = true;
						}
						else if (BDFDB.ReactUtils.isValidElement(ele.props.children)) InternalBDFDB._processMessageContentEle(ele.props.children, message);
						else if (BDFDB.ArrayUtils.is(ele.props.children)) for (let child of ele.props.children) InternalBDFDB._processMessageContentEle(child, message);
					}
					else if (BDFDB.ArrayUtils.is(ele)) for (let child of ele) InternalBDFDB._processMessageContentEle(child, message);
				};
				InternalBDFDB.processMention = function (e) {
					delete e.returnvalue.props.userId;
				};
				
				const ContextMenuTypes = ["UserSettingsCog", "UserProfileActions", "User", "Developer", "Slate", "GuildFolder", "GroupDM", "SystemMessage", "Message", "Native", "Role", "Guild", "Channel"];
				const QueuedComponents = BDFDB.ArrayUtils.removeCopies([].concat(ContextMenuTypes.map(n => n + "ContextMenu"), ["GuildHeaderContextMenu", "MessageOptionContextMenu", "MessageOptionToolbar"]));	
				InternalBDFDB.addContextListeners = function (plugin) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					for (let type of QueuedComponents) if (typeof plugin[`on${type}`] === "function") {
						PluginStores.patchQueues[type].query.push(plugin);
						PluginStores.patchQueues[type].query = BDFDB.ArrayUtils.removeCopies(PluginStores.patchQueues[type].query);
						PluginStores.patchQueues[type].query.sort((x, y) => {return x.name < y.name ? -1 : x.name > y.name ? 1 : 0;});
						for (let module of PluginStores.patchQueues[type].modules) InternalBDFDB.patchContextMenuForPlugin(plugin, type, module);
					}
				};
				InternalBDFDB.patchContextMenuForPlugin = function (plugin, type, module) {
					plugin = plugin == BDFDB && InternalBDFDB || plugin;
					if (module && module.exports && module.exports.default) BDFDB.PatchUtils.patch(plugin, module.exports, "default", {after: e => {
						if (e.returnValue && typeof plugin[`on${type}`] === "function") plugin[`on${type}`]({instance: {props: e.methodArguments[0]}, returnvalue: e.returnValue, methodname: "default", type: module.exports.default.displayName});
					}});
				};
				InternalBDFDB.executeExtraPatchedPatches = function (type, e) {
					if (e.returnvalue && BDFDB.ObjectUtils.is(PluginStores.patchQueues[type]) && BDFDB.ArrayUtils.is(PluginStores.patchQueues[type].query)) {
						for (let plugin of PluginStores.patchQueues[type].query) if(typeof plugin[`on${type}`] === "function") plugin[`on${type}`](e);
					}
				};
				
				BDFDB.ReactUtils.instanceKey = Object.keys(document.querySelector(BDFDB.dotCN.app) || {}).some(n => n.startsWith("__reactInternalInstance")) ? "_reactInternalFiber" : "_reactInternals";

				BDFDB.PluginUtils.load(BDFDB);
				//changeLogs = BDFDB.DataUtils.load(BDFDB, "changeLogs");
				//BDFDB.PluginUtils.checkChangeLog(BDFDB);
				
				InternalBDFDB.patchPlugin(BDFDB);
				
				for (let type of QueuedComponents) if (!PluginStores.patchQueues[type]) PluginStores.patchQueues[type] = {query: [], modules: []};
				BDFDB.PatchUtils.patch(BDFDB, LibraryModules.ContextMenuUtils, "openContextMenu", {before: e => {
					let menu = e.methodArguments[1]();
					if (BDFDB.ObjectUtils.is(menu) && menu.type && menu.type.displayName) {
						for (let type of ContextMenuTypes) if (menu.type.displayName.indexOf(type) > -1) {
							let patchType = type + "ContextMenu";
							let module = BDFDB.ModuleUtils.find(m => m == menu.type, false);
							if (module && module.exports && module.exports.default && PluginStores.patchQueues[patchType]) {
								PluginStores.patchQueues[patchType].modules.push(module);
								PluginStores.patchQueues[patchType].modules = BDFDB.ArrayUtils.removeCopies(PluginStores.patchQueues[patchType].modules);
								for (let plugin of PluginStores.patchQueues[patchType].query) InternalBDFDB.patchContextMenuForPlugin(plugin, patchType, module);
							}
							break;
						}
					}
				}});
				
				BDFDB.PatchUtils.patch(BDFDB, BDFDB.ObjectUtils.get(BDFDB.ModuleUtils.findByString("renderReactions", "canAddNewReactions", "showMoreUtilities", false), "exports.default"), "type", {after: e => {
					if (document.querySelector(BDFDB.dotCN.emojipicker) || !BDFDB.ObjectUtils.toArray(PluginStores.loaded).filter(p => p.started).some(p => p.onMessageOptionContextMenu || p.onMessageOptionToolbar)) return;
					let toolbar = BDFDB.ReactUtils.findChild(e.returnValue, {filter: c => c && c.props && c.props.showMoreUtilities != undefined && c.props.showEmojiPicker != undefined && c.props.setPopout != undefined});
					if (toolbar) BDFDB.PatchUtils.patch(BDFDB, toolbar, "type", {after: e2 => {
						let menu = BDFDB.ReactUtils.findChild(e2.returnValue, {filter: c => c && c.props && typeof c.props.onRequestClose == "function" && c.props.onRequestClose.toString().indexOf("moreUtilities") > -1});
						InternalBDFDB.executeExtraPatchedPatches("MessageOptionToolbar", {instance: {props: e2.methodArguments[0]}, returnvalue: e2.returnValue, methodname: "default"});
						if (menu && typeof menu.props.renderPopout == "function") {
							let renderPopout = menu.props.renderPopout;
							menu.props.renderPopout = (...args) => {
								let renderedPopout = renderPopout(...args);
								BDFDB.PatchUtils.patch(BDFDB, renderedPopout, "type", {after: e3 => {
									InternalBDFDB.executeExtraPatchedPatches("MessageOptionContextMenu", {instance: {props: e3.methodArguments[0]}, returnvalue: e3.returnValue, methodname: "default"});
								}}, {noCache: true});
								return renderedPopout;
							}
						}
					}}, {once: true});
				}});
				
				BDFDB.PatchUtils.patch(BDFDB, BDFDB.ObjectUtils.get(BDFDB.ModuleUtils.findByString("guild-header-popout", false), "exports.default.prototype"), "render", {after: e => {
					BDFDB.PatchUtils.patch(BDFDB, e.returnValue.type, "type", {after: e2 => {
						InternalBDFDB.executeExtraPatchedPatches("GuildHeaderContextMenu", {instance: {props: e2.methodArguments[0]}, returnvalue: e2.returnValue, methodname: "type"});
					}}, {noCache: true});
				}});
				
				InternalBDFDB.onSettingsClosed = function () {
					if (InternalBDFDB.SettingsUpdated) {
						delete InternalBDFDB.SettingsUpdated;
						InternalBDFDB.forceUpdateAll();
					}
				};
				
				InternalBDFDB.forceUpdateAll = function () {
					if (LibraryRequires.path) settings = BDFDB.DataUtils.get(BDFDB, "settings");
					
					BDFDB.MessageUtils.rerenderAll();
					BDFDB.PatchUtils.forceAllUpdates(BDFDB);
				};
				
				InternalBDFDB.addSpecialListeners(BDFDB);
				
				if (InternalComponents.LibraryComponents.GuildComponents.BlobMask) {
					let newBadges = ["lowerLeftBadge", "upperLeftBadge"];
					BDFDB.PatchUtils.patch(BDFDB, InternalComponents.LibraryComponents.GuildComponents.BlobMask.prototype, "render", {
						before: e => {
							e.thisObject.props = Object.assign({}, InternalComponents.LibraryComponents.GuildComponents.BlobMask.defaultProps, e.thisObject.props);
							for (let type of newBadges) if (!e.thisObject.state[`${type}Mask`]) e.thisObject.state[`${type}Mask`] = new InternalComponents.LibraryComponents.Animations.Controller({spring: 0});
						},
						after: e => {
							let [children, index] = BDFDB.ReactUtils.findParent(e.returnValue, {name: "TransitionGroup"});
							if (index > -1) {
								children[index].props.children.push(!e.thisObject.props.lowerLeftBadge ? null : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.BadgeAnimationContainer, {
									className: BDFDB.disCN.guildlowerleftbadge,
									key: "lower-left-badge",
									animatedStyle: e.thisObject.getLowerLeftBadgeStyles(),
									children: e.thisObject.props.lowerLeftBadge
								}));
								children[index].props.children.push(!e.thisObject.props.upperLeftBadge ? null : BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.BadgeAnimationContainer, {
									className: BDFDB.disCN.guildupperleftbadge,
									key: "upper-left-badge",
									animatedStyle: e.thisObject.getUpperLeftBadgeStyles(),
									children: e.thisObject.props.upperLeftBadge
								}));
							}
							[children, index] = BDFDB.ReactUtils.findParent(e.returnValue, {name: "mask"});
							if (index > -1) {
								children[index].props.children.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.rect, {
									x: -4,
									y: -4,
									width: e.thisObject.props.upperLeftBadgeWidth + 8,
									height: 24,
									rx: 12,
									ry: 12,
									transform: e.thisObject.getLeftBadgePositionInterpolation(e.thisObject.state.upperLeftBadgeMask, -1),
									fill: "black"
								}));
								children[index].props.children.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.Animations.animated.rect, {
									x: -4,
									y: 28,
									width: e.thisObject.props.lowerLeftBadgeWidth + 8,
									height: 24,
									rx: 12,
									ry: 12,
									transform: e.thisObject.getLeftBadgePositionInterpolation(e.thisObject.state.lowerLeftBadgeMask),
									fill: "black"
								}));
							}
						}
					});
					BDFDB.PatchUtils.patch(BDFDB, InternalComponents.LibraryComponents.GuildComponents.BlobMask.prototype, "componentDidMount", {
						after: e => {
							for (let type of newBadges) e.thisObject.state[`${type}Mask`].update({
								spring: e.thisObject.props[type] != null ? 1 : 0,
								immediate: true
							}).start();
						}
					});
					BDFDB.PatchUtils.patch(BDFDB, InternalComponents.LibraryComponents.GuildComponents.BlobMask.prototype, "componentWillUnmount", {
						after: e => {
							for (let type of newBadges) if (e.thisObject.state[`${type}Mask`]) e.thisObject.state[`${type}Mask`].dispose();
						}
					});
					BDFDB.PatchUtils.patch(BDFDB, InternalComponents.LibraryComponents.GuildComponents.BlobMask.prototype, "componentDidUpdate", {
						after: e => {
							for (let type of newBadges) if (e.thisObject.props[type] != null && e.methodArguments[0][type] == null) {
								e.thisObject.state[`${type}Mask`].update({
									spring: 1,
									immediate: !document.hasFocus(),
									config: {friction: 30, tension: 900, mass: 1}
								}).start();
							}
							else if (e.thisObject.props[type] == null && e.methodArguments[0][type] != null) {
								e.thisObject.state[`${type}Mask`].update({
									spring: 0,
									immediate: !document.hasFocus(),
									config: {duration: 150, friction: 10, tension: 100, mass: 1}
								}).start();
							}
						}
					});
					InternalComponents.LibraryComponents.GuildComponents.BlobMask.prototype.getLeftBadgePositionInterpolation = function (e, t) {
						return void 0 === t && (t = 1), e.springs.spring.to([0, 1], [20, 0]).to(function (e) {
							return "translate(" + e * -1 + " " + e * t + ")";
						});
					};
					InternalComponents.LibraryComponents.GuildComponents.BlobMask.prototype.getLowerLeftBadgeStyles = function () {
						var e = this.state.lowerLeftBadgeMask.springs.spring;
						return {
							opacity: e.to([0, .5, 1], [0, 0, 1]),
							transform: e.to(function (e) {
								return "translate(" + -1 * (16 - 16 * e) + "px, " + (16 - 16 * e) + "px)";
							})
						};
					};
					InternalComponents.LibraryComponents.GuildComponents.BlobMask.prototype.getUpperLeftBadgeStyles = function () {
						var e = this.state.upperLeftBadgeMask.springs.spring;
						return {
							opacity: e.to([0, .5, 1], [0, 0, 1]),
							transform: e.to(function (e) {
								return "translate(" + -1 * (16 - 16 * e) + "px, " + -1 * (16 - 16 * e) + "px)";
							})
						};
					};
					let extraDefaultProps = {};
					for (let type of newBadges) extraDefaultProps[`${type}Width`] = 16;
					InternalBDFDB.setDefaultProps(InternalComponents.LibraryComponents.GuildComponents.BlobMask, extraDefaultProps);
				}
				
				BDFDB.PatchUtils.patch(BDFDB, LibraryModules.GuildStore, "getGuild", {after: e => {
					if (e.returnValue && e.methodArguments[0] == InternalData.myGuildId) e.returnValue.banner = "https://mwittrien.github.io/BetterDiscordAddons/Library/_res/BDFDB.banner.png";
				}});

				BDFDB.PatchUtils.patch(BDFDB, LibraryModules.IconUtils, "getGuildBannerURL", {instead: e => {
					return e.methodArguments[0].id == InternalData.myGuildId ? e.methodArguments[0].banner : e.callOriginalMethod();
				}});
				
				InternalBDFDB.forceUpdateAll();
			
				const pluginQueue = window.BDFDB_Global && BDFDB.ArrayUtils.is(window.BDFDB_Global.pluginQueue) ? window.BDFDB_Global.pluginQueue : [];

				if (BDFDB.UserUtils.me.id == InternalData.myId) {
					for (let module in DiscordClassModules) if (!DiscordClassModules[module]) BDFDB.LogUtils.warn(module + " not initialized in DiscordClassModules");
					for (let obj in DiscordObjects) if (!DiscordObjects[obj]) BDFDB.LogUtils.warn(obj + " not initialized in DiscordObjects");
					for (let require in LibraryRequires) if (!LibraryRequires[require]) BDFDB.LogUtils.warn(require + " not initialized in LibraryRequires");
					for (let module in LibraryModules) if (!LibraryModules[module]) BDFDB.LogUtils.warn(module + " not initialized in LibraryModules");
					for (let component in InternalComponents.NativeSubComponents) if (!InternalComponents.NativeSubComponents[component]) BDFDB.LogUtils.warn(component + " not initialized in NativeSubComponents");
					for (let component in InternalComponents.LibraryComponents) if (!InternalComponents.LibraryComponents[component]) BDFDB.LogUtils.warn(component + " not initialized in LibraryComponents");

					BDFDB.DevUtils = {};
					BDFDB.DevUtils.generateClassId = InternalBDFDB.generateClassId;
					BDFDB.DevUtils.findByIndex = function (index) {
						return BDFDB.DevUtils.req.c[index];
					};
					BDFDB.DevUtils.findPropAny = function (...strings) {
						window.t = {"$filter":(prop => [...strings].flat(10).filter(n => typeof n == "string").every(string => prop.toLowerCase().indexOf(string.toLowerCase()) > -1))};
						for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
							let m = BDFDB.DevUtils.req.c[i].exports;
							if (m && typeof m == "object") for (let j in m) if (window.t.$filter(j)) window.t[j + "_" + i] = m;
							if (m && typeof m == "object" && typeof m.default == "object") for (let j in m.default) if (window.t.$filter(j)) window.t[j + "_default_" + i] = m.default;
						}
						console.clear();
						console.log(window.t);
					};
					BDFDB.DevUtils.findPropFunc = function (...strings) {
						window.t = {"$filter":(prop => [...strings].flat(10).filter(n => typeof n == "string").every(string => prop.toLowerCase().indexOf(string.toLowerCase()) > -1))};
						for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
							let m = BDFDB.DevUtils.req.c[i].exports;
							if (m && typeof m == "object") for (let j in m) if (window.t.$filter(j) && typeof m[j] != "string") window.t[j + "_" + i] = m;
							if (m && typeof m == "object" && typeof m.default == "object") for (let j in m.default) if (window.t.$filter(j) && typeof m.default[j] != "string") window.t[j + "_default_" + i] = m.default;
						}
						console.clear();
						console.log(window.t);
					};
					BDFDB.DevUtils.findPropStringLib = function (...strings) {
						window.t = {"$filter":(prop => [...strings].flat(10).filter(n => typeof n == "string").every(string => prop.toLowerCase().indexOf(string.toLowerCase()) > -1))};
						for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
							let m = BDFDB.DevUtils.req.c[i].exports;
							if (m && typeof m == "object") for (let j in m) if (window.t.$filter(j) && typeof m[j] == "string" && /^[A-z0-9]+\-[A-z0-9_-]{6}$/.test(m[j])) window.t[j + "_" + i] = m;
							if (m && typeof m == "object" && typeof m.default == "object") for (let j in m.default) if (window.t.$filter(j) && typeof m.default[j] == "string" && /^[A-z0-9]+\-[A-z0-9_-]{6}$/.test(m.default[j])) window.t[j + "_default_" + i] = m.default;
						}
						console.clear();
						console.log(window.t);
					};
					BDFDB.DevUtils.findNameAny = function (...strings) {
						window.t = {"$filter":(modu => [...strings].flat(10).filter(n => typeof n == "string").some(string => typeof modu.displayName == "string" && modu.displayName.toLowerCase().indexOf(string.toLowerCase()) > -1 || modu.name == "string" && modu.name.toLowerCase().indexOf(string.toLowerCase()) > -1))};
						for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
							let m = BDFDB.DevUtils.req.c[i].exports;
							if (m && (typeof m == "object" || typeof m == "function") && window.t.$filter(m)) window.t[(m.displayName || m.name) + "_" + i] = m;
							if (m && (typeof m == "object" || typeof m == "function") && m.default && (typeof m.default == "object" || typeof m.default == "function") && window.t.$filter(m.default)) window.t[(m.default.displayName || m.default.name) + "_" + i] = m.default;
						}
						console.clear();
						console.log(window.t);
					};
					BDFDB.DevUtils.findCodeAny = function (...strings) {
						window.t = {"$filter":(m => [...strings].flat(10).filter(n => typeof n == "string").map(string => string.toLowerCase()).every(string => typeof m == "function" && (m.toString().toLowerCase().indexOf(string) > -1 || typeof m.__originalMethod == "function" && m.__originalMethod.toString().toLowerCase().indexOf(string) > -1 || typeof m.__originalFunction == "function" && m.__originalFunction.toString().toLowerCase().indexOf(string) > -1) || BDFDB.ObjectUtils.is(m) && typeof m.type == "function" && m.type.toString().toLowerCase().indexOf(string) > -1))};
						for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
							let m = BDFDB.DevUtils.req.c[i].exports;
							if (m && typeof m == "function" && window.t.$filter(m)) window.t["module_" + i] = {string: m.toString(), func: m};
							if (m && m.__esModule) {
								for (let j in m) if (m[j] && typeof m[j] == "function" && window.t.$filter(m[j])) window.t[j + "_module_" + i] = {string: m[j].toString(), func: m[j], module: m};
								if (m.default && (typeof m.default == "object" || typeof m.default == "function")) for (let j in m.default) if (m.default[j] && typeof m.default[j] == "function" && window.t.$filter(m.default[j])) window.t[j + "_module_" + i + "_default"] = {string: m.default[j].toString(), func: m.default[j], module: m};
							}
						}
						for (let i in BDFDB.DevUtils.req.m) if (typeof BDFDB.DevUtils.req.m[i] == "function" && window.t.$filter(BDFDB.DevUtils.req.m[i])) window.t["funtion_" + i] = {string: BDFDB.DevUtils.req.m[i].toString(), func: BDFDB.DevUtils.req.m[i]};
						console.clear();
						console.log(window.t);
					};
					BDFDB.DevUtils.getAllModules = function () {
						window.t = {};
						for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
							let m = BDFDB.DevUtils.req.c[i].exports;
							if (m && typeof m == "object") window.t[i] = m;
						}
						console.clear();
						console.log(window.t);
					};
					BDFDB.DevUtils.getAllStringLibs = function () {
						window.t = [];
						for (let i in BDFDB.DevUtils.req.c) if (BDFDB.DevUtils.req.c.hasOwnProperty(i)) {
							let m = BDFDB.DevUtils.req.c[i].exports;
							if (m && typeof m == "object" && !BDFDB.ArrayUtils.is(m) && Object.keys(m).length) {
								var string = true, stringlib = false;
								for (let j in m) {
									if (typeof m[j] != "string") string = false;
									if (typeof m[j] == "string" && /^[A-z0-9]+\-[A-z0-9_-]{6}$/.test(m[j])) stringlib = true;
								}
								if (string && stringlib) window.t.push(m);
							}
							if (m && typeof m == "object" && m.default && typeof m.default == "object" && !BDFDB.ArrayUtils.is(m.default) && Object.keys(m.default).length) {
								var string = true, stringlib = false;
								for (let j in m.default) {
									if (typeof m.default[j] != "string") string = false;
									if (typeof m.default[j] == "string" && /^[A-z0-9]+\-[A-z0-9_-]{6}$/.test(m.default[j])) stringlib = true;
								}
								if (string && stringlib) window.t.push(m.default);
							}
						}
						console.clear();
						console.log(window.t);
					};
					BDFDB.DevUtils.listen = function (strings) {
						strings = BDFDB.ArrayUtils.is(strings) ? strings : Array.from(arguments);
						BDFDB.DevUtils.listenStop();
						BDFDB.DevUtils.listen.p = BDFDB.PatchUtils.patch("WebpackSearch", BDFDB.ModuleUtils.findByProperties(strings), strings[0], {after: e => {
							console.log(e);
						}});
					};
					BDFDB.DevUtils.listenStop = function () {
						if (typeof BDFDB.DevUtils.listen.p == "function") BDFDB.DevUtils.listen.p();
					};
					BDFDB.DevUtils.generateLanguageStrings = function (strings, config = {}) {
						const language = config.language || "en";
						const languages = BDFDB.ArrayUtils.removeCopies(BDFDB.ArrayUtils.is(config.languages) ? config.languages : ["en"].concat(Object.keys(BDFDB.ObjectUtils.filter(BDFDB.LanguageUtils.languages, n => n.discord))).filter(n => !n.startsWith("en-") && !n.startsWith("$") && n != language)).sort();
						let translations = {};
						strings = BDFDB.ObjectUtils.sort(strings);
						translations[language] = BDFDB.ObjectUtils.toArray(strings);
						let text = Object.keys(translations[language]).map(k => translations[language][k]).join("\n\n");
						
						let gt = (lang, callback) => {
							let googleTranslateWindow = BDFDB.WindowUtils.open(BDFDB, `https://translate.google.com/#${language}/${{"zh": "zh-CN", "pt-BR": "pt"}[lang] || lang}/${encodeURIComponent(text)}`, {
								onLoad: _ => {
									googleTranslateWindow.executeJavaScriptSafe(`
										let count = 0, interval = setInterval(_ => {
											count++;
											let translation = Array.from(document.querySelectorAll("[data-language-to-translate-into] span:not([class])")).map(n => n.innerText).join("");
											if (translation || count > 50) {
												clearInterval(interval);
												require("electron").ipcRenderer.sendTo(${BDFDB.LibraryRequires.electron.remote.getCurrentWindow().webContents.id}, "GTO-translation", [
													translation,
													(document.querySelector("h2 ~ [lang]") || {}).lang
												]);
											}
										}, 100);
									`);
								}
							});
							BDFDB.WindowUtils.addListener(BDFDB, "GTO-translation", (event, messageData) => {
								BDFDB.WindowUtils.close(googleTranslateWindow);
								BDFDB.WindowUtils.removeListener(BDFDB, "GTO-translation");
								callback(messageData[0]);
							});
						};
						let gt2 = (lang, callback) => {
							BDFDB.LibraryRequires.request(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${language}&tl=${lang}&dt=t&dj=1&source=input&q=${encodeURIComponent(text)}`, (error, response, result) => {
								if (!error && result && response.statusCode == 200) {
									try {callback(JSON.parse(result).sentences.map(n => n && n.trans).filter(n => n).join(""));}
									catch (err) {callback("");}
								}
								else {
									if (response.statusCode == 429) {
										BDFDB.NotificationUtils.toast("Too many requests. Switching to backup.", {type: "error"});
										config.useBackup = true;
										BDFDB.DevUtils.generateLanguageStrings(strings, config);
									}
									else {
										BDFDB.NotificationUtils.toast("Failed to translate text.", {type: "error"});
										callback("");
									}
								}
							});
						};
						let fails = 0, next = lang => {
							if (!lang) {
								let result = Object.keys(translations).filter(n => n != "en").sort().map(l => `\n\t\t\t\t\tcase "${l}":${l.length > 2 ? "\t" : "\t\t"}// ${BDFDB.LanguageUtils.languages[l].name}\n\t\t\t\t\t\treturn {${translations[l].map((s, i) => `\n\t\t\t\t\t\t\t${Object.keys(strings)[i]}:${"\t".repeat(10 - ((Object.keys(strings)[i].length + 2) / 4))}"${translations[language][i][0] == translations[language][i][0].toUpperCase() ? BDFDB.LibraryModules.StringUtils.upperCaseFirstChar(s) : s}"`).join(",")}\n\t\t\t\t\t\t};`).join("");
								if (translations.en) result += `\n\t\t\t\t\tdefault:\t\t// English\n\t\t\t\t\t\treturn {${translations.en.map((s, i) => `\n\t\t\t\t\t\t\t${Object.keys(strings)[i]}:${"\t".repeat(10 - ((Object.keys(strings)[i].length + 2) / 4))}"${translations[language][i][0] == translations[language][i][0].toUpperCase() ? BDFDB.LibraryModules.StringUtils.upperCaseFirstChar(s) : s}"`).join(",")}\n\t\t\t\t\t\t};`
								BDFDB.NotificationUtils.toast("Translation copied to clipboard.", {type: "success"});
								BDFDB.LibraryRequires.electron.clipboard.write({text: result});
							}
							else (config.useBackup ? gt : gt2)(lang, translation => {
								console.log(lang);
								if (!translation) {
									console.warn("no translation");
									fails++;
									if (fails > 10) console.error("skipped language");
									else languages.unshift(lang);
								}
								else {
									fails = 0;
									translations[lang] = translation.split("\n\n");
								}
								next(languages.shift());
							});
						};
						next(languages.shift());
					};
					BDFDB.DevUtils.req = InternalBDFDB.getWebModuleReq();
					
					window.BDFDB_Global = BDFDB;
				}
				else {
					window.BDFDB_Global = Object.assign({
						PluginUtils: {
							buildPlugin: BDFDB.PluginUtils.buildPlugin,
							cleanUp: BDFDB.PluginUtils.cleanUp
						}
					}, config);
					Object.freeze(BDFDB);
				}
				for (let obj in DiscordObjects) if (!DiscordObjects[obj]) {
					DiscordObjects[obj] = function () {};
					BDFDB.DiscordObjects[obj] = function () {};
				}
				for (let component in InternalComponents.NativeSubComponents) if (!InternalComponents.NativeSubComponents[component]) InternalComponents.NativeSubComponents[component] = "div";
				for (let component in InternalComponents.LibraryComponents) if (!InternalComponents.LibraryComponents[component]) {
					InternalComponents.LibraryComponents[component] = "div";
					BDFDB.LibraryComponents[component] = "div";
				}
				
				if (css) BDFDB.DOMUtils.appendLocalStyle("BDFDB", css.replace(/[\n\t\r]/g, "").replace(/\[REPLACE_CLASS_([A-z0-9_]+?)\]/g, function(a, b) {return BDFDB.dotCN[b];}));
				
				window.BDFDB_Global.loaded = true;
				delete window.BDFDB_Global.loading;
			
				BDFDB.LogUtils.log("Finished loading library.");
				
				while (PluginStores.delayedLoad.length) PluginStores.delayedLoad.shift().load();
				while (PluginStores.delayedStart.length) PluginStores.delayedStart.shift().start();
				while (pluginQueue.length) {
					let pluginName = pluginQueue.shift();
					if (pluginName) BDFDB.TimeUtils.timeout(_ => BDFDB.BDUtils.reloadPlugin(pluginName));
				}
	};
	loadLibrary(true);
	
	return class BDFDB_Frame {
		getName () {return config.info.name;}
		getAuthor () {return config.info.author;}
		getVersion () {return config.info.version;}
		getDescription () {return config.info.description;}
		
		load () {
			libraryInstance = this;
			Object.assign(this, config.info, BDFDB.ObjectUtils.exclude(config, "info"));
			if (!BDFDB.BDUtils.isPluginEnabled(config.info.name)) BDFDB.BDUtils.enablePlugin(config.info.name);
		}
		start () {}
		stop () {
			if (!BDFDB.BDUtils.isPluginEnabled(config.info.name)) BDFDB.BDUtils.enablePlugin(config.info.name);
		}
		
		getSettingsPanel (collapseStates = {}) {
			let settingsPanel;
			let getString = (type, key, property) => {
				return BDFDB.LanguageUtils.LibraryStringsCheck[`settings_${key}_${property}`] ? BDFDB.LanguageUtils.LibraryStringsFormat(`settings_${key}_${property}`, BDFDB.BDUtils.getSettingsProperty("name", BDFDB.BDUtils.settingsIds[key]) || BDFDB.LibraryModules.StringUtils.upperCaseFirstChar(key.replace(/([A-Z])/g, " $1"))) : InternalBDFDB.defaults[type][key][property];
			};
			return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(BDFDB, {
				collapseStates: collapseStates,
				children: _ => {
					let settingsItems = [];
					
					for (let key in choices) settingsItems.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SettingsSaveItem, {
						type: "Select",
						plugin: InternalBDFDB,
						keys: ["choices", key],
						label: getString("choices", key, "description"),
						note: getString("choices", key, "note"),
						basis: "50%",
						value: choices[key],
						options: Object.keys(LibraryConstants[InternalBDFDB.defaults.choices[key].items] || {}).map(p => ({value: p, label: BDFDB.LanguageUtils.LibraryStrings[p] || p})),
						searchable: true,
					}));
					for (let key in settings) {
						let nativeSetting = BDFDB.BDUtils.getSettings(BDFDB.BDUtils.settingsIds[key]);
						settingsItems.push(BDFDB.ReactUtils.createElement(InternalComponents.LibraryComponents.SettingsSaveItem, {
							type: "Switch",
							plugin: InternalBDFDB,
							disabled: InternalBDFDB.defaults.settings[key].disableIfNative && nativeSetting,
							keys: ["settings", key],
							label: getString("settings", key, "description"),
							note: (InternalBDFDB.defaults.settings[key].noteAlways || InternalBDFDB.defaults.settings[key].noteIfNative && nativeSetting) && getString("settings", key, "note"),
							value: settings[key] || nativeSetting
						}));
					}
					
					return settingsItems;
				}
			});
		}
	}
})();
/* //META{"name":" */
