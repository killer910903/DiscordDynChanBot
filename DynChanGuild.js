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
			user: null,
			detail: "voice",
			reset: function() {
				this.setup.state = "null";
				this.setup.configID = null;
				this.setup.configName = null;
				this.setup.state = null;
				this.setup.user = null;
				this.setup.detail = "voice";
			}
		};
		this.data = this.loadData();
		this.saveData();
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
	hasTriggerRole(id) {
		if (
			this.data.configurations
				.find(c => c.id == this.setup.configID)
				.triggerRoles.find(r => r.id == id)
		)
			return true;
		else return false;
	}
	toggleTriggerRole(id) {
		let toggle = true;
		let c = this.data.configurations.find(c => c.id == this.setup.configID);
		if (c.triggerRoles.includes(id)) {
			toggle = false;
			let index = c.triggerRoles.indexOf(id);
			c.triggerRoles.splice(index, 1);
		} else {
			toggle = true;
			this.data.configurations
				.find(c => c.id == this.setup.configID)
				.triggerRoles.push(id);
		}
		this.saveData();
		return toggle;
	}
	// changeBool(id, key, val) {
	// 	let c = this.data.configurations.find(c => c.id == id);
	// 	if (c) c[key] = val;
	// 	this.saveData();
	// }
	// setVoiceCategory(id, val) {
	// 	let c = this.data.configurations.find(c => c.id == id);
	// 	if (c) c.voice.category = val;
	// 	this.saveData();
	// }
}
module.exports = DynChanGuild;
