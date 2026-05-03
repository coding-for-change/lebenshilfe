import { Button } from "@react-email/components";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
};

export function BrandButton({ href, children }: Props) {
  return (
    <Button
      href={href}
      style={style}
    >
      {children}
    </Button>
  );
}

const style = {
  backgroundColor: "#000000",
  color: "#FFFFFF",
  fontSize: "16px",
  fontWeight: 600,
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
  borderRadius: "10px",
  letterSpacing: "-0.005em",
  lineHeight: "1",
};
