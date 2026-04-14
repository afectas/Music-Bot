import DiscordJS from "discord.js";
const { EmbedBuilder } = DiscordJS;

const skipVotes = new Map();

export default {
  name: "skip",
  aliases: ["s", "next"],
  async execute(client, message, args) {
    const player = client.riffy.players.get(message.guild.id);
    const embed = new EmbedBuilder().setColor("#ffffff"); 

    if (!player) {
      return message.reply({ 
        embeds: [embed.setDescription("No hay música sonando")] 
      });
    }

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel || voiceChannel.id !== player.voiceChannel) {
      return message.reply({ 
        embeds: [embed.setDescription("Debes estar en el mismo canal de voz que el bot.")] 
      });
    }

    const membersInChannel = voiceChannel.members.filter(m => !m.user.bot).size;

    if (membersInChannel === 1) {
      player.stop();
      return message.reply({ 
        embeds: [embed.setDescription("Saltada directamente.")] 
      });
    }

    if (!skipVotes.has(message.guild.id)) {
      skipVotes.set(message.guild.id, new Set());
    }

    const votes = skipVotes.get(message.guild.id);

    if (votes.has(message.author.id)) {
      return message.reply({ 
        embeds: [embed.setDescription("Ya has votado para saltar esta canción.")] 
      });
    }

    votes.add(message.author.id);

    const needed = 2; 

    if (votes.size >= needed) {
      skipVotes.delete(message.guild.id);
      player.stop();
      return message.reply({ 
        embeds: [embed.setDescription("Votos suficientes. Saltando canción...")] 
      });
    } else {
      return message.reply({ 
        embeds: [embed.setDescription(`**Voto registrado.** Se necesita que **otro amigo** use el comando para saltar (\`${votes.size}/${needed}\`).`)] 
      });
    }
  },
};
