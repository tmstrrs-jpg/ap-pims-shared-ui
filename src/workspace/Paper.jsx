// W6a · a static sheet of paper for the phone: full width, no dragging, no floating (the desk's floating papers
// need react-rnd and motion, which the phone does not use). The heading is the paper's name; no label above it.
import { useId } from "react";

export default function Paper({ title, children, className = "", testId }) {
  const id = useId();
  return (
    <article className={`ws-paper ws-paper-phone ${className}`.trim()} aria-labelledby={`${id}-t`} data-testid={testId}>
      <h1 id={`${id}-t`}>{title}</h1>
      {children}
    </article>
  );
}
