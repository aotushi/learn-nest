import { Injectable } from '@nestjs/common';
import { CreateBbbDto } from './dto/create-bbb.dto';
import { UpdateBbbDto } from './dto/update-bbb.dto';
import { AaaService } from '../aaa/aaa.service';

@Injectable()
export class BbbService {
  // 注入AaaService
  constructor(private readonly aaaService: AaaService) {}

  create(createBbbDto: CreateBbbDto) {
    return `This action adds a new bbb: ${JSON.stringify(createBbbDto)}`;
  }

  findAll() {
    // return `This action returns all bbb`;
    return `This action returns all bbb ---${this.aaaService.findAll()}`;
  }

  findOne(id: number) {
    return `This action returns a #${id} bbb`;
  }

  update(id: number, updateBbbDto: UpdateBbbDto) {
    return `This action updates a #${id} bbb: ${JSON.stringify(updateBbbDto)}`;
  }

  remove(id: number) {
    return `This action removes a #${id} bbb`;
  }
}
