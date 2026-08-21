"use client";

import { useEffect, useState } from "react";

/**
 * Tracks which section id sits just below the sticky nav using a thin
 * IntersectionObserver trigger line (not a scroll handler — avoids scroll
 * churn per performance rules). A bottom-sentinel forces the last section
 * active once the page is scrolled all the way down, since a short final
 * section may never cross the trigger line on its own.
 */
export function useScrollSpy(sectionIds: string[], topOffsetPx: number): string | undefined {
  const [activeId, setActiveId] = useState<string | undefined>(sectionIds[0]);

  useEffect(() => {
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const triggerLineHeight = 48;
    const bottomMargin = Math.max(window.innerHeight - topOffsetPx - triggerLineHeight, 0);

    const lineObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length === 0) return;

        const topMost = visible.reduce((closest, entry) =>
          entry.boundingClientRect.top < closest.boundingClientRect.top ? entry : closest,
        );
        setActiveId(topMost.target.id);
      },
      { rootMargin: `-${topOffsetPx}px 0px -${bottomMargin}px 0px`, threshold: 0 },
    );
    elements.forEach((el) => lineObserver.observe(el));

    const lastElement = elements[elements.length - 1];
    const bottomSentinel = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setActiveId(lastElement.id);
      },
      { threshold: 1 },
    );
    bottomSentinel.observe(lastElement);

    return () => {
      lineObserver.disconnect();
      bottomSentinel.disconnect();
    };
  }, [sectionIds, topOffsetPx]);

  return activeId;
}
