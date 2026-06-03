"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { 
  Plus, 
  Copy, 
  Trash2, 
  Edit, 
  Image as ImageIcon, 
  Search, 
  Globe, 
  Database, 
  AlertCircle, 
  CheckCircle2, 
  FolderHeart, 
  Clock, 
  ArrowRight,
  ExternalLink,
  Layers,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getProjects, saveProject, deleteProject } from "@/lib/storage";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Project } from "@/types/project";

// Custom Github Icon since some local packages might not export it
function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={props.className} style={props.style}>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // New Project Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState<string | null>(null);

  // Mouse position and interactive particle states for parallax background
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const [isHoveringDashboard, setIsHoveringDashboard] = useState(false);

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

  // Clear background particles instantly when entering the dashboard
  useEffect(() => {
    if (isHoveringDashboard) {
      particlesRef.current = [];
    }
  }, [isHoveringDashboard]);

  useEffect(() => {
    setIsClient(true);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      // Spawning glowing purple particles only when outside the dashboard panel
      if (!isHoveringDashboard) {
        for (let i = 0; i < 2; i++) {
          particlesRef.current.push({
            x: e.clientX,
            y: e.clientY,
            size: Math.random() * 8 + 6, // particle size matching premium glow
            vx: (Math.random() - 0.5) * 1.2,
            vy: (Math.random() - 0.5) * 1.2,
            alpha: 1.0,
          });
        }
      }
    };
    window.addEventListener("mousemove", handleGlobalMouseMove);
    return () => window.removeEventListener("mousemove", handleGlobalMouseMove);
  }, [isHoveringDashboard]);

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
        p.alpha -= 0.02; // slow fade out

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Draw soft glowing violet/indigo color matching project theme
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, `rgba(139, 92, 246, ${p.alpha * 0.7})`); // Violet color
        gradient.addColorStop(0.3, `rgba(99, 102, 241, ${p.alpha * 0.4})`); // Indigo color
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

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !image) return;

    const newProject: Project = {
      id: uuidv4(),
      name,
      slug,
      imageBase64: image,
      hotspots: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Optimistic UI updates
    setProjects((prev) => [newProject, ...prev]);
    setIsModalOpen(false);
    resetForm();

    try {
      await saveProject(newProject);
      router.push(`/editor/${newProject.id}`);
    } catch (err) {
      console.error("Erro ao salvar novo projeto:", err);
      loadProjects(); // Rollback local state if fails
    }
  };

  const handleDuplicate = async (project: Project) => {
    const duplicatedProject: Project = {
      ...project,
      id: uuidv4(),
      name: `${project.name} (Cópia)`,
      slug: `${project.slug}-copia`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      githubUrl: undefined,
      githubRepo: undefined,
      githubUpdatedAt: undefined,
      vercelUrl: undefined,
    };

    // Optimistic insert
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === project.id);
      if (idx === -1) return [duplicatedProject, ...prev];
      const next = [...prev];
      next.splice(idx + 1, 0, duplicatedProject);
      return next;
    });

    try {
      await saveProject(duplicatedProject);
    } catch (err) {
      console.error("Erro ao duplicar projeto:", err);
      loadProjects(); // Rollback
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este projeto?")) {
      // Optimistic delete
      const previousProjects = [...projects];
      setProjects((prev) => prev.filter((p) => p.id !== id));

      try {
        await deleteProject(id);
      } catch (err) {
        console.error("Erro ao excluir projeto:", err);
        setProjects(previousProjects); // Rollback
      }
    }
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setImage(null);
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fallback illustration image conforming to rule 5: strictly Unsplash image matching requirements
  const fallbackCoverImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80";

  // Dynamic offset calculation for background parallax movement
  const bgX = isClient ? (mousePos.x - window.innerWidth / 2) * 0.02 : 0;
  const bgY = isClient ? (mousePos.y - window.innerHeight / 2) * 0.02 : 0;

  return (
    // Simulated Browser Frame wrapper with responsive white animated dot-pattern background
    <div className="relative min-h-screen w-full bg-zinc-100 flex items-center justify-center p-3 sm:p-6 md:p-8 overflow-hidden">
      
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
      {isClient && !isHoveringDashboard && (
        <div 
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(99, 102, 241, 0.07), transparent 80%)`,
          }}
          className="absolute inset-0 pointer-events-none hidden md:block z-0"
        />
      )}

      {/* Browser Window Mock (Dark theme dashboard inside white dot bg) */}
      <div 
        onMouseEnter={() => setIsHoveringDashboard(true)}
        onMouseLeave={() => setIsHoveringDashboard(false)}
        className="w-full max-w-6xl bg-zinc-950/95 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.45)] overflow-hidden flex flex-col min-h-[85vh] relative z-10"
      >
        
        {/* Browser Topbar Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/50 border-b border-white/5 select-none shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] opacity-90 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] opacity-90 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-[#27c93f] opacity-90 inline-block"></span>
          </div>
          
          {/* Mock URL bar */}
          <div className="flex items-center gap-1.5 px-4 py-1 bg-zinc-950/60 border border-white/5 rounded-md text-[11px] text-zinc-400 font-mono w-64 sm:w-80 justify-center">
            <svg className="w-3 h-3 text-emerald-500/80 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="truncate">studio.linkmap.dev</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold hidden md:inline">Linkmap v2</span>
          </div>
        </div>

        {/* Dashboard Work Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.06)_0%,transparent_40%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.06)_0%,transparent_40%)]">
          
          {/* Bento Grid Header Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            
            {/* Bento Card 1: Main Stats & Call To Action (Spans 2 columns) */}
            <div className="lg:col-span-2 relative overflow-hidden bg-zinc-900/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 rounded-2xl flex flex-col justify-between group min-h-[220px]">
              {/* Background Glow Effect */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/15 transition-colors duration-300"></div>
              
              <div>
                <div className="flex items-center gap-2 text-indigo-400 font-medium text-xs tracking-wider uppercase mb-2">
                  <Sparkles className="w-3.5 h-3.5" /> LinkMap Studio
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight mb-2">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-zinc-100 via-zinc-200 to-zinc-400">
                    Projete Seus Mapas de Links
                  </span>
                </h1>
                <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
                  Crie dezenas de áreas interativas invisíveis sobre uma única imagem de forma otimizada para a Vercel e conectada com Supabase.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-400">
                      Projetos: <strong className="text-zinc-200 font-semibold">{projects.length}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-400">
                      Deployados: <strong className="text-zinc-200 font-semibold">{projects.filter(p => p.githubUrl).length}</strong>
                    </span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gradient-to-r from-indigo-600/90 to-violet-600/90 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all shadow-[0_4px_20px_rgba(99,102,241,0.2)] border border-white/10 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Criar novo projeto
                </motion.button>
              </div>
            </div>

            {/* Bento Card 2: Cloud Sync & System Integrations Status */}
            <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.12)] p-6 rounded-2xl flex flex-col justify-between min-h-[220px]">
              <div>
                <h2 className="text-sm font-semibold text-zinc-200 mb-4 flex items-center justify-between">
                  <span>Conexões na Nuvem</span>
                  <Database className="w-4 h-4 text-zinc-500" />
                </h2>
                
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-2 bg-zinc-950/40 border border-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        {isSupabaseConfigured ? (
                          <>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </>
                        ) : (
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                        )}
                      </span>
                      <span className="text-xs font-medium text-zinc-300">Supabase DB</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500">
                      {isSupabaseConfigured ? "Conectado" : "Local Only"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 bg-zinc-950/40 border border-white/5 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-medium text-zinc-300">Git Sync Engine</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-zinc-500">Pronto</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-zinc-500 italic mt-4 leading-relaxed border-t border-white/5 pt-3">
                {isSupabaseConfigured ? (
                  "Projetos e coordenadas de hotspots estão sendo persistidos de forma segura no Supabase."
                ) : (
                  "Nenhum banco configurado. Projetos persistidos localmente via armazenamento LocalForage."
                )}
              </div>
            </div>

          </div>

          {/* Bento Card 3: Toolbar Section */}
          <div className="bg-zinc-900/25 backdrop-blur-md border border-white/5 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            
            {/* Search Input wrapper */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-zinc-500" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrar projetos por nome ou slug..."
                className="w-full bg-zinc-950/60 border border-white/10 rounded-lg pl-10 pr-9 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Filter and sorting badges */}
            <div className="flex items-center gap-3 self-end md:self-auto">
              <span className="text-xs text-zinc-500">
                Mostrando {filteredProjects.length} de {projects.length} resultados
              </span>
            </div>
          </div>

          {/* Projects Display Logic */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 gap-3">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Carregando painel de projetos...</p>
            </div>
          ) : projects.length === 0 ? (
            /* Empty State */
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-zinc-900/20 rounded-2xl border border-white/5"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-900/60 flex items-center justify-center mx-auto mb-4 border border-white/5">
                <ImageIcon className="w-5 h-5 text-zinc-500" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-200 mb-1">Nenhum projeto registrado</h2>
              <p className="text-zinc-500 text-xs max-w-sm mx-auto mb-6">
                Você ainda não criou nenhum projeto. Adicione uma imagem base para começar a definir áreas clicáveis.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs transition-colors flex items-center gap-1 mx-auto"
              >
                + Criar meu primeiro projeto
              </button>
            </motion.div>
          ) : filteredProjects.length === 0 ? (
            /* Search Empty State */
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 bg-zinc-900/10 rounded-xl border border-white/5"
            >
              <p className="text-zinc-500 text-sm">Nenhum projeto encontrado com o termo "{searchQuery}".</p>
              <button 
                onClick={() => setSearchQuery("")}
                className="text-xs text-indigo-400 underline mt-2 hover:text-indigo-300"
              >
                Limpar busca
              </button>
            </motion.div>
          ) : (
            /* Projects Cards Grid */
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project) => (
                  <motion.div
                    layout
                    key={project.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ type: "spring", stiffness: 260, damping: 25 }}
                    whileHover={{ y: -5 }}
                    className="bg-zinc-900/30 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:border-indigo-500/30 transition-colors group relative"
                  >
                    {/* Thumbnail Image Section */}
                    <div 
                      className="h-44 bg-cover bg-center bg-no-repeat border-b border-white/5 relative bg-zinc-950/60"
                      style={{ backgroundImage: `url(${project.imageBase64 || fallbackCoverImage})` }}
                    >
                      {/* Dark overlay that fades on card hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent"></div>

                      {/* Status Badges Overlay */}
                      <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-1.5">
                        {project.githubUrl ? (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 bg-emerald-500/10 backdrop-blur-md border border-emerald-500/20 px-2 py-0.5 rounded-full text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/20 transition-all"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                            GitHub
                          </a>
                        ) : (
                          <span className="flex items-center gap-1 bg-zinc-950/75 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-medium text-zinc-400">
                            Local
                          </span>
                        )}

                        {project.vercelUrl && (
                          <a
                            href={project.vercelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-indigo-500/10 backdrop-blur-md border border-indigo-500/20 hover:bg-indigo-500/25 px-2 py-0.5 rounded-full text-[10px] font-medium text-indigo-300 transition-all flex items-center gap-0.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Vercel <ExternalLink className="w-2.5 h-2.5 text-indigo-400" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-zinc-100 text-base leading-snug truncate group-hover:text-white transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-zinc-500 text-xs font-mono mt-0.5">
                          /{project.slug}
                        </p>

                        <div className="space-y-1.5 mt-4">
                          {/* Info Lines */}
                          <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/5 pb-1">
                            <span className="text-zinc-500 flex items-center gap-1">
                              <FolderHeart className="w-3 h-3" /> Hotspots
                            </span>
                            <span className="font-medium text-zinc-300 bg-zinc-900 border border-white/5 px-1.5 py-0.2 rounded">
                              {project.hotspots?.length || 0} link(s)
                            </span>
                          </div>

                          {project.githubRepo && (
                            <div className="flex items-center justify-between text-[11px] text-zinc-400 border-b border-white/5 pb-1">
                              <span className="text-zinc-500 flex items-center gap-1">
                                <GithubIcon className="w-3 h-3" /> Repositório
                              </span>
                              <span className="font-medium text-zinc-300 truncate max-w-[150px]" title={project.githubRepo}>
                                {project.githubRepo.split('/').pop()}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-0.5">
                            <span className="text-zinc-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Atualizado
                            </span>
                            <span className="text-zinc-400 font-mono text-[10px]">
                              {new Date(project.updatedAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5 shrink-0">
                        <motion.button
                          whileTap={{ scale: 0.96 }}
                          onClick={() => router.push(`/editor/${project.id}`)}
                          className="flex-1 bg-white/5 hover:bg-white/10 text-white font-medium py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all border border-white/5"
                        >
                          <Edit className="w-3.5 h-3.5 text-zinc-400" />
                          Editar
                        </motion.button>
                        
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDuplicate(project)}
                          className="p-1.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-lg transition-colors border border-white/5"
                          title="Duplicar"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </motion.button>

                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDelete(project.id)}
                          className="p-1.5 bg-white/5 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded-lg transition-colors border border-white/5"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>

                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

        </div>
      </div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-zinc-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
            
            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-zinc-900/50 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-zinc-100 flex items-center gap-2">
                  <FolderHeart className="w-4 h-4 text-indigo-400" />
                  Criar Novo Projeto
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Passo único</span>
              </div>

              {/* Form fields */}
              <form onSubmit={createProject} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-lg px-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                    placeholder="Ex: Dra. Juliana Bio"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Slug do LinkMap
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-zinc-600 text-sm select-none">
                      /
                    </span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      className="w-full bg-zinc-950 border border-white/10 rounded-lg pl-6 pr-3.5 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50"
                      placeholder="dra-juliana"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">O slug será o endereço final público do link bio.</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wider">
                    Imagem Base
                  </label>
                  <div className="relative border border-dashed border-white/10 rounded-lg p-5 text-center bg-zinc-950 hover:bg-zinc-950/60 hover:border-indigo-500/35 transition-colors cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {image ? (
                      <div className="text-indigo-400 font-medium text-xs flex flex-col items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span>Upload concluído com sucesso!</span>
                        <span className="text-[10px] text-zinc-500 font-normal">Clique para substituir a imagem</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ImageIcon className="w-7 h-7 text-zinc-600 group-hover:text-zinc-500 transition-colors" />
                        <div className="text-zinc-400 text-xs">
                          Arraste ou clique para selecionar imagem
                        </div>
                        <span className="text-[9px] text-zinc-600">Recomendado: PNG ou JPG na proporção vertical</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={!name || !slug || !image}
                    className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_4px_15px_rgba(99,102,241,0.2)] border border-white/10"
                  >
                    Criar Projeto
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
