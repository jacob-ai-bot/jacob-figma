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
    maxHeight: 320,
    maxWidth: 320,
    minHeight: 120,
    minWidth: 120,
    resizeBehaviorOnDoubleClick: "minimize",
  });
  return <h1 class="text-3xl font-bold underline">Hello, World!</h1>;
}

export default render(Plugin);
