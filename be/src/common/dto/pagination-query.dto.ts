import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Prisma } from 'generated/prisma/client';

export class PaginationQueryDto {
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(10)
  @Max(100)
  @Transform(({ value }) => Number(value))
  limit?: number;

  @IsInt()
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Transform(({ value }) => Number(value))
  page?: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value as Prisma.SortOrder)
  orderBy?: Prisma.SortOrder;
}
