import { render, useWindowResize } from "@create-figma-plugin/ui";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { h } from "preact";
import "!./output.css";
import { emit } from "@create-figma-plugin/utilities";

import { ResizeWindowHandler } from "./types";

function Plugin() {
  function onWindowResize(windowSize: { width: number; height: number }) {
    emit<ResizeWindowHandler>("RESIZE_WINDOW", windowSize);
  }
  useWindowResize(onWindowResize, {
    maxHeight: 800,
    maxWidth: 500,
    minHeight: 300,
    minWidth: 200,
    resizeBehaviorOnDoubleClick: "minimize",
  });
  return (
    <div className="flex flex-col gap-2 p-2">
      <h1 class="text-3xl font-bold underline">Hello, World!</h1>
    </div>
  );
}

export default render(Plugin);
