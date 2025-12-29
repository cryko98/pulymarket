
import React, { useState, useEffect, useRef } from 'react';
import { Trophy, Play, RefreshCw, AlertTriangle, Heart } from 'lucide-react';
import { getLeaderboard, submitScore, LeaderboardEntry } from '../services/leaderboardService';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 500;
const GRAVITY = 0.25;
const FRICTION = 0.98;
const BOUNCE_DAMPING = 0.6;
const PEG_RADIUS = 5;
const BALL_RADIUS = 7;
const BUCKET_COUNT = 5;
const BUCKET_SCORES = [50, 200, 1000, 200, 50];

const OraclePlinko: React.FC = () => {
  const [gameState, setGameState] = useState<'intro' | 'betting' | 'playing' | 'round_end' | 'gameover'>('intro');
  const [username, setUsername] = useState('');
  const [score, setScore] = useState(0); 
  const [lives, setLives] = useState(3);
  const [lastRoundPoints, setLastRoundPoints] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [winningBucket, setWinningBucket] = useState<number | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const ballRef = useRef({ x: 0, y: 0, vx: 0, vy: 0, active: false });
  const pegsRef = useRef<{x: number, y: number}[]>([]);
  const selectedBucketRef = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const usernameRef = useRef('');

  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { livesRef.current = lives; }, [lives]);
  useEffect(() => { usernameRef.current = username; }, [username]);

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
        newPegs.push({ x: spacingX * (c + 1) + (Math.random() * 2 - 1), y: startY + r * spacingY });
      }
    }
    pegsRef.current = newPegs;
  };

  const update = () => {
    if (!ballRef.current.active) return;
    const ball = ballRef.current;
    ball.vy += GRAVITY;
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;
    ball.x += ball.vx;
    ball.y += ball.vy;

    if (ball.x < BALL_RADIUS) { ball.x = BALL_RADIUS; ball.vx *= -0.7; }
    if (ball.x > CANVAS_WIDTH - BALL_RADIUS) { ball.x = CANVAS_WIDTH - BALL_RADIUS; ball.vx *= -0.7; }

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
            ball.vx += (Math.random() - 0.5) * 2; 
        }
    }

    if (ball.y > CANVAS_HEIGHT - 20) {
        ball.active = false;
        const bucketWidth = CANVAS_WIDTH / BUCKET_COUNT;
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
    const bucketWidth = CANVAS_WIDTH / BUCKET_COUNT;
    for (let i = 0; i < BUCKET_COUNT; i++) {
        const isSelected = i === selectedBucketRef.current;
        const isWinning = i === winningBucket && (gameState === 'round_end' || gameState === 'gameover');
        if (isWinning) ctx.fillStyle = 'rgba(34, 197, 94, 0.6)';
        else if (isSelected) ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
        else ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(i * bucketWidth + 2, CANVAS_HEIGHT - 60, bucketWidth - 4, 60);
        ctx.fillStyle = isSelected ? '#4ade80' : '#fff';
        ctx.font = 'bold 14px "Space Grotesk"';
        ctx.textAlign = 'center';
        ctx.fillText(`${BUCKET_SCORES[i]}`, i * bucketWidth + bucketWidth / 2, CANVAS_HEIGHT - 35);
    }
    ctx.fillStyle = '#4ade80';
    for (const peg of pegsRef.current) {
        ctx.beginPath();
        ctx.arc(peg.x, peg.y, PEG_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }
    if (ballRef.current.active || gameState === 'playing') {
        const ball = ballRef.current;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
        ctx.fill();
    }
  };

  const handleStartGame = () => {
    if (username.length !== 3) return;
    setScore(0);
    setLives(3);
    setWinningBucket(null);
    selectedBucketRef.current = null;
    setGameState('betting');
  };

  const handleDrop = (bucketIndex: number) => {
    if (lives <= 0) return;
    selectedBucketRef.current = bucketIndex;
    setWinningBucket(null);
    setGameState('playing');
    ballRef.current = { x: CANVAS_WIDTH / 2 + (Math.random() * 40 - 20), y: 20, vx: (Math.random() * 4 - 2), vy: 0, active: true };
    requestRef.current = requestAnimationFrame(update);
  };

  const handleRoundEnd = (resultBucket: number) => {
    setWinningBucket(resultBucket);
    const prediction = selectedBucketRef.current; 
    const currentScore = scoreRef.current;
    const currentLives = livesRef.current;
    const currentUser = usernameRef.current;
    const pointsWon = resultBucket === prediction ? BUCKET_SCORES[resultBucket] : 0;
    if (pointsWon > 0) setScore(prev => prev + pointsWon);
    setLastRoundPoints(pointsWon);
    const newLives = currentLives - 1;
    setLives(newLives);
    if (newLives > 0) setGameState('round_end');
    else {
        setGameState('gameover');
        submitScore(currentUser.toUpperCase(), currentScore + pointsWon).then(() => fetchLeaderboard());
    }
  };

  return (
    <section className="py-20 relative border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 text-outline flex justify-center items-center gap-2 uppercase italic tracking-tight">
                <Trophy className="text-yellow-400" size={40} />
                Market Oracle Game
            </h2>
            <p className="text-white/80 max-w-2xl mx-auto text-lg">
                Predict the bucket. Verify your accuracy on the $Polymarket leaderboard.
            </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start justify-center max-w-6xl mx-auto">
            <div className="flex-1 w-full max-w-[450px] mx-auto bg-gray-900 rounded-3xl p-4 border-2 border-blue-500/30 shadow-[0_0_50px_rgba(37,99,235,0.1)] relative">
                <div className="flex justify-between items-center mb-4 px-2">
                    <div className="flex gap-1">{[...Array(3)].map((_, i) => <Heart key={i} size={24} className={`${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-700'}`} />)}</div>
                    <div className="bg-black/80 px-4 py-2 rounded-full border border-white/20">
                        <span className="text-white font-mono font-bold text-sm uppercase">Score: </span>
                        <span className="text-blue-400 font-mono font-bold text-xl">{score}</span>
                    </div>
                </div>

                <div className="bg-black rounded-2xl overflow-hidden relative shadow-inner">
                    <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="w-full h-auto block" />
                    {gameState === 'intro' && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-30">
                            <h3 className="text-2xl font-bold text-white mb-4 uppercase">Initials</h3>
                            <input 
                                type="text" maxLength={3} placeholder="AAA"
                                className="bg-transparent border-b-2 border-blue-500 text-center text-4xl text-white font-mono font-black w-32 focus:outline-none mb-6 uppercase"
                                value={username} onChange={(e) => setUsername(e.target.value.toUpperCase())}
                            />
                            <button onClick={handleStartGame} disabled={username.length !== 3} className="bg-blue-500 text-black font-black py-3 px-8 rounded-full flex items-center gap-2">
                                <Play fill="currentColor" /> START
                            </button>
                        </div>
                    )}
                    {gameState === 'betting' && (
                        <div className="absolute bottom-0 left-0 w-full h-[80px] flex z-20 cursor-pointer">
                            {Array.from({length: BUCKET_COUNT}).map((_, i) => <div key={i} onClick={() => handleDrop(i)} className="flex-1 hover:bg-white/10" />)}
                        </div>
                    )}
                    {gameState === 'round_end' && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-30 animate-in fade-in duration-300">
                            <div className="bg-gray-900 border border-white/20 p-6 rounded-2xl text-center">
                                <h3 className={`text-3xl font-black mb-2 ${lastRoundPoints > 0 ? 'text-green-400' : 'text-red-500'}`}>{lastRoundPoints > 0 ? 'HIT!' : 'MISSED'}</h3>
                                <button onClick={() => { setWinningBucket(null); setGameState('betting'); }} className="bg-white text-black font-bold py-2 px-6 rounded-full">Next Round</button>
                            </div>
                        </div>
                    )}
                    {gameState === 'gameover' && (
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
                            <h3 className="text-3xl font-black text-white mb-2 uppercase">Analysis Over</h3>
                            <p className="text-5xl font-mono text-blue-400 font-bold mb-6">{score}</p>
                            <button onClick={() => setGameState('intro')} className="bg-blue-500 text-black font-black py-3 px-8 rounded-full flex items-center gap-2">
                                <RefreshCw size={20} /> RETRY
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="w-full lg:w-[350px] bg-white/5 border border-white/10 rounded-3xl p-6 h-fit">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6 uppercase">
                    <Trophy className="text-yellow-500" size={20} />
                    Top Analysts
                </h3>
                <div className="space-y-2">
                    {leaderboard.map((entry, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-3 rounded-xl border ${idx === 0 ? 'bg-blue-500/20 border-blue-500/50' : 'bg-black/20 border-white/5'}`}>
                            <span className="font-bold text-white tracking-widest">{entry.username}</span>
                            <span className="font-mono text-blue-400 font-bold">{entry.score}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default OraclePlinko;
