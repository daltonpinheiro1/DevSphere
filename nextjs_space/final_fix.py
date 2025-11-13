import os
import re

# Mapeamento completo de campos
ALL_FIELD_MAPPINGS = {
    'instanceId': 'instance_id',
    'templateId': 'template_id',
    'mediaType': 'media_type',
    'mediaUrl': 'media_url',
    'mediaName': 'media_name',
    'messageId': 'message_id',
    'conversationId': 'conversation_id',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    'riskLevel': 'risk_level',
    'scheduledAt': 'scheduled_at',
    'phoneNumber': 'phone_number',
    'companyId': 'company_id',
    'contactId': 'contact_id',
    'campaignId': 'campaign_id',
    'messageContent': 'message_content',
    'proxyServer': 'proxy_servers',
}

# Mapeamento de relações em include
INCLUDE_RELATIONS = {
    'template': 'message_templates',
    'instance': 'whatsapp_instances',
}

def fix_file_comprehensive(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 1. Corrigir todos os campos camelCase
        for old, new in ALL_FIELD_MAPPINGS.items():
            # Em objetos { field: value }
            pattern = r'([{\s,])' + old + r'(\s*:)'
            content = re.sub(pattern, r'\1' + new + r'\2', content)
            
            # Acessos .field
            content = re.sub(rf'\.{old}\b', f'.{new}', content)
        
        # 2. Corrigir relações em includes
        for old, new in INCLUDE_RELATIONS.items():
            content = re.sub(rf'(\s+){old}:\s*\{{', rf'\1{new}: {{', content)
        
        # 3. Adicionar id e updated_at em creates que não têm
        if '.create(' in content and 'id:' not in content:
            pattern = r'(\.create\(\{\s*data:\s*\{)\s*\n(\s+)(?!id:)'
            def add_id(match):
                indent = match.group(2)
                return match.group(1) + f'\n{indent}id: uuidv4(),\n{indent}'
            content = re.sub(pattern, add_id, content)
        
        # 4. Garantir import uuid se necessário
        if '.create(' in content and 'uuidv4' not in content:
            if 'import ' in content:
                last_import_pos = content.rfind('import ')
                end_of_line = content.find('\n', last_import_pos)
                if end_of_line != -1:
                    content = content[:end_of_line+1] + "import { v4 as uuidv4 } from 'uuid';\n" + content[end_of_line+1:]
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
    except Exception as e:
        print(f"Error in {filepath}: {e}")
        return False

# Processar todos os arquivos relevantes
dirs_to_process = [
    'app/api',
    'components',
    'hooks',
    'lib',
]

fixed_count = 0
for dir_path in dirs_to_process:
    if os.path.exists(dir_path):
        for root, dirs, files in os.walk(dir_path):
            for file in files:
                if file.endswith(('.ts', '.tsx')):
                    filepath = os.path.join(root, file)
                    if fix_file_comprehensive(filepath):
                        print(f"Fixed: {filepath}")
                        fixed_count += 1

print(f"\nTotal files fixed: {fixed_count}")
