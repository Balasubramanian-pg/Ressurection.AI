import glob
import json
from pathlib import Path

fy24_files = glob.glob("FY 2024-25/*/*.xlsx")
fy25_files = glob.glob("FY 2025-26/*/*.xlsx")

fy24_states = {}
for f in fy24_files:
    p = Path(f)
    st = p.parent.name
    fy24_states[st] = fy24_states.get(st, 0) + 1

fy25_states = {}
for f in fy25_files:
    p = Path(f)
    st = p.parent.name
    fy25_states[st] = fy25_states.get(st, 0) + 1

print(f"Total 2024 files: {len(fy24_files)}")
print(f"Total 2025 files: {len(fy25_files)}")
print(f"Missing overall: {len(fy24_files) - len(fy25_files)}")

incomplete = []
for st, cnt24 in sorted(fy24_states.items()):
    cnt25 = fy25_states.get(st, 0)
    if cnt25 < cnt24:
        diff = cnt24 - cnt25
        incomplete.append((st, cnt25, cnt24, diff))
        print(f"State: {st:<30} 2025: {cnt25:>3}/{cnt24} (Missing: {diff})")

print(f"\nTotal incomplete states: {len(incomplete)}")
