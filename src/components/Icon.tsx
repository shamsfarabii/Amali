import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

// One semantic name per icon, mapped to SF Symbols (iOS) and Material Symbols (Android).
const ICONS = {
  add: { ios: 'plus', android: 'add' },
  settings: { ios: 'gearshape', android: 'settings' },
  search: { ios: 'magnifyingglass', android: 'search' },
  clear: { ios: 'xmark.circle.fill', android: 'cancel' },
  edit: { ios: 'pencil', android: 'edit' },
  delete: { ios: 'trash', android: 'delete' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  source: { ios: 'book.closed', android: 'menu_book' },
  textSmaller: { ios: 'textformat.size.smaller', android: 'text_decrease' },
  textLarger: { ios: 'textformat.size.larger', android: 'text_increase' },
  export: { ios: 'arrow.up.doc', android: 'file_upload' },
  import: { ios: 'arrow.down.doc', android: 'file_download' },
  chevron: { ios: 'chevron.right', android: 'chevron_right' },
  info: { ios: 'info.circle', android: 'info' },
  folder: { ios: 'folder', android: 'folder' },
  folderAdd: { ios: 'folder.badge.plus', android: 'create_new_folder' },
  more: { ios: 'ellipsis', android: 'more_horiz' },
  check: { ios: 'checkmark', android: 'check' },
  close: { ios: 'xmark', android: 'close' },
  lock: { ios: 'lock', android: 'lock' },
} as const;

export type IconName = keyof typeof ICONS;

interface Props {
  name: IconName;
  size?: number;
  color: ColorValue;
}

export function Icon({ name, size = 22, color }: Props) {
  return (
    <SymbolView
      name={ICONS[name]}
      size={size}
      tintColor={color}
      weight="medium"
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
