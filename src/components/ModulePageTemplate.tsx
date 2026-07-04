import { useRef, useEffect, useState } from 'react';
import { Settings, FileText, Plus, Trash2 } from 'lucide-react';
import BackButton from './BackButton';

export interface ModuleTopicCardModel {
  key: string;
  title: string;
  newCount: number;
  dueCount: number;
  total: number;
  completed: number;
  progress: number;
  isCustom?: boolean;
}

interface Props {
  categoryLabel: string;
  moduleDue: number;
  totalNewCards: number;
  totalCards: number;
  topics: ModuleTopicCardModel[];
  onBack: () => void;
  onStartReview: () => void;
  onStartNewCards?: () => void;
  onTopicClick: (topic: ModuleTopicCardModel) => void;
  onOpenCardManager?: () => void;
  onCreateTopic?: () => void;
  onDeleteTopic?: (topic: ModuleTopicCardModel) => void;
  onEnterDeleteMode?: () => void;
  deleteMode?: boolean;
}

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const BLUE = 'var(--blue)';
const ORANGE = 'var(--orange)';
const CARD_BG = 'var(--card-bg)';
const CARD_BORDER = 'var(--card-border)';

export default function ModulePageTemplate({
  categoryLabel, moduleDue, totalNewCards, totalCards, topics,
  onBack, onStartReview, onStartNewCards, onTopicClick, onOpenCardManager, onCreateTopic, onDeleteTopic, onEnterDeleteMode, deleteMode,
}: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu]);

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <BackButton onClick={onBack} />
        <h1 className="nav-title">{categoryLabel}</h1>
        {(onOpenCardManager || onCreateTopic || onDeleteTopic) && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="module-page-icon-button"
              aria-label="模块设置"
              aria-expanded={showMenu}
            >
              <Settings className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="module-page-menu absolute right-0 top-10 z-30 min-w-[140px] rounded-xl border py-1.5 shadow-xl">
                {onOpenCardManager && (
                  <button onClick={() => { setShowMenu(false); onOpenCardManager(); }} className="module-page-menu-item">
                    <FileText className="w-4 h-4" />卡片管理
                  </button>
                )}
                {onCreateTopic && (
                  <button onClick={() => { setShowMenu(false); onCreateTopic(); }} className="module-page-menu-item">
                    <Plus className="w-4 h-4" />新增专题
                  </button>
                )}
                {onDeleteTopic && (
                  <button onClick={() => { setShowMenu(false); onEnterDeleteMode?.(); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-[13px] text-left" style={{ color: '#EF4444' }}>
                    <Trash2 className="w-4 h-4" />删除专题
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 flex justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-8 pb-24">

        {/* Stats Card */}
        <div className="rounded-2xl p-4 mb-4 border flex flex-col" style={{ backgroundColor: CARD_BG, borderColor: CARD_BORDER, height: '120px' }}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatBlock label="待复习" value={moduleDue} color={ORANGE} />
            <StatBlock label="新卡" value={totalNewCards} color={BLUE} />
            <StatBlock label="总卡片" value={totalCards} color="#CBD5E1" />
          </div>
          <div className="flex gap-2">
            {onStartNewCards && (
              <button
                onClick={onStartNewCards}
                className="flex-1 py-1 rounded-xl text-[14px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${BLUE}, #2563EB)` }}
              >
                开始学习新卡
              </button>
            )}
            <button
              onClick={onStartReview}
              className="flex-1 py-1 rounded-xl text-[14px] font-bold text-white"
              style={{ background: onStartNewCards ? `linear-gradient(135deg, ${ORANGE}, #EA580C)` : `linear-gradient(135deg, ${BLUE}, #2563EB)` }}
            >
              开始复习
            </button>
          </div>
        </div>

        {/* Delete Banner */}
        {deleteMode && (
          <div className="mb-3 flex items-center justify-between rounded-xl border px-3 py-2" style={{ borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.1)' }}>
            <span className="text-[12px] font-medium" style={{ color: '#EF4444' }}>点击专题卡片上的删除按钮</span>
            <button onClick={() => onEnterDeleteMode?.()} className="text-[12px] font-semibold" style={{ color: '#EF4444' }}>取消</button>
          </div>
        )}

        {/* Topic Grid */}
        <div className="grid grid-cols-2 gap-2">
          {topics.map((topic) => (
            <button
              key={topic.key}
              onClick={() => onTopicClick(topic)}
              className="rounded-xl p-3 text-left border transition-colors relative"
              style={{ borderColor: CARD_BORDER, backgroundColor: CARD_BG }}
            >
              <h3 className="text-[13px] font-bold truncate" style={{ color: TEXT_PRIMARY }}>{topic.title}</h3>
              <div className="flex gap-3 mt-2">
                <div>
                  <div className="text-[10px]" style={{ color: TEXT_MUTED }}>新卡</div>
                  <div className="text-[13px] font-semibold" style={{ color: BLUE }}>{topic.newCount}</div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: TEXT_MUTED }}>待复习</div>
                  <div className="text-[13px] font-semibold" style={{ color: ORANGE }}>{topic.dueCount}</div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: TEXT_MUTED }}>总数</div>
                  <div className="text-[13px] font-semibold" style={{ color: TEXT_PRIMARY }}>{topic.total}</div>
                </div>
              </div>
              {deleteMode && onDeleteTopic && (
                <span onClick={(e) => { e.stopPropagation(); onDeleteTopic(topic); }} className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(239,68,68,0.2)' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" stroke="#EF4444" strokeWidth="2" fill="none"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </span>
              )}
            </button>
          ))}
        </div>

      </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[13px] mb-1" style={{ color }}>{label}</div>
      <div className="text-[16px] font-bold" style={{ color }}>{value}</div>
    </div>
  );
}
