export const TRUSTED_COMPANIES = [
  'Master Agroindustrial',
  'Sulfibra Group',
  'Randon Embalagens',
  'Manos Implementos',
  'Congelados Pinheiro Preto',
  'Vinícola Zago',
  'Vinhos Santa Augusta',
  'Superviza Supermercados',
  'Videmotores',
  'Líder Farma',
  'Caprima',
  'Preluz',
  'CPEL Indústria de Papel',
  'Videfrigo',
  'Avícola Ninhada',
  'Sintravir',
] as const;

export const STATS = [
  { target: 200, suffix: '+', label: 'Credenciados na rede' },
  { target: 5000, suffix: '+', label: 'Vidas cobertas' },
  { target: 70, suffix: '%', label: 'Economia média' },
  { target: 48, suffix: 'h', label: 'Da contratação à ativação' },
] as const;

export const JOURNEY_STEPS = [
  {
    title: 'Conversa rápida',
    description: 'Entendemos o tamanho da equipe e o que sua empresa precisa em 15 minutos.',
    iconKey: 'message',
  },
  {
    title: 'Contrato simples',
    description: 'Proposta personalizada e contrato assinado digitalmente. Sem letrinhas miúdas.',
    iconKey: 'document',
  },
  {
    title: 'Cadastro da equipe',
    description: 'Importa a planilha do RH ou cadastra um a um. Carteirinhas saem automaticamente.',
    iconKey: 'team',
  },
  {
    title: 'Atendimento liberado',
    description: 'Em 48h o time já pode marcar consultas. Sem carência. Pra valer.',
    iconKey: 'heart',
  },
] as const;

export const TESTIMONIALS = [
  {
    initials: 'CM',
    name: 'Carla Mattos',
    role: 'Gerente de Pessoas, Indústria Modelar',
    quote:
      'Saímos do plano antigo e em 2 meses já tínhamos economizado mais que o investimento anual. O time ama o app — usam de verdade.',
    gradient: 'linear-gradient(135deg,#0d6b6b,#1c9b96)',
  },
  {
    initials: 'DR',
    name: 'Dr. Renato Pires',
    role: 'Diretor, Clínica Vivara',
    quote:
      'A validação por QR mudou nossa rotina. O atendimento é mais rápido, o paciente sai feliz e o repasse cai certinho. Sem dor de cabeça.',
    gradient: 'linear-gradient(135deg,#e85d1f,#ff8246)',
  },
  {
    initials: 'RA',
    name: 'Rafael Andrade',
    role: 'Colaborador, Logística Norte',
    quote:
      'Antes precisava ligar pra central e esperar. Hoje abro o app, vejo médico perto de casa e marco. Em 10 minutos. Mudou minha rotina.',
    gradient: 'linear-gradient(135deg,#08494a,#14807e)',
  },
] as const;

type Faq = { question: string; answer: string; open?: boolean };

export const FAQS: readonly Faq[] = [
  {
    question: 'A ACI Saúde é um plano de saúde?',
    answer:
      'Não. Somos um <strong>convênio de saúde corporativo</strong> que conecta empresas, colaboradores e clínicas em uma rede acessível. Por isso conseguimos oferecer valores até 70% menores que planos convencionais, sem carência e sem burocracia.',
    open: true,
  },
  {
    question: 'Tem carência? Quando minha equipe pode usar?',
    answer:
      'Não tem carência. Após a ativação (até 48h da assinatura), todos os colaboradores cadastrados já podem agendar consultas e exames imediatamente em qualquer credenciado da rede.',
  },
  {
    question: 'Qual o tamanho mínimo da empresa para contratar?',
    answer:
      'Atendemos a partir de <strong>5 colaboradores</strong>. Temos planos escalonáveis para empresas pequenas, médias e grandes — o valor por colaborador melhora conforme o volume.',
  },
  {
    question: 'A rede de credenciados cobre todo o Brasil?',
    answer:
      'Temos presença nacional crescente, com mais de 200 credenciados em diversas especialidades. Antes de fechar, mostramos exatamente quais clínicas e médicos estão na sua região.',
  },
  {
    question: 'Como o colaborador usa? Precisa instalar algo?',
    answer:
      'Sim — um app gratuito (iOS e Android) e portal web. Lá ele acessa a carteirinha digital, encontra médicos próximos, agenda consultas e vê o histórico de atendimentos.',
  },
  {
    question: 'Posso testar antes de contratar?',
    answer:
      'Sim! Oferecemos uma demonstração completa do sistema com um consultor, e em alguns casos um período piloto com parte da equipe.',
  },
];

export const NAV_LINKS = [
  { href: '#perfis', label: 'Plataforma' },
  { href: '#como', label: 'Como funciona' },
  { href: '#economia', label: 'Economia' },
  { href: '#depoimentos', label: 'Clientes' },
  { href: '#faq', label: 'FAQ' },
] as const;

export const FOOTER_GROUPS = [
  {
    title: 'Plataforma',
    links: [
      { label: 'Para empresas', href: '#perfis' },
      { label: 'Para colaboradores', href: '#perfis' },
      { label: 'Para credenciados', href: '#perfis' },
      { label: 'Acessar sistema', href: '#contato' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre nós', href: '#contato' },
      { label: 'Imprensa', href: '#contato' },
      { label: 'Trabalhe conosco', href: '#contato' },
      { label: 'Contato', href: '#contato' },
    ],
  },
  {
    title: 'Suporte',
    links: [
      { label: 'Central de ajuda', href: '#contato' },
      { label: 'FAQ', href: '#faq' },
      { label: 'WhatsApp', href: '#contato' },
      { label: 'Política de privacidade', href: '#contato' },
    ],
  },
] as const;
