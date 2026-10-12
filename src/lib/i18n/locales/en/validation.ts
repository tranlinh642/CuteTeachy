import type { errors as ErrorsSchema, validation as ValidationSchema } from '../vi/validation';

export const validation: typeof ValidationSchema = {
  required: '{{field}} is required',
  email: 'Please enter a valid email',
  minLength: '{{field}} must be at least {{count}} characters',
  maxLength: '{{field}} must be at most {{count}} characters',
  invalidDate: 'Invalid date',
  invalidTime: 'Invalid time',
};

export const errors: typeof ErrorsSchema = {
  generic: 'Something went wrong, please try again',
  network: "Can't reach the server. Please check your connection",
  unauthorized: 'Please sign in to continue',
  notFound: 'Not found',
  validation: 'Some fields are invalid',
  pageNotFound: "We couldn't find that page",
};
