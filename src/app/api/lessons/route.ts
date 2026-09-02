import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    const whereClause = classId ? { classId } : {};

    const lessons = await prisma.lesson.findMany({
      where: whereClause,
      include: {
        class: {
          select: { name: true, grade: true, color: true }
        }
      },
      orderBy: {
        date: "asc"
      }
    });

    return NextResponse.json(lessons);
  } catch (error: any) {
    console.error("GET /api/lessons error:", error);
    return NextResponse.json({ error: "Failed to fetch lessons" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      classId,
      recurring,
      startDate,         // e.g. "2026-06-23"
      time,              // e.g. "08:00"
      weeksCount,        // e.g. 10
      delkaTrvani,       // duration in minutes (e.g. 45)
      curriculumPlanId,  // optional ID of plan to assign hromadně
      topic,
      description,
      ovuCode, ovuDescription,
      gCode, gDescription,
      kkCode, kkDescription,
      ptCode, ptDescription
    } = body;

    if (!classId || !startDate || !time) {
      return NextResponse.json({ error: "Class ID, start date, and time are required" }, { status: 400 });
    }

    // Verify class exists
    const classRecord = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    const duration = parseInt(delkaTrvani, 10) || 45;

    // Load curriculum plan items if plan ID is provided
    let planItems: any[] = [];
    if (curriculumPlanId) {
      const plan = await prisma.curriculumPlan.findUnique({
        where: { id: curriculumPlanId },
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
      if (plan && plan.items) {
        planItems = plan.items;
      }
    }

    const lessonsToCreate = [];
    const baseDateTime = new Date(`${startDate}T${time}:00`);

    const count = recurring ? (parseInt(weeksCount, 10) || 1) : 1;

    for (let i = 0; i < count; i++) {
      const lessonDate = new Date(baseDateTime.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const lessonEndDate = new Date(lessonDate.getTime() + duration * 60 * 1000);

      // Determine RVP values for this specific lesson
      let lessonTopic = topic || "Nová hodina";
      let lessonDesc = description || "Bez popisu";
      let oCode = ovuCode || "";
      let oDesc = ovuDescription || "";
      let gC = gCode || "";
      let gD = gDescription || "";
      let kC = kkCode || "";
      let kD = kkDescription || "";
      let pC = ptCode || "";
      let pD = ptDescription || "";

      // If we are batch-assigning a plan, map sequentially
      if (planItems.length > 0) {
        const planItem = planItems[i % planItems.length];
        lessonTopic = planItem.topic;
        lessonDesc = planItem.description;
        
        oCode = planItem.ovuItems.map((o: any) => o.code).join(", ");
        oDesc = planItem.ovuItems.map((o: any) => o.description).join("\n");
        gC = planItem.gItems.map((g: any) => g.code).join(", ");
        gD = planItem.gItems.map((g: any) => g.description).join("\n");
        kC = planItem.kkItems.map((k: any) => k.code).join(", ");
        kD = planItem.kkItems.map((k: any) => k.description).join("\n");
        pC = planItem.ptItems.map((p: any) => p.code).join(", ");
        pD = planItem.ptItems.map((p: any) => p.description).join("\n");
      }

      lessonsToCreate.push({
        classId,
        date: lessonDate,
        delkaTrvani: duration,
        konec: lessonEndDate,
        status: "scheduled",
        topic: lessonTopic,
        description: lessonDesc,
        ovuCode: oCode,
        ovuDescription: oDesc,
        gCode: gC,
        gDescription: gD,
        kkCode: kC,
        kkDescription: kD,
        ptCode: pC,
        ptDescription: pD
      });
    }

    // Insert lessons
    const created = await prisma.lesson.createMany({
      data: lessonsToCreate
    });

    return NextResponse.json({
      success: true,
      count: created.count,
      message: `Successfully generated ${created.count} lessons.`
    });
  } catch (error: any) {
    console.error("POST /api/lessons error:", error);
    return NextResponse.json({ error: "Failed to generate lessons" }, { status: 500 });
  }
}
