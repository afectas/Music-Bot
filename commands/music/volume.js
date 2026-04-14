import DiscordJS from "discord.js";
const { EmbedBuilder } = DiscordJS;

export default {
  name: "volume",
  aliases: ["vol", "v"],
  async execute(client, message, args) {
    const player = client.riffy.players.get(message.guild.id);
    const embed = new EmbedBuilder().setColor("#ffffff");

    if (!player) {
      return message.reply({ 
        embeds: [embed.setDescription(" No hay música sonando en este servidor.")] 
      });
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel || voiceChannel.id !== player.voiceChannel) {
      return message.reply({ 
        embeds: [embed.setDescription("Debes estar en el mismo canal de voz que el bot para cambiar el volumen.")] 
      });
    }

    const volume = parseInt(args[0]);
    if (!args[0] || isNaN(volume)) {
      return message.reply({ 
        embeds: [embed.setDescription(`🔊 El volumen actual es: **${player.volume}%**`)] 
      });
    }

    if (volume < 0 || volume > 100) {
      return message.reply({ 
        embeds: [embed.setDescription("Por favor, elige un volumen entre **0 y 100**.")] 
      });
    }

    player.setVolume(volume);
    return message.reply({ 
      embeds: [embed.setDescription(`Volumen actualizado a: **${volume}%**`)] 
    });
  },
};
