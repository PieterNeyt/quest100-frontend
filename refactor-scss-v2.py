#!/usr/bin/env python3
"""
Advanced SCSS refactoring - Consolidate flex blocks into reusable classes
"""
import re
from pathlib import Path
def consolidate_flex_blocks(content):
    """
    Find patterns like:
    .selector {
      display: flex;
      align-items: center;
      justify-content: center;
      ...
    }
    And consolidate common ones.
    """
    # Pattern 1: .selector { display: flex; align-items: center; justify-content: center; ... }
    pattern1 = r'\.(\w+)\s*\{\s*display:\s*flex;\s*align-items:\s*center;\s*justify-content:\s*center;'
    count1 = len(re.findall(pattern1, content))
    # Pattern 2: display: flex; followed by other props
    pattern2 = r'display:\s*flex;'
    count2 = len(re.findall(pattern2, content))
    # Pattern 3: align-items: center; 
    pattern3 = r'align-items:\s*center;'
    count3 = len(re.findall(pattern3, content))
    # Pattern 4: justify-content: space-between;
    pattern4 = r'justify-content:\s*space-between;'
    count4 = len(re.findall(pattern4, content))
    return count1, count2, count3, count4
def main():
    scss_dir = Path('/home/hugodor/WebstormProjects/quest100frontend/src/app')
    scss_files = list(scss_dir.rglob('*.scss'))
    total_flex = 0
    total_align_center = 0
    total_justify_between = 0
    print("=" * 80)
    print("SCSS PATTERN ANALYSIS")
    print("=" * 80)
    print()
    for scss_file in sorted(scss_files):
        with open(scss_file, 'r', encoding='utf-8') as f:
            content = f.read()
        c1, c2, c3, c4 = consolidate_flex_blocks(content)
        total_flex += c2
        total_align_center += c3
        total_justify_between += c4
        if c2 > 0 or c3 > 0:
            filename = scss_file.relative_to(scss_dir.parent.parent)
            print(f"📄 {filename}")
            if c2 > 0:
                print(f"   display: flex                   {c2}x")
            if c3 > 0:
                print(f"   align-items: center             {c3}x")
            if c4 > 0:
                print(f"   justify-content: space-between  {c4}x")
            print()
    print("=" * 80)
    print("POTENTIAL SAVINGS:")
    print(f"  display: flex instances:           {total_flex}")
    print(f"  align-items: center instances:     {total_align_center}")
    print(f"  justify-content instances:         {total_justify_between}")
    print()
    print(f"  Est. line savings: {total_flex * 0.5:.0f} lines minimum")
    print("=" * 80)
if __name__ == '__main__':
    main()
