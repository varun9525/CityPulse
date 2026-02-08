import re
import json

def update_tsconfig():
    # Read vite.config.ts
    with open('vite.config.ts', 'r') as f:
        vite_content = f.read()

    # Extract aliases
    # Look for lines like 'alias-name': 'target' inside alias object
    # This regex is a bit simplistic but matches the format in the file
    aliases = {}
    matches = re.findall(r"'([^']+)'\s*:\s*'([^']+)'", vite_content)
    
    for alias, target in matches:
        if alias == '@': continue # Handled manually
        # specific handling for path.resolve types if needed, but here simple string mapping
        # In vite config: 'vaul@1.1.2': 'vaul'
        # In tsconfig: "vaul@1.1.2": ["node_modules/vaul"]
        
        # Check if target is a path or package
        if target.startswith('./'):
            # It's a relative path, likely handled by @ alias usually, but if present
            aliases[alias] = [target]
        else:
             # Assume package in node_modules
             aliases[alias] = [f"node_modules/{target}"]

    # Read tsconfig.json
    with open('tsconfig.json', 'r') as f:
        tsconfig_content = f.read()

    # Remove comments (// ... and /* ... */)
    content_no_comments = re.sub(r'//.*', '', tsconfig_content)
    content_no_comments = re.sub(r'/\*.*?\*/', '', content_no_comments, flags=re.DOTALL)
    
    tsconfig = json.loads(content_no_comments)

    # Update paths
    paths = tsconfig['compilerOptions'].setdefault('paths', {})
    paths.update(aliases)
    
    # Save tsconfig.json
    with open('tsconfig.json', 'w') as f:
        json.dump(tsconfig, f, indent=4)

    print(f"Updated tsconfig.json with {len(aliases)} aliases.")

if __name__ == "__main__":
    update_tsconfig()
