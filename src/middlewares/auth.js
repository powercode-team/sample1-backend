import ResponseService from '../services/ResponseService';
import BaseService from '../services/BaseService';

export default async (ctx, next) => {
  const token = ctx.request.headers[BaseService.HEADER];
  if (!token) {
    ResponseService.error(ctx, 'Forbidden', 403);
    return;
  }

  try {
    let response = await BaseService.axios.get('auth/profile', {
      headers: {
        'application-id': BaseService.APPLICATION,
        [BaseService.HEADER]: token,
      },
    });
    ctx.state.account = response.data.data.account;
    ctx.set(BaseService.HEADER, response.headers[BaseService.HEADER]);
    return next();
  } catch (e) {
    if (e.response) {
      return ResponseService.error(ctx, e.response.data.message || e.response.data, e.response.status);
    }

    ResponseService.error(ctx, 'Authorization required', 401);
  }
};
