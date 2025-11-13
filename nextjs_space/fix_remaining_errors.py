import os
import re

def add_uuid_import_if_needed(content):
    """Adiciona import uuid se não existir e há .create("""
    if '.create(' in content and 'uuidv4' not in content:
        # Adicionar import após os outros imports
        imports_end = content.rfind('import ')
        if imports_end != -1:
            # Encontrar o fim da linha do último import
            imports_end = content.find('\n', imports_end)
            content = content[:imports_end+1] + "import { v4 as uuidv4 } from 'uuid';\n" + content[imports_end+1:]
    return content

def add_missing_create_fields(content):
    """Adiciona id e updated_at em creates"""
    # Encontrar .create({ data: {
    pattern = r'(\.create\(\{\s*data:\s*\{)\n(\s+)'
    def replacement(match):
        indent = match.group(2)
        return match.group(1) + f'\n{indent}id: uuidv4(),\n{indent}'
    
    content = re.sub(pattern, replacement, content)
    
    # Adicionar updated_at antes do fechamento de data:
    pattern = r'(\s+)([\w_]+:\s*[^,\n]+,)(\s*\}\s*,?\s*\})'
    
    return content

def fix_composite_keys(content):
    """Corrige chaves compostas phoneNumber_companyId para phone_number_company_id"""
    content = re.sub(r'phoneNumber_companyId', 'phone_number_company_id', content)
    return content

def fix_field_accesses(content):
    """Corrige acessos a campos como campaign.totalContacts para campaign.total_contacts"""
    # Padrão: word.camelCase
    replacements = {
        'totalContacts': 'total_contacts',
        'sentCount': 'sent_count',
        'failedCount': 'failed_count',
        'responseTime': 'response_time',
        'messageContent': 'message_content',
    }
    
    for old, new in replacements.items():
        content = re.sub(rf'\.{old}\b', f'.{new}', content)
    
    return content

def fix_count_selects(content):
    """Corrige _count selects"""
    content = re.sub(r'messages:\s*true', 'campaign_messages: true', content)
    content = re.sub(r'campaignMessages:\s*true', 'campaign_messages: true', content)
    return content

def fix_include_relations(content):
    """Corrige relações em includes"""
    # messages -> campaign_messages
    content = re.sub(r'(messages:\s*\{)', 'campaign_messages: {', content)
    # contacts -> contacts (já está correto)
    # instance -> whatsapp_instances (mas é uma relação singular, deve ser instance)
    return content

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Aplicar correções
        content = add_uuid_import_if_needed(content)
        content = fix_composite_keys(content)
        content = fix_field_accesses(content)
        content = fix_count_selects(content)
        content = fix_include_relations(content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed: {filepath}")
            return True
        return False
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

# Buscar todos os arquivos TS em app/api
api_dir = 'app/api'
fixed_count = 0

for root, dirs, files in os.walk(api_dir):
    for file in files:
        if file.endswith('.ts'):
            filepath = os.path.join(root, file)
            if fix_file(filepath):
                fixed_count += 1

print(f"\nTotal files fixed: {fixed_count}")
