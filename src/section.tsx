import { Bold, Divider, Text } from "@create-figma-plugin/ui";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h, ComponentChildren, Fragment } from "preact";

interface SectionProps {
  label: string;
  children: ComponentChildren;
}

export function Section({ label, children }: SectionProps) {
  return (
    <Fragment>
      <div className="flex flex-col px-4 pt-4 pb-3 gap-y-3">
        <Text>
          <Bold>{label}</Bold>
        </Text>
        {children}
      </div>
      <Divider />
    </Fragment>
  );
}
