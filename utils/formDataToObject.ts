export function formDataToObject(formData: FormData): Record<string, unknown> {
    const object: Record<string, unknown> = {};
    formData.forEach((value, key) => {
      // Handle case where key already exists (i.e., for array-like data)
      if (object.hasOwnProperty(key)) {
        if (!Array.isArray(object[key])) {
          object[key] = [object[key]];
        }
        (object[key] as unknown[]).push(value);
      } else {
        object[key] = value;
      }
    });
    return object;
  }