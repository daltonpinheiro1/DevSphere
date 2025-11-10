
# 🧪 Guia de Teste Completo - DevSphere.ai WhatsApp

## 📋 Pré-requisitos

✅ **Servidor rodando**: http://localhost:3000  
✅ **Página de testes aberta**: http://localhost:3000/whatsapp-admin  
✅ **WhatsApp instalado no celular** (para escanear QR Code)  
✅ **Número de teste disponível** (pode ser seu WhatsApp pessoal)

---

## 🎯 Teste 1: Conectar Número via QR Code

### Passo 1: Acessar a Aba de Números
1. No navegador, você já está na aba **"📱 Números/Instâncias"**
2. Você verá 2 instâncias existentes com status "Desconectado"

### Passo 2: Escolher uma Instância Existente
1. Clique no botão verde **"🔌 Conectar"** em uma das instâncias
2. Aguarde alguns segundos (aparecerá "Gerando QR Code...")
3. Um QR Code será exibido na tela

### Passo 3: Escanear o QR Code
1. Abra o WhatsApp no seu celular
2. Toque nos 3 pontinhos (⋮) no canto superior direito
3. Selecione **"Aparelhos Conectados"**
4. Toque em **"Conectar um aparelho"**
5. Aponte a câmera para o QR Code na tela do computador

### Passo 4: Confirmar Conexão
1. Após escanear, aguarde alguns segundos
2. O status mudará de **"🔴 Desconectado"** para **"🟢 Conectado"**
3. O QR Code desaparecerá
4. Você verá as informações da sessão atualizadas

---

## 🎯 Teste 2: Importar Contatos

### Passo 1: Criar Arquivo de Contatos
Crie um arquivo chamado `contatos-teste.txt` com este formato:

```
João Silva:5511999887766
Maria Santos:5521988776655
Pedro Costa:5531977665544
Ana Oliveira:5541966554433
```

**Formato**: `Nome:DDD+Número` (números brasileiros)

### Passo 2: Fazer Upload dos Contatos
1. Clique na aba **"📇 Contatos"**
2. Clique no botão **"📤 Importar Contatos"**
3. Selecione o arquivo `contatos-teste.txt`
4. Clique em **"Enviar"**

### Passo 3: Verificar Importação
1. Você verá uma mensagem de sucesso: "X contatos importados"
2. A lista de contatos aparecerá na tela
3. Cada contato mostrará: Nome, Telefone, Data de criação

---

## 🎯 Teste 3: Criar Template de Mensagem

### Passo 1: Acessar Templates
1. Clique na aba **"📝 Templates"**
2. Clique no botão **"➕ Novo Template"**

### Passo 2: Criar Template Simples (Sem Imagem)
1. Preencha os campos:
   - **Nome**: `Boas-vindas Centermed`
   - **Conteúdo**:
     ```
     Olá {{nome}}, seja bem-vindo(a) à Centermed!
     
     Estamos prontos para atender você com excelência.
     
     Como podemos ajudar hoje?
     ```
2. Clique em **"💾 Salvar Template"**

### Passo 3: Criar Template com Imagem
1. Clique em **"➕ Novo Template"** novamente
2. Preencha:
   - **Nome**: `Promoção Centermed`
   - **Conteúdo**:
     ```
     🎉 Olá {{nome}}!
     
     Confira nossa promoção especial!
     
     Entre em contato para mais informações.
     ```
3. Clique em **"📷 Adicionar Imagem"**
4. Selecione uma imagem do seu computador (PNG, JPG, max 5MB)
5. Aguarde o upload
6. Clique em **"💾 Salvar Template"**

---

## 🎯 Teste 4: Testar Resposta Automática do Chatbot

### Passo 1: Verificar Configuração
1. Volte para a aba **"📱 Números/Instâncias"**
2. Certifique-se de que os toggles estão ativos:
   - ✅ **Resposta Automática (IA)** → Ativado (azul)
   - ✅ **Chat Ativo** → Ativado (azul)

### Passo 2: Enviar Mensagem de Teste
1. No seu celular (com outro número ou de outro celular)
2. Envie uma mensagem para o número que você conectou
3. Exemplos de mensagens para testar:

```
"Olá, gostaria de informações sobre a Centermed"
"Quais são os horários de atendimento?"
"Preciso de ajuda com meu plano"
"Quanto custa uma consulta?"
```

### Passo 3: Verificar Resposta
1. Aguarde alguns segundos (máximo 10 segundos)
2. O chatbot da **DevSphere.ai** responderá automaticamente
3. A resposta será baseada no contexto da Centermed/Tim Ultra Fibra
4. As respostas são geradas pela IA treinada

### Passo 4: Continuar Conversação
1. Continue enviando mensagens
2. O chatbot manterá o contexto da conversa
3. Teste diferentes tipos de perguntas:
   - Perguntas sobre serviços
   - Solicitação de informações
   - Dúvidas sobre produtos

---

## 🎯 Teste 5: Enviar Campanha (Opcional)

### Passo 1: Criar Campanha
1. Clique na aba **"🚀 Campanhas"**
2. Clique em **"➕ Nova Campanha"**
3. Preencha:
   - **Nome**: `Teste Centermed - Novembro 2025`
   - **Selecionar Número**: Escolha o número conectado
   - **Selecionar Template**: Escolha um template criado
   - **Selecionar Contatos**: Marque alguns contatos

### Passo 2: Iniciar Campanha
1. Clique em **"▶️ Iniciar Campanha"**
2. Aguarde o processamento
3. As mensagens serão enviadas automaticamente

### Passo 3: Acompanhar Progresso
1. Você verá o status da campanha: "Em andamento"
2. Contador de mensagens enviadas será atualizado
3. Quando finalizar, status mudará para "Concluída"

---

## ✅ Checklist de Testes

Use este checklist para garantir que todos os testes foram executados:

- [ ] **Teste 1**: Número conectado via QR Code
- [ ] **Teste 2**: Contatos importados com sucesso
- [ ] **Teste 3**: Template simples criado
- [ ] **Teste 3.1**: Template com imagem criado
- [ ] **Teste 4**: Chatbot respondendo automaticamente
- [ ] **Teste 4.1**: Chatbot mantendo contexto da conversa
- [ ] **Teste 5**: Campanha criada e executada (opcional)

---

## 🐛 Resolução de Problemas

### Problema: QR Code não aparece
**Solução**:
1. Recarregue a página (F5)
2. Clique em "Conectar" novamente
3. Aguarde até 30 segundos

### Problema: Chatbot não responde
**Solução**:
1. Verifique se "Resposta Automática (IA)" está ativado (azul)
2. Verifique se "Chat Ativo" está ativado (azul)
3. Aguarde até 15 segundos após enviar a mensagem
4. Verifique a conexão do número (deve estar "🟢 Conectado")

### Problema: Erro ao importar contatos
**Solução**:
1. Verifique o formato do arquivo: `Nome:DDD+Número`
2. Certifique-se de que os números são brasileiros (11 dígitos)
3. Exemplo correto: `João:5511999887766`

### Problema: Template com imagem não salva
**Solução**:
1. Verifique o tamanho da imagem (máximo 5MB)
2. Use formatos: JPG, PNG, GIF, WEBP
3. Aguarde o upload completar (barra de progresso)

---

## 📊 Métricas a Observar

Durante os testes, observe:

1. **Tempo de Resposta do Chatbot**: Deve ser < 10 segundos
2. **Qualidade das Respostas**: Contextualizadas com Centermed/Tim
3. **Taxa de Entrega**: Mensagens devem ser entregues com sucesso
4. **Estabilidade da Conexão**: Número deve permanecer conectado
5. **Upload de Imagens**: Deve funcionar sem erros

---

## 🎉 Sucesso!

Se todos os testes passaram, o sistema está funcionando perfeitamente!

### Próximos Passos
1. Teste com mais contatos reais
2. Crie templates personalizados para sua empresa
3. Configure campanhas agendadas
4. Monitore as métricas de envio
5. Ajuste as respostas do chatbot conforme necessário

---

**Desenvolvido por DevSphere.ai** 🤖  
**Sistema de Automação WhatsApp Business**
