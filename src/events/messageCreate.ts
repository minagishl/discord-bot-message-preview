import { Events, type Message } from "discord.js";

export default {
  name: Events.MessageCreate,
  async execute(message: Message): Promise<void> {
    if (message.author.bot || !message.inGuild()) return;

    // Regular expression checks for inclusion of Discord message links
    const messageLinkRegex =
      /https:\/\/discord\.com\/channels\/(\d{19})\/(\d{19})\/(\d{19})/g;
    if (!messageLinkRegex.test(message.content)) return;

    const messageLink = message.content.match(messageLinkRegex);

    if (messageLink === null) return;

    // Process all message links
    for (const link of messageLink) {
      const [guildId, channelId, messageId] = link.split("/").slice(-3);
      if (!guildId || !channelId || !messageId) continue;

      try {
        // Check if the guild exists.
        const guild = await message.client.guilds.fetch(guildId);
        if (!guild) {
          console.error("Guild not found");
          continue;
        }

        // Check if the channel exists.
        const channel = await guild.channels.fetch(channelId);
        if (!channel) {
          console.error("Channel not found");
          continue;
        }

        if (!channel.isTextBased()) {
          console.error("Channel is not text-based");
          continue;
        }
        const linkMessage = await channel.messages.fetch(messageId);
        await message.channel.send({
          embeds: [
            {
              description: linkMessage.content,
              color: undefined,
              author: {
                name: linkMessage.author.tag,
                url: linkMessage.url,
                icon_url: linkMessage.author.displayAvatarURL(),
              },
              footer: {
                text: `In #${channel.name} - ${linkMessage.createdAt.toLocaleString()}`,
                icon_url: guild.iconURL() ?? "",
              },
            },
          ],
        });
      } catch (error) {
        console.error(`Error processing message link: ${link}`, error);
      }
    }
  },
};
