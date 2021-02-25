//Juby210 the goat ong 
(async function () {
const { React, getModule, getModuleByDisplayName } = window.browserCordWebpack
const { FormTitle } = mainComponents
const { Category } = settingsComponents
const { Modal } = mainComponents
const { open, close } = BrowserModal
const { inject, uninject } = injector
var {Plugin} = require('powercord/entities')
//"use strict";

const {
  SwitchItem
} = settingsComponents;

var Settings = ({
  getSetting,
  toggleSetting,
  repatch
}) => /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SwitchItem, {
  value: getSetting('toolbar', true),
  onChange: () => {
    toggleSetting('toolbar', true);
    repatch();
  }
}, "Show \"View Raw\" button on message toolbar"), /*#__PURE__*/React.createElement(SwitchItem, {
  value: getSetting('contextMenu', true),
  onChange: () => {
    toggleSetting('contextMenu', true);
    repatch();
  }
}, "Show \"View Raw\" buttons in message context menu"), /*#__PURE__*/React.createElement(SwitchItem, {
  value: getSetting('allRawData'),
  onChange: () => toggleSetting('allRawData')
}, "Show \"View All Raw Data\" instead of \"View Raw Embeds\""));



const _classes = getModule(['markup'], false)
const parser = getModule(['parse', 'parseTopic'], false)

const ZWS = '\u200B'
const ZWS_RE = /\u200B|\u200C|\u200D|\u2060|\u180E/

function strToReact(str) {
    const zws = /*#__PURE__*/React.createElement("span", {
      className: "zws"
    }, ZWS);
    return str.split(ZWS_RE).reduce((r, a) => r.concat(zws, a), []).slice(1);
  }
// What the hell is this.
function parseContent(content) {
	const res = parser.defaultRules.codeBlock.react({ content }, null, {})
	const ogRender = res.props.render
	res.props.render = (codeblock) => {
		const res = ogRender(codeblock)
		if (typeof res.props.children.props.children === 'string') {
			res.props.children.props.children = strToReact(
				res.props.children.props.children
			)
		} else {
			const props = res.props.children.props.children.props.children[1].props
			if (Array.isArray(props.children)) {
				props.children.forEach((c) => {
					c.props.children[1].props.children = strToReact(
						c.props.children[1].props.children
					)
				})
			} else {
				props.children.props.children[1].props.children = strToReact(
					props.children.props.children[1].props.children
				)
			}
		}
		return res
	}
	return res
}

class ViewRawModal extends React.PureComponent {
    constructor(props) {
      super(props);
      this.state = {
        viewAllRawData: !props.message.content
      };
    }
  
    render() {
      const {
        message
      } = this.props,
            allRawData = this.props.allRawData || !message.embeds.length;
      return /*#__PURE__*/React.createElement(Modal, {
        size: Modal.Sizes.LARGE,
        className: "vrmodal"
      }, /*#__PURE__*/React.createElement(Modal.Header, null, /*#__PURE__*/React.createElement(FormTitle, {
        tag: "h4"
      }, "Raw message written by ", message.author.username), /*#__PURE__*/React.createElement(Modal.CloseButton, {
        onClick: close
      })), /*#__PURE__*/React.createElement(Modal.Content, {
        className: _classes.markup
      }, message.content ? parseContent(message.content) : null, /*#__PURE__*/React.createElement(Category, {
        name: allRawData ? 'View All Raw Data' : 'View Raw Embeds',
        opened: this.state.viewAllRawData,
        onChange: () => this.setState({
          viewAllRawData: !this.state.viewAllRawData
        })
      }, parser.defaultRules.codeBlock.react({
        content: JSON.stringify(allRawData ? message : message.embeds, null, '\t'),
        lang: 'json'
      }, null, {}))));
    }
  
  }
var _Modal = ViewRawModal


const Tooltip = getModuleByDisplayName("Tooltip", false);
const {
  Button
} = getModule(m => {
  var _m$default;

  return (m === null || m === void 0 ? void 0 : (_m$default = m.default) === null || _m$default === void 0 ? void 0 : _m$default.displayName) === "MiniPopover";
}, false) || {};
let clicks = [];
let timeout;

class ViewRawButton extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      copied: false,
      message: this.patchMessage(props.message)
    };
  }

  patchMessage(msg) {
    const message = _.cloneDeep(msg); // Censor personal data.


    for (const data in message.author) {
      if (typeof message.author[data] !== "function" && ["id", "username", "usernameNormalized", "discriminator", "avatar", "bot", "system", "publicFlags"].indexOf(data) === -1) delete message.author[data];
    } // JSONify embed keys. Making easier to use them in e.g. bots.


    message.embeds = message.embeds.map(e => {
      delete e.id;
      this.jsonifyEmbedKeys(e);

      for (const k of Object.keys(e).filter(k => typeof e[k] == "object")) {
        if (!Array.isArray(e[k])) this.jsonifyEmbedKeys(e[k]);else e[k].map(el => typeof el === "object" && !Array.isArray(el) ? this.jsonifyEmbedKeys(el) : el);
      }

      return e;
    });
    return message;
  }

  jsonifyEmbedKeys(e) {
    for (const k of Object.keys(e)) {
      const newKey = k.replace("URL", "_url").replace(/[A-Z]/g, l => "_" + l.toLowerCase()).replace("raw_", "");
      if (newKey === k) continue;
      e[newKey] = e[k];
      delete e[k];
    }

    return e;
  }

  clickHandler(event) {
    event.preventDefault();
    const {
      message
    } = this.state;
    clicks.push(new Date().getTime());
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (clicks.length > 1 && clicks[clicks.length - 1] - clicks[clicks.length - 2] < 250) {
        window.copyToClipboard(JSON.stringify(message, null, "\t"));
        this.setCopied("Raw Data");
      } else {
        if (message.attachments.length > 0) {
          if (message.content.length < 1) message.content += message.attachments.map(x => x.url).join("\n");else if (message.attachments.length > 0 && message.content.length > 0) message.attachments.map(x => x.url).forEach(x => {
            if (!message.content.includes(x)) message.content += `\n${x}`;
          });
        }

        open(() => /*#__PURE__*/React.createElement(ViewRawModal, {
          message: message,
          allRawData: this.props.allRawData
        }));
      }
    }, 250);
  }

  setCopied(type) {
    this.setState({
      copied: type
    });
    setTimeout(() => this.setState({
      copied: false
    }), 2e3);
  }

  render() {
    const {
      message
    } = this.props;
    return /*#__PURE__*/React.createElement(Tooltip, {
      color: this.state.copied ? this.state.copied == "error" ? "red" : "green" : "black",
      postion: "top",
      text: this.state.copied ? this.state.copied == "error" ? "Unknown Type" : `Copied ${this.state.copied}!` : "(L) View Raw (R) Copy Raw (2xL) Copy Raw Data"
    }, ({
      onMouseLeave,
      onMouseEnter
    }) => /*#__PURE__*/React.createElement(Button, {
      className: `view-raw-button`,
      onClick: e => {
        this.clickHandler(e);
      },
      onContextMenu: () => {
        if (message.content.length > 0) {
          window.copyToClipboard(message.attachments.length > 0 ? message.content + "\n" + (message === null || message === void 0 ? void 0 : message.attachments.map(x => x.url).join("\n")) : message.content);
          this.setCopied("Raw");
        } else if (message.attachments.length > 0) {
          window.copyToClipboard(message === null || message === void 0 ? void 0 : message.attachments.map(x => x.url).join("\n"));
          this.setCopied("Raw");
        } else if (message.embeds.length > 0) {
          window.copyToClipboard(JSON.stringify(message.embeds, null, '\t'));
          this.setCopied("Embed Data");
        } else {
          this.setCopied("error");
        }
      },
      onMouseEnter: onMouseEnter,
      onMouseLeave: onMouseLeave
    }, /*#__PURE__*/React.createElement("svg", {
      x: "0",
      y: "0",
      "aria-hidden": "false",
      width: "22",
      height: "22",
      viewBox: "0 0 512.002 512.002",
      fill: "currentColor",
      class: _classes.icon
    }, /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: "M462.002,92.002h-42.001V50c0-27.57-22.43-50-50-50h-320c-27.57,0-50,22.43-50,50v320.002c0,27.57,22.43,50,50,50h42.001    v42c0,27.57,22.43,50,50,50h320c27.57,0,50-22.43,50-50v-320C512.001,114.432,489.573,92.002,462.002,92.002z M50.001,400.002    c-16.542,0-30-13.458-30-30V50c0-16.542,13.458-30,30-30h320c16.542,0,30,13.458,30,30v320.002c0,16.542-13.458,30-30,30H50.001z     M492.002,462.002c0,16.542-13.458,30-30,30h-320c-16.542,0-30-13.458-30-30v-42h257.999c27.57,0,50-22.43,50-50v-258h42.001    c16.542,0,30,13.458,30,30V462.002z"
    }))), /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: "M462.024,457.002H170.98c-5.522,0-10,4.478-10,10c0,5.523,4.478,10,10,10h291.043c5.522,0,10-4.477,10-10    S467.546,457.002,462.024,457.002z"
    }))), /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: "M142.25,457.002h-0.27c-5.522,0-10,4.478-10,10c0,5.523,4.478,10,10,10h0.27c5.523,0,10-4.477,10-10    S147.773,457.002,142.25,457.002z"
    }))), /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: "M110.035,35h-0.27c-5.522,0-10,4.478-10,10s4.478,10,10,10h0.27c5.522,0,10-4.478,10-10S115.558,35,110.035,35z"
    }))), /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: "M81.036,35H50.001c-5.522,0-10,4.478-10,10s4.478,10,10,10h31.034c5.523,0,10.001-4.478,10.001-10S86.558,35,81.036,35z"
    }))), /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: "M122.084,246.829l-0.008-0.008l-14.8-30.002c5.407-2.305,10.07-5.975,13.466-10.537c3.725-5.006,5.931-11.08,5.931-17.604    c0-8.588-3.248-15.902-9.743-21.965c-3.196-2.992-6.739-5.242-10.627-6.744c-3.891-1.506-8.097-2.258-12.612-2.258H64.936    c-2.793,0-5.327,1.145-7.163,2.996c-1.832,1.85-2.968,4.396-2.968,7.205v82.777c0,2.896,1.137,5.338,2.893,7.105    c0.962,0.969,2.107,1.728,3.349,2.246c1.249,0.52,2.597,0.797,3.953,0.797c2.49,0,5.028-0.92,7.096-2.967    c1.004-0.99,1.761-2.09,2.271-3.297c0.516-1.221,0.771-2.516,0.771-3.885v-31.139h10.844l17.862,36.184l-0.004,0.005    c1.315,2.699,3.416,4.4,5.763,5.201c1.275,0.434,2.616,0.596,3.938,0.502c1.317-0.094,2.618-0.44,3.812-1.022    c2.307-1.123,4.237-3.123,5.179-5.881h0.002c0.45-1.307,0.639-2.609,0.564-3.904C123.023,249.327,122.684,248.058,122.084,246.829    z M106.124,190.85c-0.438,1.795-1.473,3.546-3.189,5.07c-1.205,1.039-2.538,1.838-3.996,2.395c-1.45,0.553-3.02,0.865-4.704,0.934    v-0.006H75.138v-21.221H93.69c3.19,0,5.9,0.893,7.984,2.328c1.83,1.26,3.187,2.939,3.96,4.791    C106.393,186.957,106.591,188.942,106.124,190.85z"
    }))), /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: "M364.199,163.706c-1.12-2.354-3.136-4.285-5.777-5.254l-0.055-0.016c-2.721-0.916-5.49-0.688-7.823,0.439    c-2.349,1.135-4.243,3.172-5.193,5.861v0.008l-19.568,55.744l-19.571-55.816h-0.001c-0.705-2.352-2.14-4.141-3.935-5.322    c-1.589-1.047-3.458-1.609-5.345-1.656c-1.887-0.047-3.801,0.42-5.479,1.43c-1.938,1.164-3.553,3.031-4.445,5.637h0.002    l-19.564,55.73l-19.569-55.746l-0.008-0.016c-0.997-2.779-2.938-4.752-5.235-5.846c-1.222-0.584-2.552-0.918-3.899-0.99    c-1.34-0.074-2.701,0.115-3.991,0.578c-2.347,0.842-4.429,2.57-5.701,5.24c-1.206,2.529-1.354,5.119-0.441,7.766l0.005,0.009    l29.181,83.133l0.016,0.047c1.186,3.139,3.318,5.213,5.775,6.234c1.141,0.473,2.355,0.717,3.581,0.73    c1.219,0.016,2.438-0.197,3.595-0.635c2.602-0.982,4.914-3.084,6.238-6.268l0.039-0.109l19.595-55.779l20.043,56.877l0.047,0.125    c0.967,2.25,2.404,3.912,4.071,4.99c1.666,1.078,3.544,1.563,5.408,1.465c1.854-0.096,3.686-0.764,5.274-1.992    c1.666-1.289,3.059-3.191,3.899-5.686l29.251-83.133C365.546,168.825,365.317,166.053,364.199,163.706z"
    }))), /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("path", {
      d: "M226.7,247.37l-0.008-0.031l-8.818-21.24l-0.003,0.002l-25.528-61.617h0.001c-1.024-2.709-3.167-4.654-5.674-5.645    c-1.165-0.461-2.429-0.715-3.708-0.742c-1.28-0.027-2.565,0.178-3.773,0.635c-2.393,0.906-4.479,2.764-5.647,5.719l0.005,0.002    l-25.54,61.719h-0.003l-8.818,21.168v0.008c-1.076,2.607-1,5.383-0.008,7.783c0.994,2.408,2.91,4.433,5.51,5.527l0.038,0.023    c2.619,1.035,5.435,1.064,7.886,0.041c2.295-0.955,4.242-2.813,5.384-5.6l6.147-14.877h37.566l6.148,14.877    c1.175,2.844,3.171,4.674,5.459,5.609c1.261,0.518,2.601,0.752,3.932,0.73c1.324-0.021,2.642-0.295,3.865-0.801    c2.418-0.998,4.496-2.9,5.579-5.547l0.008-0.016C227.723,252.523,227.723,249.945,226.7,247.37z M172.552,219.938l10.344-25.01    l10.416,25.01H172.552z"
    }))))));
  }

}
class viewRaw extends Plugin{
    constructor(){
        super('RAWVIEWER')
    }
    startPlugin() {
		window.settings.registerSettings(this.entityID, {
			category: this.entityID,
			label: "View Raw",
			render: (p) =>
				React.createElement(Settings, {
					repatch: () => this.addButtons(true),
					...p,
				}),
		});
		this.loadStylesheet(`.vrmodal {
            min-height: 0;
        }
        .vrmodal pre {
            max-width: 100%;
            padding-bottom: 15px;
        }
        
        .vrmodal .zws {
            width: 1px;
            display: inline-block;
            background-color: #f00;
        }`);

		this.addButtons();
	}

	pluginWillUnload() {
		window.settings.unregisterSettings(this.entityID);
		this.addButtons(true, true);
		document
			.querySelectorAll(".view-raw-button")
			.forEach((e) => (e.style.display = "none"));
	}

	async addButtons(repatch, unpatch) {
		if (repatch) {
			uninject("view-raw-toolbar");
			uninject("view-raw-contextmenu");
		}
		if (unpatch) return;

		if (this.settings.get("toolbar", true)) {
			const MiniPopover = await getModule(
				(m) => m?.default?.displayName === "MiniPopover"
			);
			inject("view-raw-toolbar", MiniPopover, "default", (_, res) => {
				const props = findInReactTree(res, (r) => r?.message);
				if (!props) return res;

				res.props.children.unshift(
					React.createElement(ViewRawButton, {
						allRawData: this.settings.get("allRawData"),
						message: props.message,
					})
				);
				return res;
			});
			MiniPopover.default.displayName = "MiniPopover";
		}

		if (!this.settings.get("contextMenu", true)) return;
		//const { clipboard } = await getModule(["clipboard"]);
		const { MenuGroup, MenuItem } = await getModule(["MenuGroup", "MenuItem"]);
		const MessageContextMenu = await getModule(
			(m) => m?.default?.displayName === "MessageContextMenu"
		);
		inject(
			"view-raw-contextmenu",
			MessageContextMenu,
			"default",
			(args, res) => {
				if (!args[0]?.message || !res?.props?.children) return res;

				res.props.children.splice(
					4,
					0,
					React.createElement(
						MenuGroup,
						null,
						React.createElement(MenuItem, {
							action: () =>
								open(() =>
									React.createElement(ViewRawModal, {
										allRawData: this.settings.get("allRawData"),
										message: args[0].message,
									})
								),
							id: "view-raw",
							label: "View Raw",
						}),
						React.createElement(MenuItem, {
							action: () => window.copyToClipboard(args[0].message.content),
							disabled: !args[0].message.content,
							id: "copy-raw",
							label: "Copy Raw",
						})
					)
				);
				return res;
			}
		);
		MessageContextMenu.default.displayName = "MessageContextMenu";
	}
}
var viewraw = new viewRaw
window.viewraw
viewraw.startPlugin()
})()
