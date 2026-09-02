import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const classCount = await prisma.class.count();
    const studentCount = await prisma.student.count();
    const curriculumCount = await prisma.curriculumPlanItem.count();
    const taskCount = await prisma.task.count();

    // Fetch next 5 scheduled lessons
    const upcomingLessons = await prisma.lesson.findMany({
      where: {
        status: "scheduled",
      },
      take: 5,
      include: {
        class: {
          select: { name: true }
        }
      },
      orderBy: {
        date: "asc"
      }
    });

    return NextResponse.json({
      classCount,
      studentCount,
      curriculumCount,
      taskCount,
      upcomingLessons
    });
  } catch (error: any) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json({ error: "Failed to load dashboard metrics" }, { status: 500 });
  }
}
