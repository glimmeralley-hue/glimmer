import React, { useRef, useState, useEffect, useCallback } from 'react';

const N_POINTS = 64;
const MATCH_THRESHOLD = 0.18;
const STORAGE_KEY = 'glimmer_gesture_lock';
const SESSION_KEY = 'glimmer_journal_unlocked';

const resample = (pts, n = N_POINTS) => {
    if (pts.length < 2) return pts;
    let totalLen = 0;
    for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[i - 1].x;
        const dy = pts[i].y - pts[i - 1].y;
        totalLen += Math.sqrt(dx * dx + dy * dy);
    }
    if (totalLen === 0) return pts;
    const interval = totalLen / (n - 1);
    const resampled = [{ ...pts[0] }];
    let D = 0;
    let cur = pts.slice();
    let i = 1;
    while (i < cur.length && resampled.length < n) {
        const dx = cur[i].x - cur[i - 1].x;
        const dy = cur[i].y - cur[i - 1].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (D + d >= interval) {
            const t = (interval - D) / d;
            const q = { x: cur[i - 1].x + t * dx, y: cur[i - 1].y + t * dy };
            resampled.push(q);
            cur.splice(i, 0, q);
            D = 0;
        } else {
            D += d;
        }
        i++;
    }
    while (resampled.length < n) resampled.push({ ...cur[cur.length - 1] });
    return resampled.slice(0, n);
};

const normalize = (pts) => {
    if (pts.length === 0) return pts;
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const range = Math.max(maxX - minX, maxY - minY) || 1;
    return pts.map(p => ({ x: (p.x - minX) / range, y: (p.y - minY) / range }));
};

const avgDist = (a, b) => {
    if (a.length !== b.length || a.length === 0) return 999;
    const total = a.reduce((acc, p, i) => {
        const dx = p.x - b[i].x, dy = p.y - b[i].y;
        return acc + Math.sqrt(dx * dx + dy * dy);
    }, 0);
    return total / a.length;
};

const processPoints = (pts) => normalize(resample(pts));

export const hasGestureLock = () => !!localStorage.getItem(STORAGE_KEY);
export const isJournalUnlocked = () => !!sessionStorage.getItem(SESSION_KEY);
export const lockJournal = () => sessionStorage.removeItem(SESSION_KEY);
export const clearGestureLock = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_KEY);
};

const GestureLock = ({ mode = 'verify', onUnlock, onSetup, onCancel }) => {
    const canvasRef = useRef(null);
    const [drawing, setDrawing] = useState(false);
    const [points, setPoints] = useState([]);
    const [allPoints, setAllPoints] = useState([]);
    const [step, setStep] = useState(1);
    const [firstGesture, setFirstGesture] = useState(null);
    const [feedback, setFeedback] = useState(null);
    const [hasDrawn, setHasDrawn] = useState(false);

    const drawCtx = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        return ctx;
    }, []);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, []);

    const getPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect();
        if (e.touches) {
            return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
        }
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleStart = useCallback((e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const pos = getPos(e, canvas);
        const ctx = drawCtx();
        if (!ctx) return;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setDrawing(true);
        setPoints([pos]);
        setHasDrawn(true);
    }, [drawCtx]);

    const handleMove = useCallback((e) => {
        e.preventDefault();
        if (!drawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const pos = getPos(e, canvas);
        const ctx = drawCtx();
        if (!ctx) return;
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setPoints(prev => [...prev, pos]);
    }, [drawing, drawCtx]);

    const handleEnd = useCallback((e) => {
        e.preventDefault();
        if (!drawing) return;
        setDrawing(false);
        setAllPoints(prev => [...prev, ...points]);
    }, [drawing, points]);

    const handleConfirm = useCallback(() => {
        const processed = processPoints(allPoints);
        if (processed.length < 5) {
            setFeedback('draw');
            setTimeout(() => setFeedback(null), 1500);
            return;
        }

        if (mode === 'setup') {
            if (step === 1) {
                setFirstGesture(processed);
                setStep(2);
                clearCanvas();
                setAllPoints([]);
                setHasDrawn(false);
                setFeedback('again');
                setTimeout(() => setFeedback(null), 1800);
            } else {
                const dist = avgDist(firstGesture, processed);
                if (dist < MATCH_THRESHOLD) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(firstGesture));
                    sessionStorage.setItem(SESSION_KEY, '1');
                    setFeedback('success');
                    setTimeout(() => onSetup && onSetup(), 1000);
                } else {
                    setFeedback('fail');
                    setTimeout(() => {
                        setFeedback(null);
                        setStep(1);
                        setFirstGesture(null);
                        clearCanvas();
                        setAllPoints([]);
                        setHasDrawn(false);
                    }, 1500);
                }
            }
        } else {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) { onUnlock && onUnlock(); return; }
            const savedGesture = JSON.parse(saved);
            const dist = avgDist(savedGesture, processed);
            if (dist < MATCH_THRESHOLD) {
                sessionStorage.setItem(SESSION_KEY, '1');
                setFeedback('success');
                setTimeout(() => onUnlock && onUnlock(), 800);
            } else {
                setFeedback('fail');
                setTimeout(() => {
                    setFeedback(null);
                    clearCanvas();
                    setAllPoints([]);
                    setHasDrawn(false);
                }, 1500);
            }
        }
    }, [allPoints, mode, step, firstGesture, clearCanvas, onSetup, onUnlock]);

    const handleClear = () => {
        clearCanvas();
        setAllPoints([]);
        setPoints([]);
        setHasDrawn(false);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }, []);

    const feedbackColors = {
        success: { bg: 'rgba(0,200,80,0.15)', border: 'rgba(0,200,80,0.5)', text: mode === 'setup' && step === 2 ? 'GESTURE SAVED ✓' : 'UNLOCKED ✓' },
        fail: { bg: 'rgba(255,50,50,0.1)', border: 'rgba(255,50,50,0.4)', text: step === 2 && mode === 'setup' ? "GESTURES DON'T MATCH — TRY AGAIN" : 'NOT RECOGNISED — TRY AGAIN' },
        draw: { bg: 'rgba(255,200,0,0.08)', border: 'rgba(255,200,0,0.3)', text: 'DRAW SOMETHING FIRST' },
        again: { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.2)', text: 'GOOD — NOW DRAW IT AGAIN TO CONFIRM' },
    };

    const fb = feedback ? feedbackColors[feedback] : null;

    const instructions = mode === 'setup'
        ? (step === 1 ? 'Draw your gesture on the pad below' : 'Draw the same gesture again to confirm')
        : 'Draw your gesture to unlock';

    return (
        <div style={{
            position: 'fixed', inset: 0, background: '#000', zIndex: 2000,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>
                    {mode === 'setup' ? '✍️' : '🔒'}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', letterSpacing: '4px', fontWeight: '900', margin: '0 0 6px' }}>
                    {mode === 'setup' ? (step === 1 ? 'STEP 1 OF 2' : 'STEP 2 OF 2') : 'JOURNAL LOCKED'}
                </p>
                <h2 style={{ color: '#fff', fontWeight: '900', fontSize: '1.4rem', letterSpacing: '-1px', margin: '0 0 8px' }}>
                    {mode === 'setup' ? 'CREATE GESTURE' : 'GESTURE LOCK'}
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: 0, transition: 'all 0.3s' }}>
                    {instructions}
                </p>
            </div>

            {/* Feedback banner */}
            {fb && (
                <div style={{
                    background: fb.bg, border: `1px solid ${fb.border}`,
                    borderRadius: '10px', padding: '10px 24px', marginBottom: '16px',
                    fontSize: '11px', fontWeight: '900', letterSpacing: '1.5px', color: '#fff',
                    transition: 'all 0.3s',
                }}>
                    {fb.text}
                </div>
            )}

            {/* Canvas pad */}
            <div style={{
                width: '340px', height: '340px', position: 'relative',
                borderRadius: '20px',
                border: fb
                    ? `1.5px solid ${fb.border}`
                    : '1.5px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.02)',
                overflow: 'hidden',
                transition: 'border-color 0.3s ease',
                touchAction: 'none',
            }}>
                <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
                    onMouseDown={handleStart}
                    onMouseMove={handleMove}
                    onMouseUp={handleEnd}
                    onMouseLeave={handleEnd}
                    onTouchStart={handleStart}
                    onTouchMove={handleMove}
                    onTouchEnd={handleEnd}
                />
                {!hasDrawn && (
                    <div style={{
                        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', pointerEvents: 'none',
                    }}>
                        <p style={{ color: 'rgba(255,255,255,0.1)', fontWeight: '900', fontSize: '11px', letterSpacing: '3px' }}>
                            DRAW HERE
                        </p>
                    </div>
                )}
            </div>

            {/* Buttons */}
            <div className="d-flex gap-3 mt-4">
                {hasDrawn && (
                    <button
                        onClick={handleClear}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px 24px', borderRadius: '30px', fontWeight: '900', fontSize: '10px', letterSpacing: '2px', cursor: 'pointer' }}
                    >
                        CLEAR
                    </button>
                )}
                <button
                    onClick={handleConfirm}
                    disabled={!hasDrawn}
                    style={{ background: hasDrawn ? '#fff' : 'rgba(255,255,255,0.08)', color: hasDrawn ? '#000' : 'rgba(255,255,255,0.3)', border: 'none', padding: '12px 32px', borderRadius: '30px', fontWeight: '900', fontSize: '10px', letterSpacing: '2px', cursor: hasDrawn ? 'pointer' : 'not-allowed', transition: 'all 0.2s ease' }}
                >
                    {mode === 'setup' ? (step === 1 ? 'NEXT →' : 'CONFIRM') : 'UNLOCK'}
                </button>
            </div>

            {onCancel && (
                <button
                    onClick={onCancel}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', fontWeight: '900', fontSize: '10px', letterSpacing: '2px', cursor: 'pointer', marginTop: '20px' }}
                >
                    CANCEL
                </button>
            )}
        </div>
    );
};

export default GestureLock;
