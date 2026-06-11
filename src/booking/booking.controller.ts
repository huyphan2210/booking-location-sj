import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { BookingService } from './booking.service';

@ApiTags('bookings')
@Controller('bookings')
export class BookingController {
  constructor(private readonly service: BookingService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Booking created',
    type: BookingResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid booking request' })
  async create(@Body() dto: CreateBookingDto): Promise<BookingResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOkResponse({
    description: 'List of bookings',
    type: BookingResponseDto,
    isArray: true,
  })
  async findAll(): Promise<BookingResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'Booking retrieved',
    type: BookingResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async findOne(@Param('id') id: string): Promise<BookingResponseDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Booking updated', type: BookingResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid update payload' })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBookingDto,
  ): Promise<BookingResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Booking deleted' })
  @ApiNotFoundResponse({ description: 'Booking not found' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
