import DiscordJS from "discord.js";
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = DiscordJS;

export default {
  name: "play",
  aliases: ["p"],
  async execute(client, message, args) {
    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
        return message.reply("Debes estar en un canal de voz.");
    }

    const query = args.join(" ");
    if (!query) return message.reply("Escribe el nombre o link de una canción.");

    let player = client.riffy.createConnection({
      guildId: message.guild.id,
      voiceChannel: voiceChannel.id,
      textChannel: message.channel.id,
      deaf: true,
    });

    const resolve = await client.riffy.resolve({ query, requester: message.author });
    const { loadType, tracks, playlistInfo } = resolve;

    if (loadType === "error" || !tracks || tracks.length === 0) {
        return message.reply(" No encontré resultados para tu búsqueda.");
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("music_pause").setEmoji("⏸️").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("music_skip").setEmoji("⏭️").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("music_stop").setEmoji("⏹️").setStyle(ButtonStyle.Danger)
    );

    const embedColor = "#fffff"; 

    if (loadType === "playlist") {
      for (const track of tracks) {
        track.info.requester = message.author;
        player.queue.add(track);
      }
      
      if (!player.playing) player.play();

      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle("Playlist Añadida")
        .setDescription(`Se han cargado **${tracks.length}** canciones de **${playlistInfo.name}**`)
        .setThumbnail(tracks[0].info.thumbnail || null)
        .setFooter({ text: `Solicitado por: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

      return message.reply({ embeds: [embed], components: [row] });
    }

    const track = tracks[0];
    track.info.requester = message.author;
    player.queue.add(track);
    
    if (!player.playing) player.play();

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle("Canción Añadida")
      .setDescription(`[${track.info.title}](${track.info.uri})`)
      .setThumbnail(track.info.thumbnail || null)
      .addFields(
        { name: "Autor", value: `\`${track.info.author}\``, inline: true },
        { name: "Duración", value: `\`${new Date(track.info.length).toISOString().slice(11, 19)}\``, inline: true }
      )
      .setFooter({ text: `Solicitado por: ${message.author.tag}`, iconURL: message.author.displayAvatarURL() });

    return message.reply({ embeds: [embed], components: [row] });
  },
};
