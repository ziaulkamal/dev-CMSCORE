/**
 * src/common/validation/validation-exception.factory.ts
 * Ubah error class-validator → ValidationError domain (code VALIDATION_ERROR, 422)
 * dengan `details` per-field ({ field: "pesan; pesan" }) agar UI bisa menandai
 * field yang gagal, bukan sekadar pesan generik.
 */
import { ValidationError as ClassValidationError } from 'class-validator';
import { ValidationError } from '../errors/domain.error';

/** Ratakan error bersarang (mis. nested object/array) → map field → daftar pesan. */
function collect(
  errors: ClassValidationError[],
  parentPath = '',
  acc: Record<string, string[]> = {},
): Record<string, string[]> {
  for (const err of errors) {
    const path = parentPath ? `${parentPath}.${err.property}` : err.property;
    if (err.constraints) {
      const messages = Object.values(err.constraints);
      acc[path] = (acc[path] ?? []).concat(messages);
    }
    if (err.children?.length) {
      collect(err.children, path, acc);
    }
  }
  return acc;
}

/**
 * Factory untuk ValidationPipe.exceptionFactory: kumpulkan pesan per-field lalu
 * lempar ValidationError. `details` = { field: "pesan gabungan" } (UI map ke fieldErrors).
 */
export function validationExceptionFactory(errors: ClassValidationError[]): ValidationError {
  const perField = collect(errors);
  const details: Record<string, string> = {};
  for (const [field, messages] of Object.entries(perField)) {
    details[field] = messages.join('; ');
  }

  const fields = Object.keys(details);
  const message =
    fields.length > 0
      ? `Validasi gagal pada: ${fields.join(', ')}`
      : 'Data tidak valid';

  return new ValidationError(message, details);
}
