import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'

export const useInvalidateFileSystemItemsCallback = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.all })
}
