// Seasonal Theme Utility
export function getCurrentSeason() {
  const month = new Date().getMonth() + 1; // 1-12
  
  if (month >= 12 || month <= 2) {
    return 'winter'; // December, January, February
  } else if (month >= 3 && month <= 5) {
    return 'spring'; // March, April, May
  } else if (month >= 6 && month <= 8) {
    return 'summer'; // June, July, August
  } else {
    return 'autumn'; // September, October, November
  }
}

export function getSeasonalClass() {
  const season = getCurrentSeason();
  return `seasonal-${season}`;
}

export function getSeasonalEmoji() {
  const season = getCurrentSeason();
  const emojis = {
    winter: '❄️',
    spring: '🌸',
    summer: '☀️',
    autumn: '🍂'
  };
  return emojis[season] || '🌿';
}

export function getSeasonalGreeting() {
  const season = getCurrentSeason();
  const greetings = {
    winter: 'Dimër i këndshëm!',
    spring: 'Pranverë e bukur!',
    summer: 'Verë e freskët!',
    autumn: 'Vjeshtë e ngrohtë!'
  };
  return greetings[season] || 'Mirë se vini!';
}

