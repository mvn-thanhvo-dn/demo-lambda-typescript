import { StatusCodes } from 'http-status-codes'
import { APIGatewayProxyResult } from 'aws-lambda'

import { AppDataSource } from 'models/index'
import { render } from 'shared/utils/custom-response'
import { UserRepository, ProfileRepository } from 'models/repositories'
import { comparePassword } from 'shared/utils/hash-password'
import { getAccessToken } from 'shared/utils/jwt'
import { APIGatewayEventInterface } from 'shared/interfaces'

const userRepository = new UserRepository()
const profileRepository = new ProfileRepository()

export const handleRegisterUser = async (
  event: APIGatewayEventInterface
): Promise<APIGatewayProxyResult> => {
  const { email, password, name, age } = event.jsonBody
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
  event: APIGatewayEventInterface
): Promise<APIGatewayProxyResult> => {
  try {
    const { email, password } = event.jsonBody
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
