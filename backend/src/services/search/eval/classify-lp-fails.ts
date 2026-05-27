// Classify all learning-path failures
import { TEST_CASES } from '../../../evaluation/test-cases';
import { conceptGraphLookup } from '../concept-graph';

const lpCases = TEST_CASES.filter(c => c.group === 'learning-path');

type Class = 'topic_mapping_needed' | 'graph_node_missing' | 'missing_prereq_edges' | 'card_coverage_gap' | 'out_of_scope';

interface Classified {
  id: string; query: string; rawTopic: string; classification: Class; action: string;
}

function classify(): Classified[] {
  const results: Classified[] = [];

  for (const c of lpCases) {
    const q = c.query;
    // Try topic extraction
    let topic = q.replace(/(学习路线|怎么学|如何学|怎么入门|从零开始学|怎么入行|要学什么|要补什么|怎么快速|快速入门|开发学习)$/g, '').trim();
    if (topic === q) topic = topic.replace(/^(怎么学|如何学|怎么入门|我想学|我要学|想学|学|学习)\s*/, '').trim();

    const node = conceptGraphLookup(topic);
    let classification: Class = 'graph_node_missing';
    let action = `add graph node for "${topic}"`;

    // Already covered
    if (node) {
      // Check if node has prerequisite edges
      if ((node.relations || []).filter((r: any) => r.type === 'prerequisite' || r.type === 'foundation').length === 0) {
        classification = 'missing_prereq_edges';
        action = `add prerequisite edges to "${node.id}"`;
      } else {
        continue; // skip — already good
      }
    }

    // Topic mapping needed
    if (q.includes('从零学AI') || q.includes('AI数学') || q.includes('AI 数学')) {
      classification = 'topic_mapping_needed';
      action = `map to linear_algebra + probability + statistics nodes`;
    } else if (q.includes('到底怎么快速入门ML') || q.includes('快速入门ML')) {
      classification = 'topic_mapping_needed';
      action = `map to "机器学习"`;
    } else if (q.includes('解释性文章') || q.includes('解释性')) {
      classification = 'out_of_scope';
      action = `content type query, not topic — exclude`;
    } else if (q.includes('AI产品经理')) {
      classification = 'out_of_scope';
      action = `career role query — future module`;
    } else if (q.includes('Snap') || q.includes('AR')) {
      classification = 'out_of_scope';
      action = `AR/social media — excluded module`;
    } else if (q.includes('后端转算法')) {
      classification = 'topic_mapping_needed';
      action = `multi-topic: 算法 + 机器学习 graph nodes`;
    } else if (q.includes('Agent开发')) {
      classification = 'graph_node_missing';
      action = `add "Agent开发" graph node (alias for tool_use + agent)`;  
    } else if (q.includes('LLM大模型') || q.includes('大模型')) {
      classification = 'topic_mapping_needed';
      action = `"LLM大模型" → "大模型" graph node`;
    } else if (q.includes('NLP')) {
      classification = 'graph_node_missing';
      action = `add "NLP" graph node`;
    } else if (q.includes('CV') || q.includes('图像分类')) {
      classification = 'graph_node_missing';
      action = `add "CV/计算机视觉" graph node`;  
    } else if (q.includes('CICD') || q.includes('CI/CD')) {
      classification = 'graph_node_missing';
      action = `add "CI/CD" graph node (already have cicd node)`;
    } else if (q.includes('AB实验') || q.includes('AB实验平台')) {
      classification = 'graph_node_missing';
      action = `add "AB测试" graph node`;
    }

    results.push({ id: (c as any).id || '', query: q.slice(0, 50), rawTopic: topic, classification, action });
  }

  return results;
}

const classified = classify();
console.log(`Total learning-path: ${lpCases.length}, classified: ${classified.length}`);

const byClass: Record<string, Classified[]> = {};
for (const c of classified) {
  if (!byClass[c.classification]) byClass[c.classification] = [];
  byClass[c.classification].push(c);
}

for (const [cls, items] of Object.entries(byClass)) {
  console.log(`\n${cls} (${items.length}):`);
  for (const item of items) console.log(`  "${item.query}" → ${item.action}`);
}
