import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompaniesService } from './companies.service';

@Controller('companies')
@UseGuards(AuthGuard('jwt'))
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  findAll(@Query('unitId') unitId?: string, @Query('search') search?: string) {
    return this.companiesService.findAll(unitId, search);
  }

  @Get('stats')
  stats(@Query('unitId') unitId: string) {
    return this.companiesService.stats(unitId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.companiesService.create(body);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.companiesService.update(id, body);
  }
}
