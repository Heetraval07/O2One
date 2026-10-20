/** Reveal stagger shared by every card grid: cards in the same row follow each other 90ms apart. */
export const stagger = (index, columns = 3) => (index % columns) * 90;
