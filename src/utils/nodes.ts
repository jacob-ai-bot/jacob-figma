import convertNodeToTailwind from "./css_converter";

interface SimplifiedText {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: string;
  color?: string;
}

interface SimplifiedLayout {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  display?: string;
  flexDirection?: string;
  flexWrap?: string;
  justifyContent?: string;
  alignItems?: string;
  position?: string;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  zIndex?: number;
  objectFit?: string;
  objectPosition?: string;
  overflow?: string;
  visibility?: string;
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  primaryAxisSizingMode?: string;
}

interface SimplifiedStyle {
  backgroundColor?: string;
  borderStyle?: string;
  borderColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  boxShadow?: string;
  opacity?: number;
  //   transform?: string; // Not sure if we need this or not. If not, maybe find a way to remove the defaults as it is taking up a lot of space
  transition?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

interface SimplifiedSvg {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

interface SimplifiedImage {
  imageHash?: string;
}

export interface SimplifiedNode {
  id: string;
  name: string;
  type: string;
  layout: SimplifiedLayout;
  style: SimplifiedStyle;
  svg: SimplifiedSvg;
  image: SimplifiedImage;
  text: SimplifiedText;
  copy: string;
  tailwind: string;
  css: string;
  children?: Partial<SimplifiedNode>[];
  components?: Partial<SimplifiedNode>[];
}

/**
 * simplifyNode function
 *
 * The main function that will be called with a Figma node as input.
 * Depending on the type of the input node, it will dispatch to the corresponding handler function.
 * It also takes care of setting up the common properties of the simplified node.
 */

// function simplifyNode(node: SceneNode): SimplifiedNode

/**
 * handleLayout function
 *
 * This function will handle the layout-related properties of the node.
 * It will derive these properties from the `absoluteBoundingBox` property of the input node.
 */

// function handleLayout(node: SceneNode): Partial<SimplifiedNode['layout']>

/**
 * handleStyle function
 *
 * This function will handle the style-related properties of the node.
 * It will derive these properties from the `fills`, `strokes`, `effects`, and `style` properties of the input node.
 */

// function handleStyle(node: SceneNode): Partial<SimplifiedNode['style']>

/**
 * handleText function
 *
 * This function will handle the text-related properties of the node.
 * It will only be called if the node type is `TEXT`.
 * It will derive these properties from the `style` property of the input node.
 */

// function handleText(node: SceneNode): Partial<SimplifiedNode['style']>

/**
 * handleSvg function
 *
 * This function will handle the SVG-related properties of the node.
 * It will only be called if the node type is one of `VECTOR`, `BOOLEAN_OPERATION`, `STAR`, `LINE`, `ELLIPSE`, or `REGULAR_POLYGON`.
 * It will derive these properties from the `fills` and `strokes` properties of the input node.
 */

// function handleSvg(node: SceneNode): Partial<SimplifiedNode['svg']>

/**
 * handleInteractivity function
 *
 * This function will handle the interactivity-related properties of the node.
 * These properties are not directly available in the Figma node and might need to be derived from other properties or added manually based on the use case.
 */

// function handleInteractivity(node: SceneNode): Partial<SimplifiedNode['interactivity']>

/**
 * handleChildren function
 *
 * This function will handle the children of the node.
 * It will recursively call the `simplifyNode` function for each child and return the resulting simplified nodes.
 */

// function handleChildren(node: SceneNode): SimplifiedNode[]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function removeAllUndefinedProperties(obj: any) {
  // remove all the undefined properties from each base key
  Object.keys(obj).forEach((key) => obj[key] === undefined && delete obj[key]);

  obj.layout && removeAllUndefinedProperties(obj.layout);
  obj.style && removeAllUndefinedProperties(obj.style);
  obj.svg && removeAllUndefinedProperties(obj.svg);
  obj.text && removeAllUndefinedProperties(obj.text);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj.children?.forEach((child: any) => {
    removeAllUndefinedProperties(child);
  });
}

export function getComponentSets(
  node: Partial<SimplifiedNode>,
): Partial<SimplifiedNode>[] {
  const componentNodes: Partial<SimplifiedNode>[] = [];
  if (node.type === "COMPONENT_SET") {
    componentNodes.push(node);
  }
  if (node.children) {
    for (const child of node.children) {
      componentNodes.push(...getComponentSets(child));
    }
  }
  return componentNodes;
}

export function getComponentNodes(
  node: Partial<SimplifiedNode>,
): Partial<SimplifiedNode>[] {
  const componentNodes: Partial<SimplifiedNode>[] = [];
  if (node.type === "COMPONENT") {
    componentNodes.push(node);
  }
  if (node.children) {
    for (const child of node.children) {
      componentNodes.push(...getComponentNodes(child));
    }
  }
  return componentNodes;
}

const getRandomId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export function simplifyNode(node: SceneNode): Partial<SimplifiedNode> {
  // if the node's visibility is set to false, return undefined
  if (node.visible === false) {
    return {};
  }

  const simplifiedNode: Partial<SimplifiedNode> = {
    id: getRandomId(),
    name: node.name,
    type: node.type,
    layout: handleLayout(node),
    style: handleStyle(node as VectorNode | RectangleNode),
    svg: node.type === "VECTOR" ? handleSvg(node) : undefined,
    text: node.type === "TEXT" ? handleText(node) : undefined,
    copy: node.type === "TEXT" ? handleCopy(node) : undefined,
    image: handleImage(node as VectorNode | RectangleNode),
    ...convertNodeToTailwind(node),
    children: handleChildren(node),
  };

  // remove all of the undefined properties for simplifiedNode and its children
  removeAllUndefinedProperties(simplifiedNode);

  return simplifiedNode;
}
function round(num: number | undefined): number | undefined {
  if (num === undefined) {
    return undefined;
  }
  if (typeof num !== "number") {
    return undefined;
  }
  if (num % 1 === 0) {
    return num;
  } else {
    return Math.round(num * 10) / 10;
  }
}
function handleLayout(node: Partial<SceneNode>): Partial<SimplifiedLayout> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const _node = node as any;
  const layout: Partial<SimplifiedLayout> = {
    x: round(node.absoluteBoundingBox?.x),
    y: round(node.absoluteBoundingBox?.y),
    width: round(node.absoluteBoundingBox?.width),
    height: round(node.absoluteBoundingBox?.height),
    padding: round(_node?.padding),
    paddingTop: round(_node?.paddingTop),
    paddingRight: round(_node?.paddingRight),
    paddingBottom: round(_node?.paddingBottom),
    paddingLeft: round(_node?.paddingLeft),
    primaryAxisSizingMode: _node?.primaryAxisSizingMode,
    counterAxisAlignItems: _node?.counterAxisAlignItems,
    primaryAxisAlignItems: _node?.primaryAxisAlignItems,
  };
  return layout;
}

export function rgbToHex(rgb: RGB) {
  if (!rgb) return undefined;
  if (rgb.r === undefined || rgb.g === undefined || rgb.b === undefined) {
    return undefined;
  }
  if (
    typeof rgb.r !== "number" ||
    typeof rgb.g !== "number" ||
    typeof rgb.b !== "number"
  ) {
    console.log("rgbToHex: rgb values are not numbers", rgb);
    return undefined;
  }
  // Convert the RGB values to the range 0-255.
  const r = Math.round(rgb.r * 255);
  const g = Math.round(rgb.g * 255);
  const b = Math.round(rgb.b * 255);

  // Convert the RGB values to a hex string and return it.
  return (
    "#" +
    r.toString(16).padStart(2, "0") +
    g.toString(16).padStart(2, "0") +
    b.toString(16).padStart(2, "0")
  );
}

function getShadow(
  shadowType:
    | "DROP_SHADOW"
    | "INNER_SHADOW"
    | "LAYER_BLUR"
    | "BACKGROUND_BLUR"
    | undefined,
): string | undefined {
  if (!shadowType) return undefined;
  switch (shadowType) {
    case "DROP_SHADOW":
      return "0px 4px 4px rgba(0, 0, 0, 0.25)";
    case "INNER_SHADOW":
      return "inset 0px 4px 4px rgba(0, 0, 0, 0.25)";
    case "LAYER_BLUR":
      return "0px 4px 4px rgba(0, 0, 0, 0.25)";
    case "BACKGROUND_BLUR":
      return "0px 4px 4px rgba(0, 0, 0, 0.25)";
    default:
      return undefined;
  }
}

function handleStyle(
  node: VectorNode | RectangleNode,
): Partial<SimplifiedStyle> {
  const fill = node.fills instanceof Array ? node.fills[0] : undefined;
  const fillColor = fill?.type === "SOLID" ? rgbToHex(fill?.color) : undefined;
  const stroke = node.strokes ? node.strokes[0] : undefined;
  const effect = node.effects ? node.effects[0] : undefined;
  const style: SimplifiedStyle = {
    backgroundColor: fill?.type === "SOLID" ? fillColor : undefined,
    borderStyle: stroke?.type === "SOLID" ? "solid" : undefined,
    borderColor: stroke?.type === "SOLID" ? rgbToHex(stroke.color) : undefined,
    borderRadius: round(node.cornerRadius as number),
    borderWidth: round(node.strokeWeight as number),
    boxShadow: getShadow(effect?.type),
    opacity: round(node.opacity),
    // transform: JSON.stringify(node.relativeTransform),
    fill: fillColor,
    stroke: stroke?.type === "SOLID" ? rgbToHex(stroke.color) : undefined,
    strokeWidth: round(node.strokeWeight as number),
  };
  return style;
}

function handleImage(
  node: VectorNode | RectangleNode,
): SimplifiedImage | undefined {
  const fill = node.fills instanceof Array ? node.fills[0] : undefined;
  if (fill?.type === "IMAGE") {
    return {
      imageHash: fill.imageHash,
    } as SimplifiedImage;
  }
  return undefined;
}

function handleText(node: TextNode): Partial<SimplifiedText> {
  const lineHeight = node.lineHeight as LineHeight;
  const fill = node.fills instanceof Array ? node.fills[0] : undefined;
  const fillColor = fill?.type === "SOLID" ? rgbToHex(fill?.color) : undefined;
  const letterSpacing = node.letterSpacing as LetterSpacing;
  const fontName = node.fontName as FontName;
  const fontSize = node.fontSize as number;
  const text: Partial<SimplifiedText> = {
    fontFamily: fontName?.family as string,
    fontSize: fontSize ? (fontSize as number) : undefined,
    fontWeight: fontName?.style?.includes("Bold") ? "bold" : undefined,
    fontStyle: fontName?.style,
    lineHeight:
      lineHeight?.unit === "AUTO"
        ? undefined
        : round(lineHeight?.value as number),
    letterSpacing: letterSpacing
      ? round((letterSpacing as LetterSpacing).value as number)
      : undefined,
    textAlign: node.textAlignHorizontal as string,
    color: fillColor,
  };
  return text;
}

// need a function to get the actual text content (or copy) of a text node
function handleCopy(node: TextNode): string {
  return node.characters;
}

function handleSvg(node: VectorNode): Partial<SimplifiedNode["svg"]> {
  const stroke = node.strokes ? node.strokes[0] : undefined;
  const fill = node.fills instanceof Array ? node.fills[0] : undefined;
  const svg: Partial<SimplifiedSvg> = {
    fill: fill?.type === "SOLID" ? rgbToHex(fill?.color) : undefined,
    stroke: stroke?.type === "SOLID" ? rgbToHex(stroke.color) : undefined,
    strokeWidth: round(node.strokeWeight as number),
  };
  return svg;
}

function handleChildren(
  node: SceneNode,
): Partial<SimplifiedNode>[] | undefined {
  const _node = node as BaseNodeMixin & ChildrenMixin;
  if (!_node.children) return undefined;
  return _node.children?.map((child) => simplifyNode(child as SceneNode)) || [];
}

export function orderNodesByHorizontalPosition(
  updatedNode: Partial<SimplifiedNode>,
): Partial<SimplifiedNode> {
  if (!updatedNode.children) return updatedNode;

  updatedNode.children.sort((a, b) => {
    const aX = a.layout?.x || 0;
    const bX = b.layout?.x || 0;
    return aX - bX;
  });

  updatedNode.children.forEach((child) => {
    orderNodesByHorizontalPosition(child);
  });

  return updatedNode;
}

export function orderNodesByVerticalPosition(
  updatedNode: Partial<SimplifiedNode>,
): Partial<SimplifiedNode> {
  if (!updatedNode.children) return updatedNode;

  updatedNode.children.sort((a, b) => {
    const aY = a.layout?.y || 0;
    const bY = b.layout?.y || 0;
    if (aY !== bY) {
      return aY - bY;
    } else {
      const aX = a.layout?.x || 0;
      const bX = b.layout?.x || 0;
      return aX - bX;
    }
  });

  updatedNode.children.forEach((child) => {
    orderNodesByVerticalPosition(child);
  });

  return updatedNode;
}

export function updateCoordinatesRelativeToParent(
  node: Partial<SimplifiedNode>,
  parent: Partial<SimplifiedNode> | null = null,
  parentX: number = 0,
  parentY: number = 0,
): Partial<SimplifiedNode> | undefined {
  if (!node) return undefined;
  if (!node.layout) return undefined;
  const updatedNode = { ...node };
  let _parentX = parentX;
  let _parentY = parentY;
  if (!parent) {
    parent = { ...node };
    _parentX = parent?.layout?.x || 0;
    _parentY = parent?.layout?.y || 0;
  }

  // Update the x and y coordinates of the current node
  if (!updatedNode.layout) {
    updatedNode.layout = {};
  }
  updatedNode.layout.x = roundCoor((updatedNode.layout.x || 0) - _parentX);
  updatedNode.layout.y = roundCoor((updatedNode.layout.y || 0) - _parentY);

  // Recursively update coordinates of children nodes
  if (updatedNode.children) {
    updatedNode.children = updatedNode.children
      .filter((child) => child)
      .map((child) =>
        updateCoordinatesRelativeToParent(
          child,
          { ...parent },
          _parentX,
          _parentY,
        ),
      )
      .filter((child) => !!child) as Partial<SimplifiedNode>[];
  }

  const orderedNode = orderNodesByVerticalPosition(updatedNode);

  return orderedNode;
}

function roundCoor(num: number): number {
  const roundedNum = Math.round(num * 10) / 10;
  if (roundedNum % 1 === 0) {
    return Math.round(roundedNum);
  } else {
    return roundedNum;
  }
}

export const getDescriptionOfNode = (
  node: Partial<SimplifiedNode>,
  tailwind: boolean,
  indent = "",
) => {
  if (!node) return "";
  // if the type is a component set, set a flag
  const isComponentSet = node.type === "COMPONENT_SET";
  let description = "";
  description += `${indent}- ${node.name} (${
    node.image ? `IMAGE SRC: images/${node.image.imageHash}.jpg` : node.type
  })`;

  description += `\n${indent}\t(${node.layout?.x}, ${node.layout?.y}) ${
    isComponentSet ? "" : (tailwind ? node.tailwind : node.css) ?? ""
  }`;
  if (node.copy) {
    description += `\n${indent}\t${node.copy}`;
  }
  if (node.children) {
    for (const child of node.children) {
      description += `\n${getDescriptionOfNode(
        child,
        tailwind,
        indent + "\t",
      )}`;
    }
  }
  return description;
};

export default simplifyNode;

export function sum(a: number, b: number): number {
  return a + b;
}
