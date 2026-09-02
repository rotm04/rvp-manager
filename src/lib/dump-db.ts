import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  const plans = await prisma.curriculumPlan.findMany({
    include: {
      items: true
    }
  });
  const filePath = path.join(process.cwd(), "plans.json");
  fs.writeFileSync(filePath, JSON.stringify(plans, null, 2));
  console.log("Plans dumped to " + filePath);
}

main().catch(console.error).finally(() => prisma.$disconnect());
