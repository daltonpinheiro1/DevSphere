#!/bin/bash

# Arquivos para corrigir
files=(
  "app/api/whatsapp/campaigns/route.ts"
  "app/api/whatsapp/contacts/route.ts"
  "app/api/whatsapp/contacts/upload/route.ts"
  "app/api/whatsapp/templates/route.ts"
  "app/api/whatsapp/chatbots/route.ts"
  "scripts/seed-chatbot.ts"
  "prisma/seed.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    # Adicionar id e updated_at nos creates que não têm
    python3 << PYTHONEOF
import re

with open('$file', 'r') as f:
    content = f.read()

# Encontrar .create({ data: { que não tem id:
pattern = r'(\.create\(\{\s*data:\s*\{)\n(\s+)(?!id:)'
def add_fields(match):
    indent = match.group(2)
    return match.group(1) + f'\n{indent}id: uuidv4(),\n{indent}'

content = re.sub(pattern, add_fields, content)

# Garantir que tem import uuid
if '.create(' in content and 'uuidv4' not in content:
    # Adicionar após last import
    last_import = content.rfind('import ')
    if last_import != -1:
        end_import = content.find('\n', last_import)
        content = content[:end_import+1] + "import { v4 as uuidv4 } from 'uuid';\n" + content[end_import+1:]

with open('$file', 'w') as f:
    f.write(content)
PYTHONEOF
  fi
done

echo "Campos adicionados!"
