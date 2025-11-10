
# 🔴 Problema: QR Code não aparece (Erro 405)

## 📝 Diagnóstico

**Sintoma:** Ao tentar conectar um número, a modal abre mostrando "Gerando QR Code..." mas o QR nunca aparece.

**Causa Raiz:** Erro **405 - Connection Failure** do WhatsApp Web.

### Por que acontece?

O WhatsApp detecta conexões "suspeitas" através de:

1. **Mesmo IP fazendo múltiplas conexões**
2. **Padrões de requisição automatizados** (biblioteca Baileys)
3. **Fingerprint do navegador inconsistente**
4. **Ausência de histórico legítimo do número**

Quando detecta esses padrões, o WhatsApp **bloqueia o IP** de se conectar, retornando erro 405.

---

## ✅ Solução Implementada: Sistema de Proxy Rotativo

Foi implementado um **sistema completo de rotação de proxy** que resolve este problema ao:

1. **Distribuir conexões entre múltiplos IPs** (através de proxies)
2. **Simular localizações geograficamente distribuídas**
3. **Evitar bloqueios por IP fixo**
4. **Dificultar detecção de padrões automatizados**

---

## 🚀 Como Resolver (Passo a Passo)

### 1. Adicionar Proxies

Acesse: **http://localhost:3000/whatsapp-admin** → Aba **🌐 Proxies**

**Opção A: Usar Proxy Pago (Recomendado)**

```
# Exemplo com Brightdata
http://user-empresa:senha@proxy.brightdata.com:22225

# Exemplo com Smartproxy
http://user:senha@gate.smartproxy.com:7000
```

**Opção B: Proxy Gratuito (Para Testes)**

```
# Encontre proxies em: https://free-proxy-list.net/
http://185.199.229.156:7492
http://185.199.231.45:8382
```

⚠️ **Aviso:** Proxies gratuitos são instáveis. Use apenas para testes.

### 2. Testar Proxies

Após adicionar, clique em **"Testar Todos"** para verificar quais estão funcionando.

**Status esperado:**
- ✅ **Ativo** (verde): Proxy funcional
- ❌ **Inativo** (vermelho): Proxy com problema
- 🕐 **Testando** (amarelo): Aguardando validação

**Requisito mínimo:** Pelo menos **1 proxy ativo** para conectar.

### 3. Conectar Número

Agora vá para **📱 Números/Instâncias** e clique em **"Conectar"**.

**O que acontece internamente:**

```
1. Sistema seleciona um proxy ativo do pool
2. Cria conexão WebSocket através do proxy
3. Baileys solicita QR Code usando o IP do proxy
4. WhatsApp valida e gera QR Code
5. QR Code aparece na modal
```

**Tempo esperado:** QR Code aparece em **5-15 segundos**.

### 4. Se ainda não funcionar

**Possíveis problemas:**

#### A) Todos os proxies inativos

**Solução:** Adicione mais proxies de diferentes provedores.

```bash
# Ver logs do servidor
cd /home/ubuntu/center_ai_omni/nextjs_space
yarn dev

# Procure por:
✅ [ProxyPool] Usando proxy: xxx.xxx.xxx.xxx:port
❌ [ProxyPool] Proxy xxx.xxx.xxx.xxx: FALHOU
```

#### B) Proxy lento

**Solução:** Remova proxies com responseTime > 5000ms.

1. Aba **🌐 Proxies**
2. Verifique coluna **Performance**
3. Remova proxies lentos (ícone de lixeira 🗑️)

#### C) Proxy bloqueado pelo WhatsApp

**Solução:** Use proxies residenciais ao invés de datacenter.

**Diferenças:**

| Tipo | Facilidade de Bloqueio | Custo |
|------|------------------------|-------|
| Datacenter | Alta (WhatsApp detecta facilmente) | Baixo |
| Residencial | Baixa (IPs de residências reais) | Alto |

**Recomendação:** [Bright Data](https://brightdata.com/) ou [Smartproxy](https://smartproxy.com/) (proxies residenciais).

#### D) Número já foi bloqueado

**Solução:** Aguarde 24-48h antes de tentar novamente.

O WhatsApp pode ter bloqueado temporariamente o número (não o IP). Neste caso:

1. Aguarde 24-48 horas
2. Use um proxy diferente
3. Tente conectar novamente

---

## 🔍 Verificação de Logs

Para diagnosticar problemas, monitore os logs:

```bash
cd /home/ubuntu/center_ai_omni/nextjs_space
yarn dev
```

**Logs importantes:**

```
✅ Sucesso:
🔄 [ProxyPool] Usando proxy: 185.199.229.156:7492 (Brasil)
🚀 Criando socket WhatsApp para instância cmht58d890000o2kbqbafgasa...
✅ Socket criado com sucesso
📸 Convertendo QR code para base64...
💾 QR Code salvo no banco de dados

❌ Falha:
❌ Error: connect ECONNREFUSED (proxy não responde)
❌ Status Code: 405 - Connection Failure (WhatsApp bloqueou)
⚠️ Nenhum proxy disponível - Conectando sem proxy (risco de bloqueio)
```

---

## 💡 Melhores Práticas

### 1. Quantidade de Proxies

- **Mínimo:** 3-5 proxies ativos
- **Recomendado:** 10-20 proxies ativos
- **Ideal para escala:** 50+ proxies ativos

### 2. Distribuição Geográfica

Use proxies de diferentes países:

```
✅ Bom:
- 5 proxies Brasil
- 5 proxies EUA
- 5 proxies Europa

❌ Ruim:
- 15 proxies Brasil (mesmo país)
```

### 3. Rotação Inteligente

O sistema já faz rotação automática, mas você pode melhorar:

1. **Remova proxies lentos** (> 5000ms)
2. **Teste regularmente** (botão "Testar Todos")
3. **Adicione novos proxies** quando taxa de sucesso < 80%

### 4. Monitoramento Contínuo

Verifique diariamente:

- **Dashboard de Proxies** (aba 🌐)
- **Estatísticas de Performance**
- **Taxa de sucesso geral**

---

## 📊 Comparação: Antes vs Depois

### ❌ Antes (Sem Proxy)

```
Tentativa 1: ❌ Erro 405
Tentativa 2: ❌ Erro 405
Tentativa 3: ❌ Erro 405
Resultado: IP bloqueado permanentemente
```

### ✅ Depois (Com Proxy)

```
Tentativa 1: ✅ QR Code gerado (proxy BR1)
Tentativa 2: ✅ QR Code gerado (proxy US1)
Tentativa 3: ✅ QR Code gerado (proxy EU1)
Resultado: Conexões distribuídas, sem bloqueios
```

---

## 🎯 Checklist de Resolução

Siga esta ordem:

- [ ] 1. Adicionar pelo menos 3 proxies
- [ ] 2. Testar todos os proxies (botão "Testar Todos")
- [ ] 3. Verificar que pelo menos 1 está ativo (status verde)
- [ ] 4. Tentar conectar número na aba 📱 Números/Instâncias
- [ ] 5. Aguardar 5-15 segundos para QR Code aparecer
- [ ] 6. Se falhar, verificar logs do servidor
- [ ] 7. Se necessário, adicionar mais proxies

---

## 🆘 Se Nada Funcionar

### Opções de Último Recurso:

1. **Aguardar 48h** (WhatsApp pode ter bloqueado temporariamente)
2. **Usar número diferente** (testar com outro chip)
3. **Contratar serviço de proxy premium** (Bright Data, Oxylabs)
4. **Verificar se o número não está banido** (teste conectar manualmente no celular)

### Diagnóstico Avançado:

```bash
# Verificar conectividade do proxy
curl -x http://proxy.com:8080 https://web.whatsapp.com

# Verificar se proxy está funcionando
curl -x http://proxy.com:8080 https://api.ipify.org
```

---

## 🌟 Resumo Executivo

**Problema:** Erro 405 impede QR Code de ser gerado.  
**Causa:** WhatsApp bloqueia IPs suspeitos.  
**Solução:** Sistema de proxy rotativo distribuindo conexões.  
**Resultado:** QR Code gerado com sucesso através de IPs diferentes.

**Ação imediata:** Adicione proxies na aba 🌐 e teste!

---

**DevSphere.ai** - Documentação Técnica de Troubleshooting 🔧
