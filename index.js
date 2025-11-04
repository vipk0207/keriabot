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
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const activeBosses = new Map();
const userScores = new Map();

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} 로그인 완료!`);
});

// ======================================
// 단계별 대화형 .시작 명령
// ======================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  const content = message.content.trim();

  // 1️⃣ .시작
  if (content === '.시작') {
    const filter = (m) => m.author.id === message.author.id;
    await message.reply('💬 보스 이름을 입력해주세요.');
    const collectedName = await message.channel.awaitMessages({ filter, max: 1, time: 30000 });
    if (!collectedName.size) return message.reply('⏰ 시간이 초과되었습니다.');
    const bossName = collectedName.first().content;

    await message.reply('💬 점수를 입력해주세요 (숫자).');
    const collectedScore = await message.channel.awaitMessages({ filter, max: 1, time: 30000 });
    if (!collectedScore.size) return message.reply('⏰ 시간이 초과되었습니다.');
    const bossScore = parseInt(collectedScore.first().content);
    if (isNaN(bossScore)) return message.reply('❌ 점수는 숫자만 입력해주세요.');

    await message.reply('💬 참여 가능한 시간을 입력해주세요 (분 단위).');
    const collectedTime = await message.channel.awaitMessages({ filter, max: 1, time: 30000 });
    if (!collectedTime.size) return message.reply('⏰ 시간이 초과되었습니다.');
    const timeLimit = parseInt(collectedTime.first().content);
    if (isNaN(timeLimit)) return message.reply('❌ 시간은 숫자만 입력해주세요.');

    // 보스 등록
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

    activeBosses.set(sentMsg.id, {
      bossName,
      bossScore,
      participants,
      endTime,
      message: sentMsg,
    });

    setTimeout(async () => {
      const boss = activeBosses.get(sentMsg.id);
      if (!boss) return;

      const list = [...boss.participants];
      list.forEach((user) => {
        const prev = userScores.get(user) || 0;
        userScores.set(user, prev + boss.bossScore);
      });

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

  // 2️⃣ .참여
  if (content.startsWith('.참여')) {
    const args = content.split(' ').slice(1);
    const bossName = args[0];
    if (!bossName) return message.reply('❌ 사용법: `.참여 [보스이름]`');

    const boss = [...activeBosses.values()].find(b => b.bossName === bossName);
    if (!boss) return message.reply(`❌ ${bossName} 보스는 현재 진행 중이 아닙니다.`);

    boss.participants.add(message.author.username);

    const list = [...boss.participants];
    const remaining = Math.max(0, Math.round((boss.endTime - Date.now()) / 60000));

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle(`💀 ${boss.bossName} (${boss.bossScore}점) 보스 참여 중`)
      .setDescription(`⏰ 남은시간: ${remaining}분\n\n✅ 참여자 (${list.length}명):\n${list.join(', ')}`);

    await boss.message.edit({ embeds: [embed], components: boss.message.components });
    await message.reply(`✅ ${bossName} 참여 완료!`);
  }

  // 3️⃣ .보스목록
  if (content === '.보스목록') {
    if (activeBosses.size === 0) return message.reply('현재 진행 중인 보스가 없습니다.');

    const list = [...activeBosses.values()]
      .map(
        (b) =>
          `💀 **${b.bossName}** (${b.bossScore}점) — 남은시간 ${Math.max(
            0,
            Math.round((b.endTime - Date.now()) / 60000)
          )}분 — 참여자 ${b.participants.size}명`
      )
      .join('\n');

    await message.reply(`현재 진행 중인 보스 목록:\n${list}`);
  }

  // 4️⃣ .점수합산
  if (content === '.점수합산') {
    if (userScores.size === 0) return message.reply('아직 점수가 기록된 유저가 없습니다.');

    const sorted = [...userScores.entries()].sort((a, b) => b[1] - a[1]);
    const result = sorted
      .map(([user, score], idx) => `${idx + 1}. ${user} — ${score}점`)
      .join('\n');

    const embed = new EmbedBuilder()
      .setColor(0xf1c40f)
      .setTitle('💎 참여 점수 합산 순위')
      .setDescription(result);

    await message.reply({ embeds: [embed] });
  }
});

// 버튼 클릭 처리
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const boss = activeBosses.get(interaction.message.id);
  if (!boss) return interaction.reply({ content: '❌ 이미 종료된 보스입니다.', ephemeral: true });

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
