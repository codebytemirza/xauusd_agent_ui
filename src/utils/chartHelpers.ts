import { Time } from 'lightweight-charts';

export function toUnixTime(isoString: string): Time {
  return Math.floor(new Date(isoString).getTime() / 1000) as Time;
}

export function generateUUID() {
  return Math.random().toString(36).substring(2, 9);
}
