// 🔥 FORCE yt-dlp to update
process.env.YTDL_NO_UPDATE = "false";

const express = require("express");
const app = express();

// 🌐 Keep Railway alive
app.get("/", (req, res) => res.send("Bot is alive"));
app.listen(3000, () => console.log("🌐 Web server running"));

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const { DisTube } = require("distube");
const { YtDlpPlugin } = require("@distube/yt-dlp");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

// 🔥 FINAL DISTUBE CONFIG (FIXED EVERYTHING)
const distube = new DisTube(client, {
  emitNewSongOnly: true,
  ffmpeg: {
    path: require("ffmpeg-static")
  },
  plugins: [
    new YtDlpPlugin({
      update: true,      // 🔥 auto update yt-dlp
      cookies: true      // 🔥 helps bypass YouTube issues
    })
  ]
});

// 🎵 Commands
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
    .setDescription("Stop music")
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
      interaction.reply("⏭️ Skipped");
    } catch {
      interaction.reply("❌ Nothing to skip");
    }
  }

  if (interaction.commandName === "stop") {
    try {
      distube.stop(interaction.guild);
      interaction.reply("⏹️ Stopped");
    } catch {
      interaction.reply("❌ Nothing playing");
    }
  }
});

// 🎧 Events
distube
  .on("playSong", (queue, song) => {
    queue.textChannel.send(`🎶 Now playing: ${song.name}`);
  })
  .on("addSong", (queue, song) => {
    queue.textChannel.send(`➕ Added: ${song.name}`);
  })
  .on("error", (channel, error) => {
    console.error("DISTUBE FULL ERROR:", error);
    if (channel) channel.send(`❌ ${error.message}`);
  });

client.login(process.env.DISCORD_TOKEN);
