/* jshint esversion: 6 */
class DynChanChannel {
	constructor(owner) {
		this.owner = owner;
		this.voiceChannel = null;
		this.textChannel = null;
	}
}
module.exports = DynChanChannel;
