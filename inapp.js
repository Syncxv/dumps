var { getModule, React } = require('powercord/webpack');
var { inject, uninject } = require('powercord/injector');
var { Plugin } = require('powercord/entities');
var shouldDisplayNotifications = getModule([ 'shouldDisplayNotifications' ], false);
var parser = getModule([ 'parse', 'parseTopic' ], false).parse;
var MessageContent = getModule(m => m.type && m.type.displayName === 'MessageContent', false);
var { SwitchItem, SliderInput } = require('powercord/components/settings');
class Settings extends React.Component {
    render() {
      const {
        getSetting,
        toggleSetting
      } = this.props;
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SwitchItem, {
        note: "When enabled, notify when pinged.",
        value: getSetting('notifyPing', false),
        onChange: () => toggleSetting('notifyPing')
      }, "Only notify on ping"), /*#__PURE__*/React.createElement(SwitchItem, {
        note: "When enabled, desktop notifications will be disabled; if Discord is active.",
        value: getSetting('blockDesktop', false),
        onChange: () => toggleSetting('blockDesktop')
      }, "Disable desktop notifications when Discord is active"), /*#__PURE__*/React.createElement(SwitchItem, {
        note: "When enabled, notifications will not vanish automatically.",
        value: getSetting('sticky', false),
        onChange: () => toggleSetting('sticky')
      }, "Sticky Notifications"), /*#__PURE__*/React.createElement(SliderInput, {
        stickToMarkers: true,
        minValue: 1,
        maxValue: 5,
        initialValue: this.props.getSetting('timeMult', 1),
        markers: [1, 1.25, 1.5, 2, 2.5, 3, 4, 5],
        className: "ianDispTimeMult",
        defaultValue: this.props.getSetting('timeMult', 1),
        onValueChange: v => this.props.updateSetting('timeMult', v),
        disabled: getSetting('sticky', false)
      }, "Display time multiplier"));
    }
  
  }
  
  ;


class InAppNotifications extends Plugin {
    constructor() {
        super('inappnotif')
    }
	async startPlugin() {
		powercord.api.settings.registerSettings('ian-settings', {
			category: this.entityID,
			label: 'In App Notifications',
			render: Settings
		});

		try {
			const show = getModule([ 'makeTextChatNotification' ], false);
			const transition = getModule([ 'transitionTo' ], false);
			const { getGuild } = getModule([ 'getGuild' ], false);
			const { ack } = getModule([ 'ack', 'ackCategory' ], false);
            var mod = getModule(['updateChannelOverrideSettings'], false)
			let toasts = [];

			inject('ian', show, 'makeTextChatNotification', args => {
				const [ channel, msg, author ] = args;

				const onPing = this.settings.get('notifyPing', false);
				const sticky = this.settings.get('sticky', false);
				const timeMult = this.settings.get('timeMult', 1);

				const toast = `ian-${(Math.random().toString(36) + Date.now()).substring(2, 7)}`;
				toasts.push(toast);
				const guild = getGuild(channel.guild_id);
				const time = sticky ? null : timeMult * Math.min(Math.max(msg.content.split(' ').length * 0.5e3, 4e3), 10e3);

				if (!msg.content.match(new RegExp(`<(@!?|#|@&)?(${getModule([ 'getCurrentUser' ], false).getCurrentUser().id})>`, 'g'))
						&& onPing) {
					return args;
				}

				powercord.api.notices.sendToast(toast, {
					header: `${author.username} ${msg.referenced_message ? 'replied' : ''} ${guild ? `in ${guild.name}` : 'in DM\'s'}`,
					timeout: time,
					icon: msg.referenced_message ? 'reply' : 'comment-alt',
					content: React.createElement(MessageContent, {
						message: {
							...msg,
							isEdited: () => false,
							hasFlag: () => false // somehow having theses be functions that return false makes discord not crash????????????
						},
						content: parser(msg.content, true, { channelId: channel.id })
					}),
					buttons: [ {
						text: toasts.length > 1 ? 'Dismiss all' : 'Dismiss',
						look: 'ghost',
						size: 'small',
						onClick: () => {
							toasts.forEach((id) => powercord.api.notices.closeToast(id));
						}
					}, {
						text: 'Mute Channel 15 Min',
						look: 'ghost',
						size: 'small',
						onClick: () => mod.updateChannelOverrideSettings(channel.guild_id, channel.id, this.getMuteConfig(900))
				
					}, {
						text: 'Mark as read',
						look: 'ghost',
						size: 'small',
						onClick: () => ack(channel.id)
					}, {
						text: `Jump to ${guild ? `#${channel.name}` : 'DM\'s'}`,
						look: 'outlined',
						size: 'small',
						onClick: () => transition.transitionTo(`/channels/${guild ? guild.id : '@me'}/${channel.id}/${msg.id}`)
					} ]
				});

				return args;
			}, true);

			inject('ian-desktop-blocker', shouldDisplayNotifications, 'shouldDisplayNotifications', (args) => {
				const blockDesktop = this.settings.get('blockDesktop', false);
				if (blockDesktop && document.hasFocus()) {
					return false;
				}
				return args;
			}, true);

			powercord.api.notices.on('toastLeaving', (toastID) => {
				if (toastID.startsWith('ian-')) {
					toasts = toasts.filter((id) => id !== toastID);
				}
			});
		} catch (error) {
			console.error(`There seems to have been a problem with the in app notifications. Please report this to the developer.\n\n${error}`);
		}
	}
    getMuteConfig(s) {
        return { muted: true, mute_config: {
            end_time: new Date(Date.now() + s * 1000).toISOString(), selected_time_window: Number(s)
        }}
    }
	pluginWillUnload() {
		uninject('ian');
		uninject('ian-desktop-blocker');
		powercord.api.settings.unregisterSettings('ian-settings');
	}

};

var nogg = new InAppNotifications;
nogg.startPlugin()
