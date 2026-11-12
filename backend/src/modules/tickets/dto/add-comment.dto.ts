import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommentType } from '@prisma/client';

export class AddCommentDto {
  @ApiProperty({ example: 'I have tested with a new power adapter.', description: 'Comment body' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  content: string;

  @ApiPropertyOptional({ enum: CommentType, default: CommentType.PUBLIC, description: 'PUBLIC or INTERNAL_NOTE (internal notes require Agent/Manager role)' })
  @IsOptional()
  @IsEnum(CommentType)
  type?: CommentType;
}

