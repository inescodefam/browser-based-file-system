import { Anchor } from '@mantine/core'
import { Link } from 'react-router-dom'

export const ReturnToAllFilesLink = () => (
  <Anchor component={Link} to="/" replace onClick={(event) => event.stopPropagation()}>
    Return to All files
  </Anchor>
)
