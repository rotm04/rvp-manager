import { NextResponse } from "next/server";
import prisma from "@/lib/db";

interface ImportItem {
  lessonNumber: number;
  topic: string;
  description: string;
  codes: string[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      classId,
      startDate,         // e.g. "2026-09-01"
      time,              // e.g. "08:00"
      delkaTrvani,       // duration in minutes (e.g. 45)
      intervalDays = 7,  // default 7 days between lessons
      createCurriculumPlan = false,
      planName,
      items
    } = body;

    if (!classId || !startDate || !time) {
      return NextResponse.json(
        { error: "Třída, počáteční datum a čas jsou povinné." },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Nebyly předány žádné platné položky hodin k importu." },
        { status: 400 }
      );
    }

    // Verify class exists
    const classRecord = await prisma.class.findUnique({
      where: { id: classId }
    });

    if (!classRecord) {
      return NextResponse.json({ error: "Třída nebyla nalezena." }, { status: 404 });
    }

    const duration = parseInt(delkaTrvani, 10) || 45;
    const interval = parseInt(intervalDays, 10) || 7;

    // Fetch all RVP records for lookups
    const [allOvu, allG, allKk, allPt] = await Promise.all([
      prisma.ocekavanyVystup.findMany(),
      prisma.gramotnost.findMany(),
      prisma.klicovaKompetence.findMany(),
      prisma.prurezoveTema.findMany()
    ]);

    // Create lookup maps by uppercase trimmed code
    const ovuMap = new Map(allOvu.map(o => [o.code.trim().toUpperCase(), o]));
    const gMap = new Map(allG.map(g => [g.code.trim().toUpperCase(), g]));
    const kkMap = new Map(allKk.map(k => [k.code.trim().toUpperCase(), k]));
    const ptMap = new Map(allPt.map(p => [p.code.trim().toUpperCase(), p]));

    const baseDateTime = new Date(`${startDate}T${time}:00`);
    if (isNaN(baseDateTime.getTime())) {
      return NextResponse.json({ error: "Neplatný formát počátečního data nebo času." }, { status: 400 });
    }

    const lessonsToCreate = [];
    const planItemsToCreate: {
      topic: string;
      description: string;
      pocetHodin: number;
      order: number;
      ovuItemIds: string[];
      gItemIds: string[];
      kkItemIds: string[];
      ptItemIds: string[];
    }[] = [];

    // Sort items by lessonNumber
    const sortedItems: ImportItem[] = [...items].sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0));

    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i];
      const lessonIdx = (item.lessonNumber && item.lessonNumber > 0) ? item.lessonNumber - 1 : i;

      const lessonDate = new Date(baseDateTime.getTime() + lessonIdx * interval * 24 * 60 * 60 * 1000);
      const lessonEndDate = new Date(lessonDate.getTime() + duration * 60 * 1000);

      const matchedOvu: { code: string; desc: string; id?: string }[] = [];
      const matchedG: { code: string; desc: string; id?: string }[] = [];
      const matchedKk: { code: string; desc: string; id?: string }[] = [];
      const matchedPt: { code: string; desc: string; id?: string }[] = [];

      // Parse each code
      if (Array.isArray(item.codes)) {
        for (const rawCode of item.codes) {
          const code = rawCode.trim();
          if (!code) continue;
          const codeUpper = code.toUpperCase();

          if (ovuMap.has(codeUpper)) {
            const found = ovuMap.get(codeUpper)!;
            matchedOvu.push({ code: found.code, desc: found.description, id: found.id });
          } else if (gMap.has(codeUpper)) {
            const found = gMap.get(codeUpper)!;
            matchedG.push({ code: found.code, desc: found.description, id: found.id });
          } else if (kkMap.has(codeUpper)) {
            const found = kkMap.get(codeUpper)!;
            matchedKk.push({ code: found.code, desc: found.description, id: found.id });
          } else if (ptMap.has(codeUpper)) {
            const found = ptMap.get(codeUpper)!;
            matchedPt.push({ code: found.code, desc: found.description, id: found.id });
          } else {
            // Heuristic categorization for codes not yet in DB
            if (codeUpper.startsWith("INF-") || codeUpper.startsWith("I-") || codeUpper.startsWith("OVU-") || codeUpper.includes("-ZV")) {
              matchedOvu.push({ code, desc: "" });
            } else if (codeUpper.startsWith("G-") || codeUpper.startsWith("DIG-")) {
              matchedG.push({ code, desc: "" });
            } else if (codeUpper.startsWith("K-") || codeUpper.startsWith("KK-") || codeUpper.startsWith("KRP-") || codeUpper.startsWith("KKK-") || codeUpper.startsWith("KOM-")) {
              matchedKk.push({ code, desc: "" });
            } else if (codeUpper.startsWith("PT-") || codeUpper.startsWith("VDO-") || codeUpper.startsWith("OSV-") || codeUpper.startsWith("EGS-") || codeUpper.startsWith("EV-") || codeUpper.startsWith("MV-")) {
              matchedPt.push({ code, desc: "" });
            } else {
              matchedOvu.push({ code, desc: "" });
            }
          }
        }
      }

      lessonsToCreate.push({
        classId,
        date: lessonDate,
        delkaTrvani: duration,
        konec: lessonEndDate,
        status: "scheduled",
        topic: item.topic || `Hodina č. ${item.lessonNumber || i + 1}`,
        description: item.description || "",
        ovuCode: matchedOvu.map(x => x.code).join(", "),
        ovuDescription: matchedOvu.map(x => x.desc).filter(Boolean).join("\n"),
        gCode: matchedG.map(x => x.code).join(", "),
        gDescription: matchedG.map(x => x.desc).filter(Boolean).join("\n"),
        kkCode: matchedKk.map(x => x.code).join(", "),
        kkDescription: matchedKk.map(x => x.desc).filter(Boolean).join("\n"),
        ptCode: matchedPt.map(x => x.code).join(", "),
        ptDescription: matchedPt.map(x => x.desc).filter(Boolean).join("\n")
      });

      if (createCurriculumPlan) {
        planItemsToCreate.push({
          topic: item.topic || `Téma ${item.lessonNumber || i + 1}`,
          description: item.description || "",
          pocetHodin: 1,
          order: i + 1,
          ovuItemIds: matchedOvu.map(x => x.id).filter(Boolean) as string[],
          gItemIds: matchedG.map(x => x.id).filter(Boolean) as string[],
          kkItemIds: matchedKk.map(x => x.id).filter(Boolean) as string[],
          ptItemIds: matchedPt.map(x => x.id).filter(Boolean) as string[]
        });
      }
    }

    // Insert all lessons
    const createdLessons = await prisma.lesson.createMany({
      data: lessonsToCreate
    });

    let createdPlan = null;
    if (createCurriculumPlan) {
      const pName = planName?.trim() || `Plán z importu – ${classRecord.name} (${new Date().toLocaleDateString("cs-CZ")})`;
      
      createdPlan = await prisma.curriculumPlan.create({
        data: {
          name: pName,
          grade: classRecord.grade,
          description: `Automaticky vytvořený plán z importu ${sortedItems.length} vyučovacích hodin.`
        }
      });

      for (const pItem of planItemsToCreate) {
        await prisma.curriculumPlanItem.create({
          data: {
            planId: createdPlan.id,
            topic: pItem.topic,
            description: pItem.description,
            pocetHodin: pItem.pocetHodin,
            order: pItem.order,
            ovuItems: pItem.ovuItemIds.length > 0 ? { connect: pItem.ovuItemIds.map(id => ({ id })) } : undefined,
            gItems: pItem.gItemIds.length > 0 ? { connect: pItem.gItemIds.map(id => ({ id })) } : undefined,
            kkItems: pItem.kkItemIds.length > 0 ? { connect: pItem.kkItemIds.map(id => ({ id })) } : undefined,
            ptItems: pItem.ptItemIds.length > 0 ? { connect: pItem.ptItemIds.map(id => ({ id })) } : undefined
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      count: createdLessons.count,
      planCreated: !!createdPlan,
      planId: createdPlan?.id,
      message: `Úspěšně naimportováno ${createdLessons.count} vyučovacích hodin.`
    }, { status: 201 });

  } catch (error: any) {
    console.error("POST /api/lessons/import error:", error);
    return NextResponse.json({ error: "Import vyučovacích hodin selhal: " + (error.message || "") }, { status: 500 });
  }
}
