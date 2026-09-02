import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: planId } = await params;
    const items = await prisma.curriculumPlanItem.findMany({
      where: { planId },
      include: {
        ovuItems: true,
        gItems: true,
        kkItems: true,
        ptItems: true
      },
      orderBy: { order: "asc" }
    });
    return NextResponse.json(items);
  } catch (error: any) {
    console.error("GET /api/curriculum/[id]/items error:", error);
    return NextResponse.json({ error: "Failed to fetch curriculum items" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const planId = resolvedParams.id;
    console.log("DEBUG: POST /api/curriculum/[id]/items - resolvedParams:", resolvedParams, "planId:", planId);

    const body = await request.json();
    const {
      topic,
      description,
      pocetHodin,
      ovuIds, // array of strings (IDs)
      gIds,
      kkIds,
      ptIds
    } = body;

    if (!topic) {
      return NextResponse.json({ error: "Topic title is required" }, { status: 400 });
    }

    // Check if plan exists
    const plan = await prisma.curriculumPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) {
      console.log("DEBUG: Plan not found in database for ID:", planId);
      return NextResponse.json({ error: "Curriculum plan not found" }, { status: 404 });
    }

    // Determine the next order index
    const lastItem = await prisma.curriculumPlanItem.findFirst({
      where: { planId },
      orderBy: { order: "desc" }
    });
    const order = lastItem ? lastItem.order + 1 : 1;

    // Filter out any empty strings or invalid IDs from inputs
    const cleanOvuIds =ovuIds && Array.isArray(ovuIds) ? ovuIds.filter((id: string) => id && id.trim() !== "") : [];
    const cleanGIds = gIds && Array.isArray(gIds) ? gIds.filter((id: string) => id && id.trim() !== "") : [];
    const cleanKkIds = kkIds && Array.isArray(kkIds) ? kkIds.filter((id: string) => id && id.trim() !== "") : [];
    const cleanPtIds = ptIds && Array.isArray(ptIds) ? ptIds.filter((id: string) => id && id.trim() !== "") : [];

    const newItem = await prisma.curriculumPlanItem.create({
      data: {
        planId,
        topic,
        description: description || "",
        pocetHodin: pocetHodin ? parseInt(pocetHodin, 10) : 1,
        order,
        ovuItems: cleanOvuIds.length > 0 ? {
          connect: cleanOvuIds.map((id: string) => ({ id }))
        } : undefined,
        gItems: cleanGIds.length > 0 ? {
          connect: cleanGIds.map((id: string) => ({ id }))
        } : undefined,
        kkItems: cleanKkIds.length > 0 ? {
          connect: cleanKkIds.map((id: string) => ({ id }))
        } : undefined,
        ptItems: cleanPtIds.length > 0 ? {
          connect: cleanPtIds.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        ovuItems: true,
        gItems: true,
        kkItems: true,
        ptItems: true
      }
    });

    return NextResponse.json(newItem, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/curriculum/[id]/items error:", error);
    return NextResponse.json({ error: "Failed to create curriculum item" }, { status: 500 });
  }
}
