import DiscordJS from "discord.js";
const { EmbedBuilder } = DiscordJS;

export default {
  name: "pause",
  aliases: ["resume", "pausar", "continuar"],
  async execute(client, message, args) {
    const player = client.riffy.players.get(message.guild.id);
    const embed = new EmbedBuilder().setColor("#ffffff");

    if (!player) {
      return message.reply({ 
        embeds: [embed.setDescription("No hay música sonando actualmente.")] 
      });
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel || voiceChannel.id !== player.voiceChannel) {
      return message.reply({ 
        embeds: [embed.setDescription("Debes estar en el mismo canal de voz que el bot para pausar la música.")] 
      });
    }

    if (player.paused) {
      player.pause(false);
      return message.reply({ 
        embeds: [embed.setDescription("Música reanudada.")] 
      });
    } else {
      player.pause(true);
      return message.reply({ 
        embeds: [embed.setDescription("Música pausada.")] 
      });
    }
  },
};
