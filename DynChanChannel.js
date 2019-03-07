/* jshint esversion: 6 */
class DynChanChannel {
	constructor(guild, channel, configuration) {
		this.guild = guild;
		this.channel = channel;
		this.configuration = configuration;
		this.textChannel = null;
	}
}
module.exports = DynChanChannel;
