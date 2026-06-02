import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { Code2, FileCode, CheckCircle2, AlertCircle } from "lucide-react";
import { generateReactCode, generateHtmlCode } from "@/lib/export";

export default function ExportPanel() {
  const { project, selectedHotspotId } = useEditorStore();
  const [copied, setCopied] = useState<"react" | "html" | null>(null);

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
                <span className="block text-xs text-gray-500 mb-1">X (Esquerda)</span>
                <span className="font-mono text-white">{selectedHotspot.x.toFixed(2)}%</span>
              </div>
              <div className="bg-black/40 border border-white/5 rounded p-2 text-center">
                <span className="block text-xs text-gray-500 mb-1">Y (Topo)</span>
                <span className="font-mono text-white">{selectedHotspot.y.toFixed(2)}%</span>
              </div>
              <div className="bg-black/40 border border-white/5 rounded p-2 text-center">
                <span className="block text-xs text-gray-500 mb-1">Largura</span>
                <span className="font-mono text-white">{selectedHotspot.width.toFixed(2)}%</span>
              </div>
              <div className="bg-black/40 border border-white/5 rounded p-2 text-center">
                <span className="block text-xs text-gray-500 mb-1">Altura</span>
                <span className="font-mono text-white">{selectedHotspot.height.toFixed(2)}%</span>
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
          </div>
        </section>

      </div>
    </div>
  );
}
