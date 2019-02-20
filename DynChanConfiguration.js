/* jshint esversion: 6 */
const shortid = require("shortid");

class DynChanConfiguration {
	constructor(id = null) {
		this.name = "Unnamed Configuration";
		this.id = id || shortid.generate();
		this.triggerChannel = null;
		this.triggerRoles = [];
		this.createTextChannel = false;
		this.voice = {
			category: null,
			prefix: null,
			suffix: null,
			name: 3, // 1: Unique ID, 2: Incrementing Number, 3: Username, 4: Nickname, 5: Fixed Name
			userlimit: 0,
			bitrate: 640000
		};
		this.text = {
			category: null,
			prefix: null,
			suffix: null,
			name: 3, // 1: Unique ID, 2: Incrementing Number, 3: Username, 4: Nickname, 5: Fixed Name
			nsfw: false
		};
		this.permissions = [
			{
				roles: [],
				allow: [],
				deny: []
			}
		];
	}
}
module.exports = DynChanConfiguration;
