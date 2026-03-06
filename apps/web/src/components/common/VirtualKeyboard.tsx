import { useState, useEffect, useRef, useCallback } from 'react';
import Keyboard from 'react-simple-keyboard';
import 'react-simple-keyboard/build/css/index.css';
import { X, Minimize2, Maximize2, GripHorizontal, Smile } from 'lucide-react';

// Emoji categories
const EMOJI_CATEGORIES: Record<string, string[]> = {
  'Smileys': [
    '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊',
    '😇','🥰','😍','🤩','😘','😗','😚','😙','🥲','😋',
    '😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🫡',
    '😐','😑','😶','🫥','😏','😒','🙄','😬','🤥','😌',
    '😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥵',
    '🥶','🥴','😵','🤯','🤠','🥳','🥸','😎','🤓','🧐',
  ],
  'Gestures': [
    '👋','🤚','🖐','✋','🖖','🫱','🫲','🫳','🫴','👌',
    '🤌','🤏','✌','🤞','🫰','🤟','🤘','🤙','👈','👉',
    '👆','🖕','👇','☝','🫵','👍','👎','✊','👊','🤛',
    '🤜','👏','🙌','🫶','👐','🤲','🤝','🙏','💪','🦾',
  ],
  'Hearts': [
    '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔',
    '❤️‍🔥','❤️‍🩹','💕','💞','💓','💗','💖','💘','💝','💟',
    '♥','💌','🫀','🩷','🩵','🩶',
  ],
  'Animals': [
    '🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯',
    '🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆',
    '🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛',
    '🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷',
  ],
  'Food': [
    '🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈',
    '🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🌮',
    '🍕','🍔','🍟','🌭','🍿','🧁','🍰','🎂','🍩','🍪',
  ],
  'Objects': [
    '⭐','🌟','✨','💫','🔥','💥','🎉','🎊','🏆','🥇',
    '🎯','🎮','🎲','🧩','🎨','🎭','🎬','🎤','🎧','🎵',
    '🎶','💡','📱','💻','⌨','🖥','📷','📸','🔑','🏠',
  ],
};

type KeyboardSize = 'sm' | 'md' | 'lg';

const SIZE_SCALES: Record<KeyboardSize, { scale: number; label: string }> = {
  sm: { scale: 0.75, label: 'S' },
  md: { scale: 1, label: 'M' },
  lg: { scale: 1.25, label: 'L' },
};

export function VirtualKeyboard() {
  const [visible, setVisible] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [size, setSize] = useState<KeyboardSize>('md');
  const [position, setPosition] = useState({ x: 0, y: -1 }); // -1 = not set yet
  const [layoutName, setLayoutName] = useState('default');
  const [emojiCategory, setEmojiCategory] = useState('Smileys');

  const keyboardRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Center keyboard on first show
  const initPosition = useCallback(() => {
    if (position.y === -1) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const kbWidth = 600 * SIZE_SCALES[size].scale;
      setPosition({
        x: Math.max(0, (width - kbWidth) / 2),
        y: height - 380 * SIZE_SCALES[size].scale - 20,
      });
    }
  }, [position.y, size]);

  // Listen for focus/blur on input/textarea elements
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        // Skip password and hidden fields
        if (target instanceof HTMLInputElement &&
            (target.type === 'password' || target.type === 'hidden' || target.type === 'file' || target.type === 'checkbox' || target.type === 'radio')) {
          return;
        }
        // Don't show for react-simple-keyboard's own input
        if (target.closest('.simple-keyboard')) return;

        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
        activeInputRef.current = target;
        setVisible(true);
        initPosition();
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      // Delay hide to allow clicking keyboard buttons
      hideTimeoutRef.current = setTimeout(() => {
        // Check if the new active element is inside the keyboard
        const active = document.activeElement;
        if (active && containerRef.current?.contains(active)) return;
        // Keep visible if clicking on keyboard area
        activeInputRef.current = null;
        setVisible(false);
        setShowEmoji(false);
      }, 200);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [initPosition]);

  // Handle keyboard key press
  const onKeyPress = useCallback((button: string) => {
    const input = activeInputRef.current;
    if (!input) return;

    if (button === '{shift}' || button === '{lock}') {
      setLayoutName((prev) => (prev === 'default' ? 'shift' : 'default'));
      return;
    }
    if (button === '{numbers}') {
      setLayoutName('numbers');
      return;
    }
    if (button === '{abc}') {
      setLayoutName('default');
      return;
    }

    // Focus back on the input
    input.focus();

    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;

    if (button === '{bksp}') {
      if (start === end && start > 0) {
        const newVal = input.value.slice(0, start - 1) + input.value.slice(end);
        setNativeValue(input, newVal);
        input.setSelectionRange(start - 1, start - 1);
      } else if (start !== end) {
        const newVal = input.value.slice(0, start) + input.value.slice(end);
        setNativeValue(input, newVal);
        input.setSelectionRange(start, start);
      }
    } else if (button === '{enter}') {
      if (input instanceof HTMLTextAreaElement) {
        const newVal = input.value.slice(0, start) + '\n' + input.value.slice(end);
        setNativeValue(input, newVal);
        input.setSelectionRange(start + 1, start + 1);
      } else {
        // Submit form if single-line input
        const form = input.closest('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }
      }
    } else if (button === '{space}') {
      const newVal = input.value.slice(0, start) + ' ' + input.value.slice(end);
      setNativeValue(input, newVal);
      input.setSelectionRange(start + 1, start + 1);
    } else if (button === '{tab}') {
      // Do nothing for tab
    } else {
      const char = button;
      const newVal = input.value.slice(0, start) + char + input.value.slice(end);
      setNativeValue(input, newVal);
      input.setSelectionRange(start + char.length, start + char.length);
    }

    // Reset to lowercase after typing with shift (but not caps lock)
    if (layoutName === 'shift') {
      setLayoutName('default');
    }
  }, [layoutName]);

  // Insert emoji into active input
  const insertEmoji = useCallback((emoji: string) => {
    const input = activeInputRef.current;
    if (!input) return;

    input.focus();
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? input.value.length;
    const newVal = input.value.slice(0, start) + emoji + input.value.slice(end);
    setNativeValue(input, newVal);
    input.setSelectionRange(start + emoji.length, start + emoji.length);
  }, []);

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragRef.current = { startX: clientX, startY: clientY, origX: position.x, origY: position.y };

    const handleMove = (ev: MouseEvent | TouchEvent) => {
      if (!dragRef.current) return;
      const cx = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
      const cy = 'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
      const dx = cx - dragRef.current.startX;
      const dy = cy - dragRef.current.startY;
      setPosition({
        x: Math.max(0, dragRef.current.origX + dx),
        y: Math.max(0, dragRef.current.origY + dy),
      });
    };

    const handleEnd = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  }, [position]);

  // Keep keyboard on screen
  const handleClose = useCallback(() => {
    setVisible(false);
    setShowEmoji(false);
    activeInputRef.current = null;
  }, []);

  const cycleSize = useCallback(() => {
    setSize((prev) => {
      if (prev === 'sm') return 'md';
      if (prev === 'md') return 'lg';
      return 'sm';
    });
  }, []);

  if (!visible) return null;

  const scale = SIZE_SCALES[size].scale;
  const kbWidth = 600 * scale;

  return (
    <div
      ref={containerRef}
      className="fixed z-[9999]"
      style={{
        left: position.x,
        top: position.y,
        width: kbWidth,
        touchAction: 'none',
      }}
      onMouseDown={(e) => {
        // Prevent blur on the active input when clicking keyboard area
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
      }}
      onTouchStart={(e) => {
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
      }}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-800 rounded-t-xl px-3 py-1.5 select-none">
        {/* Drag handle */}
        <div
          className="flex items-center gap-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-white flex-1"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <GripHorizontal size={18} />
          <span className="text-xs">Keyboard</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Emoji toggle */}
          <button
            className={`p-1.5 rounded-lg transition-colors ${showEmoji ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
            onClick={() => setShowEmoji(!showEmoji)}
            title="Emoji"
          >
            <Smile size={16} />
          </button>

          {/* Size toggle */}
          <button
            className="px-2 py-1 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-700 transition-colors min-w-[28px]"
            onClick={cycleSize}
            title="Toggle size"
          >
            {SIZE_SCALES[size].label}
          </button>

          {/* Close */}
          <button
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
            onClick={handleClose}
            title="Close keyboard"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Keyboard or Emoji body */}
      <div
        className="bg-gray-800 rounded-b-xl shadow-2xl border border-gray-700 border-t-0 overflow-hidden"
        style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: 600 }}
      >
        {showEmoji ? (
          <div className="p-2" style={{ height: 280 }}>
            {/* Category tabs */}
            <div className="flex gap-1 mb-2 overflow-x-auto pb-1">
              {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                <button
                  key={cat}
                  className={`px-2 py-1 rounded text-xs whitespace-nowrap transition-colors ${
                    emojiCategory === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setEmojiCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            {/* Emoji grid */}
            <div className="grid grid-cols-10 gap-1 overflow-y-auto" style={{ maxHeight: 230 }}>
              {EMOJI_CATEGORIES[emojiCategory]?.map((emoji, i) => (
                <button
                  key={i}
                  className="text-2xl hover:bg-gray-700 rounded p-1 transition-colors"
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="virtual-keyboard-container">
            <Keyboard
              keyboardRef={(r: any) => (keyboardRef.current = r)}
              layoutName={layoutName}
              onKeyPress={onKeyPress}
              layout={{
                default: [
                  '` 1 2 3 4 5 6 7 8 9 0 - = {bksp}',
                  'q w e r t y u i o p [ ] \\',
                  '{lock} a s d f g h j k l ; \' {enter}',
                  '{shift} z x c v b n m , . / {shift}',
                  '{numbers} {space}',
                ],
                shift: [
                  '~ ! @ # $ % ^ & * ( ) _ + {bksp}',
                  'Q W E R T Y U I O P { } |',
                  '{lock} A S D F G H J K L : " {enter}',
                  '{shift} Z X C V B N M < > ? {shift}',
                  '{numbers} {space}',
                ],
                numbers: [
                  '1 2 3 4 5 6 7 8 9 0 {bksp}',
                  '@ # $ _ & - + ( ) /',
                  '= * " \' : ; ! ? {enter}',
                  '{abc} , . {space}',
                ],
              }}
              display={{
                '{bksp}': '⌫',
                '{enter}': '⏎',
                '{shift}': '⇧',
                '{lock}': '⇪',
                '{space}': ' ',
                '{numbers}': '123',
                '{abc}': 'ABC',
              }}
              theme="hg-theme-default hg-theme-dark"
              physicalKeyboardHighlight={false}
              physicalKeyboardHighlightPress={false}
              preventMouseDownDefault={true}
              stopMouseDownPropagation={true}
              disableCaretPositioning={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Set value on an input element and dispatch React-compatible change event.
 * React 19 overrides the value setter, so we need to use the native descriptor.
 */
function setNativeValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = element instanceof HTMLTextAreaElement
    ? HTMLTextAreaElement.prototype
    : HTMLInputElement.prototype;
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
}
