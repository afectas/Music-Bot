import { Client, GatewayIntentBits, Collection, EmbedBuilder } from "discord.js";
import { Riffy } from "riffy";
import fs from "fs";
import path from "path";
import chalk 

from "chalk";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const token = "";
const prefix = "$"; 
const nodes = [
    {
        host: "lavalinkv4.serenetia.com", 
        port: 80,
        password: "https://dsc.gg/ajidevserver",
        secure: false
    }
];

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

client.riffy = new Riffy(client, nodes, {
    send: (payload) => {
        const guild = client.guilds.cache.get(payload.d.guild_id);
        if (guild) guild.shard.send(payload);
    },
    defaultSearchPlatform: "ytmsearch", 
    restVersion: "v4" 
});

client.riffy.on("nodeConnect", (node) => {
    console.log(chalk.green(`[Lavalink] Nodo conectado: ${node.name}`));
});

client.riffy.on("nodeError", (node, error) => {
    console.log(chalk.red(`[Lavalink] Error en nodo ${node.name}: ${error.message}`));
});

client.riffy.on("trackStart", async (player, track) => {
    const channel = client.channels.cache.get(player.textChannel);
    if (!channel) return;

    const embed = new EmbedBuilder()
        .setColor("#ffffff")
        .setTitle(" Reproduciendo ahora")
        .setDescription(`[${track.info.title}](${track.info.uri})`)
        .setThumbnail(track.info.thumbnail)
        .setFooter({ text: `Autor: ${track.info.author}` });

    channel.send({ embeds: [embed] });
});

client.riffy.on("queueEnd", async (player) => {
    const channel = client.channels.cache.get(player.textChannel);
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor("#ffffff")
            .setDescription(" **La lista ha terminado. Saliendo del canal...**");
        channel.send({ embeds: [embed] });
    }
    player.destroy();
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    const player = client.riffy.players.get(interaction.guildId);
    if (!player) return interaction.reply({ content: " No hay música sonando.", ephemeral: true });

    const embed = new EmbedBuilder().setColor("#ffffff");

    try {
        if (interaction.customId === "music_pause") {
            const isPaused = player.paused;
            player.pause(!isPaused);
            embed.setDescription(isPaused ? " **Música reanudada**" : " **Música pausada**");
            return interaction.reply({ embeds: [embed] });
        }

        if (interaction.customId === "music_skip") {
            player.stop();
            embed.setDescription(" **Canción saltada vía botón**");
            return interaction.reply({ embeds: [embed] });
        }

        if (interaction.customId === "music_stop") {
            player.destroy();
            embed.setDescription(" **Reproducción detenida por el usuario**");
            return interaction.reply({ embeds: [embed] });
        }
    } catch (e) {
        console.error(e);
    }
});

const loadCommands = async () => {
    const commandsPath = path.join(__dirname, "commands");
    if (!fs.existsSync(commandsPath)) return;
    
    const folders = fs.readdirSync(commandsPath);
    for (const folder of folders) {
        const files = fs.readdirSync(path.join(commandsPath, folder)).filter(f => f.endsWith(".js"));
        for (const file of files) {
            const { default: cmd } = await import(`./commands/${folder}/${file}`);
            if (cmd?.name) client.commands.set(cmd.name, cmd);
        }
    }
};

client.on("raw", (d) => client.riffy.updateVoiceState(d));

client.on("ready", () => {
    client.riffy.init(client.user.id);
    console.log(chalk.magentaBright(`
    ╔══════════════════════════════════════╗
    ║        RIFFY MUSIC BOT OK            ║
    ╚══════════════════════════════════════╝
    [$] BOT: ${client.user.tag}
    [$] NODOS: ${client.riffy.nodes.size}
    `));
});

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(c => c.aliases?.includes(commandName));

    if (command) {
        try {
            await command.execute(client, message, args);
        } catch (error) {
            console.error(chalk.red(`[X] Error en ${commandName}:`), error);
        }
    }
});

await loadCommands();
client.login(token);
