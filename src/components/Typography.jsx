import React, { forwardRef } from "react";

/**
 * Global Typography System
 *
 * Base font size in the application is 14px on body (1em = 14px).
 * All typography font sizes are expressed in `em` units to ensure zero layout shift.
 *
 * - LargeHeading: 1.5em (21px), matches .page-head h1 and major titles.
 * - SubHeading:   1.143em (16px, or 1em bold when level="card"), matches modal/card headers and section titles.
 * - Body:         1em (14px), base paragraph and content text.
 * - SmallBody:    0.857em (12px), matches .small, metadata captions, and hints.
 */

export const LargeHeading = forwardRef(function LargeHeading(
  {
    as: Component = "h1",
    className = "",
    style = {},
    color,
    weight = 650,
    align,
    children,
    ...props
  },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={`text-large-heading ${className}`}
      style={{
        fontSize: "1.5em",
        fontWeight: weight,
        letterSpacing: "-0.015em",
        lineHeight: 1.25,
        margin: 0,
        textAlign: align,
        color: color ? `var(--${color}, ${color})` : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
});

export const SubHeading = forwardRef(function SubHeading(
  {
    as: Component = "h3",
    className = "",
    style = {},
    color,
    level = "medium", // 'medium' (1.143em / 16px) | 'card' (1em / 14px bold)
    weight = 600,
    align,
    children,
    ...props
  },
  ref,
) {
  const fontSize = level === "card" ? "1em" : "1.143em";
  return (
    <Component
      ref={ref}
      className={`text-sub-heading ${className}`}
      style={{
        fontSize,
        fontWeight: weight,
        lineHeight: 1.35,
        margin: 0,
        textAlign: align,
        color: color ? `var(--${color}, ${color})` : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
});

export const Body = forwardRef(function Body(
  {
    as: Component = "p",
    className = "",
    style = {},
    color,
    muted = false,
    weight,
    align,
    children,
    ...props
  },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={`text-body ${muted ? "muted" : ""} ${className}`}
      style={{
        fontSize: "1em",
        lineHeight: 1.5,
        margin: 0,
        fontWeight: weight,
        textAlign: align,
        color: muted
          ? "var(--text-muted)"
          : color
            ? `var(--${color}, ${color})`
            : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
});

export const SmallBody = forwardRef(function SmallBody(
  {
    as: Component = "span",
    className = "",
    style = {},
    color,
    muted = false,
    weight,
    align,
    children,
    ...props
  },
  ref,
) {
  return (
    <Component
      ref={ref}
      className={`text-small-body ${muted ? "muted" : ""} ${className}`}
      style={{
        fontSize: "0.857em",
        lineHeight: 1.4,
        margin: 0,
        fontWeight: weight,
        textAlign: align,
        color: muted
          ? "var(--text-muted)"
          : color
            ? `var(--${color}, ${color})`
            : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </Component>
  );
});

/** Polymorphic wrapper */
export const Text = forwardRef(function Text(
  { variant = "body", ...props },
  ref,
) {
  switch (variant) {
    case "largeHeading":
      return <LargeHeading ref={ref} {...props} />;
    case "subHeading":
      return <SubHeading ref={ref} {...props} />;
    case "smallBody":
      return <SmallBody ref={ref} {...props} />;
    case "body":
    default:
      return <Body ref={ref} {...props} />;
  }
});
