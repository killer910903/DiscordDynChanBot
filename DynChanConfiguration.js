/* jshint esversion: 6 */
const shortid = require("shortid");

class DynChanConfiguration {
	constructor(id = null) {
		this.name = "Unnamed Configuration";
		this.id = id || shortid.generate();
		this.triggerChannel = null;
		this.triggerRoles = null;
		this.preventNameChange = true;
		this.createTextChannel = false;
		this.voice = {
			category: null,
			prefix: false,
			suffix: false,
			name: 3, // 1: Unique ID, 2: Incrementing Number, 3: Username, 4: Nickname, 5: Fixed Name
			permissions: [
				{
					roles: [],
					allow: [],
					deny: []
				}
			],
			userlimit: 0,
			bitrate: 640000
		};
		this.text = {
			category: null,
			prefix: false,
			suffix: false,
			name: 3, // 1: Unique ID, 2: Incrementing Number, 3: Username, 4: Nickname, 5: Fixed Name
			permissions: [
				{
					roles: [],
					allow: [],
					deny: []
				}
			],
			nsfw: false
		};
	}
}
module.exports = DynChanConfiguration;
