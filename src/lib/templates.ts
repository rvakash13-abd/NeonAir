export interface Template {
  name: string;
  url: string;
  category: string;
  free?: boolean;
}

const modules = import.meta.glob('../../Subscription/**/*.{jpg,jpeg,png,JPG,JPEG,PNG}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const templatesByCategory: Record<string, Template[]> = {};

// Filenames that stay free within their category (case-insensitive, no extension).
const FREE_IN_CARTOONS = new Set(['c1', 'c2']);

for (const path in modules) {
  const url = modules[path];
  const parts = path.split('/');
  const fileName = parts[parts.length - 1];
  const category = parts[parts.length - 2];
  const name = fileName.replace(/\.[^.]+$/, '');
  const free = category === 'Cartoons' && FREE_IN_CARTOONS.has(name.toLowerCase());
  if (!templatesByCategory[category]) templatesByCategory[category] = [];
  templatesByCategory[category].push({ name, url, category, free });
}

export const templateCategories = Object.keys(templatesByCategory).sort();