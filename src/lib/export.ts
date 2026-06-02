import { Project } from "@/types/project";

export const generateReactCode = (project: Project) => {
  const jsonStr = JSON.stringify(project.hotspots, null, 2);
  
  return `import React from 'react';

// Save this data in a separate file or keep it here
const hotspots = ${jsonStr};

export default function LinkBioPage() {
  return (
    <div className="relative w-full max-w-[480px] mx-auto min-h-screen bg-black">
      {/* 
        Coloque sua imagem na pasta /public
        Exemplo: /public/${project.slug}-bg.png 
      */}
      <img 
        src="/${project.slug}-bg.png" 
        alt="Link Bio" 
        className="w-full h-auto block" 
      />
      
      {hotspots.map((hotspot) => (
        hotspot.active && (
          <a
            key={hotspot.id}
            href={hotspot.url || '#'}
            target={hotspot.targetBlank ? "_blank" : "_self"}
            rel={hotspot.targetBlank ? "noopener noreferrer" : undefined}
            className="absolute block"
            style={{
              left: \`\${hotspot.x}%\`,
              top: \`\${hotspot.y}%\`,
              width: \`\${hotspot.width}%\`,
              height: \`\${hotspot.height}%\`
            }}
            aria-label={hotspot.label || hotspot.name}
          />
        )
      ))}
    </div>
  );
}
`;
};

export const generateHtmlCode = (project: Project) => {
  const hotspotsHtml = project.hotspots
    .filter(h => h.active)
    .map(h => {
      const target = h.targetBlank ? ' target="_blank" rel="noopener noreferrer"' : '';
      return `      <a 
        href="${h.url || '#'}"${target}
        class="hotspot"
        style="left: ${h.x}%; top: ${h.y}%; width: ${h.width}%; height: ${h.height}%;"
        aria-label="${h.label || h.name}"
      ></a>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: #000;
      display: flex;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      position: relative;
      width: 100%;
      max-width: 480px;
      margin: 0 auto;
    }
    .background-img {
      display: block;
      width: 100%;
      height: auto;
    }
    .hotspot {
      position: absolute;
      display: block;
      /* Remova ou altere o background abaixo para ficar invisível */
      /* background-color: rgba(255, 255, 255, 0.2); */
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Substitua o src pela sua imagem local -->
    <img src="assets/bg.png" alt="Link Bio" class="background-img" />
    
${hotspotsHtml}
  </div>
</body>
</html>`;
};
