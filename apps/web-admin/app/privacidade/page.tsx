import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidade — ACIAV Saúde',
  description:
    'Como a ACIAV Saúde coleta, usa, armazena e protege seus dados pessoais, em conformidade com a LGPD, GDPR e diretrizes das lojas de aplicativos.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 text-slate-700 leading-relaxed">{children}</div>
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-sm border border-slate-200 rounded-lg">
        <thead className="bg-slate-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="text-left px-4 py-2 font-bold text-slate-700 border-b border-slate-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-slate-600 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacidadePage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <header className="border-b border-slate-200 pb-8">
          <p className="text-xs font-bold text-[#007178] uppercase tracking-widest">ACIAV Saúde</p>
          <h1 className="mt-3 text-4xl font-black text-slate-900 tracking-tight">
            Política de Privacidade
          </h1>
          <p className="mt-4 text-sm text-slate-500">
            <strong>Versão 1.0</strong> — Vigente a partir de 18 de maio de 2026.<br />
            Última atualização: 18 de maio de 2026.
          </p>
        </header>

        <div className="mt-8 text-slate-700 leading-relaxed">
          <p>
            Esta Política de Privacidade descreve como a{' '}
            <strong>ASSOCIAÇÃO EMPRESARIAL DE VIDEIRA — ACIAV</strong> (&quot;ACIAV Saúde&quot;,
            &quot;nós&quot;) coleta, usa, armazena, compartilha e protege os dados pessoais dos
            beneficiários (&quot;você&quot;, &quot;titular&quot;) do programa{' '}
            <strong>ACIAV Saúde</strong>, em conformidade com a Lei Geral de Proteção de Dados
            Pessoais (LGPD — Lei nº 13.709/2018), o Regulamento Geral sobre a Proteção de Dados
            (GDPR — UE 2016/679, quando aplicável) e as diretrizes da Apple App Store e Google
            Play.
          </p>
          <p className="mt-3">
            Ao utilizar o aplicativo móvel <strong>ACIAV Saúde</strong>, o site{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">aciavsaude.com.br</code>{' '}
            ou o portal{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">app.aciavsaude.com.br</code>,
            você confirma que leu e concorda com esta Política.
          </p>
        </div>

        <Section title="1. Quem somos (Controlador dos Dados)">
          <Table
            headers={['Item', 'Detalhe']}
            rows={[
              ['Razão social', 'ASSOCIAÇÃO EMPRESARIAL DE VIDEIRA — ACIAV'],
              ['CNPJ', '86.554.672/0001-64'],
              ['Endereço', 'Rua XV de Novembro, 19, 2º andar, Centro, Videira/SC, CEP 89.560-130'],
              ['E-mail (DPO / Privacidade)', 'aciav@aciav.org.br'],
              ['Encarregado pelo Tratamento de Dados (DPO)', 'Cristiane Corso'],
            ]}
          />
        </Section>

        <Section title="2. Quais dados coletamos">
          <h3 className="text-lg font-bold text-slate-800 mt-4">2.1. Dados que você nos fornece diretamente</h3>
          <Table
            headers={['Categoria', 'Dados', 'Origem']}
            rows={[
              ['Identificação', 'Nome completo, CPF, data de nascimento, gênero', 'Cadastro inicial (sua empresa empregadora)'],
              ['Contato', 'E-mail, WhatsApp, telefone', 'Cadastro / atualização em "Configurações"'],
              ['Foto de perfil', 'Imagem JPG/PNG', 'Upload opcional'],
              ['Vínculo empregatício', 'Empresa empregadora, tipo (titular/dependente), titular vinculado', 'Cadastro inicial'],
              ['Credenciais de acesso', 'CPF (login), senha (hash bcrypt — nunca armazenamos em texto puro)', 'Você define no primeiro acesso'],
            ]}
          />
          <h3 className="text-lg font-bold text-slate-800 mt-6">2.2. Dados gerados pelo uso do serviço</h3>
          <Table
            headers={['Categoria', 'Dados', 'Para que serve']}
            rows={[
              ['Histórico de atendimentos', 'Credenciado visitado, data, valor pago/economizado, avaliação', 'Cálculo de benefícios, pontos e analytics'],
              ['Interações com o Guia Médico', 'Cliques em WhatsApp/telefone/maps/e-mail/detalhes', 'Estatística de uso (não compartilhada com terceiros)'],
              ['Saldo de pontos', 'Quantidade acumulada', 'Funcionalidade de recompensas (em desenvolvimento)'],
              ['Preferências de notificação', 'Liga/desliga de e-mail, WhatsApp, alertas de novos credenciados', 'Configurações da conta'],
            ]}
          />
          <h3 className="text-lg font-bold text-slate-800 mt-6">2.3. Dados técnicos e de dispositivo</h3>
          <Table
            headers={['Categoria', 'Dados', 'Para que serve']}
            rows={[
              ['Identificadores de dispositivo', 'Token de push (FCM/APNs), modelo, sistema operacional', 'Envio de notificações'],
              ['Logs de acesso', 'IP, User-Agent, data/hora de login', 'Auditoria, segurança e prevenção a fraudes'],
              ['Cookies essenciais', 'Token de autenticação (httpOnly, expira em 7 dias)', 'Manter sua sessão ativa'],
            ]}
          />
          <h3 className="text-lg font-bold text-slate-800 mt-6">2.4. O que NÃO coletamos</h3>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Identificadores de publicidade (IDFA, AAID)</li>
            <li>Localização precisa em background</li>
            <li>Lista de contatos</li>
            <li>Mensagens, fotos ou áudios do seu dispositivo</li>
            <li>Dados de saúde sensíveis além do histórico de atendimentos (não armazenamos diagnósticos, prescrições, exames ou prontuários)</li>
            <li>Dados financeiros (cartão de crédito, conta bancária)</li>
          </ul>
        </Section>

        <Section title="3. Para que usamos seus dados (finalidades)">
          <Table
            headers={['Finalidade', 'Base legal (LGPD)']}
            rows={[
              ['Identificar você como beneficiário do programa', 'Execução de contrato (Art. 7º, V)'],
              ['Permitir o uso do app/portal e da carteirinha digital', 'Execução de contrato (Art. 7º, V)'],
              ['Calcular descontos, benefícios e pontos', 'Execução de contrato (Art. 7º, V)'],
              ['Registrar atendimentos e gerar histórico', 'Execução de contrato + Obrigação legal'],
              ['Comunicações transacionais', 'Legítimo interesse (com opt-out em Configurações)'],
              ['Auditoria, segurança e prevenção a fraudes', 'Legítimo interesse (Art. 7º, IX)'],
              ['Cumprimento de obrigações legais e fiscais', 'Obrigação legal (Art. 7º, II)'],
              ['Envio de push notifications', 'Consentimento — concedido ao permitir notificações'],
            ]}
          />
          <p className="mt-4 font-bold text-slate-800">
            Não usamos seus dados para publicidade direcionada nem para perfilamento comportamental.
          </p>
        </Section>

        <Section title="4. Com quem compartilhamos seus dados">
          <p>
            Seus dados são tratados internamente pela ACIAV. Compartilhamos apenas com{' '}
            <strong>operadores de tecnologia estritamente necessários para a operação do serviço</strong>,
            sob acordo de confidencialidade:
          </p>
          <Table
            headers={['Operador', 'Função', 'País / Mecanismo']}
            rows={[
              ['Hostinger International Ltd.', 'Hospedagem da API e banco de dados', 'Brasil/EU — Cláusulas-padrão contratuais'],
              ['Google Firebase (Cloud Messaging)', 'Envio de push notifications', 'EUA — SCC'],
              ['Apple Inc. (APNs)', 'Entrega de push em iOS', 'EUA — SCC'],
              ['Vercel Inc.', 'Hospedagem do portal app.aciavsaude.com.br', 'EUA / Frankfurt — SCC'],
              ['Credenciados da rede ACIAV Saúde', 'Apresentação da carteirinha digital', 'Brasil — Mínimo necessário (nome, CPF, vínculo)'],
            ]}
          />
          <p className="mt-4 font-bold text-slate-800">
            Nunca vendemos seus dados. Não compartilhamos com empresas de marketing, anúncios,
            redes sociais ou data brokers.
          </p>
          <p>
            Em caso de obrigação legal (ordem judicial, requisição da ANPD, fiscalização
            tributária), seus dados podem ser compartilhados com órgãos públicos, sempre no
            limite estritamente necessário.
          </p>
        </Section>

        <Section title="5. Por quanto tempo guardamos seus dados">
          <Table
            headers={['Categoria', 'Prazo de retenção', 'Base']}
            rows={[
              ['Dados cadastrais e de contato', 'Conta ativa + 5 anos após desativação', 'LGPD Art. 16, II'],
              ['Histórico de atendimentos', '5 anos após a transação', 'Código Civil + obrigação fiscal'],
              ['Logs de acesso e auditoria', '6 meses a 2 anos', 'Marco Civil da Internet'],
              ['Tokens de push notification', 'Enquanto o app estiver instalado e a permissão concedida', 'Funcionalidade'],
              ['Cookies de sessão', '7 dias ou até logout', 'Funcionalidade'],
            ]}
          />
          <p>Após esses prazos, os dados são <strong>anonimizados ou excluídos definitivamente</strong>.</p>
        </Section>

        <Section title="6. Seus direitos (LGPD Art. 18)">
          <p>
            Você pode exercer os direitos abaixo a qualquer momento, diretamente no app ou pelo
            e-mail <strong>aciav@aciav.org.br</strong>:
          </p>
          <Table
            headers={['Direito', 'Como exercer']}
            rows={[
              ['Acesso aos seus dados', 'App: Configurações → Privacidade → "Baixar planilha (.xlsx)"'],
              ['Correção / atualização', 'App: Configurações → Dados Pessoais'],
              ['Confirmação de tratamento', 'E-mail ao DPO'],
              ['Exclusão da conta', 'App: Configurações → Privacidade → "Excluir minha conta" — desativação imediata; dados financeiros retidos por 5 anos por obrigação legal'],
              ['Portabilidade', 'Exportação .xlsx inclui todos os seus dados em formato estruturado'],
              ['Anonimização ou bloqueio', 'E-mail ao DPO'],
              ['Revogação de consentimento', 'Notificações: configurações do sistema operacional + app'],
              ['Informações sobre compartilhamento', 'Esta Política (Seção 4) ou e-mail ao DPO'],
              ['Reclamação à ANPD', 'gov.br/anpd/pt-br/canais_atendimento/peticao-do-titular'],
            ]}
          />
          <p>Respondemos em até <strong>15 dias úteis</strong> a cada solicitação.</p>
        </Section>

        <Section title="7. Como protegemos seus dados">
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li><strong>Criptografia em trânsito:</strong> HTTPS/TLS 1.2+ em todas as comunicações.</li>
            <li><strong>Criptografia em repouso:</strong> senhas com bcrypt; dados sensíveis em colunas do PostgreSQL protegidas em nível de servidor.</li>
            <li><strong>Isolamento por unidade/empresa:</strong> sistema multi-tenant — seus dados ficam isolados dos de outras unidades.</li>
            <li><strong>Controle de sessões:</strong> JWT validado a cada requisição — logout/desativação invalida a sessão instantaneamente.</li>
            <li><strong>Rate limiting e proteção contra força bruta:</strong> lockout automático após N tentativas de login.</li>
            <li><strong>Auditoria:</strong> ações sensíveis (criar/editar/desativar usuário, transação, exclusão) registradas com IP, User-Agent e timestamp.</li>
            <li><strong>Backups regulares</strong> do banco de dados, retidos por período controlado.</li>
            <li><strong>Acesso interno mínimo</strong> com login individual e rastreabilidade.</li>
          </ul>
          <p className="mt-4">
            Em caso de <strong>violação de dados</strong>, comunicaremos a ANPD e os titulares
            afetados em até <strong>48 horas</strong> após a confirmação (LGPD Art. 48).
          </p>
        </Section>

        <Section title="8. Cookies e tecnologias similares">
          <p>Usamos apenas <strong>cookies essenciais</strong> para o funcionamento do serviço:</p>
          <Table
            headers={['Nome', 'Tipo', 'Finalidade', 'Duração']}
            rows={[
              ['aciav_token', 'Essencial / httpOnly', 'Autenticação', '7 dias'],
              ['aciav_role', 'Essencial / httpOnly', 'Roteamento por papel', '7 dias'],
            ]}
          />
          <p className="mt-4 font-bold text-slate-800">
            Não usamos cookies de publicidade, analytics de terceiros, pixels ou tags de marketing.
          </p>
        </Section>

        <Section title="9. Notificações push (apps móveis)">
          <p>
            Quando você instala o app ACIAV Saúde, o sistema operacional pode solicitar
            permissão para enviar notificações. Você pode:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Aceitar ou recusar ao instalar</li>
            <li>Alterar a qualquer momento nas configurações do sistema (Android: Configurações → Apps → ACIAV Saúde → Notificações; iOS: Ajustes → Notificações → ACIAV Saúde)</li>
            <li>Desligar categorias específicas em Configurações → Notificações dentro do app</li>
          </ul>
          <p>
            O conteúdo das notificações é estritamente transacional. <strong>Não enviamos publicidade.</strong>
          </p>
        </Section>

        <Section title="10. Crianças e adolescentes">
          <p>
            O serviço ACIAV Saúde é destinado a adultos maiores de 18 anos (titulares de
            convênios). Dependentes menores de idade são cadastrados pelos seus responsáveis
            legais, que dão consentimento em nome deles e respondem pelos dados.
          </p>
          <p>
            <strong>Não direcionamos o serviço a menores de 13 anos</strong> e não coletamos
            dados deles diretamente. Se você é menor e nos forneceu dados sem autorização do
            responsável, contate <strong>aciav@aciav.org.br</strong> para exclusão imediata.
          </p>
        </Section>

        <Section title="11. Transferência internacional">
          <p>
            Alguns dos nossos operadores (Firebase, Apple APNs, Vercel) estão nos
            <strong> Estados Unidos</strong>. As transferências são amparadas pelas{' '}
            <strong>Cláusulas-Padrão Contratuais (SCCs)</strong> aprovadas pela Comissão
            Europeia, em conformidade com o Art. 33 da LGPD.
          </p>
          <p>
            Os dados pessoais (nome, CPF, contato, histórico) são processados{' '}
            <strong>no Brasil</strong> (servidor Hostinger). Apenas tokens de push e logs de
            envio passam pelos servidores estrangeiros.
          </p>
        </Section>

        <Section title="12. Alterações nesta Política">
          <p>Podemos atualizar esta Política periodicamente. Quando isso ocorrer:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>A data de &quot;Última atualização&quot; no topo será modificada</li>
            <li>Alterações materiais serão comunicadas via push, e-mail ou banner com <strong>30 dias</strong> de antecedência</li>
            <li>O histórico de versões fica disponível mediante solicitação ao DPO</li>
          </ul>
        </Section>

        <Section title="13. Como nos contatar">
          <Table
            headers={['Canal', 'Endereço']}
            rows={[
              ['E-mail (DPO / Privacidade)', 'aciav@aciav.org.br'],
              ['Suporte geral', 'aciav@aciav.org.br'],
              ['Endereço físico', 'Rua XV de Novembro, 19, 2º andar, Centro, Videira/SC, CEP 89.560-130'],
              ['Telefone', 'Disponível mediante solicitação por e-mail'],
            ]}
          />
        </Section>

        <Section title="14. Foro">
          <p>
            Para questões relacionadas a esta Política, fica eleito o foro da{' '}
            <strong>Comarca de Videira / SC</strong>, Brasil, com renúncia a qualquer outro,
            por mais privilegiado que seja.
          </p>
        </Section>

        <footer className="mt-16 pt-8 border-t border-slate-200 text-sm text-slate-500">
          <p>
            Você tem o direito de revogar seu consentimento ou exercer qualquer dos direitos
            descritos a qualquer momento.
          </p>
          <p className="mt-2">Última revisão: 18/05/2026.</p>
          <p className="mt-6">
            <a href="/" className="text-[#007178] font-bold hover:underline">← Voltar ao site</a>
          </p>
        </footer>
      </div>
    </main>
  );
}
