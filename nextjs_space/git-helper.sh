
#!/bin/bash

# 🔧 DevSphere.ai - Git Helper Script
# Script auxiliar para facilitar operações Git

set -e

PROJECT_DIR="/home/ubuntu/center_ai_omni/nextjs_space"
cd "$PROJECT_DIR"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}            🚀 DevSphere.ai - Git Helper            ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Função para mostrar status
show_status() {
    echo -e "${YELLOW}📊 Status do Repositório:${NC}"
    git status --short
    echo ""
    echo -e "${YELLOW}📝 Últimos Commits:${NC}"
    git log --oneline -5
    echo ""
}

# Função para commit e push
commit_and_push() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Erro: Mensagem de commit não fornecida${NC}"
        echo "Uso: ./git-helper.sh commit \"sua mensagem aqui\""
        exit 1
    fi
    
    echo -e "${GREEN}➕ Adicionando arquivos...${NC}"
    git add .
    
    echo -e "${GREEN}📝 Fazendo commit...${NC}"
    git commit -m "$1"
    
    echo -e "${GREEN}📤 Fazendo push para o GitHub...${NC}"
    git push origin master
    
    echo -e "${GREEN}✅ Commit e push concluídos com sucesso!${NC}"
}

# Função para pull
pull_changes() {
    echo -e "${GREEN}📥 Baixando alterações do GitHub...${NC}"
    git pull origin master
    echo -e "${GREEN}✅ Pull concluído!${NC}"
}

# Função para criar nova branch
create_branch() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Erro: Nome da branch não fornecido${NC}"
        echo "Uso: ./git-helper.sh branch \"nome-da-branch\""
        exit 1
    fi
    
    echo -e "${GREEN}🌿 Criando nova branch: $1${NC}"
    git checkout -b "$1"
    echo -e "${GREEN}✅ Branch '$1' criada e ativada!${NC}"
}

# Menu principal
case "$1" in
    status)
        show_status
        ;;
    commit)
        commit_and_push "$2"
        ;;
    pull)
        pull_changes
        ;;
    push)
        echo -e "${GREEN}📤 Fazendo push para o GitHub...${NC}"
        git push origin master
        echo -e "${GREEN}✅ Push concluído!${NC}"
        ;;
    branch)
        create_branch "$2"
        ;;
    *)
        echo -e "${YELLOW}Uso:${NC}"
        echo "  ./git-helper.sh status              - Ver status do repositório"
        echo "  ./git-helper.sh commit \"mensagem\"   - Commit e push em um comando"
        echo "  ./git-helper.sh pull                - Baixar alterações do GitHub"
        echo "  ./git-helper.sh push                - Fazer push para o GitHub"
        echo "  ./git-helper.sh branch \"nome\"       - Criar nova branch"
        echo ""
        echo -e "${YELLOW}Exemplos:${NC}"
        echo "  ./git-helper.sh commit \"Adicionado recurso X\""
        echo "  ./git-helper.sh branch \"feature-novo-recurso\""
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
