import 'reflect-metadata'
import { IsEmail, IsString, IsNumber } from 'class-validator'
import { Type } from 'class-transformer'

export class RegisterUserDto {
  @IsEmail()
  email: string

  @IsString()
  password: string

  @IsString()
  name: string

  @IsNumber()
  @Type(() => Number)
  age: number
}

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  password: string
}
