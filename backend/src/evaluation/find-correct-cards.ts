// Quick fix-all: find correct cards + update test cases + searchKeywords
import prisma from '../db/prisma';
import { readFileSync, writeFileSync } from 'fs';

async function main() {
  // First, find correct cards for each query
  const lookup = async (terms: string[], deck?: string) => {
    const where: any = { OR: terms.map(t => ({ searchKeywords: { contains: t } })) };
    if (deck) where.deckId = deck;
    const cards = await prisma.card.findMany({ where, select: { id: true, deckId: true, titleCn: true, title: true } });
    return cards.map(c => c.id);
  };

  // Find loss function specific cards
  const lossCards = await prisma.card.findMany({
    where: {
      OR: [
        { titleCn: { contains: '损失' } }, { title: { contains: 'loss' } }, { title: { contains: 'Loss' } },
        { searchKeywords: { contains: '交叉熵' } }, { searchKeywords: { contains: 'Focal loss' } },
        { question: { contains: '损失函数' } }
      ],
      deckId: 'machine-learning',
    },
    select: { id: true, titleCn: true, title: true }
  });
  console.log('Loss function cards:');
  for (const c of lossCards) console.log('  ' + c.id + ' ' + (c.titleCn || c.title || '?'));

  // Transfer learning cards
  const transferCards = await prisma.card.findMany({
    where: {
      OR: [
        { searchKeywords: { contains: '迁移学习' } }, { searchKeywords: { contains: 'transfer learning' } },
        { titleCn: { contains: '迁移' } }, { title: { contains: 'transfer' } },
      ]
    },
    select: { id: true, titleCn: true, title: true, deckId: true }
  });
  console.log('\nTransfer learning cards:');
  for (const c of transferCards) console.log('  ' + c.id + ' /' + c.deckId + '/ ' + (c.titleCn || c.title || '?'));

  // Iteration/jargon cards
  const iterCards = await prisma.card.findMany({
    where: {
      OR: [
        { searchKeywords: { contains: '迭代' } }, { titleCn: { contains: '迭代' } },
        { title: { contains: '迭代' } }, { question: { contains: '迭代' } },
      ],
      deckId: 'jargon',
    },
    select: { id: true, titleCn: true, title: true }
  });
  console.log('\n迭代 (jargon) cards:');
  for (const c of iterCards) console.log('  ' + c.id + ' ' + (c.titleCn || c.title || '?'));

  // Data metrics/指标体系 cards
  const metricsCards = await prisma.card.findMany({
    where: {
      OR: [
        { searchKeywords: { contains: '指标' } }, { searchKeywords: { contains: 'metric' } },
        { searchKeywords: { contains: 'KPI' } }, { searchKeywords: { contains: 'OKR' } },
        { searchKeywords: { contains: 'north star' } }, { searchKeywords: { contains: '北极星' } },
        { titleCn: { contains: '指标' } }, { title: { contains: 'metric' } },
      ]
    },
    select: { id: true, titleCn: true, title: true, deckId: true }
  });
  console.log('\n指标体系 cards:');
  for (const c of metricsCards) console.log('  ' + c.id + ' /' + c.deckId + '/ ' + (c.titleCn || c.title || '?'));

  // AUC/ROC/F1 cards
  const aucCards = await prisma.card.findMany({
    where: {
      OR: [
        { searchKeywords: { contains: 'AUC' } }, { searchKeywords: { contains: 'ROC' } },
        { searchKeywords: { contains: 'F1' } }, { searchKeywords: { contains: '精确率' } },
        { titleCn: { contains: 'AUC' } }, { titleCn: { contains: 'ROC' } },
        { titleCn: { contains: 'F1' } },
      ]
    },
    select: { id: true, deckId: true, titleCn: true, title: true }
  });
  console.log('\nAUC/ROC/F1 cards:');
  for (const c of aucCards) console.log('  ' + c.id + ' /' + c.deckId + '/ ' + (c.titleCn || c.title || '?'));

  // Label/One-Hot encoding cards
  const encCards = await prisma.card.findMany({
    where: {
      OR: [
        { searchKeywords: { contains: 'One-Hot' } }, { searchKeywords: { contains: '编码' } },
        { searchKeywords: { contains: 'Label' } }, { searchKeywords: { contains: 'Target Encoding' } },
        { titleCn: { contains: '编码' } },
      ],
      deckId: 'machine-learning',
    },
    select: { id: true, titleCn: true, title: true }
  });
  console.log('\nEncoding cards:');
  for (const c of encCards) console.log('  ' + c.id + ' ' + (c.titleCn || c.title || '?'));

  // Mini batch / batch training cards
  const batchCards = await prisma.card.findMany({
    where: {
      OR: [
        { searchKeywords: { contains: 'mini-batch' } }, { searchKeywords: { contains: 'batch' } },
        { searchKeywords: { contains: 'SGD' } }, { searchKeywords: { contains: '梯度下降' } },
        { titleCn: { contains: 'Batch' } }, { titleCn: { contains: 'batch' } },
      ],
      deckId: 'machine-learning',
    },
    select: { id: true, titleCn: true, title: true }
  });
  console.log('\nBatch training cards:');
  for (const c of batchCards.slice(0, 8)) console.log('  ' + c.id + ' ' + (c.titleCn || c.title || '?'));

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
