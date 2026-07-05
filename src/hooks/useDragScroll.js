import { useRef, useCallback, useEffect } from "react";

/**
 * Custom hook that adds smooth card-by-card horizontal dragging to a scroll container.
 * Snaps to the nearest/next card on release and prevents native image/link dragging.
 *
 * @param {Object} options
 * @param {React.RefObject} [options.externalRef] - Optional external ref to use instead of creating one
 * @param {number} [options.dragThreshold=8] - Minimum px to move before activating drag
 */
export default function useDragScroll({ externalRef = null, dragThreshold = 8 } = {}) {
  const internalRef = useRef(null);
  const scrollRef = externalRef || internalRef;

  const state = useRef({
    isDown: false,
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
    snapTimeout: null,
  });

  const onMouseDown = useCallback((e) => {
    // Only left click
    if (e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;

    // Clear any pending snap timeouts
    if (state.current.snapTimeout) {
      clearTimeout(state.current.snapTimeout);
      state.current.snapTimeout = null;
    }

    state.current.isDown = true;
    state.current.isDragging = false;
    state.current.startX = e.pageX;
    state.current.scrollLeft = el.scrollLeft;

    el.classList.add("drag-scroll-active");
  }, [scrollRef]);

  const onMouseMove = useCallback((e) => {
    if (!state.current.isDown) return;
    const el = scrollRef.current;
    if (!el) return;

    const x = e.pageX;
    const deltaX = x - state.current.startX;

    // Activate drag mode after crossing threshold
    if (!state.current.isDragging && Math.abs(deltaX) > dragThreshold) {
      state.current.isDragging = true;
      el.classList.add("drag-scroll-grabbing");
      el.classList.add("drag-scroll-no-snap"); // Temporarily disable snap during drag
    }

    if (state.current.isDragging) {
      el.scrollLeft = state.current.scrollLeft - deltaX;
    }
  }, [scrollRef, dragThreshold]);

  const onMouseUp = useCallback((e) => {
    const el = scrollRef.current;
    if (!el) return;

    const wasDragging = state.current.isDragging;
    const startX = state.current.startX;
    const initialScrollLeft = state.current.scrollLeft;

    state.current.isDown = false;
    state.current.isDragging = false;

    el.classList.remove("drag-scroll-active", "drag-scroll-grabbing");

    if (wasDragging) {
      const deltaX = e.pageX - startX;
      
      // Calculate child/card width including gap
      let cardWidth = el.firstElementChild ? el.firstElementChild.offsetWidth : 240;
      if (el.children.length > 1) {
        cardWidth = el.children[1].offsetLeft - el.children[0].offsetLeft;
      }

      // Calculate the starting card index based on scroll position before drag
      const startIndex = Math.round(initialScrollLeft / cardWidth);
      
      // Determine target card index
      let targetIndex = startIndex;
      const dragPercent = Math.abs(deltaX) / cardWidth;

      if (dragPercent > 0.15) {
        // If dragged more than 15% of card width, move to next/prev card
        if (deltaX < 0) {
          targetIndex = startIndex + 1;
        } else {
          targetIndex = startIndex - 1;
        }
      }

      // Bounds check targetIndex
      const maxIndex = el.children.length - 1;
      targetIndex = Math.max(0, Math.min(maxIndex, targetIndex));

      // Smooth scroll to target card
      const targetScrollLeft = targetIndex * cardWidth;
      el.scrollTo({
        left: targetScrollLeft,
        behavior: "smooth",
      });

      // Keep snap disabled during smooth scrolling, re-enable once animation completes
      state.current.snapTimeout = setTimeout(() => {
        el.classList.remove("drag-scroll-no-snap");
      }, 400);

      // Prevent click navigation on children after drag
      const preventClick = (eClick) => {
        eClick.preventDefault();
        eClick.stopPropagation();
      };
      el.addEventListener("click", preventClick, { capture: true, once: true });
    } else {
      el.classList.remove("drag-scroll-no-snap");
    }
  }, [scrollRef]);

  const onMouseLeave = useCallback((e) => {
    if (state.current.isDown) {
      onMouseUp(e);
    }
  }, [onMouseUp]);

  // Prevent default HTML5 drag-and-drop behavior on images/links
  const onDragStart = useCallback((e) => {
    e.preventDefault();
  }, []);

  // Prevent text selection during active drag
  const onSelectStart = useCallback((e) => {
    if (state.current.isDown || state.current.isDragging) {
      e.preventDefault();
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.current.snapTimeout) {
        clearTimeout(state.current.snapTimeout);
      }
      const el = scrollRef.current;
      if (el) {
        el.classList.remove("drag-scroll-active", "drag-scroll-grabbing", "drag-scroll-no-snap");
      }
    };
  }, [scrollRef]);

  const handlers = {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseLeave,
    onDragStart,
    onSelectStart,
  };

  return {
    dragRef: scrollRef,
    handlers,
  };
}
