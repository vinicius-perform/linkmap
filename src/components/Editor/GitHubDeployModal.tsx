import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGithubStore } from "@/store/githubStore";
import { useEditorStore } from "@/store/editorStore";
import { pushStaticHtmlToGithub } from "@/lib/github";
import { X, ExternalLink, Loader2, KeyRound } from "lucide-react";
import { Octokit } from "@octokit/rest";

function GithubIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

interface Props {
  onClose: () => void;
}

export default function GitHubDeployModal({ onClose }: Props) {
  const { token, setToken } = useGithubStore();
  const { project, updateProjectInfo } = useEditorStore();
  const router = useRouter();
  
  const [inputToken, setInputToken] = useState(token || "");
  const [repoName, setRepoName] = useState(project ? `linkbio-${project.slug}` : "meu-linkbio");
  const [isPrivate, setIsPrivate] = useState(false);
  const [vercelUrl, setVercelUrl] = useState(project?.vercelUrl || "");
  
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccessUrl, setDeploySuccessUrl] = useState<string | null>(null);
  const [error, setError] = useState<React.ReactNode | null>(null);

  const handleSaveToken = () => {
    setToken(inputToken.trim());
  };

  const handleDeploy = async () => {
    if (!token || !project) return;
    setIsDeploying(true);
    setError(null);
    setDeploySuccessUrl(null);
    
    try {
      const url = await pushStaticHtmlToGithub(token, project, repoName, isPrivate);
      setDeploySuccessUrl(url);
      updateProjectInfo({
        githubUrl: url,
        githubRepo: repoName,
        githubUpdatedAt: Date.now(),
        vercelUrl: vercelUrl.trim() || undefined,
      });
    } catch (err: any) {
      console.error(err);
      if (err.status === 401) {
        setError("Token inválido ou expirado. Verifique e tente novamente.");
      } else if (err.status === 403 || (err.message && err.message.toLowerCase().includes("resource not accessible"))) {
        setError(
          <div className="space-y-2 text-left">
            <p className="font-semibold text-red-400">Erro de permissão no Token (403):</p>
            <p className="text-xs text-red-300">
              O seu Personal Access Token não tem permissão para gravar neste repositório.
            </p>
            <div className="text-xs text-gray-400 space-y-1.5 bg-black/40 p-2.5 rounded border border-white/5 mt-1">
              <p className="font-medium text-gray-300">Como corrigir no GitHub:</p>
              <p>• <strong>Fine-grained PAT:</strong> Em <em>Repository Permissions</em>, altere <strong>Contents</strong> para <strong>Read and write</strong>. Em <em>Repository access</em>, selecione <strong>All repositories</strong>.</p>
              <p>• <strong>Classic PAT:</strong> Garanta que a permissão <strong>repo</strong> está marcada ao criar o token.</p>
            </div>
          </div>
        );
      } else {
        setError(err.message || "Erro desconhecido ao tentar fazer o deploy.");
      }
    } finally {
      setIsDeploying(false);
    }
  };

  const handleLinkOnly = async () => {
    if (!token || !project) return;
    setError(null);
    try {
      setIsDeploying(true);
      const octokit = new Octokit({ auth: token });
      const { data: user } = await octokit.rest.users.getAuthenticated();
      const owner = user.login;
      
      // Verify repository exists to prevent deploying to a non-existent repo
      try {
        await octokit.rest.repos.get({ owner, repo: repoName });
      } catch (err: any) {
        if (err.status === 404) {
          throw new Error(`O repositório "${repoName}" não foi encontrado na sua conta do GitHub. Certifique-se de criá-lo primeiro ou use o botão "Iniciar Deploy (HTML)" para que possamos criá-lo automaticamente.`);
        }
        throw err;
      }
      
      // Push static files to the existing repository
      const url = await pushStaticHtmlToGithub(token, project, repoName, isPrivate);
      
      updateProjectInfo({
        githubUrl: url,
        githubRepo: repoName,
        githubUpdatedAt: Date.now(),
        vercelUrl: vercelUrl.trim() || undefined,
      });
      setDeploySuccessUrl(url);
    } catch (err: any) {
      console.error(err);
      if (err.status === 401) {
        setError("Token inválido ou expirado. Verifique e tente novamente.");
      } else if (err.status === 403 || (err.message && err.message.toLowerCase().includes("resource not accessible"))) {
        setError(
          <div className="space-y-2 text-left">
            <p className="font-semibold text-red-400">Erro de permissão no Token (403):</p>
            <p className="text-xs text-red-300">
              O seu Personal Access Token não tem permissão para gravar neste repositório.
            </p>
            <div className="text-xs text-gray-400 space-y-1.5 bg-black/40 p-2.5 rounded border border-white/5 mt-1">
              <p className="font-medium text-gray-300">Como corrigir no GitHub:</p>
              <p>• <strong>Fine-grained PAT:</strong> Em <em>Repository Permissions</em>, altere <strong>Contents</strong> para <strong>Read and write</strong>. Em <em>Repository access</em>, selecione <strong>All repositories</strong>.</p>
              <p>• <strong>Classic PAT:</strong> Garanta que a permissão <strong>repo</strong> está marcada ao criar o token.</p>
            </div>
          </div>
        );
      } else {
        setError(err.message || "Erro ao atualizar repositório existente no GitHub.");
      }
    } finally {
      setIsDeploying(false);
    }
  };

  if (!project) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#161618] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-black/20">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GithubIcon className="w-5 h-5 text-white" />
            Deploy no GitHub
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {!token ? (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-400 mb-1 flex items-center gap-2">
                  <KeyRound className="w-4 h-4" /> Configurar Acesso
                </h3>
                <p className="text-xs text-blue-300">
                  Para exportar diretamente, você precisa informar um Personal Access Token (PAT) do GitHub com a permissão "repo". Ele ficará salvo apenas no seu navegador.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  GitHub Personal Access Token
                </label>
                <input
                  type="password"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                  placeholder="ghp_xxxxxxxxxxxxxxx"
                />
              </div>
              <button
                onClick={handleSaveToken}
                disabled={!inputToken}
                className="w-full bg-white hover:bg-gray-200 text-black font-bold py-2.5 rounded-lg disabled:opacity-50 transition-colors"
              >
                Salvar Token
              </button>
            </div>
          ) : (
            <>
              {deploySuccessUrl ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <GithubIcon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Deploy Concluído!</h3>
                  <p className="text-sm text-gray-400 mb-6">
                    Seu projeto foi enviado com sucesso para o GitHub em formato estático.
                  </p>
                  <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
                    <a
                      href={deploySuccessUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#b0912e] text-black font-bold py-2.5 px-6 rounded-lg transition-colors w-full"
                    >
                      Abrir Repositório <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => router.push("/")}
                      className="w-full bg-white/5 hover:bg-white/10 text-gray-300 font-semibold py-2.5 rounded-lg text-sm border border-white/10 transition-colors"
                    >
                      Voltar ao Painel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-green-400 font-medium flex items-center gap-1">
                      <CheckCircleIcon /> Token Configurado
                    </span>
                    <button
                      onClick={() => setToken(null)}
                      className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                      Remover
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Nome do Repositório
                    </label>
                    <input
                      type="text"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                      placeholder="linkbio-meu-projeto"
                    />
                    <p className="text-xs text-gray-500 mt-1">Se não existir, criaremos um novo automaticamente.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      URL de Produção / Vercel <span className="text-gray-500 text-xs">(Opcional)</span>
                    </label>
                    <input
                      type="url"
                      value={vercelUrl}
                      onChange={(e) => setVercelUrl(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#D4AF37]"
                      placeholder="https://linkbiopremium.vercel.app"
                    />
                    <p className="text-xs text-gray-500 mt-1">Insira a URL de visualização da Vercel para acesso rápido no painel.</p>
                  </div>

                  <div className="flex items-center gap-3 bg-black/30 p-4 rounded-lg border border-white/5">
                    <input
                      type="checkbox"
                      id="isPrivate"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="w-4 h-4 accent-[#D4AF37]"
                    />
                    <label htmlFor="isPrivate" className="text-sm text-gray-300 cursor-pointer">
                      Criar como Repositório Privado
                    </label>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                      {error}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handleDeploy}
                      disabled={isDeploying || !repoName}
                      className="w-full bg-[#D4AF37] hover:bg-[#b0912e] text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                    >
                      {isDeploying ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Publicando...
                        </>
                      ) : (
                        <>
                          <GithubIcon className="w-5 h-5" /> Iniciar Deploy (HTML)
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleLinkOnly}
                      disabled={isDeploying || !repoName}
                      className="w-full bg-white/5 hover:bg-white/10 text-gray-300 font-semibold py-2.5 rounded-lg text-xs border border-white/10 transition-colors"
                      title="Vincule um repositório que você já publicou no GitHub a este projeto sem fazer o deploy novamente."
                    >
                      Vincular Repositório Existente
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}
