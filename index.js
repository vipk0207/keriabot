import {
  Client,
  GatewayIntentBits,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder
} from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// 🔹 현재 진행중인 보스 저장
const activeBosses = new Map();

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} 로그인 완료!`);
});

// 🔹 일반 명령 (.시작)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // .시작 [보스이름] [점수] [시간]
  if (message.content.startsWith('.시작')) {
    const args = message.content.split(' ').slice(1);
    const bossName = args[0];
    const bossScore = parseInt(args[1]) || 1;
    const timeLimit = parseInt(args[2]) || 10;

    if (!bossName) {
      await message.reply('❌ 사용법: `.시작 [보스이름] [점수] [시간(분)]`');
      return;
    }

    const endTime = Date.now() + timeLimit * 60 * 1000;
    const participants = new Set();

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(`💀 ${bossName} (${bossScore}점) 보스 참여 시작!`)
      .setDescription(`⏰ 남은시간: ${timeLimit}분\n\n✅ 참여자 (0명): 없음`);

    const button = new ButtonBuilder()
      .setCustomId(`join_${bossName}`)
      .setLabel('✅ 참여하기')
      .setStyle(ButtonStyle.Success);

    const row = new ActionRowBuilder().addComponents(button);

    const sentMsg = await message.channel.send({ embeds: [embed], components: [row] });

    // 저장
    activeBosses.set(sentMsg.id, {
      bossName,
      bossScore,
      participants,
      endTime,
      message: sentMsg,
    });

    // 타이머
    setTimeout(async () => {
      const boss = activeBosses.get(sentMsg.id);
      if (!boss) return;

      const list = [...boss.participants];
      const resultEmbed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle(`⏰ ${boss.bossName} 종료`)
        .setDescription(
          `총 참여자: ${list.length}명\n점수: ${boss.bossScore}점\n\n${list.length > 0 ? list.join(', ') : '참여자 없음'}`
        );

      await sentMsg.edit({ embeds: [resultEmbed], components: [] });
      activeBosses.delete(sentMsg.id);
    }, timeLimit * 60 * 1000);
  }
});

// 🔹 버튼 클릭 처리
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const boss = activeBosses.get(interaction.message.id);
  if (!boss) {
    await interaction.reply({ content: '❌ 이미 종료된 보스입니다.', ephemeral: true });
    return;
  }

  boss.participants.add(interaction.user.username);

  const list = [...boss.participants];
  const remaining = Math.max(0, Math.round((boss.endTime - Date.now()) / 60000));

  const embed = new EmbedBuilder()
    .setColor(0x2ecc71)
    .setTitle(`💀 ${boss.bossName} (${boss.bossScore}점) 보스 참여 중`)
    .setDescription(`⏰ 남은시간: ${remaining}분\n\n✅ 참여자 (${list.length}명):\n${list.join(', ')}`);

  await interaction.update({ embeds: [embed], components: interaction.message.components });
});

client.login(TOKEN);
