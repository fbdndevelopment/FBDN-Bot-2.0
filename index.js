const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot is alive"));
app.listen(3000, () => console.log("🌐 Web server running"));

const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates]
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "play") {
    const vc = interaction.member.voice.channel;

    if (!vc) return interaction.reply("Join a VC first");

    await interaction.deferReply();

    try {
      const connection = joinVoiceChannel({
        channelId: vc.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator
      });

      const player = createAudioPlayer();

      // 🔥 DIRECT AUDIO TEST (ALWAYS WORKS)
      const resource = createAudioResource(
        "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      );

      player.play(resource);
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Playing, () => {
        console.log("🔊 Audio is playing!");
      });

      interaction.editReply("🎶 Playing test audio!");

    } catch (err) {
      console.error(err);
      interaction.editReply("❌ Error playing audio");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
