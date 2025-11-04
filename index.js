import { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, Events } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.once("ready", () => {
  console.log(`✅ ${client.user.tag} 로그인 완료!`);
});

// ✅ 명령 처리
client.on(Events.MessageCreate, async (message) => {
  if (!message.content.startsWith(".")) return;

  const [command] = message.content.slice(1).split(" ");

  // 🟢 .시작
  if (command === "시작") {
    const modal = new ModalBuilder()
      .setCustomId("bossSetup")
      .setTitle("보스 정보 입력");

    const bossNameInput = new TextInputBuilder()
      .setCustomId("bossName")
      .setLabel("보스 이름")
      .setStyle(TextInputStyle.Short);

    const scoreInput = new TextInputBuilder()
      .setCustomId("bossScore")
      .setLabel("점수 (숫자만)")
      .setStyle(TextInputStyle.Short);

    const firstRow = new ActionRowBuilder().addComponents(bossNameInput);
    const secondRow = new ActionRowBuilder().addComponents(scoreInput);
    modal.addComponents(firstRow, secondRow);

    await message.channel.send({
      content: `${message.author.username}님, 보스 정보를 입력하세요.`,
    });
    await message.author.send({ content: "보스 시작을 위한 정보를 입력해주세요.", components: [] }).catch(() => {});
  }
});

// 🟣 모달 제출 시
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === "bossSetup") {
    const bossName = interaction.fields.getTextInputValue("bossName");
    const bossScore = interaction.fields.getTextInputValue("bossScore");

    const embed = new EmbedBuilder()
      .setColor("#00FFB2")
      .setTitle(`💎 ${bossName}`)
      .setDescription(`점수: ${bossScore}점\n참여자: 없음`)
      .setFooter({ text: "참여하려면 아래 버튼을 클릭하세요!" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("join").setLabel("✅ 참여하기").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("list").setLabel("📜 명단보기").setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  // 🟢 버튼: 참여하기
  if (interaction.isButton() && interaction.customId === "join") {
    await interaction.reply({ content: `✅ ${interaction.user.username}님이 참여했습니다!`, ephemeral: true });
  }
});

client.login(process.env.DISCORD_TOKEN);
