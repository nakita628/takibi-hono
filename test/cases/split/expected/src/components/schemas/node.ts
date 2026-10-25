import * as z from 'zod'

type NodeType = { readonly id: string; readonly children?: readonly NodeType[] }

export const NodeSchema: z.ZodType<NodeType> = z
  .object({
    id: z.string(),
    children: z
      .array(z.lazy(() => NodeSchema))
      .readonly()
      .exactOptional(),
  })
  .readonly()
  .meta({ ref: 'Node' })

export type Node = z.infer<typeof NodeSchema>
