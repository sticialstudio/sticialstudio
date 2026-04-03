const express = require('express');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const router = express.Router();

const ARDUINO_FQBN_MAP = {
    'Arduino Uno': 'arduino:avr:uno',
    'Arduino Nano': 'arduino:avr:nano',
    'Arduino Mega': 'arduino:avr:mega',
    'Arduino Leonardo': 'arduino:avr:leonardo',
};

/**
 * POST /api/compile/arduino
 * Expects { sourceCode: string, board?: string }
 * Compiles the C++ string to AVR hex locally.
 */
router.post('/arduino', async (req, res) => {
    const { sourceCode, board } = req.body;
    const requestedBoard = typeof board === 'string' && board.trim() ? board.trim() : 'Arduino Uno';
    const fqbn = ARDUINO_FQBN_MAP[requestedBoard];

    if (!sourceCode) {
        return res.status(400).json({ success: false, log: 'No source code provided.' });
    }

    if (!fqbn) {
        return res.status(400).json({
            success: false,
            log: `Board \"${requestedBoard}\" is not supported by the Arduino compiler route.`,
        });
    }

    const sessionId = `sketch_${crypto.randomBytes(16).toString('hex')}`;
    const sketchDir = path.join(os.tmpdir(), sessionId);
    const sketchFile = path.join(sketchDir, `${sessionId}.ino`);
    const buildPath = path.join(sketchDir, 'build');

    try {
        await fs.mkdir(sketchDir, { recursive: true });
        await fs.writeFile(sketchFile, sourceCode, 'utf8');

        const cliExt = process.platform === 'win32' ? '.exe' : '';
        const cliPath = path.join(__dirname, '..', 'bin', `arduino-cli${cliExt}`);
        const compileCmd = `"${cliPath}" compile --fqbn ${fqbn} --build-path "${buildPath}" "${sketchDir}"`;

        exec(compileCmd, async (error, stdout, stderr) => {
            let hex = null;

            if (!error) {
                try {
                    const hexPath = path.join(buildPath, `${sessionId}.ino.hex`);
                    hex = await fs.readFile(hexPath, 'utf8');
                } catch (hexError) {
                    console.error('Hex extraction failed', hexError);
                }
            }

            try {
                await fs.rm(sketchDir, { recursive: true, force: true });
            } catch (cleanupErr) {
                console.error(`Failed to cleanup temp dir ${sketchDir}:`, cleanupErr);
            }

            if (error) {
                return res.status(200).json({
                    success: false,
                    board: requestedBoard,
                    fqbn,
                    log: stderr || stdout || error.message,
                });
            }

            res.status(200).json({
                success: true,
                board: requestedBoard,
                fqbn,
                log: stdout,
                hex,
            });
        });
    } catch (e) {
        console.error('Arduino API wrapper crash:', e);
        try {
            await fs.rm(sketchDir, { recursive: true, force: true });
        } catch (ignored) {
            // ignore cleanup errors after a crash
        }

        res.status(500).json({
            success: false,
            board: requestedBoard,
            fqbn,
            log: `Backend execution error: ${e.message}`,
        });
    }
});

module.exports = router;
