import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const TOKEN = process.env.TOKEN || process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 🔄 슬래시 명령 등록
const commands = [
  {
    name: "출석",
    description: "오늘 출석을 체크합니다 ✅",
  },
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    console.log("🔄 슬래시 명령 등록 중...");
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("✅ 슬래시 명령 등록 완료!");
    client.login(TOKEN);
  } catch (error) {
    console.error("❌ 슬래시 명령 등록 실패:", error);
  }
})();

client.once("ready", () => {
  console.log(`✅ ${client.user.tag} 로그인 완료!`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === "출석") {
    const today = new Date().toLocaleDateString("ko-KR");
    await interaction.reply(`✅ ${interaction.user.username}님, ${today} 출석 완료!`);
  }
});
