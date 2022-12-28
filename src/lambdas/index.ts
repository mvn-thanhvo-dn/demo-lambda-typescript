import { StatusCodes } from 'http-status-codes'
import {
  Context,
  APIGatewayProxyResult,
  APIGatewayProxyEvent
} from 'aws-lambda'
import middy from '@middy/core'
import httpRouterHandler, { Method } from '@middy/http-router'

import { connectDBMiddleware } from 'shared/middlewares'
import { render } from 'shared/utils/custom-response'

const get = middy()
  .use(connectDBMiddleware())
  .handler(
    async (
      event: APIGatewayProxyEvent,
      context: Context
    ): Promise<APIGatewayProxyResult> => {
      return render(StatusCodes.OK, { message: 'GET ne' }, {})
    }
  )

const getById = middy().handler(
  async (
    event: APIGatewayProxyEvent,
    context: Context
  ): Promise<APIGatewayProxyResult> => {
    const { id } = event.pathParameters
    return render(StatusCodes.OK, { message: `GET by id: ${id} ne` }, {})
  }
)

const post = middy()
  .use(connectDBMiddleware())
  .handler(
    async (
      event: APIGatewayProxyEvent,
      context: Context
    ): Promise<APIGatewayProxyResult> => {
      return render(StatusCodes.OK, JSON.parse(event.body), {})
    }
  )

const routes = [
  {
    method: 'GET' as Method,
    path: '/test',
    handler: get
  },
  {
    method: 'GET' as Method,
    path: '/test/{id}',
    handler: getById
  },
  {
    method: 'POST' as Method,
    path: '/test',
    handler: post
  }
]

const index = middy().handler(httpRouterHandler(routes))

const test = middy()
  .use(connectDBMiddleware())
  .handler(
    async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
      return render(StatusCodes.OK, { params: event.pathParameters }, {})
    }
  )

export { index, test }
