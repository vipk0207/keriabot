require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 🧩 슬래시 명령 등록
const commands = [
  new SlashCommandBuilder()
    .setName('출석')
    .setDescription('오늘의 출석을 기록합니다!')
].map(command => command.toJSON());

// 🔐 토큰, 클라이언트ID, 길드ID 불러오기
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ✅ 명령 등록
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('🔄 슬래시 명령 등록 중...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
    console.log('✅ 슬래시 명령 등록 완료!');
  } catch (err) {
    console.error(err);
  }
})();

// 🚀 봇 실행
client.once('ready', () => {
  console.log(`✅ ${client.user.tag} 로그인 완료!`);
});

// 💬 명령 처리
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === '출석') {
    const today = new Date().toLocaleDateString('ko-KR');
    await interaction.reply(`✅ ${interaction.user.username}님, ${today} 출석 완료!`);
  }
});

client.login(TOKEN);
