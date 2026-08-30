import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

// كلمة السر: 8 أحرف على الأقل، حرف كبير، حرف صغير، رقم
export const passwordSchema = z
  .string()
  .min(8, 'كلمة السر لازم تكون 8 أحرف على الأقل')
  .regex(/[A-Z]/, 'لازم تحتوي على حرف كبير')
  .regex(/[a-z]/, 'لازم تحتوي على حرف صغير')
  .regex(/[0-9]/, 'لازم تحتوي على رقم');

export const usernameSchema = z
  .string()
  .min(3, 'اسم المستخدم لازم يكون 3 أحرف على الأقل')
  .max(30, 'اسم المستخدم طويل أوي')
  .regex(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يسمح فيه بس بحروف إنجليزي وأرقام و _');

export const registerSchema = z.object({
  fullName: z.string().min(2).max(80),
  username: usernameSchema,
  email: z.string().email(),
  password: passwordSchema,
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// تنظيف أي مدخل نصي من الـ user قبل تخزينه أو عرضه (XSS protection)
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
