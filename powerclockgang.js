var {
  RadioGroup,
  SwitchItem
} = require('powercord/components/settings');

var {
  React
} = require('powercord/webpack');

class Settings extends React.Component {
  render() {
    const {
      getSetting,
      updateSetting,
      toggleSetting
    } = this.props;
    return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(RadioGroup, {
      onChange: e => {
        updateSetting('timeFormat', e.value);
        if (e.value === 1) updateSetting('indicator', false);
      },
      value: getSetting('timeFormat', 0),
      options: [{
        name: '12 hour time',
        value: 0
      }, {
        name: '24 hour time',
        value: 1
      }]
    }, "Time Format"), /*#__PURE__*/React.createElement(SwitchItem, {
      value: getSetting('sticky', false),
      onChange: () => toggleSetting('sticky'),
      note: "If the clock should always be visible at the top of the server list."
    }, "Sticky"), /*#__PURE__*/React.createElement(SwitchItem, {
      value: getSetting('indicator', false),
      onChange: () => toggleSetting('indicator'),
      disabled: getSetting('timeFormat', 0) !== 0
    }, "AM/PM indicator"), /*#__PURE__*/React.createElement(SwitchItem, {
      value: getSetting('twoDigit', false),
      onChange: () => toggleSetting('twoDigit'),
      note: "Will add a 0 to the beginning of the hours if less than 10"
    }, "Always show two digits"));
  }

}

;


var {
  React
} = require('powercord/webpack');

class Clock extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = this.getNewState();
  }

  render() {
    return /*#__PURE__*/React.createElement("div", {
      className: `powerclock${this.state.sticky ? ' sticky' : ''}`
    }, this.state.hours, ":", this.state.mins, " ", this.state.indicator);
  }

  componentDidMount() {
    if (this.props.getSetting('timeFormat') > 1) {
      this.props.updateSetting('timeFormat', 0);
    }

    this.interval = setInterval(async () => {
      this.setState(this.getNewState());
    }, 1e3);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  getNewState() {
    const format = this.props.getSetting('timeFormat') > 1 ? 0 : this.props.getSetting('timeFormat');
    const now = new Date();
    let dispHours = format === 1 ? now.getHours() : now.getHours() % 12 === 0 ? 12 : now.getHours() % 12;

    if (this.props.getSetting('twoDigit')) {
      dispHours = dispHours.toString().padStart(2, '0');
    }

    return {
      hours: dispHours,
      mins: now.getMinutes().toString().padStart(2, '0'),
      sticky: this.props.getSetting('sticky'),
      indicator: this.props.getSetting('indicator') ? now.getHours() < 12 ? 'AM' : 'PM' : ''
    };
  }

}

;
var { Plugin } = require('powercord/entities');
var { React, getModule } = require('powercord/webpack');
var { inject, uninject } = require('powercord/injector');
var { forceUpdateElement } = require('powercord/util');
class PowerClock extends Plugin {
    constructor() {
        super('powerclock')
    }
	async startPlugin() {
		this.loadStylesheet(`  
.powerclock {
	text-align: center;
	color: var(--text-muted);
	font-weight: bold;
	padding-bottom: .5rem;
}

.powerclock.sticky {
	z-index: 1;
	background-color: var(--background-tertiary);
	position: sticky;
	top: 0;
	box-shadow: 0 -4px var(--background-tertiary);
}`);

		powercord.api.settings.registerSettings('powerclock-settings', {
			category: this.entityID,
			label: 'Powerclock',
			render: Settings
	});
		const { DefaultHomeButton } = await getModule([ 'DefaultHomeButton' ]);
		inject('powerclock', DefaultHomeButton.prototype, 'render', (_, res) => {
			if (!Array.isArray(res)) res = [ res ];
			res.unshift(React.createElement(Clock, {
				className: 'powerclock sticky',
				getSetting: this.settings.get,
				updateSetting: this.settings.update
			}));
			return res;
		});
	}

	pluginWillUnload() {
		uninject('powerclock');
		powercord.api.settings.unregisterSettings('powerclock-settings');
		forceUpdateElement(`.${(getModule([ 'homeIcon', 'downloadProgress' ], false)).tutorialContainer}`);
	}

};


var nigg2 =  new PowerClock
nigg2.startPlugin()
