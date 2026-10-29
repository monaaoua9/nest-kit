import { Body, Controller, Headers, Post } from '@nestjs/common';
import { AppError } from '@monaaoua9/app-error';
import { createIdempotent } from '@monaaoua9/idempotency';

const once = createIdempotent();
let charges = 0;

@Controller('api/v1/payments')
export class PaymentsController {
  @Post()
  async pay(@Headers('idempotency-key') key: string, @Body() body: { amount?: number }) {
    if (!key) throw new AppError('MISSING_IDEMPOTENCY_KEY');
    if (!body?.amount || body.amount <= 0) throw new AppError('INVALID_AMOUNT');

    const data = await once(key, async () => ({ chargeId: ++charges, amount: body.amount }));
    return { data };
  }
}
