const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require("@discordjs/voice");
const play = require("play-dl");

module.exports = {
  name: "play",
  async execute(message, args) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("❌ Join a voice channel first!");

    const query = args.join(" ");
    if (!query) return message.reply("❌ Enter a song name!");

    try {
      const result = await play.search(query, { limit: 1 });
      if (!result.length) return message.reply("❌ No results found.");

      const stream = await play.stream(result[0].url);

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild.id,
        adapterCreator: message.guild.voiceAdapterCreator
      });

      const player = createAudioPlayer();
      const resource = createAudioResource(stream.stream, {
        inputType: stream.type
      });

      player.play(resource);
      connection.subscribe(player);

      message.reply(`🎶 Now playing: ${result[0].title}`);

    } catch (err) {
      console.error(err);
      message.reply("❌ Error playing song.");
    }
  }
};
