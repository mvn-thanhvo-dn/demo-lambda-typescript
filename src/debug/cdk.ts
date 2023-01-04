/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */

// ------------ Start parse template file ------------
import fs from 'fs'

const { Resources } = JSON.parse(
  fs.readFileSync(
    __dirname + '/../../cdk.out/IndexCdkStack.template.json',
    'utf8'
  )
)
const data: Array<{
  handler: string
  route: string
  method: string
}> = []
const data1: string[] = []
const resourcesValues = Object.values(Resources)
resourcesValues
  .filter((item: any) => item.Type === 'AWS::ApiGateway::Deployment')
  .forEach((value: any) => {
    Array.from(value.DependsOn).forEach((id: string) => {
      data1.push(id)
    })
  })
const realRoute: Array<{
  id: string
  parentId: string
  path: string
  restApiId: string
}> = []
const methods: Array<{
  id: string
  method: string
  resourceId: string
  handlerId: string
}> = []

data1.forEach((item) => {
  const t = Resources[item]
  if (t.Type === 'AWS::ApiGateway::Resource') {
    realRoute.push({
      id: item,
      parentId: t.Properties.ParentId?.Ref || '',
      path: t.Properties.PathPart,
      restApiId: t.Properties.RestApiId.Ref
    })
  }
  if (t.Type === 'AWS::ApiGateway::Method') {
    const temp = t.Properties.Integration.Uri['Fn::Join'][1]
    methods.push({
      id: item,
      method: t.Properties.HttpMethod,
      resourceId: t.Properties.ResourceId.Ref,
      handlerId: temp[temp.length - 2]['Fn::GetAtt'][0]
    })
  }
})

const realRoute1 = realRoute.map((route) => {
  const temp = methods
    .filter((method) => method.resourceId === route.id)
    .map((item) => ({ method: item.method, handlerId: item.handlerId }))
  let method = temp[0].method
  if (temp.length > 1) {
    method = 'ANY'
  }
  return { ...route, method, handlerId: temp[0].handlerId }
})

const vip = realRoute1.map((route) => {
  if (route.parentId) {
    const temp = realRoute1.find((item) => item.id === route.parentId)
    route.path = temp.path + '/' + route.path
  }
  route.path = '/' + route.path
  return route
})

const resourcesKeys = Object.keys(Resources)
const handlers: { id?: string; handler?: string }[] = []
resourcesKeys.forEach((key: string) => {
  const item = Resources[key]
  const result: { id?: string; handler?: string } = {}
  if (item.Type === 'AWS::Lambda::Function') {
    result.id = key
    result.handler = item.Properties.Handler
    handlers.push(result)
  }
})

vip.forEach((vipItem) => {
  const handler = handlers.find((item) => item.id === vipItem.handlerId)
  data.push({
    route: vipItem.path,
    handler: handler.handler.split('.')[1],
    method: vipItem.method
  })
})

console.log(data)

// ------------ End parse template file ------------

// ------------ Start init express ------------
import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import { APIGatewayProxyEvent } from 'aws-lambda'
import { StatusCodes } from 'http-status-codes'
import createHttpError from 'http-errors'
import morgan from 'morgan'

// import handler function here
// ...
// import handler function here

const app = express()
const port = +process.env.EXPRESS_PORT || 3001

// ------------ init express middleware ------------
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// ------------ create object includes list function handler ------------
const listFunction = {}


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
    const result = await listFunction[handler](convertRequest(req, req.path))
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
