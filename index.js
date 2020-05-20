// jshint esversion: 9
// Check if the bot is tested on Windows or deployed on Linux:
if (process.platform != "win32") process.chdir("/home/zlyfer/DiscordBots/DiscordDynChanBot");
const uniqid = require("uniqid");
const Discord = require("discord.js");
const client = new Discord.Client();
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

client.on("ready", () => {
  // Update bot activity status:
  updateStatus();
  // Create guilds table which includes all guilds the bot is member of:
  sql.query(
    `CREATE TABLE IF NOT EXISTS guilds (guildid VARCHAR(64) NOT NULL, secret VARCHAR(64) NOT NULL, prefix VARCHAR(8) NOT NULL, enabled TINYINT NOT NULL, UNIQUE guild (guildid)) ENGINE = InnoDB;`,
    (error, result) => {
      if (error) console.error(error);
    }
  );
  // Create configurations table which includes all bot configuration sets:
  sql.query(
    `CREATE TABLE IF NOT EXISTS configs (guildid VARCHAR(64) NOT NULL, configid SMALLINT NOT NULL AUTO_INCREMENT, name VARCHAR(64) NOT NULL, enabled TINYINT NOT NULL, color VARCHAR(6) NOT NULL, triggerchannel VARCHAR(64) NOT NULL, createtext TINYINT NOT NULL, delay INT NOT NULL, isolate TINYINT NOT NULL, vcategory VARCHAR(64) NOT NULL, vprefix VARCHAR(64) NOT NULL, vinfix VARCHAR(64) NOT NULL, vsuffix VARCHAR(64) NOT NULL, vuserlimit TINYINT NOT NULL, vbitrate INT NOT NULL, tcategory VARCHAR(64) NOT NULL, tprefix VARCHAR(64) NOT NULL, tinfix VARCHAR(64) NOT NULL, tsuffix VARCHAR(64) NOT NULL, tnsfw TINYINT NOT NULL, ttopic TINYTEXT NOT NULL, UNIQUE config (configid)) ENGINE = InnoDB;`,
    (error, result) => {
      if (error) console.error(error);
    }
  );
  // Create control roles table which includes all guild roles that can configure the bot:
  sql.query(
    `CREATE TABLE IF NOT EXISTS controlroles (guildid VARCHAR(64) NOT NULL, roleid VARCHAR(64) NOT NULL, UNIQUE controlrole (guildid, roleid)) ENGINE = InnoDB;`,
    (error, result) => {
      if (error) console.error(error);
    }
  );
});

client.on("guildCreate", (guild) => {
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

client.on("guildDelete", (guild) => {
  // Update bot activity status:
  updateStatus();
  // Delete the row coresponding to the guild the bot just left:
  sql.query(`DELETE FROM guilds WHERE guilds.guildid = '${guild.id}'`, (error, result) => {
    if (error) console.error(error);
  });
});

function updateStatus() {
  // Set the activity status of the bot to the amount of guilds the bot watches:
  let guildcount = Object.keys(client.guilds).length;
  client.user
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

client.login(credentials.discordtoken);
