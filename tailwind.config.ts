import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
  safelist: [
    'from-slate-500',
      'from-gray-500',
      'from-zinc-500',
      'from-neutral-500',
      'from-stone-500',
      'from-red-500',
      'from-orange-500',
      'from-amber-500',
      'from-yellow-500',
      'from-lime-500',
      'from-green-500',
      'from-emerald-500',
      'from-teal-500',
      'from-cyan-500',
      'from-sky-500',
      'from-blue-500',
      'from-indigo-500',
      'from-violet-500',
      'from-purple-500',
      'from-fuchsia-500',
      'from-pink-500',
      'from-rose-500',
      
    'to-slate-300',
    'to-gray-300',
    'to-zinc-300',
    'to-neutral-300',
    'to-stone-300',
    'to-red-300',
    'to-orange-300',
    'to-amber-300',
    'to-yellow-300',
    'to-lime-300',
    'to-green-300',
    'to-emerald-300',
    'to-teal-300',
    'to-cyan-300',
    'to-sky-300',
    'to-blue-300',
    'to-indigo-300',
    'to-violet-300',
    'to-purple-300',
    'to-fuchsia-300',
    'to-pink-300',
    'to-rose-300'
  ]
}
export default config
