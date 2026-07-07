const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder().setName('create-panel').setDescription('Creates the verification panel'),
    async execute(interaction){
        if(!interaction.member.permissions.has("Administrator")){
            return interaction.reply({
                content: "You don't have permission to do this.",
                ephemeral: true
            });
        }
        const button = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("verify_button").setLabel("Verify").setStyle(ButtonStyle.Success));
        await interaction.channel.send({
            content: "Click the button below to verify yourself",
            components: [button]
        });
        await interaction.reply({
            content: "Verification panel created!",
            ephemeral: true
        });
    }
}