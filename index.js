import { Client, GatewayIntentBits, Collection } from "discord.js";
import { Manager } from "erela.js";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent
    ]
});

client.manager = new Manager({
    nodes: [
        {
            host: "TU_HOST_LAVALINK", 
            port: 2333,
            password: "youshallnotpass",
            secure: false 
        }
    ],
    send(id, payload) {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    }
})
.on("nodeConnect", node => console.log(chalk.green(`[Lavalink] Nodo ${node.options.host} conectado.`)))
.on("nodeError", (node, error) => console.log(chalk.red(`[Lavalink] Error en nodo ${node.options.host}: ${error.message}`)))
.on("trackStart", (player, track) => {
    client.channels.cache.get(player.textChannel).send(` Sonando ahora: **${track.title}**`);
})
.on("queueEnd", player => {
    client.channels.cache.get(player.textChannel).send("Lista terminada. Saliendo...");
    player.destroy();
});

client.commands = new Collection();
const prefix = ",";

const loadCommands = async () => {
    const foldersPath = path.join(__dirname, "commands");
    if (!fs.existsSync(foldersPath)) return;
    for (const folder of fs.readdirSync(foldersPath)) {
        const files = fs.readdirSync(path.join(foldersPath, folder)).filter(f => f.endsWith(".js"));
        for (const file of files) {
            const { default: cmd } = await import(`./commands/${folder}/${file}`);
            if (cmd?.name) client.commands.set(cmd.name, cmd);
        }
    }
};

client.on("raw", d => client.manager.updateVoiceState(d));

client.on("ready", () => {
    client.manager.init(client.user.id);
    console.log(chalk.magentaBright(`
    ╔══════════════════════════════════════╗
    ║        MUSIC BOT (LAVALINK)          ║
    ╚══════════════════════════════════════╝
    [$] BOT: ${client.user.tag}
    `));
});

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (command) {
        try {
            await command.execute(client, message, args);
        } catch (error) {
            console.error(error);
        }
    }
});

await loadCommands();
client.login("token");
