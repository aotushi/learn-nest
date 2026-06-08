import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { CatsService } from './cats.service';
import { CreateCatDto } from './dto/create-cat.dto';
import { AnyFilesInterceptor } from '@nestjs/platform-express';

@Controller('cats')
export class CatsController {
  constructor(private readonly catsService: CatsService) {}

  @Get()
  findAll() {
    return this.catsService.findAll();
  }

  // query
  @Get('find')
  query(@Query('name') name: string, @Query('age') age: string) {
    return `received: name=${name}, age=${age}`;
  }

  // url param
  @Get(':id')
  findOne(@Param('id') id: string) {
    // return this.catsService.findOne(+id);
    return `received: id=${id}`;
  }

  // form urlencoded
  @Post('getBody')
  getBody(@Body() CreateCatDto: CreateCatDto) {
    return `received: ${JSON.stringify(CreateCatDto)}`;
  }

  // json
  @Post()
  body(@Body() CreateCatDto: CreateCatDto) {
    return `received: ${JSON.stringify(CreateCatDto)}`;
  }

  // form data
  @Post('file')
  @UseInterceptors(
    AnyFilesInterceptor({
      dest: 'uploads/',
    }),
  )
  body2(
    @Body() createCatDto: CreateCatDto,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return {
      body: createCatDto,
      fileCount: files.length,
      files: files.map((file) => file.originalname),
    };
  }
}
