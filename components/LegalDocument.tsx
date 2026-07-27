import { LEGAL_EFFECTIVE_DATE } from "@/lib/legal";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
}

export function LegalDocument({ title, sections }: { title: string; sections: LegalSection[] }) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14 flex flex-col gap-4 text-sm leading-relaxed text-foreground/85">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
      <p className="text-xs text-muted/70">Действует с {LEGAL_EFFECTIVE_DATE}</p>

      {sections.map((section, i) => (
        <div key={i} className="flex flex-col gap-2 mt-2">
          <h2 className="text-base font-semibold text-foreground">{section.heading}</h2>
          {section.paragraphs.map((p, j) => (
            <p key={j}>{p}</p>
          ))}
        </div>
      ))}
    </div>
  );
}
