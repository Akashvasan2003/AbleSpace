import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseCuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || typeof value !== 'string' || value.trim().length < 10) {
      throw new BadRequestException(`Invalid ID format: "${value}"`);
    }
    return value.trim();
  }
}
