import { Events, type Interaction } from 'discord.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction): Promise<void> {
    // Check if the interaction is a chat input command
    if (!interaction.isChatInputCommand()) return;

    // If the interaction is not in a guild, send a DM block embed and delete it after 5 seconds
    if (interaction.guild == null) {
      await interaction.reply('This command can only be used in a server.');
      return;
    }

    // Get the command object from the client's commands collection
    const command = interaction.client.commands.get(
      interaction.commandName,
    ) as {
      execute: (interaction: Interaction) => Promise<void>;
    };

    // If the command does not exist, log an error and return
    if (command === undefined) {
      console.error(`The command ${interaction.commandName} does not exist.`);
      return;
    }

    try {
      if (command === null) {
        console.error(`The command ${interaction.commandName} is null.`);
        return;
      }

      // Execute the command and log the result
      await command.execute(interaction);
      console.log(
        `The ${interaction.commandName} command has been executed <${interaction.user.id}>`,
      );
    } catch (err: any) {
      // If an error occurs, log the error and send an error message to the user
      console.error(err);
      await interaction.reply('An error occurred while executing the command.');
    }
  },
};
