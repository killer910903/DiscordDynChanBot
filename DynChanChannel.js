/* jshint esversion: 6 */
class DynChanChannel {
	constructor(owner) {
		this.oowner = owner;
		this.owner = owner;
		this.voiceChannel = null;
		this.textChannel = null;
		this.uniqueNameId = null;
	}
}
module.exports = DynChanChannel;
