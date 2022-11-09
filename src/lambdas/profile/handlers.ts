import { StatusCodes } from 'http-status-codes'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { plainToInstance } from 'class-transformer'

import { UpdateProfileDto } from './dtos'

// ------------------ import for debug ------------------
import { render } from '../../layers/shared/nodejs/node_modules/shared/utils/custom-response'
import { ProfileRepository } from '../../layers/shared/nodejs/node_modules/models/repositories'
import { getToken, verifyToken } from '../../layers/shared/nodejs/node_modules/shared/utils/jwt'

// ------------------ import for lambda ------------------
// import { render } from 'shared/utils/custom-response'
// import { ProfileRepository } from 'models/repositories'
// import { getToken, getAccessToken } from 'shared/utils/jwt'

const profileRepository = new ProfileRepository()

export const handleGetProfile = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const data = verifyToken(getToken(event))
    const profile = await profileRepository.findOne({
      where: { user: { id: data['id'] } }
    })
    return render(StatusCodes.OK, profile, {})
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

export const handleUpdateProfile = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const data = verifyToken(getToken(event))
    const profileData = plainToInstance(
      UpdateProfileDto,
      JSON.parse(event.body)
    )
    console.log(data['id'])
    console.log(typeof data['id'])
    await profileRepository.updateProfile(data['id'], profileData)
    return render(StatusCodes.OK, { message: 'Update profile success!' }, {})
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

export const handleDeleteProfile = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const data = verifyToken(getToken(event))
    const { id } = await profileRepository.findOne({
      where: { user: { id: data['id'] } }
    })
    await profileRepository.softDeleteProfile(id)
    return render(StatusCodes.OK, { message: 'Delete profile success!' }, {})
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
