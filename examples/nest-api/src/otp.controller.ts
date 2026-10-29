import { Body, Controller, Post } from '@nestjs/common';
import { AppError } from '@monaaoua9/app-error';
import { generateOtp, hashOtp, verifyOtp } from '@monaaoua9/otp';
import { createSlidingLimiter } from '@monaaoua9/rate-limit';
import { toLatinDigits } from '@monaaoua9/arabic-text';
import { cfg } from './config';

// 3 codes per phone per minute
const limiter = createSlidingLimiter({ limit: 3, windowMs: 60_000 });
const pending = new Map<string, { hash: string; exp: number }>();

@Controller('api/v1/otp')
export class OtpController {
  @Post('request')
  async request(@Body() body: { phone?: string }) {
    if (!body?.phone) throw new AppError('INVALID_PHONE');
    const phone = toLatinDigits(body.phone);

    const { allowed } = await limiter(phone);
    if (!allowed) throw new AppError('TOO_MANY_REQUESTS', 429);

    const code = generateOtp();
    pending.set(phone, { hash: hashOtp(code, cfg.otpSecret), exp: Date.now() + 5 * 60_000 });

    // a real app sends this over sms, we only echo it outside production
    return { data: { sent: true, ...(cfg.dev && { devCode: code }) } };
  }

  @Post('verify')
  verify(@Body() body: { phone?: string; code?: string }) {
    if (!body?.phone || !body?.code) throw new AppError('INVALID_BODY');
    const phone = toLatinDigits(body.phone);

    const p = pending.get(phone);
    if (!p || p.exp < Date.now()) throw new AppError('OTP_EXPIRED');
    if (!verifyOtp(toLatinDigits(body.code), p.hash, cfg.otpSecret)) throw new AppError('INVALID_OTP');

    pending.delete(phone);
    return { data: { verified: true } };
  }
}
