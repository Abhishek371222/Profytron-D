import React from "react";
import { cn } from "@/lib/utils";

type BrandGradientTextProps = {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "strong" | "em";
};

/** Premium teal → crimson → teal accent text (brand signature). */
export function BrandGradientText({
  children,
  className,
  as: Tag = "span",
}: BrandGradientTextProps) {
  return <Tag className={cn("brand-gradient-text", className)}>{children}</Tag>;
}

type BrandDisplayHeadingProps = {
  lead: string;
  accent: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
  accentClassName?: string;
  block?: boolean;
};

/** Split headline: solid lead + gradient accent (testimonials / auth style). */
export function BrandDisplayHeading({
  lead,
  accent,
  as: Tag = "h2",
  className,
  accentClassName,
  block = false,
}: BrandDisplayHeadingProps) {
  return (
    <Tag className={cn("brand-display-heading", className)}>
      {block ? (
        <>
          <span className="block">{lead}</span>
          <BrandGradientText className={accentClassName}>{accent}</BrandGradientText>
        </>
      ) : (
        <>
          {lead}{" "}
          <BrandGradientText className={accentClassName}>{accent}</BrandGradientText>
        </>
      )}
    </Tag>
  );
}
