import { Events, type Message, EmbedBuilder } from 'discord.js';

export default {
  name: Events.MessageCreate,
  async execute(message: Message): Promise<void> {
    if (message.author.bot || !message.inGuild()) return;

    // Regular expression checks for inclusion of Discord message links
    const messageLinkRegex =
      /https:\/\/(ptb\.)?discord\.com\/channels\/(\d{19})\/(\d{19})\/(\d{19})/g;
    if (!messageLinkRegex.test(message.content)) return;

    const messageLink = message.content.match(messageLinkRegex);

    if (messageLink === null) return;

    // Process all message links
    for (const link of messageLink) {
      const [guildId, channelId, messageId] = link.split('/').slice(-3);
      if (!guildId || !channelId || !messageId) continue;

      try {
        // Check if the guild exists.
        const guild = await message.client.guilds.fetch(guildId);
        if (!guild) {
          console.error('Guild not found');
          continue;
        }

        // Check if the channel exists.
        const channel = await guild.channels.fetch(channelId);
        if (!channel) {
          console.error('Channel not found');
          continue;
        }

        if (!channel.isTextBased()) {
          console.error('Channel is not text-based');
          continue;
        }

        const linkMessage = await channel.messages.fetch(messageId);
        const isPrivacyMode = message.content.startsWith('!privacy');

        const footerText = isPrivacyMode
          ? 'Cannot display due to private setting'
          : `In #${channel.name} - ${linkMessage.createdAt
              .toLocaleString('ja-JP', {
                timeZone: 'Asia/Tokyo',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })
              .replace(/\//g, '/')}`;

        const embed = linkMessage.content
          ? new EmbedBuilder()
              .setDescription(linkMessage.content)
              .setFooter({ text: footerText, iconURL: guild.iconURL() ?? '' })
              .setURL(linkMessage.url)
          : '';

        if (!isPrivacyMode && embed !== '') {
          embed.setAuthor({
            name: linkMessage.author.tag,
            iconURL: linkMessage.author.displayAvatarURL(),
          });
        }

        const files = linkMessage.attachments
          .map((attachment) => {
            const fileName = attachment.name ?? 'file';
            const fileUrl = attachment.url ?? attachment.proxyURL ?? '';
            return `- [${fileName}](${fileUrl})`;
          })
          .join('\n');

        const nullEmbed = embed !== '';

        // Send the message content and the embed
        if (files) {
          await message.channel.send(
            'The attached file:\n' +
              files +
              (nullEmbed
                ? ''
                : `\nAuthor: ${isPrivacyMode ? 'Private' : linkMessage.author.tag}\n${footerText}`),
          );
        }

        if (nullEmbed) {
          await message.channel.send({ embeds: [embed] });
        }
      } catch (error) {
        if (
          error instanceof Error &&
          !error.message.includes('Unknown Guild')
        ) {
          console.error(`Error processing message link: ${link}`, error);
        }
      }
    }
  },
};
