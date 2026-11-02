import type { GameText } from "../gameText"

export const ptBR: GameText = {
  play: "Jogar",
  language: "Idioma",
  loading: "Carregando",
  gameView: "Visão do jogo",
  noGraphics:
    "Seu navegador não consegue rodar gráficos 3D. Tente uma versão recente do Chrome, Edge, Firefox ou Safari.",
  prompt: { lead: "PRESSIONE", trail: "" },
  zoom: "ZooM",
  reading: {
    close: "FECHAR",
    guideTitle: "Como escapar:",
    guideLines: [
      "Olhe com atenção. Não deixe passar nenhuma assombração.",
      "Se encontrar uma assombração, volte imediatamente.",
      "Se não encontrar nenhuma assombração, continue andando.",
      "Chegue à última porta para escapar.",
    ],
    hauntCount: {
      one: "Há 1 assombração que você ainda não encontrou.",
      other: "Há {count} assombrações que você ainda não encontrou.",
    },
  },
  settings: {
    title: "Configurações",
    quality: "Qualidade",
    qualities: { low: "Baixa", medium: "Média", max: "Máxima" },
    bloom: "Bloom",
    depthOfField: "Profundidade de campo",
    sensitivity: "Sensibilidade do mouse",
    invertX: "Inverter eixo X",
    invertY: "Inverter eixo Y",
    volume: "Volume",
    credits: "Créditos",
    close: "Fechar",
    back: "Voltar",
  },
  credits: {
    bylineLead: "Um jogo de",
    developer: "Desenvolvedor",
    closing: "Obrigado por jogar",
    playAgain: "Jogar de novo",
    headings: {
      music: "Música",
      models: "Modelos",
      materials: "Materiais",
      paintings: "Pinturas",
      animationAndSound: "Animação e som",
      typeAndCode: "Tipografia e código",
    },
    ghostAnimations: "Animações do fantasma",
    soundEffects: "Efeitos sonoros",
    freesoundContributors: "colaboradores do freesound.org",
    publicDomain: "Domínio público",
    freesoundLicenses: "Licenças do Freesound",
  },
}
