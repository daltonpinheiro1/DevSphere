import re
import os
import glob

# Define all replacements needed
replacements = {
    # Already fixed but need in other files
    "instanceId": "instance_id",
    "interval_min": "intervalMin",  # Nope, keep snake_case for interface
    "interval_max": "intervalMax",  # Nope, keep snake_case for interface
    "startedAt": "started_at",
    "completedAt": "completed_at",
    "riskLevel": "risk_level",
}

def fix_file(filepath):
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        original = content
        
        # Specific fixes for BulkSendOptions interface
        if 'interface BulkSendOptions' in content or 'type BulkSendOptions' in content:
            content = re.sub(r'intervalMin:', 'interval_min:', content)
            content = re.sub(r'intervalMax:', 'interval_max:', content)
        
        # Fix access to campaign fields
        content = re.sub(r'campaign\.startedAt', 'campaign.started_at', content)
        content = re.sub(r'campaign\.completedAt', 'campaign.completed_at', content)
        content = re.sub(r'campaign\.riskLevel', 'campaign.risk_level', content)
        
        # Fix field names in data objects
        content = re.sub(r'startedAt:', 'started_at:', content)
        content = re.sub(r'completedAt:', 'completed_at:', content)
        
        # Fix in switch statements
        content = re.sub(r'switch \(riskLevel\)', 'switch (risk_level)', content)
        
        # Fix function parameters that should be instance_id but are instanceId
        content = re.sub(r'\binstanceId\b(?!\s*:)', 'instance_id', content)
        
        if content != original:
            with open(filepath, 'w') as f:
                f.write(content)
            print(f"Fixed: {filepath}")
            return True
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

# Fix all TypeScript files in lib/whatsapp
files_to_fix = []
for pattern in ['lib/whatsapp/*.ts', 'app/api/whatsapp/**/*.ts']:
    files_to_fix.extend(glob.glob(pattern, recursive=True))

fixed_count = 0
for f in files_to_fix:
    if os.path.exists(f) and fix_file(f):
        fixed_count += 1

print(f"\nTotal files fixed: {fixed_count}")
