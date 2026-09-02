import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      include: {
        classes: {
          select: { id: true, name: true, grade: true, color: true }
        },
        _count: {
          select: { assignments: true }
        }
      },
      orderBy: [
        { lastName: "asc" },
        { firstName: "asc" }
      ]
    });
    return NextResponse.json(students);
  } catch (error: any) {
    console.error("GET /api/students error:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, classIds } = body;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
    }

    const student = await prisma.student.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        classes: classIds && Array.isArray(classIds) && classIds.length > 0 ? {
          connect: classIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        classes: true
      }
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/students error:", error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
