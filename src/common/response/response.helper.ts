export function createResponse<T>(statusCode: number, message: string, data?: T) {
    return { statusCode, message, data };
  }
  