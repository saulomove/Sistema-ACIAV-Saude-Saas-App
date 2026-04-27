import { FAQS } from '../../lib/landing-data';
import { CONTACT_HREF } from '../../lib/urls';

export default function FAQ() {
  return (
    <section id="faq" className="bg-bg-warm py-[110px]">
      <div className="max-w-[1200px] mx-auto px-7">
        <div className="text-center max-w-[720px] mx-auto mb-15">
          <span className="inline-flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-[0.18em]">
            <span className="w-6 h-0.5 bg-orange-500" />
            Perguntas frequentes
          </span>
          <h2 className="text-[clamp(34px,3.8vw,50px)] leading-[1.05] tracking-[-0.025em] font-extrabold mt-3.5 mb-0 text-ink">
            Tudo que você quis saber, <span className="font-serif">sem rodeios.</span>
          </h2>
        </div>

        <div className="max-w-[760px] mx-auto">
          {FAQS.map((faq, i) => {
            const isLastWithCta = i === FAQS.length - 1;
            return (
              <details key={faq.question} className="border-b border-line group" open={faq.open ?? false}>
                <summary className="qa-summary cursor-pointer py-5 flex items-center justify-between gap-4 text-[17px] font-semibold text-ink transition-colors hover:text-orange-500">
                  <span>{faq.question}</span>
                  <span className="text-[28px] font-light text-teal-800 leading-none transition-transform duration-300 group-open:rotate-45 group-open:text-orange-500">
                    +
                  </span>
                </summary>
                <div
                  className="pb-5 text-muted text-[15px] leading-[1.65] max-w-[95%]"
                  dangerouslySetInnerHTML={{
                    __html: isLastWithCta
                      ? `${faq.answer} <a href="${CONTACT_HREF}" style="color:#e85d1f; font-weight:600;">Solicite uma demo →</a>`
                      : faq.answer,
                  }}
                />
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}
