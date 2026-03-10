const express = require('express');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const router = express.Router();

/**
 * POST /api/compile/arduino
 * Expects { sourceCode: string }
 * Compiles the C++ string to AVR hex locally.
 */
router.post('/arduino', async (req, res) => {
    const { sourceCode } = req.body;

    if (!sourceCode) {
        return res.status(400).json({ success: false, log: "No source code provided." });
    }

    // Generate unique sketch folder name conforming to Arduino requirements (folder matches .ino name)
    const sessionId = `sketch_${crypto.randomBytes(16).toString('hex')}`;
    const sketchDir = path.join(os.tmpdir(), sessionId);
    const sketchFile = path.join(sketchDir, `${sessionId}.ino`);
    const buildPath = path.join(sketchDir, 'build');

    try {
        // 1. Create isolation directory
        await fs.mkdir(sketchDir, { recursive: true });

        // 2. Write the .ino file
        await fs.writeFile(sketchFile, sourceCode, 'utf8');

        // 3. Invoke vendored arduino-cli
        const cliExt = process.platform === 'win32' ? '.exe' : '';
        const cliPath = path.join(__dirname, '..', 'bin', `arduino-cli${cliExt}`);
        const compileCmd = `"${cliPath}" compile --fqbn arduino:avr:uno --build-path "${buildPath}" "${sketchDir}"`;

        exec(compileCmd, async (error, stdout, stderr) => {
            let _hex = null;

            // Optional: If you need to return the physical HEX to send to the browser for Web Serial avrgirl flashing
            if (!error) {
                try {
                    const hexPath = path.join(buildPath, `${sessionId}.ino.hex`);
                    _hex = await fs.readFile(hexPath, 'utf8');
                } catch (e) {
                    console.error("Hex extraction failed", e);
                }
            }

            // Cleanup the isolated sketch safely
            try {
                await fs.rm(sketchDir, { recursive: true, force: true });
            } catch (cleanupErr) {
                console.error(`Failed to cleanup temp dir ${sketchDir}:`, cleanupErr);
            }

            if (error) {
                return res.status(200).json({
                    success: false,
                    log: stderr || stdout || error.message
                });
            }

            res.status(200).json({
                success: true,
                log: stdout,
                hex: _hex
            });
        });

    } catch (e) {
        // Fallback root catch
        console.error("Arduino API wrapper crash:", e);
        try { await fs.rm(sketchDir, { recursive: true, force: true }); } catch (ignored) { }

        res.status(500).json({
            success: false,
            log: `Backend execution error: ${e.message}`
        });
    }
});

module.exports = router;
