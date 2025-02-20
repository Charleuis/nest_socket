import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = (request as any).user;

    const userWithIp = { ...user, ip: request.ip };
    return data ? userWithIp?.[data] : userWithIp;
  },
);
