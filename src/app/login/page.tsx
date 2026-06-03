"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Lock, 
  User, 
  LogIn, 
  AlertCircle, 
  CheckCircle2, 
  FolderHeart 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Background interactive states
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const [isHoveringCard, setIsHoveringCard] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    size: number;
    vx: number;
    vy: number;
    alpha: number;
  }>>([]);

  const router = useRouter();

  // Clear background particles instantly when entering the login card
  useEffect(() => {
    if (isHoveringCard) {
      particlesRef.current = [];
    }
  }, [isHoveringCard]);

  // Global mouse tracking and particle spawning outside card
  useEffect(() => {
    setIsClient(true);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      if (!isHoveringCard) {
        for (let i = 0; i < 2; i++) {
          particlesRef.current.push({
            x: e.clientX,
            y: e.clientY,
            size: Math.random() * 8 + 6,
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            alpha: 1.0,
          });
        }
      }
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, [isHoveringCard]);

  // Canvas particle trail animation effect loop
  useEffect(() => {
    if (!isClient) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let frameId: number;
    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(139, 92, 246, ${p.alpha * 0.7})`); // Violet matching dashboard
        gradient.addColorStop(0.3, `rgba(99, 102, 241, ${p.alpha * 0.4})`); // Indigo
        gradient.addColorStop(1, "rgba(99, 102, 241, 0)");

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      frameId = requestAnimationFrame(drawParticles);
    };

    frameId = requestAnimationFrame(drawParticles);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(frameId);
    };
  }, [isClient]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate 1s server-side call delay
    setTimeout(() => {
      if (username === "vinicius" && password === "admin@vinicius") {
        setIsSuccess(true);
        localStorage.setItem("linkmap_authenticated", "true");
        setTimeout(() => {
          router.push("/");
        }, 1200);
      } else {
        setError("Usuário ou senha incorretos.");
        setIsLoading(false);
      }
    }, 1000);
  };

  const bgX = isClient ? (mousePos.x - window.innerWidth / 2) * 0.02 : 0;
  const bgY = isClient ? (mousePos.y - window.innerHeight / 2) * 0.02 : 0;

  return (
    <div className="relative min-h-screen w-full bg-zinc-100 flex items-center justify-center p-4 overflow-hidden">
      
      {/* Dynamic Cursor Trail Particles Canvas */}
      {isClient && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-0"
        />
      )}

      {/* Interactive Floating Dot Layer */}
      <div 
        style={{
          transform: `translate3d(${bgX}px, ${bgY}px, 0)`,
          transition: "transform 0.1s ease-out",
        }}
        className="absolute inset-[-40px] bg-[radial-gradient(#d4d4d8_1.5px,transparent_1.5px)] [background-size:24px_24px] pointer-events-none opacity-85 z-0"
      />

      {/* Modern Mouse-following Ambient Glow spotlight */}
      {isClient && !isHoveringCard && (
        <div 
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.07), transparent 80%)`,
          }}
          className="absolute inset-0 pointer-events-none hidden md:block z-0"
        />
      )}

      {/* Simulated Browser Frame for Login Card */}
      <div 
        onMouseEnter={() => setIsHoveringCard(true)}
        onMouseLeave={() => setIsHoveringCard(false)}
        className="w-full max-w-md bg-zinc-950/95 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col relative z-10"
      >
        {/* Browser Topbar Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-white/5 select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] opacity-90 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] opacity-90 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-[#27c93f] opacity-90 inline-block"></span>
          </div>
          
          <div className="flex items-center gap-1 px-3 py-0.5 bg-zinc-950/60 border border-white/5 rounded text-[10px] text-zinc-400 font-mono w-40 justify-center">
            <span className="truncate">studio.linkmap.dev/login</span>
          </div>
          
          <div className="w-8"></div>
        </div>

        {/* Content Area */}
        <div className="p-8 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.06)_0%,transparent_50%)]">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <FolderHeart className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-zinc-100">Acessar LinkMap Studio</h2>
            <p className="text-zinc-500 text-xs mt-1.5">Área administrativa protegida</p>
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              /* Success Screen */
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6 space-y-4"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-200 text-sm">Autenticado com Sucesso</h3>
                  <p className="text-zinc-500 text-xs mt-1">Carregando painel de projetos...</p>
                </div>
              </motion.div>
            ) : (
              /* Login Form */
              <motion.form 
                key="form"
                onSubmit={handleSubmit} 
                className="space-y-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {/* Error Banner */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-start gap-2.5 text-xs text-rose-400"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {/* Username */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Usuário
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-4 h-4 text-zinc-600" />
                    </span>
                    <input
                      type="text"
                      required
                      disabled={isLoading}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg pl-9 pr-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                      placeholder="Nome do usuário"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Senha
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4 text-zinc-600" />
                    </span>
                    <input
                      type="password"
                      required
                      disabled={isLoading}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg pl-9 pr-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-3">
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_4px_15px_rgba(99,102,241,0.25)] border border-white/10 flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        Entrar no Studio
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

        </div>
      </div>

    </div>
  );
}
