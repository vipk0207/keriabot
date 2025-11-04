import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder
} from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// 디스코드 클라이언트 생성
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// REST API 객체 (명령 등록용)
const rest = new REST({ version: '10' }).setToken(TOKEN);

// 🔄 슬래시 명령 등록
(async () => {
  try {
    console.log('🔄 슬래시 명령 등록 중...');
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      {
        body: [
          {
            name: '참여',
            description: '참여 버튼을 생성합니다.',
          },
        ],
      }
    );
    console.log('✅ 슬래시 명령 등록 완료!');
  } catch (error) {
    console.error('❌ 명령 등록 중 오류 발생:', error);
  }
})();

// 참여자 저장용 Set (중복 방지)
const participants = new Set();

// 이벤트 핸들러
client.on('interactionCreate', async (interaction) => {
  try {
    // ✅ 슬래시 명령 처리
    if (interaction.isCommand() && interaction.commandName === '참여') {
      const button = new ButtonBuilder()
        .setCustomId('join_button')
        .setLabel('✅ 참여하기')
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(button);

      await interaction.reply({
        content: '📋 참여하려면 아래 버튼을 눌러주세요!',
        components: [row],
      });
    }

    // ✅ 버튼 클릭 처리
    if (interaction.isButton() && interaction.customId === 'join_button') {
      participants.add(interaction.user.username);

      const joinedList = [...participants]
        .map((name, i) => `${i + 1}. ${name}`)
        .join('\n');

      await interaction.update({
        content: `✅ 참여자 목록:\n${joinedList}`,
        components: interaction.message.components, // 버튼 유지
      });
    }
  } catch (err) {
    console.error('⚠️ interaction 처리 중 오류:', err);
  }
});

client.once('ready', () => {
  console.log(`✅ ${client.user.tag} 로그인 완료!`);
});

client.login(TOKEN);
