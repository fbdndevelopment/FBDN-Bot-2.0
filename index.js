const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require("@discordjs/voice");
const ytdl = require("ytdl-core");
const ytSearch = require("yt-search");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

// REGISTER SLASH COMMAND
const commands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song")
    .addStringOption(option =>
      option.setName("song")
        .setDescription("Song name")
        .setRequired(true))
].map(cmd => cmd.toJSON());

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("✅ Slash commands registered");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "play") {
    const query = interaction.options.getString("song");
    const member = interaction.member;
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply("❌ Join a voice channel first!");
    }

    await interaction.deferReply(); // prevents "application did not respond"

    try {
      const result = await play.search(query, { limit: 1 });

      if (!result.length) {
        return interaction.editReply("❌ No results found.");
      }

      const stream = await play.stream(result[0].url);

      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator
      });

      const player = createAudioPlayer();
      const resource = createAudioResource(stream);
        inputType: stream.type
      });

      player.play(resource);
      connection.subscribe(player);

      interaction.editReply(`🎶 Now playing: ${result[0].title}`);

    } catch (err) {
      console.error(err);
      interaction.editReply("❌ Error playing song.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
