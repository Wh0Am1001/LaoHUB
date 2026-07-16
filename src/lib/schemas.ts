import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be under 20 characters')
      .regex(/^[a-z0-9_]+$/, 'Lowercase letters, numbers, and underscores only'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const editProfileSchema = z.object({
  display_name: z.string().min(2, 'Display name must be at least 2 characters').max(50),
  bio: z.string().max(300, 'Bio must be under 300 characters').optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  height: z.string().optional(),
  weight: z.string().optional(),
  province: z.string().optional().or(z.literal('')),
  district: z.string().max(100).optional().or(z.literal('')),
  occupation: z.string().max(100).optional().or(z.literal('')),
  relationship_status: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
});
export type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export const changePasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
