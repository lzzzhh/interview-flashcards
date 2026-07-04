// src/components/ApiSettingsPage.tsx — API Key 配置页面

import { useState, useEffect } from 'react';
import { CheckCircle, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import { apiGet, apiPost } from '../api/client';
import BackButton from './BackButton';

interface Settings {
  baseUrl: string;
  model: string;
  embeddingModel: string;
  hasKey: boolean;
}

interface Props { onBack: () => void; }

const TEXT_PRIMARY = 'var(--text-primary)';
const TEXT_MUTED = 'var(--text-muted)';
const CARD_BORDER = 'var(--card-border)';
const ACCENT = '#6366F1';

export default function ApiSettingsPage({ onBack }: Props) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiGet<Settings>('/settings')
      .then(setSettings)
      .catch(() => setError('无法读取配置'));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await apiPost('/settings', {
        baseUrl: settings?.baseUrl || 'https://api.deepseek.com',
        apiKey: apiKey || undefined,
        model: settings?.model || 'deepseek-chat',
        embeddingModel: settings?.embeddingModel || '',
      });
      setSaved(true);
      setApiKey('');
    } catch (err: any) {
      setError(err.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dark-bg homepage-glass-stage flex flex-col min-h-screen transition-colors">
      <div className="nav-bar sticky top-0 z-20 flex items-center">
        <BackButton onClick={onBack} />
        <h1 className="nav-title">API 配置</h1>
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="relative z-10 w-full max-w-md px-5 py-6 pb-24 space-y-4">
          {/* 说明 */}
          <div className="rounded-xl p-3 border text-[13px]" style={{ backgroundColor: `${ACCENT}10`, borderColor: `${ACCENT}30`, color: TEXT_MUTED }}>
            配置 LLM API 后，AI 制卡、JD 分析等功能即可使用。支持 DeepSeek、OpenAI 及任何 OpenAI 兼容 API。
          </div>

          {/* 成功提示 */}
          {saved && (
            <div className="rounded-xl p-3 border flex items-center gap-2 text-[13px]" style={{ borderColor: '#22C55E30', backgroundColor: '#22C55E10', color: '#22C55E' }}>
              <CheckCircle className="w-4 h-4" />
              <span>配置已保存并生效</span>
            </div>
          )}

          {/* 错误 */}
          {error && (
            <div className="rounded-xl p-3 border flex items-center gap-2 text-[13px]" style={{ borderColor: '#EF444430', backgroundColor: '#EF444410', color: '#EF4444' }}>
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* API Base URL */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>API 地址</label>
            <input
              type="text"
              value={settings?.baseUrl || ''}
              onChange={e => setSettings(s => s ? { ...s, baseUrl: e.target.value } : null)}
              placeholder="https://api.deepseek.com"
              className="w-full rounded-lg border px-3 py-2.5 text-[13px] bg-transparent"
              style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
            />
            <p className="text-[11px]" style={{ color: TEXT_MUTED }}>DeepSeek: api.deepseek.com / OpenAI: api.openai.com</p>
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>
              API Key {settings?.hasKey && <span className="text-[11px]" style={{ color: '#22C55E' }}>（已设置）</span>}
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={settings?.hasKey ? '留空不修改' : 'sk-xxx'}
                className="w-full rounded-lg border px-3 py-2.5 pr-10 text-[13px] bg-transparent"
                style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
              >
                {showKey ? <EyeOff className="w-4 h-4" style={{ color: TEXT_MUTED }} /> : <Eye className="w-4 h-4" style={{ color: TEXT_MUTED }} />}
              </button>
            </div>
          </div>

          {/* Model */}
          <div className="space-y-2">
            <label className="text-[13px] font-medium" style={{ color: TEXT_PRIMARY }}>模型</label>
            <input
              type="text"
              value={settings?.model || ''}
              onChange={e => setSettings(s => s ? { ...s, model: e.target.value } : null)}
              placeholder="deepseek-chat"
              className="w-full rounded-lg border px-3 py-2.5 text-[13px] bg-transparent"
              style={{ borderColor: CARD_BORDER, color: TEXT_PRIMARY }}
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-xl p-3.5 flex items-center justify-center gap-2 text-[14px] font-medium transition-opacity disabled:opacity-40"
            style={{ backgroundColor: ACCENT, color: '#fff' }}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</>
            ) : (
              <>保存配置</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
