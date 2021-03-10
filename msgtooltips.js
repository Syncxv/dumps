
var { Plugin } = require('powercord/entities');
var { inject, uninject } = require('powercord/injector');
var { React, getModule, getModuleByDisplayName  } = require('powercord/webpack');
var { SwitchItem, Category } = require('powercord/components/settings');
var tooltips = [
    {
        name: 'Color Codes',
        description: 'Displays a previews of color codes',
        regex: new RegExp(
            /((?:#|0x)(?:[a-f0-9]{3}|[a-f0-9]{6})\b|(?:rgb|hsl)a?\([^\)]*\))/,
            'gmi'
        ),
        default: true
    },
    {
        name: 'Base64',
        description: 'Displays Base64 strings decoded into normal text',
        regex: new RegExp(
            /(^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$)/,
            'gm'
        ),
        default: true,
        options: [
            {
                name: 'Require Majority Text',
                note:
                    'Require more than 75% of the text to be a valid US keyboard character. Reduces false positives.',
                id: 'base64-majority-text',
                default: true
            }
        ]
    }
];

const Tooltip = getModuleByDisplayName('Tooltip', false);
class StringPart extends React.PureComponent {
    render() {
      const {
        parts,
        ops
      } = this.props;
      /**
       * Iterate through every item in {parts}, knowing that the items that need to
       * be replaced will be on every odd numbered index.
       */
  
      for (var i = 1; i < parts.length; i += 2) {
        if (typeof parts[i] !== 'string') continue;
        const text = parts[i];
        const display = this.selectTooltip(this.props.name, parts[i], ops);
        if (display) parts[i] = /*#__PURE__*/React.createElement(Tooltip, {
          position: (ops === null || ops === void 0 ? void 0 : ops.position) || 'top',
          text: display
        }, props => /*#__PURE__*/React.createElement("span", props, text));
      }
  
      return parts;
    }
  
    selectTooltip(name, part, ops) {
      /**
       * Add tooltip content here.
       * Return either a string, react element, or NULL to cancel.
       */
      switch (name) {
        case 'Color Codes':
          return /*#__PURE__*/React.createElement("span", {
            style: {
              display: 'inline-block',
              backgroundColor: part,
              width: 15,
              height: 15,
              marginRight: 0,
              borderRadius: 3
            }
          });
  
        case 'Base64':
          const parsed = atob(part); // Honestly the base64-majority-text option confused me and I only got it correct via trial and error.
          // prettier-ignore
  
          if (ops['base64-majority-text'] && parsed.replace(/[a-zA-Z0-9\t\n .\/<>?;:"'`!@#$%^&*()\[\]{}_+=|\\-]/g, '').length > parsed.length * .25) return null;else return parsed;
  
        default:
          return part;
      }
    }
  
  }
  
  class Settings extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        opened: {
          main: true
        }
      };
    }
  
    toSnake(str) {
      return str.split(' ').join('-').toLowerCase();
    }
  
    render() {
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Category, {
        name: "Tooltips",
        description: "Toggle message tooltips",
        opened: this.state.opened.main,
        onChange: () => this.setState({ ...this.state.opened,
          opened: {
            main: !this.state.opened.main
          }
        })
      }, tooltips.map(item => {
        const id = `tooltip-toggled-${this.toSnake(item.name)}`;
        return /*#__PURE__*/React.createElement(SwitchItem, {
          value: this.props.getSetting(id, item.default),
          onChange: () => {
            this.props.toggleSetting(id, item.default);
          },
          note: item.description
        }, item.name);
      })), tooltips.map(item => {
        var _item$options;
  
        if (this.props.getSetting(`tooltip-toggled-${this.toSnake(item.name)}`, item.default) && ((_item$options = item.options) === null || _item$options === void 0 ? void 0 : _item$options.length) > 0) {
          var _item$options2;
  
          return /*#__PURE__*/React.createElement(Category, {
            name: item.name,
            opened: this.state.opened[this.toSnake(item.name)],
            description: "Additional Options",
            onChange: () => this.setState({ ...this.state.opened,
              opened: {
                [this.toSnake(item.name)]: !this.state.opened[this.toSnake(item.name)]
              }
            })
          }, (_item$options2 = item.options) === null || _item$options2 === void 0 ? void 0 : _item$options2.map(option => /*#__PURE__*/React.createElement(SwitchItem, {
            value: this.props.getSetting(option.id, option.default),
            onChange: () => {
              this.props.toggleSetting(option.id, option.default);
            },
            note: option.note
          }, option.name)));
        }
      }));
    }
  
  }
  
  ;
class MessageTooltips extends Plugin {
    constructor() {
        super('message-tooltips')
    }
    async startPlugin() {
        settings.registerSettings(this.entityID, {
            category: this.entityID,
            label: 'Message Tooltips',
            render: Settings
        });

        const parser = await getModule(['parse', 'parseTopic']);
        const process = this.process.bind(this);

        inject(`message-tooltips`, parser, 'parse', process);
        inject(`embed-tooltips`, parser, 'parseAllowLinks', process);
        inject(`topic-tooltips`, parser, 'parseTopic', (a, b) =>
            process(a, b, { position: 'bottom' })
        );
    }

    /**
     * Processes a message component
     * @param {*} args - Arguments, rarely used
     * @param {*} res - The message componenet being passed through the function
     * @param {*} ops - Additional options
     */
    process(args, res, ops = {}) {
        // Iterate through every tooltip
        for (var i = 0; i < tooltips.length; i++) {
            // Continue if the tooltip is not enabled
            const id = `tooltip-toggled-${this.toSnake(tooltips[i].name)}`;
            if (!this.settings.get(id, tooltips[i].default)) continue;

            /**
             * Replace the following property with a version that
             * may have replaced the nested strings with React elements
             */
            if (res?.props?.children[1])
                res.props.children[1] = this.replace(
                    res.props.children[1],
                    tooltips[i],
                    ops
                );
            else if (Array.isArray(res))
                res = this.replace(res, tooltips[i], ops);
        }
        return res;
    }

    /**
     * Recursively replaces the string elements in the nested arrays with custom elements
     * @param {*} base - The .children property of the props
     * @param {*} item - The current regex item being parsed against a string
     * @param {*} ops - Additional options
     */
    replace(base, item, ops) {
        // Return a remapped version of the base
        return base.map(i => {
            if (typeof i === 'string' && i.trim()) {
                /**
                 *  If {i} is a valid, non-whitespace string, parse it against the regex item
                 *  to see if it needs to be replaced with a tooltip element
                 */

                return this.getElement(i, item, ops);
            } else if (Array.isArray(i?.props?.children))
                // Otherwise, if {i} has valid .props.children, reiterate through that instead

                return {
                    ...i,
                    props: {
                        ...i.props,
                        children: this.replace(i.props.children, item, ops)
                    }
                };
            else {
                /**
                 * If none of the previous clauses are true, it's most likely just a design element
                 * such as a block quote or image, which can simply be returned.
                 */

                // Handle Inline Code
                if (
                    i.type === 'code' &&
                    typeof i?.props?.children === 'string' &&
                    i?.props?.children?.trim()
                )
                    i.props.children = this.getElement(
                        i.props.children,
                        item,
                        ops
                    );

                return i;
            }
        });
    }

    getElement(i, item, ops) {
        const parts = i.split(item.regex);

        /**
         * If the regex does not match the string, {parts} will contain an array of
         * either one or zero length. Therefore, we can just return the string as we
         * don't need to do anything to it.
         */
        if (parts.length <= 1) return i;

        // Parse & Pass Options
        for (var x = 0; x < item.options?.length; x++)
            ops[item.options[x].id] = this.settings.get(
                item.options[x].id,
                item.options[x].default
            );

        /**
         * If the regex matched the string, {parts} will now contain an array of elements
         * that need to be replaced with tooltips at every odd number index. Return the
         * replacement tooltip element instead of the string.
         */

        return React.createElement(StringPart, {
            parts,
            ops,
            regex: item.regex,
            name: item.name
        });
    }

    pluginWillUnload() {
        powercord.api.settings.unregisterSettings(this.entityID);
        uninject('message-tooltips');
        uninject('embed-tooltips');
        uninject('topic-tooltips');
    }

    /**
     * Helper Functions
     */
    toSnake(str) {
        return str.split(' ').join('-').toLowerCase();
    }
};

var msgtl = new MessageTooltips
msgtl.startPlugin()
