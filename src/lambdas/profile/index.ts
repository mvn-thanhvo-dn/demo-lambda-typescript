import middy from '@middy/core'

import { handleGetProfile, handleUpdateProfile, handleDeleteProfile } from './handlers'
import { UpdateProfileDto } from './dtos'

// ------------------ import for debug ------------------
import {
  connectDBMiddleware,
  validationMiddleware,
  authMiddleware,
} from '../../layers/shared/nodejs/node_modules/shared/middlewares'

// ------------------ import for lambda ------------------
// import {
//   connectDBMiddleware,
//   validationMiddleware,
//   authMiddleware,
// } from 'shared/middlewares'

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
