const bossList = new Map();
const timezoneOffset = 9;

function getKST() {
  const now = new Date();
  now.setHours(now.getHours() + timezoneOffset);
  return now;
}

function formatTime(date) {
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

export function registerBoss(name, score, time) {
  bossList.set(name, { score, time, participants: [] });
  return bossList;
}

export function listBosses() {
  return Array.from(bossList.entries()).map(([name, data]) => ({
    name,
    score: data.score,
    time: data.time,
    participants: data.participants,
  }));
}

export function checkBossTimes(callback) {
  const now = getKST();
  const currentTime = formatTime(now);

  for (const [name, data] of bossList) {
    if (data.time === currentTime) {
      callback(name, data.score);
    }
  }
}
