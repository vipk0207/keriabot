import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const bossList = new Map(); // {bossName: {score, time, participants: []}}
const timezoneOffset = 9; // 한국시간 보정

client.once("ready", () => {
  console.log(`✅ ${client.user.tag} 로그인 완료!`);
  checkBossTimes();
  setInterval(checkBossTimes, 60000);
});

function getKST() {
  const now = new Date();
  now.setHours(now.getHours() + timezoneOffset);
  return now;
}

function formatTime(date) {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

// ========== 명령 처리 ==========
client.on("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.content.startsWith(".")) return;
  const args = msg.content.slice(1).trim().split(" ");
  const command = args.shift();

  // === 1. 보스 등록 ===
  if (command === "등록") {
    const [bossName, score, time] = args;
    if (!bossName || !score || !time)
      return msg.reply("❌ 사용법: `.등록 보스이름 점수 시간` (예: `.등록 타가르 1 18:45`)");

    bossList.set(bossName, {
      score: parseInt(score),
      time,
      participants: [],
    });

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("✅ 보스 등록 완료")
      .setDescription(`**${bossName}** (${score}점) 보스가 ${time}에 등록되었습니다!`);

    return msg.channel.send({ embeds: [embed] });
  }

  // === 2. 보스 목록 ===
  if (command === "목록") {
    if (bossList.size === 0) return msg.reply("📭 등록된 보스가 없습니다.");

    let desc = "";
    for (const [name, data] of bossList) {
      desc += `💎 **${name}** (${data.score}점) - ${data.time}\n`;
    }

    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setTitle("📋 등록된 보스 목록")
      .setDescription(desc);

    return msg.channel.send({ embeds: [embed] });
  }

  // === 3. 참여 ===
  if (command === "참여") {
    const bossName = args[0];
    if (!bossName) return msg.reply("❌ 사용법: `.참여 보스이름`");
    const boss = bossList.get(bossName);
    if (!boss) return msg.reply("⚠️ 등록되지 않은 보스입니다.");

    if (boss.participants.includes(msg.author.username))
      return msg.reply("이미 참여하셨습니다.");

    boss.participants.push(msg.author.username);

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle(`✅ ${bossName} 참여 완료`)
      .setDescription(`현재 참여자: ${boss.participants.join(", ")}`);

    return msg.channel.send({ embeds: [embed] });
  }

  // === 4. 점수 추가 ===
  if (command === "점수추가") {
    const [bossName, add] = args;
    if (!bossName || !add)
      return msg.reply("❌ 사용법: `.점수추가 보스이름 점수`");
    const boss = bossList.get(bossName);
    if (!boss) return msg.reply("⚠️ 등록되지 않은 보스입니다.");

    boss.score += parseInt(add);

    const embed = new EmbedBuilder()
      .setColor("Yellow")
      .setTitle("⭐ 점수 추가 완료")
      .setDescription(`**${bossName}** 점수: ${boss.score}점`);

    return msg.channel.send({ embeds: [embed] });
  }

  // === 5. 점수 빼기 ===
  if (command === "점수빼기") {
    const [bossName, minus] = args;
    if (!bossName || !minus)
      return msg.reply("❌ 사용법: `.점수빼기 보스이름 점수`");
    const boss = bossList.get(bossName);
    if (!boss) return msg.reply("⚠️ 등록되지 않은 보스입니다.");

    boss.score -= parseInt(minus);

    const embed = new EmbedBuilder()
      .setColor("Red")
      .setTitle("⚠️ 점수 차감 완료")
      .setDescription(`**${bossName}** 점수: ${boss.score}점`);

    return msg.channel.send({ embeds: [embed] });
  }

  // === 6. 초기화 ===
  if (command === "초기화") {
    bossList.clear();
    return msg.reply("🧹 모든 보스 정보가 초기화되었습니다.");
  }
});

// ========== 시간 확인 ==========
async function checkBossTimes() {
  const now = getKST();
  const currentTime = formatTime(now);

  for (const [name, data] of bossList) {
    if (data.time === currentTime) {
      const channel = client.channels.cache.find(
        (ch) =>
          ch.name === "보스알림" ||
          ch.name === "보스시간표" ||
          ch.name === "boss-alert"
      );
      if (!channel) return;

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`join_${name}`)
          .setLabel("✅ 참여하기")
          .setStyle(ButtonStyle.Success)
      );

      const embed = new EmbedBuilder()
        .setColor("Purple")
        .setTitle(`💥 ${name} 젠! (${data.score}점)`)
        .setDescription(
          `지금 ${name} 보스가 젠되었습니다!\n참여 버튼을 눌러주세요.`
        );

      await channel.send({ embeds: [embed], components: [row] });
    }
  }
}

// ========== 버튼 이벤트 ==========
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  const [action, bossName] = interaction.customId.split("_");
  if (action === "join") {
    const boss = bossList.get(bossName);
    if (!boss) return interaction.reply({ content: "⚠️ 보스를 찾을 수 없습니다.", ephemeral: true });

    if (boss.participants.includes(interaction.user.username)) {
      return interaction.reply({ content: "이미 참여하셨습니다.", ephemeral: true });
    }

    boss.participants.push(interaction.user.username);

    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle(`✅ ${bossName} 참여 완료`)
      .setDescription(`현재 참여자:\n${boss.participants.join(", ")}`);

    await interaction.update({ embeds: [embed] });
  }
});

client.login(process.env.TOKEN);
