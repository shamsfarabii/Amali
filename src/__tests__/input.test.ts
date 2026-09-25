import { describe, expect, it } from '@jest/globals';
import { normalizeInput, validateInput, type DuaInput } from '@/types/dua';
import { validateFolderName, type Folder } from '@/types/folder';

const input = (overrides: Partial<DuaInput> = {}): DuaInput => ({
  title: 'Title',
  arabic: 'دعاء',
  pronunciation: '',
  bengali: 'দোয়া',
  source: '',
  folderId: null,
  ...overrides,
});

describe('validateInput', () => {
  it('accepts a complete dua with optional fields empty', () => {
    expect(validateInput(input())).toEqual({});
  });

  it('requires title, arabic and bengali', () => {
    const errors = validateInput(normalizeInput(input({ title: '  ', arabic: '', bengali: '\n' })));
    expect(Object.keys(errors).sort()).toEqual(['arabic', 'bengali', 'title']);
  });

  it('enforces length limits', () => {
    expect(validateInput(input({ title: 'x'.repeat(121) })).title).toBeDefined();
    expect(validateInput(input({ pronunciation: 'x'.repeat(5001) })).pronunciation).toBeDefined();
  });
});

describe('validateFolderName', () => {
  const folders: Folder[] = [{ id: 'a', name: 'Morning', createdAt: 0, updatedAt: 0 }];

  it('rejects empty and overly long names', () => {
    expect(validateFolderName('   ', folders)).not.toBeNull();
    expect(validateFolderName('x'.repeat(51), folders)).not.toBeNull();
  });

  it('rejects a duplicate name, ignoring case and spacing', () => {
    expect(validateFolderName('  morning ', folders)).not.toBeNull();
  });

  it('lets a folder keep its own name when renaming', () => {
    expect(validateFolderName('MORNING', folders, 'a')).toBeNull();
  });

  it('accepts a new name', () => {
    expect(validateFolderName('Evening', folders)).toBeNull();
  });
});
