const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "kick",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return message.reply("❌ No permission.");
    }

    const user = message.mentions.members.first();
    if (!user) return message.reply("❌ Mention a user.");

    await user.kick();
    message.reply("✅ User kicked.");
  }
};
