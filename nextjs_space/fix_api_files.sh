#!/bin/bash

# Adicionar uuid import em arquivos que precisam
files_needing_uuid=(
  "app/api/settings/route.ts"
  "app/api/conversations/route.ts"
  "app/api/conversations/[id]/route.ts"
  "app/api/conversations/whatsapp/[id]/route.ts"
  "app/api/conversations/whatsapp/[id]/messages/route.ts"
)

for file in "${files_needing_uuid[@]}"; do
  if [ -f "$file" ] && ! grep -q "import.*uuid" "$file"; then
    # Adicionar import após as primeiras linhas de import
    sed -i "/^import.*from.*$/a import { v4 as uuidv4 } from 'uuid';" "$file" 2>/dev/null || true
  fi
done

echo "UUID imports adicionados!"
