import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createFavoriteSchema,
  UserRole,
  type CreateFavoriteInput,
  type FavoriteView,
} from '@app/shared';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '../auth/auth.types';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { FavoritesService } from './favorites.service';

@ApiTags('favorites')
@Controller({ path: 'favorites', version: '1' })
@Roles(UserRole.SENDER)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Os meus beneficiarios favoritos' })
  list(@CurrentUser('id') userId: string): Promise<FavoriteView[]> {
    return this.favorites.list(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Adicionar um estudante aos favoritos' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(createFavoriteSchema)) dto: CreateFavoriteInput,
  ): Promise<FavoriteView> {
    return this.favorites.create(user.id, user.email, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remover um favorito' })
  remove(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<void> {
    return this.favorites.remove(userId, id);
  }
}
