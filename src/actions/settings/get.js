import ResponseService from './../../services/ResponseService';
import SettingService from '../../services/SettingService';

export default async ctx => {
  const account = ctx.state.account;

  let settings = await SettingService.get(account);
  delete settings.id;
  delete settings.employee_id;

  ResponseService.success(ctx, {
    settings,
  });
};
