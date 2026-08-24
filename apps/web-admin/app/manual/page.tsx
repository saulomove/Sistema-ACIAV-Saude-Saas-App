'use client';

/**
 * Manual de Utilização do Sistema ACIAV Saúde.
 * Rota protegida pelo middleware (exige login; acessível a admin).
 * Layout self-contained e otimizado para impressão/PDF (botão "no-print").
 */

const PRINT_CSS = `
  @page { margin: 14mm 14mm; }
  .manual-root { --tealD:#08494a; --teal:#007178; --teal2:#14807e; --orange:#e85d1f;
    --ink:#0c1e2a; --ink2:#2b3b48; --muted:#6a7a86; --line:#e7ecef; --warm:#f7f5f1; --teal50:#e6f3f2; }
  /* Forca a impressao de cores/fundos/gradientes (senao o navegador os remove do PDF). */
  .manual-root, .manual-root * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .manual-root :is(h1,h2,h3,h4){ font-family: var(--font-jakarta), system-ui, sans-serif; }
  @media print {
    html, body { background:#fff !important; }
    .no-print { display:none !important; }
    .manual-sheet { box-shadow:none !important; margin:0 !important; border-radius:0 !important; max-width:none !important; width:100% !important; }
    .manual-bg { background:#fff !important; padding:0 !important; }
    .page-break { break-before: page; }
    section, .avoid-break { break-inside: avoid; }
    a { color: inherit !important; text-decoration: none !important; }
  }
`;

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="avoid-break rounded-xl border border-[var(--line)] bg-white p-4">
      <h4 className="m-0 text-[15px] font-semibold text-[var(--ink)]">{title}</h4>
      <p className="mt-1.5 mb-0 text-[13.5px] leading-relaxed text-[var(--ink2)]">{children}</p>
    </div>
  );
}

function LoginCallout({ children }: { children: React.ReactNode }) {
  return (
    <div className="avoid-break my-4 flex gap-3 rounded-xl border-l-4 border-[var(--orange)] bg-[var(--warm)] p-4">
      <span className="mt-0.5 text-lg" aria-hidden>🔑</span>
      <p className="m-0 text-[13.5px] leading-relaxed text-[var(--ink2)]">{children}</p>
    </div>
  );
}

function ProfileHeader({ n, title, tag }: { n: string; title: string; tag: string }) {
  return (
    <div
      className="avoid-break mb-4 flex items-center gap-4 rounded-2xl px-6 py-5 text-white"
      style={{ background: 'linear-gradient(135deg,#08494a,#14807e)' }}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 text-lg font-bold">{n}</span>
      <div>
        <h2 className="m-0 text-[22px] font-bold leading-tight text-white">{title}</h2>
        <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/70">{tag}</span>
      </div>
    </div>
  );
}

export default function ManualPage() {
  return (
    <div className="manual-root">
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      <div className="manual-bg min-h-screen bg-[var(--warm)] px-4 py-8 text-[var(--ink)]">
        {/* Barra de ações (some na impressão) */}
        <div className="no-print mx-auto mb-5 flex max-w-[900px] items-center justify-between gap-3">
          <span className="text-[13px] text-[var(--muted)]">
            Documento interno — use <b>Imprimir → Salvar como PDF</b> para gerar o arquivo.
          </span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--teal)] px-5 py-2.5 text-[14px] font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
          >
            🖨️ Imprimir / Salvar como PDF
          </button>
        </div>

        <article className="manual-sheet mx-auto max-w-[900px] overflow-hidden rounded-2xl bg-white shadow-xl">

          {/* ===== CAPA ===== */}
          <header
            className="relative overflow-hidden px-10 py-14 text-white"
            style={{ background: 'linear-gradient(135deg,#08494a,#007178,#14807e)' }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,.6) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.6) 1px,transparent 1px)',
                backgroundSize: '46px 46px',
                maskImage: 'radial-gradient(ellipse 80% 70% at 50% 20%, black 20%, transparent 75%)',
                WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 20%, black 20%, transparent 75%)',
              }}
            />
            <div className="relative">
              <span className="inline-flex items-center rounded-lg bg-white px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-aciav-saude.png" alt="ACIAV Saúde" className="h-8 w-auto object-contain" />
              </span>
              <p className="mt-8 text-[12px] font-semibold uppercase tracking-[0.22em] text-white/70">
                Manual de utilização
              </p>
              <h1 className="mt-2 mb-0 text-[42px] font-extrabold leading-[1.03] tracking-[-0.02em]">
                ACIAV Saúde
              </h1>
              <p className="mt-3 mb-0 max-w-[560px] text-[17px] leading-relaxed text-white/85">
                Plataforma de saúde corporativa — carteirinha digital, rede credenciada com descontos e gestão
                completa para associações, empresas e prestadores.
              </p>
              <div className="mt-9 flex flex-wrap gap-x-8 gap-y-2 border-t border-white/20 pt-5 text-[13px] text-white/75">
                <span>Documento interno · confidencial</span>
                <span>Web · iOS · Android</span>
                <span>Versão do manual: 1.0</span>
              </div>
            </div>
          </header>

          <div className="px-10 py-10">

            {/* ===== SUMÁRIO EXECUTIVO ===== */}
            <section className="avoid-break">
              <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                Sumário executivo
              </p>
              <h2 className="mt-2 mb-3 text-[24px] font-bold tracking-[-0.01em]">O que é o sistema</h2>
              <p className="m-0 text-[15px] leading-relaxed text-[var(--ink2)]">
                O <b>ACIAV Saúde</b> é um sistema de <b>convênio de saúde por rede credenciada com descontos</b> —
                não é plano de saúde nem seguro. Ele conecta, em uma única plataforma, quatro públicos: a{' '}
                <b>associação/administração</b> (que gerencia tudo), as <b>empresas</b> associadas (que cadastram
                seus colaboradores), os <b>prestadores credenciados</b> (clínicas, profissionais, laboratórios,
                farmácias) e os <b>beneficiários</b> (colaboradores e dependentes). Cada beneficiário tem uma{' '}
                <b>carteirinha digital</b> no celular, encontra a rede credenciada com os descontos de cada serviço,
                e acompanha quanto economizou.
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {[
                  ['4 portais', 'Administração, Empresa/RH, Credenciado e Beneficiário — um sistema, acessos separados por perfil.'],
                  ['App iOS + Android', 'O beneficiário leva a carteirinha e a rede no bolso, publicado nas duas lojas.'],
                  ['Multi-unidade', 'Arquitetura pronta para várias associações/municípios, com dados isolados por unidade.'],
                ].map(([t, d]) => (
                  <div key={t} className="avoid-break rounded-xl border border-[var(--line)] bg-[var(--teal50)] p-4">
                    <p className="m-0 text-[15px] font-bold text-[var(--tealD)]">{t}</p>
                    <p className="mt-1 mb-0 text-[12.5px] leading-snug text-[var(--ink2)]">{d}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ===== OS 4 ACESSOS (tabela resumo) ===== */}
            <section className="mt-11 avoid-break">
              <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                Visão geral
              </p>
              <h2 className="mt-2 mb-4 text-[24px] font-bold tracking-[-0.01em]">Os quatro tipos de acesso</h2>
              <div className="overflow-hidden rounded-xl border border-[var(--line)]">
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="bg-[var(--tealD)] text-white">
                      <th className="px-4 py-3 font-semibold">Perfil</th>
                      <th className="px-4 py-3 font-semibold">Login</th>
                      <th className="px-4 py-3 font-semibold">Onde acessa</th>
                      <th className="px-4 py-3 font-semibold">O que faz</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--ink2)]">
                    {[
                      ['Beneficiário', 'CPF + senha', 'App (iOS/Android) e web', 'Carteirinha, rede credenciada, histórico de economia, ouvidoria'],
                      ['Empresa / RH', 'E-mail + senha', 'Portal RH (web)', 'Cadastra colaboradores e dependentes, consulta a rede e relatórios'],
                      ['Credenciado', 'E-mail + senha', 'Portal do credenciado (web)', 'Consulta atendimentos e sua tabela de descontos, edita seu perfil'],
                      ['Administração ACIAV', 'E-mail + senha', 'Painel admin (web)', 'Gerencia tudo: unidades, empresas, credenciados, beneficiários, relatórios'],
                    ].map((r, i) => (
                      <tr key={r[0]} className={i % 2 ? 'bg-[var(--warm)]' : 'bg-white'}>
                        <td className="px-4 py-3 font-semibold text-[var(--ink)]">{r[0]}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{r[1]}</td>
                        <td className="px-4 py-3">{r[2]}</td>
                        <td className="px-4 py-3">{r[3]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[12.5px] text-[var(--muted)]">
                Cada perfil só enxerga o que lhe compete — o sistema separa os acessos automaticamente e impede que
                um perfil acesse áreas de outro.
              </p>
            </section>

            {/* ===== PERFIL 1: BENEFICIÁRIO ===== */}
            <section className="page-break mt-12">
              <ProfileHeader n="1" title="Beneficiário" tag="Colaborador e dependentes · App e web" />
              <LoginCallout>
                <b>Login com o CPF.</b> O beneficiário entra digitando o <b>CPF</b> e a senha. A{' '}
                <b>senha inicial é o próprio CPF</b>. No <b>primeiro acesso</b>, o app <b>obriga</b> a pessoa a
                confirmar seus dados (nome, e-mail, WhatsApp, nascimento) e a <b>criar uma nova senha</b> (mínimo 8
                caracteres com 1 número). Só depois disso a carteirinha é liberada.
              </LoginCallout>
              <div className="grid grid-cols-2 gap-3">
                <Feature title="Minha Carteirinha">
                  Carteirinha digital com nome, CPF, empresa vinculada, selo “ATIVA” e pontos acumulados, além da
                  economia total já obtida na rede. É o que se apresenta no credenciado.
                </Feature>
                <Feature title="Guia Médico (rede credenciada)">
                  Busca a rede por nome, cidade e tipo (clínica, profissional, laboratório, farmácia, academia…),
                  com o desconto de cada serviço e botões de contato (WhatsApp, telefone, mapa).
                </Feature>
                <Feature title="Meu Histórico de Uso">
                  Extrato dos atendimentos: data, credenciado, valor particular, valor pago e <b>quanto economizou</b>,
                  com o total acumulado.
                </Feature>
                <Feature title="Dependentes">
                  Lista os dependentes vinculados (nome, parentesco, situação). O cadastro é feito pelo RH da empresa
                  — a tela é apenas de consulta.
                </Feature>
                <Feature title="Ouvidoria">
                  Formulário (reclamação, sugestão, elogio ou dúvida) que <b>registra a manifestação no sistema</b> e
                  já <b>abre o WhatsApp</b> da unidade com a mensagem pronta para envio.
                </Feature>
                <Feature title="Resgatar Prêmios">
                  Mostra o saldo de pontos de fidelidade (1 ponto = R$ 1 economizado). O catálogo de prêmios está em
                  construção.
                </Feature>
                <Feature title="Configurações">
                  Edita dados pessoais, troca a senha, ajusta notificações e, na aba <b>Privacidade (LGPD)</b>,
                  permite <b>exportar os próprios dados</b> e <b>excluir a conta</b>.
                </Feature>
                <Feature title="Aplicativo mobile">
                  Disponível na App Store (iPhone) e Google Play (Android). Instala como app nativo, com carteirinha
                  sempre à mão.
                </Feature>
              </div>
            </section>

            {/* ===== PERFIL 2: EMPRESA / RH ===== */}
            <section className="page-break mt-12">
              <ProfileHeader n="2" title="Empresa / RH" tag="Gestão dos colaboradores da empresa" />
              <LoginCallout>
                <b>Login com e-mail.</b> O responsável de RH da empresa entra com <b>e-mail e senha</b> (definida
                pela administração da ACIAV). O acesso é restrito à <b>própria empresa</b> — o RH nunca vê dados de
                outra empresa ou unidade.
              </LoginCallout>
              <div className="grid grid-cols-2 gap-3">
                <Feature title="Painel da empresa">
                  Resumo com total de colaboradores, dependentes, vidas cobertas, atendimentos e economia gerada, com
                  filtro por período.
                </Feature>
                <Feature title="Colaboradores">
                  Cadastra colaboradores (nome + CPF), ativa/inativa e acompanha dependentes e atendimentos de cada um.
                </Feature>
                <Feature title="Dependentes">
                  Cadastra e gerencia os dependentes vinculados a cada colaborador (parentesco, nascimento, contato).
                </Feature>
                <Feature title="Rede credenciada">
                  Consulta a rede da unidade (por cidade e categoria) para orientar os colaboradores. Apenas leitura.
                </Feature>
                <Feature title="Relatórios">
                  Relatórios da empresa para acompanhamento do benefício.
                </Feature>
              </div>
              <div className="avoid-break mt-4 rounded-xl border border-[var(--line)] bg-[var(--teal50)] p-4 text-[13px] text-[var(--ink2)]">
                <b>Regra importante:</b> a <b>importação em massa</b> de funcionários (planilha) é feita{' '}
                <b>somente pela administração da ACIAV</b>. O RH cadastra colaboradores individualmente.
              </div>
            </section>

            {/* ===== PERFIL 3: CREDENCIADO ===== */}
            <section className="page-break mt-12">
              <ProfileHeader n="3" title="Credenciado / Prestador" tag="Clínicas, profissionais e estabelecimentos" />
              <LoginCallout>
                <b>Login com e-mail.</b> O credenciado entra com <b>e-mail e senha</b>. Ao ser cadastrado pela ACIAV,
                recebe uma senha temporária para o primeiro acesso. O portal é, em sua maior parte,{' '}
                <b>para consulta</b> — quem registra os atendimentos e edita a tabela de descontos é a administração.
              </LoginCallout>
              <div className="grid grid-cols-2 gap-3">
                <Feature title="Painel">
                  Indicadores do credenciado (total de atendimentos, serviços na tabela) e os últimos atendimentos
                  registrados. Botão de contato direto com a ACIAV.
                </Feature>
                <Feature title="Meus Serviços">
                  Visualiza a tabela de serviços e descontos oferecidos. Alterações são solicitadas à ACIAV (o
                  credenciado não edita preços diretamente).
                </Feature>
                <Feature title="Histórico">
                  Histórico completo dos próprios atendimentos, com filtro por período.
                </Feature>
                <Feature title="Configurações">
                  Único lugar onde o credenciado edita: dados de contato, registro profissional, especialidade,
                  endereço, horário de atendimento, foto e a própria senha.
                </Feature>
              </div>
            </section>

            {/* ===== PERFIL 4: ADMIN / ACIAV ===== */}
            <section className="page-break mt-12">
              <ProfileHeader n="4" title="Administração ACIAV" tag="Controle total da plataforma" />
              <LoginCallout>
                <b>Login com e-mail.</b> Há dois níveis: <b>Administrador da Unidade</b> (gerencia uma unidade
                específica) e <b>Super Administrador</b> (visão global de todas as unidades). O login é por{' '}
                <b>e-mail e senha</b>.
              </LoginCallout>
              <div className="grid grid-cols-2 gap-3">
                <Feature title="Dashboard">
                  Números da operação — beneficiários, empresas, credenciados, atendimentos e economia — por unidade
                  ou consolidado (super admin).
                </Feature>
                <Feature title="Beneficiários">
                  Cadastra, edita, ativa/inativa beneficiários, faz reset de senha (volta ao CPF) e importa em massa
                  por planilha.
                </Feature>
                <Feature title="Empresas">
                  Cadastro completo das empresas associadas (CNPJ, contato, forma de pagamento de dependentes, tipo de
                  carteirinha) e reset do acesso do RH.
                </Feature>
                <Feature title="Credenciados">
                  Cadastro completo da rede: dados, foto, categoria e a <b>tabela de serviços e descontos</b> (é aqui
                  que os descontos são definidos).
                </Feature>
                <Feature title="Relatórios">
                  Exportações em Excel e PDF: beneficiários, empresas, credenciados, transações, catálogo de serviços e
                  rede credenciada.
                </Feature>
                <Feature title="Auditoria">
                  Registro de todas as ações sensíveis (quem fez o quê, quando), com filtros — rastreabilidade
                  completa.
                </Feature>
                <Feature title="CAGED">
                  Painel para acompanhar os indicadores de emprego formal do município (saldo, admissões,
                  desligamentos, estoque) por competência.
                </Feature>
                <Feature title="Ouvidoria">
                  Lista as manifestações dos beneficiários e permite marcar como resolvidas.
                </Feature>
                <Feature title="Unidades e Usuários Admin">
                  (Super admin) Cria e gerencia unidades (associações/municípios) e os administradores de cada uma.
                </Feature>
                <Feature title="Configurações">
                  Identidade visual da unidade (logo e cores), políticas de senha e segurança, backup do banco e
                  exportações completas.
                </Feature>
              </div>
            </section>

            {/* ===== CONCEITOS-CHAVE ===== */}
            <section className="page-break mt-12">
              <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                Como funciona por dentro
              </p>
              <h2 className="mt-2 mb-4 text-[24px] font-bold tracking-[-0.01em]">Conceitos-chave</h2>

              <div className="space-y-3">
                <div className="avoid-break rounded-xl border border-[var(--line)] bg-white p-5">
                  <h4 className="m-0 text-[16px] font-semibold text-[var(--tealD)]">Rede credenciada</h4>
                  <p className="mt-1.5 mb-0 text-[13.5px] leading-relaxed text-[var(--ink2)]">
                    Reúne profissionais e estabelecimentos que oferecem desconto aos beneficiários. O sistema
                    classifica automaticamente cada credenciado em tipos (profissional, clínica, hospital,
                    laboratório, farmácia, academia, ótica/loja, bem-estar), o que facilita a busca no guia médico.
                  </p>
                </div>

                <div className="avoid-break rounded-xl border border-[var(--line)] bg-white p-5">
                  <h4 className="m-0 text-[16px] font-semibold text-[var(--tealD)]">Os três modos de desconto</h4>
                  <p className="mt-1.5 mb-3 text-[13.5px] leading-relaxed text-[var(--ink2)]">
                    Cada serviço da rede pode ter o desconto configurado de três formas:
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ['Preço fixo', 'O beneficiário paga um valor fixo combinado (ex.: consulta a R$ 120). O sistema mostra o % de economia equivalente.'],
                      ['Desconto percentual', 'Um percentual único sobre o valor particular (ex.: 20% OFF).'],
                      ['Faixa de desconto', 'Uma faixa (ex.: 30% a 50% OFF), quando o desconto varia conforme o serviço.'],
                    ].map(([t, d]) => (
                      <div key={t} className="rounded-lg bg-[var(--warm)] p-3">
                        <p className="m-0 text-[13px] font-bold text-[var(--orange)]">{t}</p>
                        <p className="mt-1 mb-0 text-[12px] leading-snug text-[var(--ink2)]">{d}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Feature title="Carteirinha digital">
                    Documento digital do beneficiário (nome, CPF, empresa, pontos). Apresentada ao credenciado no
                    atendimento.
                  </Feature>
                  <Feature title="Atendimentos e pontos">
                    Cada atendimento registra a economia obtida e gera pontos de fidelidade (1 ponto por R$ 1
                    economizado).
                  </Feature>
                  <Feature title="Dependentes">
                    Vinculados a um titular; cadastrados pelo RH da empresa ou pela administração. Cada um tem seu
                    próprio acesso por CPF.
                  </Feature>
                  <Feature title="Multi-unidade">
                    O sistema isola os dados por unidade (associação/município). Uma unidade nunca enxerga dados de
                    outra — base pronta para a expansão.
                  </Feature>
                </div>
              </div>
            </section>

            {/* ===== SEGURANÇA & LGPD ===== */}
            <section className="page-break mt-12 avoid-break">
              <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                Confiança
              </p>
              <h2 className="mt-2 mb-4 text-[24px] font-bold tracking-[-0.01em]">Segurança e privacidade (LGPD)</h2>
              <div className="grid grid-cols-2 gap-3">
                <Feature title="Acesso protegido">
                  Autenticação por token seguro com sessão validada a cada acesso; bloqueio temporário após várias
                  tentativas de senha erradas; senhas sempre criptografadas.
                </Feature>
                <Feature title="Separação por perfil">
                  Cada perfil só acessa o que lhe compete, e cada unidade só vê seus próprios dados — verificado no
                  servidor, não só na tela.
                </Feature>
                <Feature title="Trilha de auditoria">
                  Todas as ações sensíveis ficam registradas (autor, data, o que mudou), garantindo rastreabilidade.
                </Feature>
                <Feature title="Direitos do titular (LGPD)">
                  O beneficiário pode exportar seus dados e excluir a conta pelo próprio app. Dados de atendimento são
                  retidos apenas pelo prazo legal.
                </Feature>
              </div>
            </section>

            {/* ===== MOBILE ===== */}
            <section
              className="mt-10 avoid-break rounded-2xl px-7 py-7 text-white"
              style={{ background: 'linear-gradient(135deg,#08494a,#14807e)' }}
            >
              <h2 className="m-0 text-[20px] font-bold text-white">Aplicativo nas duas lojas</h2>
              <p className="mt-2 mb-0 max-w-[640px] text-[14px] leading-relaxed text-white/85">
                O app do beneficiário está publicado na <b>App Store</b> (iPhone) e na <b>Google Play</b> (Android).
                Uma característica importante para a operação: <b>as melhorias e correções do dia a dia entram
                automaticamente</b> nos dois apps assim que publicadas — sem esperar aprovação das lojas a cada
                ajuste. Só mudanças estruturais exigem nova versão nas lojas.
              </p>
            </section>

            {/* ===== ROADMAP ===== */}
            <section className="mt-10 avoid-break">
              <p className="m-0 text-[12px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                Em evolução
              </p>
              <h2 className="mt-2 mb-3 text-[24px] font-bold tracking-[-0.01em]">Próximas evoluções</h2>
              <p className="m-0 text-[14px] leading-relaxed text-[var(--ink2)]">
                A plataforma continua evoluindo. Entre os itens no roadmap estão o <b>catálogo de prêmios</b> da
                fidelidade (os pontos já são acumulados hoje) e o módulo de <b>faturamento</b>. A base multi-unidade
                já está pronta para receber novas associações.
              </p>
            </section>

            {/* ===== RODAPÉ ===== */}
            <footer className="mt-12 border-t border-[var(--line)] pt-5 text-[12px] text-[var(--muted)]">
              <p className="m-0">
                <b className="text-[var(--ink2)]">ACIAV Saúde</b> — Plataforma de saúde corporativa. Documento interno,
                de caráter confidencial, para avaliação da diretoria. Este material descreve as funcionalidades
                existentes no sistema.
              </p>
            </footer>
          </div>
        </article>

        <div className="no-print mx-auto mt-5 max-w-[900px] text-center text-[12px] text-[var(--muted)]">
          aciavsaude.com.br/manual · acesso restrito
        </div>
      </div>
    </div>
  );
}
