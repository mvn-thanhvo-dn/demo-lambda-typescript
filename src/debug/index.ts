/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { StatusCodes } from 'http-status-codes'
import createHttpError from 'http-errors'
import morgan from 'morgan'
import YAML from 'yaml'
import fs from 'fs'

import { registerUser, login, getAllUsers } from '../lambdas/user/index'
import {
  getProfile,
  updateProfile,
  deleteProfile
} from '../lambdas/profile/index'
import { index, test } from '../lambdas'

const app = express()
const port = +process.env.EXPRESS_PORT || 3001

// ------------ init express middleware ------------
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// ------------ get data includes HANDLER, ROUTE, METHOD from template.yml ------------
const { Resources } = YAML.parse(
  fs.readFileSync(__dirname + '/../../template.yml', 'utf8')
)
const data: Array<{ handler: string; route: string; method: string }> = []
Object.values(Resources).forEach((value: any) => {
  if (value.Type === 'AWS::Serverless::Function') {
    const result = { handler: '', route: '', method: '' }
    result.handler = value.Properties.Handler.split('.')[1]
    const properties = value.Properties.Events.getEndpoint.Properties

    const regex = /{(?=\d.*)?([\w\-]*)}/
    const path = String(properties.Path)
    const expression = path.match(regex)
    if (expression !== null) {
      result.route = path.replace(expression[0], `:${expression[1]}`)
    } else {
      result.route = path
    }

    result.method = properties.Method.toLowerCase()
    data.push(result)
  }
})
Array.from(data).forEach((item) => console.log(JSON.stringify(item)))

// ------------ create object includes list function handler ------------
const listFunction = {
  registerUser,
  login,
  getAllUsers,
  getProfile,
  updateProfile,
  deleteProfile,
  index,
  test
}

// ------------ function convert header of request from express to AWS lambda ------------
const convertHeaders = (name: string) => {
  return name
    .split('-')
    .map((item) => {
      return item.charAt(0).toUpperCase() + item.substring(1)
    })
    .join('-')
}

// ------------ function change request type of express to request type of lambda ------------
const convertRequest = (req: Request, path: string): APIGatewayProxyEvent => {
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
  result.path = path
  result.pathParameters = req.params ? { ...req.params } : null
  result.queryStringParameters = { ...(req.query as any) }

  return result
}

// ------------ function handle GET, POST, PUT, DELETE request ------------
const handleNormalRequest = (handler: string) => {
  return async (req: Request, res: Response) => {
    const result = await listFunction[handler](convertRequest(req ,req.path))
    res.status(result.statusCode).json(JSON.parse(result.body))
  }
}

// ------------ function handle ANY request ------------
const handleAnyRequest = (handler: string, path: string) => {
  return async (req: Request, res: Response) => {
    const result = await listFunction[handler](convertRequest(req, path))
    res.status(result.statusCode).json(JSON.parse(result.body))
  }
}

// ------------ init route ------------
data.forEach((item) => {
  if (item.method === 'any') {
    app.use(item.route, handleAnyRequest(item.handler, item.route))
  } else {
    app[item.method](item.route, handleNormalRequest(item.handler))
  }
})

// ------------------------- handle 404 -------------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  next(createHttpError(404))
})

// ------------------------- handle error -------------------------
app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = error.status || StatusCodes.INTERNAL_SERVER_ERROR
  res
    .status(status)
    .json({ status, message: error.message || 'Something went wrong' })
})

app.listen(port, () => {
  console.log(`http://localhost:${port}`)
})
