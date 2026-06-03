import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { Code2, FileCode, CheckCircle2, AlertCircle } from "lucide-react";
import { generateReactCode, generateHtmlCode } from "@/lib/export";
import GitHubDeployModal from "./GitHubDeployModal";

export default function ExportPanel() {
  const { project, selectedHotspotId, updateHotspot } = useEditorStore();
  const [copied, setCopied] = useState<"react" | "html" | null>(null);
  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);

  if (!project) return null;

  const selectedHotspot = project.hotspots.find(h => h.id === selectedHotspotId);

  const handleCopy = (type: "react" | "html") => {
    const code = type === "react" ? generateReactCode(project) : generateHtmlCode(project);
    navigator.clipboard.writeText(code);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const getValidationErrors = () => {
    const errors = [];
    if (!project.imageBase64) errors.push("Imagem base não definida.");
    
    const activeHotspots = project.hotspots.filter(h => h.active);
    if (activeHotspots.length === 0) {
      errors.push("Nenhuma área clicável ativa.");
    }
    
    const missingUrls = activeHotspots.filter(h => !h.url);
    if (missingUrls.length > 0) {
      errors.push(`${missingUrls.length} área(s) ativa(s) sem URL.`);
    }

    return errors;
  };

  const errors = getValidationErrors();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white mb-1">Detalhes e Exportação</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Validation Section */}
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Status do Projeto
          </h3>
          {errors.length > 0 ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-400 mb-2 font-medium text-sm">
                <AlertCircle className="w-4 h-4" /> 
                Avisos
              </div>
              <ul className="list-disc pl-5 text-xs text-red-300 space-y-1">
                {errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-2 text-green-400 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Pronto para exportar!
            </div>
          )}
        </section>

        {/* Selected Hotspot Coordinates */}
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Coordenadas (%)
          </h3>
          {selectedHotspot ? (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-black/40 border border-white/5 rounded p-2 text-center">
                <span className="block text-xs text-gray-500 mb-1">X (Esquerda) (%)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={(100 - selectedHotspot.width).toFixed(2)}
                  value={selectedHotspot.x}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      updateHotspot(selectedHotspot.id, { x: Math.max(0, Math.min(100 - selectedHotspot.width, val)) });
                    }
                  }}
                  className="w-full bg-[#161618] border border-white/10 rounded px-1.5 py-0.5 text-center text-white font-mono text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="bg-black/40 border border-white/5 rounded p-2 text-center">
                <span className="block text-xs text-gray-500 mb-1">Y (Topo) (%)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={(100 - selectedHotspot.height).toFixed(2)}
                  value={selectedHotspot.y}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      updateHotspot(selectedHotspot.id, { y: Math.max(0, Math.min(100 - selectedHotspot.height, val)) });
                    }
                  }}
                  className="w-full bg-[#161618] border border-white/10 rounded px-1.5 py-0.5 text-center text-white font-mono text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="bg-black/40 border border-white/5 rounded p-2 text-center">
                <span className="block text-xs text-gray-500 mb-1">Largura (%)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max={(100 - selectedHotspot.x).toFixed(2)}
                  value={selectedHotspot.width}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      updateHotspot(selectedHotspot.id, { width: Math.max(0.1, Math.min(100 - selectedHotspot.x, val)) });
                    }
                  }}
                  className="w-full bg-[#161618] border border-white/10 rounded px-1.5 py-0.5 text-center text-white font-mono text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="bg-black/40 border border-white/5 rounded p-2 text-center">
                <span className="block text-xs text-gray-500 mb-1">Altura (%)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max={(100 - selectedHotspot.y).toFixed(2)}
                  value={selectedHotspot.height}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) {
                      updateHotspot(selectedHotspot.id, { height: Math.max(0.1, Math.min(100 - selectedHotspot.y, val)) });
                    }
                  }}
                  className="w-full bg-[#161618] border border-white/10 rounded px-1.5 py-0.5 text-center text-white font-mono text-sm focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">
              Nenhuma área selecionada.
            </div>
          )}
        </section>

        {/* Export Buttons */}
        <section>
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Exportar Código
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => handleCopy("react")}
              className="w-full flex items-center justify-between p-3 bg-[#161618] border border-white/10 hover:border-[#D4AF37] rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Code2 className="w-5 h-5 text-[#D4AF37]" />
                <div className="text-left">
                  <p className="text-sm font-medium text-white group-hover:text-[#D4AF37] transition-colors">Copiar Next.js / React</p>
                  <p className="text-xs text-gray-500">Componente page.tsx</p>
                </div>
              </div>
              <span className="text-xs font-medium text-[#D4AF37]">
                {copied === "react" ? "Copiado!" : "Copiar"}
              </span>
            </button>

            <button
              onClick={() => handleCopy("html")}
              className="w-full flex items-center justify-between p-3 bg-[#161618] border border-white/10 hover:border-blue-400 rounded-lg transition-colors group"
            >
              <div className="flex items-center gap-3">
                <FileCode className="w-5 h-5 text-blue-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">Copiar HTML Estático</p>
                  <p className="text-xs text-gray-500">index.html puro</p>
                </div>
              </div>
              <span className="text-xs font-medium text-blue-400">
                {copied === "html" ? "Copiado!" : "Copiar"}
              </span>
            </button>

            <button
              onClick={() => setIsGithubModalOpen(true)}
              className="w-full flex items-center justify-between p-3 bg-white/5 border border-white/10 hover:bg-white hover:text-black rounded-lg transition-colors group mt-6"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <div className="text-left">
                  <p className="text-sm font-medium text-white group-hover:text-black transition-colors">Conectar ao GitHub</p>
                  <p className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors">Deploy direto via API</p>
                </div>
              </div>
            </button>
          </div>
        </section>

      </div>
      
      {isGithubModalOpen && (
        <GitHubDeployModal onClose={() => setIsGithubModalOpen(false)} />
      )}
    </div>
  );
}
