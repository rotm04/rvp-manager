import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        classes: {
          select: { id: true, name: true, grade: true, color: true }
        },
        assignments: {
          include: {
            task: {
              include: {
                class: {
                  select: { id: true, name: true, color: true }
                }
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Helper function to compute averages for a list of assignments
    const computeStats = (assignmentsList: typeof student.assignments) => {
      let gradeSum = 0;
      let gradeCount = 0;
      let pointsEarned = 0;
      let pointsMaxTotal = 0;
      let pointsCount = 0;

      for (const item of assignmentsList) {
        // Grade stat
        if (item.grade && item.grade.trim() !== "") {
          const norm = item.grade.replace(",", ".");
          const gVal = parseFloat(norm);
          if (!isNaN(gVal) && gVal >= 1 && gVal <= 5) {
            gradeSum += gVal;
            gradeCount++;
          }
        }

        // Points stat
        if (item.points !== null && item.points !== undefined) {
          pointsEarned += item.points;
          pointsCount++;
          if (item.task.maxPoints) {
            pointsMaxTotal += item.task.maxPoints;
          }
        }
      }

      const gradeAverage = gradeCount > 0 ? Math.round((gradeSum / gradeCount) * 100) / 100 : null;
      const pointsAverage = pointsCount > 0 ? Math.round((pointsEarned / pointsCount) * 10) / 10 : null;
      const pointsPercentage = pointsMaxTotal > 0 ? Math.round((pointsEarned / pointsMaxTotal) * 100) : null;

      return {
        gradeAverage,
        gradeCount,
        pointsEarned,
        pointsMaxTotal,
        pointsAverage,
        pointsPercentage,
        submittedCount: assignmentsList.filter(a => a.submitted).length,
        totalCount: assignmentsList.length
      };
    };

    // Overall stats across all classes
    const overallStats = computeStats(student.assignments);

    // Per-class stats breakdown
    const classStats = student.classes.map(cls => {
      const classAssignments = student.assignments.filter(a => a.task.classId === cls.id);
      const stats = computeStats(classAssignments);
      return {
        classId: cls.id,
        className: cls.name,
        classGrade: cls.grade,
        classColor: cls.color || "#4f46e5",
        stats,
        assignments: classAssignments
      };
    });

    return NextResponse.json({
      student,
      overallStats,
      classStats
    });
  } catch (error: any) {
    console.error("GET /api/students/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch student profile" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    await prisma.student.delete({
      where: { id: studentId }
    });

    return NextResponse.json({ success: true, message: "Student deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/students/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
