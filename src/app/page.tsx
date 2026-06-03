"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Plus, Copy, Trash2, Edit, Image as ImageIcon, Search, Globe } from "lucide-react";
import { getProjects, saveProject, deleteProject } from "@/lib/storage";
import { Project } from "@/types/project";

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

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // New Project Form
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setIsLoading(true);
    const data = await getProjects();
    setProjects(data);
    setIsLoading(false);
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

    await saveProject(newProject);
    setIsModalOpen(false);
    resetForm();
    router.push(`/editor/${newProject.id}`);
  };

  const handleDuplicate = async (project: Project) => {
    const newProject: Project = {
      ...project,
      id: uuidv4(),
      name: `${project.name} (Cópia)`,
      slug: `${project.slug}-copia`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveProject(newProject);
    loadProjects();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este projeto?")) {
      await deleteProject(id);
      loadProjects();
    }
  };

  const resetForm = () => {
    setName("");
    setSlug("");
    setImage(null);
  };

  return (
    <div className="min-h-screen p-8 max-w-6xl mx-auto w-full">
      <header className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">LinkMap Studio</h1>
          <p className="text-[#9CA3AF]">
            Crie áreas clicáveis invisíveis sobre imagens de link bio.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#D4AF37] hover:bg-[#b0912e] text-black font-semibold py-2 px-4 rounded-lg flex items-center transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Criar novo projeto
        </button>
      </header>

      {isLoading ? (
        <div className="text-center text-gray-500 py-12">Carregando projetos...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-[#161618] rounded-xl border border-white/10">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl text-gray-300 mb-2">Nenhum projeto encontrado</h2>
          <p className="text-gray-500 mb-6">Crie seu primeiro projeto para começar.</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-[#D4AF37] hover:text-[#b0912e] font-medium transition-colors"
          >
            + Criar agora
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar projeto por nome..."
              className="w-full bg-[#161618] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-500 hover:text-white transition-colors"
              >
                Limpar
              </button>
            )}
          </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 bg-[#161618] rounded-xl border border-white/10">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-600 animate-pulse" />
              <h3 className="text-lg text-gray-300 mb-1">Nenhum resultado encontrado</h3>
              <p className="text-gray-500 text-sm">Não encontramos nenhum projeto correspondente a "{searchQuery}".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div
                  key={project.id}
                  className="bg-[#161618] rounded-xl border border-white/10 overflow-hidden flex flex-col transition-transform hover:-translate-y-1 relative group"
                >
                  <div 
                    className="h-48 bg-cover bg-center bg-no-repeat border-b border-white/10 relative"
                    style={{ backgroundImage: `url(${project.imageBase64})` }}
                  >
                    {/* Status Badge overlay */}
                    <div className="absolute top-3 right-3">
                      {project.githubUrl ? (
                        <a
                          href={project.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-green-500/20 hover:bg-green-500/30 backdrop-blur-md border border-green-500/30 px-2.5 py-1 rounded-full text-[11px] font-semibold text-green-400 shadow-lg transition-colors cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          Online no GitHub
                        </a>
                      ) : (
                        <span className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full text-[11px] font-medium text-gray-400 shadow-lg">
                          <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                          Local
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1 leading-snug">{project.name}</h3>
                      <div className="flex flex-col gap-1.5 mt-1 mb-2">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>/{project.slug}</span>
                          {project.githubUrl && (
                            <a
                              href={project.githubUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-400 hover:text-[#D4AF37] flex items-center gap-1 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GithubIcon className="w-3.5 h-3.5" /> Repositório
                            </a>
                          )}
                        </div>
                        {project.vercelUrl && (
                          <div className="flex items-center justify-between border-t border-white/5 pt-1.5 mt-0.5">
                            <span className="text-[11px] text-gray-500">Vercel</span>
                            <a
                              href={project.vercelUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 transition-colors font-medium truncate max-w-[180px]"
                              onClick={(e) => e.stopPropagation()}
                              title={project.vercelUrl}
                            >
                              <Globe className="w-3.5 h-3.5 text-gray-400 shrink-0" /> {project.vercelUrl.replace(/^https?:\/\/(www\.)?/, '')}
                            </a>
                          </div>
                        )}
                      </div>
                      {project.githubUpdatedAt && (
                        <p className="text-[10px] text-gray-500/80 italic">
                          Último deploy: {new Date(project.githubUpdatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => router.push(`/editor/${project.id}`)}
                        className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2 rounded-lg text-sm flex items-center justify-center transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-2" /> Abrir
                      </button>
                      <button
                        onClick={() => handleDuplicate(project)}
                        className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project.id)}
                        className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#161618] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6">Novo Projeto</h2>
            <form onSubmit={createProject}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nome do Projeto
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                    placeholder="Ex: Dra. Paola LinkBio"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Slug do Projeto
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                    placeholder="ex: dra-paola"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Imagem Base
                  </label>
                  <div className="relative border-2 border-dashed border-white/20 rounded-lg p-6 text-center hover:border-[#D4AF37]/50 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {image ? (
                      <div className="text-[#D4AF37] font-medium text-sm">Imagem selecionada com sucesso!</div>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        Arraste ou clique para fazer upload
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!name || !slug || !image}
                  className="bg-[#D4AF37] hover:bg-[#b0912e] text-black font-semibold px-6 py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Criar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
