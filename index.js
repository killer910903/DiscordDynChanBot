// jshint esversion: 9
if (process.platform != "win32") process.chdir("/home/zlyfer/DiscordBots/DiscordDynChanBot");
const uniqid = require("uniqid");
const Discord = require("discord.js");
const client = new Discord.Client();
const mysql = require("mysql");
const credentials = require("./credentials.json");
const botPrefix = "--test";
const sql = mysql.createConnection({
  host: credentials.sql.host,
  user: credentials.sql.user,
  password: credentials.sql.password,
  database: credentials.sql.database,
});

client.on("ready", () => {
  updateStatus();
  sql.query(
    `CREATE TABLE IF NOT EXISTS guilds (guildid VARCHAR(64) NOT NULL, secret VARCHAR(64) NOT NULL, UNIQUE ID (guildid))`
  );
});

client.on("guildCreate", (guild) => {
  updateStatus();
  sql.query(
    `INSERT INTO guilds (guildid, secret) VALUES ('${
      guild.id
    }', '${uniqid()}') ON DUPLICATE KEY UPDATE secret = '${uniqid()}'`,
    (error, result) => {
      if (error) console.error(error);
    }
  );
});

client.on("guildDelete", (guild) => {
  updateStatus();
  sql.query(`DELETE FROM guilds WHERE guilds.guildid = '${guild.id}'`, (error, result) => {
    if (error) console.error(error);
  });
});

function updateStatus() {
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
