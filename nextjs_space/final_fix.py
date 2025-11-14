import re
import os

def fix_campaign_manager():
    file = "lib/whatsapp/campaign-manager.ts"
    with open(file, 'r') as f:
        content = f.read()
    
    # Fix campaignMessage.contact to campaignMessage.contacts
    content = re.sub(r'campaignMessage\.contact\.', 'campaignMessage.contacts.', content)
    
    with open(file, 'w') as f:
        f.write(content)
    print(f"Fixed {file}")

def fix_instance_manager():
    file = "lib/whatsapp/instance-manager.ts"
    with open(file, 'r') as f:
        content = f.read()
    
    # Fix various field names
    content = re.sub(r'\.messagesPerBatch', '.messages_per_batch', content)
    content = re.sub(r'\.currentMessageCount', '.current_message_count', content)
    content = re.sub(r'remoteJid:', 'remote_jid:', content)
    content = re.sub(r'messageType:', 'message_type:', content)
    content = re.sub(r'fromMe:', 'from_me:', content)
    
    with open(file, 'w') as f:
        f.write(content)
    print(f"Fixed {file}")

fix_campaign_manager()
fix_instance_manager()
