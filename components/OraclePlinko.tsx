import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Play, RefreshCw, AlertTriangle, Heart } from 'lucide-react';
import { getLeaderboard, submitScore, LeaderboardEntry } from '../services/leaderboardService';

// --- Game Constants ---
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;
const GRAVITY = 0.25;
const FRICTION = 0.98;
const BOUNCE_DAMPING = 0.6;
const PEG_RADIUS = 5;
const BALL_RADIUS = 7;
const BUCKET_COUNT = 5;

// Different scores for each bucket
const BUCKET_SCORES = [50, 200, 1000, 200, 50];

const OraclePlinko: React.FC = () => {
  // Game State
  const [gameState, setGameState] = useState<'intro' | 'betting' | 'playing' | 'round_end' | 'gameover'>('intro');
  const [username, setUsername] = useState('');
  
  // New State for Mechanics
  const [score, setScore] = useState(0); 
  const [lives, setLives] = useState(3);
  const [lastRoundPoints, setLastRoundPoints] = useState(0);
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<number | null>(null);
  const [winningBucket, setWinningBucket] = useState<number | null>(null);
  
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();
  const ballRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, active: false });
  const pegsRef = useRef<{x: number, y: number}[]>([]);
  
  // Critical: Use ref for selectedBucket to ensure the game loop sees the immediate value
  const selectedBucketRef = useRef<number | null>(null);
  
  // Refs for game state accessed inside the loop to avoid stale closures
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const usernameRef = useRef('');

  // Sync refs with state
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { usernameRef.current = username; }, [username]);

  // --- Initialization ---
  useEffect(() => {
    fetchLeaderboard();
    initPegs();
  }, []);

  const fetchLeaderboard = async () => {
    const data = await getLeaderboard();
    setLeaderboard(data);
  };

  const initPegs = () => {
    const rows = 10;
    const newPegs = [];
    for (let r = 0; r < rows; r++) {
      const cols = r % 2 === 0 ? 7 : 8; 
      const spacingX = CANVAS_WIDTH / (cols + 1);
      const startY = 80;
      const spacingY = 35;
      
      for (let c = 0; c < cols; c++) {
        newPegs.push({
          x: spacingX * (c + 1) + (Math.random() * 2 - 1), 
          y: startY + r * spacingY
        });
      }
    }
    pegsRef.current = newPegs;
  };

  // --- Game Loop ---
  const update = () => {
    if (!ballRef.current.active) return;

    const ball = ballRef.current;
    
    // Physics
    ball.vy += GRAVITY;
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Walls
    if (ball.x < BALL_RADIUS) {
        ball.x = BALL_RADIUS;
        ball.vx *= -0.7;
    }
    if (ball.x > CANVAS_WIDTH - BALL_RADIUS) {
        ball.x = CANVAS_WIDTH - BALL_RADIUS;
        ball.vx *= -0.7;
    }

    // Peg Collisions
    for (const peg of pegsRef.current) {
        const dx = ball.x - peg.x;
        const dy = ball.y - peg.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = BALL_RADIUS + PEG_RADIUS;

        if (dist < minDist) {
            const angle = Math.atan2(dy, dx);
            const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
            
            ball.vx = Math.cos(angle) * speed * BOUNCE_DAMPING;
            ball.vy = Math.sin(angle) * speed * BOUNCE_DAMPING;

            const overlap = minDist - dist;
            ball.x += Math.cos(angle) * overlap;
            ball.y += Math.sin(angle) * overlap;

            // Random bounce variation
            ball.vx += (Math.random() - 0.5) * 2; 
        }
    }

    // Bottom collision (End of Round)
    if (ball.y > CANVAS_HEIGHT - 20) {
        ball.active = false;
        const bucketWidth = CANVAS_WIDTH / BUCKET_COUNT;
        // Clamp result to ensure it's within 0-4
        let resultBucket = Math.floor(ball.x / bucketWidth);
        if (resultBucket < 0) resultBucket = 0;
        if (resultBucket >= BUCKET_COUNT) resultBucket = BUCKET_COUNT - 1;
        
        handleRoundEnd(resultBucket);
        return; 
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Buckets
    const bucketWidth = CANVAS_WIDTH / BUCKET_COUNT;
    for (let i = 0; i < BUCKET_COUNT; i++) {
        // Highlight logic - USE REFS to avoid stale closures in animation loop
        const isSelected = i === selectedBucketRef.current;
        const isWinning = i === winningBucket && (gameState === 'round_end' || gameState === 'gameover');
        
        if (isWinning) ctx.fillStyle = 'rgba(34, 197, 94, 0.6)'; // Strong Green
        else if (isSelected) ctx.fillStyle = 'rgba(34, 197, 94, 0.3)'; // Selected Green
        else ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'; // Default

        ctx.fillRect(i * bucketWidth + 2, CANVAS_HEIGHT - 60, bucketWidth - 4, 60);
        
        // Bucket Scores
        ctx.fillStyle = isSelected ? '#4ade80' : '#fff';
        ctx.font = 'bold 14px "Space Grotesk"';
        ctx.textAlign = 'center';
        ctx.fillText(`${BUCKET_SCORES[i]}`, i * bucketWidth + bucketWidth / 2, CANVAS_HEIGHT - 35);
        ctx.font = '10px sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.fillText(`PTS`, i * bucketWidth + bucketWidth / 2, CANVAS_HEIGHT - 20);
    }

    // Draw Pegs
    ctx.fillStyle = '#4ade80';
    for (const peg of pegsRef.current) {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }

    // Draw Ball
    if (ballRef.current.active || gameState === 'playing') {
        const ball = ballRef.current;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }
  };

  // --- Logic ---

  const handleStartGame = () => {
    if (username.length !== 3) return;
    setScore(0);
    setLives(3);
    setWinningBucket(null);
    setSelectedBucket(null);
    selectedBucketRef.current = null;
    setGameState('betting');
  };

  const handleDrop = (bucketIndex: number) => {
    if (lives <= 0) return;
    
    // Set both state (for UI) and ref (for Logic/Animation Loop)
    setSelectedBucket(bucketIndex);
    selectedBucketRef.current = bucketIndex;
    
    setWinningBucket(null);
    setGameState('playing');
    
    // Spawn ball
    ballRef.current = {
        x: CANVAS_WIDTH / 2 + (Math.random() * 40 - 20),
        y: 20,
        vx: (Math.random() * 4 - 2), 
        vy: 0,
        active: true
    };
    
    requestRef.current = requestAnimationFrame(update);
  };

  const handleRoundEnd = (resultBucket: number) => {
    setWinningBucket(resultBucket);
    
    // Use Refs for logic because this function is called from the animation loop closure
    // which might contain stale state values.
    const prediction = selectedBucketRef.current; 
    const currentScore = scoreRef.current;
    const currentLives = livesRef.current;
    const currentUser = usernameRef.current;

    const isCorrectPrediction = resultBucket === prediction;
    
    let pointsWon = 0;
    if (isCorrectPrediction) {
        pointsWon = BUCKET_SCORES[resultBucket];
        setScore(prev => prev + pointsWon);
    }
    
    setLastRoundPoints(pointsWon);
    
    // Decrease Lives
    const newLives = currentLives - 1;
    setLives(newLives);

    if (newLives > 0) {
        setGameState('round_end');
    } else {
        // Game Over
        setGameState('gameover');
        const finalScore = currentScore + pointsWon;
        
        // Submit score properly waiting for promise resolution
        submitScore(currentUser.toUpperCase(), finalScore)
            .then(() => {
                // Fetch leaderboard only after submission is complete
                fetchLeaderboard();
            })
            .catch(err => console.error("Score submission failed:", err));
    }
  };

  const nextRound = () => {
      setSelectedBucket(null);
      selectedBucketRef.current = null;
      setWinningBucket(null);
      setGameState('betting');
      draw(); // Redraw static state
  };

  const resetGame = () => {
    setScore(0);
    setLives(3);
    setSelectedBucket(null);
    selectedBucketRef.current = null;
    setWinningBucket(null);
    setGameState('betting');
  };

  // Cleanup
  useEffect(() => {
    return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  // Effect to draw static state when not playing
  useEffect(() => {
      if (gameState !== 'playing') {
          draw();
      }
  }, [gameState, selectedBucket, winningBucket]);

  return (
    <section className="py-20 relative border-t border-white/10">
      <div className="container mx-auto px-4">
        
        <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 text-outline flex justify-center items-center gap-2">
                <Trophy className="text-yellow-400" size={40} />
                PREDICT THE BOX
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
                <span className="text-green-400 font-bold">Goal:</span> Pick the box where the ball lands. <br/>
                Different boxes have different rewards. You have 3 attempts.
            </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center max-w-6xl mx-auto">
            
            {/* GAME AREA */}
            <div className="flex-1 w-full max-w-[450px] mx-auto bg-gray-900 rounded-3xl p-4 border-2 border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.1)] relative">
                
                {/* Score & Lives HUD */}
                <div className="flex justify-between items-center mb-4 px-2">
                    <div className="flex gap-1">
                        {[...Array(3)].map((_, i) => (
                            <Heart 
                                key={i} 
                                size={24} 
                                className={`${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} 
                            />
                        ))}
                    </div>
                    <div className="bg-black/80 px-4 py-2 rounded-full border border-white/20">
                        <span className="text-white font-mono font-bold text-sm">TOTAL: </span>
                        <span className="text-green-400 font-mono font-bold text-xl">{score}</span>
                    </div>
                </div>

                {/* CANVAS WRAPPER */}
                <div className="bg-black rounded-2xl overflow-hidden relative shadow-inner">
                    <canvas 
                        ref={canvasRef} 
                        width={CANVAS_WIDTH} 
                        height={CANVAS_HEIGHT}
                        className="w-full h-auto block"
                    />
                    
                    {/* --- OVERLAYS --- */}

                    {/* INTRO SCREEN */}
                    {gameState === 'intro' && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-30">
                            <h3 className="text-2xl font-bold text-white mb-4">ENTER INITIALS</h3>
                            <input 
                                type="text" 
                                maxLength={3}
                                placeholder="AAA"
                                className="bg-transparent border-b-2 border-green-500 text-center text-4xl text-white font-mono font-black w-32 focus:outline-none mb-6 uppercase placeholder:text-gray-700"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.toUpperCase())}
                            />
                            <button 
                                onClick={handleStartGame}
                                disabled={username.length !== 3}
                                className="bg-green-500 hover:bg-green-400 text-black font-black py-3 px-8 rounded-full transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
                            >
                                <Play fill="currentColor" /> START GAME
                            </button>
                        </div>
                    )}

                    {/* BETTING PHASE - INSTRUCTION */}
                    {gameState === 'betting' && (
                        <div className="absolute bottom-24 left-0 w-full text-center pointer-events-none">
                            <div className="inline-block bg-black/70 px-4 py-2 rounded-lg backdrop-blur-sm">
                                <p className="text-white font-bold text-lg animate-pulse">👇 Select a Box to Predict 👇</p>
                            </div>
                        </div>
                    )}
                    
                    {/* CLICK ZONES FOR BETTING */}
                    {gameState === 'betting' && (
                        <div className="absolute bottom-0 left-0 w-full h-[80px] flex z-20 cursor-pointer">
                            {Array.from({length: BUCKET_COUNT}).map((_, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleDrop(i)}
                                    className="flex-1 hover:bg-white/10 transition-colors"
                                    title={`Predict Box ${i+1}`}
                                />
                            ))}
                        </div>
                    )}

                    {/* ROUND END SCREEN */}
                    {gameState === 'round_end' && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-30 animate-in fade-in duration-300">
                            <div className="bg-gray-900 border border-white/20 p-6 rounded-2xl text-center shadow-2xl">
                                {lastRoundPoints > 0 ? (
                                    <>
                                        <h3 className="text-3xl font-black text-green-400 mb-2">PREDICTION HIT!</h3>
                                        <p className="text-white text-xl mb-4">You won +{lastRoundPoints} PTS</p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-3xl font-black text-red-500 mb-2">MISSED</h3>
                                        <p className="text-white/80 text-xl mb-4">No points this round.</p>
                                    </>
                                )}
                                <div className="flex gap-2 justify-center mb-6">
                                     <p className="text-sm font-mono text-gray-400">{lives} Attempts Remaining</p>
                                </div>
                                <button 
                                    onClick={nextRound}
                                    className="bg-white text-black font-bold py-2 px-6 rounded-full hover:scale-105 transition-transform"
                                >
                                    Next Round
                                </button>
                            </div>
                        </div>
                    )}

                    {/* GAME OVER SCREEN */}
                    {gameState === 'gameover' && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
                            <h3 className="text-3xl font-black text-white mb-2">GAME OVER</h3>
                            <div className="bg-white/10 p-6 rounded-2xl mb-6 w-full max-w-xs border border-white/10">
                                <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Total Score</p>
                                <p className="text-5xl font-mono text-green-400 font-bold drop-shadow-lg">{score}</p>
                            </div>
                            <button 
                                onClick={resetGame}
                                className="bg-green-500 hover:bg-green-400 text-black font-black py-3 px-8 rounded-full transition-transform hover:scale-105 flex items-center gap-2 shadow-lg"
                            >
                                <RefreshCw size={20} /> PLAY AGAIN
                            </button>
                        </div>
                    )}

                </div>
            </div>

            {/* LEADERBOARD */}
            <div className="w-full lg:w-[350px] bg-white/5 border border-white/10 rounded-3xl p-6 h-fit">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Trophy className="text-yellow-500" size={20} />
                        TOP 5
                    </h3>
                    <span className="text-xs text-white/40 font-mono">PREDICTOORS</span>
                </div>
                
                <div className="space-y-2">
                    {leaderboard.length === 0 ? (
                        <p className="text-center text-gray-500 py-8 italic">No records yet.</p>
                    ) : (
                        leaderboard.map((entry, idx) => (
                            <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${idx === 0 ? 'bg-yellow-500/20 border-yellow-500/50' : 'bg-black/20 border-white/5'}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`font-mono font-bold w-6 text-center ${idx === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                                        #{idx + 1}
                                    </span>
                                    <span className="font-bold text-white tracking-widest">{entry.username}</span>
                                </div>
                                <span className="font-mono text-green-400 font-bold">{entry.score}</span>
                            </div>
                        ))
                    )}
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/10 text-center">
                    <p className="text-xs text-white/40">Only your best score is recorded.</p>
                </div>
            </div>

        </div>
      </div>
    </section>
  );
};

export default OraclePlinko;