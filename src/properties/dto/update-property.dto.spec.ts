import { ValidationPipe } from '@nestjs/common';
import { PropertyType } from '../entities/property.entity';
import { UpdatePropertyDto } from './update-property.dto';

describe('UpdatePropertyDto', () => {
  it('accepts the type field sent by the edit flow', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    const transformed = await pipe.transform(
      {
        title: 'Updated title',
        type: PropertyType.HOUSE,
        transactionType: 'rent',
        district: 'Bengaluru',
        locality: 'Koramangala',
      },
      { type: 'body', metatype: UpdatePropertyDto },
    );

    expect(transformed).toBeInstanceOf(UpdatePropertyDto);
    expect(transformed.type).toBe(PropertyType.HOUSE);
  });
});
