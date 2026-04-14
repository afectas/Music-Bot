import { Client, GatewayIntentBits, Collection } from "discord.js";
import { Riffy } from "riffy";
import fs from "fs";
import path from "path";
import chalk from "chalk";

import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const token = "token";
const prefix = "$";
const nodes = [
    {
        host: "TU_HOST_LAVALINK", 
        port: 2333,
        password: "youshallnotpass",
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
    if (channel) channel.send(`🎶 Reproduciendo ahora: **${track.info.title}**`);
});

client.riffy.on("queueEnd", async (player) => {
    const channel = client.channels.cache.get(player.textChannel);
    if (channel) channel.send("👋 La lista se ha terminado, saliendo del canal.");
    player.destroy();
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
