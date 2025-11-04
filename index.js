import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import dotenv from "dotenv";
import { registerBoss, listBosses, checkBossTimes } from "./bossManager.js";
import { speak } from "./voiceAlert.js";

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const TEXT_CHANNEL = "일반";
const VOICE_CHANNEL = "보스방";

client.once("ready", () => {
  console.log(`✅ ${client.user.tag} 로그인 완료!`);
  setInterval(() => {
    checkBossTimes(async (name, score) => {
      const channel = client.channels.cache.find((ch) => ch.name === TEXT_CHANNEL);
      if (!channel) return;
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`join_${name}`)
          .setLabel("✅ 참여하기")
          .setStyle(ButtonStyle.Success)
      );
      const embed = new EmbedBuilder()
        .setColor("Purple")
        .setTitle(`💥 ${name} 젠! (${score}점)`)
        .setDescription(`보스가 젠되었습니다!\n참여 버튼을 눌러주세요.`);
      await channel.send({ embeds: [embed], components: [row] });
      await speak(channel.guild, VOICE_CHANNEL, `${name} 보스 젠되었습니다!`);
    });
  }, 60000);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.content.startsWith(".")) return;
  const args = msg.content.slice(1).trim().split(" ");
  const command = args.shift();

  if (command === "등록") {
    const [bossName, score, time] = args;
    if (!bossName || !score || !time)
      return msg.reply("❌ 사용법: `.등록 보스이름 점수 시간` (예: `.등록 타가르 1 18:45`)");
    registerBoss(bossName, parseInt(score), time);
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("✅ 보스 등록 완료")
      .setDescription(`**${bossName}** (${score}점) 보스가 ${time}에 등록되었습니다!`);
    return msg.channel.send({ embeds: [embed] });
  }

  if (command === "목록") {
    const bosses = listBosses();
    if (bosses.length === 0) return msg.reply("📭 등록된 보스가 없습니다.");
    const desc = bosses.map((b) => `💎 ${b.name} (${b.score}점) - ${b.time}`).join("\n");
    const embed = new EmbedBuilder().setColor("Blue").setTitle("📋 등록된 보스 목록").setDescription(desc);
    return msg.channel.send({ embeds: [embed] });
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;
  const [action, bossName] = interaction.customId.split("_");
  if (action === "join") {
    return interaction.reply({ content: `${interaction.user.username}님이 ${bossName}에 참여하셨습니다!`, ephemeral: true });
  }
});

client.login(process.env.TOKEN);
