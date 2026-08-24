import React from 'react';
import classNames from 'classnames';

/**
 * Layout primitives that own page rhythm so pages stay consistent.
 * Vertical spacing is fluid (clamp) and varies by `space`.
 */

type Space = 'sm' | 'md' | 'lg';

const spaceClass: Record<Space, string> = {
  sm: 'py-[clamp(2.5rem,5vw,4rem)]',
  md: 'py-[clamp(3.5rem,7vw,6rem)]',
  lg: 'py-[clamp(4.5rem,9vw,8rem)]',
};

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  /** Tint the section background with the subtle surface token */
  surface?: boolean;
  space?: Space;
  children: React.ReactNode;
}

export function Section({ surface, space = 'md', className, children, ...props }: SectionProps) {
  return (
    <section
      className={classNames(spaceClass[space], surface && 'bg-surface', className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function Container({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={classNames('container', className)}>{children}</div>;
}

/** A single small tracked kicker. Used sparingly, never above every heading. */
export function Eyebrow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={classNames(
        'inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent',
        className,
      )}
    >
      {children}
    </span>
  );
}
