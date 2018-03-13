process.chdir('/home/zlyfer/DiscordBots/DiscordDynChanBot');
const Discord = require('discord.js');
const client = new Discord.Client();

const fs = require("fs");
const token = require("./token.json");
const guildConfigFolder = "./guildConfig/";
const configTemplate = require("./configTemplate.json");
const botPrefix = "~zldc~";

function getConfig(guildID) {
	var cfile = guildConfigFolder + guildID + ".json";
	if (fs.existsSync(cfile)) {
		var config = require(cfile);
	} else {
		var config = configTemplate;
	}
	return config;
}

function checkPerm(guild, permission) {
	const botID = client.user.id;
	var hasPerm = guild.members.find('id', botID).hasPermission(permission);
	return (hasPerm)
}

function applyChanges(guild, changeObj) {
	var guildConfig = getConfig(guild.id);
	var channels = guild.channels.array();
	for (var channel = 0; channel < channels.length; channel++) {
		var cchannel = channels[channel];
		var channelType = cchannel.type;
		var channelName = cchannel.name;
		if (checkPerm(guild, "MANAGE_CHANNELS")) {
			if (channelType == "category") {
				if (guildConfig.category != false) {
					if (changeObj.category == channelName) {
						cchannel.edit({name: guildConfig.category});
					}
				}
			}
		}
		if (channelType == "voice") {
			if (channelName.indexOf(guildConfig.channelPrefix) != -1 || channelName.indexOf(changeObj.channelPrefix) != -1) {
				if (checkPerm(guild, "MANAGE_CHANNELS")) {
					var newChannelName = channelName.replace(changeObj.channelPrefix, guildConfig.channelPrefix);
					cchannel.edit({name: newChannelName, userLimit: guildConfig.userLimit});
				}
				if (checkPerm(guild, "MANAGE_ROLES")) {
					var creatorName = newChannelName.replace(guildConfig.channelPrefix + " ", "");
					var members = guild.members.array();
					for (var member = 0; member < members.length; member++) {
						var user = members[member].user;
						var userName = user.username;
						if (userName == creatorName) {
							if (guildConfig.givePermissions == true) {
								cchannel.overwritePermissions(user, {MUTE_MEMBERS: true, DEAFEN_MEMBERS: true});
							} else {
								cchannel.overwritePermissions(user, {MUTE_MEMBERS: false, DEAFEN_MEMBERS: false});
							}
						}
					}
				}
			}
		}
	}
}

function changeConfig(guild, key, newValue) {
	var guildFile = guildConfigFolder + guild.id + ".json";
	var guildConfig = getConfig(guild.id);
	var changeObj = {
		"category": guildConfig.category,
		"channelPrefix": guildConfig.channelPrefix
	};
	if ("true".indexOf(newValue) != -1) {
		newValue = true;
	} else if ("false".indexOf(newValue) != -1) {
		newValue = false;
	}
	guildConfig[key] = newValue;
	fs.writeFileSync(guildFile, JSON.stringify(guildConfig), 'utf-8')
	applyChanges(guild, changeObj);
}

function configSetup() {
	var guilds = client.guilds.array();
	for (guild = 0; guild < guilds.length; guild++) {
		var guildFile = guildConfigFolder + guilds[guild].id + ".json";
		if (!fs.existsSync(guildFile)) {
			fs.writeFileSync(guildFile, JSON.stringify(configTemplate), 'utf-8');
		} else {
			var config = require(guildFile);
			var change = false;
			for (var key in configTemplate) {
				if (!(key in config)) {
					config[key] = configTemplate[key];
					change = true;
				}
			}
			if (change == true) {
				fs.writeFileSync(guildFile, JSON.stringify(config), 'utf-8');
			}
		}
	}
}

client.on('ready', () => {
	configSetup();
})

client.on('guildCreate', (guild) => {
	configSetup();
})

client.on('voiceStateUpdate', (oldMember, newMember) => {
	if (oldMember.voiceChannel != undefined) {
		var guild = newMember.guild;
		var guildConfig = getConfig(guild.id);
		var channel = oldMember.voiceChannel;
		var channelName = channel.name;
		if (channelName.indexOf(guildConfig.channelPrefix) == 0) {
			var members = channel.members.array();
			if (members.length == 0) {
				if (checkPerm(guild, "MANAGE_CHANNELS")) {
					channel.delete();
				}
			} else {
				var memberName = oldMember.user.username;
				if (channelName.indexOf(memberName) != -1) {
					var channelChange = true;
					if (newMember.voiceChannel != undefined) {
						var newChannel = newMember.voiceChannel;
						if (newChannel.id == channel.id) {
							var channelChange = false;
						}
					}
					if (channelChange == true) {
						var members = guild.members.array();
						for (var member = 0; member < members.length; member++) {
							var voiceChannelID = members[member].voiceChannelID;
							if (voiceChannelID == channel.id) {
								var newOwner = members[member];
								if (channelChange == true) {
									if (memberName != newOwner.user.username) {
										if (checkPerm(guild, "MANAGE_CHANNELS")) {
											channel.edit({name: guildConfig.channelPrefix + " " + newOwner.user.username});
										}
										if (guildConfig.givePermissions == true) {
											if (checkPerm(guild, "MANAGE_ROLES")) {
												channel.overwritePermissions(oldMember, {MUTE_MEMBERS: false, DEAFEN_MEMBERS: false});
												channel.overwritePermissions(newOwner, {MUTE_MEMBERS: true, DEAFEN_MEMBERS: true});
											}
										}
										channelChange = false;
									}
								}
							}
						}
					}
				}
			}
		}
	}
	if (newMember.voiceChannel != undefined) {
		var guild = newMember.guild;
		var guildConfig = getConfig(guild.id);
		if (newMember.voiceChannel.name == guildConfig.mainChannel) {
			if (checkPerm(guild, "MANAGE_CHANNELS")) {
				guild.createChannel(guildConfig.channelPrefix + " " + newMember.user.username, "voice");
			}
		}
	}
})

client.on('channelCreate', (channel) => {
	var type = channel.type;
	if (type ==	"voice") {
		var guild = channel.guild;
		var guildConfig = getConfig(guild.id);
		var name = channel.name;
		if (name.indexOf(guildConfig.channelPrefix) == 0) {
			if (guildConfig.category != false) {
				var channels = guild.channels.array();
				var categoryExists = false;
				for (var channeli = 0; channeli < channels.length; channeli++) {
					if (channels[channeli].type == "category") {
						if (channels[channeli].name == guildConfig.category) {
							if (checkPerm(guild, "MANAGE_CHANNELS")) {
								channel.setParent(channels[channeli].id);
							}
							categoryExists = true;
						}
					}
				}
				if (categoryExists == false) {
					changeConfig(guild, "category", "false");
				}
			}
			var creatorName = name.replace(guildConfig.channelPrefix + " ", "");
			var members = guild.members.array();
			for (var member = 0; member < members.length; member++) {
				if (members[member].user.username == creatorName) {
					creator = members[member];
					if (checkPerm(guild, "MOVE_MEMBERS")) {
						creator.edit({channel: channel});
					}
					if (checkPerm(guild, "MANAGE_CHANNELS")) {
						channel.edit({bitrate: 96000, userLimit: guildConfig.userLimit});
					}
					if (guildConfig.givePermissions == true) {
						if (checkPerm(guild, "MANAGE_ROLES")) {
							channel.overwritePermissions(creator.user, {MUTE_MEMBERS: true, DEAFEN_MEMBERS: true});
						}
					}
				}
			}
		}
	}
})

client.on('message', (message) => {
	var content = message.content;
	if (message.author.bot == false && content.indexOf(botPrefix) != -1) {
		if (message.channel.type == "text") {
			content = content.replace(botPrefix, "");
			var guildConfig = getConfig(message.guild.id);
			var hasRights = false;
			if (guildConfig.configRole != false) {
				roles = message.member.roles.array();
				for (var role = 0; role < roles.length; role++) {
					rolename = roles[role].name;
					if (rolename == guildConfig.configRole) {
						hasRights = true;
					}
				}
			}
			if (hasRights == false) {
				var author = message.author.id;
				var owner = message.member.guild.ownerID;
				if (author == owner) {
					hasRights = true;
				}
			}
			if (hasRights == true) {
				var cmd = String(content).split(" ")[0];
				var newValue = String(content).replace(cmd+" ", "").replace(cmd+"", "");
				var changeValid = false;
				switch (cmd) {
					case "help":
						var helpObj = {
							"help": {"parameter": "none", "desc": "Shows this help message."},
							"showSettings": {"parameter": "none", "desc": "Displays the current settings and their values."},
							"enable": {"parameter": "true/false", "desc": "This command can enable and disable the bot."},
							"mainChannel": {"parameter": "text", "desc": "Specifies the channel which triggers the bot."},
							"category": {"parameter": "text/false", "desc": "Specifies the category within the temporary channel are created. Use 'false' for no category."},
							"userLimit": {"parameter": "number", "desc": "Specifies the user limit the temporary channel should have. Use '0' for unlimited."},
							"channelPrefix": {"parameter": "text", "desc": "Specifies the prefix of the temporary channels."},
							"givePermissions": {"parameter": "true/false", "desc": "Specifies whether the channel 'creator' should get mute and deaf rights for that channel."},
							"configRole": {"parameter": "text/false", "desc": "Specifies the role the bot listens to. 'false' = owner only."}
						}
						var reply = "help is on the way:\n";
						reply += "Make sure to use **" + botPrefix + "** as prefix!\n";
						reply += "The format is: **COMMAND** __PARAMETER__ - *DESCRIPTION*.\n\n";
						for (var key in helpObj) {
							reply += "**" + key + "** __" + helpObj[key].parameter + "__ - *" + helpObj[key].desc + "*\n";
						}
						reply += "\n INFO: If you encounter any issues or have questions, feel free to contact me.\n";
						message.reply(reply);
						break;
					case "showSettings":
						var reply = "these are the current settings and their values:\n";
						for (var key in guildConfig) {
							reply += "**" + key + "**: __" + guildConfig[key] + "__\n";
						}
						message.reply(reply);
						break;
					case "enable":
						if (newValue == "true" || newValue == "false") {
							changeValid = true;
						} else {
							message.reply("please use either true or false.");
						}
						break;
						break;
					case "mainChannel":
						if (newValue == guildConfig.chnPrefix) {
							message.reply("**mainChannel** must not be the same as **channelPrefix**.");
						} else {
							changeValid = true;
						}
						break;
					case "category":
						if (newValue.length < 1) {
							message.reply("you need to specify at least one character.");
						}else {
							changeValid = true;
						}
						break;
					case "userLimit":
						changeValid = /^[0-9]{1,2}$/i.test(newValue);
						if (changeValid == false) {
							message.reply("you need to specify a number between 0 and 99.");
						}
						break;
					case "channelPrefix":
						if (newValue.length < 1) {
							message.reply("you need to specify at least one character.");
						} else if (newValue == guildConfig.mainChannel) {
							message.reply("**channelPrefix** must not be the same as **mainChannel**.");
						} else {
							changeValid = true;
						}
						changeValid = true;
						break;
					case "givePermissions":
						if (newValue == "true" || newValue == "false") {
							changeValid = true;
						} else {
							message.reply("please use either true or false.");
						}
						break;
					case "configRole":
						if (newValue == "false") {
							changeValid = true;
						} else {
							var role = message.guild.roles.find("name", newValue);
							if (role == null) {
								message.reply("you need to specifiy an existing role. Please add the role **" + newValue + "** and try again.");
							} else {
								changeValid = true;
							}
						}
						break;
				}
				if (changeValid == true) {
					changeConfig(message.guild, cmd, newValue);
					message.reply("**" + cmd + "** *has been changed to* **" + newValue + "**.");
				}
			} else {
				message.reply("sorry but you seem to lack on rights to use me.")
			}
		} else {
			message.reply("sorry, but I am supposed to be controlled via a text channel on a discord server.");
		}
	}
});

process.on('unhandledRejection', (err) => {
	console.error(err);
})

client.login(token.token);
