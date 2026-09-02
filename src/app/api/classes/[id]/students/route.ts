import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const students = await prisma.student.findMany({
      where: {
        classes: {
          some: { id: classId }
        }
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" }
      ]
    });
    return NextResponse.json(students);
  } catch (error: any) {
    console.error("GET /api/classes/[id]/students error:", error);
    return NextResponse.json({ error: "Failed to fetch class students" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const body = await request.json();
    const { mode } = body;

    const classRecord = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (mode === "assign_existing") {
      const { studentId } = body;
      if (!studentId) {
        return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
      }

      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: {
          classes: {
            connect: { id: classId }
          }
        }
      });
      return NextResponse.json({ success: true, student: updatedStudent });
    }

    if (mode === "single") {
      const { firstName, lastName } = body;
      if (!firstName || !lastName) {
        return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
      }

      const student = await prisma.student.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          classes: {
            connect: { id: classId }
          }
        }
      });
      return NextResponse.json({ success: true, count: 1, student });
    } 
    
    if (mode === "bulk") {
      const { text } = body;
      if (!text) {
        return NextResponse.json({ error: "No text data provided" }, { status: 400 });
      }

      const lines = text.split(/\r?\n/);
      let count = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        let firstName = "";
        let lastName = "";

        if (trimmed.includes(";")) {
          const parts = trimmed.split(";");
          lastName = parts[0]?.trim() || "";
          firstName = parts[1]?.trim() || "";
        } else if (trimmed.includes(",")) {
          const parts = trimmed.split(",");
          lastName = parts[0]?.trim() || "";
          firstName = parts[1]?.trim() || "";
        } else if (trimmed.includes("\t")) {
          const parts = trimmed.split("\t");
          lastName = parts[0]?.trim() || "";
          firstName = parts[1]?.trim() || "";
        } else {
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 2) {
            lastName = parts[0]?.trim();
            firstName = parts.slice(1).join(" ").trim();
          } else {
            lastName = trimmed;
            firstName = "Žák";
          }
        }

        if (firstName && lastName) {
          await prisma.student.create({
            data: {
              firstName,
              lastName,
              classes: {
                connect: { id: classId }
              }
            }
          });
          count++;
        }
      }

      if (count === 0) {
        return NextResponse.json({ error: "No valid student names parsed" }, { status: 400 });
      }

      return NextResponse.json({ 
        success: true, 
        count, 
        message: `Successfully imported ${count} students.` 
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/classes/[id]/students error:", error);
    return NextResponse.json({ error: "Failed to process student enrollment" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: classId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 });
    }

    // Disconnect student from class (leaves student in global DB)
    await prisma.class.update({
      where: { id: classId },
      data: {
        students: {
          disconnect: { id: studentId }
        }
      }
    });

    return NextResponse.json({ success: true, message: "Student removed from class" });
  } catch (error: any) {
    console.error("DELETE /api/classes/[id]/students error:", error);
    return NextResponse.json({ error: "Failed to remove student from class" }, { status: 500 });
  }
}
