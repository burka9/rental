import { writeFileSync } from 'fs';
import * as XLSX from 'xlsx';

function loadFile(filename: string) {
	return XLSX.readFile(filename)
}

function loadData(filePath: string, sheetName?: string) {
  const workbook = loadFile(filePath);

	const sheets: Record<string, any[]> = {}

	if (sheetName) {
		const worksheet = workbook.Sheets[sheetName];
		sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet);
		return sheets
	}
	
	workbook.SheetNames.forEach(sheetName => {
		const worksheet = workbook.Sheets[sheetName];
		sheets[sheetName] = XLSX.utils.sheet_to_json(worksheet);
	})

	return sheets
}


const sheets = loadData('data/Brook Latest Block 1 and Block 3 data.xlsx')

writeFileSync('data/data.json', JSON.stringify(sheets, null, 2))