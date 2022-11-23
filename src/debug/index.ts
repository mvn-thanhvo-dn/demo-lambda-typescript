import 'dotenv/config'
import { APIGatewayProxyEvent } from 'aws-lambda'
import express, { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import fs from 'fs'
import YAML from 'yaml'

import { registerUser, login, getAllUsers } from '../lambdas/user/index'
import {
  getProfile,
  updateProfile,
  deleteProfile
} from '../lambdas/profile/index'

const app = express()
const port = +process.env.EXPRESS_PORT || 3001

app.use(express.json())

// get data includes HANDLER, ROUTE, METHOD from template.yml
const { Resources } = YAML.parse(
  fs.readFileSync(__dirname + '/../../template.yml', 'utf8')
)
const data: Array<{ handler: string; route: string; method: string }> = []
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Object.values(Resources).forEach((value: any) => {
  if (value.Type === 'AWS::Serverless::Function') {
    const result = { handler: '', route: '', method: '' }
    result.handler = value.Properties.Handler.split('.')[1]
    const properties = value.Properties.Events.getEndpoint.Properties
    result.route = properties.Path
    result.method = properties.Method.toLowerCase()
    data.push(result)
  }
})
Array.from(data).forEach((item) => console.log(JSON.stringify(item)))

// create object includes list function handler
const listFunction = {
  registerUser,
  login,
  getAllUsers,
  getProfile,
  updateProfile,
  deleteProfile
}

const convertHeaders = (name: string) => {
  return name
    .split('-')
    .map((item) => {
      return item.charAt(0).toUpperCase() + item.substring(1)
    })
    .join('-')
}

// function change request type of express to request type of lambda
const convertRequest = (req: Request): APIGatewayProxyEvent => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: APIGatewayProxyEvent | any = {}
  result.body = req.body ? JSON.stringify(req.body) : null
  const headers = Object.fromEntries(
    Object.entries(req.headers).map(([key, value]) => {
      return [convertHeaders(key), value]
    })
  )
  result.headers = { ...headers }
  result.httpMethod = req.method
  result.isBase64Encoded = false
  result.path = req.path
  result.pathParameters = req.params ? { ...req.params } : null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result.queryStringParameters = { ...(req.query as any) }

  return result
}

data.forEach((item) => {
  app[item.method](item.route, async (req: Request, res: Response) => {
    const result = await listFunction[item.handler](convertRequest(req))
    res.status(result.statusCode).json(JSON.parse(result.body))
  })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  res
    .status(error.status || StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: error.message || 'Something went wrong' })
})

app.listen(port, () => {
  console.log(`http://localhost:${port}`)
})
