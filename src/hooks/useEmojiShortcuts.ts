
import { useCallback } from 'react';

const emojiShortcuts: Record<string, string> = {
  ':smile:': '😀',
  ':grin:': '😁',
  ':joy:': '😂',
  ':rofl:': '🤣',
  ':wink:': '😉',
  ':blush:': '😊',
  ':heart:': '❤️',
  ':blue_heart:': '💙',
  ':green_heart:': '💚',
  ':yellow_heart:': '💛',
  ':purple_heart:': '💜',
  ':thumbs_up:': '👍',
  ':thumbs_down:': '👎',
  ':clap:': '👏',
  ':fire:': '🔥',
  ':100:': '💯',
  ':party:': '🎉',
  ':tada:': '🎊',
  ':cry:': '😢',
  ':sob:': '😭',
  ':angry:': '😠',
  ':rage:': '😡',
  ':thinking:': '🤔',
  ':shrug:': '🤷',
  ':facepalm:': '🤦',
  ':pizza:': '🍕',
  ':coffee:': '☕',
  ':beer:': '🍺',
  ':cake:': '🎂',
  ':rocket:': '🚀',
  ':star:': '⭐',
  ':sparkles:': '✨',
  ':rainbow:': '🌈',
  ':sun:': '☀️',
  ':moon:': '🌙'
};

export function useEmojiShortcuts() {
  const replaceShortcuts = useCallback((text: string): string => {
    let result = text;
    
    Object.entries(emojiShortcuts).forEach(([shortcut, emoji]) => {
      const regex = new RegExp(shortcut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      result = result.replace(regex, emoji);
    });
    
    return result;
  }, []);

  const getShortcutSuggestions = useCallback((text: string): Array<{ shortcut: string; emoji: string }> => {
    const lastWord = text.split(/\s/).pop() || '';
    
    if (!lastWord.startsWith(':')) return [];
    
    return Object.entries(emojiShortcuts)
      .filter(([shortcut]) => shortcut.startsWith(lastWord))
      .map(([shortcut, emoji]) => ({ shortcut, emoji }))
      .slice(0, 5);
  }, []);

  return {
    replaceShortcuts,
    getShortcutSuggestions,
    shortcuts: emojiShortcuts
  };
}
