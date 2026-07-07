"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { Display, LAYOUT, Overline, Reveal, SPACING, Text } from "@/components/design-system";
import type { LandingContent } from "@/features/landing";
import { cn } from "@/lib/utils";

type LandingFaqProps = {
  content: LandingContent;
};

export function LandingFaq({ content }: LandingFaqProps) {
  const hasFaq = content.faq.length > 0;

  return (
    <section
      id="faq"
      className={cn("surface-public border-border/60 border-t", SPACING.section.md)}
    >
      <div className={LAYOUT.containerMd}>
        <Reveal className="mb-6 text-center sm:mb-8 lg:text-left">
          <Overline className="text-primary mb-3 block">FAQ</Overline>
          <Display size="sm" className="leading-[0.92]">
            Common questions
          </Display>
        </Reveal>

        {hasFaq ? (
          <div className="divide-border/60 divide-y border-y">
            {content.faq.map((item) => (
              <FaqItem key={item.id} question={item.question} answer={item.answer} />
            ))}
          </div>
        ) : (
          <Text muted>FAQ content will appear once configured in settings.</Text>
        )}
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="touch-target flex w-full items-start justify-between gap-4 py-5 text-left sm:py-6"
        aria-expanded={open}
      >
        <span className="font-medium tracking-tight sm:text-lg">{question}</span>
        <ChevronDown
          className={cn(
            "text-muted-foreground mt-1 size-4 shrink-0 transition-transform duration-300",
            open && "rotate-180",
          )}
          strokeWidth={1.5}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <Text size="sm" muted className="pb-5 leading-relaxed sm:pb-6">
            {answer}
          </Text>
        </div>
      </div>
    </div>
  );
}
