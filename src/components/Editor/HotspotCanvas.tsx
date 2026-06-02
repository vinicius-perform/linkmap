"use client";

import { useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import { v4 as uuidv4 } from "uuid";
import { useEditorStore } from "@/store/editorStore";
import clsx from "clsx";

export default function HotspotCanvas() {
  const {
    project,
    isTestMode,
    selectedHotspotId,
    setSelectedHotspotId,
    addHotspot,
    updateHotspot,
  } = useEditorStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Click on background to create a new hotspot (or deselect)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTestMode || !imageRef.current) return;
    
    // Check if clicked directly on the image container (not a child)
    if (e.target !== containerRef.current && e.target !== imageRef.current) {
      return; // Clicou em um hotspot, desconsidera
    }

    const rect = imageRef.current.getBoundingClientRect();
    
    // Calculate relative percentages
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const xPercent = (clickX / rect.width) * 100;
    const yPercent = (clickY / rect.height) * 100;

    // Default size for new hotspot: 40% width, 5% height
    const defaultWidth = 40;
    const defaultHeight = 8;
    
    // Adjust if click is too close to the edge
    const finalX = Math.min(xPercent, 100 - defaultWidth);
    const finalY = Math.min(yPercent, 100 - defaultHeight);

    const newHotspot = {
      id: uuidv4(),
      name: `Área ${project!.hotspots.length + 1}`,
      label: "",
      url: "",
      targetBlank: true,
      active: true,
      x: finalX,
      y: finalY,
      width: defaultWidth,
      height: defaultHeight,
    };

    addHotspot(newHotspot);
    setSelectedHotspotId(newHotspot.id);
  };

  if (!project) return null;

  return (
    <div
      className="w-full h-full flex items-center justify-center overflow-auto"
      onClick={() => setSelectedHotspotId(null)}
    >
      <div 
        ref={containerRef}
        className="relative shadow-2xl"
        onClick={handleCanvasClick}
        style={{
          // Set maximum width for the preview to look like mobile
          maxWidth: "480px", 
          width: "100%",
        }}
      >
        <img
          ref={imageRef}
          src={project.imageBase64}
          alt="Base do Link"
          className="w-full h-auto block select-none pointer-events-none"
          draggable={false}
        />

        {project.hotspots.map((hotspot) => {
          const isSelected = selectedHotspotId === hotspot.id;

          if (isTestMode) {
            return (
              <a
                key={hotspot.id}
                href={hotspot.url || "#"}
                target={hotspot.targetBlank ? "_blank" : "_self"}
                rel={hotspot.targetBlank ? "noopener noreferrer" : undefined}
                className={clsx(
                  "absolute block transition-opacity",
                  hotspot.active ? "cursor-pointer" : "pointer-events-none opacity-50"
                )}
                style={{
                  left: `${hotspot.x}%`,
                  top: `${hotspot.y}%`,
                  width: `${hotspot.width}%`,
                  height: `${hotspot.height}%`,
                }}
                title={hotspot.label || hotspot.name}
                onClick={(e) => {
                  if (!hotspot.url || !hotspot.active) e.preventDefault();
                }}
              />
            );
          }

          return (
            <Rnd
              key={hotspot.id}
              bounds="parent"
              position={{
                x: (hotspot.x * (imageRef.current?.width || 0)) / 100,
                y: (hotspot.y * (imageRef.current?.height || 0)) / 100,
              }}
              size={{
                width: `${hotspot.width}%`,
                height: `${hotspot.height}%`,
              }}
              onDragStop={(e, d) => {
                if (!imageRef.current) return;
                const newX = (d.x / imageRef.current.width) * 100;
                const newY = (d.y / imageRef.current.height) * 100;
                updateHotspot(hotspot.id, { x: newX, y: newY });
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                if (!imageRef.current) return;
                // convert px to %
                const newWidth = (parseFloat(ref.style.width) / imageRef.current.width) * 100;
                const newHeight = (parseFloat(ref.style.height) / imageRef.current.height) * 100;
                const newX = (position.x / imageRef.current.width) * 100;
                const newY = (position.y / imageRef.current.height) * 100;
                
                updateHotspot(hotspot.id, {
                  width: newWidth,
                  height: newHeight,
                  x: newX,
                  y: newY,
                });
              }}
              onClick={(e: any) => {
                e.stopPropagation();
                setSelectedHotspotId(hotspot.id);
              }}
              className={clsx(
                "absolute cursor-move transition-colors group",
                isSelected
                  ? "bg-[#D4AF37]/20 border-2 border-[#D4AF37] z-20"
                  : "bg-blue-500/20 border-2 border-blue-500/50 hover:bg-blue-500/30 z-10",
                !hotspot.active && "opacity-50 border-dashed"
              )}
            >
              {isSelected && (
                <div className="absolute -top-6 left-0 bg-[#D4AF37] text-black text-xs font-bold px-2 py-1 rounded shadow pointer-events-none whitespace-nowrap">
                  {hotspot.name}
                </div>
              )}
            </Rnd>
          );
        })}
      </div>
    </div>
  );
}
