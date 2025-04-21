import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ethiopianMonths, toEthiopian } from "./date-converter"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toEthiopianDateString(_date: Date) {
  const [year, month, date] = toEthiopian(_date.getFullYear(), _date.getMonth() + 1, _date.getDate())

  return `${year} ${ethiopianMonths[month - 1]} ${date+1}`
}
