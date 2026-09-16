import os
import glob
import re

def fix_more():
    files = glob.glob('src/**/*.tsx', recursive=True)
    for file in files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        content = content.replace('React.Fragment', 'Fragment')
        if 'Fragment' in content and 'import { Fragment }' not in content:
            content = "import { Fragment } from 'react';\n" + content
            
        if 'CompoundsPage.tsx' in file:
            content = content.replace("import type { VerificationStatus } from '../../data/types';", "")
            content = content.replace("import type { Compound, Species, VerificationStatus }", "import type { Compound, Species }")
            content = content.replace("speciesName", "speciesId")
            
        if 'ReferencesPage.tsx' in file:
            content = content.replace("c.references.includes", "c.referenceIds.includes")
            content = content.replace("compound.references.map", "compound.referenceIds.map")
            content = content.replace("compound.references", "compound.referenceIds")
            
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {file}")

if __name__ == '__main__':
    fix_more()
