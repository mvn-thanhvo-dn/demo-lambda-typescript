import middy from '@middy/core'

import { handleRegisterUser, handleLogin, handleGetAllUsers } from './handlers'
import { RegisterUserDto, LoginDto } from './dtos'

// ------------------ import for debug ------------------
// import {
//   connectDBMiddleware,
//   validationMiddleware,
//   authMiddleware,
// } from '../../layers/shared/nodejs/node_modules/shared/middlewares'

// ------------------ import for lambda ------------------
import {
  connectDBMiddleware,
  validationMiddleware,
  authMiddleware,
} from 'shared/middlewares'

export const registerUser = middy(handleRegisterUser)
  .use(validationMiddleware(RegisterUserDto))
  .use(connectDBMiddleware())

export const login = middy(handleLogin)
  .use(validationMiddleware(LoginDto))
  .use(connectDBMiddleware())

export const getAllUsers = middy(handleGetAllUsers)
  .use(authMiddleware())
  .use(connectDBMiddleware())
