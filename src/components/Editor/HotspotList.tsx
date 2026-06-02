import { useEditorStore } from "@/store/editorStore";
import { Copy, Trash2, Maximize, Settings2 } from "lucide-react";
import clsx from "clsx";

export default function HotspotList() {
  const {
    project,
    selectedHotspotId,
    setSelectedHotspotId,
    updateHotspot,
    deleteHotspot,
    duplicateHotspot,
    centerHotspot,
  } = useEditorStore();

  if (!project) return null;

  const selectedHotspot = project.hotspots.find((h) => h.id === selectedHotspotId);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-bold text-white mb-1">Áreas Clicáveis</h2>
        <p className="text-xs text-gray-500">
          {project.hotspots.length} área(s) criadas
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {project.hotspots.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Clique na imagem para criar uma área clicável.
          </p>
        ) : (
          project.hotspots.map((hotspot) => (
            <div
              key={hotspot.id}
              onClick={() => setSelectedHotspotId(hotspot.id)}
              className={clsx(
                "p-3 rounded-lg border cursor-pointer transition-colors flex items-center justify-between",
                selectedHotspotId === hotspot.id
                  ? "bg-[#D4AF37]/10 border-[#D4AF37]"
                  : "bg-black/20 border-white/5 hover:border-white/20"
              )}
            >
              <div className="flex-1 truncate">
                <p className="text-sm font-medium text-white truncate">
                  {hotspot.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {hotspot.url || "Sem URL"}
                </p>
              </div>
              <div className="flex gap-1 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateHotspot(hotspot.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-white rounded"
                  title="Duplicar"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHotspot(hotspot.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                  title="Excluir"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedHotspot && (
        <div className="p-4 bg-black/40 border-t border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-[#D4AF37]" /> Editar Área
            </h3>
            <button
              onClick={() => centerHotspot(selectedHotspot.id)}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
              title="Centralizar na imagem"
            >
              <Maximize className="w-3 h-3" /> Centralizar
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Nome de identificação
              </label>
              <input
                type="text"
                value={selectedHotspot.name}
                onChange={(e) => updateHotspot(selectedHotspot.id, { name: e.target.value })}
                className="w-full bg-[#161618] border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Aria Label (Acessibilidade)
              </label>
              <input
                type="text"
                value={selectedHotspot.label}
                onChange={(e) => updateHotspot(selectedHotspot.id, { label: e.target.value })}
                placeholder="Ex: Botão WhatsApp"
                className="w-full bg-[#161618] border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                URL do Link
              </label>
              <input
                type="url"
                value={selectedHotspot.url}
                onChange={(e) => updateHotspot(selectedHotspot.id, { url: e.target.value })}
                placeholder="https://..."
                className="w-full bg-[#161618] border border-white/10 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="targetBlank"
                checked={selectedHotspot.targetBlank}
                onChange={(e) => updateHotspot(selectedHotspot.id, { targetBlank: e.target.checked })}
                className="accent-[#D4AF37]"
              />
              <label htmlFor="targetBlank" className="text-xs text-gray-300 cursor-pointer">
                Abrir em nova aba
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={selectedHotspot.active}
                onChange={(e) => updateHotspot(selectedHotspot.id, { active: e.target.checked })}
                className="accent-[#D4AF37]"
              />
              <label htmlFor="active" className="text-xs text-gray-300 cursor-pointer">
                Status Ativo
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
