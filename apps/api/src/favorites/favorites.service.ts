import { Injectable } from '@nestjs/common';
import { Prisma } from '@app/database';
import {
  AppError,
  ErrorCode,
  formatUsername,
  normalizeUsername,
  type CreateFavoriteInput,
  type FavoriteView,
} from '@app/shared';
import { PrismaService } from '../database/prisma.service';
import { SendersService } from '../senders/senders.service';

@Injectable()
export class FavoritesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly senders: SendersService,
  ) {}

  async list(userId: string): Promise<FavoriteView[]> {
    const sender = await this.prisma.senderProfile.findUnique({ where: { userId } });
    if (!sender) return [];

    const favorites = await this.prisma.favoriteBeneficiary.findMany({
      where: { senderId: sender.id },
      orderBy: { createdAt: 'desc' },
      include: { student: true },
    });
    return favorites.map((f) => this.toView(f));
  }

  async create(
    userId: string,
    userEmail: string,
    input: CreateFavoriteInput,
  ): Promise<FavoriteView> {
    const normalized = normalizeUsername(input.studentUsername);
    const student = await this.prisma.studentProfile.findUnique({
      where: { usernameNormalized: normalized },
    });
    if (!student) {
      throw new AppError(
        ErrorCode.USERNAME_NOT_FOUND,
        `Nao encontramos nenhum estudante com o username ${formatUsername(normalized)}.`,
      );
    }

    const sender = await this.senders.ensureProfile(userId, userEmail);

    let favorite;
    try {
      favorite = await this.prisma.favoriteBeneficiary.create({
        data: { senderId: sender.id, studentId: student.id, alias: input.alias ?? null },
        include: { student: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new AppError(ErrorCode.CONFLICT, 'Esse estudante ja esta nos teus favoritos.');
      }
      throw error;
    }

    return this.toView(favorite);
  }

  async remove(userId: string, favoriteId: string): Promise<void> {
    const favorite = await this.prisma.favoriteBeneficiary.findUnique({
      where: { id: favoriteId },
      include: { sender: { select: { userId: true } } },
    });
    if (!favorite || favorite.sender.userId !== userId) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Favorito nao encontrado.');
    }
    await this.prisma.favoriteBeneficiary.delete({ where: { id: favoriteId } });
  }

  private toView(f: {
    id: string;
    alias: string | null;
    createdAt: Date;
    student: {
      username: string;
      displayName: string;
      city: string;
      country: string;
      kycStatus: string;
    };
  }): FavoriteView {
    return {
      id: f.id,
      alias: f.alias,
      createdAt: f.createdAt.toISOString(),
      student: {
        username: formatUsername(f.student.username),
        displayName: f.student.displayName,
        city: f.student.city,
        country: f.student.country,
        verified: f.student.kycStatus === 'VERIFIED',
      },
    };
  }
}
