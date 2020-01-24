/* jshint esversion: 6 */
// process.chdir("/home/zlyfer/DiscordBots/DiscordDynChanBot-Rewrite");

// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! //
// !!!!!!!!!!!!! FIXME: lockPermissions -> Waiting for discord.js fix !!!!!!!!!!!!!! //
// !Beware custom change of: https://github.com/discordjs/discord.js/pull/2800/files //
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! //
// TODO: Check if the bot has permissions to perform an action, before attempting to!
// TODO: Do all todos!
// TODO: 1-Time message to all guild owners that the bot has been updated.
// TODO: Welcome message to creator & info/help.
// FIXME: Owner changes upon mute/unmute/join/leave.
// FIXME: If owner changes permissions get cleared.
// FIXME:!! Setup: bitrate -> permissions: Duplicate message! // Doesn't matter due to web interface.
// FIXME: Duplicate ID for configurations when creating a new one. // Maybe Fixed!

const Discord = require("discord.js");
const client = new Discord.Client();
const ShortUniqueId = require("short-unique-id");
const RomanNumerals = require("roman-numeral");
var uid = new ShortUniqueId();

var DynChanGuilds = {};
const botPrefix = "~zltz~";
const token = require("./token.json");
const DynChanChannel = require("./DynChanChannel.js");
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
		shortcut: "t",
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
		argument: "configuration id",
		description: "Delete a configuration.",
		function: delConfig
	},
	{
		command: "toggleConfig",
		shortcut: "tc",
		argument: "configuration id",
		description: "Toggle a configuration.",
		function: toggleConfig
	},
	{
		command: "changeConfig",
		shortcut: "cc",
		argument: "configuration id",
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
		argument: "id/role mention",
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
	},
	{
		command: "showPermissions",
		shortcut: "sp",
		argument: "none",
		description: "Show all Discord permissions that are applicable to channels.",
		function: showPermissions
	}
];
const permissionList = {
	CREATE_INSTANT_INVITE: "Invite other people to the Discord server.",
	MANAGE_WEBHOOKS: "Create a webhook.",
	VIEW_CHANNEL: "View the channel.",
	CONNECT: "Connect to the voice channel.",
	SPEAK: "Speak inside the voice channel.",
	MUTE_MEMBERS: "Mute other members of the voice channel.",
	DEAFEN_MEMBERS: "Deafen other members of the voice channel.",
	MOVE_MEMBERS: "Move members to other voice channel.",
	USE_VAD: "Use voice activity detection.",
	PRIORITY_SPEAKER: "Lowers volume of other members when speaking.",
	SEND_MESSAGES: "Send messages to the text channel.",
	SEND_TTS_MESSAGES: "Send text-to-speech messages to the text channel.",
	MANAGE_MESSAGES: "Delete messages and reactions in the text channel.",
	MANAGE_CHANNELS: "Edit the channel (e.g. userlimit or bitrate).",
	EMBED_LINKS: "Embed link to the text channel.",
	ATTACH_FILES: "Attach files to the text channel.",
	READ_MESSAGE_HISTORY: "Read the message history of the text channel.",
	MENTION_EVERYONE: "Mention everyone in the text channel.",
	ADD_REACTIONS: "Add reactions to messages in the text channel."
};

client.on("ready", () => {
	client.user
		.setPresence({
			status: "online",
			afk: false,
			game: {
				name: `Use ${botPrefix} help for help!`,
				type: "WATCHING"
			}
		})
		.then(result => console.log("Bot ready, presence set:\n", result))
		.catch(error => console.error("Failed to set bot presence:\n", error));

	client.guilds.forEach(guild => {
		DynChanGuilds[guild.id] = new DynChanGuild(guild.id);
	});
});

client.on("guildCreate", guild => {
	DynChanGuilds[guild.id] = new DynChanGuild(guild.id);
	DynChanGuilds[guild.id].saveData();
});

client.on("voiceStateUpdate", (oldMember, newMember) => {
	// !! if (oMember.voiceChannel && (nMember.voiceChannel == undefined || nMember.voiceChannel != oMember.voiceChannel)) {
	// !! 	console.log("left");
	// !! }
	// !! if (nMember.voiceChannel && (oMember.voiceChannel == undefined || oMember.voiceChannel != nMember.voiceChannel)) {
	// !! 	console.log("joined");
	// !! }
	// Delete/Modify DynChan upon leaving such.
	if (oldMember.voiceChannelID) {
		let guild = oldMember.guild;
		let dcg = DynChanGuilds[guild.id];
		let configurationID = Object.keys(dcg.channels).find(cID => dcg.channels[cID].find(dcc => dcc.voiceChannel == oldMember.voiceChannelID));
		if (dcg.data.toggle == "on") {
			if (configurationID) {
				let configuration = dcg.data.configurations.find(c => c.id == configurationID);
				if (configuration) {
					let textchannel = null;
					if (configuration.createTextChannel) {
						let textchannelID = dcg.channels[configurationID].find(c => c.voiceChannel == oldMember.voiceChannelID).textChannel;
						textchannel = guild.channels.find(c => c.id == textchannelID);
					}
					let member = guild.members.find(m => m.voiceChannelID == oldMember.voiceChannelID);
					if (member) {
						let dcc = dcg.channels[configuration.id].find(c => c.voiceChannel == oldMember.voiceChannelID);
						if (dcc) dcc.owner = member.user.id;
						if (textchannel) {
							if (configuration.isolate) {
								let everyone = guild.roles.find(r => r.name == "@everyone");
								if (everyone)
									textchannel.overwritePermissions(everyone, {
										VIEW_CHANNEL: false
									});
							}
							let omp = {};
							configuration.permissions.forEach(p => {
								omp[p] = null;
							});
							let mp = {};
							configuration.permissions.forEach(p => {
								mp[p] = true;
							});
							if (configuration.isolate) omp["VIEW_CHANNEL"] = false;
							textchannel.overwritePermissions(oldMember.user, omp);
							textchannel.overwritePermissions(member.user, mp);
							textchannel.edit({
								name: genName(dcg, configuration.text, configuration.id, member)
							});
						}
						oldMember.voiceChannel.replacePermissionOverwrites({
							overwrites: [
								{
									id: oldMember.user.id,
									allowed: []
								},
								{
									id: member.user.id,
									allowed: configuration.permissions
								}
							]
						});
						oldMember.voiceChannel.edit({
							name: genName(dcg, configuration.voice, configuration.id, member)
						});
					} else {
						if (textchannel) textchannel.delete();
						oldMember.voiceChannel.delete().then(r => {
							let t = dcg.channels[configuration.id].find(c => c.voiceChannel == oldMember.voiceChannelID);
							let index = dcg.channels[configuration.id].indexOf(t);
							dcg.channels[configuration.id].splice(index, 1);
						});
					}
				}
			}
		}
	}
	// Create channel upon joining a triggerChannel.
	guild = newMember.guild;
	dcg = DynChanGuilds[guild.id];
	configuration = dcg.data.configurations.find(c => c.triggerChannel == newMember.voiceChannelID);
	if (dcg.data.toggle == "on") {
		if (configuration) {
			setTimeout(
				function() {
					if (configuration) {
						if (configuration.valid && configuration.active) {
							if (newMember.roles.find(r => configuration.triggerRoles.includes(r.id))) {
								if (dcg.channels[configuration.id] < configuration.limit || configuration.limit == 0) {
									let dcc = new DynChanChannel(newMember.user.id);
									dcg.channels[configuration.id].push(dcc);
									let cname = genName(dcg, configuration.voice, configuration.id, newMember);
									let overwrites = [];
									let tmpp = { id: newMember.user.id, permission: {} };
									configuration.permissions.forEach(p => {
										tmpp.permission[p] = true;
									});
									overwrites.push(tmpp);
									guild.createChannel(cname, { type: "voice" }).then(voicechannel => {
										if (voiceChannel) {
											dcc.voiceChannel = voicechannel.id;
											voicechannel
												.edit({
													parent: configuration.voice.category,
													userLimit: configuration.voice.userlimit,
													bitrate: configuration.voice.bitrate
												})
												.then(voicechannel => {
													voicechannel.lockPermissions().then(voicechannel => {
														overwrites.forEach(o => {
															voicechannel.overwritePermissions(o.id, o.permission);
														});
													}); // Waiting for lockPermissions fix.
													newMember.edit({ channel: voicechannel });
												});
											if (configuration.createTextChannel) {
												cname = genName(dcg, configuration.text, configuration.id, newMember);
												let overwrites = [];
												if (configuration.isolate) {
													let everyone = guild.roles.find(r => r.name == "@everyone");
													if (everyone) {
														overwrites.push({
															id: everyone,
															permission: { VIEW_CHANNEL: false }
														});
													}
												}
												let tmpp = { id: newMember.user.id, permission: {} };
												configuration.permissions.forEach(p => {
													tmpp.permission[p] = true;
												});
												overwrites.push(tmpp);
												guild.createChannel(cname, "text").then(textchannel => {
													dcc.textChannel = textchannel.id;
													textchannel
														.edit({
															topic: configuration.text.topic ? configuration.text.topic : "",
															parent: configuration.text.category,
															nsfw: configuration.text.nsfw
														})
														.then(textchannel => {
															textchannel.lockPermissions().then(textchannel => {
																// Waiting for lockPermissions fix.
																overwrites.forEach(o => {
																	textchannel.overwritePermissions(o.id, o.permission);
																});
															});
														});
												});
											}
										}
									});
								}
							}
						}
					}
				},
				configuration.delay * 1000,
				configuration,
				oldMember,
				newMember
			);
		} else {
			let isDynChan = false;
			for (let key in dcg.channels) {
				let channels = dcg.channels[key];
				let dcc = channels.find(c => c.voiceChannel == newMember.voiceChannelID);
				let configuration = dcg.data.configurations.find(c => c.id == key);
				if (dcc && configuration) {
					if (configuration.isolate) {
						let textchannel = guild.channels.find(c => c.id == dcc.textChannel);
						if (textchannel) textchannel.overwritePermissions(newMember.user, { VIEW_CHANNEL: true });
					}
				}
			}
		}
	}
});

client.on("message", message => {
	// lockPermissions Test: Waiting for discord.js 11.4.3? (-dev)
	// message.guild.createChannel('test', 'text').then(tc => {
	// 	tc.setParent(message.guild.channels.find(c => c.id == "562405191698350100")).then(t => {
	// 		t.lockPermissions();
	// 	});
	// })
	if (!message.author.bot) {
		if (message.channel.type == "text") {
			let messageContent = message.content.split(" ");
			let prefix = messageContent[0];
			let cmd = messageContent[1] || undefined;
			let args = messageContent[2] || undefined;
			let guild = message.guild;
			let dcg = DynChanGuilds[guild.id];
			if (dcg) {
				if (botPrefix == prefix || (dcg.data.customBotPrefix == prefix && dcg.data.customBotPrefix != false)) {
					if (message.author.id == guild.ownerID || hasRole(guild, message.member)) {
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
							if (!valid) message.reply(`sorry I didn't understand that. Use **${botPrefix} help** for help.`);
						} else help(message, null);
					} else {
						message.reply("sorry you seem to lack of rights to control me on this Discord server!\nPlease contact the server owner to solve this problem.");
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
	let reply = "The format is:\n**COMMAND** **SHORTCUT** __ARGUMENT__\n*DESCRIPTION*\n";
	commandList.forEach(c => {
		reply += `
**${c.command}** **${c.shortcut}** __${c.argument}__
*${c.description}*\n`;
	});
	reply +=
		"\nDo not know how to get the IDs of channels? Visit: https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-\n";
	reply += "\nIf you encounter any issues or have questions, feel free to contact me.";
	message.reply(header + reply);
}

function toggle(message, args) {
	let guild = message.guild;
	if (args == "on" || args == "off") {
		DynChanGuilds[guild.id].toggle(args);
	} else {
		DynChanGuilds[guild.id].toggle();
	}
	message.reply(`I have been turned **${DynChanGuilds[guild.id].data.toggle}**.`);
}

function customPrefix(message, args) {
	let guild = message.guild;
	DynChanGuilds[guild.id].setCustomPrefix(args);
	message.reply(`you can now use **${args}** as bot prefix.`);
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
		else message.reply(`sorry I could not find a configuration with the id **${args}**.`);
	} else message.reply(`sorry you need to provide an id. Use **${botPrefix} showConfig** to view all existing configurations.`);
}
function toggleConfig(message, args) {
	// args = args[0];
	let guild = message.guild;
	let dcg = DynChanGuilds[guild.id];
	let c = dcg.data.configurations.find(c => c.id == args);
	if (c) {
		c.active = !c.active;
		dcg.saveData();
		message.reply(`okay the Configuration **${c.name}** has been **${c.active ? "" : "de"}activated**.`);
	} else message.reply(`sorry I could not find a configuration with the id **${args}**.`);
}

function changeConfig(message, args = null) {
	// IDEA: Make every action be skipable when a valid value is already set.
	let guild = message.guild;
	let dcg = DynChanGuilds[guild.id];
	let valid = false;
	if (args || dcg.setup.state != null) {
		dcg.data.configurations.forEach(c => {
			if (c.id == args) {
				dcg.setup.id = c.id;
				dcg.setup.user = message.author;
				dcg.setup.detail = "voice";
				valid = true;
			}
		});
	} else if (dcg.setup.state != null) {
		message.reply(`sorry you need to provide a configuration id. Use **${botPrefix} showConfig** to view all configurations.`);
		return;
	}
	if (dcg.setup.state != null) valid = true;
	if (valid) {
		let t, rc;
		if (message.author == dcg.setup.user)
			switch (dcg.setup.state) {
				case "name":
					args = args.join(" ");
					reply = `okay the new name will be **${args}**.\n\n`;
					reply += CCtriggerChannel(message, args, guild, dcg);
					dcg.getConfiguration(dcg.setup.id).name = args;
					dcg.saveData();
					message.reply(reply);
					break;
				case "triggerChannel":
					args = args[0];
					ec = dcg.data.configurations.find(c => c.triggerChannel == args);
					c = guild.channels.find(c => c.id == args);
					if (c && (!ec || ec.id == dcg.setup.id)) {
						if (c.type === "voice") {
							dcg.getConfiguration(dcg.setup.id).triggerChannel = args;
							dcg.saveData();
							reply = `okay the triggerChannel will be **${c.name}**.\n`;
							reply += CCtriggerRoles(message, args, guild, dcg);
							message.reply(reply);
						} else message.reply(`sorry the provided id leads to a **${c.type}** channel but you need to provide the id of a **voice** channel.`);
					} else if (ec) message.reply(`sorry there is already a configuration that uses this triggerchannel. Please use a different voice channel.`);
					else message.reply(`sorry there is no channel with the id **${args}**.`);
					break;
				case "triggerRoles":
					reply = "okay this is the result:\n";
					roles = {
						enabled: [],
						disabled: [],
						error: []
					};
					args.forEach(role => {
						r = guild.roles.find(r => r == role) || guild.roles.find(r => r.id == role);
						if (r) {
							// || dcg.hasTriggerRole(role)) {
							let rID = r.id || r;
							rc = dcg.toggleTriggerRole(rID);
							if (rc) roles.enabled.push(rID);
							else roles.disabled.push(rID);
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
					if (roles.enabled.length == 0 && dcg.data.configurations.find(c => c.id == dcg.setup.id).triggerRoles.length == 0)
						reply += "You did not provide any valid triggerRole and there is none set yet. Please try again.";
					else {
						reply += CCcreateTextChannel(message, args, guild, dcg);
					}
					message.reply(reply);
					break;
				case "createTextChannel":
					args = args.join("");
					val = false;
					if (args.toLowerCase() == "yes") {
						val = true;
					} else if (args.toLowerCase() == "no") {
						val = false;
					}
					if (args.toLowerCase() == "yes" || args.toLowerCase() == "no") {
						dcg.getConfiguration(dcg.setup.id).createTextChannel = val;
						dcg.saveData();
						reply = `okay **createTextChannel** has been set to **${val}**.\n`;
						reply += CCdelay(message, args, guild, dcg);
						message.reply(reply);
					} else message.reply("sorry you need to answer with either **Yes** or **No**.");
					break;
				case "delay":
					args = args[0];
					n = parseInt(args);
					if (!isNaN(n)) {
						if (n >= 0 && n <= 10) {
							dcg.getConfiguration(dcg.setup.id).delay = n;
							dcg.saveData();
							if (n == 0) reply = "okay there will be **no delay**.\n";
							else reply = `okay the delay will be **${n} second${n == 1 ? "" : "s"}**.\n`;
							reply += CClimit(message, args, guild, dcg);
							message.reply(reply);
						} else message.reply(`sorry **${args}** seems to be out of range. Please send me a number between **0-10**.`);
					} else message.reply(`sorry **${args}** does not seem to be a number. Please send me a number from **0-10**.`);
					break;
				case "limit":
					args = args[0];
					n = parseInt(args);
					if (!isNaN(n)) {
						if (n >= 0 && n <= 50) {
							dcg.getConfiguration(dcg.setup.id).limit = n;
							dcg.saveData();
							if (n == 0) reply = "okay there will be **no limit**.\n";
							else reply = `okay the limit will be **${n}**.\n`;
							if (dcg.getConfiguration(dcg.setup.id).createTextChannel) reply += CCisolate(message, args, guild, dcg);
							else reply += CCcategory(message, args, guild, dcg);
							message.reply(reply);
						} else message.reply(`sorry **${args}** seems to be out of range. Please send me a number between **0-50**.`);
					} else message.reply(`sorry **${args}** does not seem to be a number. Please send me a number from **0-50**.`);
					break;
				case "isolate":
					args = args.join("");
					val = false;
					if (args.toLowerCase() == "yes") {
						val = true;
					} else if (args.toLowerCase() == "no") {
						val = false;
					}
					if (args.toLowerCase() == "yes" || args.toLowerCase() == "no") {
						dcg.getConfiguration(dcg.setup.id).isolate = val;
						dcg.saveData();
						reply = `okay **isolate** has been set to **${val}**.\n`;
						reply += CCcategory(message, args, guild, dcg);
						message.reply(reply);
					} else message.reply("sorry you need to answer with either **Yes** or **No**.");
					break;
				case "category":
					args = args[0];
					detail = dcg.setup.detail;
					c = guild.channels.find(c => c.id == args);
					valid = false;
					if (c) {
						if (c.type == "category") {
							valid = true;
							dcg.getConfiguration(dcg.setup.id)[detail].category = args;
							reply = `okay new ${detail} channels will be placed in **${c.name}**.\n`;
						} else message.reply(`sorry the provided id leads to a **${c.type}** channel but you need to provide the id of a **category** channel.`);
					} else if (args.toLowerCase() == "no") {
						valid = true;
						dcg.getConfiguration(dcg.setup.id)[detail].category = null;
						reply = `okay new ${detail} channels will not be placed in any category.\n`;
					} else message.reply(`sorry there is no channel with the id **${args}**.`);
					if (valid) {
						dcg.saveData();
						reply += CCprefix(message, args, guild, dcg);
						message.reply(reply);
					}
					break;
				case "prefix":
					args = args.join(" ");
					detail = dcg.setup.detail;
					reply = "";
					if (args.toLowerCase() != "no") {
						dcg.getConfiguration(dcg.setup.id)[detail].prefix = args;
						reply += `Okay the prefix will be **${args}**.\n`;
					} else {
						dcg.getConfiguration(dcg.setup.id)[detail].prefix = null;
						reply += "Okay there will be no prefix.\n";
					}
					dcg.saveData();
					reply += CCsuffix(message, args, guild, dcg);
					message.reply(reply);
					break;
				case "suffix":
					args = args.join(" ");
					detail = dcg.setup.detail;
					reply = "";
					if (args.toLowerCase() != "no") {
						dcg.getConfiguration(dcg.setup.id)[detail].suffix = args;
						reply += `Okay the suffix will be **${args}**.\n`;
					} else {
						dcg.getConfiguration(dcg.setup.id)[detail].suffix = null;
						reply += "Okay there will be no suffix.\n";
					}
					dcg.saveData();
					reply += CCchannelname(message, args, guild, dcg);
					message.reply(reply);
					break;
				case "channelname":
					args = args.join(" ");
					detail = dcg.setup.detail;
					t = {
						"1": "a unique ID",
						// "2": "an incrementing number",
						"2": "the username of the owner",
						"3": "the nickname of the owner"
					}[args];
					reply = "";
					if (args == "1" || args == "2" || args == "3") {
						// || args == "4") {
						dcg.getConfiguration(dcg.setup.id)[detail].name = parseInt(args);
						reply += `okay the name will be ${t}.\n`;
					} else {
						dcg.getConfiguration(dcg.setup.id)[detail].name = args;
						reply += `okay the name will be **${args}**.\n`;
					}
					dcg.saveData();
					if (detail == "voice") {
						reply += CCuserlimit(message, args, guild, dcg);
					} else if (detail == "text") {
						reply += CCnsfw(message, args, guild, dcg);
					}
					message.reply(reply);
					break;
				case "userlimit":
					args = args[0];
					n = parseInt(args);
					if (!isNaN(n)) {
						if (n >= 0 && n <= 99) {
							dcg.getConfiguration(dcg.setup.id).voice.userlimit = n;
							dcg.saveData();
							if (n == 0) reply = "okay the voice channels will not be user-limited.\n";
							else reply = `okay the voice channels will be limited by ${n} user${n == 1 ? "" : "s"}.\n`;
							reply += CCbitrate(message, args, guild, dcg);
							message.reply(reply);
						} else message.reply(`sorry **${args}** seems to be out of range. Please send me a number between **0-99**.`);
					} else message.reply(`sorry **${args}** does not seem to be a number. Please send me a number from **0-99**.`);
					break;
				case "bitrate":
					args = args[0];
					n = parseInt(args);
					if (!isNaN(n)) {
						if (n >= 8 && n <= 96) {
							dcg.getConfiguration(dcg.setup.id).voice.bitrate = n * 1000;
							dcg.saveData();
							reply = `okay the bitrate will be **${n}kbps**.\n`;
							if (dcg.getConfiguration(dcg.setup.id).createTextChannel) {
								dcg.setup.detail = "text";
								reply += CCcategory(message, args, guild, dcg);
							} else {
								reply += CCpermissions(message, args, guild, dcg);
								message.reply(reply);
							}
							message.reply(reply);
						} else message.reply(`sorry **${args}** seems to be out of range. Please send me a number between **8-96**.`);
					} else message.reply(`sorry **${args}** does not seem to be a number. Please send me a number from **8-96**.`);
					break;
				case "nsfw":
					args = args[0];
					val = false;
					if (args.toLowerCase() == "yes") {
						val = true;
					} else if (args.toLowerCase() == "no") {
						val = false;
					}
					if (args.toLowerCase() == "yes" || args.toLowerCase() == "no") {
						dcg.getConfiguration(dcg.setup.id).text.nsfw = val;
						dcg.saveData();
						reply = `okay text channels **will ${val ? "" : "not"}** be NSFW.\n`;
						reply += CCtopic(message, args, guild, dcg);
						message.reply(reply);
					} else message.reply("sorry you need to answer with either **Yes** or **No**.");
					break;
				case "topic":
					args = args.join(" ");
					if (args.toLowerCase() == "no") args = false;
					if (args) {
						reply = `Okay the topic of the text channels will be **${args}**.\n`;
					} else {
						reply = `Okay there will be **no topic** for the text channels.\n`;
					}
					dcg.getConfiguration(dcg.setup.id).text.topic = args;
					dcg.saveData();
					reply += CCpermissions(message, args, guild, dcg);
					message.reply(reply);
					break;
				case "permissions":
					reply = "okay this is the result:\n";
					let permissions = {
						enabled: [],
						disabled: [],
						error: []
					};
					args.forEach(p => {
						p = p.toUpperCase();
						if (Object.keys(permissionList).includes(p)) {
							let pc = dcg.togglePermission(p);
							if (pc) permissions.enabled.push(p);
							else permissions.disabled.push(p);
						} else permissions.error.push(p);
					});
					if (permissions.enabled.length != 0) {
						reply += `\nEnabled permissions:\n`;
						permissions.enabled.forEach(p => {
							reply += `	**${p}**\n`;
						});
					}
					if (permissions.disabled.length != 0) {
						reply += `\nDisabled permissions:\n`;
						permissions.disabled.forEach(p => {
							reply += `	**${p}**\n`;
						});
					}
					if (permissions.error.length != 0) {
						reply += `\nPermissions not found:\n`;
						permissions.error.forEach(p => {
							reply += `	**${p}**\n`;
						});
						reply += `You can use **${botPrefix} showPermissions** to view all valid Discord permissions.\n`;
					}
					reply += "\n\n";
					reply += `Congratulations! The setup of **${dcg.data.configurations.find(c => (c.id = dcg.setup.id)).name}** is done!\n`;
					reply += `You can use **${botPrefix} showConfig** to verify your changes.\n`;
					reply += `Feel free to use **${botPrefix} changeConfig ${dcg.setup.id}** again to make changes whenever you like.`;
					dcg.saveData(); // Better safe than sorry.
					message.reply(reply, { split: true });
					dcg.setup.reset();
					break;
				default:
					reply = "okay let us begin with the setup of the configuration.\n";
					reply += CCname(message, args, guild, dcg);
					message.reply(reply);
					break;
			}
		else message.reply("sorry there is another using currently setting up a configuration. Please wait until the current setup is over.");
	} else message.reply(`sorry I could not find a configuration with the id **${args}**.`);
}

function CCname(message, args, guild, dcg) {
	let reply = "What should be the name?\n";
	reply += `Current value: **${dcg.getConfiguration(dcg.setup.id).name}**\n`;
	reply += "Example: **Nice Configuration**\n";
	reply += "Info: *The purpose of the name is for you to recognize the configuration.*";
	dcg.setup.state = "name";
	return reply;
}
function CCtriggerChannel(message, args, guild, dcg) {
	let reply = "Now please provide me the id of a voice channel.\n";
	t = guild.channels.find(c => c.id == dcg.getConfiguration(dcg.setup.id).triggerChannel);
	reply += `Current value: **${t ? t.name : "not found"}** (**${dcg.getConfiguration(dcg.setup.id).triggerChannel}**)\n`;
	reply += "Example: **422801241983418368**\n";
	reply += "Info: *This voice channel will be used as 'triggerChannel' people need to join in order to create their own dynamic channel(s).*";
	dcg.setup.state = "triggerChannel";
	return reply;
}
function CCtriggerRoles(message, args, guild, dcg) {
	let reply = "Now please provide me a space-seperated list of ids of roles.\n";
	reply += "Current value:\n";
	dcg.getConfiguration(dcg.setup.id).triggerRoles.forEach(r => {
		t = guild.roles.find(ro => ro.id == r);
		reply += `	**${t ? t.name : "not found"}** (**${r}**)\n`;
	});
	reply += "Example: **494564331552374814 399235851894259732**\n";
	reply += "Info: *Only members of at least one of these roles will be able to create their dynamic channel(s).*";
	dcg.setup.state = "triggerRoles";
	return reply;
}
function CCcreateTextChannel(message, args, guild, dcg) {
	let reply = `Now please tell me if you want to create a dynamic **text** channel for each dynamic voice channel.\n`;
	reply += `Current value: **${dcg.getConfiguration(dcg.setup.id).createTextChannel ? "Yes" : "No"}**\n`;
	reply += "Example: **Yes**\n";
	reply += "Info: The temporary text channel is useful if you want people to have their private disposable chat.";
	dcg.setup.state = "createTextChannel";
	return reply;
}
function CCdelay(message, args, guild, dcg) {
	let reply = "Now please tell me how many seconds (0-10) it should take before this configuration should trigger:\n";
	reply += `Current value: **${
		dcg.getConfiguration(dcg.setup.id).delay == 0
			? "No delay"
			: dcg.getConfiguration(dcg.setup.id).delay + " second" + (dcg.getConfiguration(dcg.setup.id).delay == 1 ? "" : "s")
	}**\n`;
	reply += "Example: 5\n";
	reply += "Info: 0 = no delay. The delay is useful if you have users with lower priority.";
	dcg.setup.state = "delay";
	return reply;
}
function CClimit(message, args, guild, dcg) {
	reply = "Now please tell me a maximum number of channels that should exist (0-50).\n";
	reply += "Example: 15\n";
	reply += `Current value: **${
		dcg.getConfiguration(dcg.setup.id).limit == 0
			? "No limit"
			: dcg.getConfiguration(dcg.setup.id).limit + " channel" + (dcg.getConfiguration(dcg.setup.id).limit == 1 ? "" : "s")
	}**\n`;
	reply += "Info: 0 = No limit. The limit is useful if you want a specific configuration to have only a few channels.";
	dcg.setup.state = "limit";
	return reply;
}
function CCisolate(message, args, guild, dcg) {
	reply = "Now please tell me whether the text channels should be visible to everyone or just the users inside of the corresponding voice channel.\n";
	reply += "**Yes** = Everyone **No** = Only users inside the voice channel\n";
	reply += `Current: **${
		dcg.getConfiguration(dcg.setup.id).isolate ? "Visible to everyone" : "Visible only to users inside the corresponding voice channel"
	}**\n`;
	reply += "Info: Limiting the visibility only to the users inside of the corresponding voice channel will make your discord server look much cleaner.";
	dcg.setup.state = "isolate";
	return reply;
}
function CCcategory(message, args, guild, dcg) {
	detail = dcg.setup.detail;
	let reply = `Now lets configure the dynamic **${dcg.setup.detail}** channels.\n`;
	reply += `Please provide the id of a **category** in which the **${dcg.setup.detail}** channels should be created.\n`;
	t = guild.channels.find(r => r.id == dcg.getConfiguration(dcg.setup.id)[detail].category);
	reply += `Current value: **${t ? t.name : "Not Found"}** (**${dcg.getConfiguration(dcg.setup.id)[detail].category}**)\n`;
	reply += "Example: **547746501590253583**\n";
	reply += `Info: *You can also use **No** if you do not want the **${dcg.setup.detail}** channels to be placed in a category.*`;
	dcg.setup.state = "category";
	return reply;
}
function CCprefix(message, args, guild, dcg) {
	let reply = `Now please send me the **prefix** of the name of the new **${detail}** channels.\n`;
	reply += `Current value: **${dcg.getConfiguration(dcg.setup.id)[detail].prefix == null ? "No" : dcg.getConfiguration(dcg.setup.id)[detail].prefix}**\n`;
	reply += `Example: **[${detail.toUpperCase()}]**\n`;
	reply += `Info: *You can also use **No** if you do not want the ${detail} channels to have a prefix in the name.*`;
	dcg.setup.state = "prefix";
	return reply;
}
function CCsuffix(message, args, guild, dcg) {
	let reply = `Now please send me the **suffix** of the name of the new **${detail}** channels.\n`;
	reply += `Current value: **${dcg.getConfiguration(dcg.setup.id)[detail].suffix == null ? "No" : dcg.getConfiguration(dcg.setup.id)[detail].suffix}**\n`;
	reply += "Example: **[Friends]**\n";
	reply += `Info: *You can also use **No** if you do not want the ${detail} channels to have a suffix in the name.*`;
	dcg.setup.state = "suffix";
	return reply;
}
function CCchannelname(message, args, guild, dcg) {
	let reply = `Now please tell me what kind of name the **${detail}** channels should have.\n`;
	reply += "This are the available options:\n";
	reply += `**1**: Unique random ID. Example: *${uid.randomUUID(12)}*\n`;
	reply += `**2**: Incrementing number. Example: *6*\n`;
	reply += `**3**: Incrementing number. Example: *VI*\n`;
	reply += `**4**: Username of the owner. Example: *${message.author.username}*\n`;
	reply += `**5**: Nickname of the owner. Example: *${message.member.nickname || `awesome ${message.author.username}`}*\n`;
	reply += "**Text**: Custom name. Example: *Friends*\n";
	reply += `Current value: **${translateName(dcg.getConfiguration(dcg.setup.id)[detail].name)}**\n`;
	reply += "Example: **Dynamic Channel**\n";
	reply += "Info: *Answer with either 1-4 or with a custom text.*";
	dcg.setup.state = "channelname";
	return reply;
}
function CCuserlimit(message, args, guild, dcg) {
	let reply = "Now please tell me the userlimit of the voice channel.\n";
	reply += "You can use the numbers from 0-99.\n";
	reply += `Current value: **${dcg.getConfiguration(dcg.setup.id).voice.userlimit}**\n`;
	reply += "Example: **15**\n";
	reply += "Info: *If you want to disable the userlimit use **0**.*";
	dcg.setup.state = "userlimit";
	return reply;
}
function CCbitrate(message, args, guild, dcg) {
	let reply = "Now please tell me what bitrate the voice channels should have.\n";
	reply += "By default Discord voice channels have a bitrate of 64kbps (or 640000bps) but it can be increased to 96kbps.\n";
	reply += "You can choose a number between 8 and 96.\n";
	reply += `Current value: **${dcg.getConfiguration(dcg.setup.id).voice.bitrate / 1000}**\n`;
	reply += "Example: **70**\n";
	reply +=
		"Info: *The bitrate of a voice channel defines the sound quality the higher the sound, the better the quality. If you are unsure about the bitrate just send me **64** which is the default.*";
	dcg.setup.state = "bitrate";
	return reply;
}
function CCnsfw(message, args, guild, dcg) {
	let reply = "Now please tell me if the text channels should be flagged **NSFW** (Not Safe For Work).\n";
	reply += "Please answer with either **Yes** or **No**.\n";
	reply += `Current value: **${dcg.getConfiguration(dcg.setup.id).text.nsfw ? "Yes" : "No"}**\n`;
	reply += "Example: **Yes**\n";
	reply += "Info *If a text channel is flagged with NSFW users who enter the channel the first time will be prompted to continue joining or leave.*";
	dcg.setup.state = "nsfw";
	return reply;
}
function CCtopic(message, args, guild, dcg) {
	let reply = "Now please tell me the topic of the text channels:\n";
	reply += `Current value: **${dcg.getConfiguration(dcg.setup.id).text.topic}**\n`;
	reply += "Example: **This is a temporary channel. Welcome!**.\n";
	reply += "Info: *You can use **No** to skip this.*";
	dcg.setup.state = "topic";
	return reply;
}
function CCpermissions(message, args, guild, dcg) {
	let reply = "Now let's talk about **permissions**:\n";
	reply += "Please tell me which permissions the creator of a channel should get.";
	reply += "The permissions are then automatically applied to the voice and/or text channels.";
	// reply += "Current value:"; // TODO: List all currently applied permissions.
	reply += "Example: **MUTE_MEMBERS**\n";
	reply += `Info: *Use **${botPrefix} showPermissions** to view all available permissions.*\n`;
	dcg.setup.state = "permissions";
	return reply;
}

function cancelSetup(message, args) {
	let guild = message.guild;
	let dcg = DynChanGuilds[guild.id];
	if (dcg.setup.state) {
		message.reply(`the current setup of **${dcg.data.configurations.find(c => (c.id = dcg.setup.id)).name}** has been canceled.`);
	} else {
		message.reply("sorry there didn't seem to be a running setup. I canceled everything anyways, just to be sure.");
	}
	dcg.setup.reset();
}

function controlRoles(message, args) {
	let guild = message.guild;
	if (args) {
		let role = guild.roles.find(role => role == args) || guild.roles.find(role => role.id == args);
		if (role) {
			let roleID = role.id || role;
			if (DynChanGuilds[guild.id].setControlRoles(roleID || args)) message.reply(`bot control for **${role.name}** has been **enabled**.`);
			else message.reply(`bot control for **${role.name}** has been **disabled**.`);
		} else message.reply(`could not find role ${args}.`);
	} else message.reply(`sorry you need to provide an id. Use **${botPrefix} showRoles** to view all existing roles on this server.`);
}

function showSettings(message, args) {
	let guild = message.guild;
	let rfields = [];
	let t;
	rfields.push({
		name: "**Bot State**",
		value: `*${DynChanGuilds[guild.id].data.toggle.substring(0, 1).toUpperCase()}${DynChanGuilds[guild.id].data.toggle.substring(1)}*`
	});
	rfields.push({
		name: "**Custom Prefix**",
		value: `*${DynChanGuilds[guild.id].data.customBotPrefix ? DynChanGuilds[guild.id].data.customBotPrefix : "No"}*`
	});
	rfields.push({
		name: "**Amount of Configurations**",
		value:
			DynChanGuilds[guild.id].data.configurations.length == 0
				? `*${DynChanGuilds[guild.id].data.configurations.length}*\nUse **${botPrefix} newConfig** to create a configuration.`
				: `*${DynChanGuilds[guild.id].data.configurations.length}*\nUse **${botPrefix} showConfig** to show all configurations.`
	});
	rfields.push({
		name: "**Control Roles**",
		value:
			DynChanGuilds[guild.id].data.controlRoles.length == 0
				? `No control roles are set yet. Use **${botPrefix} controlRoles ROLE_ID** to setup roles that can control this bot.`
				: "Following contains all roles that can control this bot:"
	});
	DynChanGuilds[guild.id].data.controlRoles.forEach(r => {
		t = guild.roles.find(ro => ro.id == r);
		rfields.push({
			name: `**${t ? t.name : "Not Found"}**`,
			value: `**${r}**`,
			inline: true
		});
	});
	let uptime = client.uptime;
	let uptimeS = Math.floor(uptime / 1000);
	let uptimeM = Math.floor(uptimeS / 60);
	let uptimeH = Math.floor(uptimeM / 60);
	uptimeS -= uptimeM * 60;
	uptimeM -= uptimeH * 60;
	uptimeS = uptimeS.toString().length == 1 ? `0${uptimeS}` : uptimeS.toString();
	uptimeM = uptimeM.toString().length == 1 ? `0${uptimeM}` : uptimeM.toString();
	uptimeH = uptimeH.toString().length == 1 ? `0${uptimeH}` : uptimeH.toString();
	let ereply = {
		title: `${client.user.username}`,
		description: `**Uptime:** ${uptimeH}:${uptimeM}:${uptimeS}\n**Discord Server**: ${client.guilds.array().length}`,
		color: DynChanGuilds[guild.id].data.toggle == "on" ? 5025616 : 16771899,
		footer: {
			text: `Use ${botPrefix} help to see all commands. If you encounter any issues or have questions, feel free to contact me.`
		},
		thumbnail: {
			url: "https://cdn.discordapp.com/avatars/352801398385016832/f4993a3a88c98553d3a28637abbd8213.png"
		},
		fields: rfields
	};

	message.channel.send("This is the current configuration of the bot:", {
		embed: ereply
	});
}

function showConfig(message, args) {
	let guild = message.guild;
	let t;
	if (DynChanGuilds[guild.id].data.configurations.length > 0) {
		message.reply("I will send each configuration in a single message below:\n");
		let count = 0;
		DynChanGuilds[guild.id].data.configurations.forEach(c => {
			count++;
			let unset = checkConfig(guild, DynChanGuilds[guild.id], c);
			let tunset = false;
			let uvalid = true;
			for (let key in unset) {
				if (unset[key] != null) uvalid = false;
			}
			if (!uvalid) {
				tunset = "**WARNING**: This configuration is **incomplete** and will **not** be used!\n";
				tunset += "Following value have to be set in order to complete the setup:\n\n";
				for (let key in unset) tunset += `	${key}: *${unset[key]}*\n`;
			}
			let rfields = [];
			rfields.push({
				name: "**id**",
				value: `*${c.id}*`,
				inline: true
			});
			rfields.push({
				name: "**active**",
				value: c.active ? "**Yes**" : "**No**",
				inline: true
			});
			rfields.push({
				name: "**delay**",
				value: `*${c.delay}*`,
				inline: true
			});
			rfields.push({
				name: "**limit**",
				value: `*${c.limit}*`,
				inline: true
			});
			rfields.push({
				name: "**createTextChannel**",
				value: `*${c.createTextChannel ? "Yes" : "No"}*`,
				inline: true
			});
			rfields.push({
				name: "**isolate**",
				value: `*${c.isolate ? "Yes" : "No"}*`,
				inline: true
			});
			t = guild.channels.find(ch => ch.id == c.triggerChannel);
			rfields.push({
				name: "**triggerChannel**",
				value: `**${t ? t.name : "Not found"}** (${c.triggerChannel})`,
				inline: true
			});
			rfields.push({
				name: "**triggerRoles**",
				value: "Following contains the roles that trigger this configuration:"
			});
			c.triggerRoles.forEach(r => {
				t = guild.roles.find(ro => ro.id == r);
				rfields.push({
					name: `*${t ? t.name : "Not found"}*`,
					value: `${r}`,
					inline: true
				});
			});
			rfields.push({
				name: "voice",
				value: "Following contains the properties of the voice channels:"
			});
			t = guild.channels.find(ch => ch.id == c.voice.category);
			rfields.push({
				name: "**category**",
				value: `**${t ? t.name : "Not Found"}**\n*${c.voice.category}*`,
				inline: true
			});
			rfields.push({
				name: "**prefix**",
				value: `*${c.voice.prefix ? c.voice.prefix : "None"}*`,
				inline: true
			});
			rfields.push({
				name: "**suffix**",
				value: `*${c.voice.suffix ? c.voice.suffix : "None"}*`,
				inline: true
			});
			rfields.push({
				name: "**name**",
				value: `*${translateName(c.voice.name)}*`,
				inline: true
			});
			rfields.push({
				name: "**userlimit**",
				value: `*${c.voice.userlimit}*`,
				inline: true
			});
			rfields.push({
				name: "**bitrate**",
				value: `*${c.voice.bitrate}*`,
				inline: true
			});
			rfields.push({
				name: "text",
				value: "Following contains the properties of the text channels:"
			});
			t = guild.channels.find(ch => ch.id == c.text.category);
			rfields.push({
				name: "**category**",
				value: `**${t ? t.name : "Not Found"}**\n*${c.text.category}*`,
				inline: true
			});
			rfields.push({
				name: "**prefix**",
				value: `*${c.text.prefix ? c.text.prefix : "None"}*`,
				inline: true
			});
			rfields.push({
				name: "**suffix**",
				value: `*${c.text.suffix ? c.text.suffix : "None"}*`,
				inline: true
			});
			rfields.push({
				name: "**name**",
				value: `*${translateName(c.text.name)}*`,
				inline: true
			});
			rfields.push({
				name: "**nsfw**",
				value: `*${c.text.nsfw ? "Yes" : "No"}*`,
				inline: true
			});
			rfields.push({
				name: "**topic**",
				value: `*${c.text.topic ? c.text.topic : "None"}*`,
				inline: true
			});
			let pl = "";
			c.permissions.forEach(p => {
				pl += `**${p}**\n`;
			});
			if (pl == "") pl = "None";
			rfields.push({
				name: "**permissions**",
				value: pl
			});

			let ereply = {
				title: `${c.name}`,
				description: tunset ? tunset : "",
				color: c.valid ? (c.active ? 5025616 : 16771899) : 16007990,
				footer: {
					text: `Use ${botPrefix} changeConfig ${c.id} to change this configuration.`
				},
				thumbnail: {
					url: `https://ui-avatars.com/api/?name=${c.name.split(" ")[0]}+${c.name.split(" ")[1] ? c.name.split(" ")[1] : ""}&size=128&background=${translateHex(
						c.color
					)}&color=FFFFFF&rounded=true&bold=true`
				},
				fields: rfields
			};
			message.channel.send(`Configuration ${count} of ${DynChanGuilds[guild.id].data.configurations.length}`, { embed: ereply });
		});
	} else message.reply(`there are no existing configurations set yet. Use **${botPrefix} newConfig** to create a new configuration.`);
}

function showRoles(message, args) {
	let guild = message.guild;
	let reply = "this is the list of all roles and their ids on this server:\n\n";
	guild.roles.array().forEach(role => {
		let controlRoles = DynChanGuilds[guild.id].data.controlRoles;
		let activated = controlRoles.includes(role.id) ? "Yes" : "No";
		reply += `Name: **${role.name}**\nID: **${role.id}**\nControl Role: **${activated}**\n\n`;
	});
	message.reply(reply, { split: true });
}

function showPermissions(message, args) {
	let reply = "here is a list of all Discord permissions that are applicable to channels:\n\n";
	for (let key in permissionList) {
		reply += `**${key}:** *${permissionList[key]}*\n`;
	}
	message.reply(reply);
}

function translateName(val) {
	switch (val) {
		case 1:
			return "Unique ID";
		case 2:
			return "Incrementing Number";
		case 3:
			return "Incrementing Roman Number";
		case 4:
			return "Username of Author";
		case 5:
			return "Nickname of Author";
		case 6:
			return "Fixed Name";
		default:
			return val;
	}
}

function translateHex(val) {
	val = val.toString(16);
	for (let i = 0; i < 5; i++) val = val.length < 6 ? `0${val}` : val;
	return val;
}

function checkConfig(guild, dcg, dcgConfig) {
	let unset = {
		triggerChannel: null,
		triggerRoles: null
	};
	let valid = true;
	if (dcgConfig.triggerChannel != null) {
		let c = guild.channels.find(c => c.id == dcgConfig.triggerChannel);
		if (c) {
			if (c.type != "voice") {
				valid = false;
				unset.triggerChannel = "Must be a voice channel.";
			}
		} else {
			valid = false;
			unset.triggerChannel = "Channel does not seem to exist.";
		}
	} else {
		valid = false;
		unset.triggerChannel = "Must be an channel id.";
	}
	if (dcgConfig.triggerRoles.length > 0) {
		let tvalid = false;
		dcgConfig.triggerRoles.forEach(r => {
			let ro = guild.roles.find(ro => ro.id == r);
			if (ro) tvalid = true;
		});
		if (!tvalid) {
			valid = false;
			unset.triggerRoles = "Not a single role could be found.";
		}
	} else {
		valid = false;
		unset.triggerRoles = "Must include at least one valid role id.";
	}
	dcgConfig.valid = valid;
	dcg.saveData();
	if (!valid) return unset;
	else return false;
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

function genName(dcg, vt, conID, member) {
	let dcc = dcg.channels[conID].find(dcc => dcc.owner == member.user.id);
	if (dcc.uniqueNameId == null) dcc.uniqueNameId = uid.randomUUID(12).toLowerCase();
	let gen = [{ o: vt.prefix, g: "" }, { o: vt.name, g: "" }, { o: vt.suffix, g: "" }];
	for (let i = 0; i < gen.length; i++) {
		switch (gen[i].o) {
			case 1:
				gen[i].g = dcc.uniqueNameId;
				break;
			case 2:
				gen[i].g = dcg.channels[conID].length;
				break;
			case 3:
				gen[i].g = RomanNumerals.convert(dcg.channels[conID].length);
				break;
			case 4:
				gen[i].g = member.user.username;
				break;
			case 5:
				if (member.nickname) gen[i].g = member.nickname;
				else gen[i].g = member.user.username;
				break;
			default:
				gen[i].g = gen[i].o;
				break;
		}
	}
	return `${gen[0].g} ${gen[1].g} ${gen[2].g}`;
}

process.on("unhandledRejection", err => {
	console.error(err);
});

client.login(token.token);
