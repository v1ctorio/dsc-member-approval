import { ApplicationCommandManager, REST, RESTPostAPIChatInputApplicationCommandsJSONBody, Routes, SlashCommandBuilder } from "discord.js";
import { config } from "dotenv";
config()

const commands = new Map();

commands.set("ping",
    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!")
);
 

export async function registerCommandsREST() {
    const rest = new REST({ version: "9" }).setToken(process.env.DISCORD_TOKEN as string);
    let cmds: RESTPostAPIChatInputApplicationCommandsJSONBody[] = [];
    commands.forEach((value: SlashCommandBuilder, key) => {
        cmds.push(value.toJSON());
    });
    await rest.put(
        Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID as string, process.env.DISCORD_GUILD as string),
        { body: commands }
    );
    console.log(`Registered all ${cmds.length} commands`);
}

registerCommandsREST();
