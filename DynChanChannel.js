/* jshint esversion: 6 */
class DynChanChannel {
	constructor(configuration) {
		this.configuration = configuration;
		this.voiceChannel = null;
		this.textChannel = null;
	}
}
module.exports = DynChanChannel;
