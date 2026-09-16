import os
import glob

def fix_imports():
    files = glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True)
    for file in files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove unused React imports
        content = content.replace("import React from 'react';\n", "")
        content = content.replace("import React, ", "import ")
        
        # Type imports
        content = content.replace("import { VerificationStatus }", "import type { VerificationStatus }")
        content = content.replace("import { Compound }", "import type { Compound }")
        content = content.replace("import { Reference }", "import type { Reference }")
        content = content.replace("import { Species }", "import type { Species }")
        
        # Specific fixes
        if 'App.tsx' in file:
            content = content.replace("import('./pages/HomePage/HomePage')", "import('./pages/HomePage/HomePage').then(m => ({ default: m.HomePage }))")
            content = content.replace("import('./pages/CompoundsPage/CompoundsPage')", "import('./pages/CompoundsPage/CompoundsPage').then(m => ({ default: m.CompoundsPage }))")
            content = content.replace("import('./pages/CompoundDetailPage/CompoundDetailPage')", "import('./pages/CompoundDetailPage/CompoundDetailPage').then(m => ({ default: m.CompoundDetailPage }))")
            content = content.replace("import('./pages/SpeciesListPage/SpeciesListPage')", "import('./pages/SpeciesListPage/SpeciesListPage').then(m => ({ default: m.SpeciesListPage }))")
            content = content.replace("import('./pages/SpeciesDetailPage/SpeciesDetailPage')", "import('./pages/SpeciesDetailPage/SpeciesDetailPage').then(m => ({ default: m.SpeciesDetailPage }))")
            content = content.replace("import('./pages/ReferencesPage/ReferencesPage')", "import('./pages/ReferencesPage/ReferencesPage').then(m => ({ default: m.ReferencesPage }))")
            content = content.replace("import('./pages/MethodologyPage/MethodologyPage')", "import('./pages/MethodologyPage/MethodologyPage').then(m => ({ default: m.MethodologyPage }))")
            content = content.replace("import('./pages/NotFoundPage/NotFoundPage')", "import('./pages/NotFoundPage/NotFoundPage').then(m => ({ default: m.NotFoundPage }))")
        
        if 'CompoundsPage.tsx' in file:
            content = content.replace("o.speciesName", "o.speciesId")
            
        if 'HomePage.tsx' in file:
            content = content.replace('"VERIFIED"', "'verified'")
            content = content.replace("'VERIFIED'", "'verified'")
            
        if 'ReferencesPage.tsx' in file:
            content = content.replace('compound.references.includes', 'compound.referenceIds.includes')
            
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {file}")

if __name__ == '__main__':
    fix_imports()
