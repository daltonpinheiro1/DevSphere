
#!/bin/bash

# Script Helper para Push no GitHub - DevSphere.ai
# Este script facilita o push dos commits para o repositório

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     DEVS PHERE.AI - PUSH HELPER PARA GITHUB               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Navegar para o diretório do projeto
cd /home/ubuntu/center_ai_omni

# Verificar status atual
echo "📊 Status Atual:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Branch: $(git branch --show-current)"
echo "Commits locais: $(git rev-list --count HEAD)"
echo "Working tree: $(git status --short | wc -l) arquivo(s) modificado(s)"
echo ""

# Verificar se há commits para push
COMMITS_TO_PUSH=$(git log origin/main..HEAD --oneline 2>/dev/null | wc -l || echo "N/A")
if [ "$COMMITS_TO_PUSH" = "N/A" ]; then
    echo "⚠️  Branch local ainda não sincronizada com origin"
    COMMITS_TO_PUSH=$(git rev-list --count HEAD)
fi

echo "Commits para push: $COMMITS_TO_PUSH"
echo ""

# Menu de opções
echo "🚀 Escolha uma opção de push:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1) Push com Token de Acesso Pessoal (Recomendado)"
echo "2) Push via SSH (Requer chave configurada)"
echo "3) Ver últimos commits"
echo "4) Ver instruções detalhadas"
echo "5) Sair"
echo ""
read -p "Escolha uma opção (1-5): " choice

case $choice in
    1)
        echo ""
        echo "📝 Push com Token de Acesso Pessoal"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo "⚠️  IMPORTANTE: Você precisa criar um token no GitHub primeiro!"
        echo ""
        echo "1. Acesse: https://github.com/settings/tokens"
        echo "2. Clique em 'Generate new token (classic)'"
        echo "3. Selecione a permissão 'repo'"
        echo "4. Copie o token gerado"
        echo ""
        read -p "Cole seu token aqui: " token
        
        if [ -z "$token" ]; then
            echo "❌ Token não fornecido. Cancelando..."
            exit 1
        fi
        
        echo ""
        echo "🚀 Fazendo push para GitHub..."
        git push https://${token}@github.com/daltonpinheiro1/DevSphere.git main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Push realizado com sucesso!"
            echo ""
            echo "📍 Acesse seu repositório em:"
            echo "   https://github.com/daltonpinheiro1/DevSphere"
        else
            echo ""
            echo "❌ Falha no push. Verifique:"
            echo "   - Token válido e não expirado"
            echo "   - Permissões corretas no token"
            echo "   - Acesso ao repositório"
        fi
        ;;
        
    2)
        echo ""
        echo "🔑 Push via SSH"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Verificar se a chave SSH existe
        if [ ! -f ~/.ssh/id_ed25519 ] && [ ! -f ~/.ssh/id_rsa ]; then
            echo ""
            echo "⚠️  Nenhuma chave SSH encontrada!"
            echo ""
            read -p "Deseja gerar uma chave SSH agora? (s/n): " generate
            
            if [ "$generate" = "s" ]; then
                read -p "Digite seu email: " email
                ssh-keygen -t ed25519 -C "$email"
                echo ""
                echo "📋 Sua chave pública:"
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                cat ~/.ssh/id_ed25519.pub
                echo ""
                echo "📝 Copie a chave acima e adicione em:"
                echo "   https://github.com/settings/ssh/new"
                echo ""
                read -p "Pressione Enter após adicionar a chave no GitHub..."
            else
                echo "❌ Sem chave SSH. Use a Opção 1 (Token) em vez disso."
                exit 1
            fi
        fi
        
        # Configurar remote para SSH
        git remote set-url origin git@github.com:daltonpinheiro1/DevSphere.git
        
        echo ""
        echo "🚀 Fazendo push para GitHub via SSH..."
        git push -u origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ Push realizado com sucesso!"
        else
            echo ""
            echo "❌ Falha no push. Verifique se a chave SSH está configurada no GitHub."
        fi
        ;;
        
    3)
        echo ""
        echo "📜 Últimos 10 Commits:"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        git log --oneline -10 --graph --decorate
        echo ""
        ;;
        
    4)
        echo ""
        echo "📖 Abrindo instruções detalhadas..."
        if [ -f "INSTRUCOES_PUSH_GITHUB.md" ]; then
            cat INSTRUCOES_PUSH_GITHUB.md | less
        else
            echo "⚠️  Arquivo de instruções não encontrado!"
            echo "   Execute: cat /home/ubuntu/center_ai_omni/INSTRUCOES_PUSH_GITHUB.md"
        fi
        ;;
        
    5)
        echo ""
        echo "👋 Até logo!"
        exit 0
        ;;
        
    *)
        echo ""
        echo "❌ Opção inválida!"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Script finalizado"
echo ""
