// process.chdir('/home/zlyfer/DiscordBots/DiscordDynChanBot');
const Discord = require("discord.js");
const client = new Discord.Client();

const fs = require("fs");
const token = require("./token.json");
const guildConfigFolder = "./guildConfig";
const configTemplate = require("./configTemplate.json");
const guildFile = "./guilds.json";
const botPrefix = "~zltz~";

function getGuildConfig(guildID) {
  try {
    var guildConfig = require(`${guildConfigFolder}/${guildID}.json`);
  } catch (err) {
    console.error(`Could not load configuration file for guild ${guildID}!`);
    var guildConfig = false;
  }
  return guildConfig;
}

client.on("ready", () => {
  client.user
    .setPresence({
      status: "online",
      afk: false,
      game: {
        name: `Use ${botPrefix} help for help!`
      }
    })
    .then(result => console.log("Bot ready, presence set:\b\n", result))
    .catch(error => console.error("Failed to set bot presence:\b\n", error));
});

client.on("guildCreate", guild => {});

client.on("channelUpdate", (oldChannel, newChannel) => {});

client.on("voiceStateUpdate", (oldMember, newMember) => {});

client.on("channelCreate", channel => {});

client.on("message", message => {
  if (!message.author.bot) {
    if (message.channel.type == "text") {
      let messageContent = message.content.split(" ");
      let mPrefix = messageContent[0];
      let mCommand = messageContent[1] || undefined;
      let mArgument = messageContent[2] || undefined;
      let guild = message.guild;
      let guildConfig = getGuildConfig(guild.id);
      if (botPrefix == mPrefix || guildConfig.customBotPrefix == mPrefix) {
        if (guildConfig) {
          if (
            message.author.id == guild.ownerID ||
            hasRole(guild, message.member)
          ) {
            message.reply("I work!");
          } else {
            message.reply(
              "sorry but you seem to lack of rights to control me on this Discord server!\nPlease contact the server owner to solve this problem."
            );
          }
        } else {
          message.reply(
            `I am sorry but I seem to be unaware of this Discord server.\nPlease try to add me to this Discord server again to solve the problem.\nSorry for the inconvinience!`
          );
        }
      } else {
      }
    } else {
      message.reply(
        `Hello there!\nUnfortunately you cannot control me within a direct message chat.\nPlease message me within a text channel on a Discord server using my prefix: ` +
          "`" +
          `${botPrefix}` +
          "`" +
          `.`
      );
    }
  }
});

function hasRole(guild, member) {
  let guildConfig = getGuildConfig(guild.id);
  if (guildConfig) {
    if (guildConfig.controlRoles.includes("@everyone")) {
      return true;
    }
    for (let i = 0; i < member.roles.array().length; i++) {
      let role = member.roles.array()[i];
      if (guildConfig.controlRoles.includes(role.id)) {
        return true;
      }
    }
    return false;
  } else {
    return false;
  }
}

process.on("unhandledRejection", err => {
  console.error(err);
});

client.login(token.token);
