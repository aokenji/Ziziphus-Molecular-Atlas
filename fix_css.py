import os
import glob
import re

def fix_css():
    files = glob.glob('src/**/*.css', recursive=True)
    for file in files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        content = content.replace('--spacing-', '--space-')
        content = content.replace('--bg-surface', '--color-surface')
        content = content.replace('--bg-subtle', '--color-surface-alt')
        content = content.replace('--bg-surface-hover', '--color-surface-alt')
        content = content.replace('--border-color', '--color-border')
        content = content.replace('--border-subtle', '--color-border-light')
        content = content.replace('--text-primary', '--color-text-primary')
        content = content.replace('--text-secondary', '--color-text-secondary')
        content = content.replace('--text-tertiary', '--color-text-tertiary')
        content = content.replace('--color-link', '--color-green-deep')
        content = content.replace('--font-bold', '--weight-bold')
        content = content.replace('--font-medium', '--weight-medium')
        content = content.replace('--font-semibold', '--weight-semibold')
        content = content.replace('--font-normal', '--weight-normal')
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed CSS in {file}")

if __name__ == '__main__':
    fix_css()
