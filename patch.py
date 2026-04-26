import re

path = r'd:\SticialStudio\edtech-ide\apps\web\src\components\ide\SplitView.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """      <TextEditor
        code={activeEditorCode}
        language={activeEditorLanguage}
        fileName={activeEditorFileName}
        runtimeLabel={boardConfig?.runtimeLabel || (currentLanguage === "python" ? "MicroPython" : "Arduino C++")}
        onChange={handleActiveTextCodeChange}
      />"""

replacement = """      <TextEditor
        code={activeEditorCode}
        language={activeEditorLanguage}
        fileName={activeEditorFileName}
        runtimeLabel={boardConfig?.runtimeLabel || (currentLanguage === "python" ? "MicroPython" : "Arduino C++")}
        onChange={handleActiveTextCodeChange}
        onSave={() => void handleSaveProject()}
      />"""

if target in content:
    content = content.replace(target, replacement)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Target not found")
