export enum Weather {
  SUNNY = "SUNNY",
  CLOUDY = "CLOUDY",
  RAINY = "RAINY",
}

const defaultWeather = Weather.SUNNY

export const calculateWeather = (): { condition: Weather; opacity: number } => {
  const hour = new Date().getHours()

  if (hour >= 6 && hour < 12) {
    return { condition: Weather.SUNNY, opacity: 1 }
  } else if (hour >= 12 && hour < 18) {
    return { condition: Weather.CLOUDY, opacity: 0.5 }
  } else {
    return { condition: Weather.RAINY, opacity: 0.8 }
  }
}

export const getWeatherDuration = (): number => {
  return Math.random() * 10000 + 5000
}
