//const { API } = require('powercord/entities');

/**
 * @typedef PowercordToast
 * @property {String} header
 * @property {String} content
 * @property {ToastButton[]|void} buttons
 * @property {Number|void} timeout
 * @property {String|void} className
 * @property {Boolean|void} hideProgressBar
 */

/**
 * @typedef ToastButton
 * @property {String|void} size
 * @property {String|void} look
 * @property {String|void} color
 * @property {function} onClick
 * @property {String} text
 */

/**
 * @typedef PowercordAnnouncement
 * @property {String} message
 * @property {String|void} color
 * @property {function|void} onClose
 * @property {Object|void} button
 * @property {function} button.onClick
 * @property {String} button.text
 */

/**
 * @property {Object.<String, PowercordToast>} toasts
 * @property {Object.<String, PowercordAnnouncement>} announcements
 */
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
window.Events = EventEmitter;
window.EventEmitter = EventEmitter
// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}
class API extends Events {
  constructor () {
    super();
    this.ready = true;
  }

  
  log (...data) {
    console.log(`%c[Powercord:API:${this.constructor.name}]`, 'color: #7289da', ...data);
  }

  warn (...data) {
    console.warn(`%c[Powercord:API:${this.constructor.name}]`, 'color: #7289da', ...data);
  }

  error (...data) {
    console.error(`%c[Powercord:API:${this.constructor.name}]`, 'color: #7289da', ...data);
  }
}

class NoticesAPI extends API {
  constructor () {
    super();

    this.announcements = {};
    this.toasts = {};
  }

  /**
   * Sends an announcement to the user (banner at the top of the client)
   * @param {String} id Announcement ID
   * @param {PowercordAnnouncement} props Announcement
   * @emits NoticesAPI#announcementAdded
   */
  sendAnnouncement (id, props) {
    if (this.announcements[id]) {
      return this.error(`ID ${id} is already used by another plugin!`);
    }

    this.announcements[id] = props;
    this.emit('announcementAdded', id);
  }

  /**
   * Closes an announcement
   * @param {String} id Announcement ID
   * @emits NoticesAPI#announcementClosed
   */
  closeAnnouncement (id) {
    if (!this.announcements[id]) {
      return;
    }

    delete this.announcements[id];
    this.emit('announcementClosed', id);
  }

  /**
   * Sends a toast to the user
   * @param {String} id Toast ID
   * @param {PowercordToast} props Toast
   * @emits NoticesAPI#toastAdded
   */
  sendToast (id, props) {
    if (this.toasts[id]) {
      return this.error(`ID ${id} is already used by another plugin!`);
    }

    this.toasts[id] = props;
    this.emit('toastAdded', id);
  }

  /**
   * Closes a toast
   * @param {String} id Toast ID
   * @emits NoticesAPI#toastLeaving
   */
  closeToast (id) {
    const toast = this.toasts[id];
    if (!toast) {
      return;
    }

    if (toast.callback && typeof toast.callback === 'function') {
      toast.callback();
    }

    this.emit('toastLeaving', id);
    setTimeout(() => delete this.toasts[id], 500);
  }
};
window.notices = new NoticesAPI

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

var {
  React,
  getModuleByDisplayName
} = require('powercord/webpack');

var {
  Button,
  Tooltip,
  Clickable,
  Icons: {
    FontAwesome
  }
} = require('powercord/components');

var Progress = AsyncComponent.from(getModuleByDisplayName('Progress'));

class Toast extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      timeout: null,
      progress: 100
    };
  }

  componentDidMount() {
    if (this.props.timeout && !isNaN(this.props.timeout)) {
      const timeout = setTimeout(() => window.notices.closeToast(this.props.id), this.props.timeout);
      this.setState({
        timeout
      });
      let timeLeft = this.props.timeout;
      setInterval(() => {
        timeLeft -= 1000;
        this.setState({
          progress: timeLeft / this.props.timeout * 100
        });
      }, 1e3);
    }
  }

  render() {
    return /*#__PURE__*/React.createElement("div", {
      id: this.props.id,
      className: ['powercord-toast', this.props.leaving ? 'leaving' : '', this.props.className].filter(Boolean).join(' '),
      "data-toast-type": this.props.type || 'info',
      style: this.props.style
    }, this.props.header && this.renderHeader(), this.props.content && this.renderContent(), this.props.buttons && Array.isArray(this.props.buttons) && this.renderButtons(), this.state.timeout && !this.props.hideProgressBar && this.renderProgress());
  }

  renderHeader() {
    const faicons = {
      info: 'info-circle-regular',
      warning: 'exclamation-circle-regular',
      danger: 'times-circle-regular',
      success: 'check-circle-regular'
    };
    return /*#__PURE__*/React.createElement("div", {
      className: "header"
    }, this.props.icon !== false && /*#__PURE__*/React.createElement(Tooltip, {
      text: `${this.props.type ? this.props.type.replace(/wS*/g, text => text.charAt(0).toUpperCase() + text.substr(1).toLowerCase()) : 'Info'}: ${this.props.header}`,
      position: "left"
    }, /*#__PURE__*/React.createElement("div", {
      className: "icon",
      style: this.props.iconColor ? {
        color: this.props.iconColor
      } : {}
    }, this.props.image ? /*#__PURE__*/React.createElement("img", {
      src: this.props.image,
      alt: "",
      className: [this.props.imageClassName || null].filter(Boolean).join(' ')
    }) : this.props.icon ? /*#__PURE__*/React.createElement(FontAwesome, {
      icon: this.props.icon
    }) : /*#__PURE__*/React.createElement(FontAwesome, {
      icon: faicons[this.props.type] || 'info-circle-regular'
    }))), /*#__PURE__*/React.createElement("span", null, this.props.header), /*#__PURE__*/React.createElement(Clickable, {
      className: "dismiss",
      onClick: () => {
        clearTimeout(this.state.timeout);
        window.notices.closeToast(this.props.id);
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "fal fa-times fa-fw"
    })));
  }

  renderContent() {
    return /*#__PURE__*/React.createElement("div", {
      className: "contents"
    }, /*#__PURE__*/React.createElement("div", {
      className: "inner"
    }, this.props.content));
  }

  renderButtons() {
    return /*#__PURE__*/React.createElement("div", {
      className: "buttons"
    }, this.props.buttons.map((button, i) => {
      const btnProps = {};
      ['size', 'look', 'color'].forEach(prop => {
        if (button[prop]) {
          const value = button[prop].includes('-') ? button[prop] : Button[`${prop.charAt(0).toUpperCase() + prop.slice(1)}s`][button[prop].toUpperCase()];

          if (value) {
            btnProps[prop] = value;
          }
        }
      });

      if (!btnProps.size) {
        btnProps.size = Button.Sizes.SMALL;
      }

      return /*#__PURE__*/React.createElement(Button, _extends({
        key: i
      }, btnProps, {
        onClick: () => {
          if (button.onClick) {
            button.onClick();
          }

          clearTimeout(this.state.timeout);
          return window.notices.closeToast(this.props.id);
        }
      }), button.text);
    }));
  }

  renderProgress() {
    return /*#__PURE__*/React.createElement(Progress, {
      percent: this.state.progress,
      foregroundGradientColor: ['#738ef5', '#b3aeff'],
      animate: true
    });
  }

}

function _extends() { _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }

class ToastContainer extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      leaving: null
    };

    this._addedHandler = () => this.forceUpdate();

    this._leavingHandler = id => {
      this.setState({
        leaving: id
      });
      setTimeout(() => this.setState({
        leaving: null
      }), 510);
    };
  }

  componentDidMount() {
    window.notices.on('toastAdded', this._addedHandler);
    window.notices.on('toastLeaving', this._leavingHandler);
  }

  componentWillUnmount() {
    window.notices.off('toastAdded', this._addedHandler);
    window.notices.off('toastLeaving', this._leavingHandler);
  }

  render() {
    const toast = Object.keys(window.notices.toasts).pop();
    return /*#__PURE__*/React.createElement("div", {
      className: "powercord-toast-container"
    }, toast && /*#__PURE__*/React.createElement(Toast, _extends({
      leaving: this.state.leaving === toast,
      id: toast
    }, window.notices.toasts[toast])));
  }

}

loadStylesheet(`/*======== CSS Variables ========*/
 .theme-dark {
	 --toast-background: #2f3136;
	 --toast-header: #202225;
	 --toast-contents: #36393f;
	 --toast-box-shadow: rgba(0, 0, 0, .2);
	 --toast-border: rgba(28, 36, 43, .6);
}
 .theme-light {
	 --toast-background: #fff;
	 --toast-header: #e3e5e8;
	 --toast-contents: #f2f3f5;
	 --toast-box-shadow: rgba(0, 0, 0, .1);
	 --toast-border: rgba(28, 36, 43, .06);
}
/*======== Toast Styling ========*/
 .powercord-toasts-container {
	 display: flex;
	 flex-direction: column;
	 align-items: flex-end;
	 justify-content: flex-end;
}
 .powercord-toast {
	 display: flex;
	 flex-direction: column;
	 background-color: var(--toast-background);
	 border: 1px solid var(--toast-border);
	 box-shadow: 0 2px 10px 0 var(--toast-box-shadow);
	 box-sizing: border-box;
	 border-radius: 5px;
	 position: absolute;
	 animation: slide-in 0.5s ease, shake 1.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
	 max-width: 600px;
	 min-width: 223px;
	 width: 320px;
	 right: 25px;
	 bottom: 25px;
	 z-index: 999;
}
 .powercord-toast .header {
	 display: flex;
	 color: var(--text-normal);
	 font-weight: 600;
	 font-size: 16px;
	 line-height: 19px;
	 background-color: var(--toast-header);
	 box-shadow: 0 2px 3px 0 var(--toast-box-shadow);
	 border-radius: 5px 5px 0 0;
	 padding: 12px 20px;
}
 .powercord-toast .header .icon {
	 margin-right: 5px;
}
 .powercord-toast .header .icon img {
	 width: 18px;
	 height: 18px;
}
 .powercord-toast .header .dismiss {
	 width: 16px;
	 height: 16px;
	 opacity: 0.5;
	 transition: opacity 0.2s;
	 margin-left: auto;
	 cursor: pointer;
	 font-size: 12px;
	 padding: 1px;
}
 .powercord-toast .header .dismiss:hover {
	 opacity: 1;
}
 .powercord-toast .contents {
	 display: flex;
	 border-radius: 0 0 5px 5px;
	 text-align: center;
	 justify-content: flex-end;
	 flex-direction: column;
	 padding: 10px 10px 0;
}
 .powercord-toast .contents .inner {
	 color: var(--text-normal);
	 font-size: 14px;
	 line-height: 16px;
	 background-color: var(--toast-contents);
	 border: 2px solid var(--toast-border);
	 border-radius: 5px;
	 padding: 10px 6px;
	 margin: 0 0 6px;
}
 .powercord-toast .buttons {
	 box-sizing: border-box;
	 flex-wrap: wrap;
	 display: flex;
	 width: 100%;
	 padding: 10px;
}
 .powercord-toast .buttons button {
	 box-sizing: border-box;
	 min-width: calc(50% - 10px);
	 padding: 1.5%;
	 margin: 1.5% 3px;
	 flex: 1;
}
 .powercord-toast .buttons button[class*='lookGhost-'] {
	 opacity: 0.8;
	 transition: background-color 0.17s ease, color 0.17s ease, opacity 0.17s ease, -webkit-transform 0.17s ease;
}
 .powercord-toast .buttons button[class*='lookGhost-']:hover {
	 opacity: 1;
}
 .powercord-toast .contents + .buttons {
	 padding-top: 0;
}
 .powercord-toast.leaving {
	 animation: slide-out 0.7s ease-out;
}
/*========= Light Theme =========*/
 .theme-light .powercord-toast {
	 border: 1px solid rgba(191, 191, 191, .3);
}
/*========= Header Types =========*/
 .powercord-toast[data-toast-type="info"] .icon {
	 color: #7289da;
}
 .powercord-toast[data-toast-type="warning"] .icon {
	 color: #faa61a;
}
 .powercord-toast[data-toast-type="danger"] .icon {
	 color: #f04747;
}
 .powercord-toast[data-toast-type="success"] .icon {
	 color: #43b581;
}
/*========== Animations ==========*/
 @keyframes shake {
	 10%, 90% {
		 transform: translate3d(1px, 0, 0);
	}
	 20%, 80% {
		 transform: translate3d(2px, 0, 0);
	}
	 30%, 50%, 70% {
		 transform: translate3d(-4px, 0, 0);
	}
	 40%, 60% {
		 transform: translate3d(4px, 0, 0);
	}
}
 @keyframes slide-in {
	 from {
		 margin-right: -500px;
		 opacity: 0;
	}
}
 @keyframes slide-out {
	 to {
		 margin-right: -500px;
		 opacity: 0;
	}
}
 `)


 var {inject, uninject} = injector
 
var {
  getModule
  } = require('powercord/webpack');

  async function _patchToasts () {
    const { app } = await getModule([ 'app', 'layers' ]);
    const Shakeable = await getModuleByDisplayName('Shakeable');
    inject('pc-notices-toast', Shakeable.prototype, 'render', (_, res) => {
      if (!res.props.children.find(child => child.type && child.type.name === 'ToastContainer')) {
        res.props.children.push(React.createElement(ToastContainer));
      }
      return res;
    });
    forceUpdateElement(`.${app}`);
  }
  _patchToasts()
