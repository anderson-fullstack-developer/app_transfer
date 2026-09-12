import { z } from 'zod';
import { type PublicStudentView } from './student.js';

export const createFavoriteSchema = z.object({
  studentUsername: z.string().min(1),
  alias: z.string().trim().max(60).optional(),
});
export type CreateFavoriteInput = z.infer<typeof createFavoriteSchema>;

export interface FavoriteView {
  id: string;
  alias: string | null;
  student: PublicStudentView;
  createdAt: string;
}
