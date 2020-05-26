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

// Global variables:
var guilds = []; // List of all guilds with their control roles and configurations.

// TODO: Make the bot first load database configurations and then log in.

bot.on("ready", () => {
  // Update bot activity status:
  updateStatus();

  // TODO: Load guild configurations from database.
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
    if (!dynguild) return;
    // Check if the bot is activated on the selected guild:
    else if (dynguild.enabled == 1) {
      // Check if there is a configuration that has a triggerchannel which fits the emitted channel:
      let dynconfig = dynguild.configurations.find((c) => c.triggerchannel == channelID);
      if (!dynconfig) return;
      // Check if the selected configuration is enabled:
      else if (dynconfig.enabled == 1) {
        /* -------------------------------------------------------------------------- */
        /*                                TESTING START                               */
        /* -------------------------------------------------------------------------- */
        let guild = bot.guilds.resolve(guildID);
        let member = guild.members.resolve(userID);
        let channel = guild.channels.resolve(channelID);
        console.log(
          `${member.nickname || member.user.username} has ${joined ? "joined" : "left"} the trigger channel ${
            channel.name
          }.`
        );
        /* -------------------------------------------------------------------------- */
        /*                                 TESTING END                                */
        /* -------------------------------------------------------------------------- */
        // TODO: Do DynChan stuff:
      }
    }
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
    }', '${uniqid()}', '${botPrefix}', '1') ON DUPLICATE KEY UPDATE secret = '${uniqid()}'`,
    (error, result) => {
      if (error) console.error(error);
    }
  );
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
    .then(console.log)
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
        // Add the guild's configuration and control roles to the new guild object and add it to the "guilds" array:
        results[0].forEach((guild) => {
          guild.configurations = results[1].filter((c) => c.guildid == guild.guildid);
          guild.controlRoles = results[2].filter((cr) => cr.guildid == guild.guildid);
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
