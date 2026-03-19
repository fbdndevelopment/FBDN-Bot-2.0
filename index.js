const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot is alive"));
app.listen(3000, () => console.log("🌐 Web server running"));

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const play = require("play-dl");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

const commands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song")
    .addStringOption(option =>
      option.setName("song")
        .setDescription("Song name or URL")
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

  console.log("✅ Commands ready");
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "play") {
    const query = interaction.options.getString("song");
    const vc = interaction.member.voice.channel;

    if (!vc) {
      return interaction.reply({ content: "❌ Join a VC first", ephemeral: true });
    }

    await interaction.deferReply();

    try {
      const search = await play.search(query, { limit: 1 });
      const url = search[0].url;

      const stream = await play.stream(url);

      const connection = joinVoiceChannel({
        channelId: vc.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator
      });

      const player = createAudioPlayer();

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type
      });

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Playing, () => {
        console.log("🔊 Playing audio");
      });

      player.on("error", err => {
        console.error("PLAYER ERROR:", err);
      });

      interaction.editReply(`🎶 Now playing: ${search[0].title}`);

    } catch (err) {
      console.error("PLAY ERROR:", err);
      interaction.editReply("❌ Error playing song.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
