"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Plus, Copy, Trash2, Edit, Image as ImageIcon } from "lucide-react";
import { getProjects, saveProject, deleteProject } from "@/lib/storage";
import { Project } from "@/types/project";

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-[#161618] rounded-xl border border-white/10 overflow-hidden flex flex-col transition-transform hover:-translate-y-1"
            >
              <div 
                className="h-48 bg-cover bg-center bg-no-repeat border-b border-white/10"
                style={{ backgroundImage: `url(${project.imageBase64})` }}
              />
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{project.name}</h3>
                  <p className="text-sm text-gray-500 mb-4">/{project.slug}</p>
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
