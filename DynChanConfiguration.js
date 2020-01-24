/* jshint esversion: 6 */
const ShortUniqueId = require("short-unique-id");
var uid = new ShortUniqueId();

class DynChanConfiguration {
	constructor() {
		this.name = "Unnamed Configuration";
		this.id = uid.randomUUID(12);
		this.active = true;
		this.valid = false;
		this.color = Math.floor(Math.random() * 16777215);
		this.triggerChannel = null;
		this.triggerRoles = [];
		this.createTextChannel = false;
		this.delay = 0;
		this.limit = 0;
		this.isolate = false;
		this.permaowner = false;
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
			nsfw: false,
			topic: "Created by DynChanBot!"
		};
		this.permissions = [];
	}
}
module.exports = DynChanConfiguration;
