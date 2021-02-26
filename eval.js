require(`https://raw.githubusercontent.com/Syncxv/dumps/main/util.js`)
const quotes = ['""', "''"];
const starting = quotes.reduce((s, q) => [q[0], ...s], []);
const ending = quotes.reduce((s, q) => [q[1], ...s], []);

const FLAG_REGEX = /^(-+[\w]+)/g;
const FLAG_FULL = new RegExp(
  `^-+([\\w-]+)(?:=([${starting.join("")}]?[\\w\\s]+[${ending.join("")}]?))?$`
);

type = (value) => {
  const type = typeof value;
  switch (type) {
    case "object":
      return value === null
        ? "null"
        : value.constructor
        ? value.constructor.name
        : "any";
    case "function":
      return `${value.constructor.name}(${value.length})`;
    case "undefined":
      return "void";
    default:
      return type;
  }
};

isPromise = (value) => {
  return (
    value &&
    typeof value.then === "function" &&
    typeof value.catch === "function"
  );
};

parse = (text) => {
  const str = text.split(" ");

  const obj = { flags: new Map(), phrases: [] };

  for (const phrase of str) {
    if (FLAG_REGEX.test(phrase)) {
      console.log(FLAG_REGEX.exec(phrase));
      let [, name, content] = FLAG_FULL.exec(phrase);

      obj.flags.set(name, content ?? true);
    } else obj.phrases.push(phrase);
  }

  return obj;
};
var { Plugin } = require("powercord/entities");
const {
    React
  } = require("powercord/webpack");  const {
    SwitchItem,
    TextInput,
    ButtonItem,
  } = require("powercord/components/settings");
  
  
  const {
    Button
  } = require("powercord/components");
  
//   class SettingsWOAyeyye extends React.Component {
//     render() {
//       const {
//         getSetting,
//         toggleSetting,
//         updateSetting
//       } = this.props;
//       return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(TextInput, {
//         note: "Text to replace your token with",
//         defaultValue: getSetting("tokenReplacer", "[REDACTED]"),
//         onChange: val => updateSetting("tokenReplacer", val)
//       }, "Token Replacer"), /*#__PURE__*/React.createElement(TextInput, {
//         note: "Custom formatting! Check out the github repo for more info.",
//         defaultValue: getSetting("evalFormat", "⏱️ Took {time}{n}🔍 Typeof {type}{n}{output}"),
//         onChange: val => updateSetting("evalFormat", val)
//       }, "Output Formatting"), /*#__PURE__*/React.createElement(TextInput, {
//         note: "Amount of messages to cache for auto completion",
//         defaultValue: getSetting("autoCompleteAmount", 25),
//         onChange: val => updateSetting("autoCompleteAmount", isNaN(val) ? 25 : Number(val)),
//         disabled: !getSetting("autoCompleteToggle")
//       }, "Auto Complete"), /*#__PURE__*/React.createElement(SwitchItem, {
//         note: "Turns auto complete on or off.",
//         value: getSetting("autoCompleteToggle", true),
//         onChange: () => toggleSetting("autoCompleteToggle")
//       }, "Auto Complete"), /*#__PURE__*/React.createElement(SwitchItem, {
//         note: "For the users who are inexpirenced. I'm not sure why you'd want this, but it's here just in case.",
//         value: getSetting("safeEval", false),
//         onChange: () => toggleSetting("safeEval")
//       }, "Basic/Safe Evaluate"), /*#__PURE__*/React.createElement(ButtonItem, {
//         note: "Clear all of the auto complete cache, just in case.",
//         disabled: !getSetting("autoCompleteToggle"),
//         button: "Clear Data",
//         color: Button.Colors.RED,
//         onClick: () => powercord.api.commands.commands["eval"].messages = []
//       }, "Clear Auto Complete Cache"));
//     }
  
//   }
  
//   ;
class EvalCommand extends Plugin {
    startPlugin() {
      // All of the settings. Looks ugly but idk how else to make this look "pretty"
//       const replace = this.settings.get("tokenReplacer", "[REDACTED]");
//       const format = this.settings.get(
//         "evalFormat",
//         "⏱️ Took {time}{n}🔍 Typeof {type}{n}{output}"
//       );
//       const safeEval = this.settings.get("safeEval", false);
      //const autoCompleteAmount = this.settings.get("autoCompleteAmount", 25);
      const autoCompleteAmount = 25
      //const allowAutoComplete = this.settings.get("autoCompleteToggle", true);
      const allowAutoComplete = true;
  
      // Register Eval settings
//       window.settings.registerSettings("eval-plugin", {
//         category: this.entityID,
//         label: "Eval Plugin",
//         render: SettingsWOAyeyye,
//       });
  
      // Eval command, of course
      window.commandsclass.registerCommand({
        command: "eval",
        aliases: ["evaluate"],
        description: "Evaluates any JavaScript code",
        usage: "{c} [ code ] [ -depth=<number> ]",
        category: "Util",
        async executor(args) {
          // Check for arguments
          if (!args.length)
            return {
              send: false,
              result: `Invalid usage! Valid Usage: \`${this.usage.replace(
                "{c}",
                 this.command
              )}\``,
            };
            const { flags, phrases } = parse(
              args.join(" ").replace(/```js/, "").replace(/```/, "").trim()
            );
    
            // @TODO: fix issue: https://github.com/Sxmurai/eval-plugin/issues/3
            if (!this.messages.includes(phrases.join(" ")) && allowAutoComplete)
              this.messages.unshift(phrases.join(" "));
    
            // Check for depth.
          // Try/catch for error handling.
          try {
            let evaluated = eval(args.join(" "), { depth: 0 });
            return {
              send: false,
              result: `\`\`\`js\n${evaluated}\`\`\``,
            };
          } catch (error) {
            return {
              send: false,
              result: `\`\`\`js\n${error}\`\`\``,
            };
          }
        },
      });
  
      // @TODO: improve this garbage
      if (allowAutoComplete) {
        window.commandsclass.commands["eval"].messages = [];
  
        const messages = window.commandsclass.commands["eval"].messages;
  
        setInterval(() => {
          if (messages.length > autoCompleteAmount)
            messages.slice(0, autoCompleteAmount);
        }, 5000);
  
        window.commandsclass.commands["eval"].autocomplete = (args) => {
          if (!args || !args.length) return false;
  
          return {
            header: `Auto Complete`,
            commands: messages
              .filter((msg) =>
                msg.toLowerCase().includes(args.join(" ").toLowerCase())
              )
              .map((key) => ({ command: key, description: "" })),
          };
        };
      }
    }
  
    pluginWillUnload() {
      window.commandsclass.unregisterCommand("eval");
      windo.settings.unregisterSettings("eval-plugin");
    }
  };

  process = {}
  process.hrtime || hrtime
  
  // polyfil for window.performance.now
  var performance = window.performance || {}
  var performanceNow =
    performance.now        ||
    performance.mozNow     ||
    performance.msNow      ||
    performance.oNow       ||
    performance.webkitNow  ||
    function(){ return (new Date()).getTime() }
  
  // generate timestamp or delta
  // see http://nodejs.org/api/process.html#process_process_hrtime
  function hrtime(previousTimestamp){
    var clocktime = performanceNow.call(performance)*1e-3
    var seconds = Math.floor(clocktime)
    var nanoseconds = Math.floor((clocktime%1)*1e9)
    if (previousTimestamp) {
      seconds = seconds - previousTimestamp[0]
      nanoseconds = nanoseconds - previousTimestamp[1]
      if (nanoseconds<0) {
        seconds--
        nanoseconds += 1e9
      }
    }
    return [seconds,nanoseconds]
  }
  process.hrtime = hrtime
var evalcmd = new EvalCommand
evalcmd.entityID = "evalv2"
evalcmd.startPlugin()
