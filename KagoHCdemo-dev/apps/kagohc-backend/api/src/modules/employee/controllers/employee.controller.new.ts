import { Request, Response } from 'express';
import { MongoClient } from 'mongodb';

// Simple MongoDB connection
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

export const getEmployees = async (req: Request, res: Response) => {
  try {
    await client.connect();
    const db = client.db('kagohc');
    const employees = await db.collection('employees').find({}).toArray();
    
    const transformed = employees.map(emp => ({
      id: emp._id,
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      fullName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
      email: emp.email || '',
      department: emp.department || 'Unassigned',
      position: emp.position || 'Not specified',
      onPayroll: emp.onPayroll === true,
      basicSalary: emp.basicSalary || 0,
      netSalary: emp.netSalary || 0
    }));
    
    res.json({ success: true, data: transformed });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  } finally {
    await client.close();
  }
};
