const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const { token, verifiedRoleId } = require('./config.json');
const { generateCaptcha } = require('./captcha.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for(const folder of commandFolders){
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
    for(const file of commandFiles){
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        if('data' in command && 'execute' in command){
            client.commands.set(command.data.name, command);
        } else {
            console.log(`The command at ${filePath} is missing a required "data or "execute" property.`)
        }
    }
}

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

const captchaMap = new Map();

client.on(Events.InteractionCreate, async (interaction) => {
    if(interaction.isChatInputCommand()){
        const command = client.commands.get(interaction.commandName);
        if(!command){
            return;
        }
        try{
            await command.execute(interaction);
        } catch (err){
            console.error(err);
            if(interaction.replied || interaction.deferred){
                await interaction.followUp({
                    content: "There was an error executing this command.",
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: "There was an error executing this command.",
                    ephemeral: true
                });
            }
        }
    }
    if(interaction.isButton()){
        if(interaction.customId !== "verify_button") return;
        const captcha = generateCaptcha();
        captchaMap.set(interaction.user.id, captcha.text);
        await interaction.reply({
            content: "Complete this CAPTCHA to verify",
            files: [{
                attachment: captcha.buffer,
                name: "captcha.png"
            }],
            ephemeral: true
        });
        setTimeout(() => {
            captchaMap.delete(interaction.user.id);
        }, 2 * 60 * 1000)
    }
})

client.on(Events.MessageCreate, async (message) => {
    if(message.author.bot) return;
    const expected = captchaMap.get(message.author.id);
    if(!expected) return;

    if(message.content.trim().toUpperCase() == expected){
        const role = message.guild.roles.cache.get(verifiedRoleId);
        if(!role){
            return message.reply("Verified role not found!");
        }
        const member = await message.guild.members.fetch(message.author.id);
        await member.roles.add(role);
        captchaMap.delete(message.author.id);
        await message.delete();
    }
    if(message.content.trim().toUpperCase() !== expected){
        await message.delete();
    }
})

client.login(token);