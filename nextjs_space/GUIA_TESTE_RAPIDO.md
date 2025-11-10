
# 🚀 Guia de Teste Rápido - DevSphere.ai WhatsApp

## 📱 Números de Teste Configurados

✅ **Número 1**: `(31) 99236-1144` → `5531992361144`  
✅ **Número 2**: `(31) 99696-6666` → `5531996966666`

---

## ⚡ Teste Rápido (5 minutos)

### 🔌 Passo 1: Conectar Número via QR Code

1. **Abra a página**: http://localhost:3000/whatsapp-admin
2. Na aba **"📱 Números/Instâncias"**, você verá 2 instâncias
3. Clique no botão verde **"🔌 Conectar"** em uma delas
4. Aguarde o QR Code aparecer (5-10 segundos)
5. **No seu celular**:
   - Abra o WhatsApp
   - Toque nos 3 pontinhos (⋮) → **"Aparelhos Conectados"**
   - Toque em **"Conectar um aparelho"**
   - Escaneie o QR Code da tela
6. Aguarde a confirmação ✅ **"🟢 Conectado"**

### 💬 Passo 2: Testar o Chatbot

**De outro celular ou do próprio celular conectado:**

1. Abra uma conversa com o número que você conectou
2. Envie uma mensagem de teste:

```
Olá, preciso de informações sobre a Centermed
```

Ou:

```
Quais são os planos disponíveis?
```

3. **Aguarde 5-10 segundos**
4. O chatbot da **DevSphere.ai** responderá automaticamente
5. Continue a conversa para testar o contexto:

```
Quanto custa?
```

```
Como faço para contratar?
```

### 📇 Passo 3: Importar Contatos de Teste

1. Clique na aba **"📇 Contatos"**
2. Clique em **"📤 Importar Contatos"**
3. Navegue até: `/home/ubuntu/center_ai_omni/contatos-teste.txt`
4. Selecione o arquivo e clique em **"Enviar"**
5. Você verá:
   ```
   ✅ 2 contatos importados com sucesso!
   ```
6. Os contatos aparecerão na lista:
   - Teste DevSphere 1: (31) 99236-1144
   - Teste DevSphere 2: (31) 99696-6666

### 📝 Passo 4: Criar Template Simples

1. Clique na aba **"📝 Templates"**
2. Clique em **"➕ Novo Template"**
3. Preencha:
   - **Nome**: `Teste DevSphere - Boas-vindas`
   - **Conteúdo**:
     ```
     Olá {{nome}}, bem-vindo(a) ao teste da DevSphere.ai! 🚀
     
     Esta é uma mensagem automática de teste.
     
     Responda esta mensagem para testar o chatbot.
     ```
4. Clique em **"💾 Salvar Template"**

### 🚀 Passo 5: Enviar Campanha de Teste

1. Clique na aba **"🚀 Campanhas"**
2. Clique em **"➕ Nova Campanha"**
3. Preencha:
   - **Nome**: `Teste DevSphere - Novembro 2025`
   - **Selecionar Número**: Escolha o número conectado
   - **Selecionar Template**: `Teste DevSphere - Boas-vindas`
   - **Selecionar Contatos**: Marque os 2 contatos
4. Clique em **"▶️ Iniciar Campanha"**
5. Aguarde o processamento
6. Acompanhe o status: "Em andamento" → "Concluída"

---

## 📊 Verificação dos Resultados

### ✅ Checklist de Sucesso

- [ ] Número conectado com status **"🟢 Conectado"**
- [ ] QR Code exibido corretamente
- [ ] Chatbot respondeu automaticamente em menos de 10 segundos
- [ ] Resposta do chatbot foi contextualizada (Centermed/Tim Ultra Fibra)
- [ ] Contatos importados aparecem na lista
- [ ] Template criado com sucesso
- [ ] Campanha enviada com sucesso
- [ ] Mensagens recebidas nos números de teste

### 📱 Verificar no WhatsApp

1. **No celular conectado**, verifique:
   - Status de "Aparelhos Conectados" → Deve mostrar **"DevSphere.ai"**
   - Mensagens enviadas pela campanha
   - Respostas automáticas do chatbot

2. **Nos celulares de teste** `(31) 99236-1144` e `(31) 99696-6666`:
   - Devem ter recebido a mensagem da campanha
   - Podem responder para testar o chatbot

---

## 🎯 Teste de Conversação Completo

**Envie estas mensagens sequenciais para testar o contexto:**

1️⃣ **Mensagem Inicial**:
```
Olá, quero informações sobre a Centermed
```
*Aguarde resposta do chatbot*

2️⃣ **Continuação**:
```
Quais são os planos disponíveis?
```
*Aguarde resposta do chatbot*

3️⃣ **Detalhamento**:
```
Quanto custa o plano básico?
```
*Aguarde resposta do chatbot*

4️⃣ **Ação**:
```
Como faço para contratar?
```
*Aguarde resposta do chatbot*

5️⃣ **Dúvida Adicional**:
```
Vocês atendem na minha região?
```
*Aguarde resposta do chatbot*

### ✅ Expectativas

- **Tempo de resposta**: 5-10 segundos
- **Contexto mantido**: O chatbot deve lembrar da conversa anterior
- **Respostas relevantes**: Focadas em Centermed e Tim Ultra Fibra
- **Tom profissional**: Respostas educadas e prestativas

---

## 🐛 Resolução de Problemas

### ❌ QR Code não aparece
**Soluções**:
1. Aguarde até 30 segundos
2. Recarregue a página (F5)
3. Clique em "Conectar" novamente
4. Verifique o console do navegador (F12) para erros

### ❌ Chatbot não responde
**Soluções**:
1. Verifique se **"Resposta Automática (IA)"** está ativado (azul)
2. Verifique se **"Chat Ativo"** está ativado (azul)
3. Aguarde até 15 segundos
4. Verifique se o número está **"🟢 Conectado"**
5. Tente desconectar e reconectar o número

### ❌ Contatos não importam
**Soluções**:
1. Verifique o formato do arquivo: `Nome:DDD+Número`
2. Exemplo correto: `Teste:5531992361144`
3. Certifique-se de que o arquivo tem a extensão `.txt`
4. Verifique se não há linhas vazias no início do arquivo

### ❌ Campanha não envia
**Soluções**:
1. Verifique se o número está conectado
2. Certifique-se de que há contatos selecionados
3. Verifique se há um template selecionado
4. Aguarde alguns minutos (pode haver rate limiting do WhatsApp)

---

## 📈 Métricas a Observar

### Durante os Testes:

1. **Tempo de Conexão**: Deve conectar em < 30 segundos após escanear QR Code
2. **Tempo de Resposta do Chatbot**: < 10 segundos
3. **Taxa de Entrega**: 100% das mensagens devem ser entregues
4. **Qualidade das Respostas**: Devem ser contextualizadas e relevantes
5. **Estabilidade**: Conexão deve permanecer ativa durante todo o teste

### No Painel:

- **Total Enviado**: Contador de mensagens na instância
- **Status**: Deve permanecer "🟢 Conectado"
- **Progresso da Campanha**: Deve atualizar em tempo real
- **Lista de Contatos**: Deve mostrar os 2 contatos importados

---

## 🎉 Teste Concluído!

Se todos os passos funcionaram corretamente:

✅ **Sistema 100% Funcional!**

### Próximos Passos:

1. ✅ Conecte mais números se necessário
2. ✅ Crie templates personalizados com imagens
3. ✅ Importe listas maiores de contatos
4. ✅ Configure campanhas agendadas
5. ✅ Monitore as métricas de engajamento
6. ✅ Ajuste as respostas do chatbot conforme necessário

---

## 📞 Contatos de Teste Configurados

| Nome | Número Completo | Formato WhatsApp |
|------|----------------|------------------|
| Teste DevSphere 1 | (31) 99236-1144 | 5531992361144 |
| Teste DevSphere 2 | (31) 99696-6666 | 5531996966666 |

**Arquivo de Contatos**: `/home/ubuntu/center_ai_omni/contatos-teste.txt`

---

**Desenvolvido por DevSphere.ai** 🤖  
**Sistema de Automação WhatsApp Business**  
**Versão de Teste - Novembro 2025**
