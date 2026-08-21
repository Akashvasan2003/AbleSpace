import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectQueryDto,
  CreateLabelDto,
} from './projects.dto';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  findAll(@Query() query: ProjectQueryDto, @CurrentUser() user: AuthUser) {
    return this.service.findAll(query, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
  }

  // Static sub-routes before :id
  @Delete('labels/:labelId')
  @HttpCode(HttpStatus.OK)
  deleteLabel(
    @Param('labelId', ParseCuidPipe) labelId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.deleteLabel(labelId, user.id);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseCuidPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.findOne(id, user.id);
  }

  @Put(':id')
  update(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(
    @Param('id', ParseCuidPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.remove(id, user.id);
  }

  @Post(':id/labels')
  @HttpCode(HttpStatus.CREATED)
  createLabel(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: CreateLabelDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.createLabel(id, dto, user.id);
  }
}
