import { StatusCodes } from 'http-status-codes'
import { APIGatewayProxyResult } from 'aws-lambda'
import { plainToInstance } from 'class-transformer'

import { UpdateProfileDto } from './dtos'
import { render } from 'shared/utils/custom-response'
import { ProfileRepository } from 'models/repositories'
import { APIGatewayEventInterface } from 'shared/interfaces'

const profileRepository = new ProfileRepository()

export const handleGetProfile = async (
  event: APIGatewayEventInterface
): Promise<APIGatewayProxyResult> => {
  try {
    const profile = await profileRepository.findOne({
      where: { user: { id: event.currentUser.id } }
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
  event: APIGatewayEventInterface
): Promise<APIGatewayProxyResult> => {
  try {
    const profileData = plainToInstance(
      UpdateProfileDto,
      JSON.parse(event.body)
    )
    await profileRepository.updateProfile(event.currentUser.id, profileData)
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
  event: APIGatewayEventInterface
): Promise<APIGatewayProxyResult> => {
  try {
    const { id } = await profileRepository.findOne({
      where: { user: { id: event.currentUser.id } }
    })
    await profileRepository.deleteProfile(id)
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
