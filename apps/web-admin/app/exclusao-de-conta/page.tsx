import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Exclusão de Conta — ACIAV Saúde',
  description:
    'Como excluir sua conta no app ACIAV Saúde, quais dados são apagados e quais permanecem retidos por obrigação legal.',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 text-slate-700 leading-relaxed">{children}</div>
    </section>
  );
}

export default function ExclusaoContaPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <header className="border-b border-slate-200 pb-8">
          <p className="text-xs font-bold text-[#007178] uppercase tracking-widest">ACIAV Saúde</p>
          <h1 className="mt-3 text-4xl font-black text-slate-900 tracking-tight">
            Exclusão de Conta e Dados
          </h1>
          <p className="mt-4 text-sm text-slate-500">
            Esta página descreve como excluir sua conta no app{' '}
            <strong>ACIAV Saúde</strong>, quais dados são apagados imediatamente e quais
            são retidos por obrigação legal.
          </p>
        </header>

        <Section title="Quem pode excluir a conta">
          <p>
            Beneficiários do programa ACIAV Saúde (titulares e dependentes) podem solicitar
            a exclusão da própria conta diretamente pelo aplicativo móvel ou portal web.
          </p>
        </Section>

        <Section title="Como excluir pelo aplicativo (recomendado)">
          <ol className="list-decimal pl-6 space-y-2 mt-2">
            <li>Abra o app <strong>ACIAV Saúde</strong> no seu celular.</li>
            <li>Faça login com seu CPF e senha.</li>
            <li>No menu inferior, toque em <strong>Configurações</strong>.</li>
            <li>Selecione a aba <strong>Privacidade (LGPD)</strong>.</li>
            <li>Toque em <strong>Excluir minha conta</strong>.</li>
            <li>Informe o motivo (obrigatório, mínimo 5 caracteres).</li>
            <li>Confirme a exclusão.</li>
          </ol>
          <p>
            Após a confirmação, sua sessão é encerrada imediatamente e você é redirecionado
            para a tela de login.
          </p>
        </Section>

        <Section title="Como excluir por e-mail (alternativa)">
          <p>
            Se não conseguir acessar o app, envie um e-mail para{' '}
            <a className="text-[#007178] font-bold underline" href="mailto:aciav@aciav.org.br">
              aciav@aciav.org.br
            </a>{' '}
            com:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Assunto: <em>&quot;Solicitação de exclusão de conta — ACIAV Saúde&quot;</em></li>
            <li>Seu nome completo</li>
            <li>Seu CPF</li>
            <li>Empresa empregadora (se aplicável)</li>
          </ul>
          <p>
            Confirmamos a identidade do solicitante e processamos em até{' '}
            <strong>15 dias úteis</strong> (LGPD Art. 18, §5º).
          </p>
        </Section>

        <Section title="O que é apagado imediatamente">
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>Acesso à conta:</strong> login bloqueado, sessões ativas encerradas em todos os dispositivos.</li>
            <li><strong>Foto de perfil</strong> (se carregada).</li>
            <li><strong>Preferências de notificação</strong> e configurações da conta.</li>
            <li><strong>Tokens de push notification</strong> (FCM/APNs) associados à sua conta.</li>
            <li><strong>Saldo de pontos</strong> e benefícios não resgatados.</li>
          </ul>
        </Section>

        <Section title="O que é retido por obrigação legal">
          <p>
            Os dados abaixo são <strong>mantidos por períodos específicos</strong> em razão
            de obrigações legais e regulatórias brasileiras. <strong>Estes dados não
            serão removidos a pedido</strong> até que o prazo legal expire, quando serão
            anonimizados ou excluídos automaticamente.
          </p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm border border-slate-200 rounded-lg">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-2 font-bold text-slate-700 border-b border-slate-200">
                    Dado
                  </th>
                  <th className="text-left px-4 py-2 font-bold text-slate-700 border-b border-slate-200">
                    Prazo
                  </th>
                  <th className="text-left px-4 py-2 font-bold text-slate-700 border-b border-slate-200">
                    Base legal
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-600 align-top">Histórico de atendimentos</td>
                  <td className="px-4 py-3 text-slate-600 align-top">5 anos após a transação</td>
                  <td className="px-4 py-3 text-slate-600 align-top">Código Civil Art. 206, §5º + obrigação fiscal</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-600 align-top">Dados cadastrais (nome, CPF, contato)</td>
                  <td className="px-4 py-3 text-slate-600 align-top">5 anos após a desativação</td>
                  <td className="px-4 py-3 text-slate-600 align-top">LGPD Art. 16, II</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="px-4 py-3 text-slate-600 align-top">Logs de acesso e auditoria</td>
                  <td className="px-4 py-3 text-slate-600 align-top">6 meses a 2 anos</td>
                  <td className="px-4 py-3 text-slate-600 align-top">Marco Civil da Internet (Lei 12.965/2014)</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-600 align-top">Registros financeiros e fiscais</td>
                  <td className="px-4 py-3 text-slate-600 align-top">5 anos</td>
                  <td className="px-4 py-3 text-slate-600 align-top">Código Tributário Nacional</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Após expirados os prazos, os dados são <strong>anonimizados ou excluídos
            definitivamente</strong>.
          </p>
        </Section>

        <Section title="Anonimização">
          <p>
            Você pode solicitar a <strong>anonimização</strong> dos dados que precisamos
            reter por obrigação legal. Nesse caso, os dados continuam existindo nos sistemas,
            mas perdem qualquer vínculo com sua identidade (não é possível reconstituí-los).
          </p>
          <p>
            Solicite por e-mail para{' '}
            <a className="text-[#007178] font-bold underline" href="mailto:aciav@aciav.org.br">
              aciav@aciav.org.br
            </a>.
          </p>
        </Section>

        <Section title="Reativação">
          <p>
            Por padrão, a conta é <strong>desativada</strong> imediatamente, mas pode ser
            reativada em até <strong>30 dias</strong> entrando em contato pelo e-mail
            acima. Após 30 dias, a conta entra em fila para exclusão definitiva — não há
            como reativar.
          </p>
          <p>
            Se sua empresa empregadora encerrar o vínculo durante o período de 30 dias,
            seus dados pessoais são preservados e tratados conforme as regras de retenção
            acima.
          </p>
        </Section>

        <Section title="Encarregado pelo Tratamento de Dados (DPO)">
          <p>
            Em caso de dúvidas sobre o processo de exclusão:
          </p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li><strong>DPO:</strong> Cristiane Corso</li>
            <li>
              <strong>E-mail:</strong>{' '}
              <a className="text-[#007178] font-bold underline" href="mailto:aciav@aciav.org.br">
                aciav@aciav.org.br
              </a>
            </li>
            <li>
              <strong>Controlador:</strong> ASSOCIAÇÃO EMPRESARIAL DE VIDEIRA — ACIAV (CNPJ 86.554.672/0001-64)
            </li>
          </ul>
        </Section>

        <footer className="mt-16 pt-8 border-t border-slate-200 text-sm text-slate-500">
          <p>
            Esta página atende aos requisitos da Google Play e Apple App Store para
            divulgação pública do procedimento de exclusão de conta.
          </p>
          <p className="mt-2">Última revisão: 19/05/2026.</p>
          <p className="mt-6 space-x-4">
            <a href="/privacidade" className="text-[#007178] font-bold hover:underline">
              Política de Privacidade
            </a>
            <a href="/" className="text-[#007178] font-bold hover:underline">
              ← Voltar ao site
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
