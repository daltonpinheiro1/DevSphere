
# 🌐 Sistema de Rotação de Proxy - DevSphere.ai

## 📋 Visão Geral

O **Sistema de Rotação de Proxy** foi implementado para resolver o problema do **erro 405 - Connection Failure** do WhatsApp, que bloqueia conexões vindas do mesmo IP.

### ✅ Recursos Implementados

1. **Pool de Proxies Rotativos**
   - Suporte para HTTP, HTTPS e SOCKS5
   - Rotação automática entre proxies
   - Health check periódico (a cada 5 minutos)
   - Tracking de performance (tempo de resposta, taxa de sucesso)

2. **Interface de Gerenciamento**
   - Nova aba **🌐 Proxies** no WhatsApp Admin
   - Adicionar/remover proxies facilmente
   - Testar proxies individualmente ou em massa
   - Dashboard com estatísticas em tempo real

3. **Integração Automática**
   - Conexões do WhatsApp usam proxies automaticamente
   - Rotação round-robin (distribuição balanceada)
   - Fallback para conexão direta se nenhum proxy disponível

---

## 🚀 Como Usar

### 1. Acessar Gerenciamento de Proxies

```
http://localhost:3000/whatsapp-admin
```

Clique na aba **🌐 Proxies**

### 2. Adicionar Proxy

**Formato da URL:**
```
protocol://[user:pass@]host:port
```

**Exemplos:**
```
http://proxy.example.com:8080
http://user:password@proxy.example.com:8080
socks5://proxy.example.com:1080
socks5://user:password@proxy.example.com:1080
```

**Passos:**
1. Clique em **"Adicionar Proxy"**
2. Cole a URL do proxy
3. (Opcional) Informe o país do proxy
4. Clique em **"Adicionar"**

O sistema automaticamente testará o proxy e o marcará como **Ativo** ou **Inativo**.

### 3. Testar Proxies

- **Teste Individual:** Clique no ícone de atualização (↻) ao lado do proxy
- **Teste em Massa:** Clique no botão **"Testar Todos"** no topo da página

### 4. Conectar Número com Proxy

Após adicionar proxies:

1. Vá para a aba **📱 Números/Instâncias**
2. Clique em **"Conectar"** em um número
3. O sistema automaticamente usará um proxy disponível
4. O QR Code será gerado usando o IP do proxy

---

## 📊 Dashboard de Estatísticas

O dashboard mostra:

- **Total:** Quantidade total de proxies configurados
- **Ativos:** Proxies funcionando corretamente
- **Inativos:** Proxies com falha de conexão
- **Tempo Médio:** Latência média dos proxies ativos

---

## 🔍 Onde Conseguir Proxies

### Opções Gratuitas (Limitadas)
- Free Proxy List: https://free-proxy-list.net/
- ProxyScrape: https://proxyscrape.com/free-proxy-list
- **⚠️ Aviso:** Proxies gratuitos são instáveis e lentos

### Opções Pagas (Recomendadas)
1. **Bright Data** (Luminati)
   - https://brightdata.com/
   - Proxies residenciais de alta qualidade
   - Preço: ~$500/mês (50GB)

2. **Smartproxy**
   - https://smartproxy.com/
   - Boa relação custo-benefício
   - Preço: ~$75/mês (8GB)

3. **Oxylabs**
   - https://oxylabs.io/
   - Enterprise-grade proxies
   - Preço: sob consulta

4. **Proxy-Cheap**
   - https://proxy-cheap.com/
   - Opção econômica
   - Preço: ~$50/mês (5GB)

---

## ⚙️ Arquitetura Técnica

### Fluxo de Conexão com Proxy

```
1. Instância solicita conexão
2. ProxyPool seleciona proxy (round-robin)
3. Instance Manager cria socket com proxy
4. Baileys conecta ao WhatsApp via proxy
5. QR Code é gerado com IP do proxy
6. WhatsApp valida conexão do IP do proxy
```

### Estrutura de Arquivos

```
lib/whatsapp/
├── proxy-pool.ts              # Gerenciador de pool
├── instance-manager.ts        # Integração com Baileys
└── types.ts                   # Interfaces TypeScript

app/api/whatsapp/proxies/
├── route.ts                   # CRUD de proxies
├── [id]/route.ts             # Operações individuais
└── test/route.ts             # Health check em massa

components/whatsapp/
└── proxies-manager.tsx       # Interface do usuário

prisma/schema.prisma
└── ProxyServer model         # Schema do banco
```

### Modelo de Dados (ProxyServer)

```prisma
model ProxyServer {
  id              String   @id @default(cuid())
  url             String   @unique
  protocol        String   // http, https, socks5
  host            String
  port            Int
  username        String?
  password        String?
  country         String?
  
  // Performance
  status          String   @default("testing")
  lastChecked     DateTime?
  responseTime    Int?     // ms
  successRate     Int      @default(100)
  
  // Estatísticas
  totalUses       Int      @default(0)
  totalFailures   Int      @default(0)
}
```

---

## 🛠️ Configurações Avançadas

### Rotação Manual

O sistema usa rotação **round-robin** por padrão. Para implementar rotação customizada, edite:

```typescript
// lib/whatsapp/proxy-pool.ts
getNextProxy(): ProxyConfig | null {
  // Sua lógica de rotação aqui
}
```

### Health Check Personalizado

O health check roda a cada **5 minutos**. Para ajustar:

```typescript
// lib/whatsapp/proxy-pool.ts
startHealthCheckLoop() {
  this.healthCheckInterval = setInterval(async () => {
    // ...
  }, 5 * 60 * 1000); // <-- Altere aqui (em ms)
}
```

### Fallback sem Proxy

Se nenhum proxy estiver disponível, o sistema tenta conexão direta:

```typescript
// lib/whatsapp/instance-manager.ts
this.currentProxy = proxyPool.getNextProxy();

if (this.currentProxy) {
  socketConfig.agent = this.createProxyAgent(this.currentProxy);
} else {
  console.warn('⚠️ Nenhum proxy disponível - Conectando sem proxy');
}
```

---

## 🐛 Troubleshooting

### Problema: Proxy marcado como inativo

**Possíveis causas:**
- Proxy offline ou bloqueado
- Credenciais incorretas
- Timeout de conexão

**Solução:**
1. Verifique as credenciais do proxy
2. Teste o proxy manualmente (curl, Postman)
3. Entre em contato com o provedor do proxy

### Problema: QR Code ainda não aparece

**Possíveis causas:**
- Todos os proxies estão inativos
- WhatsApp bloqueou todos os IPs do pool

**Solução:**
1. Adicione mais proxies de diferentes provedores
2. Use proxies residenciais (mais difíceis de bloquear)
3. Aguarde algumas horas antes de tentar novamente

### Problema: Conexão lenta

**Possíveis causas:**
- Proxies com alta latência
- Proxies sobrecarregados

**Solução:**
1. Teste todos os proxies (botão "Testar Todos")
2. Remova proxies com responseTime > 5000ms
3. Use proxies geograficamente próximos

---

## 📈 Boas Práticas

1. **Use múltiplos proxies** (mínimo 5-10)
2. **Prefira proxies residenciais** (mais difíceis de bloquear)
3. **Teste regularmente** o health dos proxies
4. **Monitore as estatísticas** de performance
5. **Rotacione IPs** de diferentes países
6. **Evite proxies gratuitos** para uso em produção

---

## 🎯 Próximos Passos

Agora você pode:

1. ✅ Adicionar seus proxies na aba **🌐 Proxies**
2. ✅ Conectar números WhatsApp com proteção de IP
3. ✅ Evitar o erro 405 - Connection Failure
4. ✅ Escalar para múltiplas instâncias simultaneamente

**Teste agora:** Adicione pelo menos 1 proxy e tente conectar um número!

---

## 💡 Suporte

Para dúvidas ou problemas:
1. Consulte os logs do servidor (`yarn dev`)
2. Verifique o Console do navegador (F12)
3. Revise este guia

---

**DevSphere.ai** - Sistema de Automação WhatsApp com Rotação de Proxy 🚀
