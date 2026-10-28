import { useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'

export const useInvalidateFileSystemItems = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: queryKeys.all })
}
