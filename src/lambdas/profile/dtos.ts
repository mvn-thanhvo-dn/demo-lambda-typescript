import 'reflect-metadata'
import { IsISO8601, IsString, IsNumber, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  name: string

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  age: number

  @IsISO8601()
  @IsOptional()
  birthday: string
}
