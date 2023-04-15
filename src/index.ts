import { config } from "dotenv";
import { ButtonBuilder, ButtonInteraction, ButtonStyle, Client, Collection, CommandInteraction, GuildScheduledEvent, Interaction, PermissionsBitField, TextChannel } from "discord.js";
config();
const { DISCORD_TOKEN, DISCORD_GUILD, DISCORD_MANAGMENT_CHANNEL } = process.env;
if (!DISCORD_TOKEN || !DISCORD_GUILD || !DISCORD_MANAGMENT_CHANNEL) throw new Error("Missing env variables");
const JOIN_TIMEOUT = Number(process.env.JOIN_TIMEOUT) ?? 60 * 60 * 60 * 12;
const client = new Client({
    intents: ["Guilds", "GuildInvites", "GuildMembers"]
});
const timeouts = new Collection();

client.on("ready", async () => {

    const guilds = await client.guilds.fetch();
    const guild = client.guilds.cache.get(DISCORD_GUILD as string);
    if (guilds.first()?.id == DISCORD_GUILD && guilds.size > 1) console.log("\x1b[33m", "WARNING: This bot is in multiple guilds.");
    if (!guilds.has(DISCORD_GUILD)) throw new Error("This bot is not in the target guild.");
    console.log(`Guild successfully found: ${guild?.name} (${guild?.id})`);
    const channel = guild?.channels.cache.get(DISCORD_MANAGMENT_CHANNEL as string);
    if (!channel) throw new Error("Channel not found.");
    console.log(`Channel successfully found: ${channel.name} (${channel.id})`)
    const perms = channel?.permissionsFor(client.user?.id as string);
    if (!perms?.has(PermissionsBitField.Flags.SendMessages)) throw new Error("Missing SEND_MESSAGES permission.");
    console.log('Permissions successfully checked: SEND_MESSAGES');
    




    console.log(`Ready as ${client.user?.tag} on ${guild?.name} (${guild?.id})`);
});

client.on("interactionCreate", async interaction => {
    if (interaction.isCommand()) SlashCommandHandle(interaction);

});

async function SlashCommandHandle(interaction: CommandInteraction) {
    if (interaction.command?.name == "ping") interaction.reply("Pong!");
}
async function ButtonHandle(interaction: ButtonInteraction) {
    const [action, targetId] = interaction.customId.split("-");
    const target = await interaction.guild?.members.fetch(targetId);
    const timeout = timeouts.get(targetId);
    
    if (!target) return interaction.reply({ content: "User not found.", ephemeral: true });

    if (action == "approve") {
        clearTimeout(timeout as NodeJS.Timeout);
        timeouts.delete(targetId);
        await interaction.reply({ content: `${interaction.user.tag} approved ${target.user.tag}` });
    } else if (action == "deny") {
        clearTimeout(timeout as NodeJS.Timeout);
        timeouts.delete(targetId);
        await target.kick("User didn't got approved on time.");
        await interaction.reply({ content: `${interaction.user.tag} denied ${target.user.tag}` });
    }
}


client.on("guildMemberAdd", async member => {
    const guild = client.guilds.cache.get(DISCORD_GUILD as string);
    const channel = guild?.channels.cache.get(DISCORD_MANAGMENT_CHANNEL as string) as TextChannel;  

    const targetId = member.id;

    const kickUserTimeout = setTimeout(async () => {
        await member.kick("User didn't got approved on time.");
        await channel?.send(`User ${member.user.tag} didn't got aprroved on time.`);
    }, JOIN_TIMEOUT);

    timeouts.set(targetId, kickUserTimeout);

    const approveButton = new ButtonBuilder()
    .setLabel("Approve")
    .setStyle(ButtonStyle.Success)
    .setCustomId("approve-"+targetId);
    const denyButton = new ButtonBuilder()
    .setLabel("Deny")
    .setStyle(ButtonStyle.Danger)
    .setCustomId("deny-"+targetId);
    
    const msg = await channel?.send(`User ${member.user.tag} joined the server. Do you want to approve them?`);
});

client.login(process.env.DISCORD_TOKEN);
