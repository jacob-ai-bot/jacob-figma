import {
  Bold,
  Divider,
  Text,
  Link,
  IconControlChevronDown8,
  IconControlChevronUp8,
} from "@create-figma-plugin/ui";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h, ComponentChildren, Fragment } from "preact";
import { useState } from "preact/hooks";

interface SectionProps {
  label: string;
  linkLabel?: string;
  href?: string;
  isCollapsable?: boolean;
  children: ComponentChildren;
}

export function Section({
  label,
  linkLabel,
  href,
  isCollapsable = false,
  children,
}: SectionProps) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

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
          <div
            className={isCollapsable ? "cursor-pointer" : "hidden"}
            onClick={toggleCollapsed}
          >
            {collapsed ? (
              <IconControlChevronUp8 />
            ) : (
              <IconControlChevronDown8 />
            )}
          </div>
        </div>
        {!collapsed && children}
      </div>
      <Divider />
    </Fragment>
  );
}
