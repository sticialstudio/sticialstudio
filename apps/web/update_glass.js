const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdir(dir, function(err, list) {
        if (err) return;
        list.forEach(function(file) {
            file = path.join(dir, file);
            fs.stat(file, function(err, stat) {
                if (stat && stat.isDirectory()) walk(file, callback);
                else callback(file);
            });
        });
    });
}

walk(path.join(__dirname, 'src'), function(file) {
    if (!file.endsWith('.tsx') && !file.endsWith('.ts')) return;
    let content = fs.readFileSync(file, 'utf8');
    
    let original = content;
    // We want to replace common patterns like "border border-panel-border bg-panel" and "rounded-X"
    // Also "backdrop-blur-xl" or "shadow-X" 
    
    // Simple approach: we just let the developers keep the tailwind classes but strictly apply glass-panel.
    // Replace `border border-panel-border bg-panel` with `glass-panel`
    // remove `rounded-*` and `backdrop-blur-*` and `shadow-*` if next to it.
    
    content = content.replace(/rounded-\w+(-\w+)?\s+/g, (match) => {
        // Only strip if it's near bg-panel, but a regex is tricky.
        return match; 
    });
    
    content = content.replace(/border border-panel-border bg-panel/g, 'glass-panel');
    content = content.replace(/bg-panel border border-panel-border/g, 'glass-panel');
    content = content.replace(/backdrop-blur-\w+/g, '');
    content = content.replace(/shadow-lg|shadow-2xl/g, '');
    
    if (original !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log('Updated: ' + file);
    }
});
