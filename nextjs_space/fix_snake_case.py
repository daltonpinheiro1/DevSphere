import re
import os

# Define replacements
replacements = {
    "instanceId": "instance_id",
    "intervalMin": "interval_min",
    "intervalMax": "interval_max",
    "errorMessage": "error_message",
    "failedCount": "failed_count",
    "sentCount": "sent_count"
}

def fix_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        original = content
        for old, new in replacements.items():
            # Replace in destructuring
            content = re.sub(rf'\b{old}\b', new, content)
        
        if content != original:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Fixed: {filepath}")
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")

# Fix specific files
files_to_fix = [
    "lib/whatsapp/baileys-service.ts",
    "lib/whatsapp/campaign-manager.ts"
]

for f in files_to_fix:
    if os.path.exists(f):
        fix_file(f)
