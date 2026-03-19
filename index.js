const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  SlashCommandBuilder 
} = require("discord.js");

const { 
  joinVoiceChannel, 
  createAudioPlayer, 
  createAudioResource,
  StreamType,
  AudioPlayerStatus
} = require("@discordjs/voice");

const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// Slash command
const commands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song")
    .addStringOption(option =>
      option.setName("song")
        .setDescription("Song name")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("✅ Slash command registered");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "play") {
    const query = interaction.options.getString("song");
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: "❌ Join a voice channel first!", ephemeral: true });
    }

    await interaction.deferReply();

    try {
      // 🔍 Search YouTube
      const search = await ytSearch(query);
      const video = search.videos[0];

      if (!video) {
        return interaction.editReply("❌ No results found.");
      }

      // 🔥 FIXED STREAM (important)
      const stream = ytdl(video.url, {
        filter: "audioonly",
        quality: "highestaudio",
        highWaterMark: 1 << 25,
        requestOptions: {
          headers: {
            cookie: "CONSENT=YES+"
          }
        }
      });

      // 🔊 Join VC
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator
      });

      const player = createAudioPlayer();

      const resource = createAudioResource(stream, {
        inputType: StreamType.Arbitrary,
        inlineVolume: true
      });

      resource.volume.setVolume(0.5);

      player.play(resource);
      connection.subscribe(player);

      // 🛑 Prevent crashes
      player.on("error", error => {
        console.error("PLAYER ERROR:", error);
      });

      player.on(AudioPlayerStatus.Idle, () => {
        connection.destroy();
      });

      interaction.editReply(`🎶 Now playing: ${video.title}`);

    } catch (err) {
      console.error("PLAY ERROR:", err);
      interaction.editReply("❌ Error playing song.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
