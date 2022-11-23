import middy from '@middy/core'

import { handleGetProfile, handleUpdateProfile, handleDeleteProfile } from './handlers'
import { UpdateProfileDto } from './dtos'
import {
  connectDBMiddleware,
  validationMiddleware,
  authMiddleware,
} from 'shared/middlewares'

export const getProfile = middy(handleGetProfile)
  .use(authMiddleware())
  .use(connectDBMiddleware())

export const updateProfile = middy(handleUpdateProfile)
.use(authMiddleware())
  .use(validationMiddleware(UpdateProfileDto))
  .use(connectDBMiddleware())

export const deleteProfile = middy(handleDeleteProfile)
  .use(authMiddleware())
  .use(connectDBMiddleware())
