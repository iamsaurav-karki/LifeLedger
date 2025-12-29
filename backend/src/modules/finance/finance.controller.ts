import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateIncomeDto } from './dto/create-income.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { CreateLendingDto } from './dto/create-lending.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { UpdateLendingDto } from './dto/update-lending.dto';

@ApiTags('Finance')
@Controller('finance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // Expenses
  @Post('expenses')
  @ApiOperation({ summary: 'Create expense' })
  createExpense(@CurrentUser() user: User, @Body() createDto: CreateExpenseDto) {
    return this.financeService.createExpense(user.id, createDto);
  }

  @Get('expenses')
  @ApiOperation({ summary: 'Get all expenses' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  findAllExpenses(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.findAllExpenses(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('expenses/:id')
  @ApiOperation({ summary: 'Get expense by ID' })
  findOneExpense(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.findOneExpense(id, user.id);
  }

  @Patch('expenses/:id')
  @ApiOperation({ summary: 'Update expense' })
  updateExpense(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateExpenseDto,
  ) {
    return this.financeService.updateExpense(id, user.id, updateDto);
  }

  @Delete('expenses/:id')
  @ApiOperation({ summary: 'Delete expense' })
  removeExpense(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.removeExpense(id, user.id);
  }

  // Income
  @Post('income')
  @ApiOperation({ summary: 'Create income' })
  createIncome(@CurrentUser() user: User, @Body() createDto: CreateIncomeDto) {
    return this.financeService.createIncome(user.id, createDto);
  }

  @Get('income')
  @ApiOperation({ summary: 'Get all income' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  findAllIncomes(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.findAllIncomes(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('income/:id')
  @ApiOperation({ summary: 'Get income by ID' })
  findOneIncome(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.findOneIncome(id, user.id);
  }

  @Patch('income/:id')
  @ApiOperation({ summary: 'Update income' })
  updateIncome(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateIncomeDto,
  ) {
    return this.financeService.updateIncome(id, user.id, updateDto);
  }

  @Delete('income/:id')
  @ApiOperation({ summary: 'Delete income' })
  removeIncome(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.removeIncome(id, user.id);
  }

  // Investments
  @Post('investments')
  @ApiOperation({ summary: 'Create investment' })
  createInvestment(@CurrentUser() user: User, @Body() createDto: CreateInvestmentDto) {
    return this.financeService.createInvestment(user.id, createDto);
  }

  @Get('investments')
  @ApiOperation({ summary: 'Get all investments' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  findAllInvestments(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.findAllInvestments(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('investments/:id')
  @ApiOperation({ summary: 'Get investment by ID' })
  findOneInvestment(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.findOneInvestment(id, user.id);
  }

  @Patch('investments/:id')
  @ApiOperation({ summary: 'Update investment' })
  updateInvestment(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateInvestmentDto,
  ) {
    return this.financeService.updateInvestment(id, user.id, updateDto);
  }

  @Delete('investments/:id')
  @ApiOperation({ summary: 'Delete investment' })
  removeInvestment(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.removeInvestment(id, user.id);
  }

  // Analytics
  @Get('analytics')
  @ApiOperation({ summary: 'Get financial analytics' })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  getAnalytics(
    @CurrentUser() user: User,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.financeService.getFinancialAnalytics(user.id, new Date(startDate), new Date(endDate));
  }

  // Categories
  @Get('categories/expense')
  @ApiOperation({ summary: 'Get expense categories' })
  getExpenseCategories() {
    return this.financeService.getExpenseCategories();
  }

  @Get('categories/investment')
  @ApiOperation({ summary: 'Get investment categories' })
  getInvestmentCategories() {
    return this.financeService.getInvestmentCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create category (user can create their own categories)' })
  createCategory(@CurrentUser() user: User, @Body() createDto: any) {
    return this.financeService.createCategory(createDto);
  }

  // Lending/Borrowing
  @Post('lendings')
  @ApiOperation({ summary: 'Create lending/borrowing record' })
  createLending(@CurrentUser() user: User, @Body() createDto: CreateLendingDto) {
    return this.financeService.createLending(user.id, createDto);
  }

  @Get('lendings')
  @ApiOperation({ summary: 'Get all lending/borrowing records' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  findAllLendings(
    @CurrentUser() user: User,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.findAllLendings(
      user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('lendings/:id')
  @ApiOperation({ summary: 'Get lending/borrowing record by ID' })
  findOneLending(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.findOneLending(id, user.id);
  }

  @Patch('lendings/:id')
  @ApiOperation({ summary: 'Update lending/borrowing record' })
  updateLending(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateLendingDto,
  ) {
    return this.financeService.updateLending(id, user.id, updateDto);
  }

  @Delete('lendings/:id')
  @ApiOperation({ summary: 'Delete lending/borrowing record' })
  removeLending(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.financeService.removeLending(id, user.id);
  }
}

