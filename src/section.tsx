import { Bold, Divider, Text, Link } from "@create-figma-plugin/ui";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h, ComponentChildren, Fragment } from "preact";

interface SectionProps {
  label: string;
  linkLabel?: string;
  href?: string;
  children: ComponentChildren;
}

export function Section({ label, linkLabel, href, children }: SectionProps) {
  return (
    <Fragment>
      <div className="flex flex-col px-4 pt-4 pb-3 gap-y-3">
        <div className="flex flex-row justify-between items-center">
          <Text>
            <Bold>{label}</Bold>
          </Text>
          {linkLabel && href && (
            <Link href={href} target="_blank">
              {linkLabel}
            </Link>
          )}
        </div>
        {children}
      </div>
      <Divider />
    </Fragment>
  );
}
