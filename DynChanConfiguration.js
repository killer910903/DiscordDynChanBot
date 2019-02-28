/* jshint esversion: 6 */
const shortid = require("shortid");

class DynChanConfiguration {
	constructor(id = null) {
		this.name = "Unnamed Configuration";
		this.id = id || shortid.generate();
		this.active = true;
		this.valid = false;
		this.color = Math.floor(Math.random() * 16777215);
		this.triggerChannel = null;
		this.triggerRoles = [];
		this.createTextChannel = false;
		this.voice = {
			category: null,
			prefix: null,
			suffix: null,
			name: 3, // 1: ID, 2: Number, 3: Username, 4: Nickname, Text: Custom
			userlimit: 0,
			bitrate: 64000
		};
		this.text = {
			category: null,
			prefix: null,
			suffix: null,
			name: 3, // 1: ID, 2: Number, 3: Username, 4: Nickname, Text: Custom
			nsfw: false
		};
		this.permissions = [];
	}
}
module.exports = DynChanConfiguration;
