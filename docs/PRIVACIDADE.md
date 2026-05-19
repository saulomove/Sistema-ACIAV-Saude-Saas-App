# Política de Privacidade — ACIAV Saúde

> **Versão 1.0** — Vigente a partir de 18 de maio de 2026.
> **Última atualização:** 18 de maio de 2026.

Esta Política de Privacidade descreve como a **ACIAV — Associação Empresarial de Caçador, Iomerê, Rio das Antas e Macieira** ("ACIAV Saúde", "nós") coleta, usa, armazena, compartilha e protege os dados pessoais dos beneficiários ("você", "titular") do programa **ACIAV Saúde**, em conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD — Lei nº 13.709/2018), o Regulamento Geral sobre a Proteção de Dados (GDPR — UE 2016/679, quando aplicável) e as diretrizes da Apple App Store e Google Play.

Ao utilizar o aplicativo móvel **ACIAV Saúde**, o site `aciavsaude.com.br` ou o portal `app.aciavsaude.com.br`, você confirma que leu e concorda com esta Política.

---

## 1. Quem somos (Controlador dos Dados)

| Item | Detalhe |
|---|---|
| **Razão social** | ACIAV — Associação Empresarial de Caçador, Iomerê, Rio das Antas e Macieira |
| **CNPJ** | _[a preencher]_ |
| **Endereço** | _[a preencher — rua, número, cidade, CEP]_ |
| **E-mail para questões de privacidade (DPO)** | privacidade@aciavsaude.com.br |
| **Encarregado pelo Tratamento de Dados (DPO)** | _[Nome do encarregado a preencher]_ |

---

## 2. Quais dados coletamos

### 2.1. Dados que você nos fornece diretamente

| Categoria | Dados | Origem |
|---|---|---|
| **Identificação** | Nome completo, CPF, data de nascimento, gênero | Cadastro inicial (sua empresa empregadora) |
| **Contato** | E-mail, WhatsApp, telefone | Cadastro / atualização em "Configurações" |
| **Foto de perfil** | Imagem JPG/PNG | Upload opcional |
| **Vínculo empregatício** | Empresa empregadora, tipo (titular/dependente), titular vinculado | Cadastro inicial |
| **Credenciais de acesso** | CPF (login), senha (hash bcrypt — nunca armazenamos em texto puro) | Você define no primeiro acesso |

### 2.2. Dados gerados pelo uso do serviço

| Categoria | Dados | Para que serve |
|---|---|---|
| **Histórico de atendimentos** | Credenciado visitado, data, valor pago/economizado, avaliação dada | Cálculo de benefícios, pontos e analytics |
| **Interações com o Guia Médico** | Cliques em WhatsApp/telefone/maps/e-mail/detalhes de cada credenciado | Estatística de uso (não compartilhada com terceiros) |
| **Saldo de pontos** | Quantidade acumulada | Funcionalidade de recompensas (em desenvolvimento) |
| **Preferências de notificação** | Liga/desliga de e-mail, WhatsApp, alertas de novos credenciados | Configurações da conta |

### 2.3. Dados técnicos e de dispositivo

| Categoria | Dados | Para que serve |
|---|---|---|
| **Identificadores de dispositivo** | Token de push notification (FCM/APNs), modelo do aparelho, sistema operacional | Envio de notificações |
| **Logs de acesso** | Endereço IP, User-Agent (browser/app), data/hora de login | Auditoria, segurança e prevenção a fraudes |
| **Cookies essenciais** | Token de autenticação (`aciav_token`, `aciav_role`) — httpOnly, expira em 7 dias | Manter sua sessão ativa |

### 2.4. O que **NÃO** coletamos

- Identificadores de publicidade (IDFA, AAID)
- Localização precisa em background
- Lista de contatos
- Mensagens, fotos ou áudios do seu dispositivo
- Dados de saúde sensíveis além do histórico de atendimentos (não armazenamos diagnósticos, prescrições, exames ou prontuários)
- Dados financeiros (cartão de crédito, conta bancária)

---

## 3. Para que usamos seus dados (finalidades)

| Finalidade | Base legal (LGPD) |
|---|---|
| Identificar você como beneficiário do programa | Execução de contrato (Art. 7º, V) |
| Permitir o uso do app/portal e da carteirinha digital | Execução de contrato (Art. 7º, V) |
| Calcular descontos, benefícios e pontos | Execução de contrato (Art. 7º, V) |
| Registrar atendimentos e gerar histórico | Execução de contrato (Art. 7º, V) + Obrigação legal (Art. 7º, II) |
| Comunicações transacionais (boas-vindas, alertas, novos credenciados) | Legítimo interesse (Art. 7º, IX) — com opt-out em Configurações |
| Auditoria, segurança e prevenção a fraudes | Legítimo interesse (Art. 7º, IX) |
| Cumprimento de obrigações legais e fiscais | Obrigação legal (Art. 7º, II) |
| Envio de push notifications | Consentimento — você concede ao permitir notificações no dispositivo |

**Não usamos seus dados para publicidade direcionada nem para perfilamento comportamental.**

---

## 4. Com quem compartilhamos seus dados

Seus dados são tratados internamente pela ACIAV. Compartilhamos apenas com **operadores de tecnologia estritamente necessários para a operação do serviço**, sob acordo de confidencialidade:

| Operador | Função | País / Mecanismo de Transferência |
|---|---|---|
| **Hostinger International Ltd.** | Hospedagem da API e banco de dados | Brasil/EU — Cláusulas-padrão contratuais |
| **Google Firebase (Cloud Messaging)** | Envio de push notifications | EUA — Privacy Shield successor / Cláusulas-padrão |
| **Apple Inc. (APNs)** | Entrega de push em dispositivos iOS | EUA — Privacy Shield successor |
| **Vercel Inc.** | Hospedagem do portal `app.aciavsaude.com.br` | EUA / Frankfurt — Cláusulas-padrão |
| **Credenciados da rede ACIAV Saúde** | Apresentação da carteirinha digital | Brasil — Mínimo necessário (nome, CPF, vínculo) |

**Nunca vendemos seus dados.** Não compartilhamos com empresas de marketing, anúncios, redes sociais ou data brokers.

Em caso de obrigação legal (ordem judicial, requisição da Autoridade Nacional de Proteção de Dados — ANPD, fiscalização tributária), seus dados podem ser compartilhados com órgãos públicos, sempre no limite estritamente necessário.

---

## 5. Por quanto tempo guardamos seus dados

| Categoria | Prazo de retenção | Base |
|---|---|---|
| Dados cadastrais e de contato | Enquanto a conta estiver ativa + 5 anos após desativação | LGPD Art. 16, II (obrigação legal — comprovação de relação contratual) |
| Histórico de atendimentos | 5 anos após a transação | Código Civil Art. 206, §5º + obrigação fiscal |
| Logs de acesso e auditoria | 6 meses a 2 anos | Marco Civil da Internet (Lei 12.965/2014) |
| Tokens de push notification | Enquanto o app estiver instalado e a permissão concedida | Funcionalidade |
| Cookies de sessão | 7 dias ou até logout | Funcionalidade |

Após esses prazos, os dados são **anonimizados ou excluídos definitivamente**.

---

## 6. Seus direitos (LGPD Art. 18)

Você pode exercer os direitos abaixo a qualquer momento, **diretamente no app** ou pelo e-mail `privacidade@aciavsaude.com.br`:

| Direito | Como exercer |
|---|---|
| **Acesso aos seus dados** | App: Configurações → Privacidade → "Baixar planilha (.xlsx)" |
| **Correção / atualização** | App: Configurações → Dados Pessoais |
| **Confirmação de tratamento** | E-mail ao DPO |
| **Exclusão da conta** | App: Configurações → Privacidade → "Excluir minha conta" — a desativação é **imediata**; dados financeiros e de atendimentos pagos são retidos por obrigação legal por 5 anos, depois anonimizados |
| **Portabilidade** | A exportação `.xlsx` inclui todos os seus dados em formato estruturado |
| **Anonimização ou bloqueio** | E-mail ao DPO |
| **Revogação de consentimento** | Push notifications: Configurações do sistema operacional + Configurações do app |
| **Informações sobre compartilhamento** | Esta Política (Seção 4) ou e-mail ao DPO |
| **Reclamação à ANPD** | https://www.gov.br/anpd/pt-br/canais_atendimento/peticao-do-titular |

Respondemos em até **15 dias úteis** a cada solicitação.

---

## 7. Como protegemos seus dados

Implementamos medidas técnicas e administrativas para proteger seus dados:

- **Criptografia em trânsito**: HTTPS/TLS 1.2+ em todas as comunicações.
- **Criptografia em repouso**: senhas armazenadas com bcrypt (cost factor 10+); dados sensíveis em colunas do PostgreSQL protegidas em nível de servidor.
- **Isolamento por unidade/empresa**: o sistema é multi-tenant — seus dados ficam isolados dos dados de outras unidades/empresas (filtragem obrigatória por `unitId` em todas as queries).
- **Controle de sessões**: JWT validado contra a tabela `Session` a cada requisição — logout/desativação invalida a sessão instantaneamente.
- **Rate limiting e proteção contra força bruta**: lockout automático após N tentativas de login.
- **Auditoria**: ações sensíveis (criar/editar/desativar usuário, criar transação, exclusão de conta) são registradas com IP, User-Agent e timestamp.
- **Backups**: backups regulares do banco de dados, retidos por período controlado.
- **Acesso interno mínimo**: apenas administradores autorizados da ACIAV têm acesso aos dados, com login individual e rastreabilidade.

Apesar dos esforços, nenhum sistema é 100% imune a incidentes. Em caso de **violação de dados**, comunicaremos a ANPD e os titulares afetados em até **48 horas** após a confirmação, conforme exige o Art. 48 da LGPD.

---

## 8. Cookies e tecnologias similares

Usamos apenas **cookies essenciais** para o funcionamento do serviço:

| Nome | Tipo | Finalidade | Duração |
|---|---|---|---|
| `aciav_token` | Essencial / httpOnly | Autenticação | 7 dias |
| `aciav_role` | Essencial / httpOnly | Roteamento por papel (paciente/admin/credenciado) | 7 dias |

**Não usamos cookies de publicidade, analytics de terceiros, pixels ou tags de marketing.**

---

## 9. Notificações push (apps móveis)

Quando você instala o app **ACIAV Saúde**, o sistema operacional pode solicitar permissão para enviar notificações push. Você pode:

- Aceitar ou recusar ao instalar
- Alterar a qualquer momento nas configurações do sistema operacional (Android: Configurações → Apps → ACIAV Saúde → Notificações; iOS: Ajustes → Notificações → ACIAV Saúde)
- Desligar categorias específicas (e-mail, WhatsApp, novos credenciados) em **Configurações → Notificações** dentro do app

O conteúdo das notificações é estritamente transacional (atendimentos, novos credenciados, lembretes). Não enviamos publicidade.

---

## 10. Crianças e adolescentes

O serviço **ACIAV Saúde** é destinado a adultos maiores de 18 anos (titulares de convênios). Dependentes menores de idade são cadastrados pelos seus responsáveis legais (titulares), que dão consentimento em nome deles e respondem pelos dados.

**Não direcionamos o serviço a menores de 13 anos** e não coletamos dados deles diretamente.

Se você é menor e nos forneceu dados sem autorização do responsável, contate `privacidade@aciavsaude.com.br` para exclusão imediata.

---

## 11. Transferência internacional

Alguns dos nossos operadores de tecnologia (Firebase, Apple APNs, Vercel) estão localizados nos **Estados Unidos**. As transferências são amparadas pelas **Cláusulas-Padrão Contratuais (Standard Contractual Clauses — SCCs)** aprovadas pela Comissão Europeia, em conformidade com o Art. 33 da LGPD.

Os dados pessoais (nome, CPF, contato, histórico) são processados **no Brasil** (servidor Hostinger). Apenas tokens de push e logs de envio passam pelos servidores dos operadores estrangeiros.

---

## 12. Alterações nesta Política

Podemos atualizar esta Política periodicamente para refletir mudanças no serviço ou na legislação. Quando isso ocorrer:

- A data de "Última atualização" no topo será modificada
- Alterações materiais serão comunicadas via push notification, e-mail ou banner no app/portal com **30 dias** de antecedência
- O histórico de versões fica disponível mediante solicitação ao DPO

---

## 13. Como nos contatar

| Canal | Endereço |
|---|---|
| **E-mail (DPO / Privacidade)** | privacidade@aciavsaude.com.br |
| **Suporte geral** | _[a preencher]_ |
| **Endereço físico** | _[a preencher]_ |
| **Telefone** | _[a preencher]_ |

---

## 14. Foro

Para questões relacionadas a esta Política, fica eleito o foro da **Comarca de Caçador / SC**, Brasil, com renúncia a qualquer outro, por mais privilegiado que seja.

---

**Você tem o direito de revogar seu consentimento ou exercer qualquer dos direitos descritos acima a qualquer momento.**

Última revisão: 18/05/2026.
