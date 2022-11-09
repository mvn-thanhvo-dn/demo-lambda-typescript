export class CustomError extends Error {
  code: number
  data: Object
  constructor(message: string, data: Object, code: number) {
    super(message)
    this.code = code
    this.data = data
  }
}
