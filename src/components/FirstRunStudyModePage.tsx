import { useState } from 'react';
import type { StudyModeConfig } from '../types';
import { useStatsSnapshot } from '../repositories/useStatsSnapshot';
import { applyStudyModeConfig } from '../utils/applyStudyModeConfig';
import StudyModeSelector from './StudyModeSelector';

interface Props {
  onComplete: (config: StudyModeConfig) => void;
}

export default function FirstRunStudyModePage({ onComplete }: Props) {
  const { snapshot, loading, refresh } = useStatsSnapshot();
  const [submitting, setSubmitting] = useState(false);

  const handleApply = async (config: StudyModeConfig) => {
    setSubmitting(true);
    await applyStudyModeConfig(config, snapshot);
    await refresh().catch(() => {});
    onComplete(config);
  };

  return (
    <StudyModeSelector
      snapshot={snapshot}
      variant="screen"
      title="选择学习模式"
      description={loading ? '正在同步牌组数据，当前也可以先选择。' : '选择后会作为每日新卡、复习上限和已解决阈值的来源。'}
      confirmLabel="开始使用"
      submitting={submitting}
      onApply={handleApply}
    />
  );
}
