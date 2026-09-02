import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const gradeParam = searchParams.get("grade");

    const whereClause = gradeParam ? { grade: parseInt(gradeParam, 10) } : {};

    const plans = await prisma.curriculumPlan.findMany({
      where: whereClause,
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            ovuItems: true,
            gItems: true,
            kkItems: true,
            ptItems: true
          }
        }
      },
      orderBy: {
        grade: "asc"
      }
    });

    return NextResponse.json(plans);
  } catch (error: any) {
    console.error("GET /api/curriculum error:", error);
    return NextResponse.json({ error: "Failed to fetch curriculum plans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, grade, description } = body;

    if (!name || !grade) {
      return NextResponse.json({ error: "Name and grade are required" }, { status: 400 });
    }

    const plan = await prisma.curriculumPlan.create({
      data: {
        name,
        grade: parseInt(grade, 10),
        description: description || null
      },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: {
            ovuItems: true,
            gItems: true,
            kkItems: true,
            ptItems: true
          }
        }
      }
    });

    return NextResponse.json(plan, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/curriculum error:", error);
    return NextResponse.json({ error: "Failed to create curriculum plan" }, { status: 500 });
  }
}
