const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Deactivating all evaluation cycles to disable all links...');
  const result = await prisma.evaluationCycle.updateMany({
    data: { isActive: false }
  });
  console.log(`Successfully deactivated ${result.count} evaluation cycles. All associated links are now disabled.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
