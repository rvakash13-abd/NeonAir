// Auto-discovers every image dropped into Subscription/<Category>/*.{jpg,jpeg,png}
// at the project root. Add a new category by making a new folder there — no
// code changes needed, this glob picks it up automatically.

export interface Template {
  name: string;
  url: string;
  category: string;
}

const modules = import.meta.glob('../../Subscription/**/*.{jpg,jpeg,png,JPG,JPEG,PNG}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const templatesByCategory: Record<string, Template[]> = {};

for (const path in modules) {
  const url = modules[path];
  const parts = path.split('/');
  const fileName = parts[parts.length - 1];
  const category = parts[parts.length - 2];
  const name = fileName.replace(/\.[^.]+$/, '');
  if (!templatesByCategory[category]) templatesByCategory[category] = [];
  templatesByCategory[category].push({ name, url, category });
}

export const templateCategories = Object.keys(templatesByCategory).sort();
