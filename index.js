const express = require("express");
const app = express();

// 🌐 Keep Railway alive
app.get("/", (req, res) => res.send("Bot is alive"));
app.listen(3000, () => console.log("🌐 Web server running"));

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const { DisTube } = require("distube");
const { YtDlpPlugin } = require("@distube/yt-dlp");
const ffmpeg = require("ffmpeg-static");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

// 🎵 DisTube (stable music system)
const distube = new DisTube(client, {
  plugins: [new YtDlpPlugin()],
  emitNewSongOnly: true,
  ffmpeg: {
    path: ffmpeg,
  },
});

// 🎵 Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song")
    .addStringOption(option =>
      option.setName("song")
        .setDescription("Song name or URL")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current song"),
  new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop music and leave VC")
].map(cmd => cmd.toJSON());

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("✅ Slash commands ready");
});

// 🎮 COMMAND HANDLER
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const vc = interaction.member.voice.channel;

  if (interaction.commandName === "play") {
    const query = interaction.options.getString("song");

    if (!vc) {
      return interaction.reply({ content: "❌ Join a voice channel first!", ephemeral: true });
    }

    await interaction.deferReply();

    try {
      await distube.play(vc, query, {
        member: interaction.member,
        textChannel: interaction.channel,
      });

      interaction.editReply(`🎶 Playing: ${query}`);

    } catch (err) {
      console.error("PLAY ERROR:", err);
      interaction.editReply("❌ Error playing song.");
    }
  }

  if (interaction.commandName === "skip") {
    try {
      distube.skip(interaction.guild);
      interaction.reply("⏭️ Skipped song");
    } catch {
      interaction.reply("❌ Nothing to skip");
    }
  }

  if (interaction.commandName === "stop") {
    try {
      distube.stop(interaction.guild);
      interaction.reply("⏹️ Stopped music");
    } catch {
      interaction.reply("❌ Nothing playing");
    }
  }
});

// 🎧 EVENTS
distube
  .on("playSong", (queue, song) => {
    queue.textChannel.send(`🎶 Now playing: ${song.name}`);
  })
  .on("addSong", (queue, song) => {
    queue.textChannel.send(`➕ Added: ${song.name}`);
  })
  .on("error", (channel, error) => {
    console.error("DISTUBE ERROR:", error);
    if (channel) channel.send("❌ Music error occurred.");
  });

client.login(process.env.DISCORD_TOKEN);
