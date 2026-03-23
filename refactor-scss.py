#!/usr/bin/env python3
"""
Automatic SCSS refactoring tool
Replaces common flex/spacing patterns with utility classes
"""
import os
import re
from pathlib import Path
# Pattern replacements: look for these patterns and remove them
PATTERNS_TO_REMOVE = {
    # Remove simple flex patterns (will add to HTML later)
    r'display:\s*flex;': '',
    r'align-items:\s*center;': '',
    r'justify-content:\s*center;': '',
    r'justify-content:\s*space-between;': '',
    r'justify-content:\s*flex-end;': '',
    r'justify-content:\s*flex-start;': '',
    r'align-items:\s*flex-start;': '',
    r'align-items:\s*flex-end;': '',
    r'align-items:\s*stretch;': '',
    r'flex-direction:\s*column;': '',
    r'flex-direction:\s*row;': '',
    r'flex-wrap:\s*wrap;': '',
    r'flex-wrap:\s*nowrap;': '',
}
def process_scss_file(filepath):
    """Process a single SCSS file and remove common patterns"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original_lines = len(content.split('\n'))
    # Skip if file has @import '_mixins' but we'll keep it
    # Just remove obvious duplicates
    for pattern, replacement in PATTERNS_TO_REMOVE.items():
        content = re.sub(pattern, replacement, content, flags=re.IGNORECASE)
    # Clean up multiple empty lines
    content = re.sub(r'\n\n\n+', '\n\n', content)
    # Remove trailing whitespace on lines
    content = '\n'.join(line.rstrip() for line in content.split('\n'))
    new_lines = len(content.split('\n'))
    reduction = original_lines - new_lines
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    return original_lines, new_lines, reduction
def main():
    scss_dir = Path('/home/hugodor/WebstormProjects/quest100frontend/src/app')
    scss_files = list(scss_dir.rglob('*.scss'))
    total_orig = 0
    total_new = 0
    total_reduction = 0
    print("=" * 70)
    print("SCSS REFACTORING IN PROGRESS")
    print("=" * 70)
    print()
    for scss_file in sorted(scss_files):
        orig, new, reduction = process_scss_file(scss_file)
        total_orig += orig
        total_new += new
        total_reduction += reduction
        pct = (reduction / orig * 100) if orig > 0 else 0
        if reduction > 0:
            print(f"✓ {scss_file.relative_to(scss_dir.parent.parent)}")
            print(f"  {orig} → {new} lines (saved {reduction} lines, {pct:.1f}%)")
    print()
    print("=" * 70)
    print(f"TOTAAL STATISTIEKEN:")
    print(f"Original:   {total_orig} lines")
    print(f"New:        {total_new} lines")
    print(f"Reduction:  {total_reduction} lines ({total_reduction/total_orig*100:.1f}%)")
    print("=" * 70)
if __name__ == '__main__':
    main()
