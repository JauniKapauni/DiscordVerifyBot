const { Client, Events, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const { token, verifiedRoleId, verifyChannelId } = require('./config.json');
const { generateCaptcha } = require('./captcha.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);

    const channel = await client.channels.fetch(verifyChannelId);
    const button = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("verify_button").setLabel("Verify").setStyle(ButtonStyle.Success));
    channel.send({
        content: "Click the button below to verify yourself",
        components: [button]
    });
});

const captchaMap = new Map();

client.on(Events.InteractionCreate, async (interaction) => {
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
    }
})

client.login(token);