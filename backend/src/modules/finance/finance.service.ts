import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Expense } from '../../entities/expense.entity';
import { Income } from '../../entities/income.entity';
import { Investment } from '../../entities/investment.entity';
import { Category, CategoryType } from '../../entities/category.entity';
import { Lending, LendingStatus } from '../../entities/lending.entity';
import { User } from '../../entities/user.entity';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateIncomeDto } from './dto/create-income.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { CreateLendingDto } from './dto/create-lending.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { UpdateLendingDto } from './dto/update-lending.dto';

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(Expense)
    private expenseRepository: Repository<Expense>,
    @InjectRepository(Income)
    private incomeRepository: Repository<Income>,
    @InjectRepository(Investment)
    private investmentRepository: Repository<Investment>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Lending)
    private lendingRepository: Repository<Lending>,
  ) {}

  // Expenses
  async createExpense(userId: string, createDto: CreateExpenseDto): Promise<Expense> {
    const expense = this.expenseRepository.create({
      ...createDto,
      userId,
    });
    return this.expenseRepository.save(expense);
  }

  async findAllExpenses(userId: string, startDate?: Date, endDate?: Date): Promise<Expense[]> {
    const where: any = { userId, isDeleted: false };
    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }
    return this.expenseRepository.find({
      where,
      relations: ['category'],
      order: { date: 'DESC' },
    });
  }

  async findOneExpense(id: string, userId: string): Promise<Expense> {
    const expense = await this.expenseRepository.findOne({
      where: { id, userId, isDeleted: false },
      relations: ['category'],
    });
    if (!expense) {
      throw new NotFoundException('Expense not found');
    }
    return expense;
  }

  async updateExpense(id: string, userId: string, updateDto: UpdateExpenseDto): Promise<Expense> {
    await this.findOneExpense(id, userId);
    await this.expenseRepository.update(id, updateDto);
    return this.findOneExpense(id, userId);
  }

  async removeExpense(id: string, userId: string): Promise<void> {
    await this.findOneExpense(id, userId);
    await this.expenseRepository.update(id, { isDeleted: true });
  }

  // Income
  async createIncome(userId: string, createDto: CreateIncomeDto): Promise<Income> {
    const income = this.incomeRepository.create({
      ...createDto,
      userId,
    });
    return this.incomeRepository.save(income);
  }

  async findAllIncomes(userId: string, startDate?: Date, endDate?: Date): Promise<Income[]> {
    const where: any = { userId, isDeleted: false };
    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }
    return this.incomeRepository.find({
      where,
      order: { date: 'DESC' },
    });
  }

  async findOneIncome(id: string, userId: string): Promise<Income> {
    const income = await this.incomeRepository.findOne({
      where: { id, userId, isDeleted: false },
    });
    if (!income) {
      throw new NotFoundException('Income not found');
    }
    return income;
  }

  async updateIncome(id: string, userId: string, updateDto: UpdateIncomeDto): Promise<Income> {
    await this.findOneIncome(id, userId);
    await this.incomeRepository.update(id, updateDto);
    return this.findOneIncome(id, userId);
  }

  async removeIncome(id: string, userId: string): Promise<void> {
    await this.findOneIncome(id, userId);
    await this.incomeRepository.update(id, { isDeleted: true });
  }

  // Investments
  async createInvestment(userId: string, createDto: CreateInvestmentDto): Promise<Investment> {
    const investment = this.investmentRepository.create({
      ...createDto,
      userId,
    });
    return this.investmentRepository.save(investment);
  }

  async findAllInvestments(userId: string, startDate?: Date, endDate?: Date): Promise<Investment[]> {
    const where: any = { userId, isDeleted: false };
    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }
    return this.investmentRepository.find({
      where,
      relations: ['category'],
      order: { date: 'DESC' },
    });
  }

  async findOneInvestment(id: string, userId: string): Promise<Investment> {
    const investment = await this.investmentRepository.findOne({
      where: { id, userId, isDeleted: false },
      relations: ['category'],
    });
    if (!investment) {
      throw new NotFoundException('Investment not found');
    }
    return investment;
  }

  async updateInvestment(id: string, userId: string, updateDto: UpdateInvestmentDto): Promise<Investment> {
    await this.findOneInvestment(id, userId);
    await this.investmentRepository.update(id, updateDto);
    return this.findOneInvestment(id, userId);
  }

  async removeInvestment(id: string, userId: string): Promise<void> {
    await this.findOneInvestment(id, userId);
    await this.investmentRepository.update(id, { isDeleted: true });
  }

  // Analytics
  async getFinancialAnalytics(userId: string, startDate: Date, endDate: Date) {
    const [expenses, incomes, investments, lendings] = await Promise.all([
      this.expenseRepository
        .createQueryBuilder('expense')
        .select('SUM(expense.amount)', 'total')
        .where('expense.userId = :userId', { userId })
        .andWhere('expense.date BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere('expense.isDeleted = false')
        .getRawOne(),
      this.incomeRepository
        .createQueryBuilder('income')
        .select('SUM(income.amount)', 'total')
        .where('income.userId = :userId', { userId })
        .andWhere('income.date BETWEEN :startDate AND :endDate', { startDate, endDate })
        .andWhere('income.isDeleted = false')
        .getRawOne(),
      this.investmentRepository
        .createQueryBuilder('investment')
        .select('SUM(investment.amount)', 'total')
        .addSelect('SUM(investment.currentValue)', 'currentValue')
        .where('investment.userId = :userId', { userId })
        .andWhere('investment.date <= :endDate', { endDate })
        .andWhere('investment.isDeleted = false')
        .getRawOne(),
      this.lendingRepository
        .createQueryBuilder('lending')
        .where('lending.userId = :userId', { userId })
        .andWhere('lending.isDeleted = false')
        .getMany(),
    ]);

    const totalExpenses = parseFloat(expenses?.total || '0');
    const totalIncome = parseFloat(incomes?.total || '0');
    const totalInvested = parseFloat(investments?.total || '0');
    const currentInvestmentValue = parseFloat(investments?.currentValue || '0');

    const totalLent = lendings
      .filter((l) => l.type === 'lend')
      .reduce((sum, l) => sum + parseFloat(l.amount.toString()) - parseFloat((l.paidAmount || 0).toString()), 0);

    const totalBorrowed = lendings
      .filter((l) => l.type === 'borrow')
      .reduce((sum, l) => sum + parseFloat(l.amount.toString()) - parseFloat((l.paidAmount || 0).toString()), 0);

    return {
      totalExpenses,
      totalIncome,
      totalInvested,
      currentInvestmentValue,
      savings: totalIncome - totalExpenses,
      investmentROI: totalInvested > 0 ? ((currentInvestmentValue - totalInvested) / totalInvested) * 100 : 0,
      debtRatio: totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0,
      totalLent,
      totalBorrowed,
      moneyToReceive: totalLent,
      moneyToPay: totalBorrowed,
    };
  }

  // Categories
  async getExpenseCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { type: CategoryType.EXPENSE, isActive: true },
    });
  }

  async getInvestmentCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { type: CategoryType.INVESTMENT, isActive: true },
    });
  }

  async createCategory(createDto: { type: CategoryType; name: string }): Promise<Category> {
    const category = this.categoryRepository.create(createDto);
    return this.categoryRepository.save(category);
  }

  // Lending/Borrowing
  async createLending(userId: string, createDto: CreateLendingDto): Promise<Lending> {
    const lending = this.lendingRepository.create({
      ...createDto,
      userId,
      paidAmount: 0,
    });
    return this.lendingRepository.save(lending);
  }

  async findAllLendings(userId: string, startDate?: Date, endDate?: Date): Promise<Lending[]> {
    const where: any = { userId, isDeleted: false };
    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    }
    return this.lendingRepository.find({
      where,
      order: { date: 'DESC' },
    });
  }

  async findOneLending(id: string, userId: string): Promise<Lending> {
    const lending = await this.lendingRepository.findOne({
      where: { id, userId, isDeleted: false },
    });
    if (!lending) {
      throw new NotFoundException('Lending record not found');
    }
    return lending;
  }

  async updateLending(id: string, userId: string, updateDto: UpdateLendingDto): Promise<Lending> {
    const lending = await this.findOneLending(id, userId);
    
    // If status is being set to 'paid', automatically set paidAmount to full amount
    if (updateDto.status === LendingStatus.PAID && updateDto.paidAmount === undefined) {
      updateDto.paidAmount = lending.amount;
    }
    
    // If status is being set to 'pending', reset paidAmount to 0
    if (updateDto.status === LendingStatus.PENDING && updateDto.paidAmount === undefined) {
      updateDto.paidAmount = 0;
    }
    
    // If status is being set to 'partially_paid' and no paidAmount provided, keep current paidAmount
    // (user should provide paidAmount for partially_paid status)
    
    Object.assign(lending, updateDto);
    return this.lendingRepository.save(lending);
  }

  async removeLending(id: string, userId: string): Promise<void> {
    const lending = await this.findOneLending(id, userId);
    lending.isDeleted = true;
    await this.lendingRepository.save(lending);
  }
}

