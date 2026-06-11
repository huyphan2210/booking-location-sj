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
import { CreateLocationDto } from './dto/create-location.dto';
import { LocationResponseDto } from './dto/location-response.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationService } from './location.service';

@ApiTags('locations')
@Controller('locations')
export class LocationController {
  constructor(private readonly service: LocationService) {}

  @Post()
  @ApiCreatedResponse({
    description: 'Location created',
    type: LocationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid request payload' })
  async create(@Body() dto: CreateLocationDto): Promise<LocationResponseDto> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOkResponse({
    description: 'List of locations',
    type: LocationResponseDto,
    isArray: true,
  })
  async findAll(): Promise<LocationResponseDto[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOkResponse({
    description: 'Location retrieved',
    type: LocationResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Location not found' })
  async findOne(@Param('id') id: string): Promise<LocationResponseDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOkResponse({ description: 'Location updated', type: LocationResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid update payload' })
  @ApiNotFoundResponse({ description: 'Location not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLocationDto,
  ): Promise<LocationResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOkResponse({ description: 'Location deleted' })
  @ApiNotFoundResponse({ description: 'Location not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
