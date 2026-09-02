import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding RVP database...");

  // 1. Očekávané výstupy (OVU)
  const ovuData = [
    { code: "I-9-1-01", description: "Žák popíše problém, analyzuje ho a navrhne schéma řešení.", grade: 9 },
    { code: "I-9-1-02", description: "Žák programuje jednoduchý program, používá proměnné, větvení a cykly.", grade: 9 },
    { code: "I-9-2-01", description: "Žák vysvětlí pojem data, typy dat, databáze a efektivně vyhledává.", grade: 9 },
    { code: "I-9-3-01", description: "Žák dodržuje pravidla bezpečnosti a autorských práv v digitálním prostředí.", grade: 9 },
    
    { code: "I-5-1-01", description: "Žák ovládá digitální zařízení, vyhledává data a organizuje soubory.", grade: 5 },
    { code: "I-5-1-02", description: "Žák sestaví jednoduchý blokový program (např. Scratch).", grade: 5 },
    { code: "I-5-2-01", description: "Žák dodržuje základní pravidla bezpečného chování na internetu.", grade: 5 },
  ];

  for (const item of ovuData) {
    await prisma.ocekavanyVystup.upsert({
      where: { code: item.code },
      update: { description: item.description, grade: item.grade },
      create: item,
    });
  }

  // 2. Gramotnosti (G)
  const gData = [
    { code: "G-DIGI", description: "Digitální gramotnost – efektivní, bezpečné a kritické využívání technologií." },
    { code: "G-INFOR", description: "Informační gramotnost – vyhledávání, kritické vyhodnocení a práce s informacemi." },
    { code: "G-MAT", description: "Matematická gramotnost – aplikace logických a algoritmických postupů v praxi." },
    { code: "G-JAZ", description: "Jazyková gramotnost – vyjadřování a porozumění odbornému textu." },
  ];

  for (const item of gData) {
    await prisma.gramotnost.upsert({
      where: { code: item.code },
      update: { description: item.description },
      create: item,
    });
  }

  // 3. Klíčové kompetence (KK)
  const kkData = [
    { code: "KK-U", description: "Kompetence k učení – vyhledává, třídí a systematizuje informace pro efektivní učení." },
    { code: "KK-RP", description: "Kompetence k řešení problémů – analyzuje problémy, navrhuje algoritmy a testuje řešení." },
    { code: "KK-KOM", description: "Kompetence komunikativní – formuluje své myšlenky srozumitelně v digitálním i osobním styku." },
    { code: "KK-S", description: "Kompetence sociální a personální – spolupracuje ve skupině na řešení společného projektu." },
    { code: "KK-O", description: "Kompetence občanská – respektuje autorská práva a chová se eticky v kyberprostoru." },
    { code: "KK-P", description: "Kompetence pracovní – dodržuje ergonomii práce s PC a bezpečnostní standardy." },
  ];

  for (const item of kkData) {
    await prisma.klicovaKompetence.upsert({
      where: { code: item.code },
      update: { description: item.description },
      create: item,
    });
  }

  // 4. Průřezová témata (PT)
  const ptData = [
    { code: "PT-OSV", description: "Osobnostní a sociální výchova – rozvoj komunikace, kooperace a řešení konfliktů." },
    { code: "PT-VDO", description: "Výchova k demokratickému občanství – odpovědné chování v komunitě a na síti." },
    { code: "PT-EGS", description: "Výchova k myšlení v evropských a globálních souvislostech." },
    { code: "PT-MKV", description: "Multikulturní výchova – respektování odlišností a různých kultur." },
    { code: "PT-ENV", description: "Environmentální výchova – vliv technologií na životní prostředí a e-waste." },
    { code: "PT-MEV", description: "Mediální výchova – kritické vnímání médií a digitálního obsahu." },
  ];

  for (const item of ptData) {
    await prisma.prurezoveTema.upsert({
      where: { code: item.code },
      update: { description: item.description },
      create: item,
    });
  }

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
