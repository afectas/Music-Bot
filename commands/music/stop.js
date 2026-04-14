import DiscordJS from "discord.js";
const { EmbedBuilder } = DiscordJS;

export default {
  name: "stop",
  aliases: ["dc", "leave", "parar"],
  async execute(client, message, args) {
    const player = client.riffy.players.get(message.guild.id);
    const embed = new EmbedBuilder().setColor("#ffffff");

    if (!player) {
      return message.reply({ 
        embeds: [embed.setDescription("No hay música sonando en este servidor.")] 
      });
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel || voiceChannel.id !== player.voiceChannel) {
      return message.reply({ 
        embeds: [embed.setDescription("Debes estar en el mismo canal de voz que el bot para detener la música.")] 
      });
    }

    try {
        player.destroy(); 
        
        return message.reply({ 
          embeds: [embed.setDescription("La música se ha detenido y la cola ha sido borrada.")] 
        });
    } catch (error) {
        console.error(error);
        return message.reply("Ocurrió un error al intentar detener el reproductor.");
    }
  },
};
