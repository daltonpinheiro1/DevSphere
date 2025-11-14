import re
import os

fixes = {
    "lib/whatsapp/conversation-cache.ts": [
        (r'`conversation:\${instance_id}:', r'`conversation:${instanceId}:'),
    ],
    "lib/whatsapp/init.ts": [
        (r'\.autoReply', '.auto_reply'),
    ],
    "lib/whatsapp/proxy-pool.ts": [
        (r'proxy\.lastChecked', 'proxy.last_checked'),
        (r'proxy\.responseTime', 'proxy.response_time'),
        (r'proxy\.successRate', 'proxy.success_rate'),
    ],
}

for filepath, replacements in fixes.items():
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    for old, new in replacements:
        content = re.sub(old, new, content)
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"Fixed: {filepath}")

print("\nAll critical files fixed!")
