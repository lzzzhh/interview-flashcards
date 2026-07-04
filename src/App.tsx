import { useRef, useCallback, useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { useKeyboard } from './hooks/useKeyboard';
import HomePage from './components/HomePage';
import CardView from './components/CardView';
import CardActions from './components/CardActions';
import ProgressBar from './components/ProgressBar';
import DarkModeToggle from './components/DarkModeToggle';
import EmptyState from './components/EmptyState';
import CardDatabasePage from './components/CardDatabasePage';
import VectorDatabasePage from './components/VectorDatabasePage';
import SubModulePicker from './components/SubModulePicker';
import DeckPage from './components/DeckPage';
import StatsPage from './components/StatsPage';
import ProfilePage from './components/ProfilePage';
import SavedCardsPage from './components/SavedCardsPage';
import RecoveryPage from './components/RecoveryPage';
import AISearchPage from './components/AISearchPage';
import AgentHubPage from './components/AgentHubPage';
import CardDraftReviewPage from './components/CardDraftReviewPage';
import ProcessingBadge from './components/ProcessingBadge';
import JobPrepPage from './components/JobPrepPage';
import JobPrepBootScreen from './components/JobPrepBootScreen';
import IngestPage from './components/IngestPage';
import ApiSettingsPage from './components/ApiSettingsPage';
import TagManagerPage from './components/TagManagerPage';
import MockInterviewPage from './components/MockInterviewPage';
import ResumeProjectPage from './components/ResumeProjectPage';
import LearningPlanListPage from './components/LearningPlanListPage';
import LearningPlanDetailPage from './components/LearningPlanDetailPage';
import BackButton from './components/BackButton';
import FirstRunStudyModePage from './components/FirstRunStudyModePage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { loadStudyModeConfig } from './utils/studyModeConfig';
import type { FlashCard, StudyModeConfig } from './types';
function StudyPage({ onBack, exitOnBack = false, autoCloseOnComplete = false }: { onBack: () => void; exitOnBack?: boolean; autoCloseOnComplete?: boolean }) {
  const { state, dispatch, currentCard, totalNew, dueCountByCategory } = useAppContext();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const getCurrentCardId = useCallback(() => currentCard?.id ?? null, [currentCard]);
  useKeyboard({ dispatch, searchInputRef, getCurrentCardId });

  const cardCount = state.visibleCardIds.length;
  const completedVisibleIds = new Set(state.studyQueueCompletedIds);
  const progressTotal = state.studyQueueTotal > 0 ? state.studyQueueTotal : cardCount;
  const completedCount = state.studyQueueTotal > 0
    ? state.visibleCardIds.filter((id) => completedVisibleIds.has(id)).length
    : state.currentVisibleIndex + 1;
  const progressCurrent = Math.min(state.currentVisibleIndex, Math.max(0, progressTotal - 1));
  const progressMastered = state.studyQueueTotal > 0
    ? completedCount
    : state.currentVisibleIndex + 1;

  // 复习完毕自动返回首页
  useEffect(() => {
    if (state.studyMode === 'review' && (dueCountByCategory[state.category] ?? 0) === 0) {
      onBack();
    }
  }, [state.studyMode, state.category, dueCountByCategory, onBack]);

  useEffect(() => {
    if (!autoCloseOnComplete || state.studyQueueTotal <= 0) return;
    if (state.studyQueueCompletedIds.length >= state.studyQueueTotal) {
      onBack();
    }
  }, [autoCloseOnComplete, state.studyQueueCompletedIds.length, state.studyQueueTotal, onBack]);

  if (state.studyMode === 'choose') {
    return <SubModulePicker onBack={onBack} />;
  }

  return (
    <div className="dark-bg light-bg h-dvh flex flex-col overflow-hidden text-gray-900 dark:text-gray-100 transition-colors">
      <div className="relative z-10 max-w-md mx-auto w-full px-3 sm:px-4 flex flex-col flex-1 min-h-0">

        {/* Top bar — fixed height */}
        <div className="sticky top-0 z-20 shrink-0 py-3 flex items-center justify-between backdrop-blur-lg dark:bg-transparent -mx-3 sm:-mx-4 px-3 sm:px-4">
          <BackButton onClick={() => exitOnBack ? onBack() : dispatch({ type: 'SET_STUDY_MODE', payload: 'choose' })} />
          <DarkModeToggle />
        </div>

        {/* Status messages */}
        {state.studyMode === 'new' && !state.planCardIds && totalNew === 0 && (
          <div className="shrink-0 text-center py-8 text-gray-400">🎉 所有卡片都已学过！<button onClick={() => exitOnBack ? onBack() : dispatch({ type: 'SET_STUDY_MODE', payload: 'choose' })} className="ml-2 text-primary underline">返回</button></div>
        )}

        {/* Card area — fills remaining space, fixed height per card */}
        {currentCard ? (
          <div className="flex-1 flex flex-col min-h-0" key={currentCard.id}>
            <div className="flex-1 min-h-0">
              <CardView card={currentCard} showApproach={state.showApproach} showCode={state.showCode} />
            </div>
            <div className="shrink-0">
              <CardActions />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center min-h-0">
            <EmptyState message={state.searchQuery ? `未找到「${state.searchQuery}」` : undefined} />
          </div>
        )}

        {/* Progress bar — fixed at bottom */}
        {cardCount > 0 && (
          <div className="shrink-0 pt-1 pb-6">
            <ProgressBar current={progressCurrent} total={progressTotal} mastered={progressMastered} />
          </div>
        )}
      </div>
    </div>
  );
}

function AppInner() {
  const [studyCategory, setStudyCategory] = useState<string | null>(null);
  const [showDecks, setShowDecks] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileSubPage, setProfileSubPage] = useState<string | null>(null);
  const [learningPlanId, setLearningPlanId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [agentPage, setAgentPage] = useState<string | null>(null);
  const [studyExitOnBack, setStudyExitOnBack] = useState(false);
  const [studyAutoCloseOnComplete, setStudyAutoCloseOnComplete] = useState(false);
  const [modeGate, setModeGate] = useState<'checking' | 'required' | 'ready'>('checking');
  const todayStudyRequestRef = useRef(0);
  const { dispatch, dataReady } = useAppContext();

  useEffect(() => {
    if (!dataReady) return;
    setModeGate(loadStudyModeConfig() ? 'ready' : 'required');
  }, [dataReady]);

  const handleInitialModeComplete = useCallback((config: StudyModeConfig) => {
    dispatch({ type: 'SET_STUDY_MODE_CONFIG', payload: config });
    if (config.selectedDecks[0]) {
      dispatch({ type: 'SET_CATEGORY', payload: config.selectedDecks[0] });
    }
    setModeGate('ready');
  }, [dispatch]);

  const handleEnterStudy = useCallback(async (category: string, cardId?: string, options?: { exitOnBack?: boolean }) => {
    todayStudyRequestRef.current += 1;
    setStudyCategory(category); setShowDecks(false); setShowSearch(false); setShowProfile(false); setShowStats(false);
    setAgentPage(null);
    setStudyExitOnBack(Boolean(options?.exitOnBack));
    setStudyAutoCloseOnComplete(false);
    dispatch({ type: 'SET_CATEGORY', payload: category });
    dispatch({ type: 'SET_API_SOURCE', payload: false });
    if (cardId) dispatch({ type: 'JUMP_TO_CARD', payload: { category, cardId } });
  }, [dispatch]);

  const handleStartTodayStudy = useCallback((deckIds: string[]) => {
    todayStudyRequestRef.current += 1;
    setStudyCategory('__today__');
    setShowDecks(false);
    setShowSearch(false);
    setShowProfile(false);
    setShowStats(false);
    setAgentPage(null);
    setStudyExitOnBack(true);
    setStudyAutoCloseOnComplete(false);
    dispatch({ type: 'START_TODAY_STUDY', payload: { deckIds } });
  }, [dispatch]);

  const handleStudyCardFromProfile = useCallback((card: FlashCard) => {
    todayStudyRequestRef.current += 1;
    setStudyCategory(`__single__:${card.id}`);
    setStudyExitOnBack(true);
    setStudyAutoCloseOnComplete(true);
    setAgentPage(null);
    dispatch({ type: 'START_SINGLE_CARD_STUDY', payload: { card, countTowardsDaily: false } });
  }, [dispatch]);

  // Handle deck:xxx and deck:xxx:new navigation as side effect
  useEffect(() => {
    if (agentPage?.startsWith('deck:')) {
      const rest = agentPage.slice(5);
      const parts = rest.split(':');
      const deckId = parts[0];
      const startNew = parts[1] === 'new';
      setAgentPage(null);
      handleEnterStudy(deckId, undefined, { exitOnBack: true });
      if (startNew) {
        dispatch({ type: 'SET_STUDY_MODE', payload: 'new' });
      }
    }
  }, [agentPage, handleEnterStudy, dispatch]);

  if (!dataReady || modeGate === 'checking') {
    return <AppLoadingScreen message="正在加载本地数据..." />;
  }

  if (modeGate === 'required') {
    return <FirstRunStudyModePage onComplete={handleInitialModeComplete} />;
  }

  // Compute content — avoid early returns so ProcessingBadge renders globally
  let content: React.ReactNode = null;

  if (showDecks) {
    content = <DeckPage onEnterStudy={handleEnterStudy} onBack={() => setShowDecks(false)} />;
  } else if (showStats) {
    content = <StatsPage onBack={() => setShowStats(false)} />;
  } else if (showProfile) {
    if (profileSubPage === 'card-database') content = <CardDatabasePage onBack={() => setProfileSubPage(null)} onStudyCard={handleStudyCardFromProfile} />;
    else if (profileSubPage === 'saved-cards') content = <SavedCardsPage onBack={() => setProfileSubPage(null)} onStudyCard={handleStudyCardFromProfile} />;
    else if (profileSubPage === 'recovery') content = <RecoveryPage onBack={() => setProfileSubPage(null)} onStudyCard={handleStudyCardFromProfile} />;
    else if (profileSubPage === 'vector-database') content = <VectorDatabasePage onBack={() => setProfileSubPage(null)} />;
    else if (profileSubPage === 'tag-manager') content = <TagManagerPage onBack={() => setProfileSubPage(null)} />;
    else if (profileSubPage === 'api-settings') content = <ApiSettingsPage onBack={() => setProfileSubPage(null)} />;
    else if (profileSubPage === 'learning-plans' && learningPlanId) content = <LearningPlanDetailPage planId={learningPlanId} onBack={() => setLearningPlanId(null)} onStudyCard={handleStudyCardFromProfile} onStudyPlan={(cardIds: string[]) => {
      dispatch({ type: 'START_PLAN_STUDY', payload: { cardIds } });
      setShowProfile(false);
      setLearningPlanId(null);
      setProfileSubPage(null);
      setStudyExitOnBack(true);
      setStudyAutoCloseOnComplete(false);
      setStudyCategory('leetcode');
    }} />;
    else if (profileSubPage === 'learning-plans') content = <LearningPlanListPage onBack={() => setProfileSubPage(null)} onViewPlan={(id: string) => setLearningPlanId(id)} />;
    else content = <ProfilePage onBack={() => { setShowProfile(false); setProfileSubPage(null); }} onNavigate={setProfileSubPage} />;
  } else if (showSearch) {
    if (agentPage === 'search') content = <AISearchPage onBack={() => setAgentPage(null)} onEnterStudy={handleEnterStudy} />;
    else if (agentPage === 'ingest') content = <IngestPage onBack={() => setAgentPage(null)} onNavigate={setAgentPage} />;
    else if (agentPage === 'drafts') content = <CardDraftReviewPage onBack={() => setAgentPage(null)} onNavigate={setAgentPage} />;
    else if (agentPage?.startsWith('drafts:')) content = <CardDraftReviewPage onBack={() => setAgentPage(null)} onNavigate={setAgentPage} documentId={agentPage.slice(7)} />;
    else if (agentPage === 'jobprep') content = <JobPrepBootScreen onBack={() => setAgentPage(null)} onReady={() => setAgentPage('jobprep-chat')} />;
    else if (agentPage === 'jobprep-chat') content = <JobPrepPage onBack={() => setAgentPage(null)} />;
    else if (agentPage === 'mock-interview') content = <MockInterviewPage onBack={() => setAgentPage(null)} />;
    else if (agentPage === 'resume-project') content = <ResumeProjectPage onBack={() => setAgentPage(null)} />;
    else content = <AgentHubPage onBack={() => setShowSearch(false)} onNavigate={setAgentPage} />;
  } else {
      content = (
        <>
          <div className={studyCategory ? 'hidden' : ''}>
            <div className="transition duration-200">
              <HomePage
                onEnterStudy={handleEnterStudy}
                onStartToday={handleStartTodayStudy}
                onShowDecks={() => setShowDecks(true)}
                onShowStats={() => setShowStats(true)}
                onShowProfile={() => setShowProfile(true)}
                onShowSearch={() => setShowSearch(true)}
              />
            </div>
          </div>
        </>
      );
  }

  return (
    <>
      {content}
      {studyCategory && (
        <div className="fixed inset-0 z-50 page-enter" key={studyCategory}>
          <StudyPage exitOnBack={studyExitOnBack} autoCloseOnComplete={studyAutoCloseOnComplete} onBack={() => { todayStudyRequestRef.current += 1; dispatch({ type: 'STOP_PLAN_STUDY' }); setStudyCategory(null); setStudyExitOnBack(false); setStudyAutoCloseOnComplete(false); }} />
        </div>
      )}
      <ProcessingBadge onViewDrafts={(docId: string) => {
        setShowSearch(true);
        setAgentPage(`drafts:${docId}`);
      }} />
    </>
  );
}

function AppLoadingScreen({ message }: { message: string }) {
  return (
    <div className="dark-bg homepage-glass-stage min-h-screen flex items-center justify-center px-5">
      <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
}

export default function App() {
  return <AppProvider><ErrorBoundary fallback={<div className="dark-bg text-white p-8 text-center mt-20">页面加载出错，请刷新重试</div>}><AppInner /></ErrorBoundary></AppProvider>;
}
