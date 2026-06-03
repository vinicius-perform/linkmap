import { Project } from "@/types/project";

export const generateReactCode = (project: Project) => {
  const jsonStr = JSON.stringify(project.hotspots, null, 2);
  
  return `import React from 'react';

// Save this data in a separate file or keep it here
const hotspots = ${jsonStr};

export default function LinkBioPage() {
  return (
    <div className="min-h-screen w-full bg-black flex justify-center items-start overflow-y-auto">
      {/* 
        Contêiner relativo que acompanha o tamanho exato da imagem.
        Garante que as áreas clicáveis nunca mudem de posição.
      */}
      <div className="relative w-full max-w-[480px]">
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
              className="absolute block hover:bg-white/5 transition-colors"
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
      align-items: flex-start;
      min-height: 100vh;
      overflow-y: auto;
    }
    /* 
      Contêiner relativo que acompanha o tamanho exato da imagem.
      Garante que as áreas clicáveis nunca mudem de posição.
    */
    .container {
      position: relative;
      width: 100%;
      max-width: 480px;
    }
    .background-img {
      display: block;
      width: 100%;
      height: auto;
    }
    .hotspot {
      position: absolute;
      display: block;
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
