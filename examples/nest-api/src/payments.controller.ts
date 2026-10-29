import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AppError } from '@monaaoua9/app-error';
import { IdempotencyMismatchError, createIdempotent } from '@monaaoua9/idempotency';

const once = createIdempotent();
let charges = 0;

@Controller('api/v1/payments')
export class PaymentsController {
  @Post()
  async pay(@Headers('idempotency-key') key: string, @Body() body: { amount?: number }) {
    if (!key) throw new AppError('MISSING_IDEMPOTENCY_KEY');
    if (!body?.amount || body.amount <= 0) throw new AppError('INVALID_AMOUNT');

    try {
      const data = await once(key, async () => ({ chargeId: ++charges, amount: body.amount }), {
        fingerprint: String(body.amount),
      });
      return { data };
    } catch (e) {
      if (e instanceof IdempotencyMismatchError) throw new AppError('IDEMPOTENCY_KEY_REUSED', 422);
      throw e;
    }
  }
}
