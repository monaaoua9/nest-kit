import { Controller, Get, Query } from '@nestjs/common';
import { AppError } from '@monaaoua9/app-error';
import { decodeCursor, toPage } from '@monaaoua9/cursor-page';

const posts = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, title: `post ${i + 1}` }));

@Controller('api/v1/posts')
export class PostsController {
  @Get()
  list(@Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    const take = Math.min(Number(limit) || 10, 50);

    let after = 0;
    if (cursor) {
      try {
        after = decodeCursor<{ id: number }>(cursor).id;
      } catch {
        throw new AppError('INVALID_CURSOR');
      }
    }

    // same shape as a db query with take: limit + 1
    const rows = posts.filter(p => p.id > after).slice(0, take + 1);
    return toPage(rows, take, p => ({ id: p.id }));
  }
}
