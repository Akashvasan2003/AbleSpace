import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import {
  CreateTaskDto,
  UpdateTaskDto,
  TaskQueryDto,
  CreateSubtaskDto,
  UpdateSubtaskDto,
  CreateCommentDto,
  UpdateCommentDto,
} from './tasks.dto';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly service: TasksService) {}

  // ─── Static prefix routes MUST come before :id ──────────────────────────────

  @Patch('subtasks/:subId')
  updateSubtask(
    @Param('subId', ParseCuidPipe) subId: string,
    @Body() dto: UpdateSubtaskDto,
    @Query('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateSubtask(subId, dto, taskId, user.id);
  }

  @Delete('subtasks/:subId')
  @HttpCode(HttpStatus.OK)
  deleteSubtask(
    @Param('subId', ParseCuidPipe) subId: string,
    @Query('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.deleteSubtask(subId, taskId, user.id);
  }

  @Put('comments/:commentId')
  updateComment(
    @Param('commentId', ParseCuidPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.updateComment(commentId, dto, user.id);
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.OK)
  deleteComment(
    @Param('commentId', ParseCuidPipe) commentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.deleteComment(commentId, user.id);
  }

  // ─── Collection + :id routes ─────────────────────────────────────────────────

  @Get()
  findAll(@Query() query: TaskQueryDto, @CurrentUser() user: AuthUser) {
    return this.service.findAll(query, user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: AuthUser) {
    return this.service.create(dto, user.id);
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
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.update(id, dto, user.id);
  }

  @Patch(':id')
  patch(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: UpdateTaskDto,
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

  @Post(':id/subtasks')
  @HttpCode(HttpStatus.CREATED)
  createSubtask(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: CreateSubtaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.createSubtask(id, dto, user.id);
  }

  @Get(':id/comments')
  getComments(
    @Param('id', ParseCuidPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.getComments(id, user.id);
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  addComment(
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.addComment(id, dto, user.id);
  }

  @Get(':id/activity')
  getActivity(
    @Param('id', ParseCuidPipe) id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.service.getActivity(id, user.id);
  }
}
