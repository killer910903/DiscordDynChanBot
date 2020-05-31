// jshint esversion: 9
// Check if the bot is tested on Windows or deployed on Linux:
if (process.platform != "win32") process.chdir("/home/zlyfer/DiscordBots/DiscordDynChanBot");
const uniqid = require("uniqid");
const Discord = require("discord.js");
const bot = new Discord.Client();
const mysql = require("mysql");
const credentials = require("./credentials.json");
const sql = mysql.createConnection({
  host: credentials.sql.host,
  user: credentials.sql.user,
  password: credentials.sql.password,
  database: credentials.sql.database,
});
// Default prefix the bot listens to:
const botPrefix = "--test";
// Permissions the bot needs to have to do it's stuff:
const PERMISSIONS = ["VIEW_CHANNEL", "MANAGE_CHANNELS", "MOVE_MEMBERS", "CONNECT"];

// Global variables:
var guilds = []; // List of all guilds with their control roles and configurations.

/* -------------------------------------------------------------------------- */
/*                            FEATURES TO IMPLEMENT                           */
/* -------------------------------------------------------------------------- */
/*
TODO: Interaction with bot.
TODO: Configuration setup/edit/delete.
TODO: Periodically all "dyn" channels to make them reloadable after a crash.
TODO: Interface for web-configurator.
*/
/* -------------------------------------------------------------------------- */
/*                                                                            */
/* -------------------------------------------------------------------------- */

bot.on("ready", () => {
  console.log("Bot ready.");
  // Update bot activity status:
  updateStatus();
});

// Someone joined/left a voice channel or muted/unmuted themselves:
bot.on("voiceStateUpdate", (oldState, newState) => {
  let oldChannel = oldState.channel;
  let newChannel = newState.channel;

  // Basically check if the user joined/left a voice channel:
  if (oldChannel === null && newChannel !== null) {
    updateDynChan(newState.guild.id, newState.id, newState.channelID, true);
  } else if (newChannel === null) {
    updateDynChan(oldState.guild.id, oldState.id, oldState.channelID, false);
  }

  // Bot gets triggered and performs actions based on the guild's configuration(s):
  function updateDynChan(guildID, userID, channelID, joined) {
    // Find "database guild" based on emitted guild id:
    let dynguild = guilds.find((g) => g.guildid == guildID);
    // If the "dyn" guild was properly found:
    if (!dynguild) return;
    // Resolve guild object:
    let guild = bot.guilds.resolve(guildID);
    // If the guild could be resolved:
    if (guild) {
      // Resolve the bot's member object from the guild:
      let botmember = guild.members.resolve(bot.user.id);
      // If the user joined a channel:
      if (joined) {
        // Check if the bot is activated on the selected guild:
        if (dynguild.enabled == 1) {
          // Check if there is a configuration that has a triggerchannel which fits the emitted channel:
          let dynconfig = dynguild.configurations.find((c) => c.triggerchannel == channelID);
          // If there is a configuration linked to this "dyn" guild:
          if (!dynconfig) return;
          // Check if the selected configuration is enabled:
          else if (dynconfig.enabled == 1) {
            // Resolve trigger channel (to check permissions):
            let triggerChan = guild.channels.resolve(channelID);
            // If the trigger channel could be resolved:
            if (!triggerChan) return;
            // Resolve the category for "dyn" voice channels (to move voice channel and check permission):
            let vcat = guild.channels.resolve(dynconfig.vcategory);
            // NOTE: Maybe inefficient, to always resolve text category even if createtext is disabled:
            // Resolve the category for "dyn" text channels (to move text channel and check permission):
            var tcat = guild.channels.resolve(dynconfig.tcategory);
            if (botmember && vcat && tcat) {
              // Check if the bot has the permissions to do it's stuff:
              if (
                hasPerms(botmember, triggerChan) &&
                hasPerms(botmember, vcat) &&
                (hasPerms(botmember, tcat) || !dynconfig.createtext)
              ) {
                // setTimeout to add a delay based on "delay" option of configuration:
                setTimeout(() => {
                  // Resolve the user's member from guild:
                  let member = guild.members.resolve(userID);
                  // Create voice channel with correct settings:
                  guild.channels
                    .create(nameGen(dynconfig, member, "v"), {
                      type: "voice",
                      bitrate: dynconfig.vbitrate * 1000,
                      userLimit: dynconfig.vuserlimit,
                      parent: vcat,
                      reason: `Created by: ${member.displayName}`,
                    })
                    .then((v) => {
                      // If created successfully, add an entry to the dynchans object of the dynguild (to keep track of):
                      dynguild.dynchans[v.id] = {
                        voice: v,
                      };
                      // Move user to the voice channel:
                      member.edit({ channel: v }, "Moved to their dynamic channel.").then().catch(console.warn);
                      // If configuration has enabled "dyn" text channels:
                      if (dynconfig.createtext) {
                        // Create text channel with correct settings:
                        guild.channels
                          .create(nameGen(dynconfig, member, "t"), {
                            type: "text",
                            nsfw: dynconfig.tnsfw,
                            topic: dynconfig.ttopic,
                            parent: tcat,
                            reason: `Created by: ${member.displayName}`,
                          })
                          .then((t) => {
                            // If created successfully, add an entry to the dynchans object of the dynguild (to keep track of):
                            dynguild.dynchans[v.id].text = t;
                          })
                          .catch(console.warn);
                      }
                    })
                    .catch(console.warn);
                }, dynconfig.delay * 1000);
              } else {
                console.warn("Missing permission!");
                // TODO: Somehow communicate which permissions are missing.
              }
            }
          }
        }
      } else {
        // Get the dynchan object from the dynguild:
        let dynchan = dynguild.dynchans[channelID];
        // If the dynchan got retrieved successfully:
        if (dynchan) {
          // If voice channel is empty:
          if (dynchan.voice.members.array().length == 0) {
            // Check if the bot has permissions to delete the channel:
            // NOTE: To be able to delete a voice channel, oddly the bot needs to have permissions to connect to it:
            if (hasPerms()) {
              // Delete voice channel:
              dynchan.voice.delete("All users left.").then().catch(console.warn);
              // Delete text channel:
              dynchan.text.delete("All users left.").then().catch(console.warn);
            } else {
              console.warn("Missing permission!");
              // TODO: Somehow communicate which permissions are missing.
            }
          } else {
            // TODO: Update channel.
          }
        }
      }
    }
  }

  function hasPerms(member, channel) {
    // NOTE: The bot basically checks if it has the permission declared above on the following channels: trigger channel, voice category, text category. However not all of the declared permissions are needed in every of these channels. In future the bot should only ask for the permissions really needed but can suggest all of them to be globally active to reduce the labor of the guild owner/admins. Below are the real permissions for each channel. In future the bot may need permissions to change permissions (Explanation following..).
    // trigger channel: MOVE_MEMBERS
    // voice category: VIEW_CHANNEL, MANAGE_CHANNELS, CONNECT
    // text category: VIEW_CHANNEL, MANAGE_CHANNEL
    return member.permissionsIn(channel).has(PERMISSIONS);
  }

  function nameGen(dynconfig, member, channeltype) {
    /* -------------------------------------------------------------------------- */
    /*                                 NAME LEGEND                                */
    /* -------------------------------------------------------------------------- */
    /*
    1   : Username
    2   : Nickname (custom per guild name)
    3   : Displayname (default, nickname if exists else username)
    IDEA: Counting numbers in arabic and roman style. -> Complicated!
    IDEA: Variable pre- and suffix like the infix.
    IDEA: First owner. -> Complicated!
    ELSE: Fixed text
    */
    /* -------------------------------------------------------------------------- */
    /*                                                                            */
    /* -------------------------------------------------------------------------- */

    let name = "";
    switch (dynconfig[`${channeltype}infix`]) {
      case "1":
        name = member.user.username;
        break;
      case "2":
        name = member.nickname;
        break;
      case "3":
        name = member.displayName.toString();
        break;
      default:
        name = dynconfig[`${channeltype}infix`];
        break;
    }
    return `${dynconfig[`${channeltype}prefix`]} ${name} ${dynconfig[`${channeltype}suffix`]}`;
  }
});

// Bot joines a Discord guild:
bot.on("guildCreate", (guild) => {
  // Update bot activity status:
  updateStatus();
  // Create a row for the new guild:
  sql.query(
    `INSERT INTO guilds (guildid, prefix, secret, enabled) VALUES ('${
      guild.id
    }', '${botPrefix}', '${uniqid()}', '1') ON DUPLICATE KEY UPDATE secret = '${uniqid()}'`,
    (error, result) => {
      if (error) console.error(error);
    }
  );
  // TODO: Somehow tell the user who invited the bot the first steps to configure it.
});

// Bot got removed from a Discord guild:
bot.on("guildDelete", (guild) => {
  // Update bot activity status:
  updateStatus();
  // Delete the row coresponding to the guild the bot just left:
  sql.query(`DELETE FROM guilds WHERE guilds.guildid = '${guild.id}'`, (error, result) => {
    if (error) console.error(error);
  });
});

// Set the activity status of the bot to the amount of guilds the bot watches:
function updateStatus() {
  let guildcount = Object.keys(bot.guilds).length;
  bot.user
    .setPresence({
      status: "online",
      activity: {
        type: "WATCHING",
        name: `${guildcount} Servers`,
      },
    })
    .then()
    .catch(console.error);
}

// Create guilds table, if it doesn't exist already, which includes all guilds the bot is member of:
function createGuildTable() {
  return new Promise((resolve, reject) => {
    sql.query(
      `CREATE TABLE IF NOT EXISTS guilds (guildid VARCHAR(64) NOT NULL, secret VARCHAR(64) NOT NULL, prefix VARCHAR(8) NOT NULL, enabled TINYINT NOT NULL, UNIQUE guild (guildid)) ENGINE = InnoDB;`,
      (error, result) => {
        if (error) reject(new Error(error));
        else resolve(result);
      }
    );
  });
}
// Create configurations table, if it doesn't exist already, which includes all bot configuration sets:
function createConfigurationsTable() {
  return new Promise((resolve, reject) => {
    sql.query(
      `CREATE TABLE IF NOT EXISTS configs (guildid VARCHAR(64) NOT NULL, configid VARCHAR(64) NOT NULL, name VARCHAR(64) NOT NULL, enabled TINYINT NOT NULL, color VARCHAR(6) NOT NULL, triggerchannel VARCHAR(64) NOT NULL, createtext TINYINT NOT NULL, delay INT NOT NULL, isolate TINYINT NOT NULL, vcategory VARCHAR(64) NOT NULL, vprefix VARCHAR(64) NOT NULL, vinfix VARCHAR(64) NOT NULL, vsuffix VARCHAR(64) NOT NULL, vuserlimit TINYINT NOT NULL, vbitrate INT NOT NULL, tcategory VARCHAR(64) NOT NULL, tprefix VARCHAR(64) NOT NULL, tinfix VARCHAR(64) NOT NULL, tsuffix VARCHAR(64) NOT NULL, tnsfw TINYINT NOT NULL, ttopic TINYTEXT NOT NULL, UNIQUE config (guildid, configid)) ENGINE = InnoDB;`,
      (error, result) => {
        if (error) reject(new Error(error));
        else resolve(result);
      }
    );
  });
}
// Create control roles table, if it doesn't exist already, which includes all guild roles that can configure the bot:
function createRolesTable() {
  return new Promise((resolve, reject) => {
    sql.query(
      `CREATE TABLE IF NOT EXISTS controlroles (guildid VARCHAR(64) NOT NULL, roleid VARCHAR(64) NOT NULL, UNIQUE controlrole (guildid, roleid)) ENGINE = InnoDB;`,
      (error, result) => {
        if (error) reject(new Error(error));
        else resolve(result);
      }
    );
  });
}

// Load guild table:
function loadGuildTable() {
  return new Promise((resolve, reject) => {
    sql.query(`SELECT * FROM guilds WHERE 1`, (error, result) => {
      if (error) reject(new Error(error));
      else resolve(result);
    });
  });
}
// Load configurations table:
function loadConfigurationsTable() {
  return new Promise((resolve, reject) => {
    sql.query(`SELECT * FROM configs WHERE 1`, (error, result) => {
      if (error) reject(new Error(error));
      else resolve(result);
    });
  });
}
// Load control roles table:
function loadRolesTable() {
  return new Promise((resolve, reject) => {
    sql.query(`SELECT * FROM controlroles WHERE 1`, (error, result) => {
      if (error) reject(new Error(error));
      else resolve(result);
    });
  });
}

// Basically convert the RowDataPackets from the SQL query results to normal objects:
function objectify(array) {
  array.forEach((subarray, index) => {
    let rarray = [];
    subarray.forEach((el) => {
      rarray.push(JSON.parse(JSON.stringify(el)));
    });
    array[index] = rarray;
  });
  return array;
}

// Create database tables if they don't exist already:
Promise.all([createGuildTable(), createConfigurationsTable(), createRolesTable()])
  .then((results) => {
    // Load all database tables:
    Promise.all([loadGuildTable(), loadConfigurationsTable(), loadRolesTable()])
      .then((results) => {
        results = objectify(results);
        // Add the guild's configurations, control roles and an empty list for dynchans to keep track of to the new guild object and add it to the "guilds" array:
        results[0].forEach((guild) => {
          guild.configurations = results[1].filter((c) => c.guildid == guild.guildid);
          guild.controlRoles = results[2].filter((cr) => cr.guildid == guild.guildid);
          guild.dynchans = {};
          guilds.push(guild);
        });
        // Log bot in:
        bot.login(credentials.discordtoken);
      })
      .catch((error) => {
        console.error("Failed to perform database actions.");
        console.error(error);
      });
  })
  .catch((error) => {
    console.error("Failed to perform database actions.");
    console.error(error);
  });
