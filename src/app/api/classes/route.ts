import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: { students: true }
        }
      },
      orderBy: {
        name: "asc"
      }
    });
    return NextResponse.json(classes);
  } catch (error: any) {
    console.error("GET /api/classes error:", error);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, grade, color } = body;

    if (!name || !grade) {
      return NextResponse.json({ error: "Name and grade are required" }, { status: 400 });
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        grade: parseInt(grade, 10),
        color: color || "#4f46e5"
      }
    });

    return NextResponse.json(newClass, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/classes error:", error);
    return NextResponse.json({ error: "Failed to create class" }, { status: 500 });
  }
}
