const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot is alive"));
app.listen(3000, () => console.log("🌐 Web server running"));

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const { DisTube } = require("distube");
const { YtDlpPlugin } = require("@distube/yt-dlp");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

// 🎵 DisTube (THIS FIXES EVERYTHING)
const distube = new DisTube(client, {
  plugins: [new YtDlpPlugin()],
  emitNewSongOnly: true,
});

// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song")
    .addStringOption(option =>
      option.setName("song").setDescription("Song name or URL").setRequired(true)
    ),
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

// 🎵 Play command (HYDRA STYLE)
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "play") {
    const query = interaction.options.getString("song");
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
      return interaction.reply({ content: "❌ Join a voice channel first!", ephemeral: true });
    }

    await interaction.deferReply();

    try {
      await distube.play(voiceChannel, query, {
        member: interaction.member,
        textChannel: interaction.channel,
      });

      interaction.editReply(`🎶 Playing: ${query}`);

    } catch (err) {
      console.error(err);
      interaction.editReply("❌ Error playing song.");
    }
  }
});

// 🎧 Events (real music feedback)
distube
  .on("playSong", (queue, song) => {
    queue.textChannel.send(`🎶 Now playing: ${song.name}`);
  })
  .on("addSong", (queue, song) => {
    queue.textChannel.send(`➕ Added to queue: ${song.name}`);
  })
  .on("error", (channel, error) => {
    console.error("DISTUBE ERROR:", error);
    channel.send("❌ Music error occurred.");
  });

client.login(process.env.DISCORD_TOKEN);
