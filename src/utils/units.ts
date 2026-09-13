// Singular forms of Russian unit names (plural → singular)
const ruSingularMap: Record<string, string> = {
  Метры: 'Метр',
  Километры: 'Километр',
  Сантиметры: 'Сантиметр',
  Миллиметры: 'Миллиметр',
  Мили: 'Миля',
  'Астрономические единицы': 'Астрономическая единица',
  'Световые года': 'Световой год',
  Ярды: 'Ярд',
  Футы: 'Фут',
  Дюймы: 'Дюйм',
  Килограммы: 'Килограмм',
  Грамы: 'Грам',
  Фунты: 'Фунт',
  Унции: 'Унция',
  Тонны: 'Тонна',
  Секунды: 'Секунда',
  Миллисекунды: 'Миллисекунда',
  Минуты: 'Минута',
  Часы: 'Час',
  Дни: 'День',
  Недели: 'Неделя',
  Месяцы: 'Месяц',
  Годы: 'Год',
  узлы: 'узел',
  'мили/ч': 'миля/ч',
  гектары: 'гектар',
  акры: 'акр',
  'мили²': 'миля²',
  Биты: 'Бит',
  Байты: 'Байт',
  Килобайты: 'Килобайт',
  Мегабайты: 'Мегабайт',
  Гигабайты: 'Гигабайт',
  Терабайты: 'Терабайт',
  Петабайты: 'Петабайт',
  Эксабайты: 'Эксабайт',
  Зеттабайты: 'Зеттабайт',
  литры: 'литр',
  миллилитры: 'миллилитр',
  галлоны: 'галлон',
  кварты: 'кварта',
  пинты: 'пинта',
  'дюймы³': 'дюйм³',
  'футы³': 'фут³',
  'мили³': 'миля³',
};

// Return the singular form of a unit name (e.g. "Meters" → "Meter",
// "Метры" → "Метр").
export const toSingularUnit = (name: string, language: string): string => {
  if (language === 'ru') {
    return ruSingularMap[name] || name;
  }
  const lower = name.toLowerCase();
  // Don't touch abbreviations or temperature units (m/s, °Celsius, ...)
  if (lower.includes('/') || lower.startsWith('°')) return name;
  if (lower.startsWith('feet')) return name.replace(/^feet/i, 'Foot');
  if (lower.startsWith('inches')) return name.replace(/^inches/i, 'Inch');
  if (lower.startsWith('miles')) return name.replace(/^miles/i, 'Mile');
  if (/s[²³]$/.test(lower)) return name.slice(0, -2) + name.slice(-1);
  if (lower.endsWith('s') && !lower.endsWith('ss')) return name.slice(0, -1);
  return name;
};
