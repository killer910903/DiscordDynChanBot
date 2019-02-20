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
				if (
					botPrefix == prefix ||
					(dcg.data.customBotPrefix == prefix &&
						dcg.data.customBotPrefix != false)
				) {
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
				dcg.setup.detail = "voice";
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
					args = args[0];
					reply = `okay the new name will be **${args}**.\n\n`;
					reply += "Now please provide me the id of a voice channel.\n";
					reply += "Example: **422801241983418368**\n";
					reply +=
						"Info: *This voice channel will be used as 'triggerChannel' people need to join in order to create their own dynamic channel(s).*";
					message.reply(reply);
					dcg.getConfiguration(dcg.setup.configID).name = args;
					dcg.saveData();
					dcg.setup.state = "triggerChannel";
					break;
				case "triggerChannel":
					args = args[0];
					c = guild.channels.find(c => c.id == args);
					if (c) {
						if (c.type === "voice") {
							reply = `okay the triggerChannel will be **${c.name}**.\n`;
							reply +=
								"Now please provide me a space-seperated list of ids of roles.\n";
							reply += "Example: **494564331552374814 399235851894259732**\n";
							reply +=
								"Info: *Only members of at least one of these roles will be able to create their dynamic channel(s).*";
							message.reply(reply);
							dcg.getConfiguration(dcg.setup.configID).triggerChannel = args;
							dcg.saveData();
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
					reply = "okay this is the result:\n";
					roles = {
						enabled: [],
						disabled: [],
						error: []
					};
					args.forEach(role => {
						r = guild.roles.find(r => r.id == role);
						if (r || dcg.hasTriggerRole(role)) {
							let rc = dcg.toggleTriggerRole(r.id);
							if (rc) roles.enabled.push(r.id);
							else roles.disabled.push(r.id);
						} else roles.error.push(role);
					});
					if (roles.enabled.length != 0) {
						reply += `\nEnabled roles:\n`;
						roles.enabled.forEach(r => {
							reply += `	**${r}**\n`;
						});
					}
					if (roles.disabled.length != 0) {
						reply += `\nDisabled roles:\n`;
						roles.disabled.forEach(r => {
							reply += `	**${r}**\n`;
						});
					}
					if (roles.error.length != 0) {
						reply += `\nRoles not found:\n`;
						roles.error.forEach(r => {
							reply += `	**${r}**\n`;
						});
						reply += `You can use **${botPrefix} showRoles** to view all roles and their ids.\n`;
					}
					if (
						roles.enabled.length == 0 &&
						dcg.data.configurations.find(c => c.id == dcg.setup.configID)
							.triggerRoles.length == 0
					)
						reply +=
							"You did not provide any valid triggerRole and there is none set yet. Please try again.";
					else {
						dcg.setup.state = "createTextChannel";
						reply += `Now please tell me if you want to create a dynamic **text** channel for each dynamic voice channel.\n`;
						reply += "Example: **Yes**\n";
						reply +=
							"Info: The temporary text channel is useful if you want people to have their private disposable chat.";
					}
					message.reply(reply);
					break;
				case "createTextChannel":
					args = args[0];
					val = false;
					if (args.toLowerCase() == "yes") {
						val = true;
					} else if (args.toLowerCase() == "no") {
						val = false;
					}
					if (args.toLowerCase() == "yes" || args.toLowerCase() == "no") {
						// dcg.changeBool(dcg.setup.configID, "createTextChannel", val);
						dcg.getConfiguration(dcg.setup.configID).createTextChannel = val;
						dcg.saveData();
						dcg.setup.state = "category";
						reply = `okay **createTextChannel** has been set to **${val}**.\n`;
						reply += "Now lets configure the dynamic **voice** channels.\n";
						reply +=
							"Please provide the id of a **category** in which the channels should be created.\n";
						reply += "Example: **547746501590253583**\n";
						reply +=
							"Info: *You can also use **No** if you do not want the voice channels to be placed in a category.*";
						message.reply(reply);
					} else
						message.reply(
							"sorry you need to answer with either **Yes** or **No**."
						);
					break;
				case "category":
					args = args[0];
					detail = dcg.setup.detail;
					c = guild.channels.find(c => c.id == args);
					valid = false;
					if (c) {
						if (c.type == "category") {
							valid = true;
							dcg.getConfiguration(dcg.setup.configID)[detail].category = args;
							reply = `okay new ${detail} channels will be placed in **${
								c.name
							}**.\n`;
						} else
							message.reply(
								`sorry the provided id leads to a **${
									c.type
								}** channel but you need to provide the id of a **category** channel.`
							);
					} else if (args.toLowerCase() == "no") {
						valid = true;
						dcg.getConfiguration(dcg.setup.configID)[detail].category = null;
						reply = `okay new ${detail} channels will not be placed in any category.\n`;
					} else
						message.reply(`sorry there is no channel with the id **${args}**.`);
					if (valid) {
						reply += `Now please send me the **prefix** of the name of the new **${detail}** channels.\n`;
						reply += `Example: **[${detail.toUpperCase()}]**\n`;
						reply += `Info: *You can also use **No** if you do not want the ${detail} channels to have a prefix in the name.*`;
						dcg.saveData();
						dcg.setup.state = "prefix";
						message.reply(reply);
					}
					break;
				case "prefix":
					args = args.join("");
					detail = dcg.setup.detail;
					reply = "";
					if (args.toLowerCase() != "no") {
						dcg.getConfiguration(dcg.setup.configID)[detail].prefix = args;
						reply += `Okay the prefix will be **${args}**.\n`;
					} else {
						dcg.getConfiguration(dcg.setup.configID)[detail].prefix = null;
						reply += "Okay there will be no prefix.\n";
					}
					dcg.saveData();
					reply += `Now please send me the **suffix** of the name of the new **${detail}** channels.\n`;
					reply += "Example: **[Gaming]**\n";
					reply += `Info: *You can also use **No** if you do not want the ${detail} channels to have a suffix in the name.*`;
					dcg.setup.state = "suffix";
					message.reply(reply);
					break;
				case "suffix":
					args = args.join("");
					detail = dcg.setup.detail;
					reply = "";
					if (args.toLowerCase() != "no") {
						dcg.getConfiguration(dcg.setup.configID)[detail].suffix = args;
						reply += `Okay the suffix will be **${args}**.\n`;
					} else {
						dcg.getConfiguration(dcg.setup.configID)[detail].suffix = null;
						reply += "Okay there will be no suffix.\n";
					}
					dcg.saveData();
					reply += `Now please tell me what kind of name the **${detail}** channels should have.\n`;
					reply += "This are the available options:\n";
					reply += "**1**: Unique random ID.\n";
					reply += "**2**: Incrementing number.\n";
					reply += "**3**: Username of the owner.\n";
					reply += "**4**: Nickname of the owner.\n";
					reply += "**Text**: Custom name.\n";
					reply += "Example: **Dynamic Channel**\n";
					reply += "Info: *Answer with either 1-4 or with a custom text.*";
					dcg.setup.state = "channelname";
					message.reply(reply);
					break;
				case "channelname":
					args = args.join("");
					detail = dcg.setup.detail;
					let t = {
						"1": "a unique ID",
						"2": "an incrementing number",
						"3": "the username of the owner",
						"4": "the nickname of the owner"
					}[args];
					reply = "";
					if (args == "1" || args == "2" || args == "3" || args == "4") {
						dcg.getConfiguration(dcg.setup.configID)[detail].name = parseInt(
							args
						);
						reply += `okay the name will be ${t}.\n`;
					} else {
						dcg.getConfiguration(dcg.setup.configID)[detail].name = args;
						reply += `okay the name will be **${args}**.\n`;
					}
					dcg.saveData();
					if (detail == "voice") {
						reply += "Now please tell me the userlimit of the voice channel.\n";
						reply += "You can use the numbers from 0-99.\n";
						reply += "Example: **4**\n";
						reply += "Info: *If you want to disable the userlimit use **0**.*";
						dcg.setup.state = "userlimit";
					} else {
						// TODO: Text for nsfw.
						dcg.setup.state = "nsfw";
					}
					message.reply(reply);
					break;
				case "userlimit":
					// TODO: ~
					break;
				case "bitrate":
					// TODO: Set dcg.setup.detail to text and -state to category only if createTextChannel is true - otherwise set -state to null.
					break;
				case "nsfw":
					// TODO: ~
					break;
				case "permissions":
					// TODO: ~
					// TODO: Set dcg.setup.state to null.
					break;
				default:
					reply = "okay let us begin with the name of the configuration.\n";
					reply += "What should be the name?\n";
					reply += "Example: **Nice Configuration**\n";
					reply +=
						"Info: *The purpose of the name is for you to recognize the configuration.*";
					message.reply(reply);
					dcg.setup.state = "name";
					dcg.setup.state = "createTextChannel";
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
	dcg.setup.detail = "voice";
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
			reply += `triggerRoles:\n`;
			c.triggerRoles.forEach(r => {
				reply += `	${r}\n`;
			});
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
