import * as fs from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import * as XLSX from 'xlsx';
import csv from 'csv-parser';

export class DocumentExtractionService {
  
  // Extract data from uploaded document
  static async extractEmployees(filePath: string, fileType: string): Promise<any[]> {
    const employees = [];
    
    try {
      if (fileType === 'application/pdf') {
        // Extract from PDF
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        const text = data.text;
        
        // Parse PDF text to extract employee data
        // This is a basic implementation - you can enhance based on your PDF format
        const lines = text.split('\n');
        for (const line of lines) {
          if (line.includes('@') && line.match(/[A-Za-z]/)) {
            const parts = line.split(/\s+/);
            employees.push({
              full_name: parts.slice(0, -1).join(' ') || '',
              email: parts[parts.length - 1] || '',
              id_number: '',
              phone: '',
              address_street: '',
              address_city: '',
              address_province: '',
              address_postal_code: '',
              position: '',
              department: '',
              start_date: new Date().toISOString().split('T')[0]
            });
          }
        }
        
      } else if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                 fileType === 'application/vnd.ms-excel') {
        // Extract from Excel
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        for (const row of data) {
          employees.push({
            full_name: row['Full Name'] || row['name'] || '',
            email: row['Email'] || row['email'] || '',
            id_number: row['ID Number'] || row['id_number'] || '',
            phone: row['Phone'] || row['phone'] || '',
            department: row['Department'] || row['department'] || '',
            position: row['Position'] || row['position'] || '',
            start_date: row['Start Date'] || row['start_date'] || new Date().toISOString().split('T')[0]
          });
        }
        
      } else if (fileType === 'text/csv') {
        // Extract from CSV
        // Implementation for CSV parsing
      }
      
      return employees;
      
    } catch (error) {
      console.error('Error extracting data:', error);
      return [];
    }
  }
}
