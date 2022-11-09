import { StatusCodes } from 'http-status-codes'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { plainToInstance } from 'class-transformer'

import { RegisterUserDto, LoginDto } from './dtos'

// ------------------ import for debug ------------------
import { AppDataSource } from '../../layers/shared/nodejs/node_modules/models'
import { render } from '../../layers/shared/nodejs/node_modules/shared/utils/custom-response'
import {
  UserRepository,
  ProfileRepository
} from '../../layers/shared/nodejs/node_modules/models/repositories'
import { comparePassword } from '../../layers/shared/nodejs/node_modules/shared/utils/hash-password'
import { getAccessToken } from '../../layers/shared/nodejs/node_modules/shared/utils/jwt'

// ------------------ import for lambda ------------------
// import { AppDataSource } from 'models/index'
// import { render } from 'shared/utils/custom-response'
// import { UserRepository, ProfileRepository } from 'models/repositories'
// import { comparePassword } from 'shared/utils/hash-password'
// import { getAccessToken } from 'shared/utils/jwt'

const userRepository = new UserRepository()
const profileRepository = new ProfileRepository()

export const handleRegisterUser = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const { email, password, name, age } = plainToInstance(
    RegisterUserDto,
    JSON.parse(event.body)
  )
  const queryRunner = AppDataSource.createQueryRunner()
  queryRunner.connect()
  try {
    await queryRunner.startTransaction()
    const user = await userRepository.registerUser(email, password)
    await profileRepository.createProfile(name, age, user)
    await queryRunner.commitTransaction()
    return render(StatusCodes.OK, { message: 'Register user success!' }, {})
  } catch (err: unknown) {
    await queryRunner.rollbackTransaction()
    console.log(err)
    return render(
      StatusCodes.INTERNAL_SERVER_ERROR,
      {
        message: err instanceof Error ? err.message : 'Some error happened'
      },
      {}
    )
  }
}

export const handleLogin = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const { email, password } = plainToInstance(
      LoginDto,
      JSON.parse(event.body)
    )
    const user = await userRepository.findOne({
      where: { email },
      relations: { profile: true }
    })
    if (user && comparePassword(password, user.password)) {
      return render(
        StatusCodes.OK,
        {
          accessToken: getAccessToken({
            id: user.id,
            email,
            name: user.profile.name
          })
        },
        {}
      )
    } else {
      return render(
        StatusCodes.UNAUTHORIZED,
        { message: 'Email or password is incorrect!' },
        {}
      )
    }
  } catch (err) {
    console.log(err)
    return render(
      StatusCodes.INTERNAL_SERVER_ERROR,
      {
        message: err instanceof Error ? err.message : 'Some error happened'
      },
      {}
    )
  }
}

export const handleGetAllUsers = async (): Promise<APIGatewayProxyResult> => {
  try {
    const users = await userRepository.find({ relations: { profile: true } })
    return render(StatusCodes.OK, users, {})
  } catch (err) {
    console.log(err)
    return render(
      StatusCodes.INTERNAL_SERVER_ERROR,
      {
        message: err instanceof Error ? err.message : 'Some error happened'
      },
      {}
    )
  }
}
