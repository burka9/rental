// /* eslint-disable @typescript-eslint/no-explicit-any */
// // Custom exception class
// class Exception extends Error {
//   constructor(message: string) {
//     super(message);
//     this.name = 'Exception';
//   }
// }

// export const ethiopianMonths = [
//   "መስከረም", // Meskerem (Month 1)
//   "ጥቅምት",  // Tikimt (Month 2)
//   "ህዳር",   // Hidar (Month 3)
//   "ታህሳስ",  // Tahsas (Month 4)
//   "ጥር",     // Tir (Month 5)
//   "የካቲት",  // Yekatit (Month 6)
//   "መጋቢት",  // Megabit (Month 7)
//   "ሚያዝያ",  // Miazia (Month 8)
//   "ግንቦት",  // Ginbot (Month 9)
//   "ሰኔ",     // Sene (Month 10)
//   "ሐምሌ",    // Hamle (Month 11)
//   "ነሐሴ",    // Nehase (Month 12)
//   "ጳጉሜ"    // Pagume (Month 13)
// ];

// // Type for date arrays (year, month, day)
// type DateArray = [number, number, number];

// // Calculate the start day of the Ethiopian year in Gregorian terms
// const startDayOfEthiopian = (year: number): number => {
//   const newYearDay = Math.floor(year / 100) - Math.floor(year / 400) - 4;
//   // If the previous Ethiopian year is a leap year, new year occurs on the 12th
//   return ((year - 1) % 4 === 3) ? newYearDay + 1 : newYearDay;
// };

// // Convert Ethiopian date to Gregorian
// export const toGregorian = (...args: [DateArray] | [number, number, number]): DateArray => {
//   // Handle both array and separate arguments
//   const inputs: any[] = Array.isArray(args[0]) ? args[0] : [args[0], args[1], args[2]];

//   // Validate input
//   if (inputs.includes(0) || inputs.includes(null) || inputs.includes(undefined) || inputs.length !== 3) {
//     throw new Exception("Malformed input can't be converted.");
//   }

//   const [year, month, date] = inputs as DateArray;

//   // Ethiopian new year in Gregorian calendar
//   const newYearDay = startDayOfEthiopian(year);

//   // September (Ethiopian) sees 7-year difference
//   let gregorianYear = year + 7;

//   // Number of days in Gregorian months starting with September (index 1)
//   // Index 0 is reserved for leap year switches, Index 4 is December
//   const gregorianMonths: number[] = [0, 30, 31, 30, 31, 31, 28, 31, 30, 31, 30, 31, 31, 30];

//   // If next Gregorian year is a leap year, February has 29 days
//   const nextYear = gregorianYear + 1;
//   if ((nextYear % 4 === 0 && nextYear % 100 !== 0) || nextYear % 400 === 0) {
//     gregorianMonths[6] = 29;
//   }

//   // Calculate number of days up to the date
//   let until = ((month - 1) * 30) + date;
//   if (until <= 37 && year <= 1575) { // Mysterious rule
//     until += 28;
//     gregorianMonths[0] = 31;
//   } else {
//     until += newYearDay - 1;
//   }

//   // If Ethiopian year is a leap year, Pagumē has 6 days
//   if ((year - 1) % 4 === 3) {
//     until += 1;
//   }

//   // Calculate month and date incrementally
//   let m = 0;
//   let gregorianDate: number = 0;
//   for (let i = 0; i < gregorianMonths.length; i++) {
//     if (until <= gregorianMonths[i]) {
//       m = i;
//       gregorianDate = until;
//       break;
//     } else {
//       m = i;
//       until -= gregorianMonths[i];
//     }
//   }

//   // If m > 4, we're in the next Gregorian year
//   if (m > 4) {
//     gregorianYear += 1;
//   }

//   // Gregorian months ordered according to Ethiopian calendar
//   const order: number[] = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9];
//   const gregorianMonth = order[m];

//   return [gregorianYear, gregorianMonth, gregorianDate];
// };

// // Convert Gregorian date to Ethiopian
// export const toEthiopian = (...args: [DateArray] | [number, number, number]): DateArray => {
//   // Handle both array and separate arguments
//   const inputs: any[] = Array.isArray(args[0]) ? args[0] : [args[0], args[1], args[2]];

//   // Validate input
//   if (inputs.includes(0) || inputs.includes(null) || inputs.includes(undefined) || inputs.length !== 3) {
//     throw new Exception("Malformed input can't be converted.");
//   }

//   const [year, month, date] = inputs as DateArray;

//   // Date between 5 and 14 of October 1582 are invalid (Gregorian calendar reform)
//   if (month === 10 && date >= 5 && date <= 14 && year === 1582) {
//     throw new Exception('Invalid Date between 5-14 October 1582.');
//   }

//   // Number of days in Gregorian months starting with January (index 1)
//   const gregorianMonths: number[] = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

//   // Number of days in Ethiopian months starting with Meskerem (index 1)
//   const ethiopianMonths: number[] = [0, 30, 30, 30, 30, 30, 30, 30, 30, 30, 5, 30, 30, 30];

//   // If Gregorian leap year, February has 29 days
//   if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
//     gregorianMonths[2] = 29;
//   }

//   // September sees 8-year difference
//   let ethiopianYear = year - 8;

//   // If Ethiopian leap year, Pagumē has 6 days
//   if (ethiopianYear % 4 === 3) {
//     ethiopianMonths[10] = 6;
//   }

//   // Ethiopian new year in Gregorian calendar
//   const newYearDay = startDayOfEthiopian(year - 8);

//   // Calculate number of days up to the date
//   let until = 0;
//   for (let i = 1; i < month; i++) {
//     until += gregorianMonths[i];
//   }
//   until += date;

//   // Update Tahsas (December) to match January 1st
//   let tahsas = (ethiopianYear % 4) === 0 ? 26 : 25;

//   // Account for the 1582 Gregorian calendar change
//   if (year < 1582) {
//     ethiopianMonths[1] = 0;
//     ethiopianMonths[2] = tahsas;
//   } else if (until <= 277 && year === 1582) {
//     ethiopianMonths[1] = 0;
//     ethiopianMonths[2] = tahsas;
//   } else {
//     tahsas = newYearDay - 3;
//     ethiopianMonths[1] = tahsas;
//   }

//   // Calculate month and date incrementally
//   let m: number = 0;
//   let ethiopianDate: number = 0;
//   for (m = 1; m < ethiopianMonths.length; m++) {
//     if (until <= ethiopianMonths[m]) {
//       ethiopianDate = (m === 1 || ethiopianMonths[m] === 0) ? until + (30 - tahsas) : until;
//       break;
//     } else {
//       until -= ethiopianMonths[m];
//     }
//   }

//   // If m > 10, we're in the next Ethiopian year
//   if (m > 10) {
//     ethiopianYear += 1;
//   }

//   // Ethiopian months ordered according to Gregorian
//   const order: number[] = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4];
//   const ethiopianMonth = order[m];

//   return [ethiopianYear, ethiopianMonth, ethiopianDate];
// };