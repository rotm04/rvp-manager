import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.curriculumPlan.findMany({
    include: {
      items: true
    }
  });
  console.log("=== CURRICULUM PLANS IN DB ===");
  console.log(JSON.stringify(plans, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
