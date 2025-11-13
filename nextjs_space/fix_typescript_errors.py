import os
import re

# Mapeamento de campos camelCase para snake_case
field_mappings = {
    'userId': 'user_id',
    'instanceId': 'instance_id',
    'contactPhone': 'contact_phone',
    'contactName': 'contact_name',
    'assignedTo': 'assigned_to',
    'tabulatedAt': 'tabulated_at',
    'closedAt': 'closed_at',
    'lastMessageAt': 'last_message_at',
    'messageId': 'message_id',
    'fromMe': 'from_me',
    'messageType': 'message_type',
    'totalContacts': 'total_contacts',
    'sentCount': 'sent_count',
    'failedCount': 'failed_count',
    'intervalMin': 'interval_min',
    'intervalMax': 'interval_max',
    'templateId': 'template_id',
    'scheduledAt': 'scheduled_at',
    'phoneNumber': 'phone_number',
    'companyId': 'company_id',
    'campaignId': 'campaign_id',
    'contactId': 'contact_id',
    'campaignMessages': 'campaign_messages',
    'responseTime': 'response_time',
}

def fix_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Corrigir campos em where clauses
        for old, new in field_mappings.items():
            # where.field
            content = re.sub(r'\bwhere\.' + old + r'\b', f'where.{new}', content)
            # data.field
            content = re.sub(r'\bdata\.' + old + r'\b', f'data.{new}', content)
            # { field: value } em objetos
            pattern = r'([\{,]\s*)' + old + r'(\s*:)'
            replacement = r'\1' + new + r'\2'
            content = re.sub(pattern, replacement, content)
        
        # Corrigir relações específicas
        content = re.sub(r'include:\s*\{\s*agent:', 'include: {\n        users:', content)
        content = re.sub(r'include:\s*\{\s*messages:', 'include: {\n        whatsapp_conversation_messages:', content)
        content = re.sub(r'include:\s*\{\s*instance:', 'include: {\n        whatsapp_instances:', content)
        content = re.sub(r'include:\s*\{\s*template:', 'include: {\n        message_templates:', content)
        content = re.sub(r'include:\s*\{\s*contact:', 'include: {\n        contacts:', content)
        content = re.sub(r'include:\s*\{\s*campaign:', 'include: {\n        campaigns:', content)
        
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
