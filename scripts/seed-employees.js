const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EMPLOYEES = [
  { name: 'Sandip Mishra', email: 'sandip.balarbuilders@gmail.com', department: 'Township Operations', hodName: 'Shrikant Talekar', hodEmail: 'shrikant.balarbuilders@gmail.com' },
  { name: 'Sachin Mandal', email: 'sachin.balarbuilders@gmail.com', department: 'HR', hodName: 'Bhavin Patel', hodEmail: 'sm4163094@gmail.com' },
  { name: 'Vishal Ganvit', email: 'vishal.balarbuilders@gmail.com', department: 'Clubhouse', hodName: 'Dhaval Patel', hodEmail: 'dhaval.balarbuilders@gmail.com' },
  { name: 'Charul Patel', email: 'charul.balarbuilders@gmail.com', department: 'Clubhouse', hodName: 'Dhaval Patel', hodEmail: 'dhaval.balarbuilders@gmail.com' },
  { name: 'Nilesh Parmar', email: 'nileshparmar.balarbuilders@gmail.com', department: 'Material', hodName: 'Jitendra Patolia', hodEmail: 'jitubhai.balarbuilders@gmail.com' },
  { name: 'Raj Shah', email: 'raj.balarbuilders@gmail.com', department: 'Material', hodName: 'Jitendra Patolia', hodEmail: 'jitubhai.balarbuilders@gmail.com' },
  { name: 'Vivek Dubey', email: 'vivek.balarbuilders@gmail.com', department: 'Material', hodName: 'Raj Shah', hodEmail: 'raj.balarbuilders@gmail.com' },
  { name: 'Pradip Vadhiya', email: 'pradip.balarbuilders@gmail.com', department: 'Civil', hodName: 'Lalit Dobariya', hodEmail: 'lalit.balarbuilders@gmail.com' },
  { name: 'Divyang Patel', email: 'divyang.balarbuilders@gmail.com', department: 'Civil', hodName: 'Lalit Dobariya', hodEmail: 'lalit.balarbuilders@gmail.com' },
  { name: 'Manishbhai Kanani', email: 'manishkanani31@gmail.com', department: 'Civil', hodName: 'Lalit Dobariya', hodEmail: 'lalit.balarbuilders@gmail.com' },
  { name: 'Himanshu Singh', email: 'himanshusingh17062005@gmail.com', department: 'Civil', hodName: 'Lalit Dobariya', hodEmail: 'lalit.balarbuilders@gmail.com' },
  { name: 'Dharmendra Kachhad', email: 'dharmendra.balarbuilders@gmail.com', department: 'Civil', hodName: 'Lalit Dobariya', hodEmail: 'lalit.balarbuilders@gmail.com' },
  { name: 'Avneet Kumar', email: 'avneet.balarbuilders@gmail.com', department: 'Civil', hodName: 'Lalit Dobariya', hodEmail: 'lalit.balarbuilders@gmail.com' },
  { name: 'Mehul Patil', email: 'mehul.balarbuilders@gmail.com', department: 'Customer Care', hodName: 'Shrikant Talekar', hodEmail: 'shrikant.balarbuilders@gmail.com' },
  { name: 'Anup Patel', email: 'anuup13@gmail.com', department: 'Customer Care', hodName: 'Shrikant Talekar', hodEmail: 'shrikant.balarbuilders@gmail.com' },
  { name: 'Yankit Patel', email: 'ankup982@gmail.com', department: 'Customer Care', hodName: 'Shrikant Talekar', hodEmail: 'shrikant.balarbuilders@gmail.com' },
  { name: 'Mahesh Chauhan', email: 'mahesh.balarbuilders@gmail.com', department: 'Finishing', hodName: 'Nimit Kuber', hodEmail: 'nimit.balarbuilders@gmail.com' },
  { name: 'Parth Chaudhari', email: 'parth.balarbuilders@gmail.com', department: 'Finishing', hodName: 'Nimit Kuber', hodEmail: 'nimit.balarbuilders@gmail.com' },
  { name: 'Nimit Kuber', email: 'nimit.balarbuilders@gmail.com', department: 'Finishing', hodName: 'Lalit Dobariya', hodEmail: 'lalit.balarbuilders@gmail.com' },
  { name: 'Harish Thapa', email: 'harish.balarbuilders@gmail.com', department: 'Sales', hodName: 'Shrikant Talekar', hodEmail: 'shrikant.balarbuilders@gmail.com' },
  { name: 'Rahul Rohit', email: 'rahul.balarbuilders@gmail.com', department: 'Sales', hodName: 'Shrikant Talekar', hodEmail: 'shrikant.balarbuilders@gmail.com' },
  { name: 'Nil Chaudhari', email: 'nil.balarbuilders@gmail.com', department: 'Common', hodName: 'Hiren Dobariya', hodEmail: 'hiren.balarbuilders@gmail.com' },
  { name: 'Nishant Radadiya', email: 'nishant.balarbuilders@gmail.com', department: 'Common', hodName: 'Hiren Dobariya', hodEmail: 'hiren.balarbuilders@gmail.com' },
  { name: 'Hiren Dobariya', email: 'hiren.balarbuilders@gmail.com', department: 'Common', hodName: 'Lalit Dobariya', hodEmail: 'lalit.balarbuilders@gmail.com' },
  { name: 'Mahesh Saharya', email: 'maheshsaharya.balarbuilders@gmail.com', department: 'Common', hodName: 'Hiren Dobariya', hodEmail: 'hiren.balarbuilders@gmail.com' },
  { name: 'Kinnari Shastri', email: 'kinnari.balarbuilders@gmail.com', department: 'Reception', hodName: 'Shrikant Talekar', hodEmail: 'shrikant.balarbuilders@gmail.com' },
  { name: 'Rakesh Gupta', email: 'rakesh.balarbuilders@gmail.com', department: 'MEP', hodName: 'Jitendra Patolia', hodEmail: 'jitubhai.balarbuilders@gmail.com' },
  { name: 'Ritesh Verma', email: 'ritesh.balarbuilders@gmail.com', department: 'MEP', hodName: 'Jitendra Patolia', hodEmail: 'jitubhai.balarbuilders@gmail.com' },
  { name: 'Nilesh Savaliya', email: 'nilesh.balarbuilders@gmail.com', department: 'MEP', hodName: 'Jitendra Patolia', hodEmail: 'jitubhai.balarbuilders@gmail.com' },
  { name: 'Jignal Bariya', email: 'jignal.balarbuilders@gmail.com', department: 'Legal', hodName: 'Bhavin Patel', hodEmail: 'bhavin.balarbuilders@gmail.com' }
];

async function main() {
  console.log('Seeding employees into the database...');
  let createdCount = 0;
  let updatedCount = 0;

  for (const emp of EMPLOYEES) {
    const existing = await prisma.employee.findFirst({
      where: { email: emp.email }
    });

    if (existing) {
      // Update employee details
      await prisma.employee.update({
        where: { id: existing.id },
        data: {
          name: emp.name,
          department: emp.department,
          hodName: emp.hodName,
          hodEmail: emp.hodEmail
        }
      });
      updatedCount++;
    } else {
      // Create new employee with default KRA template
      await prisma.employee.create({
        data: {
          name: emp.name,
          email: emp.email,
          department: emp.department,
          hodName: emp.hodName,
          hodEmail: emp.hodEmail,
          kras: {
            create: [
              {
                kra: 'Core Departmental Responsibilities',
                kpi: 'Deliver task execution and collaborative output aligned with departmental goals.',
                weightage: 100
              }
            ]
          }
        }
      });
      createdCount++;
    }
  }

  console.log(`Seeding complete. Created: ${createdCount}, Updated: ${updatedCount} employees.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
