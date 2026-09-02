import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    const whereClause = classId ? { classId } : {};

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        class: {
          select: { name: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(tasks);
  } catch (error: any) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      classId,
      title,
      description,
      maxPoints,
      maxGrade,
      filePlaceholder,
      datumZadani,
      dueDate
    } = body;

    if (!classId || !title || !description) {
      return NextResponse.json({ error: "Class ID, title, and description are required" }, { status: 400 });
    }

    // Verify class exists
    const classRecord = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Validation: Deadline must not precede assignment date
    const assignmentDate = datumZadani ? new Date(datumZadani) : new Date();
    // Normalize date parts to compare only dates or date-times accurately
    if (dueDate) {
      const limitDate = new Date(dueDate);
      if (limitDate.getTime() < assignmentDate.getTime()) {
        return NextResponse.json({ 
          error: "Termín odevzdání (deadline) nesmí předcházet datu zadání." 
        }, { status: 400 });
      }
    }

    const newTask = await prisma.task.create({
      data: {
        classId,
        title,
        description,
        maxPoints: maxPoints ? parseInt(maxPoints, 10) : null,
        maxGrade: maxGrade || null,
        filePlaceholder: filePlaceholder || null,
        datumZadani: assignmentDate,
        dueDate: dueDate ? new Date(dueDate) : null
      }
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
