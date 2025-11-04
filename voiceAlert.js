import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
} from "@discordjs/voice";
import googleTTS from "google-tts-api";
import fs from "fs";
import https from "https";

export async function speak(guild, channelName, text) {
  const channel = guild.channels.cache.find(
    (ch) => ch.name === channelName && ch.isVoiceBased()
  );
  if (!channel) {
    console.log(`❌ 음성채널 '${channelName}'을(를) 찾을 수 없음`);
    return;
  }

  const url = googleTTS.getAudioUrl(text, {
    lang: "ko",
    slow: false,
    host: "https://translate.google.com",
  });

  const filePath = "./voice.mp3";
  const file = fs.createWriteStream(filePath);

  await new Promise((resolve) => {
    https.get(url, (res) => {
      res.pipe(file);
      file.on("finish", () => {
        file.close(resolve);
      });
    });
  });

  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: guild.id,
    adapterCreator: guild.voiceAdapterCreator,
  });

  const player = createAudioPlayer();
  const resource = createAudioResource(filePath);
  connection.subscribe(player);
  player.play(resource);

  player.on(AudioPlayerStatus.Idle, () => {
    const conn = getVoiceConnection(guild.id);
    if (conn) conn.destroy();
  });
}
