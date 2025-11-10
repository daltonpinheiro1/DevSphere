
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  Globe, 
  Plus, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Activity,
  AlertCircle
} from 'lucide-react';

interface Proxy {
  id: string;
  url: string;
  protocol: string;
  host: string;
  port: number;
  country?: string;
  status: 'testing' | 'active' | 'inactive';
  lastChecked?: string;
  responseTime?: number;
  successRate: number;
  totalUses: number;
  totalFailures: number;
  createdAt: string;
}

export default function ProxiesManager() {
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProxyUrl, setNewProxyUrl] = useState('');
  const [newProxyCountry, setNewProxyCountry] = useState('');

  useEffect(() => {
    loadProxies();
  }, []);

  const loadProxies = async () => {
    try {
      const res = await fetch('/api/whatsapp/proxies');
      const data = await res.json();
      
      if (data.success) {
        setProxies(data.proxies);
      } else {
        toast.error('Erro ao carregar proxies');
      }
    } catch (error) {
      console.error('Erro ao carregar proxies:', error);
      toast.error('Erro ao carregar proxies');
    } finally {
      setLoading(false);
    }
  };

  const addProxy = async () => {
    if (!newProxyUrl.trim()) {
      toast.error('URL do proxy é obrigatória');
      return;
    }

    try {
      const res = await fetch('/api/whatsapp/proxies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: newProxyUrl,
          country: newProxyCountry || undefined
        })
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Proxy adicionado com sucesso!');
        setShowAddDialog(false);
        setNewProxyUrl('');
        setNewProxyCountry('');
        loadProxies();
      } else {
        toast.error(data.error || 'Erro ao adicionar proxy');
      }
    } catch (error) {
      console.error('Erro ao adicionar proxy:', error);
      toast.error('Erro ao adicionar proxy');
    }
  };

  const removeProxy = async (proxyId: string) => {
    if (!confirm('Deseja remover este proxy?')) return;

    try {
      const res = await fetch(`/api/whatsapp/proxies/${proxyId}`, {
        method: 'DELETE'
      });

      const data = await res.json();

      if (data.success) {
        toast.success('Proxy removido com sucesso!');
        loadProxies();
      } else {
        toast.error('Erro ao remover proxy');
      }
    } catch (error) {
      console.error('Erro ao remover proxy:', error);
      toast.error('Erro ao remover proxy');
    }
  };

  const testProxy = async (proxyId: string) => {
    try {
      toast.info('Testando proxy...');
      
      const res = await fetch(`/api/whatsapp/proxies/${proxyId}`, {
        method: 'PATCH'
      });

      const data = await res.json();

      if (data.success) {
        toast.success(data.isHealthy ? 'Proxy funcionando!' : 'Proxy não respondeu');
        loadProxies();
      } else {
        toast.error('Erro ao testar proxy');
      }
    } catch (error) {
      console.error('Erro ao testar proxy:', error);
      toast.error('Erro ao testar proxy');
    }
  };

  const testAllProxies = async () => {
    setTesting(true);
    
    try {
      toast.info('Testando todos os proxies...');
      
      const res = await fetch('/api/whatsapp/proxies/test', {
        method: 'POST'
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          `Teste concluído! ${data.summary.active} ativos, ${data.summary.inactive} inativos`
        );
        loadProxies();
      } else {
        toast.error('Erro ao testar proxies');
      }
    } catch (error) {
      console.error('Erro ao testar proxies:', error);
      toast.error('Erro ao testar proxies');
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'inactive':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'testing':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gerenciamento de Proxies</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure proxies rotativos para evitar bloqueio de IP
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={testAllProxies}
            disabled={testing || proxies.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Activity className="w-4 h-4" />
            {testing ? 'Testando...' : 'Testar Todos'}
          </button>
          
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Adicionar Proxy
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{proxies.length}</p>
            </div>
            <Globe className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ativos</p>
              <p className="text-2xl font-bold text-green-600">
                {proxies.filter(p => p.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Inativos</p>
              <p className="text-2xl font-bold text-red-600">
                {proxies.filter(p => p.status === 'inactive').length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tempo Médio</p>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(
                  proxies
                    .filter(p => p.responseTime)
                    .reduce((acc, p) => acc + (p.responseTime || 0), 0) /
                    proxies.filter(p => p.responseTime).length || 0
                )}ms
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Lista de Proxies */}
      {proxies.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border text-center">
          <Globe className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum proxy configurado
          </h3>
          <p className="text-gray-600 mb-4">
            Adicione proxies para evitar bloqueio de IP nas conexões do WhatsApp
          </p>
          <button
            onClick={() => setShowAddDialog(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all"
          >
            Adicionar Primeiro Proxy
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Endereço
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  País
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estatísticas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {proxies.map((proxy) => (
                <tr key={proxy.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(proxy.status)}
                      <span className="text-sm font-medium capitalize">
                        {proxy.status === 'active' ? 'Ativo' : 
                         proxy.status === 'inactive' ? 'Inativo' : 'Testando'}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {proxy.protocol}://{proxy.host}:{proxy.port}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {proxy.url.substring(0, 40)}...
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {proxy.country || '-'}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {proxy.responseTime ? `${proxy.responseTime}ms` : '-'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Taxa: {proxy.successRate}%
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {proxy.totalUses} usos
                    </div>
                    <div className="text-xs text-gray-500">
                      {proxy.totalFailures} falhas
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => testProxy(proxy.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Testar proxy"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeProxy(proxy.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Remover proxy"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog: Adicionar Proxy */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Adicionar Novo Proxy
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL do Proxy *
                </label>
                <input
                  type="text"
                  value={newProxyUrl}
                  onChange={(e) => setNewProxyUrl(e.target.value)}
                  placeholder="http://user:pass@proxy.com:8080"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Formato: protocol://[user:pass@]host:port
                </p>
                <p className="text-xs text-gray-500">
                  Exemplos: http://proxy.com:8080, socks5://user:pass@proxy.com:1080
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País (opcional)
                </label>
                <input
                  type="text"
                  value={newProxyCountry}
                  onChange={(e) => setNewProxyCountry(e.target.value)}
                  placeholder="Brasil"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddDialog(false);
                  setNewProxyUrl('');
                  setNewProxyCountry('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={addProxy}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
