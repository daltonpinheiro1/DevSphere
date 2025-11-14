import re
import os

def fix_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = re.sub(old, new, content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    print(f"Fixed {filepath}")

# Fix campaign-manager.ts
fix_file("lib/whatsapp/campaign-manager.ts", [
    (r'campaign\.risk_level', 'campaign.riskLevel'),  # Prisma model uses riskLevel
])

# Fix instance-manager.ts
fix_file("lib/whatsapp/instance-manager.ts", [
    (r'currentMessageCount:', 'current_message_count:'),
    (r'lastDnsRotation:', 'last_dns_rotation:'),
    (r'sessionData:', 'session_data:'),
    (r'phoneNumber:', 'phone_number:'),
    (r'totalMessagesSent:', 'total_messages_sent:'),
    (r'lastConnectedAt:', 'last_connected_at:'),
])

print("All files fixed!")
