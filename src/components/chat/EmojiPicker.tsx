
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  className?: string;
}

const emojiCategories = {
  smileys: {
    label: '😀',
    name: 'Smileys & People',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
      '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
      '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
      '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
      '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
      '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'
    ]
  },
  hearts: {
    label: '❤️',
    name: 'Hearts & Love',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️',
      '💋', '💌', '💐', '🌹', '🌺', '🌸', '🌼', '🌻', '💒', '💍'
    ]
  },
  nature: {
    label: '🌱',
    name: 'Nature',
    emojis: [
      '🌱', '🌿', '🍀', '🌵', '🌲', '🌳', '🌴', '🌾', '🌺', '🌸',
      '🌼', '🌻', '🌹', '🥀', '🌷', '💐', '🍄', '🌰', '🌊', '💧',
      '❄️', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️',
      '🌨️', '💨', '🌪️', '🌈', '☂️', '⭐', '🌟', '💫', '✨', '🌙'
    ]
  },
  food: {
    label: '🍕',
    name: 'Food & Drink',
    emojis: [
      '🍕', '🍔', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳',
      '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌶️', '🥕', '🌽',
      '🥒', '🥬', '🥦', '🥑', '🍅', '🍆', '🥔', '🍠', '🥐', '🍞',
      '🥖', '🥨', '🧀', '🥯', '🍎', '🍏', '🍊', '🍋', '🍌', '🍉'
    ]
  },
  activities: {
    label: '🎉',
    name: 'Activities',
    emojis: [
      '🎉', '🎊', '🎈', '🎁', '🎀', '🎂', '🍰', '🧁', '🎯', '🎮',
      '🕹️', '🎲', '♠️', '♥️', '♦️', '♣️', '🃏', '🀄', '🎴', '🎭',
      '🎨', '🎪', '🎺', '🎷', '🥇', '🥈', '🥉', '🏆', '🏅', '🎖️',
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱'
    ]
  },
  objects: {
    label: '📱',
    name: 'Objects',
    emojis: [
      '📱', '💻', '🖥️', '⌨️', '🖱️', '📞', '☎️', '📠', '📺', '📻',
      '🎥', '📷', '📸', '📹', '📼', '💽', '💾', '💿', '📀', '🧮',
      '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵',
      '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🔧', '🔨', '⚒️'
    ]
  }
};

const recentEmojis = ['😀', '❤️', '👍', '😂', '🎉', '👏', '🔥', '💯'];

export function EmojiPicker({ onEmojiSelect, className }: EmojiPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('smileys');

  const filteredEmojis = searchTerm
    ? Object.values(emojiCategories)
        .flatMap(category => category.emojis)
        .filter(emoji => 
          emoji.includes(searchTerm) || 
          Object.entries(emojiCategories).some(([key, category]) => 
            category.emojis.includes(emoji) && 
            (key.includes(searchTerm.toLowerCase()) || category.name.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        )
    : emojiCategories[selectedCategory as keyof typeof emojiCategories]?.emojis || [];

  return (
    <Card className={cn("w-80 h-96", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <Input
            placeholder="Search emojis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8"
          />

          {!searchTerm && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Recently Used</h4>
              <div className="grid grid-cols-8 gap-1">
                {recentEmojis.map((emoji, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-muted"
                    onClick={() => onEmojiSelect(emoji)}
                  >
                    <span className="text-lg">{emoji}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-6 h-8">
              {Object.entries(emojiCategories).map(([key, category]) => (
                <TabsTrigger key={key} value={key} className="p-1 text-xs">
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-2">
              <ScrollArea className="h-48">
                <div className="grid grid-cols-8 gap-1 p-1">
                  {filteredEmojis.map((emoji, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted"
                      onClick={() => onEmojiSelect(emoji)}
                    >
                      <span className="text-lg">{emoji}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}
