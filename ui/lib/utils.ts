import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { GDate } from 'ethiopian-gregorian-date-converter';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const ethiopianMonths = [
  "መስከረም", // Meskerem (Month 1)
  "ጥቅምት",  // Tikimt (Month 2)
  "ህዳር",   // Hidar (Month 3)
  "ታህሳስ",  // Tahsas (Month 4)
  "ጥር",     // Tir (Month 5)
  "የካቲት",  // Yekatit (Month 6)
  "መጋቢት",  // Megabit (Month 7)
  "ሚያዝያ",  // Miazia (Month 8)
  "ግንቦት",  // Ginbot (Month 9)
  "ሰኔ",     // Sene (Month 10)
  "ሐምሌ",    // Hamle (Month 11)
  "ነሐሴ",    // Nehase (Month 12)
  "ጳጉሜ"    // Pagume (Month 13)
];
export function toEthiopianDateString(_date: Date) {
  const gDate = new GDate(_date.toDateString())

  const ethDate = gDate.toEth()

  return `${ethDate.day+1} ${ethiopianMonths[ethDate.month - 1]} ${ethDate.year}`
}