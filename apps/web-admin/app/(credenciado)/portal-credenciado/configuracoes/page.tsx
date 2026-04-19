import { redirect } from 'next/navigation';
import { Settings, AlertCircle, MessageCircle, Lock } from 'lucide-react';
import { getSessionUser, serverFetch } from '../../../../lib/server-api';

interface Unit {
  id: string;
  supportWhatsapp?: string | null;
}

function whatsLink(raw: string | null | undefined, message: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/55${digits}?text=${encodeURIComponent(message)}`;
}

export default async function ConfiguracoesCredPage() {
  const user = await getSessionUser();
  if (!user || user.role !== 'provider') redirect('/login');

  let supportWhatsapp: string | null = null;
  if (user.unitId) {
    const unit = await serverFetch<Unit>(`/units/${user.unitId}`);
    supportWhatsapp = unit?.supportWhatsapp ?? null;
  }

  const supportHref = whatsLink(
    supportWhatsapp,
    'Olá, sou credenciado ACIAV Saúde e gostaria de solicitar uma alteração na minha conta.',
  );

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="text-[#007178]" /> Configurações
        </h1>
        <p className="text-slate-500 text-sm mt-1">Sua conta é gerenciada pela administração da ACIAV.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
          <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800">Portal somente para consulta</p>
            <p className="text-sm text-amber-700 mt-1">
              Por segurança, a alteração de senha, cadastro de serviços e dados do credenciado são feitos
              diretamente pela administração da ACIAV Saúde. Entre em contato pelo WhatsApp para solicitar
              qualquer mudança na sua conta.
            </p>
            {supportHref ? (
              <a
                href={supportHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                <MessageCircle size={16} /> Falar com a ACIAV
              </a>
            ) : (
              <p className="mt-3 text-xs text-amber-600">
                Administração entrará em contato através do canal habitual.
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Lock size={14} className="text-slate-400" /> O que posso solicitar?
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2"><span className="text-[#007178] font-bold">•</span> Alteração de senha de acesso</li>
            <li className="flex items-start gap-2"><span className="text-[#007178] font-bold">•</span> Atualização de dados cadastrais (foto, clínica, contato)</li>
            <li className="flex items-start gap-2"><span className="text-[#007178] font-bold">•</span> Inclusão, edição ou remoção de serviços da tabela</li>
            <li className="flex items-start gap-2"><span className="text-[#007178] font-bold">•</span> Alteração de horários de atendimento</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
