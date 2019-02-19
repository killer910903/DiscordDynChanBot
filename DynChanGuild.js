/* jshint esversion: 6 */
const fs = require("fs");

const guildConfigFolder = "./guildConfig";
const DynChanConfiguration = require("./DynChanConfiguration.js");

class DynChanGuild {
	constructor(id) {
		this.id = id;
		this.setup = {
			configID: null,
			configName: null,
			state: null,
			user: null
		};
		/*
		name
		triggerChannel
		triggerRoles
		preventNameChange
  o |---createTextChannel
  p |	voice
  t |		category
  i |		prefix
  o |		suffix
  n |		name
  a |		permissions
  l |			roles
	|			allow
  l |			deny
  i |		userlimit
  n |		bitrate
  k |---text
			category
			prefix
			suffix
			name
			permissions
				roles
				allow
				deny
			nsfw
		*/
		this.data = this.loadData();
	}

	loadData() {
		let data;
		let file = `${guildConfigFolder}/${this.id}.json`;
		if (!fs.existsSync(file)) file = "./configTemplate.json";
		try {
			data = require(file);
		} catch (error) {
			console.error(
				`Could not load configuration file for guild: ${guildID}\n`,
				error
			);
		}
		return data;
	}
	saveData() {
		let file = `${guildConfigFolder}/${this.id}.json`;
		fs.writeFileSync(file, JSON.stringify(this.data), "utf-8");
	}

	toggle(state = null) {
		if (state == null)
			if (this.data.toggle == "on") this.data.toggle = "off";
			else this.data.toggle = "on";
		else this.data.toggle = state;
		this.saveData();
	}
	setCustomPrefix(prefix) {
		if (prefix) this.data.customPrefix = prefix;
		else this.data.customPrefix = null;
		this.saveData();
	}
	newConfiguration() {
		let c = new DynChanConfiguration();
		this.data.configurations.push(c);
		this.saveData();
		return c.id;
	}
	delConfiguration(id) {
		let dc = null;
		for (let i = 0; i < this.data.configurations.length; i++) {
			let c = this.data.configurations[i];
			if (c.id == id) {
				dc = c.name;
				this.data.configurations.splice(i, 1);
			}
		}
		this.saveData();
		return dc;
	}
	setControlRoles(role) {
		if (this.data.controlRoles.includes(role)) {
			this.data.controlRoles.splice(this.data.controlRoles.indexOf(role), 1);
			this.saveData();
			return false;
		} else {
			this.data.controlRoles.push(role);
			this.saveData();
			return true;
		}
	}
	getConfiguration(id) {
		let cfg = null;
		this.data.configurations.forEach(c => {
			if (c.id == id) cfg = c;
		});
		return cfg;
	}
}
module.exports = DynChanGuild;
