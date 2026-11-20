export type Note = {
  id: string
  slug: string // topic URL slug, e.g. /topic/arrays -> 'arrays'
  title: string
  topic: string
  description: string
  file: string // file name inside public/notes/
}

export const NOTES: Note[] = [
  {
    id: 'arrays-handwritten',
    slug: 'arrays',
    title: 'Arrays: Handwritten Notes',
    topic: 'Arrays',
    description: 'Handwritten notes covering array basics, operations and patterns.',
    file: 'arrays.pdf',
  },
]