import { useEffect, useRef } from "react";
import type {
  CSSProperties,
  KeyboardEvent,
  PointerEvent,
  ReactElement,
} from "react";
import DragIcon from "@mui/icons-material/DragIndicator";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { CONFIG, NO_OFFSET, type Offset, type PanelId } from "../stores/config";

/** How much of a panel stays in the window at the right and at the bottom, so that it is not lost */
const KEEP = 56;

/** How far the arrow keys move a panel, and the arrow keys with shift */
const STEP = 16;
const BIG_STEP = 64;

const KEYS: Record<string, (step: number) => Offset> = {
  ArrowLeft: (step) => ({ x: -step, y: 0 }),
  ArrowRight: (step) => ({ x: step, y: 0 }),
  ArrowUp: (step) => ({ x: 0, y: -step }),
  ArrowDown: (step) => ({ x: 0, y: step }),
};

const transformOf = ({ x, y }: Offset): string | undefined =>
  x || y ? `translate(${x}px, ${y}px)` : undefined;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * The offset which keeps the panel where its grip can be reached: the grip is at its top
 * left, so the top and the left edges stay in the window, and so does a part of the
 * panel at the right and at the bottom. `shown` is the offset the panel has now, which
 * is in the place it is measured at.
 */
const keptInWindow = (
  element: HTMLElement | null,
  shown: Offset,
  wanted: Offset
): Offset => {
  if (!element) return wanted;
  const rect = element.getBoundingClientRect();
  const left = rect.left - shown.x;
  const top = rect.top - shown.y;
  return {
    x: clamp(wanted.x, -left, window.innerWidth - KEEP - left),
    y: clamp(wanted.y, -top, window.innerHeight - KEEP - top),
  };
};

interface Movable {
  /** For the element of the panel */
  ref: React.RefObject<HTMLDivElement | null>;
  /** For the element of the panel: where it was moved to, and above the others when it was used last */
  style: CSSProperties;
  /** The handle which moves the panel, to put in its header */
  grip: ReactElement;
}

/**
 * Lets the user move a panel, where it is over the drawing. The panel keeps its place in the
 * layout and is shifted from it, so putting it back is dropping the shift. It is moved with the
 * handle by a pointer, a pen or a finger, or with the arrow keys (shift for larger steps), and
 * a double click on the handle puts it back. The shift is kept in the store, so the panel keeps
 * it when it is shown again.
 *
 * While the handle is dragged the element is moved directly, and the store is told when the
 * pointer is released: the panel is not drawn again for every move of the pointer.
 */
export const useMovable = (id: PanelId, label: string): Movable => {
  const ref = useRef<HTMLDivElement>(null);
  const stored = CONFIG.panelOffsets[id];
  /** The shift the element has now, which is the stored one except while it is dragged */
  const shownRef = useRef<Offset>(stored);
  const dragRef = useRef<{
    pointer: number;
    x: number;
    y: number;
    from: Offset;
  } | null>(null);

  useEffect(() => {
    shownRef.current = stored;
  }, [stored]);

  // The window gets smaller: the panel does not stay out of it
  useEffect(() => {
    const keep = () => {
      const next = keptInWindow(ref.current, shownRef.current, shownRef.current);
      if (next.x === shownRef.current.x && next.y === shownRef.current.y) return;
      shownRef.current = next;
      CONFIG.panelOffsets = { ...CONFIG.panelOffsets, [id]: next };
    };
    window.addEventListener("resize", keep);
    return () => window.removeEventListener("resize", keep);
  }, [id]);

  /** Show the shift at once, and tell the store when it is final */
  const place = (offset: Offset, final: boolean): void => {
    shownRef.current = offset;
    if (ref.current && !final)
      ref.current.style.transform = transformOf(offset) ?? "";
    if (final) CONFIG.panelOffsets = { ...CONFIG.panelOffsets, [id]: offset };
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>): void => {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointer: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      from: shownRef.current,
    };
    CONFIG.frontPanel = id;
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>): void => {
    const start = dragRef.current;
    if (!start || start.pointer !== event.pointerId) return;
    place(
      keptInWindow(ref.current, shownRef.current, {
        x: start.from.x + event.clientX - start.x,
        y: start.from.y + event.clientY - start.y,
      }),
      false
    );
  };

  const onPointerEnd = (event: PointerEvent<HTMLElement>): void => {
    if (dragRef.current?.pointer !== event.pointerId) return;
    dragRef.current = null;
    place(shownRef.current, true);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === "Home") {
      event.preventDefault();
      place(NO_OFFSET, true);
      return;
    }
    const move = KEYS[event.key];
    if (!move) return;
    event.preventDefault();
    const by = move(event.shiftKey ? BIG_STEP : STEP);
    CONFIG.frontPanel = id;
    place(
      keptInWindow(ref.current, shownRef.current, {
        x: shownRef.current.x + by.x,
        y: shownRef.current.y + by.y,
      }),
      true
    );
  };

  const grip = (
    <Tooltip
      title={`Move the ${label}: drag it, or use the arrow keys. Double click puts it back.`}
      disableTouchListener>
      <IconButton
        size="small"
        aria-label={`Move the ${label}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
        onDoubleClick={() => place(NO_OFFSET, true)}
        sx={{
          cursor: "grab",
          touchAction: "none",
          userSelect: "none",
          "&:active": { cursor: "grabbing" },
        }}>
        <DragIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );

  return {
    ref,
    style: {
      transform: transformOf(stored),
      zIndex: CONFIG.frontPanel === id ? 2 : undefined,
    },
    grip,
  };
};
