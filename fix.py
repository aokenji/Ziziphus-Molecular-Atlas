import os
import glob

def main():
    files = glob.glob('src/pages/**/*.tsx', recursive=True)
    for file in files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        content = content.replace('.smiles', '.canonicalSmiles')
        content = content.replace('.inchiKey', '.inchikey')
        content = content.replace('compound.references.includes', 'compound.referenceIds.includes')
        content = content.replace('compound.molecularWeight.toFixed', '(compound.molecularWeight || 0).toFixed')
        content = content.replace('compound.molecularWeight', '(compound.molecularWeight || 0)')
        content = content.replace('.occurrences', '.species')
        content = content.replace('occ.speciesName', 'occ.speciesId')
        content = content.replace('occ.references', 'occ.referenceIds')
        content = content.replace('ref.type', 'ref.evidenceType')
        content = content.replace("ref.evidenceType.toLowerCase().replace('_', '-')", "ref.evidenceType")
        content = content.replace("ref.evidenceType.replace('_', ' ')", 'ref.evidenceType.replace("-", " ").toUpperCase()')
        content = content.replace('name={compound.preferredName}', 'compoundName={compound.preferredName}')
        content = content.replace('c.molecularFormula', '(c.molecularFormula || "")')
        content = content.replace('a.molecularWeight', '(a.molecularWeight || 0)')
        content = content.replace('b.molecularWeight', '(b.molecularWeight || 0)')
        content = content.replace('message=', 'title=')
        content = content.replace('o.speciesName', 'o.speciesId')
        content = content.replace('o.references', 'o.referenceIds')
        content = content.replace('"VERIFIED"', '"verified"')
        content = content.replace('"PARTIALLY_VERIFIED"', '"partially-verified"')
        content = content.replace('"UNRESOLVED"', '"unresolved"')
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {file}")

if __name__ == '__main__':
    main()
