import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runTest() {
  console.log("=== DB test starting ===");
  try {
    // 1. Clean test data
    console.log("Cleaning old test data...");
    await prisma.student.deleteMany({ where: { firstName: "TestStudentFirstName" } });
    await prisma.class.deleteMany({ where: { name: "TestClass99" } });
    await prisma.curriculumPlan.deleteMany({ where: { name: "TestPlan99" } });

    // 2. Create class
    console.log("Creating class...");
    const testClass = await prisma.class.create({
      data: {
        name: "TestClass99",
        grade: 9
      }
    });
    console.log("Class created:", testClass.name, "with ID:", testClass.id);

    // 3. Create student connected to class (N:M)
    console.log("Creating student...");
    const testStudent = await prisma.student.create({
      data: {
        firstName: "TestStudentFirstName",
        lastName: "TestStudentLastName",
        classes: {
          connect: { id: testClass.id }
        }
      }
    });
    console.log("Student created:", testStudent.lastName, testStudent.firstName);

    // 4. Create curriculum plan and item
    console.log("Creating curriculum plan...");
    const testPlan = await prisma.curriculumPlan.create({
      data: {
        name: "TestPlan99",
        grade: 9,
        description: "Test description"
      }
    });
    const testPlanItem = await prisma.curriculumPlanItem.create({
      data: {
        planId: testPlan.id,
        topic: "TestTopic",
        description: "TestTopicDesc",
        order: 1
      }
    });
    console.log("Plan & Plan item created:", testPlanItem.topic);

    // 5. Create lesson linked to class
    console.log("Creating lesson...");
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 45 * 60 * 1000);
    const testLesson = await prisma.lesson.create({
      data: {
        classId: testClass.id,
        date: startDate,
        delkaTrvani: 45,
        konec: endDate,
        status: "scheduled",
        topic: testPlanItem.topic,
        description: testPlanItem.description,
        ovuCode: "I-9-1",
        ovuDescription: "OvuDesc",
        gCode: "G-DIGI",
        gDescription: "GDesc",
        kkCode: "KK-RP",
        kkDescription: "KkDesc",
        ptCode: "PT-OSV",
        ptDescription: "PtDesc"
      }
    });
    console.log("Lesson created successfully on date:", testLesson.date);

    // 6. Clean up test data
    console.log("Cleaning up test data...");
    await prisma.student.delete({ where: { id: testStudent.id } });
    await prisma.class.delete({ where: { id: testClass.id } });
    await prisma.curriculumPlan.delete({ where: { id: testPlan.id } });
    
    console.log("=== DB test successfully completed ===");
  } catch (err) {
    console.error("=== DB test FAILED ===", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
