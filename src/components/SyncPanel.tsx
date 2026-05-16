import { useState } from 'react';
import { Wifi, Server, Link, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useSync } from '../sync/hook';

interface Props { onClose: () => void; }

export default function SyncPanel({ onClose }: Props) {
  const { syncing, lastResult, error, serverRunning, serverAddress, startServer, stopServer, connectAndSync } = useSync();
  const [peerIp, setPeerIp] = useState('');
  const [port, setPort] = useState('9876');

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 h-full overflow-y-auto shadow-xl animate-fadeIn">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2"><Wifi className="w-5 h-5" />局域网同步</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><XCircle className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="p-4 space-y-5">
          <div><label className="text-xs font-medium text-gray-500 dark:text-gray-400">端口</label><input type="number" value={port} onChange={(e) => setPort(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm" /></div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3"><Server className="w-4 h-4" />作为主机</h3>
            {serverRunning ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm"><CheckCircle2 className="w-4 h-4" />已开启</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg px-3 py-2 font-mono">{serverAddress}</div>
                <button onClick={stopServer} className="w-full py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">停止</button>
              </div>
            ) : (
              <button onClick={() => startServer(parseInt(port) || 9876)} className="w-full py-2.5 rounded-lg bg-blue-500 text-white text-sm font-medium"><Wifi className="w-4 h-4 inline mr-1" />开启主机模式</button>
            )}
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3"><Link className="w-4 h-4" />作为客户端</h3>
            <input type="text" value={peerIp} onChange={(e) => setPeerIp(e.target.value)} placeholder="输入对端 IP，如 192.168.1.10" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 text-sm mb-2" />
            <button onClick={() => {
              const ip = peerIp.trim().split(':')[0];
              connectAndSync(ip, parseInt(port) || 9876);
            }} disabled={syncing || !peerIp.trim()} className="w-full py-2.5 rounded-lg bg-green-500 text-white text-sm font-medium disabled:opacity-30">
              {syncing ? <><Loader2 className="w-4 h-4 animate-spin inline mr-1" />同步中...</> : '连接并同步'}
            </button>
          </div>
          {lastResult && <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-sm text-green-700 dark:text-green-300 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{lastResult}</div>}
          {error && <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2"><XCircle className="w-4 h-4" />{error}</div>}
          <div className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed"><p className="font-medium mb-1">使用说明：</p><ol className="list-decimal pl-4 space-y-0.5"><li>两台设备连接同一个 WiFi</li><li>一台点「开启主机模式」</li><li>另一台输入主机 IP，点「连接」</li></ol></div>
        </div>
      </div>
    </div>
  );
}
