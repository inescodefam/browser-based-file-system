import { Anchor } from '@mantine/core'
import { Link } from 'react-router-dom'

export const ReturnToAllFilesLink = () => (
  <Anchor component={Link} to="/" replace>
    Return to All files
  </Anchor>
)
