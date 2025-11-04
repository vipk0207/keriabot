import { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Message, Partials.Channel],
});

const TOKEN = process.env.DISCORD_TOKEN;
let bossList = [];

// =======================
// 봇 로그인
// =======================
client.once("ready", () => {
  console.log(`✅ ${client.user.tag} 로그인 완료!`);
});

// =======================
// 명령어 처리 (.등록, .목록, .참여)
// =======================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(".")) return;

  const args = message.content.slice(1).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  // 🔹 보스 등록 (.등록 타가르 1 18:30)
  if (command === "등록") {
    const [bossName, score, time] = args;

    if (!bossName || !score || !time) {
      return message.reply("❌ 사용법: `.등록 보스이름 점수 시간` (예: `.등록 타가르 1 18:30`)");
    }

    bossList.push({ name: bossName, score, time, participants: [], notified: false });
    const embed = new EmbedBuilder()
      .setColor(0x00ff99)
      .setTitle(`✅ ${bossName} (${score}점) 보스가 ${time}에 등록되었습니다!`)
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  }

  // 🔹 등록된 보스 목록 보기 (.목록)
  else if (command === "목록") {
    if (bossList.length === 0) return message.reply("📭 등록된 보스가 없습니다.");

    const list = bossList
      .map((b, i) => `💎 ${i + 1}. ${b.name} (${b.score}점) - ${b.time}`)
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle("📋 등록된 보스 목록")
      .setDescription(list);

    await message.channel.send({ embeds: [embed] });
  }
});

// =======================
// 자동 젠 알림 (1분마다 확인)
// =======================
setInterval(async () => {
  const now = new Date();
  const currentTime = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;

  for (const boss of bossList) {
    if (boss.time === currentTime && !boss.notified) {
      boss.notified = true;

      const embed = new EmbedBuilder()
        .setColor(0xffc107)
        .setTitle(`⚔️ ${boss.name} 젠 시간입니다!`)
        .setDescription(`점수: ${boss.score}점\n\n참여하려면 아래 버튼을 눌러주세요.`)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`join_${boss.name}`)
          .setLabel("✅ 참여하기")
          .setStyle(ButtonStyle.Success)
      );

      const channel = client.channels.cache.find(
        (ch) => ch.name === "보스알림" || ch.name === "보스시간표"
      );
      if (channel) await channel.send({ embeds: [embed], components: [row] });
    }
  }
}, 60000); // 1분마다 확인

// =======================
// 참여 버튼 클릭 이벤트
// =======================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  const bossName = interaction.customId.replace("join_", "");
  const boss = bossList.find((b) => b.name === bossName);
  if (!boss) return;

  if (!boss.participants.includes(interaction.user.username)) {
    boss.participants.push(interaction.user.username);
  }

  const embed = new EmbedBuilder()
    .setColor(0x00ff99)
    .setTitle(`✅ ${boss.name} 참여자 목록`)
    .setDescription(boss.participants.map((p, i) => `${i + 1}. ${p}`).join("\n") || "아직 없음");

  await interaction.update({ embeds: [embed], components: interaction.message.components });
});

client.login(TOKEN);
