const { PermissionFlagsBits } = require("discord.js");

module.exports = {
  name: "ban",
  async execute(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply("❌ No permission.");
    }

    const user = message.mentions.members.first();
    if (!user) return message.reply("❌ Mention a user.");

    await user.ban();
    message.reply("✅ User banned.");
  }
};
