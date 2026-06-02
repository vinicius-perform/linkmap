"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, LayoutGrid } from "lucide-react";
import { getProject, saveProject } from "@/lib/storage";
import { useEditorStore } from "@/store/editorStore";
import HotspotList from "@/components/Editor/HotspotList";
import HotspotCanvas from "@/components/Editor/HotspotCanvas";
import ExportPanel from "@/components/Editor/ExportPanel";
import clsx from "clsx";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const { project, setProject, isTestMode, setTestMode } = useEditorStore();

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    // Auto-save logic (debounced would be better in prod, but keeping simple here)
    if (project) {
      saveProject(project).catch(console.error);
    }
  }, [project]);

  const loadProject = async () => {
    if (typeof params.id !== "string") return;
    setIsLoading(true);
    const data = await getProject(params.id);
    if (!data) {
      router.push("/");
      return;
    }
    setProject(data);
    setIsLoading(false);
  };

  if (isLoading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0B0D]">
        <p className="text-[#D4AF37] animate-pulse">Carregando editor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0B0D]">
      {/* Top Navbar */}
      <header className="h-14 border-b border-white/10 bg-[#161618] flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setProject(null); // clear store
              router.push("/");
            }}
            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-white text-sm">{project.name}</h1>
            <p className="text-xs text-gray-500">/{project.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTestMode(!isTestMode)}
            className={clsx(
              "px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors",
              isTestMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
            )}
          >
            {isTestMode ? <LayoutGrid className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isTestMode ? "Modo Edição" : "Testar Cliques"}
          </button>
        </div>
      </header>

      {/* Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-80 border-r border-white/10 bg-[#161618] overflow-y-auto flex flex-col">
          <HotspotList />
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 relative bg-black/40 overflow-hidden flex items-center justify-center p-4">
          <HotspotCanvas />
        </main>

        {/* Right Sidebar (Export & Details) */}
        <aside className="w-80 border-l border-white/10 bg-[#161618] overflow-y-auto">
          <ExportPanel />
        </aside>
      </div>
    </div>
  );
}
