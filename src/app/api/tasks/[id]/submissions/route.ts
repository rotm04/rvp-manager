import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    // Fetch task and its class
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { classId: true }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Fetch all students enrolled in the task's class (N:M relation)
    const students = await prisma.student.findMany({
      where: {
        classes: {
          some: { id: task.classId }
        }
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" }
      ]
    });

    // Fetch existing assignments/submissions
    const submissions = await prisma.studentAssignment.findMany({
      where: { taskId }
    });

    // Merge students with their submissions
    const result = students.map(student => {
      const sub = submissions.find(s => s.studentId === student.id);
      return {
        studentId: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        submitted: sub ? sub.submitted : false,
        points: sub ? sub.points : null,
        grade: sub ? sub.grade : null,
        feedback: sub ? sub.feedback : ""
      };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/tasks/[id]/submissions error:", error);
    return NextResponse.json({ error: "Failed to fetch task submissions" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { studentId, submitted, points, grade, feedback } = body;

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Validate grade if provided: must be between 1 and 5
    let formattedGrade: string | null = null;
    if (grade !== undefined && grade !== null && String(grade).trim() !== "") {
      const normalizedGrade = String(grade).replace(",", ".");
      const gradeNum = parseFloat(normalizedGrade);
      if (isNaN(gradeNum) || gradeNum < 1 || gradeNum > 5) {
        return NextResponse.json({ 
          error: "Známka musí být v rozmezí 1 až 5 (povolena jsou i desetinná čísla, např. 1.5)" 
        }, { status: 400 });
      }
      formattedGrade = String(grade).trim();
    }

    // Upsert the assignment evaluation
    const evaluation = await prisma.studentAssignment.upsert({
      where: {
        studentId_taskId: {
          studentId,
          taskId
        }
      },
      update: {
        submitted: !!submitted,
        points: points !== undefined ? (points === null || points === "" ? null : parseInt(points, 10)) : undefined,
        grade: grade !== undefined ? formattedGrade : undefined,
        feedback: feedback !== undefined ? String(feedback) : undefined
      },
      create: {
        studentId,
        taskId,
        submitted: !!submitted,
        points: points !== null && points !== "" && points !== undefined ? parseInt(points, 10) : null,
        grade: formattedGrade,
        feedback: feedback || ""
      }
    });

    return NextResponse.json(evaluation);
  } catch (error: any) {
    console.error("POST /api/tasks/[id]/submissions error:", error);
    return NextResponse.json({ error: "Failed to save student evaluation" }, { status: 500 });
  }
}
