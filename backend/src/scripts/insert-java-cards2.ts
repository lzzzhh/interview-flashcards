import prisma from "../db/prisma";
import fs from "fs";

async function main() {
  const cards = JSON.parse(fs.readFileSync("/tmp/java_cards2.json","utf8"));
  let count = 0;
  for (const [id, deckId, question, answer, title, tags, skw, difficulty, subTopic] of cards) {
    try {
      await prisma.card.create({ data: { id, deckId, type:"qa", question, answer, title, tags: JSON.stringify(tags), searchKeywords: JSON.stringify(skw), difficulty, source:"manual", subTopic: subTopic||null } });
      count++;
    } catch(e:any) { if(!e.message?.includes("Unique")) console.warn("Skip "+id); }
  }
  console.log("Inserted "+count+", total Java: "+(30+count));
  await prisma.$disconnect();
}
main();
