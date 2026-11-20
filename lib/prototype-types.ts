export type PrototypeMetadata = {
  title: string
  description: string
  tags: string[]
  createdAt: string
  updatedAt: string
  hidden: boolean
  public: boolean
}

export type Prototype = PrototypeMetadata & {
  slug: string
  thumbnails: { light: string; dark: string } | null
  og: { image: string | null; video: string | null }
}
