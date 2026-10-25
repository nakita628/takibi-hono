export const GetUserLink = {
  operationId: 'getUser',
  parameters: { userId: '$response.body#/id' },
} as const
