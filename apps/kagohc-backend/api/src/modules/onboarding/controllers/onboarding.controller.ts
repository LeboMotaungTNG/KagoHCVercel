import { Request, Response } from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

const uri = 'mongodb://localhost:27017';
let client: MongoClient | null = null;

async function getDb() {
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }
  return client.db('kagohc');
}

function generateEmployeeCode(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `EMP${year}${seq}`;
}

// Get or create a working user to copy from (Bob Johnson)
async function getWorkingUserTemplate() {
  const db = await getDb();
  let workingUser = await db.collection('users').findOne({ email: 'bob.johnson@company.com' });
  
  if (!workingUser) {
    // Create Bob if he doesn't exist
    const hashedPassword = await bcrypt.hash('Welcome123', 10);
    const bobUser = {
      email: 'bob.johnson@company.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Johnson',
      role: 'user',
      isActive: true,
      __v: 0,
      refreshToken: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.collection('users').insertOne(bobUser);
    workingUser = bobUser;
  }
  return workingUser;
}

async function getDefaultDepartmentId() {
  const db = await getDb();
  let dept = await db.collection('departments').findOne({ name: 'General' });
  if (!dept) {
    const result = await db.collection('departments').insertOne({
      name: 'General',
      description: 'Default department',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    dept = { _id: result.insertedId };
  }
  return dept._id;
}

export const onboardingController = {
  createEmployee: async (req: Request, res: Response) => {
    try {
      console.log('Creating employee:', req.body.email);
      
      const employeeData = req.body;
      
      if (!employeeData.email) {
        return res.status(400).json({ success: false, error: 'Email is required' });
      }
      
      const db = await getDb();
      
      // Check if employee already exists in employees collection
      const existingEmployee = await db.collection('employees').findOne({ email: employeeData.email });
      if (existingEmployee) {
        return res.status(409).json({ success: false, error: 'Employee already exists' });
      }
      
      // Check if user already exists in users collection
      const existingUser = await db.collection('users').findOne({ email: employeeData.email });
      
      const deptId = await getDefaultDepartmentId();
      const employeeId = generateEmployeeCode();
      const fullName = employeeData.full_name || `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim();
      const firstName = employeeData.firstName || fullName.split(' ')[0] || 'Unknown';
      const lastName = employeeData.lastName || fullName.split(' ').slice(1).join(' ') || 'User';
      
      // Create employee document
      const newEmployee = {
        employeeId: employeeId,
        employeeCode: employeeId,
        firstName: firstName,
        lastName: lastName,
        fullName: fullName,
        email: employeeData.email,
        phone: employeeData.phone || '',
        id_number: employeeData.id_number || '',
        passport_number: employeeData.passport_number || '',
        address: {
          street: employeeData.address_street || 'Not provided',
          city: employeeData.address_city || 'Not provided',
          state: employeeData.address_province || 'Not provided',
          zipCode: employeeData.address_postal_code || '0000',
          country: 'South Africa'
        },
        department: deptId,
        departmentName: employeeData.department || 'General',
        position: employeeData.position || 'Not specified',
        employment_type: 'Full Time',
        employmentStatus: 'active',
        start_date: employeeData.start_date ? new Date(employeeData.start_date) : new Date(),
        startDate: employeeData.start_date ? new Date(employeeData.start_date) : new Date(),
        work_location: employeeData.work_location || 'Head Office',
        onPayroll: true,
        basicSalary: employeeData.basicSalary || 30000,
        netSalary: employeeData.netSalary || 24000,
        paymentFrequency: 'Monthly',
        employmentType: 'full-time',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('employees').insertOne(newEmployee);
      console.log('Employee saved:', employeeData.email);
      
      // Create user account for login - ALWAYS create if create_account is true
      let userAccount = null;
      if (employeeData.create_account === true) {
        // Get working user template
        const template = await getWorkingUserTemplate();
        
        // Use provided password or default
        const password = employeeData.password || 'Welcome123';
        let hashedPassword;
        
        // Check if we should use template's hash or create new
        if (template && template.password) {
          hashedPassword = template.password;
        } else {
          hashedPassword = await bcrypt.hash(password, 10);
        }
        
        const newUser = {
          email: employeeData.email,
          password: hashedPassword,
          firstName: firstName,
          lastName: lastName,
          role: 'user',
          isActive: true,
          __v: template?.__v || 0,
          refreshToken: template?.refreshToken || '',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        if (existingUser) {
          // Update existing user
          await db.collection('users').updateOne(
            { email: employeeData.email },
            { $set: newUser }
          );
          console.log('User account updated:', employeeData.email);
        } else {
          // Create new user
          await db.collection('users').insertOne(newUser);
          console.log('User account created:', employeeData.email);
        }
        
        userAccount = { 
          email: employeeData.email, 
          accountCreated: true,
          password: password
        };
      }
      
      res.status(201).json({
        success: true,
        data: {
          employee: {
            id: newEmployee.employeeId,
            employeeId: employeeId,
            fullName: fullName,
            email: employeeData.email,
            department: employeeData.department || 'General',
            position: employeeData.position
          },
          userAccount: userAccount
        }
      });
      
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
  
  getAllEmployees: async (req: Request, res: Response) => {
    try {
      const db = await getDb();
      const employees = await db.collection('employees').find({}).sort({ createdAt: -1 }).limit(100).toArray();
      
      const transformed = employees.map(emp => ({
        id: emp._id,
        employeeId: emp.employeeId,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: emp.fullName,
        email: emp.email,
        department: emp.departmentName || 'General',
        position: emp.position,
        phone: emp.phone,
        onPayroll: emp.onPayroll
      }));
      
      res.json({ success: true, data: transformed, count: transformed.length });
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },
  
  processBulk: async (req: Request, res: Response) => {
    try {
      const { employees } = req.body;
      const db = await getDb();
      const deptId = await getDefaultDepartmentId();
      const template = await getWorkingUserTemplate();
      
      const results = { success: [], failed: [], successCount: 0, failedCount: 0 };
      
      for (const emp of employees) {
        try {
          const employeeId = generateEmployeeCode();
          const fullName = emp.full_name || '';
          const firstName = emp.firstName || fullName.split(' ')[0] || 'Unknown';
          const lastName = emp.lastName || fullName.split(' ').slice(1).join(' ') || 'User';
          
          const newEmployee = {
            employeeId: employeeId,
            employeeCode: employeeId,
            firstName: firstName,
            lastName: lastName,
            fullName: fullName,
            email: emp.email,
            phone: emp.phone || '',
            id_number: emp.id_number || '',
            passport_number: emp.passport_number || '',
            address: {
              street: emp.address_street || 'Not provided',
              city: emp.address_city || 'Not provided',
              state: emp.address_province || 'Not provided',
              zipCode: emp.address_postal_code || '0000',
              country: 'South Africa'
            },
            department: deptId,
            departmentName: emp.department || 'General',
            position: emp.position || 'Not specified',
            employment_type: 'Full Time',
            employmentStatus: 'active',
            start_date: emp.start_date ? new Date(emp.start_date) : new Date(),
            work_location: emp.work_location || 'Head Office',
            onPayroll: true,
            basicSalary: emp.basicSalary || 30000,
            netSalary: emp.netSalary || 24000,
            employmentType: 'full-time',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await db.collection('employees').insertOne(newEmployee);
          
          // Create user account for bulk employees if create_account is true
          if (emp.create_account === true) {
            const password = emp.password || 'Welcome123';
            
            const newUser = {
              email: emp.email,
              password: template?.password || await bcrypt.hash(password, 10),
              firstName: firstName,
              lastName: lastName,
              role: 'user',
              isActive: true,
              __v: template?.__v || 0,
              refreshToken: template?.refreshToken || '',
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            await db.collection('users').updateOne(
              { email: emp.email },
              { $set: newUser },
              { upsert: true }
            );
          }
          
          results.success.push(emp.email);
          results.successCount++;
        } catch (err) {
          results.failed.push({ email: emp.email, reason: err.message });
          results.failedCount++;
        }
      }
      
      res.json({ success: true, data: results });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
  
  saveDraft: async (req: Request, res: Response) => {
    res.json({ success: true, message: 'Draft saved' });
  },
  
  getDrafts: async (req: Request, res: Response) => {
    res.json({ success: true, data: [] });
  }
};

