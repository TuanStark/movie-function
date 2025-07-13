import { Controller, Get, HttpStatus, HttpException, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { ResponseData } from '../global/globalClass';
import { HttpMessage } from '../global/globalEnum';
import { JwtAuthGuard } from '../auth/guard/jwt-auth/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  async getDashboardStats() {
    try {
      const stats = await this.dashboardService.getDashboardStats();
      return new ResponseData(stats, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('movies')
  async getMovieStats() {
    try {
      const stats = await this.dashboardService.getMovieStats();
      return new ResponseData(stats, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('users')
  async getUserStats() {
    try {
      const stats = await this.dashboardService.getUserStats();
      return new ResponseData(stats, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('bookings')
  async getBookingStats() {
    try {
      const stats = await this.dashboardService.getBookingStats();
      return new ResponseData(stats, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('revenue')
  async getRevenueStats() {
    try {
      const stats = await this.dashboardService.getRevenueStats();
      return new ResponseData(stats, HttpStatus.OK, HttpMessage.SUCCESS);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
