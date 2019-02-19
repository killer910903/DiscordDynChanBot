/* jshint esversion: 6 */
// process.chdir('/home/zlyfer/DiscordBots/DiscordDynChanBot');
const Discord = require("discord.js");
const client = new Discord.Client();

const botPrefix = "~zltz~";
const token = require("./token.json");
const DynChanGuild = require("./DynChanGuild.js");
const commandList = [
	{
		command: "help",
		shortcut: "?",
		argument: "none",
		description: "Provides the list of commands.",
		function: help
	},
	{
		command: "toggle",
		shortcut: "tg",
		argument: "on/off",
		description: "Enable/Disable the bot. Toggle if no argument is provided.",
		function: toggle
	},
	{
		command: "customPrefix",
		shortcut: "cp",
		argument: "text",
		description: "Set a custom prefix. Turn off when no argument is provided.",
		function: customPrefix
	},
	{
		command: "newConfig",
		shortcut: "nc",
		argument: "none",
		description: "Setup a new configuration.",
		function: newConfig
	},
	{
		command: "delConfig",
		shortcut: "dc",
		argument: "id",
		description: "Delete a configuration.",
		function: delConfig
	},
	{
		command: "changeConfig",
		shortcut: "cc",
		argument: "id",
		description: "Change a configuration.",
		function: changeConfig
	},
	{
		command: "cancelSetup",
		shortcut: "cs",
		argument: "none",
		description: "Cancel a configuration setup.",
		function: cancelSetup
	},
	{
		command: "controlRoles",
		shortcut: "cr",
		argument: "id",
		description: "Toggle role the bot listens to. Use the id of the role.",
		function: controlRoles
	},
	{
		command: "showSettings",
		shortcut: "ss",
		argument: "none",
		description: "Show all settings.",
		function: showSettings
	},
	{
		command: "showConfig",
		shortcut: "sc",
		argument: "none",
		description: "Show all configurations.",
		function: showConfig
	},
	{
		command: "showRoles",
		shortcut: "sr",
		argument: "none",
		description: "Show all roles on this server.",
		function: showRoles
	}
];

var DynChanGuilds = {};

client.on("ready", () => {
	client.user
		.setPresence({
			status: "online",
			afk: false,
			game: {
				name: `Use ${botPrefix} help for help!`
			}
		})
		.then(result => console.log("Bot ready, presence set:\n", result))
		.catch(error => console.error("Failed to set bot presence:\n", error));

	client.guilds.forEach(guild => {
		DynChanGuilds[guild.id] = new DynChanGuild(guild.id);
	});
});

client.on("guildCreate", guild => {});

client.on("channelUpdate", (oldChannel, newChannel) => {});

client.on("voiceStateUpdate", (oldMember, newMember) => {});

client.on("channelCreate", channel => {});

client.on("message", message => {
	if (!message.author.bot) {
		if (message.channel.type == "text") {
			let messageContent = message.content.split(" ");
			let prefix = messageContent[0];
			let cmd = messageContent[1] || undefined;
			let args = messageContent[2] || undefined;
			let guild = message.guild;
			let dcg = DynChanGuilds[guild.id];
			if (dcg) {
				if (botPrefix == prefix || dcg.data.customBotPrefix == prefix) {
					if (
						message.author.id == guild.ownerID ||
						hasRole(guild, message.member)
					) {
						if (cmd) {
							let valid = false;
							commandList.forEach(c => {
								if (c.command == cmd || c.shortcut == cmd) {
									if (c.function) {
										c.function(message, args);
										valid = true;
									}
								}
							});
							if (!valid)
								message.reply(
									`sorry I didn't understand that. Use **${botPrefix} help** for help.`
								);
						} else help(message, null);
					} else {
						message.reply(
							"sorry you seem to lack of rights to control me on this Discord server!\nPlease contact the server owner to solve this problem."
						);
					}
				} else if (dcg.setup.state != null) {
					changeConfig(message, messageContent);
				}
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

function help(message, args) {
	let header = "help is on the way:\n";
	header += "Make sure to use **" + botPrefix + "** as prefix!\n\n";
	let reply =
		"The format is:\n**COMMAND** **SHORTCUT** __ARGUMENT__\n*DESCRIPTION*\n";
	commandList.forEach(c => {
		reply += `
**${c.command}** **${c.shortcut}** __${c.argument}__
*${c.description}*\n`;
	});
	reply +=
		"\nINFO: If you encounter any issues or have questions, feel free to contact me.";
	message.reply(header + reply);
}
function toggle(message, args) {
	let guild = message.guild;
	if (args == "on" || args == "off") {
		DynChanGuilds[guild.id].toggle(args);
	} else {
		DynChanGuilds[guild.id].toggle();
	}
	message.reply(
		`I have been turned **${DynChanGuilds[guild.id].data.toggle}**.`
	);
}
function customPrefix(message, args) {
	let guild = message.guild;
	DynChanGuilds[guild.id].setCustomPrefix(args);
}
function newConfig(message, args) {
	let guild = message.guild;
	let id = DynChanGuilds[guild.id].newConfiguration();
	let reply = "a new configuration has been added.\n";
	reply += `Use **${botPrefix} changeConfig ${id}** to setup the new configuration.`;
	message.reply(reply);
}
function delConfig(message, args) {
	let guild = message.guild;
	if (args) {
		let c = DynChanGuilds[guild.id].delConfiguration(args);
		if (c) message.reply(`the configuration **${c}** has been deleted.`);
		else
			message.reply(
				`sorry I could not find a configuration with the id **${args}**.`
			);
	} else
		message.reply(
			`sorry you need to provide an id. Use **${botPrefix} showConfig** to view all existing configurations.`
		);
}
function changeConfig(message, args = null) {
	let guild = message.guild;
	let dcg = DynChanGuilds[guild.id];
	let valid = false;
	if (args || dcg.setup.state != null) {
		dcg.data.configurations.forEach(c => {
			if (c.id == args) {
				dcg.setup.configID = c.id;
				dcg.setup.configName = c.name;
				dcg.setup.user = message.author;
				valid = true;
			}
		});
	} else if (dcg.setup.state != null) {
		message.reply(
			`sorry you need to provide a configuration id. Use **${botPrefix} showConfig** to view all configurations.`
		);
		return;
	}
	if (dcg.setup.state != null) valid = true;
	if (valid) {
		console.log("Setup State: " + dcg.setup.state);
		if (message.author == dcg.setup.user)
			switch (dcg.setup.state) {
				case "name":
					reply = `okay the new name will be **${args}**.\n\n`;
					reply += "Now please provive me the id of a voice channel.\n";
					reply += "Example: **422801241983418368**\n";
					reply +=
						"Info: *This voice channel will be used as 'triggerChannel' people need to join in order to create their own dynamic channel(s).*";
					message.reply(reply);
					dcg.getConfiguration(dcg.setup.configID).name = args;
					dcg.setup.state = "triggerChannel";
					break;
				case "triggerChannel":
					c = guild.channels.find(c => c.id == args);
					if (c) {
						if (c.type === "voice") {
							reply = `okay the triggerChannel will be **${c.name}**.\n`;
							reply +=
								"Now please provide me a comma-seperated list of ids of roles.";
							reply += "Example: **494564331552374814, 399235851894259732**\n";
							reply +=
								"Info: *Only members of at least one of these roles will be able to trigger create their dynamic channel(s).*";
							message.reply(reply);
							dcg.getConfiguration(dcg.setup.configID).triggerChannel = args;
							dcg.setup.state = "triggerRoles";
						} else
							message.reply(
								`sorry the provided id leads to a **${
									c.type
								}** channel but you need to provide the id of a **voice** channel.`
							);
					} else
						message.reply(`sorry there is no channel with the id **${args}**.`);
					break;
				case "triggerRoles":
					// TODO: Continue.
					break;
				default:
					reply = "okay let us begin with the name of the configuration.\n";
					reply += "What should be the name?\n";
					reply += "Example: **Nice Configuration**\n";
					reply += "Info: *This name is used to recognize the configuration.*";
					message.reply(reply);
					dcg.setup.state = "name";
					break;
			}
		else
			message.reply(
				"sorry there is another using currently setting up a configuration. Please wait until the current setup is over."
			);
	} else
		message.reply(
			`sorry I could not find a configuration with the id **${args}**.`
		);
}
function cancelSetup(message, args) {
	let guild = message.guild;
	let dcg = DynChanGuilds[guild.id];
	if (dcg.setup.state) {
		message.reply(
			`the current setup of **${dcg.setup.configName}** has been canceled.`
		);
	} else {
		message.reply(
			"sorry there didn't seem to be a running setup. I canceled everything anyways, just to be sure."
		);
	}
	dcg.setup.configID = null;
	dcg.setup.configName = null;
	dcg.setup.state = null;
	dcg.setup.user = null;
}
function controlRoles(message, args) {
	let guild = message.guild;
	if (args) {
		let role = guild.roles.find(role => role.id == args);
		if (role) {
			if (DynChanGuilds[guild.id].setControlRoles(args))
				message.reply(`bot control for **${role.name}** has been **enabled**.`);
			else
				message.reply(
					`bot control for **${role.name}** has been **disabled**.`
				);
		} else message.reply(`could not find role ${args}.`);
	} else
		message.reply(
			`sorry you need to provide an id. Use **${botPrefix} showRoles** to view all existing roles on this server,.`
		);
}
function showSettings(message, args) {
	let guild = message.guild;
	let reply = "this is a list of all settings:\n\n";
	reply += `Bot state: **${DynChanGuilds[guild.id].data.toggle}**\n`;
	reply += `Custom prefix: **${
		DynChanGuilds[guild.id].data.customBotPrefix
	}**\n`;
	reply += `Amount of configurations: **${
		DynChanGuilds[guild.id].data.configurations.length
	}**\n`;
	reply += `Control Roles:\n`;
	DynChanGuilds[guild.id].data.controlRoles.forEach(cr => {
		reply += `	**${cr}**\n`;
	});
	message.reply(reply);
}
function showConfig(message, args) {
	let guild = message.guild;
	if (DynChanGuilds[guild.id].data.configurations.length > 0) {
		message.reply("I will send each configuration in a single message below:");
		DynChanGuilds[guild.id].data.configurations.forEach(c => {
			let reply = "\n";
			reply += `name: **${c.name}**\n`;
			reply += `id: **${c.id}**\n`;
			reply += `triggerChannel: **${c.triggerChannel}**\n`;
			reply += `triggerRoles: **${c.triggerRoles}**\n`;
			reply += `preventNameChange: **${c.preventNameChange}**\n`;
			reply += `createTextChannel: **${c.createTextChannel}**\n`;
			reply += `voice:\n`;
			reply += `	category: **${c.voice.category}**\n`;
			reply += `	prefix: **${c.voice.prefix}**\n`;
			reply += `	suffix: **${c.voice.suffix}**\n`;
			reply += `	name: **${c.voice.name}**\n`;
			reply += `	permissions:\n`;
			c.voice.permissions.forEach(p => {
				reply += `		roles:\n`;
				p.roles.forEach(e => {
					reply += `			**${e}**\n`;
				});
				reply += `		allow:\n`;
				p.allow.forEach(e => {
					reply += `			**${e}**\n`;
				});
				reply += `		deny:\n`;
				p.deny.forEach(e => {
					reply += `			**${e}**\n`;
				});
			});
			reply += `	userlimit: **${c.voice.userlimit}**\n`;
			reply += `	bitrate: **${c.voice.bitrate}**\n`;
			reply += `text:\n`;
			reply += `	category: **${c.text.category}**\n`;
			reply += `	prefix: **${c.text.prefix}**\n`;
			reply += `	suffix: **${c.text.suffix}**\n`;
			reply += `	name: **${c.text.name}**\n`;
			reply += `	permissions:\n`;
			c.text.permissions.forEach(p => {
				reply += `		roles:\n`;
				p.roles.forEach(e => {
					reply += `			**${e}**\n`;
				});
				reply += `		allow:\n`;
				p.allow.forEach(e => {
					reply += `			**${e}**\n`;
				});
				reply += `		deny:\n`;
				p.deny.forEach(e => {
					reply += `			**${e}**\n`;
				});
			});
			reply += `	nsfw: **${c.text.nsfw}**`;
			message.reply(reply);
		});
	} else
		message.reply(
			`there are now existing configurations set yet. Use **${botPrefix} newConfig** to create a new configuration.`
		);
}
function showRoles(message, args) {
	let guild = message.guild;
	let reply = "this is the list of all roles and their ids on this server:\n\n";
	guild.roles.array().forEach(role => {
		let controlRoles = DynChanGuilds[guild.id].data.controlRoles;
		let activated = controlRoles.includes(role.id) ? "Yes" : "No";
		reply += `Name: **${role.name}**\nID: **${
			role.id
		}**\nControl Role: **${activated}**\n\n`;
	});
	message.reply(reply);
}

function hasRole(guild, member) {
	let dcg = DynChanGuilds[guild.id];
	if (dcg) {
		if (dcg.data.controlRoles.includes("@everyone")) {
			return true;
		}
		for (let i = 0; i < member.roles.array().length; i++) {
			let role = member.roles.array()[i];
			if (dcg.data.controlRoles.includes(role.id)) {
				return true;
			}
		}
	}
	return false;
}

process.on("unhandledRejection", err => {
	console.error(err);
});

client.login(token.token);
