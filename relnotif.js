var { Plugin } = require('powercord/entities');
var { inject, uninject } = require('powercord/injector');
var { FluxDispatcher: Dispatcher, getModule } = require('powercord/webpack');
var {
    React,
    getModuleByDisplayName,
    getModule
  } = require('powercord/webpack');
  

  
  var {
    TextInput,
    Category,
    SwitchItem
  } = require('powercord/components/settings');
  
  var FormText = AsyncComponent.from(getModuleByDisplayName('FormText'));
  var FormTitle = AsyncComponent.from(getModuleByDisplayName('FormTitle'));
  var Flex = AsyncComponent.from(getModuleByDisplayName('flex'));
  var FlexChild = getModule(['flexChild'], false).flexChild;
  
  class Settings extends React.Component {
    constructor(props) {
      super();
    }
  
    render() {
      const {
        getSetting,
        updateSetting,
        toggleSetting
      } = this.props;
      return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SwitchItem, {
        note: 'Display notifications when someone removes you from their friends list.',
        value: getSetting('remove', true),
        onChange: () => toggleSetting('remove')
      }, "Remove"), /*#__PURE__*/React.createElement(SwitchItem, {
        note: 'Display notifications when you get kicked from a server.',
        value: getSetting('kick', true),
        onChange: () => toggleSetting('kick')
      }, "Kick"), /*#__PURE__*/React.createElement(SwitchItem, {
        note: 'Display notifications when you get banned from a server.',
        value: getSetting('ban', true),
        onChange: () => toggleSetting('ban')
      }, "Ban"), /*#__PURE__*/React.createElement(SwitchItem, {
        note: 'Display notifications when you get kicked from a group chat.',
        value: getSetting('group', true),
        onChange: () => toggleSetting('group')
      }, "Group"), /*#__PURE__*/React.createElement(Category, {
        name: 'Text',
        description: 'Customize the notifications the way you want.',
        opened: getSetting('textExpanded', false),
        onChange: () => updateSetting('textExpanded', !getSetting('textExpanded', false))
      }, /*#__PURE__*/React.createElement(Flex, {
        style: {
          justifyContent: 'center'
        }
      }, /*#__PURE__*/React.createElement("div", {
        className: FlexChild
      }, /*#__PURE__*/React.createElement(FormTitle, null, "Remove Variables"), /*#__PURE__*/React.createElement(FormText, {
        style: {
          textAlign: 'center'
        }
      }, "%username", /*#__PURE__*/React.createElement("br", null), "%userid", /*#__PURE__*/React.createElement("br", null), "%usertag")), /*#__PURE__*/React.createElement("div", {
        className: FlexChild
      }, /*#__PURE__*/React.createElement(FormTitle, null, "Kick & Ban Variables"), /*#__PURE__*/React.createElement(FormText, {
        style: {
          textAlign: 'center'
        }
      }, "%servername", /*#__PURE__*/React.createElement("br", null), "%serverid")), /*#__PURE__*/React.createElement("div", {
        className: FlexChild
      }, /*#__PURE__*/React.createElement(FormTitle, null, "Button Variables"), /*#__PURE__*/React.createElement(FormText, {
        style: {
          textAlign: 'center'
        }
      }, "%name")), /*#__PURE__*/React.createElement("div", {
        className: FlexChild
      }, /*#__PURE__*/React.createElement(FormTitle, null, "Group Variables"), /*#__PURE__*/React.createElement(FormText, {
        style: {
          textAlign: 'center'
        }
      }, "%groupname", /*#__PURE__*/React.createElement("br", null), "%groupid"))), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement(TextInput, {
        value: getSetting('removeTitle', 'Someone removed you'),
        onChange: v => updateSetting('removeTitle', v),
        note: 'The title the notification will have when someone removes you.'
      }, "Removed Title"), /*#__PURE__*/React.createElement(TextInput, {
        value: getSetting('removeText', 'Tag: %username#%usertag'),
        onChange: v => updateSetting('removeText', v),
        note: 'The text the notification will have when someone removes you.'
      }, "Removed Text"), /*#__PURE__*/React.createElement(TextInput, {
        value: getSetting('kickTitle', "You've been kicked"),
        onChange: v => updateSetting('kickTitle', v),
        note: 'The title the notification will have when you get kicked from a server.'
      }, "Kicked Title"), /*#__PURE__*/React.createElement(TextInput, {
        value: getSetting('kickText', 'Server Name: %servername'),
        onChange: v => updateSetting('kickText', v),
        note: 'The text the notification will have when you get kicked from a server.'
      }, "Kicked Text"), /*#__PURE__*/React.createElement(TextInput, {
        value: getSetting('banTitle', "You've been banned"),
        onChange: v => updateSetting('banTitle', v),
        note: 'The title the notification will have when you get banned from a server.'
      }, "Banned Title"), /*#__PURE__*/React.createElement(TextInput, {
        value: getSetting('banText', 'Server Name: %servername'),
        onChange: v => updateSetting('banText', v),
        note: 'The text the notification will have when you get banned from a server.'
      }, "Banned Text"), /*#__PURE__*/React.createElement(TextInput, {
        value: getSetting('groupTitle', "You've been kicked from a group"),
        onChange: v => updateSetting('groupTitle', v),
        note: 'The title the notification will have when you get kicked from a group chat.'
      }, "Group Title"), /*#__PURE__*/React.createElement(TextInput, {
        value: getSetting('groupText', 'Group Name: %groupname'),
        onChange: v => updateSetting('groupText', v),
        note: 'The text the notification will have when you get kicked from a group chat.'
      }, "Group Text"), /*#__PURE__*/React.createElement(TextInput, {
        value: getSetting('buttonText', 'Fuck %name'),
        onChange: v => updateSetting('buttonText', v),
        note: "The text the notification's confirm button will have."
      }, "Button Text")));
    }
  
  }
  
  ;
class RelationshipsNotifier extends Plugin {
   async startPlugin() {
      window.settings.registerSettings('relationships-notifier', {
         category: this.entityID,
         label: 'Relationships Notifier',
         render: Settings
      });

      this.userStore = await getModule(['getCurrentUser', 'getUser']);
      this.guildStore = await getModule(['getGuild', 'getGuilds']);
      this.channelStore = await getModule(['getChannels']);

      this.cachedGroups = [...Object.values(this.channelStore.getChannels())].filter((c) => c.type === 3);
      this.cachedGuilds = [...Object.values(this.guildStore.getGuilds())];

      Dispatcher.subscribe('RELATIONSHIP_REMOVE', this.relationshipRemove);
      Dispatcher.subscribe('GUILD_MEMBER_REMOVE', this.memberRemove);
      Dispatcher.subscribe('GUILD_BAN_ADD', this.ban);
      Dispatcher.subscribe('GUILD_CREATE', this.guildCreate);
      Dispatcher.subscribe('CHANNEL_CREATE', this.channelCreate);
      Dispatcher.subscribe('CHANNEL_DELETE', this.channelDelete);

      this.mostRecentlyRemovedID = null;
      this.mostRecentlyLeftGuild = null;
      this.mostRecentlyLeftGroup = null;

      const relationshipModule = await getModule(['removeRelationship']);
      inject('rn-relationship-check', relationshipModule, 'removeRelationship', (args, res) => {
         this.mostRecentlyRemovedID = args[0];
         return res;
      });

      const leaveGuild = await getModule(['leaveGuild']);
      inject('rn-guild-leave-check', leaveGuild, 'leaveGuild', (args, res) => {
         this.mostRecentlyLeftGuild = args[0];
         this.removeGuildFromCache(args[0]);
         return res;
      });

      const closePrivateChannel = await getModule(['closePrivateChannel']);
      inject('rn-group-check', closePrivateChannel, 'closePrivateChannel', (args, res) => {
         this.mostRecentlyLeftGroup = args[0];
         this.removeGroupFromCache(args[0]);
         return res;
      });
   }

   pluginWillUnload() {
      window.settings.unregisterSettings('relationships-notifier');
      uninject('rn-relationship-check');
      uninject('rn-guild-join-check');
      uninject('rn-guild-leave-check');
      uninject('rn-group-check');
      Dispatcher.unsubscribe('RELATIONSHIP_REMOVE', this.relationshipRemove);
      Dispatcher.unsubscribe('GUILD_MEMBER_REMOVE', this.memberRemove);
      Dispatcher.unsubscribe('GUILD_BAN_ADD', this.ban);
      Dispatcher.unsubscribe('GUILD_CREATE', this.guildCreate);
      Dispatcher.unsubscribe('CHANNEL_CREATE', this.channelCreate);
      Dispatcher.unsubscribe('CHANNEL_DELETE', this.channelDelete);
   }

   guildCreate = (data) => {
      this.cachedGuilds.push(data.guild);
   };

   channelCreate = (data) => {
      if ((data.channel && data.channel.type !== 3) || this.cachedGroups.find((g) => g.id === data.channel.id)) return;
      this.cachedGroups.push(data.channel);
   };

   channelDelete = (data) => {
      if ((data.channel && data.channel.type !== 3) || !this.cachedGroups.find((g) => g.id === data.channel.id)) return;
      let channel = this.cachedGroups.find((g) => g.id == data.channel.id);
      if (!channel || channel === null) return;
      this.removeGroupFromCache(channel.id);
      if (this.settings.get('group', true)) {
         window.notices.sendToast(`rn_${this.random(20)}`, {
            header: this.replaceWithVars('group', this.settings.get('groupTitle', "You've kicked from a group"), channel),
            content: this.replaceWithVars('group', this.settings.get('groupText', 'Group Name: %groupname'), channel),
            type: 'danger',
            buttons: [
               {
                  text: this.replaceWithVars('button', this.settings.get('buttonText', 'Fuck %name'), channel),
                  color: 'red',
                  size: 'small',
                  look: 'outlined'
               }
            ]
         });
      }
   };

   removeGroupFromCache = (id) => {
      const index = this.cachedGroups.indexOf(this.cachedGroups.find((g) => g.id == id));
      if (index == -1) return;
      this.cachedGroups.splice(index, 1);
   };

   removeGuildFromCache = (id) => {
      const index = this.cachedGuilds.indexOf(this.cachedGuilds.find((g) => g.id == id));
      if (index == -1) return;
      this.cachedGuilds.splice(index, 1);
   };

   ban = (data) => {
      if (data.user.id !== this.userStore.getCurrentUser().id) return;
      let guild = this.cachedGuilds.find((g) => g.id == data.guildId);
      if (!guild || guild === null) return;
      this.removeGuildFromCache(guild.id);
      if (this.settings.get('ban', true)) {
         window.notices.sendToast(`rn_${this.random(20)}`, {
            header: this.replaceWithVars('ban', this.settings.get('banTitle', "You've been banned"), guild),
            content: this.replaceWithVars('ban', this.settings.get('banText', 'Server Name: %servername'), guild),
            type: 'danger',
            buttons: [
               {
                  text: this.replaceWithVars('button', this.settings.get('buttonText', 'Fuck %name'), guild),
                  color: 'red',
                  size: 'small',
                  look: 'outlined'
               }
            ]
         });
      }
   };

   relationshipRemove = (data) => {
      if (data.relationship.type === 3 || data.relationship.type === 4) return;
      if (this.mostRecentlyRemovedID === data.relationship.id) {
         this.mostRecentlyRemovedID = null;
         return;
      }
      let user = this.userStore.getUser(data.relationship.id);
      if (!user || user === null) return;
      if (this.settings.get('remove', true)) {
         window.notices.sendToast(`rn_${this.random(20)}`, {
            header: this.replaceWithVars('remove', this.settings.get('removeTitle', 'Someone removed you'), user),
            content: this.replaceWithVars('remove', this.settings.get('removeText', 'Tag: %username#%usertag'), user),
            type: 'danger',
            buttons: [
               {
                  text: this.replaceWithVars('button', this.settings.get('buttonText', 'Fuck %name'), user),
                  color: 'red',
                  size: 'small',
                  look: 'outlined'
               }
            ]
         });
      }
      this.mostRecentlyRemovedID = null;
   };

   memberRemove = (data) => {
      if (this.mostRecentlyLeftGuild === data.guildId) {
         this.mostRecentlyLeftGuild = null;
         return;
      }
      if (data.user.id !== this.userStore.getCurrentUser().id) return;
      let guild = this.cachedGuilds.find((g) => g.id == data.guildId);
      if (!guild || guild === null) return;
      this.removeGuildFromCache(guild.id);
      if (this.settings.get('kick', true)) {
         window.notices.sendToast(`rn_${this.random(20)}`, {
            header: this.replaceWithVars('kick', this.settings.get('kickTitle', "You've been kicked"), guild),
            content: this.replaceWithVars('kick', this.settings.get('kickText', 'Server Name: %servername'), guild),
            type: 'danger',
            buttons: [
               {
                  text: this.replaceWithVars('button', this.settings.get('buttonText', 'Fuck %name'), guild),
                  color: 'red',
                  size: 'small',
                  look: 'outlined'
               }
            ]
         });
      }
      this.mostRecentlyLeftGuild = null;
   };

   random() {
      var result = '';
      var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (var i = 0; i < length; i++) {
         result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
   }

   replaceWithVars(type, text, object) {
      if (type === 'remove') {
         return text.replace('%username', object.username).replace('%usertag', object.discriminator).replace('%userid', object.id);
      } else if (['ban', 'kick'].includes(type)) {
         return text.replace('%servername', object.name).replace('%serverid', object.id);
      } else if (type === 'button' && !object.type) {
         return text.replace('%name', object.username ? object.username : object.name);
      } else if (type === 'group') {
         let name = object.name.length === 0 ? object.recipients.map((id) => this.userStore.getUser(id).username).join(', ') : object.name;
         return text.replace('%groupname', name).replace('%groupid', object.id);
      } else {
         let name = object.name.length === 0 ? object.recipients.map((id) => this.userStore.getUser(id).username).join(', ') : object.name;
         return text.replace('%name', name);
      }
   }
};
var relnotif = new RelationshipsNotifier
relnotif.entityID = "relation-ship"
relnotif.startPlugin()
