#!/usr/bin/env python3
"""Fix corrupted template literals in generator.ts"""

filepath = r'd:\SticialStudio\edtech-ide\apps\web\src\lib\blockly\generator.ts'

with open(filepath, 'rb') as f:
    content = f.read()

print(f"File size: {len(content)} bytes")

# Count occurrences of broken patterns before fix
broken1 = b'    return   .step();\\n;\r\n'
broken2 = b'    return ${sensor}_step()\\n;\r\n'

print(f"Broken arduino pattern count: {content.count(broken1)}")
print(f"Broken micropython pattern count: {content.count(broken2)}")

# Correct replacements
# Arduino stepper: `  ${sensor}.step(${steps});\n`
fixed1 = b'    return `  ${sensor}.step(${steps});\\n`;\r\n'
# MicroPython stepper: `${sensor}_step(${steps})\n`
fixed2 = b'    return `${sensor}_step(${steps})\\n`;\r\n'

content = content.replace(broken1, fixed1)
content = content.replace(broken2, fixed2)

with open(filepath, 'wb') as f:
    f.write(content)

# Verify
with open(filepath, 'rb') as f:
    content2 = f.read()

print(f"Remaining broken arduino: {content2.count(broken1)}")
print(f"Remaining broken micropython: {content2.count(broken2)}")
print(f"Fixed arduino count: {content2.count(fixed1)}")
print(f"Fixed micropython count: {content2.count(fixed2)}")
print("Done!")
